import React, { useState } from 'react';
import { CheckCircle2, Circle, Calendar, Award } from 'lucide-react';
import { PrayerTrackerEntry } from '../types';
import { DailyStreakTrackerCard } from './PostPrayerCheckinCard';
import {
  CheckinPrayerKey,
  DailyCheckinState,
  PrayerCheckinItem,
  loadTodayCheckinState,
  toggleCheckinField,
} from '../utils/postPrayerCheckinData';

export type DailyPrayerKey = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

const PRAYERS_LIST: { key: DailyPrayerKey; nameAr: string }[] = [
  { key: 'fajr', nameAr: 'الفجر' },
  { key: 'dhuhr', nameAr: 'الظهر' },
  { key: 'asr', nameAr: 'العصر' },
  { key: 'maghrib', nameAr: 'المغرب' },
  { key: 'isha', nameAr: 'العشاء' },
];

interface PrayerTrackerProps {
  checkinState?: DailyCheckinState;
  onToggleCheckinField?: (
    prayerKey: CheckinPrayerKey,
    field: keyof PrayerCheckinItem,
    forceValue?: boolean
  ) => void;
}

export const PrayerTracker: React.FC<PrayerTrackerProps> = ({
  checkinState: controlledCheckinState,
  onToggleCheckinField,
}) => {
  const [internalCheckinState, setInternalCheckinState] = useState<DailyCheckinState>(() =>
    loadTodayCheckinState()
  );
  const activeCheckinState = controlledCheckinState ?? internalCheckinState;
  const handleToggleStreakField = (
    prayerKey: CheckinPrayerKey,
    field: keyof PrayerCheckinItem,
    forceValue?: boolean
  ) => {
    if (onToggleCheckinField) {
      onToggleCheckinField(prayerKey, field, forceValue);
    } else {
      setInternalCheckinState(toggleCheckinField(prayerKey, field, forceValue));
    }
  };
  const getTodayStr = () => new Date().toISOString().split('T')[0];

  const [history, setHistory] = useState<Record<string, PrayerTrackerEntry>>(() => {
    try {
      const saved = localStorage.getItem('al_mawaqeet_prayer_tracker');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const todayStr = getTodayStr();

  const todayEntry: PrayerTrackerEntry = history[todayStr] || {
    date: todayStr,
    fajr: false,
    dhuhr: false,
    asr: false,
    maghrib: false,
    isha: false,
    fajrMosque: false,
    dhuhrMosque: false,
    asrMosque: false,
    maghribMosque: false,
    ishaMosque: false,
  };

  const saveHistory = (newHistory: Record<string, PrayerTrackerEntry>) => {
    setHistory(newHistory);
    try {
      localStorage.setItem('al_mawaqeet_prayer_tracker', JSON.stringify(newHistory));
    } catch (e) {
      console.warn('Failed saving prayer tracker:', e);
    }
  };

  const togglePrayer = (prayerKey: DailyPrayerKey, field: 'completed' | 'mosque') => {
    const updatedToday = { ...todayEntry };
    if (field === 'completed') {
      updatedToday[prayerKey] = !updatedToday[prayerKey];
      if (!updatedToday[prayerKey]) {
        // If unchecking completed, also uncheck mosque
        const mosqueKey = `${prayerKey}Mosque` as keyof PrayerTrackerEntry;
        (updatedToday as any)[mosqueKey] = false;
      }
    } else {
      const mosqueKey = `${prayerKey}Mosque` as keyof PrayerTrackerEntry;
      (updatedToday as any)[mosqueKey] = !(todayEntry as any)[mosqueKey];
      if ((updatedToday as any)[mosqueKey]) {
        updatedToday[prayerKey] = true;
      }
    }

    saveHistory({
      ...history,
      [todayStr]: updatedToday,
    });
  };

  // Calculate past 7 days statistics
  const getWeeklyStats = () => {
    let totalCompleted = 0;
    let totalPossible = 7 * 5;
    let mosqueCount = 0;

    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const entry = history[dStr];
      if (entry) {
        PRAYERS_LIST.forEach((p) => {
          if (entry[p.key]) totalCompleted++;
          const mosqueKey = `${p.key}Mosque` as keyof PrayerTrackerEntry;
          if (entry[mosqueKey]) mosqueCount++;
        });
      }
    }

    const percentage = Math.round((totalCompleted / totalPossible) * 100);
    return { percentage, totalCompleted, mosqueCount };
  };

  const weeklyStats = getWeeklyStats();

  const todayCompletedCount = PRAYERS_LIST.filter((p) => todayEntry[p.key]).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header & Stats Banner */}
      <div className="bg-gradient-to-br from-[#0c223a] via-[#091b2e] to-[#040e1b] border border-emerald-500/40 rounded-3xl p-6 md:p-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-right">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/40">
            <Award className="w-4 h-4 text-amber-400" />
            <span>متتبع الصلوات اليومية (Prayer Tracker)</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white font-amiri">
            متابعة أداء الصلوات في وقتها وفي المسجد
          </h2>
          <p className="text-xs text-slate-300">
            قال رسول الله ﷺ: «أحب الأعمال إلى الله الصلاة على وقتها»
          </p>
        </div>

        {/* Weekly Score Circular Progress */}
        <div className="flex items-center gap-4 bg-slate-950/60 p-4 rounded-2xl border border-emerald-800/40 shadow-inner">
          <div className="text-center">
            <div className="text-3xl font-black text-emerald-400 font-mono">
              {weeklyStats.percentage}%
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5">نسبة الالتزام الأسبوعية</span>
          </div>
          <div className="w-px h-10 bg-slate-800" />
          <div className="text-center">
            <div className="text-2xl font-black text-amber-400 font-mono">
              {weeklyStats.mosqueCount}
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5">صلاة في المسجد جماعة</span>
          </div>
        </div>
      </div>

      {/* Compact Single-Line Expandable Post-Prayer Daily Streak Tracker */}
      <DailyStreakTrackerCard
        checkinState={activeCheckinState}
        onToggleField={handleToggleStreakField}
      />

      {/* Today Checklist Cards */}
      <div className="bg-slate-900/80 border border-emerald-900/40 rounded-3xl p-6 md:p-8 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <span className="text-xs text-slate-400 font-mono">
            المكتمل اليوم: <strong className="text-emerald-400 text-base">{todayCompletedCount}</strong> / 5
          </span>
          <h3 className="text-lg font-bold text-white font-amiri flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span>صلوات اليوم (اضغط لتعليم ما صليته):</span>
          </h3>
        </div>

        <div className="space-y-3">
          {PRAYERS_LIST.map((prayer) => {
            const isDone = todayEntry[prayer.key];
            const mosqueKey = `${prayer.key}Mosque` as keyof PrayerTrackerEntry;
            const isMosque = !!todayEntry[mosqueKey];

            return (
              <div
                key={prayer.key}
                className={`p-4 md:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row items-center justify-between gap-4 ${
                  isDone
                    ? 'bg-[#062426] border-emerald-500 shadow-md ring-1 ring-emerald-500/30'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Checkbox buttons */}
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end sm:justify-start">
                  {/* In Mosque Badge */}
                  <button
                    onClick={() => togglePrayer(prayer.key, 'mosque')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                      isMosque
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>🕌 في المسجد جماعة</span>
                  </button>

                  {/* Main Prayed Check */}
                  <button
                    onClick={() => togglePrayer(prayer.key, 'completed')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                      isDone
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md'
                        : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 fill-current" />
                    ) : (
                      <Circle className="w-4 h-4" />
                    )}
                    <span>{isDone ? 'تمت الصلاة في وقتها ✓' : 'لم تُسجَّل بعد'}</span>
                  </button>
                </div>

                {/* Prayer Name & Status */}
                <div className="text-right">
                  <h4 className="text-xl font-bold text-white font-amiri tracking-wide">
                    صلاة {prayer.nameAr}
                  </h4>
                  <span className="text-xs text-slate-400">
                    {isMosque
                      ? 'صُليت في بيت من بيوت الله مع الجماعة'
                      : isDone
                      ? 'تمت الصلاة والحمد لله'
                      : 'بانتظار أدائها'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
