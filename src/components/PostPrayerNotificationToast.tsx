import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, Check, Heart, Sparkles, Sun, X } from 'lucide-react';
import {
  CheckinPrayerKey,
  PostPrayerCompletionVerse,
  pickRandomPostPrayerVerse,
} from '../utils/postPrayerCheckinData';
import { adhanPlayer } from '../utils/audioAdhan';

export interface PostPrayerNotificationToastProps {
  prayerKey: CheckinPrayerKey;
  prayerNameAr: string;
  dateKey: string;
  isTest?: boolean;
  includeWird: boolean;
  includeAdhkar: boolean;
  includeSunnah: boolean;
  wirdCompleted: boolean;
  wirdSummary?: string;
  adhkarCompleted: boolean;
  sunnahCompleted: boolean;
  sunnahLabel: string;
  onToggleWird: () => void;
  onToggleAdhkar: () => void;
  onToggleSunnah: () => void;
  onOpenDetails: () => void;
  onClose: () => void;
}

interface ChecklistRow {
  id: 'wird' | 'adhkar' | 'sunnah';
  title: string;
  subtitle: string;
  completed: boolean;
  onToggle: () => void;
  icon: React.ReactNode;
}

const AUTO_DISMISS_MS = 6000;
const LAST_VERSE_STORAGE_KEY = 'post_prayer_last_verse_id';

const toArabicDigits = (num: number): string =>
  String(num).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)] || d);

