import React, { useState } from 'react';
import { X, HelpCircle, CheckCircle2, Sparkles } from 'lucide-react';
import { SUJUD_SAHW_CASES, SujudSahwCase } from '../utils/sujudSahwData';
import { toArabicDigits } from '../utils/khatmaData';

interface SujudSahwModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SujudSahwModal: React.FC<SujudSahwModalProps> = ({ isOpen, onClose }) => {
  const [selectedCaseId, setSelectedCaseId] = useState<string>(SUJUD_SAHW_CASES[0].id);

  if (!isOpen) return null;

  const activeCase: SujudSahwCase =
    SUJUD_SAHW_CASES.find((c) => c.id === selectedCaseId) || SUJUD_SAHW_CASES[0];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
        className="relative w-full max-w-3xl max-h-[92vh] rounded-3xl border-2 border-[#e5b869]/60 bg-[#041b16]/95 text-right flex flex-col overflow-hidden shadow-[0_24px_75px_rgba(0,0,0,0.68)]"
      >
        {/* Header */}
        <div className="shrink-0 px-5 py-4 border-b border-[#e5b869]/25 bg-[#03120f]/90 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#05221c] border border-[#e5b869]/50 flex items-center justify-center text-[#fbbf24] shrink-0">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold font-amiri text-[#fbbf24] flex items-center gap-2">
                <span>❖ مُصحِّح السهو التفاعلي ❖</span>
              </h3>
              <p className="text-xs text-slate-300">
                اختر الحالة التي وقعت لك في الصلاة لمعرفة الحكم الفقهي الفوري وتوقيت سجود السهو
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] rounded-xl bg-[#031713] hover:bg-[#06261f] border border-[#e5b869]/35 text-slate-200 hover:text-[#fbbf24] flex items-center justify-center transition-colors shrink-0"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* 4 Common Sahw Cases Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SUJUD_SAHW_CASES.map((item, idx) => {
              const isSelected = item.id === activeCase.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedCaseId(item.id)}
                  className={`min-h-[44px] p-3.5 rounded-2xl border text-right transition-all flex flex-col justify-between gap-1.5 active:scale-[0.99] ${
                    isSelected
                      ? 'bg-[#062d24] border-[#fbbf24] shadow-[0_0_24px_rgba(251,191,36,0.2)]'
                      : 'bg-[#031713]/90 border-[#e5b869]/25 hover:border-[#e5b869]/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 w-full">
                    <span className="font-bold text-sm font-amiri text-white leading-snug">
                      {toArabicDigits(idx + 1)}. {item.caseTitle}
                    </span>
                    <span
                      className={`text-[11px] font-bold whitespace-nowrap shrink-0 ${
                        item.sujudTiming === 'بعد السلام' ? 'text-[#fbbf24]' : 'text-emerald-300'
                      }`}
                    >
                      {item.sujudTiming}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">{item.caseSubtitle}</p>
                </button>
              );
            })}
          </div>

          {/* Instant Fiqh Ruling Card (Golden / Emerald Highlight) */}
          <div className="rounded-3xl border-2 border-[#fbbf24]/70 bg-gradient-to-br from-[#073329] via-[#05261f] to-[#031713] p-5 sm:p-6 space-y-4 shadow-[0_0_32px_rgba(251,191,36,0.16)]">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#e5b869]/25">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#fbbf24]" />
                <h4 className="font-bold text-base sm:text-lg font-amiri text-[#fbbf24]">
                  الحكم الفقهي الفوري: {activeCase.caseTitle}
                </h4>
              </div>
            </div>

            {/* Key Decision Grid: Timing + Extra Rakat */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-[#031713] border border-[#fbbf24]/45">
                <div className="text-[11px] text-slate-300 mb-1">متى تسجد سجدتي السهو؟</div>
                <div className="text-lg font-black font-amiri text-[#fbbf24]">
                  ❖ سجدتان {activeCase.sujudTiming}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#031713] border border-emerald-500/45">
                <div className="text-[11px] text-slate-300 mb-1">هل تأتي بركعة إضافية؟</div>
                <div
                  className={`text-base font-bold font-amiri ${
                    activeCase.extraRakatNeeded ? 'text-emerald-300' : 'text-slate-100'
                  }`}
                >
                  ❖ {activeCase.extraRakatSummary}
                </div>
              </div>
            </div>

            {/* Summary Ruling */}
            <div className="p-4 rounded-2xl bg-[#031713]/90 border border-[#e5b869]/30">
              <p className="text-sm sm:text-base font-bold text-white leading-relaxed font-amiri">
                {activeCase.rulingSummary}
              </p>
            </div>

            {/* Step-by-Step Practical Instructions */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-[#e5b869]">الخطوات العملية في صلاتك:</div>
              <div className="space-y-2">
                {activeCase.steps.map((step, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-200 leading-relaxed"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Hadith Reference */}
            <div className="pt-3 border-t border-[#e5b869]/20 text-[11px] text-slate-300 leading-relaxed">
              <strong className="text-[#e5b869]">الدليل الشرعي: </strong>
              {activeCase.evidence}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 px-5 py-3 border-t border-[#e5b869]/20 bg-[#03120f]/90 flex items-center justify-between gap-3">
          <span className="text-[11px] text-slate-300">
            وفق هدي النبي ﷺ في سجود السهو (صحيح البخاري ومسلم)
          </span>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-5 py-2 rounded-xl bg-gradient-to-r from-[#fbbf24] to-[#d97706] text-slate-950 text-xs sm:text-sm font-black hover:brightness-105 transition-all"
          >
            فهمت والحمد لله
          </button>
        </div>
      </div>
    </div>
  );
};
