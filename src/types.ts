export type PrayerName = 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export interface PrayerTimeData {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  dateString: string;
  hijriDate: string;
}

export interface CityLocation {
  id: string;
  name: string;
  country: string;
  countryAr: string;
  nameAr: string;
  lat: number;
  lng: number;
  timezone: string;
}

export type CalculationMethodId =
  | 'egypt' // الهيئة المصرية العامة للمساحة
  | 'umm_alqura' // أم القرى - مكة المكرمة
  | 'mwl' // رابطة العالم الإسلامي
  | 'isna' // الجمعية الإسلامية لشمال أمريكا (ISNA)
  | 'turkey' // رئاسة الشؤون الدينية التركية (Diyanet)
  | 'karachi' // جامعة العلوم الإسلامية بكراتشي
  | 'dubai' // دبي والإمارات
  | 'qatar' // قطر
  | 'kuwait'; // الكويت

export interface CalculationMethod {
  id: CalculationMethodId;
  name: string;
  nameAr: string;
}

export interface LiveBackground {
  id: string;
  title: string;
  subtitle: string;
  type: 'video' | 'image';
  period: 'day' | 'night' | 'both';
  videoUrl?: string;
  imageUrl?: string;
  poster?: string;
  cssFallback: string;
}

export interface IqamaTimes {
  fajr: number; // minutes after adhan, e.g. 25
  dhuhr: number; // 20
  asr: number; // 20
  maghrib: number; // 10
  isha: number; // 20
}

export interface UserSettings {
  cityId: string;
  customLocation?: CityLocation;
  calculationMethod: CalculationMethodId;
  asrMethod: 'standard' | 'hanafi'; // 0: Shafi, 1: Hanafi
  highLatitudeRule: 'none' | 'middle_night' | 'seventh' | 'angle';
  hijriAdjustment: number; // days offset (-2 to +2)
  adhanReciter: string;
  fajrAdhanReciter: string; // أذان الفجر المميز (الصلاة خير من النوم)
  volume: number;
  fajrBoostVolume: boolean; // رفع صوت الفجر للحد الأقصى
  notificationsEnabled: boolean;
  theme: 'emerald' | 'indigo' | 'obsidian' | 'parchment' | 'gold' | 'midnight' | 'light';
  autoLocation: boolean;
  activeBackgroundId: string;
  autoDuaAfterAdhan: boolean;
  duaAudioReciter: string;
  // New features requested:
  preAdhanReminderMinutes: number; // 0, 10, 15 minutes before adhan (الاستعداد للصلاة)
  preAdhanSoundEnabled: boolean; // نغمة التنبيه الهادئة للاستعداد
  preAdhanVoiceMode?: 'rotate' | 'mishary' | 'dosari' | 'muaiqly' | 'minshawi' | 'abdulbasit' | 'qatami'; // أصوات الشيوخ الحقيقية لتنبيهات الاستعداد للصلاة
  iqamaMinutes: IqamaTimes; // عداد الإقامة لكل صلاة
  iqamaAutoPlayEnabled?: boolean; // تشغيل صوت الإقامة تلقائياً عند انتهاء عداد الإقامة
  iqamaVoiceMode?: 'rotate' | 'basnawi' | 'hadrawi' | 'majed_abbas' | 'madinah_haram' | 'faisal_labban' | 'makkah_classic'; // صوت الشيخ لإقامة الصلاة
  // Background customization:
  backgroundOpacity: number; // 20 - 100%
  backgroundBlur: number; // 0 - 10px
  autoDayNightBackground: boolean; // التبديل التلقائي لمساجد النهار والليل حسب وقت الصلاة
  morningAdhkarTime: string; // e.g. "06:00"
  eveningAdhkarTime: string; // e.g. "17:00"
  morningAdhkarEnabled?: boolean; // تفعيل تنبيه أذكار الصباح
  eveningAdhkarEnabled?: boolean; // تفعيل تنبيه أذكار المساء
  adhkarAutoPlayAudio?: boolean; // تشغيل الصوت تلقائياً عند حلول وقت الأذكار
  adhkarReciter?: string; // الشيخ القارئ المفضل لأذكار الصباح والمساء
  adhkarShortSheikh?: string; // الشيخ القارئ المفضل لمقاطع الأذكار القصيرة
  iqamaStyle?: 'ring' | 'split' | 'pill'; // مظهر عدّاد الإقامة
  adhanModalLayout?: 'editorial-horizon' | 'architectural-sanctuary' | 'ambient-aura'; // تصميم شاشة الأذان الكاملة
  adhanCountdownStyle?: 'islamic-mihrab' | 'rub-el-hizb' | 'mashrabiya-arabesque' | 'celestial-astrolabe'; // الطراز الإسلامي لعدّاد الأذان
  adhanBackgroundAutoRotate?: boolean; // تبديل تلقائي بين المساجد أثناء الأذان
  adhanBackgroundMotionStyle?: 'hybrid' | 'video' | 'cinematic'; // أسلوب الحركة في خلفيات الأذان
  adhanEnabledMosques?: string[]; // قائمة المساجد المختارة للظهور أثناء الأذان
  periodicReminderEnabled?: boolean;
  periodicReminderInterval?: 5 | 10 | 15 | 30 | 60;
  periodicReminderContentType?: PeriodicReminderContentFilter;
  periodicOverlayEnabled?: boolean;
  periodicQuietHoursEnabled?: boolean;
  periodicQuietStart?: string;
  periodicQuietEnd?: string;
  periodicReminderSoundEnabled?: boolean;
  salawatEnabled?: boolean;
  salawatIntervalMinutes?: 5 | 10 | 15 | 30 | 60;
  salawatVoiceMode?: 'rotate' | 'mishary' | 'dosari' | 'muaiqly' | 'naqshabandi' | 'naqshabandi_radio';
  customBackgroundImage?: string;
  // وضع الثلث الأخير من الليل (قيام الليل والتهجد والاستغفار بالأسحار)
  lastThirdNightEnabled?: boolean;
  lastThirdNightMode?: 'astronomical' | 'before_fajr' | 'custom';
  lastThirdBeforeFajrMinutes?: 15 | 30 | 45 | 60;
  lastThirdNightCustomTime?: string; // e.g. "03:00"
  lastThirdNightTheme?: 'celestial' | 'dimmed' | 'oled';
  lastThirdAutoOpen?: boolean;
  lastThirdFadeInAlarm?: boolean;
  lastThirdAutoOpenAdhkar?: boolean;
  // تنبيه صلاة الوتر وتنبيه السحور المنفصلان
  witrReminderEnabled?: boolean;
  witrReminderMinutes?: 15 | 20 | 30;
  suhoorReminderEnabled?: boolean;
  suhoorReminderMinutes?: 30 | 45 | 60;
  meetingModeEnabled?: boolean;
  // التبديل التلقائي الذكي لمظهر النهار والليل
  autoThemeEnabled?: boolean;
  autoThemeDayId?: AppThemeId;
  autoThemeNightId?: AppThemeId;
  autoThemeMode?: AutoThemeTriggerMode;
  autoThemeCustomDayTime?: string; // e.g. "06:00"
  autoThemeCustomNightTime?: string; // e.g. "18:00"
  // إعدادات الصيام والتطوع ووضع المنضدة الذكية
  fastingWhiteDaysEnabled?: boolean;
  fastingMonThuEnabled?: boolean;
  fastingAshuraArafahEnabled?: boolean;
  showFastingStatsInRecord?: boolean;
  ambientStandbyAutoLandscape?: boolean;
  // رخصة المسافر وصلاة الجمع والقصر
  travelModeEnabled?: boolean;
  travelDistanceKm?: number;
  travelJamType?: 'taqdeem' | 'takheer';
  // المتابعة الذكية بعد كل صلاة
  postPrayerCheckinEnabled?: boolean;
  postPrayerCheckinMinutes?: 15 | 20 | 30;
  postPrayerIncludeWird?: boolean;
  postPrayerIncludeAdhkar?: boolean;
  postPrayerIncludeSunnah?: boolean;
  // إعدادات الأندرويد والشاشات الذكية (Mobile & Android TV APK)
  tvRemoteFocusEnabled?: boolean;
  keepScreenAwakeAlways?: boolean;
  autoEnterTvDisplay?: boolean;
  remoteApiBaseUrl?: string;
  // إشعار شريط الموبايل العلوي الدائم وتنبيه الأذان بصور المساجد
  stickyNotificationEnabled?: boolean;
  adhanBannerNotificationEnabled?: boolean;
  notificationMosqueTheme?: 'auto' | 'nabawi' | 'kaaba' | 'azhar';
  prayerOffsets?: Record<string, number>;
  prayerAdhanEnabled?: Record<string, boolean>;
  prayerReciters?: Record<string, string>;
}

