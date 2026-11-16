import { AppThemeId, AutoThemeTriggerMode } from '../types';

export interface AppThemeDefinition {
  id: AppThemeId;
  nameAr: string;
  subtitleAr: string;
  isLight: boolean;
  swatches: [string, string, string, string]; // [appBg, cardBg, accentPrimary, accentSecondary/status]
}

export const THEME_STORAGE_KEY = 'app_theme_v1';

export const AUTO_THEME_STORAGE_KEYS = {
  enabled: 'auto_theme_enabled_v1',
  dayThemeId: 'auto_theme_day_id_v1',
  nightThemeId: 'auto_theme_night_id_v1',
  mode: 'auto_theme_mode_v1',
  customDayTime: 'auto_theme_custom_day_v1',
  customNightTime: 'auto_theme_custom_night_v1',
} as const;

export const APP_THEMES: AppThemeDefinition[] = [
  {
    id: 'emerald',
    nameAr: 'الزمردي الداكن',
    subtitleAr: 'الأصلي الافتراضي — روح المسجد الحرام والزخارف الذهبية',
    isLight: false,
    swatches: ['#03120f', '#072e26', '#fbbf24', '#10b981'],
  },
  {
    id: 'indigo',
    nameAr: 'الكحلي الليلي الدافئ',
    subtitleAr: 'Cosmic Indigo & Warm Amber — سماء ليلية دافئة وهادئة',
    isLight: false,
    swatches: ['#0B0E1E', '#141933', '#F59E0B', '#5B5CE6'],
  },
  {
    id: 'obsidian',
    nameAr: 'الفحمي والذهب الرملي',
    subtitleAr: 'Obsidian & Sand Gold — فخامة داكنة بتفاصيل ذهبية رصينة',
    isLight: false,
    swatches: ['#0E0F12', '#181A20', '#D4AF37', '#4ADE80'],
  },
  {
    id: 'parchment',
    nameAr: 'الرقّ الدافئ والزيتوني',
    subtitleAr: 'Warm Parchment & Olive — طابع نهاري هادئ ومريح للعين',
    isLight: true,
    swatches: ['#F4EFE6', '#FAF7F2', '#9A742B', '#234E3D'],
  },
];

export const VALID_THEME_IDS: AppThemeId[] = ['emerald', 'indigo', 'obsidian', 'parchment'];

export function normalizeThemeId(raw?: string | null): AppThemeId {
  if (raw && (VALID_THEME_IDS as string[]).includes(raw)) {
    return raw as AppThemeId;
  }
  return 'emerald';
}

export function loadSavedTheme(): AppThemeId {
  if (typeof window === 'undefined') return 'emerald';
  try {
    return normalizeThemeId(localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return 'emerald';
  }
}

export function saveThemePreference(theme: AppThemeId): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // ignore storage issues
  }
}

export function getNextThemeId(current: AppThemeId): AppThemeId {
  const idx = VALID_THEME_IDS.indexOf(current);
  return VALID_THEME_IDS[(idx + 1) % VALID_THEME_IDS.length];
}

export function getThemeDefinition(id: AppThemeId): AppThemeDefinition {
  return APP_THEMES.find((t) => t.id === id) || APP_THEMES[0];
}

export function isValidTimeHHMM(val?: string | null): val is string {
  return Boolean(val && /^([01]?\d|2[0-3]):[0-5]\d$/.test(val.trim()));
}

export function parseTimeToMinutes(timeStr: string | undefined, fallbackMinutes: number): number {
  if (!timeStr || !timeStr.includes(':')) return fallbackMinutes;
  const [hStr, mStr] = timeStr.trim().split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  if (Number.isNaN(h) || Number.isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) {
    return fallbackMinutes;
  }
  return h * 60 + m;
}

