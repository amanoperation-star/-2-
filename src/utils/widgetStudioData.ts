import {
  CityLocation,
  PeriodicReminderContentFilter,
  PeriodicReminderItem,
  PrayerName,
  PrayerTimeData,
  UserSettings,
} from '../types';
import { evaluateFastingCalculator } from './fastingCalculator';
import { getDailyWirdSchedule, loadKhatmaState } from './khatmaData';
import {
  RAWATIB_TOTAL_TARGET,
  countCompletedRawatibRakats,
  loadSunnahRawatibState,
} from './sunnahRawatibData';
import { calculatePrayerTimes } from './prayerCalculator';
import { syncNativeAndroidWidgetData } from './nativeAndroidBridge';
import {
  IQAMA_SHEIKH_VOICES,
  PRE_ADHAN_SHEIKH_VOICES,
  getAdhanSource,
  getDuaSource,
} from './audioAdhan';
import { PERIODIC_VERSES_AND_HADITHS } from './islamicData';
import { calculateDuhaSchedule } from './duhaSunriseData';
import { QuietModeState, evaluateQuietMode, loadQuietModeState } from './quietModeData';
import {
  QIYAM_RECITERS,
  getQiyamVerseLocalAssetPaths,
  pickTonightQiyamSelection,
} from './lastThirdNightData';
import makkahHaramImg from '../assets/images/adhan_makkah_haram_1795705254443.jpg';
import madinahNabawiImg from '../assets/images/adhan_madinah_nabawi_1795705254283.jpg';
import aqsaQudsImg from '../assets/images/adhan_aqsa_quds_1795705255663.jpg';
import azharCairoImg from '../assets/images/adhan_azhar_cairo_1795705255105.jpg';

export type WidgetThemeId = 'emerald' | 'glass' | 'oled' | 'parchment' | 'royal_gold';
export type WidgetSizeId = 'lock_pill' | 'medium' | 'large' | 'spiritual_card';
export type PhoneSimulatorSurface = 'lock' | 'home';
export type WidgetRefreshInterval = '1s' | '1m';
export type WidgetFontScale = 'sm' | 'md' | 'lg';
export type WidgetMosqueBackgroundId = 'none' | 'makkah' | 'madinah' | 'aqsa' | 'azhar';

