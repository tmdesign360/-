
import React from 'react';
import { Book, PlusCircle, FileText, Clock } from 'lucide-react';

interface SidebarProps {
  activeView: 'tree' | 'add' | 'specs';
  setActiveView: (view: 'tree' | 'add' | 'specs') => void;
  lastSaved?: Date | null;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, lastSaved }) => {
  return (
    <div className="w-64 bg-slate-700 text-white flex flex-col h-full shadow-xl z-10">
      <div className="p-4 border-b border-slate-600 bg-slate-800">
        <h1 className="text-xl font-bold tracking-wider text-center">University ERP</h1>
        <p className="text-xs text-center text-slate-400 mt-1">النظام المالي الجامعي</p>
      </div>
      
      <nav className="flex-1 py-6 space-y-1">
        <button
          onClick={() => setActiveView('tree')}
          className={`w-full flex items-center px-6 py-3 transition-colors ${
            activeView === 'tree' 
              ? 'bg-slate-600 border-r-4 border-cyan-500 text-white' 
              : 'text-slate-300 hover:bg-slate-600 hover:text-white'
          }`}
        >
          <Book className="w-5 h-5 ml-3" />
          <span className="font-semibold">دليل الحسابات</span>
        </button>

        <button
          onClick={() => setActiveView('add')}
          className={`w-full flex items-center px-6 py-3 transition-colors ${
            activeView === 'add' 
              ? 'bg-slate-600 border-r-4 border-cyan-500 text-white' 
              : 'text-slate-300 hover:bg-slate-600 hover:text-white'
          }`}
        >
          <PlusCircle className="w-5 h-5 ml-3" />
          <span className="font-semibold">إدارة الحسابات</span>
        </button>

        <div className="pt-4 pb-2 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">
            المطورين
        </div>

        <button
          onClick={() => setActiveView('specs')}
          className={`w-full flex items-center px-6 py-3 transition-colors ${
            activeView === 'specs' 
              ? 'bg-slate-600 border-r-4 border-cyan-500 text-white' 
              : 'text-slate-300 hover:bg-slate-600 hover:text-white'
          }`}
        >
          <FileText className="w-5 h-5 ml-3" />
          <span className="font-semibold">وثيقة النظام (Specs)</span>
        </button>
      </nav>
      
      <div className="p-4 border-t border-slate-600 bg-slate-800 flex flex-col gap-1">
        <div className="text-xs text-slate-400 text-center">
          Enterprise Edition v2.0
        </div>
        {lastSaved && (
          <div className="text-[10px] text-emerald-400 flex items-center justify-center mt-1 animate-pulse-once">
            <Clock className="w-3 h-3 ml-1" />
            تم الحفظ: {lastSaved.toLocaleTimeString('ar-EG')}
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;