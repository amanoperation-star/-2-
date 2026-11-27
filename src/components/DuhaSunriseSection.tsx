import React, { useState, useEffect, useMemo } from 'react';
import {
  Sun,
  Sunrise,
  Clock,
  Bell,
  BellOff,
  Check,
  BookOpen,
  Sparkles,
  Flame,
  Copy,
  RotateCcw,
  Volume2,
} from 'lucide-react';
import { UserSettings } from '../types';
import { DailyPrayerSurah } from '../utils/dailyPrayerSurahsData';
import { toArabicDigits } from '../utils/khatmaData';
import { adhanPlayer } from '../utils/audioAdhan';
import {
  DUHA_RAKAT_OPTIONS,
  DUHA_SUNRISE_HADITHS,
  DUHA_UPDATED_EVENT,
  DuhaTrackerState,
  SUNRISE_DUHA_ADHKAR,
  calculateDuhaSchedule,
  formatTime12Ar,
  getDuhaRankLabelAr,
  getDuhaRecommendedSurahs,
  getDuhaStats,
  loadDuhaTrackerState,
  saveDuhaTrackerState,
  setDuhaRakats,
} from '../utils/duhaSunriseData';

export type DuhaSectionTab = 'timings' | 'tracker' | 'virtues';

interface DuhaSunriseSectionProps {
  sunriseTime: string;
  dhuhrTime: string;
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  onOpenSurah: (surah: DailyPrayerSurah, contextLabel: string) => void;
}

