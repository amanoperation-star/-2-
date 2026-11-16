import { KhatmaPrayerKey } from './khatmaData';

export interface SunnahRawatibState {
  dateKey: string;
  fajr: boolean; // 2 rakats before
  dhuhrBefore: boolean; // 4 rakats before
  dhuhrAfter: boolean; // 2 rakats after
  asr: boolean; // 4 rakats recommended before Asr
  maghrib: boolean; // 2 rakats after
  isha: boolean; // 2 rakats after
}

export const RAWATIB_TOTAL_TARGET = 12;

export const getTodaySunnahDateKey = (): string => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const createEmptySunnahRawatibState = (): SunnahRawatibState => ({
  dateKey: getTodaySunnahDateKey(),
  fajr: false,
  dhuhrBefore: false,
  dhuhrAfter: false,
  asr: false,
  maghrib: false,
  isha: false,
});

export const loadSunnahRawatibState = (): SunnahRawatibState => {
  const todayKey = getTodaySunnahDateKey();
  if (typeof window === 'undefined') return createEmptySunnahRawatibState();
  try {
    const raw = localStorage.getItem('sunnah_rawatib_progress_v1');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.dateKey === todayKey) {
        return {
          dateKey: todayKey,
          fajr: Boolean(parsed.fajr),
          dhuhrBefore: Boolean(parsed.dhuhrBefore),
          dhuhrAfter: Boolean(parsed.dhuhrAfter),
          asr: Boolean(parsed.asr),
          maghrib: Boolean(parsed.maghrib),
          isha: Boolean(parsed.isha),
        };
      }
    }
  } catch {
    // ignore storage errors
  }
  return createEmptySunnahRawatibState();
};

export const saveSunnahRawatibState = (state: SunnahRawatibState): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('sunnah_rawatib_progress_v1', JSON.stringify(state));
    window.dispatchEvent(new Event('sunnah_rawatib_changed'));
  } catch {
    // ignore storage errors
  }
};

export const countCompletedRawatibRakats = (state: SunnahRawatibState): number => {
  let total = 0;
  if (state.fajr) total += 2;
  if (state.dhuhrBefore) total += 4;
  if (state.dhuhrAfter) total += 2;
  if (state.maghrib) total += 2;
  if (state.isha) total += 2;
  return total;
};

export const isPrayerSunnahCompleted = (
  state: SunnahRawatibState,
  prayerKey: KhatmaPrayerKey
): boolean => {
  if (prayerKey === 'fajr') return state.fajr;
  if (prayerKey === 'dhuhr') return state.dhuhrBefore && state.dhuhrAfter;
  if (prayerKey === 'asr') return state.asr;
  if (prayerKey === 'maghrib') return state.maghrib;
  return state.isha;
};

export const togglePrayerSunnahCompleted = (
  prayerKey: KhatmaPrayerKey,
  forceValue?: boolean
): SunnahRawatibState => {
  const current = loadSunnahRawatibState();
  const currentlyCompleted = isPrayerSunnahCompleted(current, prayerKey);
  const nextVal = typeof forceValue === 'boolean' ? forceValue : !currentlyCompleted;
  const updated: SunnahRawatibState =
    prayerKey === 'dhuhr'
      ? { ...current, dhuhrBefore: nextVal, dhuhrAfter: nextVal }
      : { ...current, [prayerKey]: nextVal };
  saveSunnahRawatibState(updated);
  return updated;
};

export const SUNNAH_RAWATIB_LABELS: Record<
  KhatmaPrayerKey,
  { title: string; rakatsLabel: string; isRawatib: boolean }
> = {
  fajr: {
    title: 'سنة الفجر: ٢ ركعة قبلية',
    rakatsLabel: '٢ ركعة',
    isRawatib: true,
  },
  dhuhr: {
    title: 'سنة الظهر: ٤ قبلية + ٢ بعدية',
    rakatsLabel: '٦ ركعات',
    isRawatib: true,
  },
  asr: {
    title: 'سنة مستحبة: ٤ ركعات قبل العصر',
    rakatsLabel: '٤ مستحبة',
    isRawatib: false,
  },
  maghrib: {
    title: 'سنة المغرب: ٢ ركعة بعدية',
    rakatsLabel: '٢ ركعة',
    isRawatib: true,
  },
  isha: {
    title: 'سنة العشاء: ٢ ركعة بعدية',
    rakatsLabel: '٢ ركعة',
    isRawatib: true,
  },
};