export interface WidgetStudioConfig {
  autoSync: boolean;
  theme: WidgetThemeId;
  size: WidgetSizeId;
  previewSurface: PhoneSimulatorSurface;
  showLiveSeconds: boolean;
  showHijriDate: boolean;
  showSunnahWird: boolean;
  showFastingAlert: boolean;
  showDailyInspiration: boolean;
  showDuhaSunrise: boolean;
  showQuietAndLastThird: boolean;
  showQuickActions: boolean;
  showDayProgressRings: boolean;
  mosqueBackgroundId: WidgetMosqueBackgroundId;
  mosqueBgOpacity: number;
  fontScale: WidgetFontScale;
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
  todayDateKey: string;
  tomorrowDateKey: string;
  tomorrowHijriDate: string;
  dailyPrayers: WidgetBridgePrayerEntry[];
  todaySchedule: WidgetBridgePrayerEntry[];
  tomorrowSchedule: WidgetBridgePrayerEntry[];
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
  duhaSunrise?: {
    sunriseStr: string;
    ishraqStartStr: string;
    bestDuhaStr: string;
    duhaEndStr: string;
    statusLabelAr: string;
  };
  quietMode?: {
    isQuietNow: boolean;
    statusLabelAr: string;
    manualActive: boolean;
    pauseUntilMs: number | null;
    exceptionPolicy: QuietModeState['exceptionPolicy'];
    schedules: QuietModeState['schedules'];
    updatedAtMs?: number;
  };
  tasbihState?: WidgetTasbihState;
  widgetSettings: WidgetStudioConfig;
  notificationSettings: {
    stickyEnabled: boolean;
    adhanBannerEnabled: boolean;
    mosqueTheme: 'auto' | 'nabawi' | 'kaaba' | 'azhar';
  };
  audioSettings: {
    notificationsEnabled: boolean;
    prayerAdhanEnabled: Record<string, boolean>;
    adhanReciter: string;
    fajrAdhanReciter: string;
    volume: number;
    fajrBoostVolume: boolean;
    autoDuaAfterAdhan: boolean;
    duaAudioReciter: string;
    meetingModeEnabled: boolean;
    adhanAssetUrl: string;
    fajrAdhanAssetUrl: string;
    duaAssetUrl: string;
    adhanReciterNameAr: string;
    fajrAdhanReciterNameAr: string;
  };
  preAdhanSettings?: {
    minutes: number;
    soundEnabled: boolean;
    voiceMode: string;
    assetUrl: string;
    sheikhNameAr: string;
  };
  iqamaSettings?: {
    autoPlayEnabled: boolean;
    voiceMode: string;
    assetUrl: string;
    sheikhNameAr: string;
    minutes: {
      fajr: number;
      dhuhr: number;
      asr: number;
      maghrib: number;
      isha: number;
    };
  };
  lastThirdSettings?: {
    enabled: boolean;
    mode: 'astronomical' | 'before_fajr' | 'custom';
    beforeFajrMinutes: number;
    customTime: string;
    fadeInAlarm: boolean;
    autoOpen: boolean;
    maghribTime24: string;
    fajrTime24: string;
    reciterId: string;
    reciterNameAr: string;
    verseId: string;
    verseText: string;
    verseSurah: string;
    verseReflection: string;
    verseAssetPaths: string[];
    fallbackAssetPath: string;
  };
  backgroundReminders: {
    salawatEnabled: boolean;
    salawatIntervalMinutes: number;
    salawatVoiceMode: string;
    periodicReminderEnabled: boolean;
    periodicReminderInterval: number;
    periodicReminderContentType: PeriodicReminderContentFilter;
    periodicOverlayEnabled: boolean;
    periodicQuietHoursEnabled: boolean;
    periodicQuietStart: string;
    periodicQuietEnd: string;
    periodicReminderSoundEnabled: boolean;
    periodicPool: PeriodicReminderItem[];
  };
}

export const WIDGET_STUDIO_STORAGE_KEY = 'al_mawaqeet_widget_studio_v1';
export const MIHRAB_WIDGET_BRIDGE_KEY = 'mihrab_widget_bridge_data_v1';
export const WIDGET_TASBIH_STORAGE_KEY = 'mihrab_widget_tasbih_v1';
export const WIDGET_TASBIH_EVENT = 'mihrab_widget_tasbih_changed';

export const WIDGET_TASBIH_PHRASES = [
  'سبحان الله',
  'الحمد لله',
  'لا إله إلا الله',
  'الله أكبر',
  'أستغفر الله',
  'اللهم صلِّ على محمد ﷺ',
];

export interface WidgetTasbihState {
  dateKey: string;
  count: number;
  phraseIndex: number;
  updatedAtMs?: number;
}

export function loadWidgetTasbihState(now: Date = new Date()): WidgetTasbihState {
  const today = toLocalDateKey(now);
  if (typeof window === 'undefined') {
    return { dateKey: today, count: 0, phraseIndex: 0 };
  }
  try {
    const raw = localStorage.getItem(WIDGET_TASBIH_STORAGE_KEY);
    if (!raw) return { dateKey: today, count: 0, phraseIndex: 0 };
    const parsed = JSON.parse(raw) as Partial<WidgetTasbihState>;
    const phraseIndex =
      typeof parsed.phraseIndex === 'number' &&
      parsed.phraseIndex >= 0 &&
      parsed.phraseIndex < WIDGET_TASBIH_PHRASES.length
        ? parsed.phraseIndex
        : 0;
    const count =
      parsed.dateKey === today && typeof parsed.count === 'number' && parsed.count >= 0
        ? parsed.count
        : 0;
    const updatedAtMs =
      parsed.dateKey === today &&
      typeof parsed.updatedAtMs === 'number' &&
      Number.isFinite(parsed.updatedAtMs)
        ? parsed.updatedAtMs
        : 0;
    return { dateKey: today, count, phraseIndex, updatedAtMs };
  } catch {
    return { dateKey: today, count: 0, phraseIndex: 0 };
  }
}