export const DuhaSunriseSection: React.FC<DuhaSunriseSectionProps> = ({
  sunriseTime,
  dhuhrTime,
  settings,
  onUpdateSettings,
  onOpenSurah,
}) => {
  const [now, setNow] = useState<Date>(() => new Date());
  const [activeTab, setActiveTab] = useState<DuhaSectionTab>('timings');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [trackerState, setTrackerState] = useState<DuhaTrackerState>(() =>
    loadDuhaTrackerState()
  );

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const syncHandler = () => {
      setTrackerState(loadDuhaTrackerState());
    };
    window.addEventListener(DUHA_UPDATED_EVENT, syncHandler);
    return () => window.removeEventListener(DUHA_UPDATED_EVENT, syncHandler);
  }, []);

  const schedule = useMemo(
    () => calculateDuhaSchedule(sunriseTime, dhuhrTime, now),
    [sunriseTime, dhuhrTime, now]
  );

  const stats = useMemo(() => getDuhaStats(trackerState, now), [trackerState, now]);
  const recommendedSurahs = useMemo(() => getDuhaRecommendedSurahs(), []);

  const handleSelectRakats = (rakats: number) => {
    const prev = loadDuhaTrackerState();
    const next = setDuhaRakats(prev, rakats);
    if (next.todayRakats >= 2 && prev.todayRakats === 0) {
      adhanPlayer.playChime();
    }
    setTrackerState(next);
    saveDuhaTrackerState(next);
  };

  const handleToggleChecklist = (key: 'fajrDone' | 'ishraqDhikrDone') => {
    const prev = loadDuhaTrackerState();
    const next: DuhaTrackerState = {
      ...prev,
      morningChecklist: {
        ...prev.morningChecklist,
        [key]: !prev.morningChecklist[key],
      },
    };
    setTrackerState(next);
    saveDuhaTrackerState(next);
  };

  const handleCopyDhikr = (id: string, text: string) => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    setCopiedId(id);
    window.setTimeout(() => {
      setCopiedId((curr) => (curr === id ? null : curr));
    }, 2000);
  };

  const sunriseReminderOn = Boolean(settings.sunriseReminderEnabled);
  const duhaReminderOn = Boolean(settings.duhaReminderEnabled);
  const duhaTiming = settings.duhaReminderTiming || 'ishraq';
  const duhaSoundOn = settings.duhaReminderSoundEnabled !== false;
  const rakatPairsCompleted = Math.floor(trackerState.todayRakats / 2);

  const timelineItems = [
    {
      id: 'sunrise',
      title: 'الشروق',
      subtitle: 'بداية وقت النهي (~١٥ د)',
      timeStr: formatTime12Ar(schedule.sunriseStr),
      active: schedule.phase === 'prohibition_sunrise',
      icon: <Sunrise className="w-4 h-4 text-amber-300" />,
    },
    {
      id: 'ishraq',
      title: 'بداية الإشراق',
      subtitle: 'بعد الشروق بـ ١٥ دقيقة',
      timeStr: formatTime12Ar(schedule.ishraqStartStr),
      active: schedule.phase === 'ishraq_window' || schedule.phase === 'duha_morning',
      icon: <Sun className="w-4 h-4 text-[#F6D884]" />,
    },
    {
      id: 'peak',
      title: 'أفضل وقت للضحى',
      subtitle: 'حين ترمض الفصال',
      timeStr: formatTime12Ar(schedule.bestDuhaStr),
      active: schedule.phase === 'duha_peak',
      icon: <Sparkles className="w-4 h-4 text-[#34D399]" />,
    },
    {
      id: 'end',
      title: 'نهاية الضحى',
      subtitle: 'قبيل الظهر بـ ١٠ دقائق',
      timeStr: formatTime12Ar(schedule.duhaEndStr),
      active: schedule.phase === 'prohibition_zawal',
      icon: <Clock className="w-4 h-4 text-slate-300" />,
    },
  ];

  return (
    <section
      id="duha-sunrise-section"
      dir="rtl"
      aria-label="قسم صلاة الضحى والشروق"
      className="rounded-3xl bg-gradient-to-br from-[#08241B] via-[#061A13] to-[#05140F] border border-[#CFA632]/55 p-4 sm:p-5 space-y-4 shadow-[0_14px_38px_rgba(0,0,0,0.45)] text-right"
      style={{ fontFamily: "'Cairo', sans-serif" }}
    >
      {/* Standalone Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-[#CFA632]/25">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-[#05140F] border border-[#F6D884]/60 flex items-center justify-center text-[#F6D884] shadow-[0_0_16px_rgba(207,166,50,0.2)] shrink-0">
            <Sun className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-amiri text-xl sm:text-2xl font-bold text-[#F6D884] leading-tight">
              صلاة الضحى والشروق
            </h3>
            <p className="text-xs text-slate-300 mt-0.5 tabular-nums">
              <span className="text-[#34D399] font-semibold">{schedule.statusLabelAr}</span>
              <span aria-hidden="true" className="mx-1.5 text-[#CFA632]/60">·</span>
              <span>
                {schedule.nextMilestoneLabelAr}: {schedule.nextMilestoneTimeStr} (بعد{' '}
                {schedule.remainingFormattedAr})
              </span>
            </p>
          </div>
        </div>

        <div className="text-xs font-bold tabular-nums text-[#F6D884]">
          ركعات اليوم: <span className="text-[#34D399]">{toArabicDigits(trackerState.todayRakats)} / ١٢</span>
        </div>
      </div>

      {/* Standalone Internal Sub-Tabs */}
      <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-[#04100C] border border-[#CFA632]/30">
        <button
          type="button"
          onClick={() => setActiveTab('timings')}
          className={`min-h-[42px] px-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'timings'
              ? 'bg-gradient-to-r from-[#F6D884] to-[#CFA632] text-[#04130E] shadow'
              : 'text-slate-300 hover:text-[#F6D884]'
          }`}
        >
          المواقيت والتنبيهات
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('tracker')}
          className={`min-h-[42px] px-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'tracker'
              ? 'bg-gradient-to-r from-[#F6D884] to-[#CFA632] text-[#04130E] shadow'
              : 'text-slate-300 hover:text-[#F6D884]'
          }`}
        >
          متتبع الضحى ({toArabicDigits(trackerState.todayRakats)})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('virtues')}
          className={`min-h-[42px] px-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'virtues'
              ? 'bg-gradient-to-r from-[#F6D884] to-[#CFA632] text-[#04130E] shadow'
              : 'text-slate-300 hover:text-[#F6D884]'
          }`}
        >
          الفضل والسور
        </button>
      </div>

      {/* Tab 1: Timings & Reminders */}
      {activeTab === 'timings' && (
        <div className="space-y-4">
          {/* 4 Morning Milestones */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {timelineItems.map((item) => (
              <div
                key={item.id}
                className={`rounded-2xl p-3 border transition-colors ${
                  item.active
                    ? 'bg-[#0A2C21] border-[#34D399]/70'
                    : 'bg-[#05140F]/90 border-[#CFA632]/25'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                  {item.icon}
                  <span className="truncate">{item.title}</span>
                </div>
                <div
                  className={`mt-1 text-base font-mono font-extrabold tabular-nums ${
                    item.active ? 'text-[#34D399]' : 'text-[#F6D884]'
                  }`}
                >
                  {item.timeStr}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                  {item.subtitle}
                </div>
              </div>
            ))}
          </div>

          {/* Window Progress */}
          <div className="rounded-2xl bg-[#05140F]/85 border border-[#CFA632]/25 p-3.5 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-slate-300">{schedule.statusDetailAr}</span>
              <span className="font-mono font-bold text-[#34D399] tabular-nums">
                {toArabicDigits(schedule.progressPercent)}%
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#030C09] border border-[#CFA632]/20 overflow-hidden">
              <div
                className="h-full bg-gradient-to-l from-[#34D399] via-[#F6D884] to-[#CFA632] transition-[width] duration-300"
                style={{ width: `${schedule.progressPercent}%` }}
              />
            </div>
          </div>

          {/* Sunrise & Duha Reminders */}
          <div className="rounded-2xl bg-[#05140F]/85 border border-[#CFA632]/30 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-amiri text-base font-bold text-[#F6D884]">
                تذكيرات الشروق وصلاة الضحى
              </h4>
              <span className="text-[11px] text-slate-400">تنبيه مجدول تلقائياً</span>
            </div>

            <button
              type="button"
              onClick={() => onUpdateSettings({ sunriseReminderEnabled: !sunriseReminderOn })}
              className="w-full min-h-[46px] px-3.5 py-2 rounded-xl bg-[#071E17] border border-[#CFA632]/25 hover:border-[#CFA632]/55 flex items-center justify-between gap-3 text-right transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {sunriseReminderOn ? (
                  <Bell className="w-4 h-4 text-[#34D399] shrink-0" />
                ) : (
                  <BellOff className="w-4 h-4 text-slate-400 shrink-0" />
                )}
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white">
                    تنبيه وقت الشروق ({formatTime12Ar(schedule.sunriseStr)})
                  </div>
                  <div className="text-[11px] text-slate-400">
                    إشعار عند شروق الشمس واقتراب وقت الإشراق
                  </div>
                </div>
              </div>
              <span
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 ${
                  sunriseReminderOn
                    ? 'bg-[#10B981]/20 text-[#34D399] border border-[#34D399]/50'
                    : 'bg-slate-800/70 text-slate-400 border border-slate-700'
                }`}
              >
                {sunriseReminderOn ? 'مفعّل' : 'موقوف'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onUpdateSettings({ duhaReminderEnabled: !duhaReminderOn })}
              className="w-full min-h-[46px] px-3.5 py-2 rounded-xl bg-[#071E17] border border-[#CFA632]/25 hover:border-[#CFA632]/55 flex items-center justify-between gap-3 text-right transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {duhaReminderOn ? (
                  <Bell className="w-4 h-4 text-[#34D399] shrink-0" />
                ) : (
                  <BellOff className="w-4 h-4 text-slate-400 shrink-0" />
                )}
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white">
                    تنبيه صلاة الإشراق والضحى
                  </div>
                  <div className="text-[11px] text-slate-400">
                    تذكيرك بأداء صلاة الضحى حسب الموعد المختار
                  </div>
                </div>
              </div>
              <span
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 ${
                  duhaReminderOn
                    ? 'bg-[#10B981]/20 text-[#34D399] border border-[#34D399]/50'
                    : 'bg-slate-800/70 text-slate-400 border border-slate-700'
                }`}
              >
                {duhaReminderOn ? 'مفعّل' : 'موقوف'}
              </span>
            </button>

            {duhaReminderOn && (
              <div className="space-y-2 pt-1">
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'ishraq' as const, label: 'عند الإشراق' },
                    { id: 'peak' as const, label: 'أفضل وقت للضحى' },
                    { id: 'both' as const, label: 'كلا الموعدين' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => onUpdateSettings({ duhaReminderTiming: opt.id })}
                      className={`min-h-[40px] px-2 rounded-xl border text-[11px] font-bold transition-all ${
                        duhaTiming === opt.id
                          ? 'bg-[#0B3325] border-[#34D399] text-[#34D399]'
                          : 'bg-[#071E17] border-[#CFA632]/25 text-slate-300 hover:border-[#F6D884]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => onUpdateSettings({ duhaReminderSoundEnabled: !duhaSoundOn })}
                  className="w-full min-h-[40px] px-3 py-2 rounded-xl bg-[#071E17] border border-[#CFA632]/20 flex items-center justify-between text-xs"
                >
                  <span className="flex items-center gap-2 text-slate-200 font-semibold">
                    <Volume2 className="w-4 h-4 text-[#F6D884]" />
                    <span>تشغيل نغمة لطيفة عند التنبيه</span>
                  </span>
                  <span className={duhaSoundOn ? 'text-[#34D399] font-bold' : 'text-slate-400'}>
                    {duhaSoundOn ? 'مفعّل' : 'صامت'}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Daily Duha Rakat Tracker & 7-Day Consistency */}
      {activeTab === 'tracker' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-[#05140F]/85 border border-[#CFA632]/30 p-3.5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h4 className="font-amiri text-base font-bold text-[#F6D884]">
                  متتبع ركعات الضحى اليومي (٢ – ١٢ ركعة)
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  {getDuhaRankLabelAr(trackerState.todayRakats)}
                </p>
              </div>
              {trackerState.todayRakats > 0 && (
                <button
                  type="button"
                  onClick={() => handleSelectRakats(0)}
                  className="min-h-[38px] px-3 rounded-xl bg-[#071E17] border border-[#CFA632]/30 text-xs text-slate-300 hover:text-[#F6D884] flex items-center gap-1 shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>تصفير</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-6 gap-1.5">
              {DUHA_RAKAT_OPTIONS.map((rakatVal, idx) => {
                const isFilled = idx < rakatPairsCompleted;
                const isExact = trackerState.todayRakats === rakatVal;
                return (
                  <button
                    key={rakatVal}
                    type="button"
                    onClick={() => handleSelectRakats(isExact ? rakatVal - 2 : rakatVal)}
                    className={`min-h-[54px] rounded-xl border flex flex-col items-center justify-center gap-0.5 transition-all active:scale-95 ${
                      isFilled
                        ? 'bg-[#0C3829] border-[#34D399] text-[#34D399]'
                        : 'bg-[#071E17] border-[#CFA632]/30 text-slate-300 hover:border-[#F6D884]'
                    }`}
                  >
                    <span className="text-sm font-extrabold tabular-nums">
                      {toArabicDigits(rakatVal)}
                    </span>
                    <span className="text-[10px] opacity-85">ركعات</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => handleToggleChecklist('fajrDone')}
              className={`min-h-[46px] px-3.5 py-2.5 rounded-xl border flex items-center justify-between gap-2 text-right transition-colors ${
                trackerState.morningChecklist.fajrDone
                  ? 'bg-[#0B3325] border-[#34D399]/70 text-emerald-100'
                  : 'bg-[#05140F]/90 border-[#CFA632]/25 text-slate-200'
              }`}
            >
              <span className="text-xs font-bold">صلاة الفجر في وقتها</span>
              <span
                className={`w-6 h-6 rounded-lg flex items-center justify-center border ${
                  trackerState.morningChecklist.fajrDone
                    ? 'bg-[#34D399] border-[#34D399] text-[#04130E]'
                    : 'border-[#CFA632]/35 text-transparent'
                }`}
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleToggleChecklist('ishraqDhikrDone')}
              className={`min-h-[46px] px-3.5 py-2.5 rounded-xl border flex items-center justify-between gap-2 text-right transition-colors ${
                trackerState.morningChecklist.ishraqDhikrDone
                  ? 'bg-[#0B3325] border-[#34D399]/70 text-emerald-100'
                  : 'bg-[#05140F]/90 border-[#CFA632]/25 text-slate-200'
              }`}
            >
              <span className="text-xs font-bold">ذكر الله وأذكار الصباح حتى الإشراق</span>
              <span
                className={`w-6 h-6 rounded-lg flex items-center justify-center border ${
                  trackerState.morningChecklist.ishraqDhikrDone
                    ? 'bg-[#34D399] border-[#34D399] text-[#04130E]'
                    : 'border-[#CFA632]/35 text-transparent'
                }`}
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </span>
            </button>
          </div>

          <div className="rounded-2xl bg-[#05140F]/85 border border-[#CFA632]/25 p-3.5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-[#F6D884]">
                <Flame className="w-4 h-4" />
                <span>المواظبة (آخر ٧ أيام)</span>
              </div>
              <div className="text-slate-300 tabular-nums">
                <span>السلسلة: </span>
                <strong className="text-[#34D399]">{toArabicDigits(stats.streakDays)} يوم</strong>
                <span aria-hidden="true" className="mx-1.5 text-[#CFA632]/50">·</span>
                <span>الإجمالي: </span>
                <strong className="text-[#F6D884]">
                  {toArabicDigits(stats.totalRakatsAllTime)} ركعة
                </strong>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {stats.last7Days.map((day) => {
                const done = day.rakats >= 2;
                return (
                  <div
                    key={day.dateKey}
                    className={`rounded-xl border py-2 px-1 flex flex-col items-center justify-center gap-1 ${
                      done
                        ? 'bg-[#0B3325] border-[#34D399]/60 text-[#34D399]'
                        : day.isToday
                          ? 'bg-[#0A241C] border-[#F6D884]/55 text-[#F6D884]'
                          : 'bg-[#071E17] border-[#CFA632]/20 text-slate-400'
                    }`}
                  >
                    <span className="text-[10px] font-bold">{day.dayLabelAr}</span>
                    <span className="text-xs font-mono font-extrabold tabular-nums">
                      {done ? toArabicDigits(day.rakats) : '—'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Virtues, Recommended Surahs & Morning Adhkar */}
      {activeTab === 'virtues' && (
        <div className="space-y-4">
          {/* Surahs: Ash-Shams & Ad-Duha */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {recommendedSurahs.map((surah) => (
              <button
                key={surah.surahNumber}
                type="button"
                onClick={() => onOpenSurah(surah, 'صلاة الضحى والشروق')}
                className="min-h-[54px] p-3 rounded-2xl bg-[#05140F] hover:bg-[#0B291F] border border-[#CFA632]/40 hover:border-[#F6D884] text-right flex items-center justify-between gap-3 transition-all"
              >
                <div className="min-w-0">
                  <div className="font-amiri text-base font-bold text-[#F6D884]">
                    {surah.title}
                  </div>
                  <div className="text-[11px] text-slate-300 tabular-nums">
                    {surah.revelationType} · {toArabicDigits(surah.ayahsCount)} آيات (بالتشكيل)
                  </div>
                </div>
                <div className="w-9 h-9 rounded-xl bg-[#0A241C] border border-[#CFA632]/30 flex items-center justify-center text-[#34D399] shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
              </button>
            ))}
          </div>

          {/* Prophetic Hadiths */}
          <div className="space-y-2.5">
            <h4 className="font-amiri text-base font-bold text-[#F6D884]">
              أحاديث في فضل صلاة الإشراق والضحى
            </h4>
            {DUHA_SUNRISE_HADITHS.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl bg-[#05140F]/85 border border-[#CFA632]/25 p-3.5 space-y-1.5"
              >
                <div className="text-xs font-bold text-[#34D399]">{item.titleAr}</div>
                <p className="font-amiri text-base leading-loose text-amber-50">
                  {item.hadithText}
                </p>
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 pt-1 border-t border-[#CFA632]/15">
                  <span>{item.source}</span>
                  <span className="text-[#F6D884]/90">{item.benefitAr}</span>
                </div>
              </div>
            ))}
          </div>

          {/* After-Sunrise Morning Adhkar */}
          <div className="space-y-2.5">
            <h4 className="font-amiri text-base font-bold text-[#F6D884]">
              أذكار الصباح حتى الشروق
            </h4>
            {SUNRISE_DUHA_ADHKAR.map((dhikr) => (
              <div
                key={dhikr.id}
                className="rounded-2xl bg-[#05140F]/85 border border-[#CFA632]/25 p-3.5 space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[#F6D884]">{dhikr.titleAr}</span>
                  <button
                    type="button"
                    onClick={() => handleCopyDhikr(dhikr.id, dhikr.text)}
                    className="min-h-[36px] px-2.5 rounded-lg bg-[#071E17] border border-[#CFA632]/30 text-[11px] font-bold text-slate-200 hover:text-[#F6D884] flex items-center gap-1"
                  >
                    {copiedId === dhikr.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#34D399]" />
                        <span className="text-[#34D399]">تم النسخ</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>نسخ</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="font-amiri text-base leading-loose text-slate-100">{dhikr.text}</p>
                <div className="text-[11px] text-slate-400">{dhikr.noteAr}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
