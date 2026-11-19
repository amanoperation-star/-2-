import { toArabicDigits } from './khatmaData';

export type QadaPrayerKey = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha' | 'witr';
export type QadaCountKey = QadaPrayerKey | 'fasting';

export interface QadaCounters {
  fajr: number;
  dhuhr: number;
  asr: number;
  maghrib: number;
  isha: number;
  witr: number;
  fasting: number;
}

export interface QadaActionEntry {
  id: string;
  timestamp: string;
  labelAr: string;
  deltas: Partial<QadaCounters>;
}

export interface QadaState {
  remaining: QadaCounters;
  completed: QadaCounters;
  dailyPaceDays: number; // e.g., 0.5, 1, 2, 3
  includeWitrInPlan: boolean;
  reminderEnabled: boolean;
  reminderTime: string; // HH:mm
  lastRemindedDate: string; // YYYY-MM-DD
  dailyLog: Record<string, number>; // dateKey -> number of completed qada units that day
  recentActions: QadaActionEntry[];
}

export const QADA_STORAGE_KEY = 'al_mawaqeet_qada_planner_v1';

export const QADA_PRAYER_META: { key: QadaPrayerKey; nameAr: string; rakatsAr: string }[] = [
  { key: 'fajr', nameAr: 'الفجر', rakatsAr: '٢ ركعتان' },
  { key: 'dhuhr', nameAr: 'الظهر', rakatsAr: '٤ ركعات' },
  { key: 'asr', nameAr: 'العصر', rakatsAr: '٤ ركعات' },
  { key: 'maghrib', nameAr: 'المغرب', rakatsAr: '٣ ركعات' },
  { key: 'isha', nameAr: 'العشاء', rakatsAr: '٤ ركعات' },
  { key: 'witr', nameAr: 'الوتر', rakatsAr: 'ركعة أو ٣' },
];

export const EMPTY_QADA_COUNTERS: QadaCounters = {
  fajr: 0,
  dhuhr: 0,
  asr: 0,
  maghrib: 0,
  isha: 0,
  witr: 0,
  fasting: 0,
};

export function getTodayQadaDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function createDefaultQadaState(): QadaState {
  return {
    remaining: { ...EMPTY_QADA_COUNTERS },
    completed: { ...EMPTY_QADA_COUNTERS },
    dailyPaceDays: 1,
    includeWitrInPlan: false,
    reminderEnabled: false,
    reminderTime: '16:30',
    lastRemindedDate: '',
    dailyLog: {},
    recentActions: [],
  };
}

function sanitizeCounters(raw: unknown): QadaCounters {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const cleanNum = (val: unknown) => {
    const n = Number(val);
    return Number.isFinite(n) && n > 0 ? Math.min(100_000, Math.floor(n)) : 0;
  };
  return {
    fajr: cleanNum(obj.fajr),
    dhuhr: cleanNum(obj.dhuhr),
    asr: cleanNum(obj.asr),
    maghrib: cleanNum(obj.maghrib),
    isha: cleanNum(obj.isha),
    witr: cleanNum(obj.witr),
    fasting: cleanNum(obj.fasting),
  };
}

export function loadQadaState(): QadaState {
  const fallback = createDefaultQadaState();
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(QADA_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<QadaState>;
    const pace = Number(parsed.dailyPaceDays);
    return {
      remaining: sanitizeCounters(parsed.remaining),
      completed: sanitizeCounters(parsed.completed),
      dailyPaceDays: Number.isFinite(pace) && pace >= 0.2 && pace <= 10 ? pace : 1,
      includeWitrInPlan: Boolean(parsed.includeWitrInPlan),
      reminderEnabled: Boolean(parsed.reminderEnabled),
      reminderTime:
        typeof parsed.reminderTime === 'string' && /^\d{2}:\d{2}$/.test(parsed.reminderTime)
          ? parsed.reminderTime
          : '16:30',
      lastRemindedDate: typeof parsed.lastRemindedDate === 'string' ? parsed.lastRemindedDate : '',
      dailyLog: parsed.dailyLog && typeof parsed.dailyLog === 'object' ? parsed.dailyLog : {},
      recentActions: Array.isArray(parsed.recentActions) ? parsed.recentActions.slice(0, 12) : [],
    };
  } catch {
    return fallback;
  }
}

export function saveQadaState(state: QadaState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(QADA_STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new Event('qada_state_changed'));
  } catch {
    // ignore storage quota errors
  }
}

export function applyQadaDelta(
  state: QadaState,
  deltas: Partial<QadaCounters>,
  labelAr: string
): QadaState {
  const todayKey = getTodayQadaDateKey();
  const nextRemaining = { ...state.remaining };
  const nextCompleted = { ...state.completed };
  const actualDeltas: Partial<QadaCounters> = {};
  let unitsCompletedNow = 0;

  (Object.keys(deltas) as QadaCountKey[]).forEach((key) => {
    const requested = Math.max(0, Math.floor(deltas[key] || 0));
    if (requested <= 0) return;
    const available = nextRemaining[key];
    const applied = available > 0 ? Math.min(available, requested) : requested;
    if (available > 0) {
      nextRemaining[key] = Math.max(0, available - applied);
    }
    nextCompleted[key] += applied;
    actualDeltas[key] = applied;
    unitsCompletedNow += applied;
  });

  if (unitsCompletedNow === 0) return state;

  const entry: QadaActionEntry = {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    labelAr,
    deltas: actualDeltas,
  };

  const nextDailyLog = {
    ...state.dailyLog,
    [todayKey]: (state.dailyLog[todayKey] || 0) + unitsCompletedNow,
  };

  return {
    ...state,
    remaining: nextRemaining,
    completed: nextCompleted,
    dailyLog: nextDailyLog,
    recentActions: [entry, ...state.recentActions].slice(0, 12),
  };
}

