import { Account, TreeNode } from './types';
import { RAW_DATA } from './constants';

// Parses the raw TSV string into Account objects
export const parseAccounts = (): Account[] => {
  const lines = RAW_DATA.trim().split('\n');
  const now = new Date().toISOString();
  
  // Skip header (row 0)
  const accounts: Account[] = lines.slice(1).map((line) => {
    // Split by tab or multiple spaces if tab is missing (fallback)
    const cols = line.split(/\t+/);
    
    // Mapping based on: التسلسل, النوع, رقم الحساب, اسم الحساب, نوع القائمة, المستوى, الحساب_الرئيسي...
    // Clean up possible "--" or empty strings for parent
    let parentCode = cols[6]?.trim();
    if (!parentCode || parentCode === '--' || parentCode === '') {
        // For the provided dataset, sometimes parent is in col 6, but sometimes empty.
        // Top level nodes (Level 1) have no parent.
        // Sub nodes usually have parent. 
        // Special handling: Analytical accounts (column 8 is 'حساب_فرعي_أب' sometimes?)
        
        const analyticalParent = cols[8]?.trim();
        if(analyticalParent && analyticalParent !== '--') {
             parentCode = analyticalParent;
        } else {
             // Ensure it is an empty string, not null, to match interface
             parentCode = ''; 
        }
    }

    return {
      id: cols[2]?.trim(), // Use Account Number as ID
      serial: cols[0]?.trim(),
      type: cols[1]?.trim(),
      code: cols[2]?.trim(),
      name: cols[3]?.trim(),
      details: '',
      reportType: cols[4]?.trim(),
      level: parseInt(cols[5]?.trim() || '0', 10),
      parentCode: parentCode,
      createdAt: now,
      updatedAt: now
    };
  });

  return accounts.filter(a => a.code); // Remove empty lines
};

// Converts flat list to Tree structure with cycle protection
export const buildTree = (accounts: Account[]): TreeNode[] => {
  const accountMap = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];

  // 1. Initialize all nodes
  accounts.forEach((account) => {
    // Create a clean node object
    accountMap.set(account.code, { ...account, children: [], isExpanded: false });
  });

  // 2. Build hierarchy
  accounts.forEach((account) => {
    const node = accountMap.get(account.code);
    if (!node) return;

    // CRITICAL FIX: Prevent self-referencing which causes infinite loops/crashes
    if (account.parentCode === account.code) {
        console.warn(`Circular reference detected: Account ${account.code} points to itself as parent. Treating as root.`);
        roots.push(node);
        return;
    }

    // DEEP CYCLE CHECK: Prevent loops like A->B->A or A->B->C->A
    let isCycle = false;
    if (account.parentCode) {
        let ancestorCode = account.parentCode;
        let depth = 0;
        // Traverse up the potential tree structure using parentCode pointers
        // to see if we ever hit the current node's code.
        while(ancestorCode && depth < 50) {
            if (ancestorCode === account.code) {
                isCycle = true;
                break;
            }
            const ancestor = accountMap.get(ancestorCode);
            ancestorCode = ancestor ? ancestor.parentCode : '';
            depth++;
        }
    }

    if (isCycle) {
        console.warn(`Deep cycle detected for account ${account.code}. Detaching from parent to prevent crash.`);
        roots.push(node);
        return;
    }

    if (account.level === 1) {
      roots.push(node);
    } else {
      if (account.parentCode && accountMap.has(account.parentCode)) {
        const parent = accountMap.get(account.parentCode);
        // Double check strict parenting to avoid orphans
        if (parent) {
            parent.children.push(node);
        } else {
            roots.push(node);
        }
      } else {
        // Fallback: if parent not found but level > 1, treat as root
        roots.push(node); 
      }
    }
  });

  return roots;
};