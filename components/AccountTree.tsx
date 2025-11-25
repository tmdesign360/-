
import React, { useState, useMemo, useEffect } from 'react';
import { TreeNode, AccountType } from '../types';
import { 
  Folder, ChevronLeft, ChevronDown, 
  Trash2, Search,
  ArrowDownAZ, ArrowUpAZ, ArrowDown01, ArrowUp01,
  ChevronsDown, ChevronsUp, Layers, ClipboardList, Landmark,
  Download
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface AccountTreeProps {
  data: TreeNode[];
  onSelect: (node: TreeNode) => void;
  selectedId: string | null;
  onDelete: (id: string) => void;
}

// Helper to highlight text match
const HighlightedText: React.FC<{ text: string; highlight: string }> = ({ text, highlight }) => {
  if (!highlight.trim()) {
    return <span>{text}</span>;
  }
  const regex = new RegExp(`(${highlight})`, 'gi');
  const parts = text.split(regex);
  return (
    <span>
      {parts.map((part, i) => 
        regex.test(part) ? <span key={i} className="bg-yellow-200 text-black rounded px-0.5">{part}</span> : part
      )}
    </span>
  );
};

const TreeNodeItem: React.FC<{ 
  node: TreeNode; 
  onSelect: (n: TreeNode) => void; 
  selectedId: string | null; 
  depth: number;
  onDelete: (id: string) => void;
  searchTerm: string;
  expandSignal: { type: 'expand' | 'collapse'; ts: number } | null;
}> = ({ node, onSelect, selectedId, depth, onDelete, searchTerm, expandSignal }) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedId === node.id;

  // Handle Global Expand/Collapse Signals
  useEffect(() => {
    if (expandSignal) {
      setIsOpen(expandSignal.type === 'expand');
    }
  }, [expandSignal]);

  // Handle Search Auto-Expand
  useEffect(() => {
    if (searchTerm.trim().length > 0 && hasChildren) {
      setIsOpen(true);
    }
  }, [searchTerm, hasChildren]);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(node);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(node.id);
  };

  // Distinct Icons Logic
  const getIcon = () => {
    if (node.level === 1) return <Landmark className="w-4 h-4 text-indigo-600" />;
    if (node.type === AccountType.MAIN) return <Folder className="w-4 h-4 text-amber-500" />;
    if (node.type === AccountType.SUB) return <Layers className="w-4 h-4 text-cyan-500" />;
    return <ClipboardList className="w-4 h-4 text-emerald-500" />;
  };

  return (
    <div className="select-none">
      <div 
        className={`
          group flex items-center py-1.5 px-2 cursor-pointer transition-colors relative border-b border-dashed border-gray-100 last:border-0
          ${isSelected ? 'bg-cyan-50 text-cyan-900 border-r-4 border-cyan-500' : 'hover:bg-gray-50 text-gray-700'}
        `}
        style={{ paddingRight: `${depth * 20 + 8}px` }} // RTL indent
        onClick={handleSelect}
      >
        {/* Toggle Icon */}
        <div className="w-6 h-6 flex items-center justify-center shrink-0 ml-1" onClick={hasChildren ? handleToggle : undefined}>
          {hasChildren && (
            isOpen ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronLeft className="w-4 h-4 text-gray-400" />
          )}
        </div>

        {/* Type Icon */}
        <div className={`ml-2`}>
           {getIcon()}
        </div>

        {/* Label */}
        <div className="flex-1 truncate flex items-center gap-2">
          <span className="font-mono text-xs opacity-70 bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 dir-ltr shadow-sm border border-gray-200">
             <HighlightedText text={node.code} highlight={searchTerm} />
          </span>
          <span className="text-sm font-medium">
             <HighlightedText text={node.name} highlight={searchTerm} />
          </span>
        </div>

        {/* Delete Action - Visible on Hover */}
        <button
          onClick={handleDeleteClick}
          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-full hover:bg-red-100 text-red-500 transition-all mx-1"
          title="حذف الحساب"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Children */}
      {hasChildren && isOpen && (
        <div className="border-r border-gray-100 mr-3">
          {node.children.map(child => (
            <TreeNodeItem 
              key={child.id} 
              node={child} 
              onSelect={onSelect} 
              selectedId={selectedId} 
              depth={depth + 1}
              onDelete={onDelete}
              searchTerm={searchTerm}
              expandSignal={expandSignal}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const AccountTree: React.FC<AccountTreeProps> = ({ data, onSelect, selectedId, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<'code' | 'name'>('code');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Use an object state to force updates even if the same action is repeated
  const [expandSignal, setExpandSignal] = useState<{ type: 'expand' | 'collapse'; ts: number } | null>(null);

  // Recursive Filter & Sort
  const processedData = useMemo(() => {
    const filterAndSort = (nodes: TreeNode[]): TreeNode[] => {
      let filtered = nodes;

      // 1. Filter
      if (searchTerm) {
        filtered = nodes.reduce<TreeNode[]>((acc, node) => {
           const matches = 
             node.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
             node.code.includes(searchTerm);
           
           const filteredChildren = filterAndSort(node.children);
           
           if (matches || filteredChildren.length > 0) {
             acc.push({ ...node, children: filteredChildren });
           }
           return acc;
        }, []);
      } else {
        // Just process children for sorting if no search
        filtered = nodes.map(node => ({
            ...node,
            children: filterAndSort(node.children)
        }));
      }

      // 2. Sort
      return filtered.sort((a, b) => {
        let valA = sortKey === 'code' ? a.code : a.name;
        let valB = sortKey === 'code' ? b.code : b.name;
        
        // Numeric sort for codes
        if (sortKey === 'code') {
             return sortDirection === 'asc' 
               ? a.code.localeCompare(b.code, undefined, { numeric: true }) 
               : b.code.localeCompare(a.code, undefined, { numeric: true });
        }

        // String sort for names
        return sortDirection === 'asc' 
             ? valA.localeCompare(valB, 'ar') 
             : valB.localeCompare(valA, 'ar');
      });
    };

    return filterAndSort(data);
  }, [data, searchTerm, sortKey, sortDirection]);

  const handleExportTree = () => {
    if (!processedData || processedData.length === 0) {
      alert('لا توجد بيانات لتصديرها');
      return;
    }

    const rows: any[] = [];
    
    // Recursive traversal to flatten tree for Excel with indentation
    const traverse = (nodes: TreeNode[], depth: number) => {
        nodes.forEach(node => {
            const indent = "    ".repeat(depth);
            rows.push({
                "رقم الحساب": node.code,
                "اسم الحساب": indent + node.name,
                "التفاصيل": node.details || '',
                "النوع": node.type,
                "المستوى": node.level,
                "الحساب الرئيسي": node.parentCode || '-'
            });
            if (node.children && node.children.length > 0) {
                traverse(node.children, depth + 1);
            }
        });
    };

    traverse(processedData, 0);

    const wb = XLSX.utils.book_new();
    wb.Props = {
        Title: "شجرة الحسابات المعروضة",
        Author: "University ERP",
        CreatedDate: new Date()
    };
    const ws = XLSX.utils.json_to_sheet(rows);

    // Right-to-Left direction
    if(!ws['!views']) ws['!views'] = [];
    ws['!views'].push({ rightToLeft: true });

    // Column Widths
    ws['!cols'] = [
        { wch: 20 }, // Code
        { wch: 50 }, // Name (wider for indentation)
        { wch: 20 }, // Details
        { wch: 12 }, // Type
        { wch: 8 },  // Level
        { wch: 15 }  // Parent
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Tree_View");
    XLSX.writeFile(wb, "Current_Tree_View.xlsx");
  };

  if (!data || data.length === 0) {
    return <div className="p-4 text-center text-gray-400 text-sm">لا توجد حسابات لعرضها</div>;
  }

  const toggleSort = (key: 'code' | 'name') => {
    if (sortKey === key) {
        setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
        setSortKey(key);
        setSortDirection('asc');
    }
  };

  const handleExpandAll = () => setExpandSignal({ type: 'expand', ts: Date.now() });
  const handleCollapseAll = () => setExpandSignal({ type: 'collapse', ts: Date.now() });

  return (
    <div className="flex flex-col h-full dir-rtl bg-white">
      {/* Toolbar */}
      <div className="p-2 border-b border-gray-100 bg-gray-50 flex flex-col gap-2">
        {/* Search */}
        <div className="relative">
             <Search className="absolute right-2 top-2 w-4 h-4 text-gray-400" />
             <input 
                type="text" 
                placeholder="بحث برقم أو اسم الحساب..." 
                className="w-full pl-2 pr-8 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
             />
        </div>
        
        {/* Controls */}
        <div className="flex justify-between items-center text-xs">
            <div className="flex gap-1">
                <button 
                  onClick={() => toggleSort('code')}
                  className={`p-1 rounded flex items-center gap-1 transition-colors ${sortKey === 'code' ? 'bg-cyan-100 text-cyan-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  title="ترتيب حسب الكود"
                >
                    {sortKey === 'code' && sortDirection === 'desc' ? <ArrowUp01 className="w-3.5 h-3.5" /> : <ArrowDown01 className="w-3.5 h-3.5" />}
                    <span>الكود</span>
                </button>
                <button 
                  onClick={() => toggleSort('name')}
                  className={`p-1 rounded flex items-center gap-1 transition-colors ${sortKey === 'name' ? 'bg-cyan-100 text-cyan-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  title="ترتيب حسب الاسم"
                >
                    {sortKey === 'name' && sortDirection === 'desc' ? <ArrowUpAZ className="w-3.5 h-3.5" /> : <ArrowDownAZ className="w-3.5 h-3.5" />}
                    <span>الاسم</span>
                </button>
            </div>

            <div className="flex gap-1 border-r border-gray-300 pr-2 mr-2 items-center">
                 <button 
                   onClick={handleExpandAll}
                   className="p-1 rounded bg-white border border-gray-200 text-gray-600 hover:text-cyan-600 hover:border-cyan-200 shadow-sm"
                   title="توسيع الكل"
                 >
                    <ChevronsDown className="w-3.5 h-3.5" />
                 </button>
                 <button 
                   onClick={handleCollapseAll}
                   className="p-1 rounded bg-white border border-gray-200 text-gray-600 hover:text-cyan-600 hover:border-cyan-200 shadow-sm"
                   title="طي الكل"
                 >
                    <ChevronsUp className="w-3.5 h-3.5" />
                 </button>
                 <div className="w-px h-4 bg-gray-300 mx-1"></div>
                 <button 
                   onClick={handleExportTree}
                   className="p-1 rounded bg-white border border-gray-200 text-green-600 hover:bg-green-50 hover:border-green-200 shadow-sm"
                   title="تصدير الشجرة الحالية إلى Excel"
                 >
                    <Download className="w-3.5 h-3.5" />
                 </button>
            </div>
        </div>
      </div>

      {/* Tree Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar py-2">
        {processedData.length > 0 ? (
            processedData.map(node => (
            <TreeNodeItem 
                key={node.id} 
                node={node} 
                onSelect={onSelect} 
                selectedId={selectedId} 
                depth={0} 
                onDelete={onDelete}
                searchTerm={searchTerm}
                expandSignal={expandSignal}
            />
            ))
        ) : (
            <div className="text-center py-10 text-gray-400 text-sm">
                لا توجد نتائج مطابقة
            </div>
        )}
      </div>
    </div>
  );
};

export default AccountTree;
