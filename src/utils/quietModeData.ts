import { PrayerName } from '../types';
import { toArabicDigits } from './khatmaData';

export type QuietExceptionPolicy = 'fajr_only' | 'all_adhan' | 'none';

export interface QuietSchedulePeriod {
  id: string;
  label: string;
  startTime: string; // HH:MM (24h)
  endTime: string; // HH:MM (24h)
  enabled: boolean;
}

export interface QuietModeState {
  manualActive: boolean;
  pauseUntilMs: number | null;
  pauseLabelAr: string | null;
  exceptionPolicy: QuietExceptionPolicy;
  schedules: QuietSchedulePeriod[];
}

export interface QuietModeEvaluation {
  isQuietNow: boolean;
  reasonType: 'manual' | 'quick_pause' | 'schedule' | 'none';
  activeSchedule: QuietSchedulePeriod | null;
  remainingPauseMs: number;
  remainingPauseText: string;
  enabledSchedulesCount: number;
  statusHeadlineAr: string;
  statusDetailAr: string;
  tileSubLabelAr: string;
}

export const QUIET_MODE_STORAGE_KEY = 'mihrab_quiet_mode_v1';
export const QUIET_MODE_UPDATED_EVENT = 'mihrab_quiet_mode_changed';

export const DEFAULT_QUIET_SCHEDULES: QuietSchedulePeriod[] = [
  {
    id: 'sleep_night',
    label: 'فترة النوم الليلية',
    startTime: '23:00',
    endTime: '06:00',
    enabled: false,
  },
  {
    id: 'work_meetings',
    label: 'وقت العمل والاجتماعات',
    startTime: '09:00',
    endTime: '17:00',
    enabled: false,
  },
];

export const DEFAULT_QUIET_MODE_STATE: QuietModeState = {
  manualActive: false,
  pauseUntilMs: null,
  pauseLabelAr: null,
  exceptionPolicy: 'fajr_only',
  schedules: DEFAULT_QUIET_SCHEDULES,
};

function isValidTimeStr(val: unknown): val is string {
  return typeof val === 'string' && /^\d{2}:\d{2}$/.test(val);
}

export function normalizeQuietModeState(raw: Partial<QuietModeState> | null | undefined): QuietModeState {
  const nowMs = Date.now();
  const pauseUntilMs =
    typeof raw?.pauseUntilMs === 'number' && Number.isFinite(raw.pauseUntilMs) && raw.pauseUntilMs > nowMs
      ? raw.pauseUntilMs
      : null;

  const exceptionPolicy: QuietExceptionPolicy =
    raw?.exceptionPolicy === 'all_adhan' ||
    raw?.exceptionPolicy === 'none' ||
    raw?.exceptionPolicy === 'fajr_only'
      ? raw.exceptionPolicy
      : DEFAULT_QUIET_MODE_STATE.exceptionPolicy;

  const schedules: QuietSchedulePeriod[] =
    Array.isArray(raw?.schedules) && raw.schedules.length > 0
      ? raw.schedules
          .filter((item): item is QuietSchedulePeriod => Boolean(item && typeof item === 'object'))
          .map((item, idx) => ({
            id: typeof item.id === 'string' && item.id.trim() ? item.id : `quiet_slot_${idx + 1}`,
            label: typeof item.label === 'string' && item.label.trim() ? item.label.trim() : `فترة ${idx + 1}`,
            startTime: isValidTimeStr(item.startTime) ? item.startTime : '23:00',
            endTime: isValidTimeStr(item.endTime) ? item.endTime : '06:00',
            enabled: Boolean(item.enabled),
          }))
      : DEFAULT_QUIET_SCHEDULES.map((s) => ({ ...s }));

  return {
    manualActive: Boolean(raw?.manualActive),
    pauseUntilMs,
    pauseLabelAr: pauseUntilMs && typeof raw?.pauseLabelAr === 'string' ? raw.pauseLabelAr : null,
    exceptionPolicy,
    schedules,
  };
}

