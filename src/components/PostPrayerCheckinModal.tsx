import React, { useEffect, useState } from 'react';
import { BookOpen, Check, Heart, RotateCcw, Sparkles, Sun, X } from 'lucide-react';
import {
  CheckinPrayerKey,
  DailyCheckinState,
} from '../utils/postPrayerCheckinData';
import { adhanPlayer } from '../utils/audioAdhan';

const QUICK_TASBIH_PHASES = [
  { label: 'سبحان الله', target: 33 },
  { label: 'الحمد لله', target: 33 },
  { label: 'الله أكبر', target: 33 },
] as const;

const toArabicDigits = (num: number): string =>
  String(num).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)] || d);

export interface PostPrayerCheckinModalProps {
  isOpen: boolean;
  prayerKey: CheckinPrayerKey;
  prayerNameAr: string;
  onClose: () => void;
  checkinState: DailyCheckinState;
  wirdCompleted: boolean;
  wirdSummary?: string;
  sunnahCompleted: boolean;
  sunnahLabel: string;
  onToggleFard: () => void;
  onToggleAdhkar: (forceTrue?: boolean) => void;
  onToggleWird: () => void;
  onToggleSunnah: () => void;
}

export const PostPrayerCheckinModal: React.FC<PostPrayerCheckinModalProps> = ({
  isOpen,
  prayerKey,
  prayerNameAr,
  onClose,
  checkinState,
  wirdCompleted,
  wirdSummary,
  sunnahCompleted,
  sunnahLabel,
  onToggleFard,
  onToggleAdhkar,
  onToggleWird,
  onToggleSunnah,
}) => {
  const [tasbihPhaseIdx, setTasbihPhaseIdx] = useState(0);
  const [tasbihCount, setTasbihCount] = useState(0);
  const [tasbihCompletedBanner, setTasbihCompletedBanner] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    setTasbihPhaseIdx(0);
    setTasbihCount(0);
    setTasbihCompletedBanner(false);
  }, [prayerKey, isOpen]);

  if (!isOpen) return null;

  const entry = checkinState.prayers[prayerKey];
  const items = [
    {
      id: 'fard' as const,
      title: 'الفريضة',
      subtitle: `صلاة ${prayerNameAr} حاضراً`,
      checked: entry.fard,
      onToggle: onToggleFard,
      icon: <Sparkles className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'adhkar' as const,
      title: 'أذكار ما بعد الصلاة',
      subtitle: 'الاستغفار، آية الكرسي، والتسبيح المأثور',
      checked: entry.adhkar,
      onToggle: () => onToggleAdhkar(),
      icon: <Heart className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'wird' as const,
      title: 'الوِرد القرآني اليومي',
      subtitle: wirdSummary ? `مقرر الصلاة: ${wirdSummary}` : 'قراءة وردك المخصص لهذه الصلاة',
      checked: wirdCompleted,
      onToggle: onToggleWird,
      icon: <BookOpen className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'sunnah' as const,
      title: 'السُّنة الراتبة',
      subtitle: sunnahLabel,
      checked: sunnahCompleted,
      onToggle: onToggleSunnah,
      icon: <Sun className="w-4 h-4 shrink-0" />,
    },
  ];

  const completedCount = items.filter((item) => item.checked).length;
  const allComplete = completedCount === items.length;
  const currentPhase = QUICK_TASBIH_PHASES[tasbihPhaseIdx];
  const totalDone99 = tasbihPhaseIdx * 33 + tasbihCount;

  const handleTapQuickTasbih = () => {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(12);
      } catch {
        // ignore vibration errors
      }
    }

    const nextCount = tasbihCount + 1;
    if (nextCount < currentPhase.target) {
      setTasbihCount(nextCount);
      setTasbihCompletedBanner(false);
      return;
    }

    if (tasbihPhaseIdx < QUICK_TASBIH_PHASES.length - 1) {
      setTasbihPhaseIdx((prev) => prev + 1);
      setTasbihCount(0);
      setTasbihCompletedBanner(false);
    } else {
      setTasbihPhaseIdx(0);
      setTasbihCount(0);
      setTasbihCompletedBanner(true);
      onToggleAdhkar(true);
      adhanPlayer.playChime();
    }
  };

  const handleResetQuickTasbih = () => {
    setTasbihPhaseIdx(0);
    setTasbihCount(0);
    setTasbihCompletedBanner(false);
  };

  return (
    <div
      className="fixed inset-0 z-[105] bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      dir="rtl"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="post-prayer-modal-title"
        className="theme-keep-light relative w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-3xl bg-[#111C18] border-2 border-[#D4AF37]/75 shadow-[0_24px_60px_rgba(0,0,0,0.8)] p-4 sm:p-6 space-y-4 text-right"
      >
        {/* Top Mihrab Gold Accent Line */}
        <div
          className="absolute inset-x-12 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent pointer-events-none"
          aria-hidden="true"
        />

        {/* Modal Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-bold text-[#10B981]">
              تفاصيل المتابعة · {toArabicDigits(completedCount)}/{toArabicDigits(items.length)} مكتمل
            </div>
            <h3
              id="post-prayer-modal-title"
              className="text-lg sm:text-xl font-bold font-amiri text-[#D4AF37] leading-snug mt-0.5"
            >
              متابعة ما بعد صلاة {prayerNameAr}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق نافذة المتابعة"
            className="min-w-[44px] min-h-[44px] -mt-1 -ml-1 rounded-xl bg-[#09120F] border border-[#D4AF37]/30 text-slate-300 hover:text-[#D4AF37] hover:border-[#D4AF37]/70 flex items-center justify-center transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4 Synced Checkboxes */}
        <div className="space-y-2.5">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              role="checkbox"
              aria-checked={item.checked}
              onClick={item.onToggle}
              className={`w-full min-h-[52px] px-3.5 py-2.5 rounded-2xl border text-right transition-colors flex items-center justify-between gap-3 ${
                item.checked
                  ? 'bg-[#08241C] border-[#10B981]/80 text-white'
                  : 'bg-[#09120F] border-[#D4AF37]/30 hover:border-[#D4AF37]/70 text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors ${
                    item.checked
                      ? 'bg-[#10B981] border-[#10B981] text-slate-950'
                      : 'bg-[#111C18] border-[#D4AF37]/60 text-transparent'
                  }`}
                  aria-hidden="true"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                </span>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-sm font-bold leading-snug">
                    <span className={item.checked ? 'text-[#10B981]' : 'text-[#D4AF37]'}>
                      {item.icon}
                    </span>
                    <span className={item.checked ? 'text-[#10B981]' : 'text-white'}>
                      {item.title}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 truncate mt-0.5">{item.subtitle}</p>
                </div>
              </div>

              <span
                className={`text-[11px] font-bold shrink-0 ${
                  item.checked ? 'text-[#10B981]' : 'text-slate-400'
                }`}
              >
                {item.checked ? 'تم ✓' : 'قيد المتابعة'}
              </span>
            </button>
          ))}
        </div>

        {allComplete && (
          <div className="px-4 py-2.5 rounded-2xl bg-[#08241C] border border-[#10B981]/60 text-center text-xs sm:text-sm font-bold text-[#10B981]">
            ما شاء الله! أتممت متابعة صلاة {prayerNameAr} بالكامل
          </div>
        )}

        {/* Quick 33x3 Tasbih Counter */}
        <div className="pt-3 border-t border-[#D4AF37]/20 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs sm:text-sm font-bold text-[#D4AF37]">
              عدّاد أذكار ما بعد الصلاة السريع (٣٣×٣)
            </span>
            <span className="text-[11px] text-slate-300 font-mono tabular-nums">
              {toArabicDigits(totalDone99)}/٩٩
            </span>
          </div>

          {/* Phase Selector */}
          <div className="grid grid-cols-3 gap-2">
            {QUICK_TASBIH_PHASES.map((phase, idx) => {
              const isDone = idx < tasbihPhaseIdx || (tasbihCompletedBanner && entry.adhkar);
              const isActive = idx === tasbihPhaseIdx;
              return (
                <button
                  key={phase.label}
                  type="button"
                  onClick={() => {
                    setTasbihPhaseIdx(idx);
                    setTasbihCount(0);
                    setTasbihCompletedBanner(false);
                  }}
                  className={`min-h-[40px] py-1.5 px-2 rounded-xl text-xs font-bold border transition-colors truncate ${
                    isActive
                      ? 'bg-[#08241C] border-[#10B981] text-[#10B981]'
                      : isDone
                        ? 'bg-[#09120F] border-[#D4AF37]/50 text-[#D4AF37]'
                        : 'bg-[#09120F]/70 border-slate-700 text-slate-400'
                  }`}
                >
                  {phase.label} {isDone && !isActive ? '✓' : ''}
                </button>
              );
            })}
          </div>

          {/* Touch Tap Area */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleTapQuickTasbih}
              className="flex-1 min-h-[60px] px-4 py-3 rounded-2xl bg-gradient-to-r from-[#09120F] via-[#0c2920] to-[#09120F] hover:border-[#10B981] border border-[#D4AF37]/55 flex items-center justify-between gap-3 active:scale-[0.98] transition-transform"
            >
              <div className="text-right">
                <div className="text-base sm:text-lg font-bold font-amiri text-amber-100">
                  {currentPhase.label}
                </div>
                <span className="text-[11px] text-slate-300">
                  اضغط للتسبيح · التقدم العام {totalDone99}/99
                </span>
              </div>
              <div
                dir="ltr"
                className="px-3 py-1.5 rounded-xl bg-[#050807] border border-[#10B981]/50 font-mono font-black text-lg text-[#10B981] tabular-nums shrink-0"
              >
                {tasbihCount}/33
              </div>
            </button>

            <button
              type="button"
              onClick={handleResetQuickTasbih}
              title="إعادة عداد ٣٣×٣"
              aria-label="إعادة عداد ٣٣×٣"
              className="min-w-[48px] min-h-[60px] rounded-2xl bg-[#09120F] border border-[#D4AF37]/30 text-slate-300 hover:text-[#D4AF37] flex items-center justify-center transition-colors shrink-0"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <div className="h-1.5 w-full rounded-full bg-[#050807] overflow-hidden border border-[#D4AF37]/20">
            <div
              className="h-full bg-gradient-to-r from-[#D4AF37] to-[#10B981] origin-right transition-transform duration-150"
              style={{ transform: `scaleX(${Math.min(1, tasbihCount / 33)})` }}
            />
          </div>

          {tasbihCompletedBanner && (
            <div className="text-xs font-bold text-[#10B981] text-center">
              ✓ أتممت التسبيح (٣٣×٣) وتم تعليم «أذكار ما بعد الصلاة» تلقائياً
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