export const PostPrayerNotificationToast: React.FC<PostPrayerNotificationToastProps> = ({
  prayerKey,
  prayerNameAr,
  dateKey,
  isTest = false,
  includeWird,
  includeAdhkar,
  includeSunnah,
  wirdCompleted,
  wirdSummary,
  adhkarCompleted,
  sunnahCompleted,
  sunnahLabel,
  onToggleWird,
  onToggleAdhkar,
  onToggleSunnah,
  onOpenDetails,
  onClose,
}) => {
  const [stage, setStage] = useState<'checklist' | 'verse'>('checklist');
  const [selectedVerse, setSelectedVerse] = useState<PostPrayerCompletionVerse | null>(null);
  const [progressFraction, setProgressFraction] = useState<number>(1);
  const [isClosing, setIsClosing] = useState<boolean>(false);
  const [hasInteracted, setHasInteracted] = useState<boolean>(false);

  const transitionTimerRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);
  const fadeOutTimerRef = useRef<number | null>(null);

  const clearAllTimers = () => {
    if (transitionTimerRef.current !== null) {
      window.clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }
    if (countdownIntervalRef.current !== null) {
      window.clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (fadeOutTimerRef.current !== null) {
      window.clearTimeout(fadeOutTimerRef.current);
      fadeOutTimerRef.current = null;
    }
  };

  // Reset stage when a fresh prayer notification opens
  useEffect(() => {
    clearAllTimers();
    setStage('checklist');
    setSelectedVerse(null);
    setProgressFraction(1);
    setIsClosing(false);
    setHasInteracted(false);
    return () => clearAllTimers();
  }, [prayerKey, dateKey, isTest]);

  const checklistRows = useMemo<ChecklistRow[]>(() => {
    const anyEnabled = includeWird || includeAdhkar || includeSunnah;
    const showWird = anyEnabled ? includeWird : true;
    const showAdhkar = anyEnabled ? includeAdhkar : true;
    const showSunnah = anyEnabled ? includeSunnah : true;

    const rows: ChecklistRow[] = [];

    if (showWird) {
      rows.push({
        id: 'wird',
        title: 'الوِرد القرآني اليومي',
        subtitle: wirdSummary ? `مقرر الصلاة: ${wirdSummary}` : 'قراءة وردك المخصص لهذه الصلاة',
        completed: wirdCompleted,
        onToggle: onToggleWird,
        icon: <BookOpen className="w-4 h-4 shrink-0" />,
      });
    }

    if (showAdhkar) {
      rows.push({
        id: 'adhkar',
        title: 'أذكار ما بعد الصلاة',
        subtitle: 'الاستغفار، آية الكرسي، والتسبيح المأثور',
        completed: adhkarCompleted,
        onToggle: onToggleAdhkar,
        icon: <Heart className="w-4 h-4 shrink-0" />,
      });
    }

    if (showSunnah) {
      rows.push({
        id: 'sunnah',
        title: 'السُّنة الراتبة',
        subtitle: sunnahLabel,
        completed: sunnahCompleted,
        onToggle: onToggleSunnah,
        icon: <Sun className="w-4 h-4 shrink-0" />,
      });
    }

    return rows;
  }, [
    includeWird,
    includeAdhkar,
    includeSunnah,
    wirdCompleted,
    wirdSummary,
    adhkarCompleted,
    sunnahCompleted,
    sunnahLabel,
    onToggleWird,
    onToggleAdhkar,
    onToggleSunnah,
  ]);

  const completedCount = checklistRows.filter((row) => row.completed).length;
  const totalCount = checklistRows.length;
  const allCompleted = totalCount > 0 && completedCount === totalCount;

  const triggerManualClose = () => {
    clearAllTimers();
    setIsClosing(true);
    fadeOutTimerRef.current = window.setTimeout(() => {
      onClose();
    }, 240);
  };

  const revealCompletionVerse = () => {
    let lastId: string | undefined;
    try {
      lastId = localStorage.getItem(LAST_VERSE_STORAGE_KEY) || undefined;
    } catch {
      lastId = undefined;
    }
    const verse = pickRandomPostPrayerVerse(lastId);
    try {
      localStorage.setItem(LAST_VERSE_STORAGE_KEY, verse.id);
    } catch {
      // ignore storage errors
    }
    setSelectedVerse(verse);
    setProgressFraction(1);
    setStage('verse');
    adhanPlayer.playChime();
  };

  // Auto-transition to Quranic verse once user finishes all enabled checklist items
  useEffect(() => {
    if (stage !== 'checklist') return;
    if (!hasInteracted || !allCompleted) {
      if (transitionTimerRef.current !== null) {
        window.clearTimeout(transitionTimerRef.current);
        transitionTimerRef.current = null;
      }
      return;
    }

    transitionTimerRef.current = window.setTimeout(() => {
      revealCompletionVerse();
    }, 350);

    return () => {
      if (transitionTimerRef.current !== null) {
        window.clearTimeout(transitionTimerRef.current);
        transitionTimerRef.current = null;
      }
    };
  }, [stage, hasInteracted, allCompleted]);

  // Countdown & auto-dismiss after verse stage appears
  useEffect(() => {
    if (stage !== 'verse') return;

    const startedAt = Date.now();
    countdownIntervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, 1 - elapsed / AUTO_DISMISS_MS);
      setProgressFraction(remaining);
      if (elapsed >= AUTO_DISMISS_MS) {
        if (countdownIntervalRef.current !== null) {
          window.clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
        setIsClosing(true);
        fadeOutTimerRef.current = window.setTimeout(() => {
          onClose();
        }, 260);
      }
    }, 50);

    return () => {
      if (countdownIntervalRef.current !== null) {
        window.clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      if (fadeOutTimerRef.current !== null) {
        window.clearTimeout(fadeOutTimerRef.current);
        fadeOutTimerRef.current = null;
      }
    };
  }, [stage, onClose]);

  const remainingSeconds = Math.max(1, Math.ceil((progressFraction * AUTO_DISMISS_MS) / 1000));

  return (
    <div
      dir="rtl"
      role="status"
      aria-live="polite"
      className={`theme-keep-light fixed top-4 left-1/2 -translate-x-1/2 z-[95] max-w-md w-[calc(100vw-1.5rem)] rounded-3xl bg-[#111C18]/98 border-2 border-[#D4AF37]/80 shadow-[0_20px_55px_rgba(0,0,0,0.75),0_0_32px_rgba(212,175,55,0.25)] p-4 sm:p-5 text-right backdrop-blur-xl transition-all duration-200 ${
        isClosing ? 'opacity-0 -translate-y-2 pointer-events-none' : 'opacity-100 translate-y-0'
      }`}
    >
      {/* Top Mihrab Gold Line */}
      <div
        className="absolute inset-x-12 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent pointer-events-none"
        aria-hidden="true"
      />

      {stage === 'checklist' ? (
        <div className="space-y-3.5">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-[11px] font-bold text-[#10B981]">
                <span>متابعة ما بعد صلاة {prayerNameAr}</span>
                {isTest && <span className="text-[#D4AF37]">· معاينة تجريبية</span>}
              </div>
              <h4 className="text-base sm:text-lg font-bold font-amiri text-[#D4AF37] leading-snug mt-0.5">
                تقبّل الله طاعتك — علّم على ما أتممته
              </h4>
            </div>

            <button
              type="button"
              onClick={triggerManualClose}
              className="min-w-[44px] min-h-[44px] -mt-1 -ml-1 rounded-xl text-slate-300 hover:text-[#D4AF37] hover:bg-[#08241C] flex items-center justify-center transition-colors shrink-0"
              aria-label="إغلاق الإشعار"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Interactive Checklist */}
          <div className="space-y-2">
            {checklistRows.map((row) => (
              <button
                key={row.id}
                type="button"
                role="checkbox"
                aria-checked={row.completed}
                onClick={() => {
                  setHasInteracted(true);
                  row.onToggle();
                }}
                className={`w-full min-h-[52px] px-3.5 py-2.5 rounded-2xl border text-right transition-colors flex items-center justify-between gap-3 ${
                  row.completed
                    ? 'bg-[#08241C] border-[#10B981]/80 text-white'
                    : 'bg-[#09120F]/90 border-[#D4AF37]/30 hover:border-[#D4AF37]/70 text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors ${
                      row.completed
                        ? 'bg-[#10B981] border-[#10B981] text-slate-950'
                        : 'bg-[#111C18] border-[#D4AF37]/60 text-transparent'
                    }`}
                    aria-hidden="true"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                  </span>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-sm font-bold leading-snug">
                      <span className={row.completed ? 'text-[#10B981]' : 'text-[#D4AF37]'}>
                        {row.icon}
                      </span>
                      <span className={row.completed ? 'text-[#10B981]' : 'text-white'}>
                        {row.title}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 truncate mt-0.5">{row.subtitle}</p>
                  </div>
                </div>

                <span
                  className={`text-[11px] font-bold shrink-0 ${
                    row.completed ? 'text-[#10B981]' : 'text-slate-400'
                  }`}
                >
                  {row.completed ? 'تم ✓' : 'قيد المتابعة'}
                </span>
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <span className="text-xs font-bold text-slate-300">
              المُنجز:{' '}
              <span className="text-[#D4AF37] font-mono">
                {toArabicDigits(completedCount)}/{toArabicDigits(totalCount)}
              </span>
            </span>

            <div className="flex items-center gap-2">
              {allCompleted && !hasInteracted && (
                <button
                  type="button"
                  onClick={() => revealCompletionVerse()}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#10B981] to-emerald-500 text-slate-950 font-black text-xs shadow hover:brightness-105 transition-all flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>تأكيد وعرض الآية</span>
                </button>
              )}
              <button
                type="button"
                onClick={onOpenDetails}
                className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#09120F] border border-[#D4AF37]/45 hover:border-[#D4AF37] text-[#D4AF37] font-bold text-xs transition-colors"
              >
                المسبحة والتفاصيل
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3.5">
          {/* Completion Verse Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-[#08241C] border border-[#10B981]/60 flex items-center justify-center text-[#10B981] shrink-0">
                <Check className="w-5 h-5 stroke-[2.75]" />
              </div>
              <div className="min-w-0">
                <h4 className="text-base sm:text-lg font-bold font-amiri text-[#10B981] leading-snug">
                  تقبّل الله منك صلاة {prayerNameAr}
                </h4>
                <p className="text-[11px] text-slate-300">
                  أتممت متابعتك المباركة بنجاح
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={triggerManualClose}
              className="min-w-[44px] min-h-[44px] -mt-1 -ml-1 rounded-xl text-slate-300 hover:text-[#D4AF37] hover:bg-[#08241C] flex items-center justify-center transition-colors shrink-0"
              aria-label="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quranic Verse Showcase */}
          {selectedVerse && (
            <div className="rounded-2xl bg-gradient-to-br from-[#08241C] via-[#091511] to-[#06100D] border border-[#D4AF37]/50 p-4 text-center space-y-2.5">
              <p className="font-amiri text-lg sm:text-xl leading-loose text-white">
                ﴿ {selectedVerse.ayahText} ﴾
              </p>
              <div className="text-xs font-bold text-[#D4AF37]">
                سورة {selectedVerse.surahName} · الآية {toArabicDigits(selectedVerse.ayahNumber)}
              </div>
            </div>
          )}

          {/* Auto-Dismiss Countdown Bar & Close */}
          <div className="space-y-2">
            <div className="w-full h-1.5 rounded-full bg-[#09120F] overflow-hidden border border-[#D4AF37]/20">
              <div
                className="h-full bg-gradient-to-r from-[#D4AF37] to-[#10B981] origin-right transition-transform duration-75"
                style={{ transform: `scaleX(${progressFraction})` }}
              />
            </div>

            <div className="flex items-center justify-between gap-2 text-[11px] text-slate-300">
              <span>يختفي تلقائياً خلال {toArabicDigits(remainingSeconds)} ثوانٍ</span>
              <button
                type="button"
                onClick={triggerManualClose}
                className="min-h-[44px] px-3 py-1.5 rounded-xl text-[#D4AF37] hover:bg-[#08241C] font-bold transition-colors"
              >
                إغلاق الآن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