export function loadQuietModeState(): QuietModeState {
  if (typeof window === 'undefined') {
    return { ...DEFAULT_QUIET_MODE_STATE, schedules: DEFAULT_QUIET_SCHEDULES.map((s) => ({ ...s })) };
  }
  try {
    const raw = localStorage.getItem(QUIET_MODE_STORAGE_KEY);
    if (!raw) {
      return { ...DEFAULT_QUIET_MODE_STATE, schedules: DEFAULT_QUIET_SCHEDULES.map((s) => ({ ...s })) };
    }
    const parsed = JSON.parse(raw) as Partial<QuietModeState>;
    return normalizeQuietModeState(parsed);
  } catch {
    return { ...DEFAULT_QUIET_MODE_STATE, schedules: DEFAULT_QUIET_SCHEDULES.map((s) => ({ ...s })) };
  }
}

export function saveQuietModeState(state: QuietModeState): QuietModeState {
  const normalized = normalizeQuietModeState(state);
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(QUIET_MODE_STORAGE_KEY, JSON.stringify(normalized));
      window.dispatchEvent(new CustomEvent(QUIET_MODE_UPDATED_EVENT, { detail: normalized }));
    } catch {
      // ignore storage errors
    }
  }
  return normalized;
}

export function parseTimeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  const safeH = Number.isFinite(h) ? Math.min(23, Math.max(0, h)) : 0;
  const safeM = Number.isFinite(m) ? Math.min(59, Math.max(0, m)) : 0;
  return safeH * 60 + safeM;
}

export function isTimeWithinQuietWindow(now: Date, startTime: string, endTime: string): boolean {
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = parseTimeToMinutes(startTime);
  const endMinutes = parseTimeToMinutes(endTime);

  if (startMinutes === endMinutes) {
    return true;
  }
  if (startMinutes < endMinutes) {
    return nowMinutes >= startMinutes && nowMinutes < endMinutes;
  }
  // Overnight window (e.g. 23:00 -> 06:00)
  return nowMinutes >= startMinutes || nowMinutes < endMinutes;
}

