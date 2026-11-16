import { CityLocation, PrayerName, PrayerTimeData, UserSettings } from '../types';
import { evaluateFastingCalculator } from './fastingCalculator';
import { getDailyWirdSchedule, loadKhatmaState } from './khatmaData';
import {
  RAWATIB_TOTAL_TARGET,
  countCompletedRawatibRakats,
  loadSunnahRawatibState,
} from './sunnahRawatibData';

export type WidgetThemeId = 'emerald' | 'glass' | 'oled';
export type WidgetSizeId = 'lock_pill' | 'medium' | 'large';
export type PhoneSimulatorSurface = 'lock' | 'home';
export type WidgetRefreshInterval = '1s' | '1m';

export interface WidgetStudioConfig {
  autoSync: boolean;
  theme: WidgetThemeId;
  size: WidgetSizeId;
  previewSurface: PhoneSimulatorSurface;
  showLiveSeconds: boolean;
  showHijriDate: boolean;
  showSunnahWird: boolean;
  showFastingAlert: boolean;
  refreshInterval: WidgetRefreshInterval;
}

export interface WidgetBridgePrayerEntry {
  key: PrayerName;
  nameAr: string;
  time24: string;
  time12: string;
  isNext: boolean;
}

export interface WidgetBridgePayload {
  updatedAt: string;
  cityId: string;
  cityNameAr: string;
  calculationMethod: string;
  nextPrayer: {
    key: PrayerName;
    nameAr: string;
    time24: string;
    time12: string;
    iqamaTime12: string | null;
  };
  nextTime: string;
  hijriDate: string;
  dailyPrayers: WidgetBridgePrayerEntry[];
  sunnahProgress: {
    rawatibCompleted: number;
    rawatibTarget: number;
    rawatibPercent: number;
    wirdPagesToday: number;
    wirdTargetPages: number;
    wirdPercent: number;
  };
  fastingAlert: {
    isUpcomingSeason: boolean;
    isFastingIntent: boolean;
    occasionTitle: string;
    reminderMessage: string | null;
    suhoorTimeStr: string;
  };
  widgetSettings: WidgetStudioConfig;
}

export const WIDGET_STUDIO_STORAGE_KEY = 'al_mawaqeet_widget_studio_v1';
export const MIHRAB_WIDGET_BRIDGE_KEY = 'mihrab_widget_bridge_data_v1';

export const DEFAULT_WIDGET_CONFIG: WidgetStudioConfig = {
  autoSync: true,
  theme: 'emerald',
  size: 'medium',
  previewSurface: 'lock',
  showLiveSeconds: true,
  showHijriDate: true,
  showSunnahWird: true,
  showFastingAlert: true,
  refreshInterval: '1s',
};

export const WIDGET_THEMES: Array<{
  id: WidgetThemeId;
  nameAr: string;
  descAr: string;
  swatchClass: string;
}> = [
  {
    id: 'emerald',
    nameAr: 'الزمردي الداكن',
    descAr: 'هوية التطبيق (#111C18) بإطار ذهبي خفيف',
    swatchClass: 'bg-[#111C18] border-[#D4AF37]',
  },
  {
    id: 'glass',
    nameAr: 'الزجاجي الشفاف',
    descAr: 'خلفية شبه شفافة (Glassmorphism) تتأقلم مع الخلفية',
    swatchClass: 'bg-emerald-900/35 backdrop-blur-md border-white/40',
  },
  {
    id: 'oled',
    nameAr: 'أسود OLED',
    descAr: 'أسود عميق (#050807) موفّر للطاقة بحدود ذهبية دقيقة',
    swatchClass: 'bg-[#050807] border-[#D4AF37]/75',
  },
];

export const WIDGET_SIZES: Array<{
  id: WidgetSizeId;
  nameAr: string;
  badgeAr: string;
  descAr: string;
}> = [
  {
    id: 'lock_pill',
    nameAr: 'شاشة القفل المصغّر',
    badgeAr: 'Lock Screen Pill',
    descAr: 'كبسولة أفقية رفيعة تعرض أيقونة الصلاة القادمة، اسمها، والعدّاد التنازلي الحي فقط',
  },
  {
    id: 'medium',
    nameAr: 'محراب متوسط',
    badgeAr: '2×2 Mihrab Arch',
    descAr: 'تصميم مقوّس على هيئة محراب مصغّر يعرض الصلاة القادمة ووقت الأذان وشريط التقدم',
  },
  {
    id: 'large',
    nameAr: 'الجدول الكامل',
    badgeAr: '4×2 Full Prayer & Tracker',
    descAr: 'جانبان: محراب الصلاة القادمة يميناً وجدول الصلوات الخمس يساراً مع شريط الوِرد والرواتب',
  },
];