export function loadAutoThemeDefaults(): {
  autoThemeEnabled: boolean;
  autoThemeDayId: AppThemeId;
  autoThemeNightId: AppThemeId;
  autoThemeMode: AutoThemeTriggerMode;
  autoThemeCustomDayTime: string;
  autoThemeCustomNightTime: string;
} {
  const defaults = {
    autoThemeEnabled: false,
    autoThemeDayId: 'parchment' as AppThemeId,
    autoThemeNightId: 'indigo' as AppThemeId,
    autoThemeMode: 'sunrise_maghrib' as AutoThemeTriggerMode,
    autoThemeCustomDayTime: '06:00',
    autoThemeCustomNightTime: '18:00',
  };
  if (typeof window === 'undefined') return defaults;
  try {
    const enabled = localStorage.getItem(AUTO_THEME_STORAGE_KEYS.enabled) === 'true';
    const dayRaw = localStorage.getItem(AUTO_THEME_STORAGE_KEYS.dayThemeId);
    const nightRaw = localStorage.getItem(AUTO_THEME_STORAGE_KEYS.nightThemeId);
    const modeRaw = localStorage.getItem(AUTO_THEME_STORAGE_KEYS.mode);
    const customDayRaw = localStorage.getItem(AUTO_THEME_STORAGE_KEYS.customDayTime);
    const customNightRaw = localStorage.getItem(AUTO_THEME_STORAGE_KEYS.customNightTime);

    return {
      autoThemeEnabled: enabled,
      autoThemeDayId: dayRaw && (VALID_THEME_IDS as string[]).includes(dayRaw) ? (dayRaw as AppThemeId) : defaults.autoThemeDayId,
      autoThemeNightId:
        nightRaw && (VALID_THEME_IDS as string[]).includes(nightRaw) ? (nightRaw as AppThemeId) : defaults.autoThemeNightId,
      autoThemeMode: modeRaw === 'custom' ? 'custom' : 'sunrise_maghrib',
      autoThemeCustomDayTime: isValidTimeHHMM(customDayRaw) ? customDayRaw.trim() : defaults.autoThemeCustomDayTime,
      autoThemeCustomNightTime: isValidTimeHHMM(customNightRaw) ? customNightRaw.trim() : defaults.autoThemeCustomNightTime,
    };
  } catch {
    return defaults;
  }
}

export interface AutoThemeEvaluation {
  isDayPeriod: boolean;
  targetThemeId: AppThemeId;
  dayStartStr: string;
  nightStartStr: string;
  statusBadgeAr: string;
}

export function evaluateAutoThemePeriod(params: {
  now?: Date;
  mode?: AutoThemeTriggerMode;
  sunriseStr?: string;
  maghribStr?: string;
  customDayTime?: string;
  customNightTime?: string;
  dayThemeId?: AppThemeId;
  nightThemeId?: AppThemeId;
}): AutoThemeEvaluation {
  const {
    now = new Date(),
    mode = 'sunrise_maghrib',
    sunriseStr,
    maghribStr,
    customDayTime = '06:00',
    customNightTime = '18:00',
    dayThemeId = 'parchment',
    nightThemeId = 'indigo',
  } = params;

  const dayStartStr =
    mode === 'sunrise_maghrib'
      ? isValidTimeHHMM(sunriseStr)
        ? sunriseStr.trim()
        : '06:00'
      : isValidTimeHHMM(customDayTime)
        ? customDayTime.trim()
        : '06:00';

  const nightStartStr =
    mode === 'sunrise_maghrib'
      ? isValidTimeHHMM(maghribStr)
        ? maghribStr.trim()
        : '18:00'
      : isValidTimeHHMM(customNightTime)
        ? customNightTime.trim()
        : '18:00';

  const dayMins = parseTimeToMinutes(dayStartStr, 360);
  const nightMins = parseTimeToMinutes(nightStartStr, 1080);
  const nowMins = now.getHours() * 60 + now.getMinutes();

  let isDayPeriod: boolean;
  if (dayMins < nightMins) {
    isDayPeriod = nowMins >= dayMins && nowMins < nightMins;
  } else if (dayMins > nightMins) {
    isDayPeriod = nowMins >= dayMins || nowMins < nightMins;
  } else {
    isDayPeriod = true;
  }

  const targetThemeId = normalizeThemeId(isDayPeriod ? dayThemeId : nightThemeId);

  const statusBadgeAr = isDayPeriod
    ? mode === 'sunrise_maghrib'
      ? '☀️ وضع النهار نشط (حتى المغرب)'
      : `☀️ وضع النهار نشط (حتى ${nightStartStr})`
    : mode === 'sunrise_maghrib'
      ? '🌙 وضع الليل نشط (حتى الشروق)'
      : `🌙 وضع الليل نشط (حتى ${dayStartStr})`;

  return {
    isDayPeriod,
    targetThemeId,
    dayStartStr,
    nightStartStr,
    statusBadgeAr,
  };
}

