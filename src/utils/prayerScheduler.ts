import { PrayerName, PrayerTimeData, UserSettings } from '../types';
import {
  loadQuietModeState,
  shouldSuppressGeneralNotification,
  shouldSuppressPrayerAudioOrAlert,
} from './quietModeData';

export type ScheduledPrayerEventType = 'adhan' | 'pre_adhan' | 'iqama' | 'post10';

export interface DuePrayerEvent {
  type: ScheduledPrayerEventType;
  prayerKey: PrayerName;
  prayerNameAr: string;
  adhanTimeStr: string;
  targetEpochMs: number;
  dedupKey: string;
}

const FIRED_STORAGE_KEY = 'mihrab_scheduler_fired_v1';
const PRUNE_MAX_AGE_MS = 36 * 60 * 60 * 1000;

let firedCache: Record<string, number> | null = null;

function loadFiredMap(): Record<string, number> {
  if (firedCache) return firedCache;
  const fresh: Record<string, number> = {};
  if (typeof window === 'undefined') {
    firedCache = fresh;
    return firedCache;
  }
  try {
    const raw = localStorage.getItem(FIRED_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const cutoff = Date.now() - PRUNE_MAX_AGE_MS;
      for (const [k, v] of Object.entries(parsed)) {
        if (typeof v === 'number' && v >= cutoff) {
          fresh[k] = v;
        }
      }
    }
  } catch {
    // ignore storage errors
  }
  firedCache = fresh;
  return firedCache;
}

export function toSchedulerDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function hasSchedulerFired(dedupKey: string): boolean {
  const map = loadFiredMap();
  return typeof map[dedupKey] === 'number';
}

export function markSchedulerFired(dedupKey: string): void {
  const map = loadFiredMap();
  const now = Date.now();
  const cutoff = now - PRUNE_MAX_AGE_MS;
  for (const key of Object.keys(map)) {
    if (map[key] < cutoff) {
      delete map[key];
    }
  }
  map[dedupKey] = now;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(FIRED_STORAGE_KEY, JSON.stringify(map));
    } catch {
      // ignore storage quota issues
    }
  }
}

export function parsePrayerTimeEpoch(
  baseDate: Date,
  hhmm: string,
  dayOffset: number = 0
): number | null {
  if (!hhmm || !hhmm.includes(':')) return null;
  const [hRaw, mRaw] = hhmm.split(':').map(Number);
  if (!Number.isFinite(hRaw) || !Number.isFinite(mRaw)) return null;
  const d = new Date(baseDate.getTime());
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hRaw, mRaw, 0, 0);
  return d.getTime();
}

export function isEventDueInWindow(
  nowMs: number,
  targetMs: number,
  appMountedAtMs: number
): boolean {
  // 250ms early tolerance for timer jitter, up to 120s catch-up when app was open/backgrounded
  // (or 15s on cold initial startup so opening app late doesn't blast an old Adhan).
  const isWarmSession = nowMs - appMountedAtMs > 5000;
  const maxCatchupMs = isWarmSession ? 120_000 : 15_000;
  return nowMs >= targetMs - 250 && nowMs - targetMs <= maxCatchupMs;
}

const FIVE_PRAYERS: Array<{ key: Exclude<PrayerName, 'sunrise'>; nameAr: string }> = [
  { key: 'fajr', nameAr: 'الفجر' },
  { key: 'dhuhr', nameAr: 'الظهر' },
  { key: 'asr', nameAr: 'العصر' },
  { key: 'maghrib', nameAr: 'المغرب' },
  { key: 'isha', nameAr: 'العشاء' },
];

