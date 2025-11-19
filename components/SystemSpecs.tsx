
import React from 'react';
import { FileText, ShieldCheck, Database, Cpu, Layers, ArrowRight } from 'lucide-react';

const SystemSpecs: React.FC = () => {
  return (
    <div className="flex-1 bg-gray-50 p-6 overflow-y-auto custom-scrollbar h-full" dir="rtl">
      <div className="max-w-5xl mx-auto bg-white shadow-lg rounded-xl overflow-hidden border border-gray-200">
        
        {/* Header */}
        <div className="bg-slate-800 text-white p-8">
          <div className="flex items-center gap-3 mb-4">
            <ShieldCheck className="w-10 h-10 text-cyan-400" />
            <h1 className="text-3xl font-bold">وثيقة المواصفات الفنية للنظام المالي الجامعي (ERP)</h1>
          </div>
          <p className="text-slate-300 text-lg opacity-90">
            نسخة المبرمجين ومهندسي النظم - الإصدار 2.0
          </p>
        </div>

        <div className="p-8 space-y-12">

          {/* Section 1: General Overview */}
          <section>
            <div className="flex items-center gap-2 mb-6">
              <Database className="w-6 h-6 text-cyan-600" />
              <h2 className="text-2xl font-bold text-gray-800">1. هيكلية الـ ERP والمراكز المالية</h2>
            </div>
            <div className="prose max-w-none text-gray-600">
              <p className="mb-4">
                يعتمد النظام على هيكلية مصفوفية (Matrix Structure) تربط بين الحساب المالي (GL Account) ومركز التكلفة (Cost Center).
                يجب أن يدعم النظام الوسوم (Dimensions) التالية لكل قيد محاسبي:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="font-bold text-gray-800 mb-2">الأبعاد الرئيسية (Dimensions):</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li><strong>الفرع (Branch):</strong> المقر الرئيسي، فرع الطالبات.</li>
                    <li><strong>الكلية (Department):</strong> الهندسة، الطب، الإدارة.</li>
                    <li><strong>البرنامج (Program):</strong> بكالوريوس، ماجستير.</li>
                    <li><strong>المشروع (Project):</strong> للأبحاث والمنح (مثلاً: منحة بحث كورونا).</li>
                  </ul>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="font-bold text-gray-800 mb-2">مثال تطبيقي للكود المحاسبي:</h3>
                  <div className="font-mono text-xs bg-slate-800 text-cyan-400 p-3 rounded mt-2" dir="ltr">
                    GL-410101-CC20-PRJ00
                    <br />
                    [Account: Tuition] - [CostCenter: Medicine] - [Project: General]
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Rules Engine */}
          <section>
             <div className="flex items-center gap-2 mb-6">
              <Cpu className="w-6 h-6 text-cyan-600" />
              <h2 className="text-2xl font-bold text-gray-800">2. محرك القواعد المحاسبية (Rules Engine)</h2>
            </div>
            <div className="space-y-6">
              
              {/* Rule 1 */}
              <div className="border-r-4 border-blue-500 bg-blue-50 p-5 rounded-l-lg">
                <h3 className="font-bold text-blue-900 text-lg mb-2">قاعدة تحقق الإيراد (Revenue Recognition)</h3>
                <p className="text-gray-700 text-sm mb-3">
                  يتم الاعتراف بالإيرادات الدراسية على أساس الاستحقاق (Accrual Basis) وتوزع على أشهر الفصل الدراسي.
                </p>
                <div className="bg-white p-3 rounded border border-blue-100">
                  <p className="text-xs font-bold text-gray-500 mb-1">Logic Code / Pseudo:</p>
                  <code className="text-xs font-mono text-pink-600 block">
                    IF Transaction_Type == 'TUITION_FEE' THEN<br/>
                    &nbsp;&nbsp;CREDIT: 2202 (Unearned Revenue)<br/>
                    &nbsp;&nbsp;DEBIT: 1202 (Student Receivables)<br/>
                    ON_MONTH_END:<br/>
                    &nbsp;&nbsp;DEBIT: 2202 (Unearned Revenue)<br/>
                    &nbsp;&nbsp;CREDIT: 3101 (Academic Revenue) / [Semesters_Count]
                  </code>
                </div>
              </div>

              {/* Rule 2 */}
              <div className="border-r-4 border-emerald-500 bg-emerald-50 p-5 rounded-l-lg">
                <h3 className="font-bold text-emerald-900 text-lg mb-2">قاعدة البحث العلمي (Research Fund Accounting)</h3>
                <p className="text-gray-700 text-sm mb-3">
                  تعامل المنح البحثية كأموال مقيدة (Restricted Funds). لا تسجل كإيراد إلا عند صرف المصروف المقابل.
                </p>
                <div className="bg-white p-3 rounded border border-emerald-100">
                  <p className="text-xs font-bold text-gray-500 mb-1">Logic Code / Pseudo:</p>
                  <code className="text-xs font-mono text-pink-600 block">
                    ON_RECEIVE_GRANT:<br/>
                    &nbsp;&nbsp;DEBIT: Bank, CREDIT: 2305 (Deferred Grant Income)<br/>
                    ON_SPEND_EXPENSE:<br/>
                    &nbsp;&nbsp;DEBIT: Expense, CREDIT: Bank<br/>
                    &nbsp;&nbsp;TRIGGER: DEBIT 2305, CREDIT 3201 (Grant Revenue)
                  </code>
                </div>
              </div>

            </div>
          </section>

          {/* Section 3: ERP Integration Map */}
          <section>
             <div className="flex items-center gap-2 mb-6">
              <Layers className="w-6 h-6 text-cyan-600" />
              <h2 className="text-2xl font-bold text-gray-800">3. تكامل الوحدات (ERP Modules Integration)</h2>
            </div>
            
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="w-full text-sm text-right">
                <thead className="bg-gray-100 text-gray-700">
                  <tr>
                    <th className="p-4 border-b">الوحدة (Module)</th>
                    <th className="p-4 border-b">الحدث (Trigger)</th>
                    <th className="p-4 border-b">التأثير المحاسبي (GL Impact)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="p-4 font-bold text-slate-700">القبول والتسجيل (SIS)</td>
                    <td className="p-4">تسجيل طالب للمواد</td>
                    <td className="p-4 text-gray-600">إنشاء قيد استحقاق رسوم (ذمم طلاب) آلياً</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-slate-700">الموارد البشرية (HR)</td>
                    <td className="p-4">مسير الرواتب</td>
                    <td className="p-4 text-gray-600">توزيع الرواتب على مراكز التكلفة (كلية الطب، الهندسة..) بناءً على قسم الموظف</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-slate-700">المشتريات (Procurement)</td>
                    <td className="p-4">استلام مواد معملية</td>
                    <td className="p-4 text-gray-600">خصم من المخزون أو تسجيل مصروف مباشر على مركز تكلفة المعمل</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Footer CTA */}
          <div className="mt-12 p-6 bg-gray-100 rounded-lg text-center">
            <p className="text-gray-500 text-sm mb-4">
              هذه الوثيقة تم إعدادها بناءً على معايير المحاسبة الدولية للجامعات. يمكن تصدير الهيكل بصيغة JSON أو Excel للمطورين.
            </p>
            <button className="bg-slate-800 text-white px-6 py-2 rounded hover:bg-slate-700 transition-colors flex items-center mx-auto">
              تصدير ملف JSON للمطورين <ArrowRight className="w-4 h-4 mr-2" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SystemSpecs;
