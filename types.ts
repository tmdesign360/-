
export enum AccountType {
  MAIN = 'رئيسي',
  SUB = 'فرعي',
  ANALYTICAL = 'تحليلي'
}

export enum ReportType {
  BALANCE_SHEET = 'الميزانية',
  PROFIT_LOSS = 'أرباح وخسائر'
}

export interface Account {
  id: string;           // Unique ID (often same as code in this dataset)
  serial: string;       // التسلسل
  type: string;         // النوع
  code: string;         // رقم الحساب
  name: string;         // اسم الحساب
  details?: string;     // تفاصيل إضافية
  reportType: string;   // نوع القائمة
  level: number;        // المستوى
  parentCode: string;   // الحساب_الرئيسي
  createdAt?: string;   // تاريخ الإنشاء
  updatedAt?: string;   // آخر تعديل
}

export interface TreeNode extends Account {
  children: TreeNode[];
  isExpanded?: boolean;
}
