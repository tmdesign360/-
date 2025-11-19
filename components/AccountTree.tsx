
import React, { useState, useMemo } from 'react';
import { TreeNode, AccountType } from '../types';
import { 
  Folder, FolderOpen, ChevronLeft, ChevronDown, Landmark, 
  Box, Search, X, ArrowDownAZ, ArrowUpAZ, ArrowDown01, ArrowUp01,
  Layers, ClipboardList, ChevronsDown, ChevronsUp
} from 'lucide-react';

interface AccountTreeProps {
  data: TreeNode[];
  onSelect: (node: TreeNode) => void;
  selectedId: string | null;
}

// Helper type for expand actions
type ExpandAction = { type: 'expand' | 'collapse'; id: number };

const TreeNodeItem: React.FC<{ 
  node: TreeNode; 
  onSelect: (n: TreeNode) => void; 
  selectedId: string | null; 
  depth: number;
  expandAction: ExpandAction | null;
}> = ({ node, onSelect, selectedId, depth, expandAction }) => {
  const [isOpen, setIsOpen] = useState(node.isExpanded || depth < 2);
  
  // React to global expand/collapse actions
  React.useEffect(() => {
      if (expandAction) {
          setIsOpen(expandAction.type === 'expand');
      }
  }, [expandAction]);

  // Sync internal state if node.isExpanded changes (e.g. from search filter)
  React.useEffect(() => {
      if (node.isExpanded !== undefined) {
          setIsOpen(node.isExpanded);
      }
  }, [node.isExpanded]);

  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedId === node.id;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleSelect = () => {
    onSelect(node);
  };

  const getIcon = () => {
    // 1. Analytical (Leaf Node / Transactional)
    if (node.type === AccountType.ANALYTICAL) {
      return <ClipboardList className="w-5 h-5 text-emerald-600" />;
    }

    // 2. Root Level (Financial Statement Heads)
    if (node.level === 1) {
      return <Landmark className="w-5 h-5 text-indigo-700" />;
    }

    // 3. Main Account (Major Category Container)
    if (node.type === AccountType.MAIN) {
       return isOpen 
         ? <FolderOpen className="w-5 h-5 text-amber-500" /> 
         : <Folder className="w-5 h-5 text-amber-500" />;
    }
    
    // 4. Sub Account (Intermediate Group)
    return <Layers className="w-5 h-5 text-cyan-600" />;
  };

  return (
    <div className="select-none">
      <div 
        className={`flex items-center py-1.5 px-2 cursor-pointer transition-colors border-b border-gray-50 hover:bg-cyan-50 ${isSelected ? 'bg-cyan-100 text-cyan-900 font-medium' : 'text-gray-700'}`}
        style={{ paddingRight: `${depth * 22 + 8}px` }} 
        onClick={handleSelect}
      >
        <div className="w-5 h-5 flex items-center justify-center ml-1 text-gray-400 hover:text-gray-600 transition-colors" onClick={handleToggle}>
          {hasChildren && (
            isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />
          )}
        </div>

        <div className="mx-2">
          {getIcon()}
        </div>
        
        <div className="flex-1 flex items-center gap-2 overflow-hidden">
            <span className={`text-xs font-mono px-1.5 py-0.5 rounded flex-shrink-0 ${isSelected ? 'bg-white/50 text-cyan-800' : 'bg-gray-100 text-gray-500'}`}>
              {node.code}
            </span>
            <span className="text-sm truncate" title={node.name}>
                {node.name}
            </span>
        </div>
      </div>

      {hasChildren && isOpen && (
        <div className="border-r border-gray-200 mr-5 pr-1"> 
          {node.children.map((child) => (
            <TreeNodeItem 
                key={child.id} 
                node={child} 
                onSelect={onSelect} 
                selectedId={selectedId} 
                depth={depth + 1} 
                expandAction={expandAction}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const AccountTree: React.FC<AccountTreeProps> = ({ data, onSelect, selectedId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<'code' | 'name'>('code');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [expandAction, setExpandAction] = useState<ExpandAction | null>(null);

  const handleExpandAll = () => setExpandAction({ type: 'expand', id: Date.now() });
  const handleCollapseAll = () => setExpandAction({ type: 'collapse', id: Date.now() });

  // Filter and Sort Logic
  const filteredAndSortedData = useMemo(() => {
    let nodesToProcess = data;
    const lowerTerm = searchTerm.toLowerCase();

    // 1. Filter Function
    if (searchTerm.trim()) {
        const filterNodes = (nodes: TreeNode[]): TreeNode[] => {
          return nodes.reduce((acc, node) => {
            const matches = node.name.toLowerCase().includes(lowerTerm) || node.code.includes(lowerTerm);
            const filteredChildren = filterNodes(node.children);

            if (matches || filteredChildren.length > 0) {
              acc.push({
                ...node,
                children: filteredChildren,
                isExpanded: true // Force expand if it matches or has matching children
              });
            }
            return acc;
          }, [] as TreeNode[]);
        };
        nodesToProcess = filterNodes(nodesToProcess);
    }

    // 2. Sort Function (Recursive)
    const sortNodes = (nodes: TreeNode[]): TreeNode[] => {
        const sorted = [...nodes].sort((a, b) => {
            let comparison = 0;
            if (sortKey === 'code') {
                // Numeric collation ensures "2" comes before "10"
                comparison = a.code.localeCompare(b.code, undefined, { numeric: true });
            } else {
                comparison = a.name.localeCompare(b.name, 'ar');
            }
            return sortDirection === 'asc' ? comparison : -comparison;
        });

        return sorted.map(node => ({
            ...node,
            children: sortNodes(node.children)
        }));
    };

    return sortNodes(nodesToProcess);

  }, [data, searchTerm, sortKey, sortDirection]);

  const toggleSort = (key: 'code' | 'name') => {
    if (sortKey === key) {
        setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
        setSortKey(key);
        setSortDirection('asc');
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white border border-gray-200 rounded shadow-sm h-full">
      {/* Header & Search */}
      <div className="flex flex-col border-b border-gray-100 bg-white z-10">
        <div className="flex items-center p-3 pb-2">
            <Box className="w-5 h-5 text-cyan-600 ml-2" />
            <span className="font-bold text-gray-700 text-lg">شجرة الحسابات</span>
        </div>
        
        <div className="px-3 pb-2">
            <div className="relative">
                <input 
                    type="text" 
                    placeholder="بحث برقم أو اسم الحساب..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-9 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                />
                <div className="absolute right-3 top-2.5 text-gray-400">
                    <Search className="w-4 h-4" />
                </div>
                {searchTerm && (
                    <button 
                        onClick={() => setSearchTerm('')}
                        className="absolute left-2 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2 px-3 pb-3 overflow-x-auto scrollbar-hide">
            {/* Expand/Collapse Buttons */}
            <div className="flex items-center gap-1 pl-2 border-l border-gray-200 ml-2 shrink-0">
                <button
                    onClick={handleExpandAll}
                    className="p-1.5 rounded bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200 transition-colors"
                    title="توسيع الكل"
                >
                    <ChevronsDown className="w-4 h-4" />
                </button>
                 <button
                    onClick={handleCollapseAll}
                    className="p-1.5 rounded bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200 transition-colors"
                    title="طي الكل"
                >
                    <ChevronsUp className="w-4 h-4" />
                </button>
            </div>

            <span className="text-xs text-gray-400 font-bold ml-1 shrink-0">ترتيب:</span>
            
            <button 
                onClick={() => toggleSort('code')}
                className={`flex items-center px-2 py-1 rounded text-xs font-medium transition-colors shrink-0 ${
                    sortKey === 'code' 
                    ? 'bg-cyan-100 text-cyan-700 border border-cyan-200' 
                    : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                }`}
            >
                رقم الحساب
                {sortKey === 'code' && (
                    sortDirection === 'asc' ? <ArrowDown01 className="w-3 h-3 mr-1" /> : <ArrowUp01 className="w-3 h-3 mr-1" />
                )}
            </button>

            <button 
                onClick={() => toggleSort('name')}
                className={`flex items-center px-2 py-1 rounded text-xs font-medium transition-colors shrink-0 ${
                    sortKey === 'name' 
                    ? 'bg-cyan-100 text-cyan-700 border border-cyan-200' 
                    : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                }`}
            >
                الاسم
                {sortKey === 'name' && (
                    sortDirection === 'asc' ? <ArrowDownAZ className="w-3 h-3 mr-1" /> : <ArrowUpAZ className="w-3 h-3 mr-1" />
                )}
            </button>
        </div>
      </div>

      {/* Tree Content */}
      <div className="flex-1 overflow-auto custom-scrollbar p-2">
        {data.length === 0 ? (
            <div className="p-8 text-center text-gray-400 flex flex-col items-center justify-center h-full">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600 mb-4"></div>
               <p>جاري تحميل الدليل...</p>
            </div>
        ) : filteredAndSortedData.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
                <p>لا توجد نتائج مطابقة للبحث</p>
            </div>
        ) : (
            filteredAndSortedData.map((node) => (
                <TreeNodeItem 
                    key={node.id} 
                    node={node} 
                    onSelect={onSelect} 
                    selectedId={selectedId}
                    depth={0}
                    expandAction={expandAction}
                />
            ))
        )}
      </div>
    </div>
  );
};

export default AccountTree;
