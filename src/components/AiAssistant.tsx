import React, { useState } from 'react';
import { Sparkles, Send, Bot, User, Loader2 } from 'lucide-react';

import { isNativeCapacitorApp } from '../utils/nativeAndroidBridge';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const AiAssistant: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'أهلاً بك! أنا مساعدك الشرعي الذكي. يمكنك سؤالي عن أحكام الصلاة، الطهارة، الأذكار، الأدعية، أو أي استفسار ديني وسأجيبك بإذن الله.'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const savedBaseUrl =
        (typeof window !== 'undefined' ? localStorage.getItem('remote_api_base_url') : null) ||
        import.meta.env.VITE_API_BASE_URL ||
        '';
      const cleanBase = savedBaseUrl.trim().replace(/\/+$/, '');
      if (isNativeCapacitorApp() && !cleanBase) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content:
              'تعمل نسخة الأندرويد (APK) محلياً بدون خادم. لتفعيل المساعد الذكي داخل التطبيق، أضف رابط الخادم السحابي في الإعدادات ← الأندرويد والشاشات (APK)، بينما تعمل المواقيت والأذان والقرآن والأذكار محلياً دون اتصال.',
          },
        ]);
        setIsLoading(false);
        return;
      }
      const chatUrl = cleanBase ? `${cleanBase}/api/chat` : '/api/chat';
      const res = await fetch(chatUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userMessage }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply || data.error || 'عذراً، حدث خطأ ما.' }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: 'عذراً، تعذر الاتصال بالمساعد الذكي. يرجى المحاولة مرة أخرى أو التحقق من رابط الخادم في الإعدادات.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const sampleQuestions = [
    'ما هي أحكام صلاة المسافر وقصر الصلاة؟',
    'كيف أصلي صلاة الفجر بخاشعة وخشوع؟',
    'ما هي أفضل الأدعية المستجابة في الثلث الأخير من الليل؟',
    'ما هي فضائل سورة الكهف يوم الجمعة؟'
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-slate-900/80 border border-emerald-900/40 rounded-3xl p-6 md:p-8 shadow-xl flex flex-col h-[650px]">
        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md">
            <Sparkles className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white font-amiri">المساعد الإسلامي الذكي</h3>
            <p className="text-xs text-slate-400">إجابات شرعية موثوقة مستندة للقرآن والسنة</p>
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-2">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  msg.role === 'user' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-emerald-400'
                }`}
              >
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-emerald-600 text-white rounded-tr-none'
                    : 'bg-slate-950/80 border border-slate-800 text-slate-100 rounded-tl-none'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-800 text-emerald-400 flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-slate-400 flex items-center gap-2 text-sm">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                <span>جاري صياغة الإجابة الشرعية...</span>
              </div>
            </div>
          )}
        </div>

        {/* Suggested Questions */}
        {messages.length <= 1 && (
          <div className="py-2 flex flex-wrap gap-2">
            {sampleQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => setInput(q)}
                className="text-xs bg-emerald-950/40 text-emerald-300 border border-emerald-900/40 px-3 py-1.5 rounded-xl hover:bg-emerald-900/50 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSend} className="pt-4 border-t border-slate-800 flex items-center gap-2">
          <input
            type="text"
            placeholder="اكتب سؤالك الديني هنا..."
            value={input}
            onChange={e => setInput(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="p-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};