export type AppThemeId = 'emerald' | 'indigo' | 'obsidian' | 'parchment';

export type AutoThemeTriggerMode = 'sunrise_maghrib' | 'custom';

export type LastThirdNightTheme = 'celestial' | 'dimmed' | 'oled';

export interface NightThirdsInfo {
  isLastThirdNow: boolean;
  startTimeStr: string;
  astronomicalLastThirdStr: string;
  midnightTimeStr: string;
  firstThirdEndStr: string;
  maghribTimeStr: string;
  fajrTimeStr: string;
  remainingSecondsToFajr: number;
  totalNightMinutes: number;
  lastThirdMinutes: number;
  formattedRemainingToFajr: string;
  isNightTime: boolean;
  nightProgressPercent: number;
}

export type PeriodicReminderContentFilter = 'both' | 'quran' | 'hadith' | 'wisdom';

export interface PeriodicReminderItem {
  id: string;
  type: 'quran' | 'hadith' | 'wisdom';
  text: string;
  source: string;
  reflection?: string;
}

export interface PrayerTrackerEntry {
  date: string; // YYYY-MM-DD
  fajr: boolean;
  dhuhr: boolean;
  asr: boolean;
  maghrib: boolean;
  isha: boolean;
  fajrMosque?: boolean;
  dhuhrMosque?: boolean;
  asrMosque?: boolean;
  maghribMosque?: boolean;
  ishaMosque?: boolean;
}

export interface DhikrItem {
  id: string;
  title?: string;
  text: string;
  translation?: string;
  count: number;
  category:
    | 'morning'
    | 'evening'
    | 'general'
    | 'praise'
    | 'after_prayer'
    | 'travel'
    | 'sleep_wake'
    | 'home_mosque'
    | 'distress_healing'
    | 'food_weather'
    | 'forgiveness_dua';
  virtue?: string;
  source?: string;
}

export interface NameOfAllah {
  number: number;
  name: string;
  transliteration: string;
  meaning: string;
  explanation: string;
}
