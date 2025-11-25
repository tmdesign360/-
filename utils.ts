
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
    
    // Mapping: 
    // 0: Serial
    // 1: Type
    // 2: Code
    // 3: Name
    // 4: ReportType
    // 5: Level
    // 6: ParentCode
    // 7: Details (Optional)

    let parentCode = cols[6]?.trim();
    if (!parentCode || parentCode === '--' || parentCode === '') {
        parentCode = '';
    }

    return {
      id: cols[2]?.trim(), // Use Account Number as ID
      serial: cols[0]?.trim(),
      type: cols[1]?.trim(),
      code: cols[2]?.trim(),
      name: cols[3]?.trim(),
      reportType: cols[4]?.trim(),
      level: parseInt(cols[5]?.trim() || '0', 10),
      parentCode: parentCode,
      details: cols[7]?.trim() || '', // Parse Details
      createdAt: now,
      updatedAt: now
    };
  });

  return accounts.filter(a => a.code); // Remove empty lines
};

// Converts flat list to Tree structure with robust cycle protection
export const buildTree = (accounts: Account[]): TreeNode[] => {
  const accountMap = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];

  // 1. Initialize all nodes
  accounts.forEach((account) => {
    // Create a clean node object
    accountMap.set(account.code, { ...account, children: [], isExpanded: false });
  });

  // 2. Build hierarchy with Cycle Protection
  accounts.forEach((account) => {
    const node = accountMap.get(account.code);
    if (!node) return;

    const parentCode = account.parentCode;

    // Case 0: Root Node (No parent)
    if (!parentCode || parentCode === '--' || parentCode === '') {
        roots.push(node);
        return;
    }

    // Case 1: Self-reference (Immediate cycle)
    if (parentCode === account.code) {
        console.warn(`Self-reference detected for account ${account.code}. Detaching.`);
        roots.push(node);
        return;
    }

    const parent = accountMap.get(parentCode);

    if (parent) {
        // Case 2: Deep Cycle Check (Ancestor traversal)
        let isCycle = false;
        let ancestor = parent;
        const visited = new Set<string>();
        visited.add(account.code);

        let depth = 0;
        while(ancestor && depth < 100) {
            if (visited.has(ancestor.code)) {
                isCycle = true;
                break;
            }
            visited.add(ancestor.code);
            
            // Move up
            if (ancestor.parentCode && accountMap.has(ancestor.parentCode)) {
                ancestor = accountMap.get(ancestor.parentCode)!;
            } else {
                break; // Reached top
            }
            depth++;
        }

        if (isCycle) {
            console.error(`Cycle detected: Account ${account.code} creates a loop. Treating as root.`);
            roots.push(node);
        } else {
            parent.children.push(node);
        }
    } else {
        // Orphan node (parent code exists but parent node not found)
        roots.push(node);
    }
  });

  return roots;
};
