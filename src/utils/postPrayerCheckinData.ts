import { PrayerTimeData } from '../types';
import { MIHRAB_WIDGET_BRIDGE_KEY } from './widgetStudioData';

export type CheckinPrayerKey = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export interface PrayerCheckinItem {
  fard: boolean;
  adhkar: boolean;
  wird: boolean;
}

export interface DailyCheckinState {
  dateKey: string;
  prayers: Record<CheckinPrayerKey, PrayerCheckinItem>;
  notifiedPrayers: Partial<Record<CheckinPrayerKey, boolean>>;
}

export interface ActivePostPrayerWindow {
  prayerKey: CheckinPrayerKey;
  prayerNameAr: string;
  minutesElapsed: number;
}

export const CHECKIN_PRAYER_ORDER: CheckinPrayerKey[] = [
  'fajr',
  'dhuhr',
  'asr',
  'maghrib',
  'isha',
];

export const POST_PRAYER_CHECKIN_STORAGE_KEY = 'al_mawaqeet_post_prayer_checkin_v1';
const PRAYER_TRACKER_STORAGE_KEY = 'al_mawaqeet_prayer_tracker';

export function getTodayCheckinDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getCheckinPrayerNameAr(prayerKey: CheckinPrayerKey, date: Date = new Date()): string {
  if (prayerKey === 'fajr') return 'الفجر';
  if (prayerKey === 'dhuhr') return date.getDay() === 5 ? 'الجمعة' : 'الظهر';
  if (prayerKey === 'asr') return 'العصر';
  if (prayerKey === 'maghrib') return 'المغرب';
  return 'العشاء';
}

export function createEmptyDailyCheckinState(dateKey: string = getTodayCheckinDateKey()): DailyCheckinState {
  return {
    dateKey,
    prayers: {
      fajr: { fard: false, adhkar: false, wird: false },
      dhuhr: { fard: false, adhkar: false, wird: false },
      asr: { fard: false, adhkar: false, wird: false },
      maghrib: { fard: false, adhkar: false, wird: false },
      isha: { fard: false, adhkar: false, wird: false },
    },
    notifiedPrayers: {},
  };
}

function normalizeCheckinItem(raw: any): PrayerCheckinItem {
  return {
    fard: Boolean(raw?.fard),
    adhkar: Boolean(raw?.adhkar),
    wird: Boolean(raw?.wird),
  };
}

export function loadTodayCheckinState(dateKey: string = getTodayCheckinDateKey()): DailyCheckinState {
  if (typeof window === 'undefined') return createEmptyDailyCheckinState(dateKey);
  try {
    const raw = localStorage.getItem(POST_PRAYER_CHECKIN_STORAGE_KEY);
    if (!raw) return createEmptyDailyCheckinState(dateKey);
    const parsed = JSON.parse(raw);
    const dayRaw = parsed && parsed[dateKey] ? parsed[dateKey] : null;
    if (!dayRaw) return createEmptyDailyCheckinState(dateKey);

    return {
      dateKey,
      prayers: {
        fajr: normalizeCheckinItem(dayRaw.prayers?.fajr),
        dhuhr: normalizeCheckinItem(dayRaw.prayers?.dhuhr),
        asr: normalizeCheckinItem(dayRaw.prayers?.asr),
        maghrib: normalizeCheckinItem(dayRaw.prayers?.maghrib),
        isha: normalizeCheckinItem(dayRaw.prayers?.isha),
      },
      notifiedPrayers:
        dayRaw.notifiedPrayers && typeof dayRaw.notifiedPrayers === 'object'
          ? dayRaw.notifiedPrayers
          : {},
    };
  } catch {
    return createEmptyDailyCheckinState(dateKey);
  }
}

function syncPrayerTrackerFard(prayerKey: CheckinPrayerKey, fardCompleted: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    const isoToday = new Date().toISOString().split('T')[0];
    const raw = localStorage.getItem(PRAYER_TRACKER_STORAGE_KEY);
    const history = raw ? JSON.parse(raw) : {};
    const entry = history[isoToday] || {
      date: isoToday,
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
    entry[prayerKey] = fardCompleted;
    if (!fardCompleted) {
      entry[`${prayerKey}Mosque`] = false;
    }
    history[isoToday] = entry;
    localStorage.setItem(PRAYER_TRACKER_STORAGE_KEY, JSON.stringify(history));
  } catch {
    // ignore storage errors
  }
}

export function saveTodayCheckinState(state: DailyCheckinState): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(POST_PRAYER_CHECKIN_STORAGE_KEY);
    const map = raw ? JSON.parse(raw) : {};
    map[state.dateKey] = state;

    // Keep last 30 days to avoid unbounded growth
    const keys = Object.keys(map).sort();
    if (keys.length > 30) {
      for (const oldKey of keys.slice(0, keys.length - 30)) {
        delete map[oldKey];
      }
    }

    localStorage.setItem(POST_PRAYER_CHECKIN_STORAGE_KEY, JSON.stringify(map));
    window.dispatchEvent(new CustomEvent('post_prayer_checkin_changed', { detail: state }));

    // Trigger mihrabWidgetSync immediately for external widgets / bridges
    try {
      const bridgeRaw = localStorage.getItem(MIHRAB_WIDGET_BRIDGE_KEY);
      const bridgePayload = bridgeRaw ? JSON.parse(bridgeRaw) : { updatedAt: new Date().toISOString() };
      bridgePayload.updatedAt = new Date().toISOString();
      bridgePayload.postPrayerCheckin = state;
      localStorage.setItem(MIHRAB_WIDGET_BRIDGE_KEY, JSON.stringify(bridgePayload));
      window.dispatchEvent(new CustomEvent('mihrabWidgetSync', { detail: bridgePayload }));
    } catch {
      window.dispatchEvent(new CustomEvent('mihrabWidgetSync', { detail: { postPrayerCheckin: state } }));
    }
  } catch {
    // ignore storage quota errors
  }
}

