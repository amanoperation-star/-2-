import React, { useEffect, useState } from 'react';
import { X, ChevronRight, ChevronLeft, Sparkles, Droplets, BookOpen } from 'lucide-react';
import { KID_SALAH_STEPS, KID_WUDU_STEPS } from '../utils/familyHomeData';

interface KidWuduSalahModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'wudu' | 'salah';
}

export const KidWuduSalahModal: React.FC<KidWuduSalahModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'wudu',
}) => {
  const [mode, setMode] = useState<'wudu' | 'salah'>(initialMode);
  const [stepIdx, setStepIdx] = useState<number>(0);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setStepIdx(0);
    }
  }, [isOpen, initialMode]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const steps = mode === 'wudu' ? KID_WUDU_STEPS : KID_SALAH_STEPS;
  const currentStep = steps[Math.min(stepIdx, steps.length - 1)] || steps[0];

  const handleSwitchMode = (nextMode: 'wudu' | 'salah') => {
    setMode(nextMode);
    setStepIdx(0);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="معلم الوضوء والصلاة للصغار"
      dir="rtl"
      className="fixed inset-0 z-[75] flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6"
    >
      <div className="w-full max-w-2xl rounded-3xl bg-[#041b16] border-2 border-[#e5b869]/55 shadow-[0_24px_70px_rgba(0,0,0,0.7)] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-[#03120f] border-b border-[#e5b869]/30 flex items-center justify-between gap-3">
          <div className="text-right">
            <h3 className="text-lg sm:text-xl font-bold text-[#fbbf24] font-amiri flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#fbbf24] shrink-0" />
              <span>معلّم الوضوء والصلاة للصغار</span>
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              تعلّم متدرّج ولطيف مع الأسرة · مناسب للموبايل وشاشة التلفاز
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق معلم الوضوء والصلاة"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-[#06261f] border border-[#e5b869]/30 text-slate-200 hover:text-[#fbbf24] transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="px-5 pt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleSwitchMode('wudu')}
            className={`min-h-[44px] flex-1 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold border flex items-center justify-center gap-2 whitespace-nowrap transition-all ${
              mode === 'wudu'
                ? 'bg-gradient-to-r from-[#fbbf24] via-[#e5b869] to-emerald-400 text-slate-950 border-transparent shadow'
                : 'bg-[#031713] border-[#e5b869]/25 text-slate-200 hover:border-[#fbbf24]/50'
            }`}
          >
            <Droplets className="w-4 h-4 shrink-0" />
            <span>خطوات الوضوء ({KID_WUDU_STEPS.length})</span>
          </button>
          <button
            type="button"
            onClick={() => handleSwitchMode('salah')}
            className={`min-h-[44px] flex-1 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold border flex items-center justify-center gap-2 whitespace-nowrap transition-all ${
              mode === 'salah'
                ? 'bg-gradient-to-r from-[#fbbf24] via-[#e5b869] to-emerald-400 text-slate-950 border-transparent shadow'
                : 'bg-[#031713] border-[#e5b869]/25 text-slate-200 hover:border-[#fbbf24]/50'
            }`}
          >
            <BookOpen className="w-4 h-4 shrink-0" />
            <span>خطوات الصلاة ({KID_SALAH_STEPS.length})</span>
          </button>
        </div>

        {/* Step Content */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Step Progress Header */}
          <div className="flex items-center justify-between text-xs text-slate-300 tabular-nums">
            <span className="font-bold text-[#fbbf24]">
              الخطوة {currentStep.stepNumber} من {steps.length}
            </span>
            <span>{mode === 'wudu' ? 'طهارة الوضوء' : 'أركان وسنن الصلاة'}</span>
          </div>

          {/* Step Card */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[#031713] border border-[#e5b869]/35 space-y-4">
            <h4 className="text-xl sm:text-2xl font-bold text-[#fbbf24] font-amiri">
              {currentStep.stepNumber}. {currentStep.titleAr}
            </h4>
            <p className="text-sm sm:text-base text-slate-100 leading-relaxed">
              {currentStep.instructionAr}
            </p>
            {currentStep.phraseAr && (
              <div className="p-4 rounded-xl bg-[#062d24]/80 border border-emerald-500/35 text-center">
                <p className="text-lg sm:text-xl font-amiri font-bold text-emerald-200 leading-loose">
                  ﴿{currentStep.phraseAr}﴾
                </p>
              </div>
            )}
            <div className="pt-2 border-t border-[#e5b869]/15 text-xs sm:text-sm text-[#e5b869]">
              <strong className="text-[#fbbf24]">فائدة لطيفة: </strong>
              <span className="text-slate-300">{currentStep.tipAr}</span>
            </div>
          </div>

          {/* Step Selector Strip */}
          <div className="flex items-center justify-center gap-1.5 flex-wrap">
            {steps.map((s, idx) => (
              <button
                key={s.stepNumber}
                type="button"
                onClick={() => setStepIdx(idx)}
                className={`min-h-[44px] min-w-[44px] rounded-xl text-xs font-bold tabular-nums border transition-colors ${
                  idx === stepIdx
                    ? 'bg-[#fbbf24] text-slate-950 border-[#fbbf24]'
                    : 'bg-[#031713] text-slate-300 border-[#e5b869]/25 hover:border-[#fbbf24]/60'
                }`}
              >
                {s.stepNumber}
              </button>
            ))}
          </div>
        </div>

        {/* Footer Prev / Next Controls */}
        <div className="px-5 py-4 bg-[#03120f] border-t border-[#e5b869]/25 flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={stepIdx === 0}
            onClick={() => setStepIdx((p) => Math.max(0, p - 1))}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#06261f] border border-[#e5b869]/30 text-slate-200 hover:text-[#fbbf24] disabled:opacity-40 text-xs sm:text-sm font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <ChevronRight className="w-4 h-4" />
            <span>الخطوة السابقة</span>
          </button>

          {stepIdx < steps.length - 1 ? (
            <button
              type="button"
              onClick={() => setStepIdx((p) => Math.min(steps.length - 1, p + 1))}
              className="min-h-[44px] px-5 py-2 rounded-xl bg-gradient-to-r from-[#fbbf24] via-[#e5b869] to-emerald-400 text-slate-950 text-xs sm:text-sm font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 shadow"
            >
              <span>الخطوة التالية</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold whitespace-nowrap shrink-0 shadow"
            >
              أتممنا التعلّم ✓
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
