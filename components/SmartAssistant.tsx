
import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, X, Bot, Sparkles, Minimize2, Loader2 } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { Account } from '../types';

interface SmartAssistantProps {
  accounts: Account[];
  onAddAccount: (data: { name: string; parentCode: string; type: string; details?: string }) => string | null;
}

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

const SmartAssistant: React.FC<SmartAssistantProps> = ({ accounts, onAddAccount }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'model',
      text: 'مرحباً بك! أنا المحاسب الذكي الخاص بجامعة ابن النفيس. كيف يمكنني مساعدتك في دليل الحسابات؟\n\nيمكنك سؤالي عن أي حساب، أو الطلب مني إضافة حسابات جديدة (مثلاً: "أضف حساب صيانة تحت المصروفات").',
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const generateAIResponse = async (userQuery: string) => {
    setIsLoading(true);
    try {
      // Initialize Gemini
      // Note: In a real production app, ensure process.env.API_KEY is set securely.
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      
      // Prepare Context: Summarize the chart of accounts to save tokens but keep structure
      const structureContext = JSON.stringify(
        accounts.map(a => ({ code: a.code, name: a.name, type: a.type, parent: a.parentCode }))
      );

      const systemInstruction = `
        أنت "المحاسب الذكي"، مساعد خبير لنظام ERP جامعي (جامعة ابن النفيس للعلوم الطبية).
        لديك حق الوصول إلى "دليل الحسابات" الحالي الخاص بالجامعة بصيغة JSON أدناه.
        
        دورك هو:
        1. مساعدة المستخدم في العثور على الحساب الصحيح.
        2. تنفيذ أوامر إضافة حسابات جديدة عند الطلب.
        3. شرح المعايير المحاسبية واقتراح القيود.

        تعليمات خاصة للإجراءات (Action Mode):
        إذا طلب المستخدم صراحةً "إضافة" أو "إنشاء" أو "إدراج" حساب جديد:
        1. ابحث في البيانات عن أنسب "حساب أب" (Parent Account) يمكن إدراج الحساب الجديد تحته بناءً على الاسم والمنطق المحاسبي.
        2. حدد نوع الحساب (رئيسي/فرعي/تحليلي) بدقة، يجب أن يكون أحد القيم: "رئيسي"، "فرعي"، "تحليلي".
        3. لا تقم بتأليف رقم الحساب (الكود)، النظام سيقوم بتوليده تلقائياً، فقط حدد الأب الصحيح.
        4. أرجع ردك بصيغة JSON فقط (بدون أي نص إضافي) بالشكل التالي:
        \`\`\`json
        {
          "action": "ADD_ACCOUNT",
          "data": {
            "name": "اسم الحساب الجديد",
            "parentCode": "رقم الحساب الأب المختار من البيانات",
            "type": "نوع الحساب (رئيسي/فرعي/تحليلي)",
            "details": "وصف مختصر (اختياري)"
          }
        }
        \`\`\`

        إذا كان السؤال استفساراً عادياً، أجب بنص عادي باللغة العربية.

        البيانات الحالية (Chart of Accounts):
        ${structureContext}
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: userQuery,
        config: {
          systemInstruction: systemInstruction,
        },
      });

      const aiText = response.text || "عذراً، لم أتمكن من معالجة طلبك.";

      // Check for JSON Action
      const jsonMatch = aiText.match(/```json\s*([\s\S]*?)\s*```/) || aiText.match(/{[\s\S]*"action":\s*"ADD_ACCOUNT"[\s\S]*}/);

      if (jsonMatch) {
          const jsonStr = jsonMatch[1] || jsonMatch[0];
          try {
              const command = JSON.parse(jsonStr);
              if (command.action === 'ADD_ACCOUNT') {
                  // Execute Action
                  const result = onAddAccount(command.data);
                  
                  if (result) {
                      setMessages(prev => [...prev, {
                        id: Date.now().toString(),
                        role: 'model',
                        text: `✅ **تمت العملية بنجاح!**\n\nتم إضافة حساب: **${command.data.name}**\nالكود الجديد: \`${result}\`\nالحساب الأب: \`${command.data.parentCode}\``,
                        timestamp: new Date()
                      }]);
                  } else {
                      setMessages(prev => [...prev, {
                        id: Date.now().toString(),
                        role: 'model',
                        text: `❌ عذراً، لم أتمكن من إضافة الحساب. يبدو أن الحساب الأب المقترح (${command.data.parentCode}) غير موجود.`,
                        timestamp: new Date()
                      }]);
                  }
                  setIsLoading(false);
                  return; // Stop here
              }
          } catch (e) {
              console.error("Failed to parse AI JSON action", e);
              // Fallback to text if JSON parse fails
          }
      }

      // Normal Text Response
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: aiText,
        timestamp: new Date()
      }]);

    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: "حدث خطأ في الاتصال بالمساعد الذكي. تأكد من إعداد مفتاح API بشكل صحيح.",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    generateAIResponse(input);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 left-6 z-40 p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 flex items-center justify-center ${
          isOpen ? 'bg-red-500 rotate-90' : 'bg-gradient-to-r from-indigo-600 to-purple-600 animate-pulse-slow'
        }`}
        title="المحاسب الذكي"
      >
        {isOpen ? <X className="w-6 h-6 text-white" /> : <Sparkles className="w-6 h-6 text-white" />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 left-6 z-40 w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-fade-up dir-rtl">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 flex items-center justify-between text-white shrink-0">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 p-1.5 rounded-full">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm">المحاسب الذكي</h3>
                <p className="text-[10px] text-indigo-100 opacity-80">مدعوم بـ Gemini AI</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white">
              <Minimize2 className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4 custom-scrollbar">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white p-3 rounded-2xl rounded-bl-none border border-gray-200 shadow-sm flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                  <span className="text-xs text-gray-500">جاري التحليل...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-gray-100 shrink-0">
            <div className="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2 border border-transparent focus-within:border-indigo-300 focus-within:bg-white transition-all">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="اطلب إضافة حساب أو اسأل عن كود..."
                className="flex-1 bg-transparent outline-none text-sm text-gray-700"
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="text-indigo-600 hover:text-indigo-800 disabled:opacity-50 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SmartAssistant;