export function toggleCheckinField(
  prayerKey: CheckinPrayerKey,
  field: keyof PrayerCheckinItem,
  forceValue?: boolean,
  dateKey: string = getTodayCheckinDateKey()
): DailyCheckinState {
  const current = loadTodayCheckinState(dateKey);
  const nextVal =
    typeof forceValue === 'boolean' ? forceValue : !current.prayers[prayerKey][field];
  const updated: DailyCheckinState = {
    ...current,
    prayers: {
      ...current.prayers,
      [prayerKey]: {
        ...current.prayers[prayerKey],
        [field]: nextVal,
      },
    },
  };
  if (field === 'fard') {
    syncPrayerTrackerFard(prayerKey, nextVal);
  }
  saveTodayCheckinState(updated);
  return updated;
}

export function completePrayerFardAndAdhkar(
  prayerKey: CheckinPrayerKey,
  dateKey: string = getTodayCheckinDateKey()
): DailyCheckinState {
  const current = loadTodayCheckinState(dateKey);
  const updated: DailyCheckinState = {
    ...current,
    prayers: {
      ...current.prayers,
      [prayerKey]: {
        ...current.prayers[prayerKey],
        fard: true,
        adhkar: true,
      },
    },
  };
  syncPrayerTrackerFard(prayerKey, true);
  saveTodayCheckinState(updated);
  return updated;
}

export function markPostPrayerNotified(
  prayerKey: CheckinPrayerKey,
  dateKey: string = getTodayCheckinDateKey()
): DailyCheckinState {
  const current = loadTodayCheckinState(dateKey);
  const updated: DailyCheckinState = {
    ...current,
    notifiedPrayers: {
      ...current.notifiedPrayers,
      [prayerKey]: true,
    },
  };
  saveTodayCheckinState(updated);
  return updated;
}

export function calculateDailyCheckinStats(state: DailyCheckinState): {
  completedCount: number;
  totalCount: number;
  percent: number;
  completedPrayersCount: number;
} {
  let completedCount = 0;
  let completedPrayersCount = 0;
  const totalCount = CHECKIN_PRAYER_ORDER.length * 3;
  for (const key of CHECKIN_PRAYER_ORDER) {
    const item = state.prayers[key];
    if (item.fard) completedCount++;
    if (item.adhkar) completedCount++;
    if (item.wird) completedCount++;
    if (item.fard && item.adhkar && item.wird) {
      completedPrayersCount++;
    }
  }
  const percent = Math.round((completedCount / totalCount) * 100);
  return { completedCount, totalCount, percent, completedPrayersCount };
}

function parseMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * Finds the prayer currently in the 15-to-60-minute post-Adhan check-in window.
 */
export function getActivePostPrayerWindow(
  prayerTimes: PrayerTimeData,
  now: Date = new Date()
): ActivePostPrayerWindow | null {
  const nowMinutes = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  for (let i = CHECKIN_PRAYER_ORDER.length - 1; i >= 0; i--) {
    const key = CHECKIN_PRAYER_ORDER[i];
    const adhanMins = parseMinutes(prayerTimes[key]);
    const diff = nowMinutes - adhanMins;
    if (diff >= 15 && diff <= 60) {
      return {
        prayerKey: key,
        prayerNameAr: getCheckinPrayerNameAr(key, now),
        minutesElapsed: Math.floor(diff),
      };
    }
  }
  return null;
}

/**
 * Returns the latest passed prayer (or current next prayer fallback) for preview/testing.
 */
export function getLatestPassedPrayer(
  prayerTimes: PrayerTimeData,
  now: Date = new Date()
): { prayerKey: CheckinPrayerKey; prayerNameAr: string } {
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  for (let i = CHECKIN_PRAYER_ORDER.length - 1; i >= 0; i--) {
    const key = CHECKIN_PRAYER_ORDER[i];
    if (nowMinutes >= parseMinutes(prayerTimes[key])) {
      return {
        prayerKey: key,
        prayerNameAr: getCheckinPrayerNameAr(key, now),
      };
    }
  }
  return {
    prayerKey: 'fajr',
    prayerNameAr: getCheckinPrayerNameAr('fajr', now),
  };
}

/**
 * Checks if a prayer has reached its post-Adhan notification delay (default 20 min)
 * and has not been notified yet today.
 */
export function getDuePostPrayerNotification(
  prayerTimes: PrayerTimeData,
  delayMinutes: number,
  state: DailyCheckinState,
  now: Date = new Date()
): { prayerKey: CheckinPrayerKey; prayerNameAr: string; dateKey: string } | null {
  const nowMinutes = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  for (let i = CHECKIN_PRAYER_ORDER.length - 1; i >= 0; i--) {
    const key = CHECKIN_PRAYER_ORDER[i];
    if (state.notifiedPrayers[key]) continue;
    const diff = nowMinutes - parseMinutes(prayerTimes[key]);
    if (diff >= delayMinutes && diff < delayMinutes + 10) {
      return {
        prayerKey: key,
        prayerNameAr: getCheckinPrayerNameAr(key, now),
        dateKey: state.dateKey,
      };
    }
  }
  return null;
}