export function saveWidgetTasbihState(next: WidgetTasbihState): WidgetTasbihState {
  const stamped: WidgetTasbihState = {
    ...next,
    updatedAtMs: typeof next.updatedAtMs === 'number' ? next.updatedAtMs : Date.now(),
  };
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(WIDGET_TASBIH_STORAGE_KEY, JSON.stringify(stamped));
      window.dispatchEvent(new CustomEvent(WIDGET_TASBIH_EVENT, { detail: stamped }));
    } catch {
      // ignore storage errors
    }
  }
  return stamped;
}

export const DEFAULT_WIDGET_CONFIG: WidgetStudioConfig = {
  autoSync: true,
  theme: 'emerald',
  size: 'medium',
  previewSurface: 'lock',
  showLiveSeconds: true,
  showHijriDate: true,
  showSunnahWird: true,
  showFastingAlert: true,
  showDailyInspiration: true,
  showDuhaSunrise: false,
  showQuietAndLastThird: true,
  showQuickActions: true,
  showDayProgressRings: true,
  mosqueBackgroundId: 'none',
  mosqueBgOpacity: 35,
  fontScale: 'md',
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
  {
    id: 'parchment',
    nameAr: 'الورق الكريمي الفاتح',
    descAr: 'خلفية ورقية كريمية مريحة للعين بخط زمردي وإطار ذهبي',
    swatchClass: 'bg-[#FAF3E0] border-[#C49A3A]',
  },
  {
    id: 'royal_gold',
    nameAr: 'الذهبي الملكي الفاخر',
    descAr: 'تدرج برونزي ليلي دافئ مزدان بزخارف ولمسات ذهبية ملكية',
    swatchClass: 'bg-gradient-to-br from-[#2B1F08] to-[#120C03] border-[#F6D884]',
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
    descAr: 'كبسولة أفقية رفيعة تعرض أيقونة الصلاة القادمة، اسمها، والعدّاد التنازلي الحي',
  },
  {
    id: 'medium',
    nameAr: 'بطاقة محراب المقوّسة',
    badgeAr: '4×4 Arched Mihrab',
    descAr: 'تصميم مقوّس على هيئة محراب يعرض الصلاة القادمة والإقامة والإنجاز اليومي والحكمة والأزرار التفاعلية',
  },
  {
    id: 'large',
    nameAr: 'الجدول الكامل',
    badgeAr: '4×2 Full Prayer & Tracker',
    descAr: 'محراب الصلاة القادمة يميناً وجدول الصلوات الخمس يساراً مع مؤشرات الإنجاز والتذكير',
  },
  {
    id: 'spiritual_card',
    nameAr: 'بطاقة الأذكار والتسبيح والوِرد',
    badgeAr: '4×2 Dhikr & Wird',
    descAr: 'لوحة روحانية مخصصة للسبحة التفاعلية الحية وحلقات الإنجاز اليومي والآية المتجددة',
  },
];

export const WIDGET_MOSQUE_BACKGROUNDS: Array<{
  id: WidgetMosqueBackgroundId;
  titleAr: string;
  imageUrl: string | null;
}> = [
  { id: 'none', titleAr: 'بدون صورة', imageUrl: null },
  { id: 'makkah', titleAr: 'المسجد الحرام', imageUrl: makkahHaramImg },
  { id: 'madinah', titleAr: 'المسجد النبوي', imageUrl: madinahNabawiImg },
  { id: 'aqsa', titleAr: 'المسجد الأقصى', imageUrl: aqsaQudsImg },
  { id: 'azhar', titleAr: 'الجامع الأزهر', imageUrl: azharCairoImg },
];

