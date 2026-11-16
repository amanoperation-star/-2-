import React, { useEffect, useRef, useState } from 'react';
import {
  Award,
  BookOpen,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  RotateCw,
  Sparkles,
  Trophy,
  X,
} from 'lucide-react';
import {
  FORGOTTEN_SUNNAH_LIBRARY,
  SUNNAH_MASTERY_THRESHOLD,
  SUNNAH_WEEK_DAYS,
  SunnahRadarState,
  SunnahWeekDayKey,
  cycleNextSunnah,
  getCurrentSunnahWeekKey,
  getSunnahById,
  getTodaySunnahDayMeta,
  loadSunnahRadarState,
  saveSunnahRadarState,
  toggleSunnahDayCompletion,
} from '../utils/sunnahRadarData';
import { toArabicDigits } from '../utils/khatmaData';
import { adhanPlayer } from '../utils/audioAdhan';

export const SunnahRadarCard: React.FC = () => {
  const [radarState, setRadarState] = useState<SunnahRadarState>(() => loadSunnahRadarState());
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isHadithOpen, setIsHadithOpen] = useState<boolean>(false);
  const [isMasteredOpen, setIsMasteredOpen] = useState<boolean>(false);
  const dropdownContainerRef = useRef<HTMLDivElement | null>(null);

  // Persist every state transition to localStorage (mihrab_sunnah_radar_v1)
  useEffect(() => {
    saveSunnahRadarState(radarState);
  }, [radarState]);

  // Keep week synchronized if the app stays open across Saturday midnight
  useEffect(() => {
    const syncWeekInterval = window.setInterval(() => {
      const freshWeekKey = getCurrentSunnahWeekKey(new Date());
      setRadarState((prev) => {
        if (prev.weekKey === freshWeekKey) return prev;
        return loadSunnahRadarState(new Date());
      });
    }, 60_000);
    return () => window.clearInterval(syncWeekInterval);
  }, []);

  // Close mastered dropdown on outside click
  useEffect(() => {
    if (!isMasteredOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (
        dropdownContainerRef.current &&
        !dropdownContainerRef.current.contains(e.target as Node)
      ) {
        setIsMasteredOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isMasteredOpen]);

  // Close modal on Escape key
  useEffect(() => {
    if (!isModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMasteredOpen(false);
        setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  const activeSunnah = getSunnahById(radarState.selectedSunnahId);
  const todayMeta = getTodaySunnahDayMeta(new Date());
  const weekMap = radarState.weeklyProgress[radarState.weekKey] || {};
  const completedDays: SunnahWeekDayKey[] = Array.isArray(weekMap[activeSunnah.id])
    ? weekMap[activeSunnah.id]
    : [];

  const completedCount = completedDays.length;
  const progressFraction = Math.min(1, completedCount / 7);
  const isTodayCompleted = completedDays.includes(todayMeta.key);
  const isMasteredThisWeek = completedCount >= SUNNAH_MASTERY_THRESHOLD;
  const masteredCount = radarState.masteredSunnahs.length;

  const handleToggleDay = (dayKey: SunnahWeekDayKey, forceValue?: boolean) => {
    const wasDone = completedDays.includes(dayKey);
    const willBeDone = forceValue !== undefined ? forceValue : !wasDone;
    if (willBeDone) {
      adhanPlayer.playChime();
    }
    setRadarState((prev) =>
      toggleSunnahDayCompletion(prev, activeSunnah.id, dayKey, forceValue)
    );
  };

  const handleCycleSunnah = () => {
    setRadarState((prev) => cycleNextSunnah(prev));
    setIsHadithOpen(false);
  };

  const handleSelectMasteredSunnah = (sunnahId: string) => {
    setRadarState((prev) => ({
      ...prev,
      selectedSunnahId: sunnahId,
    }));
    setIsMasteredOpen(false);
    setIsHadithOpen(false);
  };

  const currentLibraryIndex =
    FORGOTTEN_SUNNAH_LIBRARY.findIndex((s) => s.id === activeSunnah.id) + 1;

  return (
    <>
      {/* Prominent Compact Top Spotlight Box */}
      <section
        dir="rtl"
        aria-label="مربع سُنة الأسبوع المهجورة"
        className="theme-keep-light relative rounded-2xl bg-gradient-to-l from-[#111C18] via-[#0F1E19] to-[#111C18] border border-[#D4AF37]/65 hover:border-[#D4AF37] shadow-[0_12px_32px_rgba(0,0,0,0.42),0_0_20px_rgba(212,175,55,0.12)] px-3.5 py-3 sm:px-4 sm:py-3.5 text-right transition-colors"
      >
        <div
          className="absolute inset-x-10 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37]/85 to-transparent pointer-events-none"
          aria-hidden="true"
        />

        <div className="flex items-center justify-between gap-2.5 sm:gap-3">
          {/* Main Interactive Trigger to Open Sunnah Modal */}
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex-1 min-w-0 min-h-[48px] flex items-center gap-3 text-right group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] rounded-xl"
            aria-label={`فتح تفاصيل سُنة الأسبوع: ${activeSunnah.title}`}
          >
            <div className="w-11 h-11 rounded-xl bg-[#08241C] border border-[#D4AF37]/55 flex items-center justify-center text-xl shrink-0 shadow-[0_0_16px_rgba(212,175,55,0.16)] group-hover:border-[#D4AF37] transition-colors">
              <span aria-hidden="true">{activeSunnah.icon}</span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] font-bold">
                <span className="inline-flex items-center gap-1 text-[#D4AF37] whitespace-nowrap">
                  <Sparkles className="w-3 h-3 shrink-0" />
                  <span>سُنة الأسبوع المهجورة</span>
                </span>
                <span className="text-[#D4AF37]/50" aria-hidden="true">·</span>
                <span className="text-slate-300 font-mono tabular-nums whitespace-nowrap">
                  {toArabicDigits(completedCount)}/٧ أيام
                </span>
                {isMasteredThisWeek && (
                  <>
                    <span className="text-[#D4AF37]/50" aria-hidden="true">·</span>
                    <span className="text-[#F3CA63] whitespace-nowrap">وسام الإحياء</span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                <h3 className="text-sm sm:text-base font-bold font-amiri text-white group-hover:text-[#F3CA63] transition-colors truncate">
                  {activeSunnah.title}
                </h3>
                <ChevronLeft className="w-4 h-4 text-[#D4AF37]/80 shrink-0 group-hover:-translate-x-0.5 transition-transform" />
              </div>
            </div>
          </button>

          {/* Quick 1-Tap Today Action Button */}
          <button
            type="button"
            onClick={() => handleToggleDay(todayMeta.key)}
            aria-pressed={isTodayCompleted}
            className={`min-h-[44px] px-3 sm:px-3.5 py-2 rounded-xl border text-xs font-bold whitespace-nowrap shrink-0 flex items-center gap-1.5 transition-colors active:scale-[0.98] ${
              isTodayCompleted
                ? 'bg-[#08241C] border-[#10B981]/80 text-[#10B981]'
                : 'bg-[#D4AF37] hover:bg-[#e5c150] border-[#F3CA63] text-[#0A1310] shadow-[0_4px_14px_rgba(212,175,55,0.25)]'
            }`}
          >
            {isTodayCompleted ? (
              <>
                <Check className="w-4 h-4 stroke-[3] shrink-0" />
                <span>تم اليوم</span>
              </>
            ) : (
              <span>أحييتُها اليوم</span>
            )}
          </button>
        </div>

        {/* Subtle Hairline Weekly Progress Bar */}
        <div className="mt-2.5 h-1 w-full rounded-full bg-[#08120F] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-l from-[#D4AF37] to-[#10B981] origin-right transition-transform duration-300"
            style={{ transform: `scaleX(${progressFraction})` }}
          />
        </div>
      </section>

      {/* Full Sunnah Details & 7-Day Tracker Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-[105] bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsMasteredOpen(false);
              setIsModalOpen(false);
            }
          }}
          dir="rtl"
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="sunnah-radar-modal-title"
            className="theme-keep-light relative w-full max-w-xl max-h-[88vh] overflow-y-auto rounded-3xl bg-[#111C18] border-2 border-[#D4AF37]/65 shadow-[0_24px_60px_rgba(0,0,0,0.8)] p-4 sm:p-6 space-y-5 text-right"
          >
            <div
              className="absolute inset-x-12 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37]/85 to-transparent pointer-events-none"
              aria-hidden="true"
            />

            {/* Header Row: Title + Mastered Dropdown + Switch Sunnah + Close */}
            <div className="relative z-20 flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex flex-wrap items-center gap-2 min-w-0">
                <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#D4AF37] whitespace-nowrap">
                  <Sparkles className="w-4 h-4 text-[#D4AF37] shrink-0" />
                  <span>سُنة الأسبوع المهجورة</span>
                </span>

                <div className="relative" ref={dropdownContainerRef}>
                  <button
                    type="button"
                    onClick={() => setIsMasteredOpen((prev) => !prev)}
                    aria-expanded={isMasteredOpen}
                    className="min-h-[44px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#162520] hover:bg-[#1b2e27] border border-[#D4AF37]/40 hover:border-[#D4AF37] text-xs font-bold text-[#F3CA63] transition-colors whitespace-nowrap shrink-0"
                    title="عرض قائمة السُّنن التي أتممتها وأتقنتها في الأسابيع السابقة"
                  >
                    <Trophy className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                    <span>السُّنن المُتقنة ({toArabicDigits(masteredCount)})</span>
                    {isMasteredOpen ? (
                      <ChevronUp className="w-3.5 h-3.5 shrink-0" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                    )}
                  </button>

                  {isMasteredOpen && (
                    <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-[#0D1713] border border-[#D4AF37]/55 shadow-[0_18px_45px_rgba(0,0,0,0.75)] p-3 space-y-2 z-40">
                      <div className="flex items-center justify-between border-b border-[#D4AF37]/20 pb-2">
                        <span className="text-xs font-bold text-[#D4AF37]">
                          أرشيف السُّنن المُتقنة (٥+ أيام)
                        </span>
                        <span className="text-[11px] font-mono text-[#10B981] tabular-nums">
                          {masteredCount} سُنة
                        </span>
                      </div>

                      {radarState.masteredSunnahs.length === 0 ? (
                        <p className="text-xs text-slate-300 leading-relaxed py-2">
                          لم تُضف سُنة إلى الأرشيف بعد — أتمم ٥ أيام على الأقل من أي سُنة لتظهر هنا مع وسام إحياء السُنة.
                        </p>
                      ) : (
                        <div className="max-h-60 overflow-y-auto space-y-1.5 pr-0.5">
                          {radarState.masteredSunnahs.map((record) => (
                            <button
                              key={`${record.weekKey}-${record.id}`}
                              type="button"
                              onClick={() => handleSelectMasteredSunnah(record.id)}
                              className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-[#162520] hover:bg-emerald-950/60 border border-[#10B981]/35 text-right flex items-center justify-between gap-2 transition-colors"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-base leading-none shrink-0">
                                  {record.icon}
                                </span>
                                <div className="min-w-0">
                                  <div className="text-xs font-bold text-white truncate">
                                    {record.title}
                                  </div>
                                  <div className="text-[11px] text-slate-300 font-mono">
                                    أسبوع {record.weekKey}
                                  </div>
                                </div>
                              </div>
                              <span className="text-[11px] font-bold text-[#10B981] whitespace-nowrap shrink-0">
                                {toArabicDigits(record.daysCount)} / ٧ أيام
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCycleSunnah}
                  className="min-h-[44px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#162520] hover:bg-[#1b2e27] border border-[#D4AF37]/40 hover:border-[#D4AF37] text-xs font-bold text-slate-100 hover:text-[#F3CA63] transition-colors whitespace-nowrap shrink-0"
                  title="التبديل إلى سُنة أخرى من مكتبة السُّنن المهجورة"
                >
                  <RotateCw className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                  <span>سُنة أخرى</span>
                  <span className="text-[10px] font-mono text-[#D4AF37]/80 tabular-nums">
                    ({toArabicDigits(currentLibraryIndex)}/{toArabicDigits(FORGOTTEN_SUNNAH_LIBRARY.length)})
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsMasteredOpen(false);
                    setIsModalOpen(false);
                  }}
                  aria-label="إغلاق نافذة سُنة الأسبوع"
                  className="min-w-[44px] min-h-[44px] rounded-xl bg-[#09120F] border border-[#D4AF37]/35 text-slate-300 hover:text-[#D4AF37] hover:border-[#D4AF37] flex items-center justify-center transition-colors shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Sunnah Title, 2-Line Practical Guide & Collapsible Shari'ah Evidence */}
            <div className="relative z-10 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#162520] border border-[#D4AF37]/50 flex items-center justify-center text-2xl shrink-0 shadow-[0_0_20px_rgba(212,175,55,0.14)]">
                  <span aria-hidden="true">{activeSunnah.icon}</span>
                </div>
                <div className="min-w-0 space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3
                      id="sunnah-radar-modal-title"
                      className="text-xl sm:text-2xl font-bold font-amiri text-white leading-snug"
                    >
                      {activeSunnah.title}
                    </h3>
                    {isMasteredThisWeek && (
                      <span className="inline-flex items-center gap-1 text-xs font-black text-[#F3CA63] whitespace-nowrap">
                        <Award className="w-3.5 h-3.5 text-[#F3CA63] shrink-0" />
                        <span>وسام إحياء السُنة</span>
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-200 leading-relaxed">
                    {activeSunnah.practicalGuideLine1}
                    <br />
                    {activeSunnah.practicalGuideLine2}
                  </p>
                </div>
              </div>

              {/* Collapsible Hadith Evidence Toggle */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setIsHadithOpen((prev) => !prev)}
                  aria-expanded={isHadithOpen}
                  className="min-h-[44px] w-full sm:w-auto inline-flex items-center justify-between sm:justify-start gap-2.5 px-4 py-2 rounded-xl bg-[#162520] hover:bg-[#1c2f28] border border-[#D4AF37]/35 text-xs sm:text-sm font-bold text-[#F3CA63] transition-colors"
                >
                  <span className="inline-flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#D4AF37] shrink-0" />
                    <span>الدليل الشرعي المختصر</span>
                  </span>
                  {isHadithOpen ? (
                    <ChevronUp className="w-4 h-4 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 shrink-0" />
                  )}
                </button>

                {isHadithOpen && (
                  <div className="p-4 rounded-2xl bg-[#0B1411] border border-[#D4AF37]/35 space-y-2 text-right">
                    <p className="font-amiri text-base sm:text-lg text-amber-100 leading-loose">
                      {activeSunnah.hadithText}
                    </p>
                    <p className="text-xs text-[#10B981] font-medium">
                      {activeSunnah.hadithSource}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Tracker Header & Progress Bar */}
            <div className="relative z-10 space-y-2.5 pt-2 border-t border-[#D4AF37]/20">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs sm:text-sm font-bold text-slate-200">
                  متتبع الإتقان الأسبوعي (من السبت إلى الجمعة)
                </span>
                <span
                  dir="rtl"
                  className="text-xs sm:text-sm font-bold text-[#F3CA63] font-mono tabular-nums whitespace-nowrap"
                >
                  {completedCount} / 7 أيام
                </span>
              </div>

              <div className="h-2.5 w-full rounded-full bg-[#09120F] border border-[#D4AF37]/25 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-l from-[#D4AF37] via-[#e5b869] to-[#10B981] origin-right transition-transform duration-300"
                  style={{ transform: `scaleX(${progressFraction})` }}
                />
              </div>
            </div>

            {/* Vertical Checklist Rows (Full 7 Days) */}
            <div className="relative z-10 flex flex-col gap-2">
              {SUNNAH_WEEK_DAYS.map((day) => {
                const isChecked = completedDays.includes(day.key);
                const isToday = day.key === todayMeta.key;

                return (
                  <button
                    key={day.key}
                    type="button"
                    role="checkbox"
                    aria-checked={isChecked}
                    onClick={() => handleToggleDay(day.key)}
                    className={`w-full min-h-[48px] flex items-center justify-between px-4 py-2.5 rounded-xl border transition-colors active:scale-[0.99] text-right ${
                      isChecked
                        ? 'bg-emerald-950/50 border-[#10B981]/60'
                        : 'bg-[#162520] border-emerald-500/25 hover:border-[#D4AF37]/60'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        aria-hidden="true"
                        className={`w-6 h-6 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                          isChecked
                            ? 'bg-[#10B981] border-[#10B981] text-white'
                            : 'bg-[#0D1613] border-[#D4AF37]/45 text-transparent'
                        }`}
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                      </span>

                      <span className="text-sm sm:text-base font-bold text-white whitespace-nowrap">
                        {day.labelAr}
                      </span>

                      {isToday && (
                        <span className="text-xs font-bold text-[#10B981] whitespace-nowrap shrink-0">
                          · اليوم
                        </span>
                      )}
                    </div>

                    <span
                      className={`text-xs sm:text-sm font-bold whitespace-nowrap shrink-0 ${
                        isChecked ? 'text-[#10B981]' : 'text-[#CBD5E1]/85 font-medium'
                      }`}
                    >
                      {isChecked ? 'تم الإحياء ✓' : 'اضغط للتسجيل'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Primary Gold CTA Button for Today + Calm Completion Banner */}
            <div className="relative z-10 space-y-2.5 pt-1">
              <button
                type="button"
                onClick={() => handleToggleDay(todayMeta.key)}
                className={`w-full min-h-[50px] px-4 py-3 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-2 transition-colors active:scale-[0.99] shadow-lg ${
                  isTodayCompleted
                    ? 'bg-emerald-950/75 border-2 border-[#10B981] text-[#10B981]'
                    : 'bg-[#D4AF37] hover:bg-[#e0bd46] text-[#0A1310] border border-[#F3CA63]'
                }`}
              >
                {isTodayCompleted ? (
                  <>
                    <Check className="w-5 h-5 stroke-[3] shrink-0" />
                    <span>تم تسجيل إحياء السُنة ليوم {todayMeta.labelAr} بحمد الله</span>
                  </>
                ) : (
                  <span>أحييتُ السُنة اليوم ({todayMeta.labelAr})</span>
                )}
              </button>

              {isTodayCompleted && (
                <p className="text-center text-xs sm:text-sm font-medium text-emerald-200/95 leading-relaxed">
                  {isMasteredThisWeek
                    ? `تقبّل الله منك! نلتَ وسام إحياء «${activeSunnah.title}» وأُضيفت تلقائياً إلى السُّنن المُتقنة.`
                    : `بارك الله فيك وأعانك على الثبات — متبقي ${toArabicDigits(
                        SUNNAH_MASTERY_THRESHOLD - completedCount
                      )} ${SUNNAH_MASTERY_THRESHOLD - completedCount === 1 ? 'يوم' : 'أيام'} لنيل وسام إحياء السُنة.`}
                </p>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  );
};
