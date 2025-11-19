import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import HeaderForm from './components/HeaderForm';
import AccountTree from './components/AccountTree';
import AccountDetails from './components/AccountDetails';
import SystemSpecs from './components/SystemSpecs';
import ExcelPreviewModal from './components/ExcelPreviewModal';
import { parseAccounts, buildTree } from './utils';
import { Account, TreeNode } from './types';
import * as XLSX from 'xlsx';

const STORAGE_KEY = 'UNIVERSITY_ERP_DATA_V3';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<'tree' | 'add' | 'specs'>('tree');
  
  // Initialize state from LocalStorage if available, otherwise use default raw data
  const [accounts, setAccounts] = useState<Account[]>(() => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        return JSON.parse(savedData);
      }
    } catch (error) {
      console.error("Failed to load data from local storage:", error);
    }
    return parseAccounts();
  });

  const [selectedAccount, setSelectedAccount] = useState<TreeNode | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Excel Modal State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportPreviewData, setExportPreviewData] = useState<any[]>([]);

  // Persist changes to LocalStorage whenever accounts change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
  }, [accounts]);

  const refreshData = () => {
    if (window.confirm('تحذير: سيتم استعادة البيانات الافتراضية وحذف جميع التعديلات المحفوظة. هل أنت متأكد؟')) {
      const data = parseAccounts();
      setAccounts(data);
      setSelectedAccount(null);
      setIsEditing(false);
    }
  };

  // Memoized tree calculation to prevent lag
  const treeData = useMemo(() => buildTree(accounts), [accounts]);

  const handleSelectAccount = (node: TreeNode) => {
    setSelectedAccount(node);
    setIsEditing(false); // Default to viewing mode when selecting new
  };

  const handleSave = (formData: Partial<Account>) => {
    const now = new Date().toISOString();

    if (isEditing && selectedAccount) {
      // Update existing
      const updatedAccounts = accounts.map(acc => 
        acc.id === selectedAccount.id 
        ? { 
            ...acc, 
            ...formData, 
            updatedAt: now,
            // Ensure createdAt is preserved or set if missing
            createdAt: acc.createdAt || now
          } as Account 
        : acc
      );
      setAccounts(updatedAccounts);
      // Update selected account reference to reflect changes immediately in Details view
      const updatedNode = updatedAccounts.find(a => a.id === selectedAccount.id);
      if (updatedNode) setSelectedAccount({ ...updatedNode, children: selectedAccount.children });

    } else {
      // Add new
      const newAccount: Account = {
        ...formData,
        id: formData.code || Date.now().toString(), // Fallback ID
        serial: (accounts.length + 1).toString(),
        level: formData.level || 1,
        createdAt: now,
        updatedAt: now
      } as Account;
      setAccounts([...accounts, newAccount]);
    }
    // Reset form state slightly
    setIsEditing(false);
  };

  const handleDelete = (id: string) => {
     if(window.confirm('هل أنت متأكد من حذف هذا الحساب؟')) {
         const updatedAccounts = accounts.filter(a => a.id !== id);
         setAccounts(updatedAccounts);
         setSelectedAccount(null);
     }
  }

  // 1. Prepare Data and Open Modal
  const handleExportClick = () => {
    const rows: any[] = [];
    // Helper to traverse tree and build flat list with visual indentation
    const traverseForExcel = (nodes: TreeNode[], depth: number) => {
      nodes.forEach(node => {
        // Visual indentation using spaces (approx 4 spaces per level)
        const indent = "    ".repeat(depth);
        
        rows.push({
          "رقم الحساب": node.code,
          "اسم الحساب": indent + node.name, 
          "التفاصيل": node.details || '',
          "النوع": node.type,
          "نوع القائمة": node.reportType,
          "المستوى": node.level,
          "الحساب الرئيسي": node.parentCode || '-',
          "التسلسل": node.serial,
          "تاريخ الإنشاء": node.createdAt || '',
          "آخر تعديل": node.updatedAt || ''
        });

        if (node.children && node.children.length > 0) {
          traverseForExcel(node.children, depth + 1);
        }
      });
    };

    traverseForExcel(treeData, 0);
    setExportPreviewData(rows);
    setIsExportModalOpen(true);
  };

  // 2. Sync changes from Modal Table back to Main System (Auto-save version)
  const handleSystemUpdateFromModal = (flatData: any[]) => {
    const now = new Date().toISOString();
    
    // Create map for preserving existing accounts metadata
    const existingMap = new Map(accounts.map(a => [a.code, a]));

    const mappedAccounts: Account[] = flatData.map((row) => {
        const code = row['رقم الحساب'];
        const rawParent = row['الحساب الرئيسي'];

        // Safety check: Prevent setting parent to self (Cycle prevention)
        const safeParent = (rawParent === code) ? '' : rawParent;

        const existing = existingMap.get(code);

        return {
            id: code, // Use code as ID or maintain existing logic
            code: code,
            name: (row['اسم الحساب'] || '').trim(), // Remove the visual indentation
            details: row['التفاصيل'] || '',
            type: row['النوع'],
            reportType: row['نوع القائمة'],
            level: parseInt(row['المستوى'] || '0', 10),
            parentCode: safeParent,
            serial: row['التسلسل'],
            // Preserve existing creation date or use imported date or use now
            createdAt: existing?.createdAt || row['تاريخ الإنشاء'] || now,
            updatedAt: now
        };
    });
    
    // Additional Cycle Protection before saving state
    const validAccounts = mappedAccounts.filter(a => a.parentCode !== a.code);

    setAccounts(validAccounts);
  };

  // 3. Actual Download Logic (Triggered from Modal)
  const handleFinalDownload = (dataToDownload: any[]) => {
    // 1. Create Workbook
    const wb = XLSX.utils.book_new();
    wb.Props = {
      Title: "شجرة الحسابات",
      Subject: "University ERP System",
      Author: "A.R. System",
      CreatedDate: new Date()
    };

    // 2. Create Worksheet with explicit header order
    const HEADERS = ["رقم الحساب", "اسم الحساب", "التفاصيل", "النوع", "نوع القائمة", "المستوى", "الحساب الرئيسي", "التسلسل", "تاريخ الإنشاء", "آخر تعديل"];
    const ws = XLSX.utils.json_to_sheet(dataToDownload, { header: HEADERS });

    // 3. Restore Excel Grouping (Outlining) logic
    if (dataToDownload.length > 0) {
      const rowsOutline = dataToDownload.map(row => {
          const lvl = parseInt(row["المستوى"] || '1', 10);
          return { level: Math.max(0, lvl - 1), hidden: false };
      });
      ws['!rows'] = rowsOutline;
    }

    // 4. Column Widths
    ws['!cols'] = [
      { wch: 15 }, // Code
      { wch: 50 }, // Name
      { wch: 30 }, // Details
      { wch: 12 }, // Type
      { wch: 15 }, // Report
      { wch: 8 },  // Level
      { wch: 15 }, // Parent
      { wch: 8 },  // Serial
      { wch: 20 }, // Created
      { wch: 20 }, // Modified
    ];

    // 5. Set RTL
    if(!ws['!views']) ws['!views'] = [];
    ws['!views'].push({ rightToLeft: true });

    // 6. Append and Download
    XLSX.utils.book_append_sheet(wb, ws, "الدليل_المحاسبي");
    XLSX.writeFile(wb, "شجرة_الحسابات_الهرمية.xlsx");
    
    setIsExportModalOpen(false);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden font-sans bg-gray-100">
      <Sidebar activeView={activeView} setActiveView={setActiveView} />
      
      <main className="flex-1 flex flex-col min-w-0">
        
        {activeView === 'specs' ? (
          <SystemSpecs />
        ) : (
          <>
            {/* Header / Edit Area */}
            <HeaderForm 
                existingAccounts={accounts}
                selectedAccount={selectedAccount} 
                onSave={handleSave}
                onDelete={handleDelete}
                isEditing={isEditing}
                setIsEditing={setIsEditing}
                onRefresh={refreshData}
                onExport={handleExportClick} 
            />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-row p-4 gap-4 overflow-hidden relative">
                {/* Tree View Column */}
                <div className="flex-1 h-full flex flex-col min-w-0 bg-white rounded-lg shadow-sm border border-gray-200">
                    <AccountTree 
                        data={treeData} 
                        onSelect={handleSelectAccount} 
                        selectedId={selectedAccount?.id || null}
                    />
                </div>

                {/* Details Panel Column */}
                <div className="w-1/3 min-w-[320px] h-full hidden md:flex flex-col">
                    <AccountDetails account={selectedAccount} />
                </div>
            </div>
          </>
        )}
      </main>

      {/* Export Modal */}
      <ExcelPreviewModal 
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        initialData={exportPreviewData}
        onDownload={handleFinalDownload}
        onSaveToSystem={handleSystemUpdateFromModal}
      />
    </div>
  );
};

export default App;