export function undoLastQadaAction(state: QadaState): QadaState {
  const [latest, ...rest] = state.recentActions;
  if (!latest) return state;

  const nextRemaining = { ...state.remaining };
  const nextCompleted = { ...state.completed };
  let unitsReverted = 0;

  (Object.keys(latest.deltas) as QadaCountKey[]).forEach((key) => {
    const amt = Math.max(0, Math.floor(latest.deltas[key] || 0));
    if (amt <= 0) return;
    const reverted = Math.min(nextCompleted[key], amt);
    nextCompleted[key] = Math.max(0, nextCompleted[key] - reverted);
    nextRemaining[key] += reverted;
    unitsReverted += reverted;
  });

  const actionDateKey = latest.timestamp.slice(0, 10);
  const nextDailyLog = { ...state.dailyLog };
  if (nextDailyLog[actionDateKey]) {
    const val = Math.max(0, nextDailyLog[actionDateKey] - unitsReverted);
    if (val === 0) {
      delete nextDailyLog[actionDateKey];
    } else {
      nextDailyLog[actionDateKey] = val;
    }
  }

  return {
    ...state,
    remaining: nextRemaining,
    completed: nextCompleted,
    dailyLog: nextDailyLog,
    recentActions: rest,
  };
}

export interface QadaAnalytics {
  remainingObligatoryPrayers: number;
  completedObligatoryPrayers: number;
  totalRemainingWithWitr: number;
  totalCompletedWithWitr: number;
  progressPercent: number;
  estimatedDaysToFinish: number;
  estimatedFinishHijri: string;
  estimatedFinishGregorian: string;
  todayCompletedCount: number;
  weeklyCompletedCount: number;
  streakDays: number;
}

export function computeQadaAnalytics(state: QadaState, now: Date = new Date()): QadaAnalytics {
  const fardKeys: QadaPrayerKey[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
  const remainingObligatoryPrayers = fardKeys.reduce((acc, k) => acc + state.remaining[k], 0);
  const completedObligatoryPrayers = fardKeys.reduce((acc, k) => acc + state.completed[k], 0);

  const totalRemainingWithWitr =
    remainingObligatoryPrayers + (state.includeWitrInPlan ? state.remaining.witr : 0);
  const totalCompletedWithWitr =
    completedObligatoryPrayers + (state.includeWitrInPlan ? state.completed.witr : 0);

  const grandTotal = totalRemainingWithWitr + totalCompletedWithWitr;
  const progressPercent =
    grandTotal > 0 ? Math.min(100, Math.round((totalCompletedWithWitr / grandTotal) * 100)) : 0;

  const prayersPerDayUnit = state.includeWitrInPlan ? 6 : 5;
  const prayersPerDayPace = Math.max(1, state.dailyPaceDays * prayersPerDayUnit);
  const estimatedDaysToFinish =
    totalRemainingWithWitr > 0 ? Math.ceil(totalRemainingWithWitr / prayersPerDayPace) : 0;

  let estimatedFinishHijri = 'مكتمل بحمد الله';
  let estimatedFinishGregorian = '—';

  if (estimatedDaysToFinish > 0) {
    const finishDate = new Date(now);
    finishDate.setDate(finishDate.getDate() + estimatedDaysToFinish);
    try {
      estimatedFinishHijri = new Intl.DateTimeFormat('ar-EG-u-ca-islamic-umalqura', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(finishDate);
    } catch {
      estimatedFinishHijri = `${toArabicDigits(estimatedDaysToFinish)} يوماً`;
    }
    try {
      estimatedFinishGregorian = new Intl.DateTimeFormat('ar-EG', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(finishDate);
    } catch {
      estimatedFinishGregorian = finishDate.toLocaleDateString('ar-EG');
    }
  }

  const todayKey = getTodayQadaDateKey(now);
  const todayCompletedCount = state.dailyLog[todayKey] || 0;

  let weeklyCompletedCount = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    weeklyCompletedCount += state.dailyLog[getTodayQadaDateKey(d)] || 0;
  }

  let streakDays = 0;
  const checkDate = new Date(now);
  if ((state.dailyLog[getTodayQadaDateKey(checkDate)] || 0) === 0) {
    checkDate.setDate(checkDate.getDate() - 1);
  }
  while (streakDays < 365) {
    const key = getTodayQadaDateKey(checkDate);
    if ((state.dailyLog[key] || 0) > 0) {
      streakDays += 1;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return {
    remainingObligatoryPrayers,
    completedObligatoryPrayers,
    totalRemainingWithWitr,
    totalCompletedWithWitr,
    progressPercent,
    estimatedDaysToFinish,
    estimatedFinishHijri,
    estimatedFinishGregorian,
    todayCompletedCount,
    weeklyCompletedCount,
    streakDays,
  };
}

export function isQadaReminderDue(state: QadaState, now: Date = new Date()): boolean {
  if (!state.reminderEnabled) return false;
  const analytics = computeQadaAnalytics(state, now);
  if (analytics.totalRemainingWithWitr === 0 && state.remaining.fasting === 0) return false;

  const todayKey = getTodayQadaDateKey(now);
  if (state.lastRemindedDate === todayKey) return false;
  if ((state.dailyLog[todayKey] || 0) > 0) return false;

  const [hh, mm] = state.reminderTime.split(':').map(Number);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return false;

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const targetMinutes = hh * 60 + mm;
  return currentMinutes >= targetMinutes && currentMinutes <= targetMinutes + 180;
}