export function getWidgetMosqueImageUrl(id: WidgetMosqueBackgroundId): string | null {
  return WIDGET_MOSQUE_BACKGROUNDS.find((m) => m.id === id)?.imageUrl ?? null;
}

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
        parsed.theme === 'glass' ||
        parsed.theme === 'oled' ||
        parsed.theme === 'emerald' ||
        parsed.theme === 'parchment' ||
        parsed.theme === 'royal_gold'
          ? parsed.theme
          : DEFAULT_WIDGET_CONFIG.theme,
      size:
        parsed.size === 'lock_pill' ||
        parsed.size === 'medium' ||
        parsed.size === 'large' ||
        parsed.size === 'spiritual_card'
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
      showDailyInspiration:
        typeof parsed.showDailyInspiration === 'boolean'
          ? parsed.showDailyInspiration
          : DEFAULT_WIDGET_CONFIG.showDailyInspiration,
      showDuhaSunrise:
        typeof parsed.showDuhaSunrise === 'boolean'
          ? parsed.showDuhaSunrise
          : DEFAULT_WIDGET_CONFIG.showDuhaSunrise,
      showQuietAndLastThird:
        typeof parsed.showQuietAndLastThird === 'boolean'
          ? parsed.showQuietAndLastThird
          : DEFAULT_WIDGET_CONFIG.showQuietAndLastThird,
      showQuickActions:
        typeof parsed.showQuickActions === 'boolean'
          ? parsed.showQuickActions
          : DEFAULT_WIDGET_CONFIG.showQuickActions,
      showDayProgressRings:
        typeof parsed.showDayProgressRings === 'boolean'
          ? parsed.showDayProgressRings
          : DEFAULT_WIDGET_CONFIG.showDayProgressRings,
      mosqueBackgroundId:
        parsed.mosqueBackgroundId === 'makkah' ||
        parsed.mosqueBackgroundId === 'madinah' ||
        parsed.mosqueBackgroundId === 'aqsa' ||
        parsed.mosqueBackgroundId === 'azhar' ||
        parsed.mosqueBackgroundId === 'none'
          ? parsed.mosqueBackgroundId
          : DEFAULT_WIDGET_CONFIG.mosqueBackgroundId,
      mosqueBgOpacity:
        typeof parsed.mosqueBgOpacity === 'number' && Number.isFinite(parsed.mosqueBgOpacity)
          ? Math.min(80, Math.max(15, parsed.mosqueBgOpacity))
          : DEFAULT_WIDGET_CONFIG.mosqueBgOpacity,
      fontScale:
        parsed.fontScale === 'sm' || parsed.fontScale === 'md' || parsed.fontScale === 'lg'
          ? parsed.fontScale
          : DEFAULT_WIDGET_CONFIG.fontScale,
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

function toLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
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

  const todaySchedule: WidgetBridgePrayerEntry[] = order.map((key) => ({
    key,
    nameAr: namesAr[key],
    time24: prayerTimes[key],
    time12: format12HourShort(prayerTimes[key]),
    isNext: key === nextKey,
  }));

  const tomorrowDate = new Date(now);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowTimes = calculatePrayerTimes(
    tomorrowDate,
    currentLocation.lat,
    currentLocation.lng,
    currentLocation.timezone,
    settings.calculationMethod,
    settings.asrMethod
  );
  const isTomorrowFriday = tomorrowDate.getDay() === 5;
  const tomorrowNamesAr: Record<PrayerName, string> = {
    fajr: 'الفجر',
    sunrise: 'الشروق',
    dhuhr: isTomorrowFriday ? 'الجمعة' : 'الظهر',
    asr: 'العصر',
    maghrib: 'المغرب',
    isha: 'العشاء',
  };
  const tomorrowSchedule: WidgetBridgePrayerEntry[] = order.map((key) => ({
    key,
    nameAr: tomorrowNamesAr[key],
    time24: tomorrowTimes[key],
    time12: format12HourShort(tomorrowTimes[key]),
    isNext: false,
  }));

  const rawatibCompleted = countCompletedRawatibRakats(loadSunnahRawatibState());
  const rawatibPercent = Math.round((rawatibCompleted / RAWATIB_TOTAL_TARGET) * 100);
  const khatmaSchedule = getDailyWirdSchedule(loadKhatmaState());

  const fastingInfo = evaluateFastingCalculator(prayerTimes.fajr, prayerTimes.maghrib, now, {
    whiteDaysEnabled: settings.fastingWhiteDaysEnabled,
    monThuEnabled: settings.fastingMonThuEnabled,
    ashuraArafahEnabled: settings.fastingAshuraArafahEnabled,
  });

  const duhaSchedule = calculateDuhaSchedule(prayerTimes.sunrise, prayerTimes.dhuhr, now);
  const quietState = loadQuietModeState();
  const quietEval = evaluateQuietMode(quietState, now);

  const adhanSource = getAdhanSource(settings.adhanReciter || 'makkah', 'dhuhr');
  const fajrAdhanSource = getAdhanSource(settings.fajrAdhanReciter || 'fajr_makkah', 'fajr');
  const duaSource = getDuaSource(settings.duaAudioReciter || 'shaarawy');

  const preAdhanVoiceMode = settings.preAdhanVoiceMode || 'rotate';
  const preAdhanVoice =
    PRE_ADHAN_SHEIKH_VOICES.find((v) => v.id === preAdhanVoiceMode) ||
    PRE_ADHAN_SHEIKH_VOICES[0];

  const iqamaVoiceMode = settings.iqamaVoiceMode || 'rotate';
  const iqamaVoice =
    IQAMA_SHEIKH_VOICES.find((v) => v.id === iqamaVoiceMode) ||
    IQAMA_SHEIKH_VOICES[IQAMA_SHEIKH_VOICES.length - 1];

  const todayDateKeyStr = now.toDateString();
  const nextNightFajr24 =
    parseMinutes(prayerTimes.fajr) > Math.floor(currentSeconds / 60)
      ? prayerTimes.fajr
      : tomorrowTimes.fajr;
  const tonightQiyam = pickTonightQiyamSelection(`${todayDateKeyStr}-${nextNightFajr24}`);
  const tonightQiyamReciter = QIYAM_RECITERS[tonightQiyam.reciterId] || QIYAM_RECITERS.qatami;
  const tonightQiyamAssetPaths = getQiyamVerseLocalAssetPaths(
    tonightQiyam.verse,
    tonightQiyamReciter.id
  );

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
    todayDateKey: toLocalDateKey(now),
    tomorrowDateKey: toLocalDateKey(tomorrowDate),
    tomorrowHijriDate: tomorrowTimes.hijriDate,
    dailyPrayers,
    todaySchedule,
    tomorrowSchedule,
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
    duhaSunrise: {
      sunriseStr: duhaSchedule.sunriseStr,
      ishraqStartStr: duhaSchedule.ishraqStartStr,
      bestDuhaStr: duhaSchedule.bestDuhaStr,
      duhaEndStr: duhaSchedule.duhaEndStr,
      statusLabelAr: duhaSchedule.statusLabelAr,
    },
    quietMode: {
      isQuietNow: quietEval.isQuietNow,
      statusLabelAr: quietEval.tileSubLabelAr,
      manualActive: quietState.manualActive,
      pauseUntilMs: quietState.pauseUntilMs,
      exceptionPolicy: quietState.exceptionPolicy,
      schedules: quietState.schedules,
      updatedAtMs: quietState.updatedAtMs ?? 0,
    },
    tasbihState: loadWidgetTasbihState(now),
    widgetSettings: widgetConfig,
    notificationSettings: {
      stickyEnabled: settings.stickyNotificationEnabled ?? true,
      adhanBannerEnabled: settings.adhanBannerNotificationEnabled ?? true,
      mosqueTheme: settings.notificationMosqueTheme || 'auto',
    },
    audioSettings: {
      notificationsEnabled: settings.notificationsEnabled !== false,
      prayerAdhanEnabled: {
        fajr: settings.prayerAdhanEnabled?.fajr !== false,
        dhuhr: settings.prayerAdhanEnabled?.dhuhr !== false,
        asr: settings.prayerAdhanEnabled?.asr !== false,
        maghrib: settings.prayerAdhanEnabled?.maghrib !== false,
        isha: settings.prayerAdhanEnabled?.isha !== false,
      },
      adhanReciter: settings.adhanReciter || 'makkah',
      fajrAdhanReciter: settings.fajrAdhanReciter || 'fajr_makkah',
      volume: typeof settings.volume === 'number' ? settings.volume : 1,
      fajrBoostVolume: settings.fajrBoostVolume !== false,
      autoDuaAfterAdhan: settings.autoDuaAfterAdhan !== false,
      duaAudioReciter: settings.duaAudioReciter || 'shaarawy',
      meetingModeEnabled: Boolean(settings.meetingModeEnabled),
      adhanAssetUrl: adhanSource.urls[0] || '/audio/adhan-makkah.mp3',
      fajrAdhanAssetUrl: fajrAdhanSource.urls[0] || '/audio/adhan-fajr-makkah.mp3',
      duaAssetUrl: duaSource.urls[0] || '/audio/dua-shaarawy.mp3',
      adhanReciterNameAr: adhanSource.nameAr,
      fajrAdhanReciterNameAr: fajrAdhanSource.nameAr,
    },
    preAdhanSettings: {
      minutes: settings.preAdhanReminderMinutes ?? 10,
      soundEnabled: settings.preAdhanSoundEnabled !== false,
      voiceMode: preAdhanVoiceMode,
      assetUrl: preAdhanVoice.urls[0] || '/audio/prayer-alert-mishary.mp3',
      sheikhNameAr: preAdhanVoice.nameAr,
    },
    iqamaSettings: {
      autoPlayEnabled: settings.iqamaAutoPlayEnabled !== false,
      voiceMode: iqamaVoiceMode,
      assetUrl: iqamaVoice.urls[0] || '/audio/iqama-classic.mp3',
      sheikhNameAr: iqamaVoice.nameAr,
      minutes: {
        fajr: settings.iqamaMinutes?.fajr ?? 20,
        dhuhr: settings.iqamaMinutes?.dhuhr ?? 15,
        asr: settings.iqamaMinutes?.asr ?? 15,
        maghrib: settings.iqamaMinutes?.maghrib ?? 10,
        isha: settings.iqamaMinutes?.isha ?? 15,
      },
    },
    lastThirdSettings: {
      enabled: settings.lastThirdNightEnabled !== false,
      mode: settings.lastThirdNightMode || 'astronomical',
      beforeFajrMinutes: settings.lastThirdBeforeFajrMinutes ?? 30,
      customTime: settings.lastThirdNightCustomTime || '03:00',
      fadeInAlarm: settings.lastThirdFadeInAlarm !== false,
      autoOpen: Boolean(settings.lastThirdAutoOpen),
      maghribTime24: prayerTimes.maghrib,
      fajrTime24: nextNightFajr24,
      reciterId: tonightQiyamReciter.id,
      reciterNameAr: tonightQiyamReciter.nameAr,
      verseId: tonightQiyam.verse.id,
      verseText: tonightQiyam.verse.verse,
      verseSurah: tonightQiyam.verse.surah,
      verseReflection: tonightQiyam.verse.reflection,
      verseAssetPaths: tonightQiyamAssetPaths,
      fallbackAssetPath: '/audio/qiyam/qatami/032016.mp3',
    },
    backgroundReminders: {
      salawatEnabled: settings.salawatEnabled ?? true,
      salawatIntervalMinutes: settings.salawatIntervalMinutes ?? 10,
      salawatVoiceMode: settings.salawatVoiceMode || 'rotate',
      periodicReminderEnabled: settings.periodicReminderEnabled ?? true,
      periodicReminderInterval: settings.periodicReminderInterval ?? 15,
      periodicReminderContentType: settings.periodicReminderContentType || 'both',
      periodicOverlayEnabled: settings.periodicOverlayEnabled ?? true,
      periodicQuietHoursEnabled: settings.periodicQuietHoursEnabled ?? true,
      periodicQuietStart: settings.periodicQuietStart || '23:00',
      periodicQuietEnd: settings.periodicQuietEnd || '06:00',
      periodicReminderSoundEnabled: Boolean(settings.periodicReminderSoundEnabled),
      periodicPool: PERIODIC_VERSES_AND_HADITHS,
    },
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
      void syncNativeAndroidWidgetData(payload);
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