export function formatTime12ArShort(timeStr: string): string {
  const total = parseTimeToMinutes(timeStr);
  const h24 = Math.floor(total / 60);
  const m = total % 60;
  const period = h24 >= 12 ? 'م' : 'ص';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${toArabicDigits(String(h12))}:${toArabicDigits(String(m).padStart(2, '0'))} ${period}`;
}

export function formatRemainingDuration(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function computeUntilFajrTimestamp(
  fajrTimeStr: string,
  now: Date = new Date()
): { untilMs: number; labelAr: string } {
  const [fh, fm] = fajrTimeStr.split(':').map(Number);
  const fajrH = Number.isFinite(fh) ? fh : 4;
  const fajrM = Number.isFinite(fm) ? fm : 30;

  const target = new Date(now);
  target.setHours(fajrH, fajrM, 0, 0);
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }
  return {
    untilMs: target.getTime(),
    labelAr: `حتى صلاة الفجر (${formatTime12ArShort(fajrTimeStr)})`,
  };
}

export function evaluateQuietMode(
  state: QuietModeState,
  now: Date = new Date()
): QuietModeEvaluation {
  const nowMs = now.getTime();
  const enabledSchedules = state.schedules.filter((s) => s.enabled);
  const activeSchedule =
    enabledSchedules.find((s) => isTimeWithinQuietWindow(now, s.startTime, s.endTime)) || null;

  const remainingPauseMs =
    state.pauseUntilMs !== null && state.pauseUntilMs > nowMs ? state.pauseUntilMs - nowMs : 0;

  if (state.manualActive) {
    return {
      isQuietNow: true,
      reasonType: 'manual',
      activeSchedule,
      remainingPauseMs,
      remainingPauseText: remainingPauseMs > 0 ? formatRemainingDuration(remainingPauseMs) : '',
      enabledSchedulesCount: enabledSchedules.length,
      statusHeadlineAr: 'وضع السكون نشط الآن (يدوي)',
      statusDetailAr: 'تم إيقاف الإشعارات والتذكيرات حتى تقوم بإعادة تشغيلها.',
      tileSubLabelAr: 'نشط الآن',
    };
  }

  if (remainingPauseMs > 0) {
    const countdown = formatRemainingDuration(remainingPauseMs);
    return {
      isQuietNow: true,
      reasonType: 'quick_pause',
      activeSchedule,
      remainingPauseMs,
      remainingPauseText: countdown,
      enabledSchedulesCount: enabledSchedules.length,
      statusHeadlineAr: state.pauseLabelAr
        ? `إيقاف مؤقت (${state.pauseLabelAr})`
        : 'وضع السكون المؤقت نشط الآن',
      statusDetailAr: `تعود التنبيهات تلقائياً بعد ${countdown}`,
      tileSubLabelAr: 'مؤقت نشط',
    };
  }

  if (activeSchedule) {
    return {
      isQuietNow: true,
      reasonType: 'schedule',
      activeSchedule,
      remainingPauseMs: 0,
      remainingPauseText: '',
      enabledSchedulesCount: enabledSchedules.length,
      statusHeadlineAr: `وضع السكون المجدول نشط (${activeSchedule.label})`,
      statusDetailAr: `من ${formatTime12ArShort(activeSchedule.startTime)} إلى ${formatTime12ArShort(
        activeSchedule.endTime
      )}`,
      tileSubLabelAr: 'نشط الآن',
    };
  }

  if (enabledSchedules.length > 0) {
    return {
      isQuietNow: false,
      reasonType: 'none',
      activeSchedule: null,
      remainingPauseMs: 0,
      remainingPauseText: '',
      enabledSchedulesCount: enabledSchedules.length,
      statusHeadlineAr: 'الإشعارات تعمل بشكل طبيعي',
      statusDetailAr: `لديك ${toArabicDigits(enabledSchedules.length)} ${
        enabledSchedules.length === 1 ? 'فترة سكون مجدولة' : 'فترات سكون مجدولة'
      } ستعمل تلقائياً في وقتها.`,
      tileSubLabelAr: 'مجدول',
    };
  }

  return {
    isQuietNow: false,
    reasonType: 'none',
    activeSchedule: null,
    remainingPauseMs: 0,
    remainingPauseText: '',
    enabledSchedulesCount: 0,
    statusHeadlineAr: 'الإشعارات والتذكيرات مفعّلة',
    statusDetailAr: 'اختر فترة مجدولة أو إيقافاً مؤقتاً للهدوء والتركيز في أي وقت.',
    tileSubLabelAr: 'متاح',
  };
}

/**
 * Suppresses non-Fard reminders (Salawat, Periodic Verses/Hadith, Adhkar, Duha/Sunrise,
 * Post-Prayer check-in, Last Third Qiyam/Witr/Suhoor, Qada/Hifz) when Quiet Mode is active.
 */
export function shouldSuppressGeneralNotification(
  state: QuietModeState,
  now: Date = new Date()
): boolean {
  return evaluateQuietMode(state, now).isQuietNow;
}

/**
 * Evaluates whether a Prayer's Pre-Adhan, Adhan, or Iqama audio/alert should be suppressed
 * under Quiet Mode while honoring the user's Adhan / Fajr exception policy.
 */
export function shouldSuppressPrayerAudioOrAlert(
  state: QuietModeState,
  prayerKey: PrayerName,
  now: Date = new Date()
): boolean {
  const { isQuietNow } = evaluateQuietMode(state, now);
  if (!isQuietNow) return false;

  if (state.exceptionPolicy === 'all_adhan') {
    return prayerKey === 'sunrise';
  }
  if (state.exceptionPolicy === 'fajr_only') {
    return prayerKey !== 'fajr';
  }
  return true;
}

export function getExceptionPolicyLabelAr(policy: QuietExceptionPolicy): string {
  switch (policy) {
    case 'fajr_only':
      return 'استثناء أذان الفجر فقط';
    case 'all_adhan':
      return 'استثناء الأذانات الخمسة';
    case 'none':
      return 'كتم شامل لجميع الأصوات';
  }
}
