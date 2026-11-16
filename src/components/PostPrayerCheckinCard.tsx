import React, { useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Sparkles,
  X,
} from 'lucide-react';
import {
  ActivePostPrayerWindow,
  CHECKIN_PRAYER_ORDER,
  CheckinPrayerKey,
  DailyCheckinState,
  PrayerCheckinItem,
  calculateDailyCheckinStats,
  getCheckinPrayerNameAr,
} from '../utils/postPrayerCheckinData';
import { adhanPlayer } from '../utils/audioAdhan';

const QUICK_TASBIH_PHASES = [
  { label: 'سبحان الله', target: 33 },
  { label: 'الحمد لله', target: 33 },
  { label: 'الله أكبر', target: 33 },
] as const;

interface PostPrayerCheckinCardProps {
  activeWindow: ActivePostPrayerWindow | null;
  forcedPrayer: { prayerKey: CheckinPrayerKey; prayerNameAr: string } | null;
  onDismissForced?: () => void;
  checkinState: DailyCheckinState;
  onToggleField: (
    prayerKey: CheckinPrayerKey,
    field: keyof PrayerCheckinItem,
    forceValue?: boolean
  ) => void;
}

export const PostPrayerCheckinCard: React.FC<PostPrayerCheckinCardProps> = ({
  activeWindow,
  forcedPrayer,
  onDismissForced,
  checkinState,
  onToggleField,
}) => {
  const [isTasbihOpen, setIsTasbihOpen] = useState(false);
  const [tasbihPhaseIdx, setTasbihPhaseIdx] = useState(0);
  const [tasbihCount, setTasbihCount] = useState(0);
  const [tasbihCompletedBanner, setTasbihCompletedBanner] = useState(false);

  const activeTarget = forcedPrayer
    ? {
        prayerKey: forcedPrayer.prayerKey,
        prayerNameAr: forcedPrayer.prayerNameAr,
        minutesElapsed:
          activeWindow && activeWindow.prayerKey === forcedPrayer.prayerKey
            ? activeWindow.minutesElapsed
            : null,
      }
    : activeWindow
      ? {
          prayerKey: activeWindow.prayerKey,
          prayerNameAr: activeWindow.prayerNameAr,
          minutesElapsed: activeWindow.minutesElapsed,
        }
      : null;

  if (!activeTarget) return null;

  const entry = checkinState.prayers[activeTarget.prayerKey];
  const isAllComplete = entry.fard && entry.adhkar && entry.wird;
  const completedInPrayer = [entry.fard, entry.adhkar, entry.wird].filter(Boolean).length;

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

    // Reached 33 in current phase
    if (tasbihPhaseIdx < QUICK_TASBIH_PHASES.length - 1) {
      setTasbihPhaseIdx((prev) => prev + 1);
      setTasbihCount(0);
      setTasbihCompletedBanner(false);
    } else {
      // Completed full 33x3 = 99 cycle!
      setTasbihPhaseIdx(0);
      setTasbihCount(0);
      setTasbihCompletedBanner(true);
      onToggleField(activeTarget.prayerKey, 'adhkar', true);
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
      dir="rtl"
      className="theme-keep-light relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#111C18] via-[#0B1713] to-[#08120E] border border-[#D4AF37]/55 shadow-[0_14px_40px_rgba(0,0,0,0.45)] p-4 sm:p-5 space-y-4"
    >
      {/* Subtle Top Mihrab Arch Accent Line */}
      <div
        className="absolute inset-x-10 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37]/80 to-transparent pointer-events-none"
        aria-hidden="true"
      />

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-t-full rounded-b-xl bg-[#08241C] border border-[#D4AF37]/60 flex items-center justify-center shrink-0 shadow-[0_0_16px_rgba(212,175,55,0.2)]">
            <Sparkles className="w-4 h-4 text-[#D4AF37]" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-bold font-amiri text-[#D4AF37] leading-snug">
              ✨ متابعة ما بعد صلاة {activeTarget.prayerNameAr}
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-300">
              {activeTarget.minutesElapsed !== null
                ? `مضى ${activeTarget.minutesElapsed} دقيقة على الأذان · أكمل متابعتك بلمسة واحدة`
                : 'نافذة المتابعة السريعة · علّم على ما أتممته بعد الصلاة'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="px-2.5 py-1 rounded-full bg-[#09120F] border border-[#D4AF37]/35 text-[11px] font-mono font-bold text-[#10B981]">
            {completedInPrayer}/3
          </span>
          {forcedPrayer && onDismissForced && (
            <button
              type="button"
              onClick={onDismissForced}
              aria-label="إخفاء بطاقة المتابعة اليدوية"
              className="w-8 h-8 rounded-lg bg-[#09120F] border border-[#D4AF37]/30 text-slate-300 hover:text-[#D4AF37] flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 3 One-Tap Checkboxes */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {[
          {
            field: 'fard' as const,
            icon: '🕌',
            title: 'الفريضة',
            subtitle: `صلاة ${activeTarget.prayerNameAr} حاضراً`,
            checked: entry.fard,
          },
          {
            field: 'adhkar' as const,
            icon: '📿',
            title: 'أذكار الصلاة',
            subtitle: 'أذكار ما بعد الصلاة',
            checked: entry.adhkar,
          },
          {
            field: 'wird' as const,
            icon: '📖',
            title: 'الوِرد / السُّنة',
            subtitle: 'السُّنة الراتبة أو الوِرد اليومي',
            checked: entry.wird,
          },
        ].map((item) => (
          <button
            key={item.field}
            type="button"
            role="checkbox"
            aria-checked={item.checked}
            onClick={() => onToggleField(activeTarget.prayerKey, item.field)}
            className={`min-h-[54px] p-3 rounded-2xl border text-right flex items-center justify-between gap-2.5 transition-all active:scale-[0.98] ${
              item.checked
                ? 'bg-[#08241C] border-[#10B981] ring-1 ring-[#10B981]/50 shadow-[0_0_18px_rgba(16,185,129,0.2)]'
                : 'bg-[#09120F] border-[#D4AF37]/30 hover:border-[#D4AF37]/65'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-lg leading-none shrink-0">{item.icon}</span>
              <div className="min-w-0">
                <div
                  className={`text-xs sm:text-sm font-bold truncate ${
                    item.checked ? 'text-[#10B981]' : 'text-white'
                  }`}
                >
                  {item.title}
                </div>
                <div className="text-[11px] text-slate-400 truncate">{item.subtitle}</div>
              </div>
            </div>

            <span
              className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                item.checked
                  ? 'bg-[#10B981] border-[#34D399] text-slate-950'
                  : 'bg-[#111C18] border-[#D4AF37]/40 text-transparent'
              }`}
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </span>
          </button>
        ))}
      </div>

      {/* All-3 Completion Calm Congratulation Banner */}
      {isAllComplete && (
        <div className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#08241C] via-[#0c362a] to-[#08241C] border border-[#10B981]/60 text-center text-xs sm:text-sm font-bold text-[#10B981] shadow-[0_0_20px_rgba(16,185,129,0.18)]">
          ✨ ما شاء الله! اكتمل ورد صلاة {activeTarget.prayerNameAr} بالكامل
        </div>
      )}

      {/* Collapsible Quick 33x3 Tasbih Toggle & Embedded Touch Tasbih */}
      <div className="pt-1 border-t border-[#D4AF37]/20 space-y-2.5">
        <button
          type="button"
          onClick={() => setIsTasbihOpen((prev) => !prev)}
          aria-expanded={isTasbihOpen}
          className="w-full min-h-[42px] px-4 py-2 rounded-xl bg-[#09120F] hover:bg-[#0e1d18] border border-[#D4AF37]/35 text-xs sm:text-sm font-bold text-[#D4AF37] flex items-center justify-between gap-2 transition-colors"
        >
          <span>📿 عدّاد أذكار ما بعد الصلاة السريع (٣٣×٣)</span>
          {isTasbihOpen ? (
            <ChevronUp className="w-4 h-4 shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 shrink-0" />
          )}
        </button>

        {isTasbihOpen && (
          <div className="p-3.5 rounded-2xl bg-[#09120F] border border-[#D4AF37]/35 space-y-3">
            {/* Phase Pills */}
            <div className="grid grid-cols-3 gap-1.5">
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
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all truncate ${
                      isActive
                        ? 'bg-[#08241C] border-[#10B981] text-[#10B981]'
                        : isDone
                          ? 'bg-[#111C18] border-[#D4AF37]/50 text-[#D4AF37]'
                          : 'bg-[#111C18]/60 border-slate-800 text-slate-400'
                    }`}
                  >
                    {phase.label} {isDone && !isActive ? '✓' : ''}
                  </button>
                );
              })}
            </div>

            {/* Embedded Touch Tap Area */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleTapQuickTasbih}
                className="flex-1 min-h-[56px] px-4 py-3 rounded-2xl bg-gradient-to-r from-[#111C18] via-[#0c2920] to-[#111C18] hover:border-[#10B981] border border-[#D4AF37]/55 flex items-center justify-between gap-3 active:scale-[0.98] transition-all shadow-inner"
              >
                <div className="text-right">
                  <div className="text-base sm:text-xl font-bold font-amiri text-amber-100">
                    {currentPhase.label}
                  </div>
                  <span className="text-[11px] text-slate-400">
                    اضغط للتسبيح · التقدم العام {totalDone99}/99
                  </span>
                </div>
                <div
                  dir="ltr"
                  className="px-3 py-1.5 rounded-xl bg-[#050807] border border-[#10B981]/50 font-mono font-black text-lg text-[#10B981] tabular-nums"
                >
                  {tasbihCount}/33
                </div>
              </button>

              <button
                type="button"
                onClick={handleResetQuickTasbih}
                title="إعادة عداد ٣٣×٣"
                aria-label="إعادة عداد ٣٣×٣"
                className="w-12 h-14 rounded-2xl bg-[#111C18] border border-[#D4AF37]/30 text-slate-300 hover:text-[#D4AF37] flex items-center justify-center transition-colors shrink-0"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="h-1.5 w-full rounded-full bg-[#050807] overflow-hidden border border-[#D4AF37]/20">
              <div
                className="h-full bg-gradient-to-l from-[#D4AF37] to-[#10B981] transition-all duration-200"
                style={{ width: `${Math.min(100, Math.round((tasbihCount / 33) * 100))}%` }}
              />
            </div>

            {tasbihCompletedBanner && (
              <div className="text-[11px] font-bold text-[#10B981] text-center">
                ✓ أتممت التسبيح (٣٣×٣) وتم تعليم «أذكار الصلاة» تلقائياً
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

interface DailyStreakTrackerCardProps {
  checkinState: DailyCheckinState;
  onToggleField: (
    prayerKey: CheckinPrayerKey,
    field: keyof PrayerCheckinItem,
    forceValue?: boolean
  ) => void;
  defaultExpanded?: boolean;
}

export const DailyStreakTrackerCard: React.FC<DailyStreakTrackerCardProps> = ({
  checkinState,
  onToggleField,
  defaultExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const stats = calculateDailyCheckinStats(checkinState);
  const now = new Date();

  return (
    <div
      dir="rtl"
      className="theme-keep-light rounded-2xl bg-[#111C18]/95 border border-[#D4AF37]/40 shadow-[0_10px_28px_rgba(0,0,0,0.35)] overflow-hidden"
    >
      {/* Compact Single-Line Expandable Horizontal Bar */}
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        aria-expanded={isExpanded}
        className="w-full min-h-[52px] px-4 py-2.5 flex items-center justify-between gap-3 text-right hover:bg-[#0e1915] transition-colors"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-sm sm:text-base font-bold font-amiri text-[#D4AF37] whitespace-nowrap truncate">
            📊 سجل الاستقامة اليومي
          </span>
          <span className="text-[#D4AF37]/50 text-xs shrink-0" aria-hidden="true">
            ·
          </span>
          <span className="text-xs font-mono font-bold text-slate-300 tabular-nums whitespace-nowrap shrink-0">
            {stats.completedCount}/{stats.totalCount}
          </span>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <div className="hidden xs:block sm:block w-16 h-1.5 rounded-full bg-[#09120F] border border-[#D4AF37]/25 overflow-hidden">
            <div
              className="h-full bg-gradient-to-l from-[#D4AF37] to-[#10B981] transition-all duration-300"
              style={{ width: `${stats.percent}%` }}
            />
          </div>
          <span className="text-xs font-mono font-black text-[#10B981] tabular-nums">
            {stats.percent}%
          </span>
          <span className="w-7 h-7 rounded-lg bg-[#09120F] border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </span>
        </div>
      </button>

      {/* Expandable 5 Prayers Details */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-[#D4AF37]/20 space-y-3">
          <div className="h-1.5 w-full rounded-full bg-[#09120F] border border-[#D4AF37]/25 overflow-hidden">
            <div
              className="h-full bg-gradient-to-l from-[#D4AF37] via-[#e5b869] to-[#10B981] transition-all duration-300"
              style={{ width: `${stats.percent}%` }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
            {CHECKIN_PRAYER_ORDER.map((prayerKey) => {
              const item = checkinState.prayers[prayerKey];
              const prayerLabel = getCheckinPrayerNameAr(prayerKey, now);
              const allDone = item.fard && item.adhkar && item.wird;
              const prayerDoneCount = [item.fard, item.adhkar, item.wird].filter(Boolean).length;

              return (
                <div
                  key={prayerKey}
                  className={`p-2.5 rounded-xl border transition-all space-y-2 ${
                    allDone
                      ? 'bg-[#08241C] border-[#10B981]/70'
                      : 'bg-[#09120F] border-[#D4AF37]/25'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-xs sm:text-sm font-bold text-white font-amiri">
                      {prayerLabel}
                    </span>
                    <span
                      className={`text-[11px] font-mono tabular-nums font-bold ${
                        allDone ? 'text-[#10B981]' : 'text-slate-400'
                      }`}
                    >
                      {allDone ? '✓ مكتمل' : `${prayerDoneCount}/3`}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { field: 'fard' as const, icon: '🕌', label: 'الفريضة', active: item.fard },
                      { field: 'adhkar' as const, icon: '📿', label: 'الأذكار', active: item.adhkar },
                      { field: 'wird' as const, icon: '📖', label: 'الوِرد', active: item.wird },
                    ].map((badge) => (
                      <button
                        key={badge.field}
                        type="button"
                        aria-pressed={badge.active}
                        title={`${badge.label} (${prayerLabel})`}
                        onClick={() => onToggleField(prayerKey, badge.field)}
                        className={`min-h-[44px] px-1.5 py-1 rounded-lg border text-[11px] font-bold flex flex-col items-center justify-center gap-0.5 transition-all active:scale-95 ${
                          badge.active
                            ? 'bg-[#10B981]/20 border-[#10B981] text-[#10B981]'
                            : 'bg-[#111C18] border-[#D4AF37]/25 text-slate-400 hover:border-[#D4AF37]/60 hover:text-slate-200'
                        }`}
                      >
                        <span className="leading-none text-sm">{badge.icon}</span>
                        <span className="text-[10px] leading-none whitespace-nowrap">{badge.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