export function evaluateDuePrayerEvents(params: {
  now: Date;
  prayerTimes: PrayerTimeData;
  settings: UserSettings;
  appMountedAtMs: number;
  jumuahPreviewMode?: boolean;
}): DuePrayerEvent[] {
  const { now, prayerTimes, settings, appMountedAtMs, jumuahPreviewMode = false } = params;
  const nowMs = now.getTime();
  const quietState = loadQuietModeState();
  const notificationsEnabled = settings.notificationsEnabled !== false;
  const preAdhanMinutes = settings.preAdhanReminderMinutes ?? 10;
  const iqamaMap = settings.iqamaMinutes || {
    fajr: 20,
    dhuhr: 20,
    asr: 20,
    maghrib: 10,
    isha: 20,
  };

  const results: DuePrayerEvent[] = [];

  // Check yesterday (-1, useful for midnight Iqama / post10 after Isha) and today (0) and tomorrow (+1, useful for Pre-Adhan before midnight)
  const dayOffsets = [-1, 0, 1];

  for (const dayOffset of dayOffsets) {
    const refDate = new Date(nowMs);
    refDate.setDate(refDate.getDate() + dayOffset);
    const dateKey = toSchedulerDateKey(refDate);
    const isFriday = refDate.getDay() === 5 || (dayOffset === 0 && jumuahPreviewMode);

    for (const p of FIVE_PRAYERS) {
      const timeStr = prayerTimes[p.key];
      const adhanEpoch = parsePrayerTimeEpoch(now, timeStr, dayOffset);
      if (adhanEpoch === null) continue;

      const displayName = isFriday && p.key === 'dhuhr' ? 'الجمعة' : p.nameAr;
      const isPrayerAdhanActive = settings.prayerAdhanEnabled?.[p.key] !== false;
      const suppressedByQuiet = shouldSuppressPrayerAudioOrAlert(quietState, p.key, now);

      // 1. Exact Adhan Arrival
      if (notificationsEnabled && isPrayerAdhanActive && !suppressedByQuiet) {
        const adhanKey = `${dateKey}|adhan|${p.key}|${timeStr}`;
        if (
          !hasSchedulerFired(adhanKey) &&
          isEventDueInWindow(nowMs, adhanEpoch, appMountedAtMs)
        ) {
          results.push({
            type: 'adhan',
            prayerKey: p.key,
            prayerNameAr: displayName,
            adhanTimeStr: timeStr,
            targetEpochMs: adhanEpoch,
            dedupKey: adhanKey,
          });
        }
      }

      // 2. Pre-Adhan Preparation Reminder
      if (preAdhanMinutes > 0 && isPrayerAdhanActive && !suppressedByQuiet) {
        const preEpoch = adhanEpoch - preAdhanMinutes * 60_000;
        const preKey = `${dateKey}|pre_adhan|${p.key}|${timeStr}|${preAdhanMinutes}`;
        if (
          !hasSchedulerFired(preKey) &&
          isEventDueInWindow(nowMs, preEpoch, appMountedAtMs)
        ) {
          results.push({
            type: 'pre_adhan',
            prayerKey: p.key,
            prayerNameAr: displayName,
            adhanTimeStr: timeStr,
            targetEpochMs: preEpoch,
            dedupKey: preKey,
          });
        }
      }

      // 3. Exact Iqama Arrival
      const iqamaOffsetMins = Math.max(1, iqamaMap[p.key] || 20);
      const iqamaEpoch = adhanEpoch + iqamaOffsetMins * 60_000;
      if (!suppressedByQuiet) {
        const iqamaKey = `${dateKey}|iqama|${p.key}|${timeStr}|${iqamaOffsetMins}`;
        if (
          !hasSchedulerFired(iqamaKey) &&
          isEventDueInWindow(nowMs, iqamaEpoch, appMountedAtMs)
        ) {
          results.push({
            type: 'iqama',
            prayerKey: p.key,
            prayerNameAr: displayName,
            adhanTimeStr: timeStr,
            targetEpochMs: iqamaEpoch,
            dedupKey: iqamaKey,
          });
        }
      }

      // 4. Post-Prayer Tasbih & Adhkar Reminder (+10 minutes after Adhan)
      if (!shouldSuppressGeneralNotification(quietState, now)) {
        const postEpoch = adhanEpoch + 10 * 60_000;
        const postKey = `${dateKey}|post10|${p.key}|${timeStr}`;
        if (
          !hasSchedulerFired(postKey) &&
          isEventDueInWindow(nowMs, postEpoch, appMountedAtMs)
        ) {
          results.push({
            type: 'post10',
            prayerKey: p.key,
            prayerNameAr: displayName,
            adhanTimeStr: timeStr,
            targetEpochMs: postEpoch,
            dedupKey: postKey,
          });
        }
      }
    }
  }

  return results;
}

/**
 * Starts a resilient 500ms ticker backed by an inline Web Worker (less throttled in background tabs)
 * plus visibility/focus catch-up triggers and a fallback interval.
 */
export function createPrecisionClockTicker(onTick: (now: Date) => void): () => void {
  let stopped = false;
  let worker: Worker | null = null;
  let workerUrl: string | null = null;
  let fallbackTimer: number | null = null;

  const fire = () => {
    if (stopped) return;
    onTick(new Date());
  };

  if (typeof window !== 'undefined' && typeof Worker !== 'undefined') {
    try {
      const code = `
        var id = setInterval(function(){ postMessage('t'); }, 500);
        self.onmessage = function(e){ if (e.data === 'stop') clearInterval(id); };
      `;
      const blob = new Blob([code], { type: 'application/javascript' });
      workerUrl = URL.createObjectURL(blob);
      worker = new Worker(workerUrl);
      worker.onmessage = fire;
    } catch {
      worker = null;
    }
  }

  // Fallback / belt-and-suspenders interval
  if (typeof window !== 'undefined') {
    fallbackTimer = window.setInterval(fire, worker ? 2000 : 500);
  }

  const onVisibilityOrFocus = () => {
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
    fire();
  };

  if (typeof window !== 'undefined') {
    document.addEventListener('visibilitychange', onVisibilityOrFocus);
    window.addEventListener('focus', onVisibilityOrFocus);
    window.addEventListener('pageshow', onVisibilityOrFocus);
  }

  // Immediate initial tick
  fire();

  return () => {
    stopped = true;
    if (worker) {
      try {
        worker.postMessage('stop');
        worker.terminate();
      } catch {
        // ignore
      }
      worker = null;
    }
    if (workerUrl) {
      try {
        URL.revokeObjectURL(workerUrl);
      } catch {
        // ignore
      }
      workerUrl = null;
    }
    if (fallbackTimer !== null && typeof window !== 'undefined') {
      window.clearInterval(fallbackTimer);
    }
    if (typeof window !== 'undefined') {
      document.removeEventListener('visibilitychange', onVisibilityOrFocus);
      window.removeEventListener('focus', onVisibilityOrFocus);
      window.removeEventListener('pageshow', onVisibilityOrFocus);
    }
  };
}
