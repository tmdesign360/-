
import React from 'react';
import { Account, AccountType } from '../types';
import { 
  Info, 
  Hash, 
  PieChart, 
  BoxSelect, 
  GitBranch, 
  ArrowUpLeft, 
  Fingerprint,
  Calendar,
  Clock,
  AlignLeft
} from 'lucide-react';

interface AccountDetailsProps {
  account: Account | null;
}

const DetailRow: React.FC<{ label: string; value: React.ReactNode; icon: React.ReactNode }> = ({ label, value, icon }) => (
  <div className="flex items-center py-3 border-b border-gray-100 last:border-0 group hover:bg-gray-50 transition-colors rounded-md px-2 -mx-2">
    <div className="w-10 h-10 rounded-full bg-cyan-50 text-cyan-600 flex items-center justify-center shadow-sm group-hover:bg-cyan-100 transition-colors">
      {icon}
    </div>
    <div className="ml-4 flex-1">
      <p className="text-xs text-gray-500 font-bold mb-0.5">{label}</p>
      <p className="text-sm text-gray-800 font-medium leading-tight">{value || '-'}</p>
    </div>
  </div>
);

const AccountDetails: React.FC<AccountDetailsProps> = ({ account }) => {
  if (!account) {
    return (
      <div className="h-full bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col items-center justify-center text-gray-400">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
            <Info className="w-8 h-8 opacity-50" />
        </div>
        <p className="font-medium">اختر حساباً لعرض التفاصيل</p>
      </div>
    );
  }

  const formatDate = (dateStr?: string) => {
      if (!dateStr) return '-';
      try {
        return new Date(dateStr).toLocaleString('ar-EG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
      } catch (e) {
          return dateStr;
      }
  };

  return (
    <div className="h-full bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col overflow-hidden">
      <div className="bg-gray-50 p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center">
            <Info className="w-5 h-5 text-cyan-600 ml-2" />
            <h3 className="font-bold text-gray-700">بطاقة الحساب</h3>
        </div>
      </div>
      
      <div className="p-4 overflow-y-auto custom-scrollbar flex-1">
        <div className="mb-6 p-5 bg-gradient-to-br from-cyan-50 via-white to-cyan-50/30 rounded-xl border border-cyan-100 text-center shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-cyan-100 rounded-bl-full -mr-8 -mt-8 opacity-50"></div>
            <p className="text-xs text-cyan-600 mb-2 font-bold uppercase tracking-wider">الحساب الحالي</p>
            <p className="text-xl font-extrabold text-gray-800 mb-2">{account.name}</p>
            <div className="inline-block bg-white border border-cyan-200 px-4 py-1.5 rounded-full shadow-sm">
                <p className="text-base font-mono text-cyan-800 font-bold dir-ltr">{account.code}</p>
            </div>
        </div>

        <div className="space-y-1 px-1">
            <DetailRow 
            label="نوع الحساب" 
            value={<span className={`px-2 py-0.5 rounded text-xs font-bold ${account.type === AccountType.MAIN ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>{account.type}</span>} 
            icon={<BoxSelect className="w-5 h-5" />} 
            />
            
            <DetailRow 
            label="رقم الحساب (Code)" 
            value={<span className="font-mono">{account.code}</span>} 
            icon={<Hash className="w-5 h-5" />} 
            />

             {account.details && (
                <DetailRow 
                label="تفاصيل" 
                value={account.details} 
                icon={<AlignLeft className="w-5 h-5" />} 
                />
            )}

            <DetailRow 
            label="نوع القائمة" 
            value={account.reportType} 
            icon={<PieChart className="w-5 h-5" />} 
            />

            <DetailRow 
            label="المستوى الهرمي" 
            value={account.level} 
            icon={<GitBranch className="w-5 h-5" />} 
            />

            <DetailRow 
            label="الحساب الرئيسي (الأب)" 
            value={<span className="font-mono">{account.parentCode}</span>} 
            icon={<ArrowUpLeft className="w-5 h-5" />} 
            />
            
            <DetailRow 
            label="رقم التسلسل (DB ID)" 
            value={<span className="font-mono text-xs">{account.serial}</span>} 
            icon={<Fingerprint className="w-5 h-5" />} 
            />

            <div className="my-2 border-t border-gray-100"></div>

            <DetailRow 
            label="تاريخ الإنشاء" 
            value={<span className="font-mono text-xs text-gray-600">{formatDate(account.createdAt)}</span>} 
            icon={<Calendar className="w-5 h-5 text-cyan-500" />} 
            />

            <DetailRow 
            label="آخر تعديل" 
            value={<span className="font-mono text-xs text-gray-600">{formatDate(account.updatedAt)}</span>} 
            icon={<Clock className="w-5 h-5 text-cyan-500" />} 
            />
        </div>
      </div>
    </div>
  );
};

export default AccountDetails;