export function loadWidgetConfig(): WidgetStudioConfig {
  if (typeof window === 'undefined') return DEFAULT_WIDGET_CONFIG;
  try {
    const raw = localStorage.getItem(WIDGET_STUDIO_STORAGE_KEY);
    if (!raw) return DEFAULT_WIDGET_CONFIG;
    const parsed = JSON.parse(raw);
    return {
      autoSync:
        typeof parsed.autoSync === 'boolean'
          ? parsed.autoSync
          : DEFAULT_WIDGET_CONFIG.autoSync,
      theme:
        parsed.theme === 'glass' || parsed.theme === 'oled' || parsed.theme === 'emerald'
          ? parsed.theme
          : DEFAULT_WIDGET_CONFIG.theme,
      size:
        parsed.size === 'lock_pill' || parsed.size === 'medium' || parsed.size === 'large'
          ? parsed.size
          : DEFAULT_WIDGET_CONFIG.size,
      previewSurface:
        parsed.previewSurface === 'home' || parsed.previewSurface === 'lock'
          ? parsed.previewSurface
          : DEFAULT_WIDGET_CONFIG.previewSurface,
      showLiveSeconds:
        typeof parsed.showLiveSeconds === 'boolean'
          ? parsed.showLiveSeconds
          : DEFAULT_WIDGET_CONFIG.showLiveSeconds,
      showHijriDate:
        typeof parsed.showHijriDate === 'boolean'
          ? parsed.showHijriDate
          : DEFAULT_WIDGET_CONFIG.showHijriDate,
      showSunnahWird:
        typeof parsed.showSunnahWird === 'boolean'
          ? parsed.showSunnahWird
          : DEFAULT_WIDGET_CONFIG.showSunnahWird,
      showFastingAlert:
        typeof parsed.showFastingAlert === 'boolean'
          ? parsed.showFastingAlert
          : DEFAULT_WIDGET_CONFIG.showFastingAlert,
      refreshInterval:
        parsed.refreshInterval === '1m' || parsed.refreshInterval === '1s'
          ? parsed.refreshInterval
          : DEFAULT_WIDGET_CONFIG.refreshInterval,
    };
  } catch {
    return DEFAULT_WIDGET_CONFIG;
  }
}

export function saveWidgetConfig(config: WidgetStudioConfig): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(WIDGET_STUDIO_STORAGE_KEY, JSON.stringify(config));
    window.dispatchEvent(new CustomEvent('widget_config_changed', { detail: config }));
  } catch {
    // ignore storage quota errors
  }
}

function parseMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function format12HourShort(timeStr: string): string {
  const [h, m] = timeStr.split(':').map(Number);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const suffix = h >= 12 ? 'م' : 'ص';
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${suffix}`;
}

function addMinutes12HourShort(timeStr: string, addMins: number): string {
  const total = (parseMinutes(timeStr) + addMins) % (24 * 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const suffix = h >= 12 ? 'م' : 'ص';
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${suffix}`;
}

