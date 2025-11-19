import React, { useState, useEffect, useRef } from 'react';
import { X, Download, Plus, Trash2, Edit3, RefreshCw, Wand2, GitFork, Upload, FileSpreadsheet, CheckCircle } from 'lucide-react';
import { AccountType, ReportType } from '../types';
import * as XLSX from 'xlsx';

interface ExcelPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: any[]; // Array of flat objects
  onDownload: (data: any[]) => void;
  onSaveToSystem: (data: any[]) => void;
}

const ExcelPreviewModal: React.FC<ExcelPreviewModalProps> = ({ 
  isOpen, 
  onClose, 
  initialData, 
  onDownload,
  onSaveToSystem
}) => {
  const [gridData, setGridData] = useState<any[]>([]);
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    parentAccount: '',
    code: '',
    name: '',
    details: '',
    reportType: ReportType.BALANCE_SHEET,
    type: AccountType.SUB,
    level: 0,
    serial: ''
  });

  useEffect(() => {
    if (isOpen && initialData.length > 0) {
      setGridData(initialData);
      setSelectedRowIndex(null); 
    }
  }, [isOpen, initialData]);

  // Map grid row to form when selected
  useEffect(() => {
    if (selectedRowIndex !== null && gridData[selectedRowIndex]) {
      const row = gridData[selectedRowIndex];
      setFormData({
        parentAccount: row['الحساب الرئيسي'] || '',
        code: row['رقم الحساب'] || '',
        name: (row['اسم الحساب'] || '').trim(), 
        details: row['التفاصيل'] || '',
        reportType: row['نوع القائمة'] || ReportType.BALANCE_SHEET,
        type: row['النوع'] || AccountType.SUB,
        level: row['المستوى'] || 0,
        serial: row['التسلسل'] || ''
      });
    }
  }, [selectedRowIndex, gridData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Auto-generate code logic
  const generateNextCode = (parentCode: string) => {
    if (!parentCode) return;

    const siblings = gridData.filter(r => r['الحساب الرئيسي'] === parentCode);
    const parentRow = gridData.find(r => r['رقم الحساب'] === parentCode);
    
    let nextLevel = 1;
    if (parentRow) {
        nextLevel = parseInt(parentRow['المستوى'] || '0', 10) + 1;
    } else {
        // Try to guess level if parent not in grid (maybe newly typed)
        const sibling = siblings[0];
        if (sibling) nextLevel = parseInt(sibling['المستوى'] || '1', 10);
    }

    let nextSuffix = 1;
    let padLength = 2;

    if (siblings.length > 0) {
        let maxVal = 0;
        let maxSuffixLen = 0;
        siblings.forEach(s => {
             const c = s['رقم الحساب'] as string;
             if (c && c.startsWith(parentCode)) {
                 const suffix = c.slice(parentCode.length);
                 const val = parseInt(suffix, 10);
                 if(!isNaN(val) && val > maxVal) {
                     maxVal = val;
                     maxSuffixLen = suffix.length;
                 }
             }
        });
        nextSuffix = maxVal + 1;
        padLength = maxSuffixLen || 2;
    } else {
         if (parentCode.length === 1) padLength = 1;
         else padLength = 2;
    }

    const suffixStr = nextSuffix.toString().padStart(padLength, '0');
    const nextCode = `${parentCode}${suffixStr}`;
    
    setFormData(prev => ({
        ...prev,
        code: nextCode,
        level: nextLevel,
        parentAccount: parentCode // Ensure parent is set
    }));
  };

  const handleParentBlur = () => {
      if (formData.parentAccount && (!selectedRowIndex && selectedRowIndex !== 0)) {
         if(!formData.code) {
             generateNextCode(formData.parentAccount);
         }
      }
  };

  const handleManualGenerate = (e: React.MouseEvent) => {
      e.preventDefault();
      generateNextCode(formData.parentAccount);
  };

  const handleAddChildFromSelection = () => {
      if (selectedRowIndex === null) return;
      const parentRow = gridData[selectedRowIndex];
      const parentCode = parentRow['رقم الحساب'];
      
      // Reset form for new entry
      setFormData({
          parentAccount: parentCode,
          code: '', // Will be generated
          name: '',
          details: '',
          reportType: parentRow['نوع القائمة'], // Inherit
          type: AccountType.SUB,
          level: 0, // Will be generated
          serial: (gridData.length + 1).toString()
      });
      
      // Deselect to enter "Add Mode"
      setSelectedRowIndex(null);
      
      // Trigger generation
      setTimeout(() => generateNextCode(parentCode), 0);
  };

  const handleUpdate = () => {
    if (selectedRowIndex === null) return;
    
    const newData = [...gridData];
    const originalName = newData[selectedRowIndex]['اسم الحساب'];
    
    // Try to preserve indentation from the original string if it exists
    const indentMatch = typeof originalName === 'string' ? originalName.match(/^(\s+)/) : null;
    const indent = indentMatch ? indentMatch[1] : '';

    newData[selectedRowIndex] = {
      ...newData[selectedRowIndex],
      'الحساب الرئيسي': formData.parentAccount,
      'رقم الحساب': formData.code,
      'اسم الحساب': indent + formData.name, // Re-attach indent to keep tree look
      'التفاصيل': formData.details,
      'نوع القائمة': formData.reportType,
      'النوع': formData.type,
      'المستوى': formData.level, 
      'التسلسل': formData.serial
    };
    setGridData(newData);
    onSaveToSystem(newData); // Trigger auto-save
  };

  const handleAdd = () => {
    const newRow = {
      'الحساب الرئيسي': formData.parentAccount,
      'رقم الحساب': formData.code,
      'اسم الحساب': formData.name,
      'التفاصيل': formData.details,
      'نوع القائمة': formData.reportType,
      'النوع': formData.type,
      'المستوى': formData.level || 1, 
      'التسلسل': formData.serial || (gridData.length + 1).toString()
    };
    const newData = [...gridData, newRow];
    setGridData(newData);
    setSelectedRowIndex(gridData.length); // Select new row
    onSaveToSystem(newData); // Trigger auto-save
  };

  const handleDelete = () => {
    if (selectedRowIndex === null) return;
    if (window.confirm('هل أنت متأكد من حذف هذا السطر؟')) {
        const newData = gridData.filter((_, i) => i !== selectedRowIndex);
        setGridData(newData);
        setSelectedRowIndex(null);
        setFormData(prev => ({ ...prev, code: '', name: '', details: '' })); 
        onSaveToSystem(newData); // Trigger auto-save
    }
  };

  const handleResetForm = () => {
      setSelectedRowIndex(null);
      setFormData({
        parentAccount: '',
        code: '',
        name: '',
        details: '',
        reportType: ReportType.BALANCE_SHEET,
        type: AccountType.SUB,
        level: 0,
        serial: (gridData.length + 1).toString()
      });
  };

  // --- File Upload & Drag-n-Drop Logic ---

  const processFile = async (file: File) => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        if (jsonData.length === 0) {
            alert("الملف فارغ!");
            return;
        }

        // Map standard keys or fallback
        const mappedData = jsonData.map((row: any) => ({
            'رقم الحساب': row['رقم الحساب'] || row['Account Code'] || row['code'] || '',
            'اسم الحساب': row['اسم الحساب'] || row['Account Name'] || row['name'] || '',
            'التفاصيل': row['التفاصيل'] || row['Details'] || row['details'] || '',
            'النوع': row['النوع'] || row['Type'] || row['type'] || 'فرعي',
            'نوع القائمة': row['نوع القائمة'] || row['Report Type'] || row['reportType'] || 'الميزانية',
            'المستوى': row['المستوى'] || row['Level'] || row['level'] || 0,
            'الحساب الرئيسي': row['الحساب الرئيسي'] || row['Parent Account'] || row['parentCode'] || '',
            'التسلسل': row['التسلسل'] || row['Serial'] || row['serial'] || '',
            // Import dates if available
            'تاريخ الإنشاء': row['تاريخ الإنشاء'] || row['Created Date'] || '',
            'آخر تعديل': row['آخر تعديل'] || row['Last Modified'] || ''
        }));

        // Check if valid
        if (!mappedData[0]['رقم الحساب']) {
            alert("لم يتم العثور على عمود 'رقم الحساب' بشكل صحيح. تأكد من ترويسة الملف.");
            return;
        }

        setGridData(mappedData);
        onSaveToSystem(mappedData); // Trigger auto-save
        alert(`تم استيراد ${mappedData.length} حساب بنجاح وتم حفظها في النظام.`);
    } catch (error) {
        console.error("Error processing file:", error);
        alert("حدث خطأ أثناء معالجة الملف. تأكد من أنه ملف Excel صالح.");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          processFile(e.target.files[0]);
      }
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          processFile(e.dataTransfer.files[0]);
      }
  };

  const triggerFileInput = () => {
      fileInputRef.current?.click();
  };


  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-right font-sans" 
        dir="rtl"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept=".xlsx,.xls,.csv" 
        onChange={handleFileSelect} 
      />

      <div className={`bg-white w-full max-w-7xl h-[95vh] rounded-xl shadow-2xl flex flex-col overflow-hidden border transition-colors relative ${isDragOver ? 'border-cyan-500 ring-4 ring-cyan-500/30' : 'border-slate-200'}`}>
        
        {/* Drag Overlay */}
        {isDragOver && (
            <div className="absolute inset-0 z-50 bg-cyan-600/90 flex flex-col items-center justify-center text-white pointer-events-none">
                <Upload className="w-24 h-24 mb-4 animate-bounce" />
                <h3 className="text-3xl font-bold">أفلت ملف الإكسل هنا</h3>
                <p className="text-cyan-100 mt-2">سيتم استبدال البيانات الحالية ببيانات الملف</p>
            </div>
        )}

        {/* 1. Top Panel (Form) */}
        <div className="bg-cyan-600 p-5 text-white shrink-0 shadow-md z-10">
             <div className="flex justify-between items-center mb-4 border-b border-cyan-500 pb-2">
                 <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <FileSpreadsheet className="w-6 h-6" />
                        ادخال الحسابات الرئيسية والفرعية
                    </h2>
                    <p className="text-xs text-cyan-100 opacity-80">لوحة التحكم في بيانات ملف التصدير</p>
                 </div>
                 <button onClick={onClose} className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors">
                    <X className="w-5 h-5"/>
                 </button>
             </div>

             {/* Input Form */}
             <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-cyan-700/30 p-4 rounded-lg border border-cyan-500/30">
                 <div className="md:col-span-2">
                     <label className="block text-xs font-bold mb-1 text-cyan-100">الحساب الأب</label>
                     <input 
                        name="parentAccount" 
                        value={formData.parentAccount} 
                        onChange={handleInputChange} 
                        onBlur={handleParentBlur}
                        className="w-full p-2 rounded text-gray-800 text-sm border-none focus:ring-2 focus:ring-amber-400" 
                        placeholder="مثال: 1101"
                     />
                 </div>
                 <div className="md:col-span-2 relative">
                     <label className="block text-xs font-bold mb-1 text-cyan-100">رقم الحساب</label>
                     <div className="relative">
                        <input 
                            name="code" 
                            value={formData.code} 
                            onChange={handleInputChange} 
                            className="w-full p-2 pl-8 rounded text-gray-800 text-sm border-none focus:ring-2 focus:ring-amber-400" 
                            placeholder="توليد تلقائي..."
                        />
                        <button 
                            onClick={handleManualGenerate}
                            className="absolute left-1 top-1 bottom-1 text-cyan-600 hover:bg-cyan-100 p-1 rounded transition-colors"
                            title="توليد رقم حساب تلقائي"
                        >
                            <Wand2 className="w-4 h-4" />
                        </button>
                     </div>
                 </div>
                 <div className="md:col-span-3">
                     <label className="block text-xs font-bold mb-1 text-cyan-100">اسم الحساب</label>
                     <input 
                        name="name" 
                        value={formData.name} 
                        onChange={handleInputChange} 
                        className="w-full p-2 rounded text-gray-800 text-sm border-none focus:ring-2 focus:ring-amber-400" 
                     />
                 </div>
                 <div className="md:col-span-3">
                     <label className="block text-xs font-bold mb-1 text-cyan-100">التفاصيل (اختياري)</label>
                     <input 
                        name="details" 
                        value={formData.details} 
                        onChange={handleInputChange} 
                        placeholder="وصف أو ملاحظات إضافية"
                        className="w-full p-2 rounded text-gray-800 text-sm border-none focus:ring-2 focus:ring-amber-400" 
                     />
                 </div>
                 <div className="md:col-span-1">
                     <label className="block text-xs font-bold mb-1 text-cyan-100">القائمة</label>
                     <select 
                        name="reportType" 
                        value={formData.reportType} 
                        onChange={handleInputChange} 
                        className="w-full p-2 rounded text-gray-800 text-sm border-none focus:ring-2 focus:ring-amber-400"
                     >
                         {Object.values(ReportType).map(v => <option key={v} value={v}>{v}</option>)}
                     </select>
                 </div>
                  <div className="md:col-span-1">
                     <label className="block text-xs font-bold mb-1 text-cyan-100">النوع</label>
                     <select 
                        name="type" 
                        value={formData.type} 
                        onChange={handleInputChange} 
                        className="w-full p-2 rounded text-gray-800 text-sm border-none focus:ring-2 focus:ring-amber-400"
                     >
                         {Object.values(AccountType).map(v => <option key={v} value={v}>{v}</option>)}
                     </select>
                 </div>
             </div>
             
             {/* Actions Toolbar */}
             <div className="mt-4 flex flex-wrap gap-2 items-center justify-between">
                  <div className="flex gap-2 items-center">
                    <button 
                        onClick={handleUpdate} 
                        className="bg-teal-500 text-white px-4 py-2 rounded shadow hover:bg-teal-600 flex items-center font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={selectedRowIndex === null}
                    >
                        <Edit3 className="w-4 h-4 ml-1"/> تسجيل التعديل
                    </button>
                    
                    <button onClick={handleResetForm} className="bg-white text-cyan-700 px-4 py-2 rounded shadow hover:bg-cyan-50 flex items-center font-bold text-sm transition-colors">
                        <Plus className="w-4 h-4 ml-1"/> جديد
                    </button>

                    {selectedRowIndex !== null && (
                        <button onClick={handleAddChildFromSelection} className="bg-indigo-600 text-white px-4 py-2 rounded shadow hover:bg-indigo-700 flex items-center font-bold text-sm transition-colors animate-pulse-once">
                            <GitFork className="w-4 h-4 ml-1 transform rotate-180"/> إضافة فرعي من المحدد
                        </button>
                    )}

                    <button onClick={handleAdd} className="bg-cyan-800 text-white px-4 py-2 rounded shadow hover:bg-cyan-900 flex items-center font-bold text-sm transition-colors">
                        <Plus className="w-4 h-4 ml-1"/> إدراج في الجدول
                    </button>
                    
                     {selectedRowIndex !== null && (
                        <button onClick={handleDelete} className="bg-red-500 text-white px-4 py-2 rounded shadow hover:bg-red-600 flex items-center font-bold text-sm transition-colors">
                            <Trash2 className="w-4 h-4 ml-1"/> حذف
                        </button>
                    )}
                  </div>
                  
                  <div className="flex gap-2 items-center">
                     <span className="text-xs text-green-200 font-bold ml-2 flex items-center bg-green-900/30 px-2 py-1 rounded border border-green-500/30">
                         <CheckCircle className="w-3 h-3 ml-1"/>
                         يتم الحفظ تلقائياً
                     </span>

                     <button 
                        onClick={triggerFileInput}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded font-bold shadow-lg flex items-center transition-all border border-blue-400"
                        title="استيراد ملف إكسل (Drag & Drop)"
                    >
                        <Upload className="w-5 h-5 ml-2" /> استيراد
                    </button>

                    <button 
                        onClick={() => onDownload(gridData)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-bold shadow-lg flex items-center transition-all transform hover:scale-105 border border-green-500"
                    >
                        <Download className="w-5 h-5 ml-2" /> تصدير إكسل
                    </button>
                  </div>
             </div>
        </div>

        {/* 2. Grid Panel */}
        <div className="flex-1 overflow-auto bg-gray-100 p-4 custom-scrollbar relative">
           <div className="bg-white border border-gray-300 shadow-sm min-w-full rounded-lg overflow-hidden min-h-[200px]">
              <table className="w-full text-sm border-collapse">
                <thead className="bg-gray-50 sticky top-0 z-0">
                    <tr>
                        {['رقم الحساب', 'اسم الحساب', 'التفاصيل', 'النوع', 'نوع القائمة', 'المستوى', 'الحساب الرئيسي', 'التسلسل'].map((h) => (
                            <th key={h} className="border p-3 text-right font-bold text-gray-600 whitespace-nowrap bg-gray-50">{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {gridData.map((row, idx) => (
                        <tr 
                            key={idx} 
                            onClick={() => setSelectedRowIndex(idx)}
                            className={`cursor-pointer transition-colors duration-150 ${selectedRowIndex === idx ? 'bg-cyan-100 border-l-4 border-l-cyan-600 text-cyan-900' : 'hover:bg-blue-50 odd:bg-white even:bg-gray-50/50'}`}
                        >
                            <td className="border p-2 font-mono text-left" dir="ltr">{row['رقم الحساب']}</td>
                            <td className="border p-2 whitespace-pre font-medium">{row['اسم الحساب']}</td>
                            <td className="border p-2 text-gray-500">{row['التفاصيل']}</td>
                            <td className="border p-2">{row['النوع']}</td>
                            <td className="border p-2">{row['نوع القائمة']}</td>
                            <td className="border p-2 text-center">{row['المستوى']}</td>
                            <td className="border p-2 font-mono text-left" dir="ltr">{row['الحساب الرئيسي']}</td>
                            <td className="border p-2 text-center text-gray-400">{row['التسلسل']}</td>
                        </tr>
                    ))}
                </tbody>
              </table>
              {gridData.length === 0 && (
                  <div className="p-12 flex flex-col items-center justify-center text-gray-400 h-full min-h-[300px]">
                      <Upload className="w-16 h-16 mb-4 opacity-20" />
                      <p className="text-lg font-medium mb-2">الجدول فارغ</p>
                      <p className="text-sm">يمكنك سحب ملف Excel وإفلاته هنا لإدراج البيانات مباشرة</p>
                  </div>
              )}
           </div>
        </div>
        
         {/* Footer Info */}
         <div className="bg-gray-800 text-gray-400 text-xs p-2 flex justify-between px-4 shrink-0">
             <span>عدد الحسابات: {gridData.length}</span>
             <div className="flex gap-4">
                 <span><RefreshCw className="w-3 h-3 inline ml-1"/>المستوى المحدد: {formData.level}</span>
                 <span>التسلسل: {formData.serial}</span>
             </div>
         </div>

      </div>
    </div>
  );
};

export default ExcelPreviewModal;