
import React, { useState, useEffect } from 'react';
import { Account, AccountType, ReportType } from '../types';
import { Save, Plus, Edit3, Trash2, RefreshCw, Download } from 'lucide-react';

interface HeaderFormProps {
  selectedAccount: Account | null;
  existingAccounts: Account[];
  onSave: (account: Partial<Account>) => void;
  onDelete: (id: string) => void;
  isEditing: boolean;
  setIsEditing: (val: boolean) => void;
  onRefresh: () => void;
  onExport: () => void;
}

const HeaderForm: React.FC<HeaderFormProps> = ({ 
  selectedAccount,
  existingAccounts,
  onSave, 
  onDelete,
  isEditing,
  setIsEditing,
  onRefresh,
  onExport
}) => {
  const [formData, setFormData] = useState<Partial<Account>>({
    code: '',
    name: '',
    details: '',
    type: AccountType.SUB,
    reportType: ReportType.BALANCE_SHEET,
    parentCode: ''
  });

  useEffect(() => {
    if (isEditing && selectedAccount) {
      setFormData({ ...selectedAccount });
    } else if (!isEditing && selectedAccount) {
      // Preparing to add a child to the selected account
      
      // 1. Filter children of the selected account
      const children = existingAccounts.filter(a => a.parentCode === selectedAccount.code);
      
      // 2. Determine the next suffix
      let nextSuffixVal = 1;
      let padLength = 2; // Default padding (e.g. '01')

      if (children.length > 0) {
         // Find max suffix from existing children
         let maxVal = 0;
         let maxSuffixStr = '';

         children.forEach(c => {
             if(c.code.startsWith(selectedAccount.code)) {
                 const suffix = c.code.slice(selectedAccount.code.length);
                 const val = parseInt(suffix, 10);
                 if (!isNaN(val) && val > maxVal) {
                     maxVal = val;
                     maxSuffixStr = suffix;
                 }
             }
         });

         nextSuffixVal = maxVal + 1;
         // Maintain the padding convention of the largest sibling
         padLength = maxSuffixStr.length; 
      } else {
         // No children exist yet.
         // If parent is root (e.g. code '1'), convention is usually '11', '12' (pad 1)
         // If parent is deeper (e.g. '1101'), convention is '01' (pad 2)
         if (selectedAccount.code.length === 1) {
             padLength = 1; 
         } else {
             padLength = 2;
         }
      }
      
      const suffixStr = nextSuffixVal.toString().padStart(padLength, '0');

      setFormData({
        code: `${selectedAccount.code}${suffixStr}`, 
        name: '',
        details: '',
        type: AccountType.SUB,
        reportType: selectedAccount.reportType, // Inherit report type
        parentCode: selectedAccount.code,
        level: (selectedAccount.level || 0) + 1
      });
    } else {
      // Reset if nothing selected (Root add mode)
      // Try to suggest next root code (1, 2, 3...)
      const rootAccounts = existingAccounts.filter(a => a.level === 1);
      let nextRoot = 1;
      if (rootAccounts.length > 0) {
          const maxRoot = Math.max(...rootAccounts.map(a => parseInt(a.code, 10) || 0));
          nextRoot = maxRoot + 1;
      }

      setFormData({
        code: nextRoot.toString(),
        name: '',
        details: '',
        type: AccountType.MAIN,
        reportType: ReportType.BALANCE_SHEET,
        parentCode: '',
        level: 1
      });
    }
  }, [selectedAccount, isEditing, existingAccounts]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="bg-white shadow-md border-b border-gray-200">
      <div className="bg-cyan-600 p-3 text-white flex justify-between items-center">
        <h2 className="font-bold text-lg">
          {isEditing ? 'تعديل بيانات الحساب' : 'ادخال الحسابات الرئيسية والفرعية'}
        </h2>
        <div className="flex gap-2">
           <button 
            onClick={onExport}
            className="px-3 py-1 text-sm rounded bg-green-600 hover:bg-green-700 text-white flex items-center transition-colors shadow-sm"
            title="تصدير إلى إكسل"
           >
             <Download className="w-4 h-4 ml-1" /> تصدير إكسل
           </button>
           <div className="w-px bg-cyan-500 mx-1"></div>
           <button 
            onClick={onRefresh}
            className="px-3 py-1 text-sm rounded bg-teal-500 hover:bg-teal-600 flex items-center transition-colors"
            title="إعادة تحميل البيانات"
           >
             <RefreshCw className="w-4 h-4 ml-1" /> تحديث
           </button>
           <button 
            onClick={() => setIsEditing(false)}
            className={`px-3 py-1 text-sm rounded flex items-center ${!isEditing ? 'bg-white text-cyan-700' : 'bg-cyan-700 hover:bg-cyan-800'}`}
           >
             <Plus className="w-4 h-4 ml-1" /> جديد
           </button>
           {selectedAccount && (
             <>
               <button 
                onClick={() => setIsEditing(true)}
                className={`px-3 py-1 text-sm rounded flex items-center ${isEditing ? 'bg-white text-cyan-700' : 'bg-cyan-700 hover:bg-cyan-800'}`}
               >
                 <Edit3 className="w-4 h-4 ml-1" /> تعديل
               </button>
               <button 
                onClick={() => onDelete(selectedAccount.id)}
                className="px-3 py-1 text-sm rounded bg-red-500 hover:bg-red-600 flex items-center"
               >
                 <Trash2 className="w-4 h-4 ml-1" /> حذف
               </button>
             </>
           )}
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-50">
        
        <div className="flex flex-col">
          <label className="text-xs font-bold text-gray-600 mb-1">الحساب الأب</label>
          <input
            type="text"
            name="parentCode"
            value={formData.parentCode || ''}
            onChange={handleChange}
            className="border border-gray-300 rounded p-2 text-sm focus:outline-none focus:border-cyan-500 bg-gray-100"
            placeholder="-- رئيسي --"
            readOnly={isEditing} // Typically can't change parent easily
          />
        </div>

        <div className="flex flex-col">
           <label className="text-xs font-bold text-gray-600 mb-1">رقم الحساب</label>
           <input
            type="text"
            name="code"
            value={formData.code || ''}
            onChange={handleChange}
            className="border border-gray-300 rounded p-2 text-sm focus:outline-none focus:border-cyan-500"
            required
           />
        </div>

        <div className="flex flex-col md:col-span-2">
           <label className="text-xs font-bold text-gray-600 mb-1">اسم الحساب</label>
           <input
            type="text"
            name="name"
            value={formData.name || ''}
            onChange={handleChange}
            className="border border-gray-300 rounded p-2 text-sm focus:outline-none focus:border-cyan-500"
            required
           />
        </div>

        <div className="flex flex-col md:col-span-2">
           <label className="text-xs font-bold text-gray-600 mb-1">التفاصيل (اختياري)</label>
           <input
            type="text"
            name="details"
            value={formData.details || ''}
            onChange={handleChange}
            className="border border-gray-300 rounded p-2 text-sm focus:outline-none focus:border-cyan-500"
            placeholder="وصف إضافي..."
           />
        </div>

        <div className="flex flex-col">
          <label className="text-xs font-bold text-gray-600 mb-1">نوع الحساب</label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="border border-gray-300 rounded p-2 text-sm focus:outline-none focus:border-cyan-500 bg-white"
          >
            {Object.values(AccountType).map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-xs font-bold text-gray-600 mb-1">نوع القائمة</label>
          <select
            name="reportType"
            value={formData.reportType}
            onChange={handleChange}
            className="border border-gray-300 rounded p-2 text-sm focus:outline-none focus:border-cyan-500 bg-white"
          >
            {Object.values(ReportType).map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className="flex items-end md:col-span-4">
          <button 
            type="submit"
            className="w-full bg-cyan-600 text-white font-bold py-2 px-4 rounded shadow hover:bg-cyan-700 transition flex justify-center items-center"
          >
            <Save className="w-4 h-4 ml-2" />
            {isEditing ? 'حفظ التعديلات' : 'تسجيل البند'}
          </button>
        </div>

      </form>
    </div>
  );
};

export default HeaderForm;