export function buildWidgetBridgePayload(params: {
  prayerTimes: PrayerTimeData;
  currentLocation: CityLocation;
  settings: UserSettings;
  widgetConfig: WidgetStudioConfig;
  now?: Date;
}): WidgetBridgePayload {
  const { prayerTimes, currentLocation, settings, widgetConfig, now = new Date() } = params;
  const order: PrayerName[] = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
  const isFriday = now.getDay() === 5;
  const namesAr: Record<PrayerName, string> = {
    fajr: 'الفجر',
    sunrise: 'الشروق',
    dhuhr: isFriday ? 'الجمعة' : 'الظهر',
    asr: 'العصر',
    maghrib: 'المغرب',
    isha: 'العشاء',
  };

  const currentSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  let nextKey: PrayerName = 'fajr';
  for (const key of order) {
    if (parseMinutes(prayerTimes[key]) * 60 > currentSeconds) {
      nextKey = key;
      break;
    }
  }

  const iqamaMap = settings.iqamaMinutes || {
    fajr: 25,
    dhuhr: 20,
    asr: 20,
    maghrib: 10,
    isha: 20,
  };
  const iqamaOffset =
    nextKey === 'sunrise'
      ? 0
      : iqamaMap[nextKey as 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha'] || 15;
  const nextTime12 = format12HourShort(prayerTimes[nextKey]);
  const iqamaTime12 =
    nextKey !== 'sunrise' ? addMinutes12HourShort(prayerTimes[nextKey], iqamaOffset) : null;

  const dailyKeys: PrayerName[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
  const dailyPrayers: WidgetBridgePrayerEntry[] = dailyKeys.map((key) => ({
    key,
    nameAr: namesAr[key],
    time24: prayerTimes[key],
    time12: format12HourShort(prayerTimes[key]),
    isNext: key === nextKey,
  }));

  const rawatibCompleted = countCompletedRawatibRakats(loadSunnahRawatibState());
  const rawatibPercent = Math.round((rawatibCompleted / RAWATIB_TOTAL_TARGET) * 100);
  const khatmaSchedule = getDailyWirdSchedule(loadKhatmaState());

  const fastingInfo = evaluateFastingCalculator(prayerTimes.fajr, prayerTimes.maghrib, now, {
    whiteDaysEnabled: settings.fastingWhiteDaysEnabled,
    monThuEnabled: settings.fastingMonThuEnabled,
    ashuraArafahEnabled: settings.fastingAshuraArafahEnabled,
  });

  return {
    updatedAt: now.toISOString(),
    cityId: currentLocation.id,
    cityNameAr: currentLocation.nameAr,
    calculationMethod: settings.calculationMethod,
    nextPrayer: {
      key: nextKey,
      nameAr: namesAr[nextKey],
      time24: prayerTimes[nextKey],
      time12: nextTime12,
      iqamaTime12,
    },
    nextTime: nextTime12,
    hijriDate: prayerTimes.hijriDate,
    dailyPrayers,
    sunnahProgress: {
      rawatibCompleted,
      rawatibTarget: RAWATIB_TOTAL_TARGET,
      rawatibPercent,
      wirdPagesToday: khatmaSchedule.pagesCompletedToday,
      wirdTargetPages: khatmaSchedule.dailyTargetPages,
      wirdPercent: khatmaSchedule.dailyPercent,
    },
    fastingAlert: {
      isUpcomingSeason: fastingInfo.isUpcomingSeason,
      isFastingIntent: fastingInfo.isFastingIntent,
      occasionTitle: fastingInfo.occasionTitle,
      reminderMessage: fastingInfo.reminderMessage,
      suhoorTimeStr: fastingInfo.suhoorTimeStr,
    },
    widgetSettings: widgetConfig,
  };
}

export function syncWidgetDataBridge(params: {
  prayerTimes: PrayerTimeData;
  currentLocation: CityLocation;
  settings: UserSettings;
  widgetConfig: WidgetStudioConfig;
}): WidgetBridgePayload {
  const payload = buildWidgetBridgePayload(params);
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(MIHRAB_WIDGET_BRIDGE_KEY, JSON.stringify(payload));
      window.dispatchEvent(new CustomEvent('mihrabWidgetSync', { detail: payload }));
    } catch {
      // ignore storage errors
    }
  }
  return payload;
}

export function loadWidgetBridgeData(): WidgetBridgePayload | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(MIHRAB_WIDGET_BRIDGE_KEY);
    return raw ? (JSON.parse(raw) as WidgetBridgePayload) : null;
  } catch {
    return null;
  }
}

export function buildWidgetBridgeCopySnippet(
  payload: WidgetBridgePayload,
  widgetUrl: string
): string {
  return [
    `// Al-Mawaqeet Widget Data Bridge (WidgetKit / AppWidget / Capacitor)`,
    `// Live Widget URL: ${widgetUrl}`,
    `// Storage Key: "${MIHRAB_WIDGET_BRIDGE_KEY}"`,
    `// Event: window.addEventListener('mihrabWidgetSync', (e) => console.log(e.detail));`,
    ``,
    JSON.stringify(payload, null, 2),
  ].join('\n');
}
