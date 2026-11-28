import React, { useCallback, useEffect, useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { PrayerTimesCard } from './components/PrayerTimesCard';
import { PrayerTracker } from './components/PrayerTracker';
import { QiblaCompass } from './components/QiblaCompass';
import { AdhkarSection } from './components/AdhkarSection';
import { QuranSection } from './components/QuranSection';
import { AiAssistant } from './components/AiAssistant';
import { CommuteWirdSection } from './components/CommuteWirdSection';
import { FamilyHomeSection } from './components/FamilyHomeSection';
import { SettingsModal, SettingsTabId } from './components/SettingsModal';
import { BackgroundPickerModal } from './components/BackgroundPickerModal';
import { PeriodicReminderPopup, pickRandomReminder } from './components/PeriodicReminderPopup';
import { QuranWirdModal } from './components/QuranWirdModal';
import { SteadfastnessModal } from './components/SteadfastnessModal';
import { AmbientStandByModal, UnifiedDisplayMode } from './components/AmbientStandByModal';
import { FullScreenAdhanModal } from './components/FullScreenAdhanModal';
import { IstikharaHajahModal } from './components/IstikharaHajahModal';
import { WidgetStudioModal } from './components/WidgetStudioModal';
import { SpiritualSplashOverlay } from './components/SpiritualSplashOverlay';
import { PrayerWidgetPreview } from './components/PrayerWidgetPreview';
import { PostPrayerTasbihModal } from './components/PostPrayerTasbihModal';
import {
  createPrecisionClockTicker,
  evaluateDuePrayerEvents,
  hasSchedulerFired,
  isEventDueInWindow,
  markSchedulerFired,
  parsePrayerTimeEpoch,
  toSchedulerDateKey,
} from './utils/prayerScheduler';
import {
  WIDGET_SIZES,
  WIDGET_TASBIH_EVENT,
  WIDGET_THEMES,
  WidgetStudioConfig,
  loadWidgetConfig,
  loadWidgetTasbihState,
  saveWidgetConfig,
  saveWidgetTasbihState,
  syncWidgetDataBridge,
} from './utils/widgetStudioData';
import { CompanionHubSection, HubSectionTab } from './components/CompanionHubSection';
import {
  computeQadaAnalytics,
  getTodayQadaDateKey,
  isQadaReminderDue,
  loadQadaState,
  saveQadaState,
} from './utils/qadaData';
import {
  getTodayHifzDateKey,
  isHifzReminderDue,
  loadHifzState,
  saveHifzState,
} from './utils/hifzData';
import { toArabicDigits } from './utils/khatmaData';
import { OfflineIndicator } from './components/PWAInstallButton';
import { precacheEssentialAudioOnce } from './utils/offlineAudioManager';
import { loadFastingPreferences, saveFastingPreferences } from './utils/fastingCalculator';
import { backgroundService } from './utils/backgroundService';
import {
  getNextTimeAfterPeriodicQuietHours,
  isWithinPeriodicQuietHours,
} from './utils/periodicQuietHours';
import { useTvRemoteNavigation } from './hooks/useTvRemoteNavigation';
import {
  consumeNativeLaunchAction,
  getNativeNotificationPermission,
  getNativeWidgetInteractiveState,
  isLikelyAndroidTvDevice,
  isNativeAndroidApp,
  requestNativeNotificationPermission,
  subscribeNativeBackButton,
  subscribeNativeResume,
} from './utils/nativeAndroidBridge';
import {
  CheckinPrayerKey,
  DailyCheckinState,
  PrayerCheckinItem,
  completePrayerFardAndAdhkar,
  getCheckinPrayerNameAr,
  getDuePostPrayerNotification,
  getLatestPassedPrayer,
  getTodayCheckinDateKey,
  loadTodayCheckinState,
  markPostPrayerNotified,
  toggleCheckinField,
} from './utils/postPrayerCheckinData';
import { PostPrayerNotificationToast } from './components/PostPrayerNotificationToast';
import { PostPrayerCheckinModal } from './components/PostPrayerCheckinModal';
import {
  SUNNAH_RAWATIB_LABELS,
  SunnahRawatibState,
  isPrayerSunnahCompleted,
  loadSunnahRawatibState,
  togglePrayerSunnahCompleted,
} from './utils/sunnahRawatibData';
import { CityLocation, UserSettings, PrayerTimeData, AppThemeId, PrayerName } from './types';
import {
  CITIES,
  applyPrayerTimeOffsets,
  calculateNightThirds,
  calculatePrayerTimes,
} from './utils/prayerCalculator';
import { calculateDuhaSchedule, formatTime12Ar } from './utils/duhaSunriseData';
import {
  QIYAM_RECITERS,
  buildQiyamVerseAudioUrlSets,
  pickTonightQiyamSelection,
} from './utils/lastThirdNightData';
import {
  QUIET_MODE_UPDATED_EVENT,
  loadQuietModeState,
  saveQuietModeState,
  shouldSuppressGeneralNotification,
  shouldSuppressPrayerAudioOrAlert,
} from './utils/quietModeData';
import {
  adhanPlayer,
  getDuaSource,
  resolveValidAdhkarReciterForPeriod,
  SalawatVoiceProfile,
  PreAdhanVoiceProfile,
  IqamaVoiceProfile,
} from './utils/audioAdhan';
import { LIVE_BACKGROUNDS, getSmartBackground, isCurrentTimeDay } from './utils/backgroundsData';
import {
  KhatmaPlanDays,
  KhatmaPrayerKey,
  KhatmaState,
  createEmptyCompletedToday,
  getDailyWirdSchedule,
  getTodayKhatmaDateKey,
  loadKhatmaState,
  saveKhatmaState,
} from './utils/khatmaData';
import {
  AUTO_THEME_STORAGE_KEYS,
  evaluateAutoThemePeriod,
  getNextThemeId,
  getThemeDefinition,
  loadAutoThemeDefaults,
  loadSavedTheme,
  normalizeThemeId,
  saveThemePreference,
} from './utils/themesData';

const STARTUP_HOME_RESET_KEY = 'mihrab_startup_home_reset_v1';
const JUMUAH_DEFAULT_OFF_RESET_KEY = 'mihrab_jumuah_default_off_v1';

function ensureDefaultMainPageStartup(): void {
  if (typeof window === 'undefined') return;
  try {
    if (localStorage.getItem(STARTUP_HOME_RESET_KEY) !== 'done') {
      localStorage.setItem('auto_enter_tv_display', 'false');
      localStorage.setItem('ambient_standby_auto_landscape', 'false');
      localStorage.setItem('last_third_auto_open', 'false');
      localStorage.setItem('last_third_auto_open_adhkar', 'false');
      localStorage.setItem(STARTUP_HOME_RESET_KEY, 'done');
    }
    if (localStorage.getItem(JUMUAH_DEFAULT_OFF_RESET_KEY) !== 'done') {
      localStorage.setItem('jumuah_preview_mode', 'false');
      localStorage.setItem(JUMUAH_DEFAULT_OFF_RESET_KEY, 'done');
    }
  } catch {
    // ignore storage access issues
  }
}

export default function App() {
  ensureDefaultMainPageStartup();

  const [activeTab, setActiveTab] = useState<'times' | 'tracker' | 'qibla' | 'adhkar' | 'quran' | 'ai' | 'companion' | 'commute' | 'family'>(() => {
    if (typeof window === 'undefined') return 'times';
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    const valid = ['times', 'tracker', 'qibla', 'adhkar', 'quran', 'ai', 'companion', 'commute', 'family'];
    if (tab && valid.includes(tab)) {
      return tab as any;
    }
    return 'times';
  });
  const [showSplashOverlay, setShowSplashOverlay] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    const valid = ['times', 'tracker', 'qibla', 'adhkar', 'quran', 'ai', 'companion', 'commute', 'family'];
    if (tab && valid.includes(tab)) {
      return false;
    }
    return true;
  });
  const [currentLocation, setCurrentLocation] = useState<CityLocation>(CITIES[0]); // Default Cairo
  const [settings, setSettings] = useState<UserSettings>({
    cityId: 'cairo',
    calculationMethod: 'egypt',
    asrMethod: 'standard',
    highLatitudeRule: 'none',
    hijriAdjustment: 0,
    adhanReciter: 'makkah',
    fajrAdhanReciter: 'fajr_makkah',
    fajrBoostVolume: true,
    volume: 80,
    notificationsEnabled: true,
    theme: loadSavedTheme(),
    autoLocation: false,
    activeBackgroundId: 'makkah_day',
    autoDayNightBackground: true, // Default to true: day mosque for daytime, night mosque for night!
    backgroundOpacity: 65,
    backgroundBlur: 0,
    autoDuaAfterAdhan:
      typeof window !== 'undefined' && localStorage.getItem('auto_dua_after_adhan') !== null
        ? localStorage.getItem('auto_dua_after_adhan') === 'true'
        : true,
    duaAudioReciter: (() => {
      if (typeof window === 'undefined') return 'shaarawy';
      const saved = localStorage.getItem('dua_audio_reciter');
      return getDuaSource(saved || 'shaarawy').id;
    })(),
    preAdhanReminderMinutes: (() => {
      if (typeof window === 'undefined') return 10;
      const saved = localStorage.getItem('pre_adhan_reminder_minutes');
      if (saved === null) return 10;
      const parsed = Number(saved);
      return Number.isFinite(parsed) && parsed >= 0 && parsed <= 60 ? parsed : 10;
    })(),
    preAdhanSoundEnabled:
      typeof window !== 'undefined' && localStorage.getItem('pre_adhan_sound_enabled') !== null
        ? localStorage.getItem('pre_adhan_sound_enabled') === 'true'
        : true,
    preAdhanVoiceMode: (() => {
      if (typeof window === 'undefined') return 'rotate';
      const saved = localStorage.getItem('pre_adhan_voice_mode');
      const valid = ['rotate', 'mishary', 'dosari', 'muaiqly', 'minshawi', 'abdulbasit', 'qatami'];
      return (saved && valid.includes(saved) ? saved : 'rotate') as UserSettings['preAdhanVoiceMode'];
    })(),
    iqamaMinutes: (() => {
      const defaults = { fajr: 25, dhuhr: 20, asr: 20, maghrib: 10, isha: 20 };
      if (typeof window === 'undefined') return defaults;
      try {
        const saved = localStorage.getItem('iqama_minutes_map');
        if (saved) {
          const parsed = JSON.parse(saved);
          return {
            fajr: Number(parsed.fajr) > 0 ? Math.min(60, Math.max(1, Number(parsed.fajr))) : defaults.fajr,
            dhuhr: Number(parsed.dhuhr) > 0 ? Math.min(60, Math.max(1, Number(parsed.dhuhr))) : defaults.dhuhr,
            asr: Number(parsed.asr) > 0 ? Math.min(60, Math.max(1, Number(parsed.asr))) : defaults.asr,
            maghrib: Number(parsed.maghrib) > 0 ? Math.min(60, Math.max(1, Number(parsed.maghrib))) : defaults.maghrib,
            isha: Number(parsed.isha) > 0 ? Math.min(60, Math.max(1, Number(parsed.isha))) : defaults.isha,
          };
        }
      } catch {
        // fallback to defaults
      }
      return defaults;
    })(),
    iqamaAutoPlayEnabled:
      typeof window !== 'undefined' && localStorage.getItem('iqama_autoplay_enabled') !== null
        ? localStorage.getItem('iqama_autoplay_enabled') === 'true'
        : true,
    iqamaVoiceMode: (() => {
      if (typeof window === 'undefined') return 'rotate';
      const saved = localStorage.getItem('iqama_voice_mode');
      const valid = ['rotate', 'basnawi', 'hadrawi', 'majed_abbas', 'madinah_haram', 'faisal_labban', 'makkah_classic'];
      return (saved && valid.includes(saved) ? saved : 'rotate') as UserSettings['iqamaVoiceMode'];
    })(),
    morningAdhkarTime:
      (typeof window !== 'undefined' ? localStorage.getItem('morning_adhkar_time') : null) || '06:00',
    eveningAdhkarTime:
      (typeof window !== 'undefined' ? localStorage.getItem('evening_adhkar_time') : null) || '17:00',
    morningAdhkarEnabled:
      typeof window !== 'undefined' && localStorage.getItem('morning_adhkar_enabled') !== null
        ? localStorage.getItem('morning_adhkar_enabled') === 'true'
        : true,
    eveningAdhkarEnabled:
      typeof window !== 'undefined' && localStorage.getItem('evening_adhkar_enabled') !== null
        ? localStorage.getItem('evening_adhkar_enabled') === 'true'
        : true,
    adhkarAutoPlayAudio:
      typeof window !== 'undefined' && localStorage.getItem('adhkar_auto_play_audio') !== null
        ? localStorage.getItem('adhkar_auto_play_audio') === 'true'
        : true,
    adhkarReciter:
      (typeof window !== 'undefined' ? localStorage.getItem('adhkar_reciter') : null) || 'alafasy_adhkar',
    morningAdhkarReciter: (() => {
      if (typeof window === 'undefined') return 'alafasy_adhkar';
      const saved = localStorage.getItem('morning_adhkar_reciter');
      const legacy = localStorage.getItem('adhkar_reciter');
      return resolveValidAdhkarReciterForPeriod(saved || legacy || undefined, 'morning', true);
    })(),
    eveningAdhkarReciter: (() => {
      if (typeof window === 'undefined') return 'alafasy_adhkar';
      const saved = localStorage.getItem('evening_adhkar_reciter');
      const legacy = localStorage.getItem('adhkar_reciter');
      return resolveValidAdhkarReciterForPeriod(saved || legacy || undefined, 'evening', true);
    })(),
    adhkarShortSheikh:
      (typeof window !== 'undefined' ? localStorage.getItem('adhkar_short_sheikh') : null) || 'rotate',
    iqamaStyle: (typeof window !== 'undefined' ? (localStorage.getItem('iqama_style_preference') as 'ring' | 'split' | 'pill') : 'ring') || 'ring',
    adhanModalLayout: (typeof window !== 'undefined' ? (localStorage.getItem('adhan_modal_layout') as any) : 'editorial-horizon') || 'editorial-horizon',
    adhanCountdownStyle: (typeof window !== 'undefined' ? (localStorage.getItem('adhan_countdown_islamic_style') as any) : 'islamic-mihrab') || 'islamic-mihrab',
    adhanBackgroundAutoRotate:
      typeof window !== 'undefined' && localStorage.getItem('adhan_bg_auto_rotate') !== null
        ? localStorage.getItem('adhan_bg_auto_rotate') === 'true'
        : true,
    adhanBackgroundMotionStyle: (() => {
      if (typeof window === 'undefined') return 'hybrid';
      const saved = localStorage.getItem('adhan_bg_motion_style');
      return (saved === 'hybrid' || saved === 'video' || saved === 'cinematic' ? saved : 'hybrid') as
        | 'hybrid'
        | 'video'
        | 'cinematic';
    })(),
    adhanEnabledMosques: (() => {
      const defaults = ['makkah_haram', 'madinah_nabawi', 'aqsa_quds', 'azhar_cairo', 'zayed_istanbul'];
      if (typeof window === 'undefined') return defaults;
      try {
        const raw = localStorage.getItem('adhan_enabled_mosques');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {
        // ignore invalid json
      }
      return defaults;
    })(),
    periodicReminderEnabled:
      typeof window !== 'undefined' && localStorage.getItem('periodic_reminder_enabled') !== null
        ? localStorage.getItem('periodic_reminder_enabled') === 'true'
        : true,
    periodicReminderInterval: (() => {
      if (typeof window === 'undefined') return 15;
      const saved = Number(localStorage.getItem('periodic_reminder_interval'));
      return ([5, 10, 15, 30, 60].includes(saved) ? saved : 15) as 5 | 10 | 15 | 30 | 60;
    })(),
    periodicReminderContentType: (() => {
      if (typeof window === 'undefined') return 'both';
      const saved = localStorage.getItem('periodic_reminder_content_type');
      return (
        saved === 'quran' || saved === 'hadith' || saved === 'wisdom' || saved === 'both'
          ? saved
          : 'both'
      ) as 'both' | 'quran' | 'hadith' | 'wisdom';
    })(),
    periodicOverlayEnabled:
      typeof window !== 'undefined' && localStorage.getItem('periodic_overlay_enabled') !== null
        ? localStorage.getItem('periodic_overlay_enabled') === 'true'
        : true,
    periodicQuietHoursEnabled:
      typeof window !== 'undefined' && localStorage.getItem('periodic_quiet_hours_enabled') !== null
        ? localStorage.getItem('periodic_quiet_hours_enabled') === 'true'
        : true,
    periodicQuietStart:
      (typeof window !== 'undefined' ? localStorage.getItem('periodic_quiet_start') : null) || '23:00',
    periodicQuietEnd:
      (typeof window !== 'undefined' ? localStorage.getItem('periodic_quiet_end') : null) || '06:00',
    periodicReminderSoundEnabled:
      typeof window !== 'undefined' && localStorage.getItem('periodic_reminder_sound_enabled') !== null
        ? localStorage.getItem('periodic_reminder_sound_enabled') === 'true'
        : false,
    salawatEnabled:
      typeof window !== 'undefined' && localStorage.getItem('salawat_enabled') !== null
        ? localStorage.getItem('salawat_enabled') === 'true'
        : true,
    salawatIntervalMinutes: (() => {
      if (typeof window === 'undefined') return 10;
      const saved = Number(localStorage.getItem('salawat_interval_minutes'));
      return ([5, 10, 15, 30, 60].includes(saved) ? saved : 10) as 5 | 10 | 15 | 30 | 60;
    })(),
    salawatVoiceMode: (() => {
      if (typeof window === 'undefined') return 'rotate';
      const saved = localStorage.getItem('salawat_voice_mode');
      const valid = ['rotate', 'mishary', 'dosari', 'muaiqly', 'naqshabandi', 'naqshabandi_radio'];
      return (saved && valid.includes(saved) ? saved : 'rotate') as UserSettings['salawatVoiceMode'];
    })(),
    lastThirdNightEnabled:
      typeof window !== 'undefined' && localStorage.getItem('last_third_night_enabled') !== null
        ? localStorage.getItem('last_third_night_enabled') === 'true'
        : true,
    lastThirdNightMode: (() => {
      if (typeof window === 'undefined') return 'astronomical';
      const saved = localStorage.getItem('last_third_night_mode');
      return (saved === 'astronomical' || saved === 'before_fajr' || saved === 'custom'
        ? saved
        : 'astronomical') as UserSettings['lastThirdNightMode'];
    })(),
    lastThirdBeforeFajrMinutes: (() => {
      if (typeof window === 'undefined') return 30;
      const saved = Number(localStorage.getItem('last_third_before_fajr_minutes'));
      return ([15, 30, 45, 60].includes(saved) ? saved : 30) as 15 | 30 | 45 | 60;
    })(),
    lastThirdNightCustomTime:
      (typeof window !== 'undefined' ? localStorage.getItem('last_third_night_custom_time') : '03:00') || '03:00',
    lastThirdNightTheme:
      (typeof window !== 'undefined'
        ? (localStorage.getItem('last_third_night_theme') as 'celestial' | 'dimmed' | 'oled')
        : 'dimmed') || 'dimmed',
    lastThirdAutoOpen:
      typeof window !== 'undefined' && localStorage.getItem('last_third_auto_open') !== null
        ? localStorage.getItem('last_third_auto_open') === 'true'
        : false,
    lastThirdFadeInAlarm:
      typeof window !== 'undefined' && localStorage.getItem('last_third_fade_in_alarm') !== null
        ? localStorage.getItem('last_third_fade_in_alarm') === 'true'
        : true,
    lastThirdAutoOpenAdhkar:
      typeof window !== 'undefined' && localStorage.getItem('last_third_auto_open_adhkar') !== null
        ? localStorage.getItem('last_third_auto_open_adhkar') === 'true'
        : false,
    witrReminderEnabled:
      typeof window !== 'undefined' && localStorage.getItem('witr_reminder_enabled') !== null
        ? localStorage.getItem('witr_reminder_enabled') === 'true'
        : true,
    witrReminderMinutes: (() => {
      if (typeof window === 'undefined') return 20;
      const saved = Number(localStorage.getItem('witr_reminder_minutes'));
      return ([15, 20, 30].includes(saved) ? saved : 20) as 15 | 20 | 30;
    })(),
    suhoorReminderEnabled:
      typeof window !== 'undefined' && localStorage.getItem('suhoor_reminder_enabled') !== null
        ? localStorage.getItem('suhoor_reminder_enabled') === 'true'
        : false,
    suhoorReminderMinutes: (() => {
      if (typeof window === 'undefined') return 45;
      const saved = Number(localStorage.getItem('suhoor_reminder_minutes'));
      return ([30, 45, 60].includes(saved) ? saved : 45) as 30 | 45 | 60;
    })(),
    meetingModeEnabled:
      typeof window !== 'undefined' && localStorage.getItem('meeting_mode_enabled') !== null
        ? localStorage.getItem('meeting_mode_enabled') === 'true'
        : false,
    ...loadAutoThemeDefaults(),
    ...(() => {
      const fp = loadFastingPreferences();
      return {
        fastingWhiteDaysEnabled: fp.whiteDaysEnabled,
        fastingMonThuEnabled: fp.monThuEnabled,
        fastingAshuraArafahEnabled: fp.ashuraArafahEnabled,
        showFastingStatsInRecord: fp.showFastingStatsInRecord,
      };
    })(),
    ambientStandbyAutoLandscape:
      typeof window !== 'undefined' && localStorage.getItem('ambient_standby_auto_landscape') !== null
        ? localStorage.getItem('ambient_standby_auto_landscape') === 'true'
        : false,
    travelModeEnabled:
      typeof window !== 'undefined' && localStorage.getItem('travel_mode_enabled') !== null
        ? localStorage.getItem('travel_mode_enabled') === 'true'
        : false,
    travelDistanceKm: (() => {
      if (typeof window === 'undefined') return 120;
      const saved = Number(localStorage.getItem('travel_distance_km'));
      return Number.isFinite(saved) && saved > 0 ? saved : 120;
    })(),
    travelJamType: (() => {
      if (typeof window === 'undefined') return 'taqdeem';
      const saved = localStorage.getItem('travel_jam_type');
      return (saved === 'takheer' ? 'takheer' : 'taqdeem') as 'taqdeem' | 'takheer';
    })(),
    postPrayerCheckinEnabled:
      typeof window !== 'undefined' && localStorage.getItem('post_prayer_checkin_enabled') !== null
        ? localStorage.getItem('post_prayer_checkin_enabled') === 'true'
        : true,
    postPrayerCheckinMinutes: (() => {
      if (typeof window === 'undefined') return 20;
      const saved = Number(localStorage.getItem('post_prayer_checkin_minutes'));
      return (saved === 15 || saved === 20 || saved === 30 ? saved : 20) as 15 | 20 | 30;
    })(),
    postPrayerIncludeWird:
      typeof window !== 'undefined' && localStorage.getItem('post_prayer_include_wird') !== null
        ? localStorage.getItem('post_prayer_include_wird') === 'true'
        : true,
    postPrayerIncludeAdhkar:
      typeof window !== 'undefined' && localStorage.getItem('post_prayer_include_adhkar') !== null
        ? localStorage.getItem('post_prayer_include_adhkar') === 'true'
        : true,
    postPrayerIncludeSunnah:
      typeof window !== 'undefined' && localStorage.getItem('post_prayer_include_sunnah') !== null
        ? localStorage.getItem('post_prayer_include_sunnah') === 'true'
        : true,
    tvRemoteFocusEnabled:
      typeof window !== 'undefined' && localStorage.getItem('tv_remote_focus_enabled') !== null
        ? localStorage.getItem('tv_remote_focus_enabled') === 'true'
        : true,
    keepScreenAwakeAlways:
      typeof window !== 'undefined' && localStorage.getItem('keep_screen_awake_always') !== null
        ? localStorage.getItem('keep_screen_awake_always') === 'true'
        : false,
    autoEnterTvDisplay:
      typeof window !== 'undefined' && localStorage.getItem('auto_enter_tv_display') !== null
        ? localStorage.getItem('auto_enter_tv_display') === 'true'
        : false,
    remoteApiBaseUrl:
      typeof window !== 'undefined' ? localStorage.getItem('remote_api_base_url') || '' : '',
    stickyNotificationEnabled:
      typeof window !== 'undefined' && localStorage.getItem('sticky_notification_enabled') !== null
        ? localStorage.getItem('sticky_notification_enabled') === 'true'
        : true,
    adhanBannerNotificationEnabled:
      typeof window !== 'undefined' && localStorage.getItem('adhan_banner_notification_enabled') !== null
        ? localStorage.getItem('adhan_banner_notification_enabled') === 'true'
        : true,
    notificationMosqueTheme: (() => {
      if (typeof window === 'undefined') return 'auto';
      const saved = localStorage.getItem('notification_mosque_theme');
      return (saved === 'nabawi' || saved === 'kaaba' || saved === 'azhar' ? saved : 'auto') as
        | 'auto'
        | 'nabawi'
        | 'kaaba'
        | 'azhar';
    })(),
    prayerOffsets: (() => {
      if (typeof window === 'undefined') return {};
      try {
        const raw = localStorage.getItem('mihrab_prayer_offsets');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') return parsed;
        }
      } catch {
        // ignore invalid json
      }
      return {};
    })(),
    prayerAdhanEnabled: (() => {
      const defaults = { fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true };
      if (typeof window === 'undefined') return defaults;
      try {
        const raw = localStorage.getItem('mihrab_prayer_adhan_enabled');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            return {
              fajr: parsed.fajr !== false,
              dhuhr: parsed.dhuhr !== false,
              asr: parsed.asr !== false,
              maghrib: parsed.maghrib !== false,
              isha: parsed.isha !== false,
            };
          }
        }
      } catch {
        // ignore invalid json
      }
      return defaults;
    })(),
    prayerReciters: (() => {
      if (typeof window === 'undefined') return {};
      try {
        const raw = localStorage.getItem('mihrab_prayer_reciters');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') return parsed;
        }
      } catch {
        // ignore invalid json
      }
      return {};
    })(),
    sunriseReminderEnabled:
      typeof window !== 'undefined' && localStorage.getItem('mihrab_sunrise_reminder_enabled') !== null
        ? localStorage.getItem('mihrab_sunrise_reminder_enabled') === 'true'
        : false,
    duhaReminderEnabled:
      typeof window !== 'undefined' && localStorage.getItem('mihrab_duha_reminder_enabled') !== null
        ? localStorage.getItem('mihrab_duha_reminder_enabled') === 'true'
        : false,
    duhaReminderTiming: (() => {
      if (typeof window === 'undefined') return 'ishraq';
      const saved = localStorage.getItem('mihrab_duha_reminder_timing');
      return saved === 'peak' || saved === 'both' ? saved : 'ishraq';
    })(),
    duhaReminderSoundEnabled:
      typeof window !== 'undefined' && localStorage.getItem('mihrab_duha_reminder_sound') !== null
        ? localStorage.getItem('mihrab_duha_reminder_sound') === 'true'
        : true,
  });

  const [autoThemeManualPause, setAutoThemeManualPause] = useState<boolean>(false);
  const [autoThemeOverrideNotice, setAutoThemeOverrideNotice] = useState<{
    chosenThemeId: AppThemeId;
  } | null>(null);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<SettingsTabId>('general');
  const openSettingsOnTab = (tab: SettingsTabId = 'general') => {
    setSettingsInitialTab(tab);
    setIsSettingsOpen(true);
  };
  const [isBackgroundPickerOpen, setIsBackgroundPickerOpen] = useState(false);
  const [isPeriodicPopupOpen, setIsPeriodicPopupOpen] = useState(false);
  const [isSteadfastnessOpen, setIsSteadfastnessOpen] = useState(false);
  const [companionSubTab, setCompanionSubTab] = useState<HubSectionTab>('calendar');
  const [activeCompanionToast, setActiveCompanionToast] = useState<{
    kind: 'qada' | 'hifz';
    titleAr: string;
    bodyAr: string;
  } | null>(null);
  const [displayInitialMode, setDisplayInitialMode] = useState<UnifiedDisplayMode | undefined>(() => {
    if (typeof window === 'undefined') return undefined;
    const mode = new URLSearchParams(window.location.search).get('mode');
    if (mode === 'mosque') return 'mosque';
    if (mode === 'standby') return 'standby';
    return undefined;
  });
  const [isStandbyModeOpen, setIsStandbyModeOpen] = useState(() => {
    if (typeof window === 'undefined') return false;
    const mode = new URLSearchParams(window.location.search).get('mode');
    return mode === 'standby' || mode === 'mosque';
  });
  const [forcedPeriodicItemId, setForcedPeriodicItemId] = useState<string | null>(null);
  const lastAdhanTriggerRef = React.useRef<{ key: string; at: number } | null>(null);
  const [fullScreenAdhanState, setFullScreenAdhanState] = useState<{
    isOpen: boolean;
    prayerKey: PrayerName;
    prayerNameAr: string;
    isSimulation: boolean;
  }>({
    isOpen: false,
    prayerKey: 'asr',
    prayerNameAr: 'العصر',
    isSimulation: false,
  });
  const [isIstikharaHajahOpen, setIsIstikharaHajahOpen] = useState(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('shortcut') === 'istikhara';
  });
  const [isWidgetStudioOpen, setIsWidgetStudioOpen] = useState(false);
  const [widgetConfig, setWidgetConfig] = useState<WidgetStudioConfig>(() => loadWidgetConfig());
  const handleUpdateWidgetConfig = (partial: Partial<WidgetStudioConfig>) => {
    setWidgetConfig((prev) => {
      const next = { ...prev, ...partial };
      saveWidgetConfig(next);
      return next;
    });
  };
  const [standaloneWidgetConfig, setStandaloneWidgetConfig] = useState<WidgetStudioConfig | null>(() => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    if (params.get('widget') !== 'true') return null;
    const base = loadWidgetConfig();
    const size = params.get('size');
    const theme = params.get('theme');
    const sec = params.get('sec');
    const hijri = params.get('hijri');
    const wird = params.get('wird');
    const fasting = params.get('fasting');
    const insp = params.get('insp');
    const duha = params.get('duha');
    const quiet = params.get('quiet');
    const actions = params.get('actions');
    const rings = params.get('rings');
    const bg = params.get('bg');
    const bgop = params.get('bgop');
    const fscale = params.get('fscale');
    const rate = params.get('rate');
    const parsedOpacity = bgop !== null ? Number(bgop) : NaN;
    return {
      ...base,
      size:
        size === 'lock_pill' ||
        size === 'medium' ||
        size === 'large' ||
        size === 'spiritual_card'
          ? size
          : base.size,
      theme:
        theme === 'emerald' ||
        theme === 'glass' ||
        theme === 'oled' ||
        theme === 'parchment' ||
        theme === 'royal_gold'
          ? theme
          : base.theme,
      showLiveSeconds: sec !== null ? sec === '1' : base.showLiveSeconds,
      showHijriDate: hijri !== null ? hijri === '1' : base.showHijriDate,
      showSunnahWird: wird !== null ? wird === '1' : base.showSunnahWird,
      showFastingAlert: fasting !== null ? fasting === '1' : base.showFastingAlert,
      showDailyInspiration: insp !== null ? insp === '1' : base.showDailyInspiration,
      showDuhaSunrise: duha !== null ? duha === '1' : base.showDuhaSunrise,
      showQuietAndLastThird: quiet !== null ? quiet === '1' : base.showQuietAndLastThird,
      showQuickActions: actions !== null ? actions === '1' : base.showQuickActions,
      showDayProgressRings: rings !== null ? rings === '1' : base.showDayProgressRings,
      mosqueBackgroundId:
        bg === 'none' || bg === 'makkah' || bg === 'madinah' || bg === 'aqsa' || bg === 'azhar'
          ? bg
          : base.mosqueBackgroundId,
      mosqueBgOpacity:
        Number.isFinite(parsedOpacity) && parsedOpacity >= 15 && parsedOpacity <= 80
          ? parsedOpacity
          : base.mosqueBgOpacity,
      fontScale:
        fscale === 'sm' || fscale === 'md' || fscale === 'lg' ? fscale : base.fontScale,
      refreshInterval: rate === '1m' || rate === '1s' ? rate : base.refreshInterval,
    };
  });
  const standbyDismissedInLandscapeRef = React.useRef<boolean>(false);
  const [activeSalawatToast, setActiveSalawatToast] = useState<SalawatVoiceProfile | null>(null);
  const [activePreAdhanToast, setActivePreAdhanToast] = useState<{
    profile: PreAdhanVoiceProfile;
    prayerNameAr?: string;
  } | null>(null);
  const [activeIqamaToast, setActiveIqamaToast] = useState<{
    profile: IqamaVoiceProfile;
    prayerNameAr?: string;
  } | null>(null);
  const [basePrayerTimes, setBasePrayerTimes] = useState<PrayerTimeData>(() =>
    calculatePrayerTimes(new Date(), CITIES[0].lat, CITIES[0].lng, CITIES[0].timezone, 'egypt', 'standard')
  );
  const prayerTimes = React.useMemo(
    () => applyPrayerTimeOffsets(basePrayerTimes, settings.prayerOffsets),
    [basePrayerTimes, settings.prayerOffsets]
  );
  const [khatmaState, setKhatmaState] = useState<KhatmaState>(() => loadKhatmaState());
  const [selectedWirdModal, setSelectedWirdModal] = useState<{
    prayerKey: KhatmaPrayerKey;
    prayerNameAr: string;
  } | null>(null);

  const [checkinState, setCheckinState] = useState<DailyCheckinState>(() =>
    loadTodayCheckinState()
  );
  const [sunnahState, setSunnahState] = useState<SunnahRawatibState>(() =>
    loadSunnahRawatibState()
  );
  const [forcedCheckinPrayer, setForcedCheckinPrayer] = useState<{
    prayerKey: CheckinPrayerKey;
    prayerNameAr: string;
  } | null>(null);
  const [activePostPrayerToast, setActivePostPrayerToast] = useState<{
    prayerKey: CheckinPrayerKey;
    prayerNameAr: string;
    dateKey: string;
    isTest?: boolean;
  } | null>(null);

  const appMountedAtRef = React.useRef<number>(Date.now());
  const [globalSilentMeetingAlert, setGlobalSilentMeetingAlert] = useState<{
    prayerNameAr: string;
    timeStr: string;
  } | null>(null);
  const [globalPostPrayerModal, setGlobalPostPrayerModal] = useState<{
    isOpen: boolean;
    prayerNameAr: string;
  }>({ isOpen: false, prayerNameAr: 'العصر' });

  const [scheduledAdhkarBanner, setScheduledAdhkarBanner] = useState<{
    period: 'morning' | 'evening';
    title: string;
  } | null>(null);
  const [duhaSunriseBanner, setDuhaSunriseBanner] = useState<{
    title: string;
    subtitle: string;
  } | null>(null);

  // Silent global audio unlock on first user interaction anywhere in the app
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let attempted = false;
    const handleFirstGesture = () => {
      if (attempted && adhanPlayer.getIsUnlocked()) return;
      attempted = true;
      void adhanPlayer.unlockAudio();
    };
    window.addEventListener('pointerdown', handleFirstGesture, { passive: true, capture: true });
    window.addEventListener('touchstart', handleFirstGesture, { passive: true, capture: true });
    window.addEventListener('keydown', handleFirstGesture, { passive: true, capture: true });
    return () => {
      window.removeEventListener('pointerdown', handleFirstGesture, { capture: true });
      window.removeEventListener('touchstart', handleFirstGesture, { capture: true });
      window.removeEventListener('keydown', handleFirstGesture, { capture: true });
    };
  }, []);

  // Scheduled Morning/Evening Adhkar using precision ticker + catch-up window
  useEffect(() => {
    const checkAdhkarSchedule = (now: Date) => {
      if (shouldSuppressGeneralNotification(loadQuietModeState(), now)) return;
      const nowMs = now.getTime();
      const dateKey = toSchedulerDateKey(now);

      if (settings.morningAdhkarEnabled !== false && settings.morningAdhkarTime) {
        const morningEpoch = parsePrayerTimeEpoch(now, settings.morningAdhkarTime, 0);
        const trigKey = `${dateKey}|morning_adhkar|${settings.morningAdhkarTime}`;
        if (
          morningEpoch !== null &&
          !hasSchedulerFired(trigKey) &&
          isEventDueInWindow(nowMs, morningEpoch, appMountedAtRef.current)
        ) {
          markSchedulerFired(trigKey);
          if (settings.adhkarAutoPlayAudio !== false && !settings.meetingModeEnabled) {
            const morningReciter = resolveValidAdhkarReciterForPeriod(
              settings.morningAdhkarReciter || settings.adhkarReciter,
              'morning',
              true
            );
            adhanPlayer.playAdhkar(morningReciter, 'أذكار الصباح المباركة', 'morning');
          }
          if (settings.notificationsEnabled) {
            backgroundService.sendPrayerNotification(
              'حان وقت أذكار الصباح',
              'ابدأ يومك بذكر الله وحصن نفسك بالأذكار المأثورة'
            );
          }
          setScheduledAdhkarBanner({ period: 'morning', title: 'حان الآن وقت أذكار الصباح ☀️' });
        }
      }

      if (settings.eveningAdhkarEnabled !== false && settings.eveningAdhkarTime) {
        const eveningEpoch = parsePrayerTimeEpoch(now, settings.eveningAdhkarTime, 0);
        const trigKey = `${dateKey}|evening_adhkar|${settings.eveningAdhkarTime}`;
        if (
          eveningEpoch !== null &&
          !hasSchedulerFired(trigKey) &&
          isEventDueInWindow(nowMs, eveningEpoch, appMountedAtRef.current)
        ) {
          markSchedulerFired(trigKey);
          if (settings.adhkarAutoPlayAudio !== false && !settings.meetingModeEnabled) {
            const eveningReciter = resolveValidAdhkarReciterForPeriod(
              settings.eveningAdhkarReciter || settings.adhkarReciter,
              'evening',
              true
            );
            adhanPlayer.playAdhkar(eveningReciter, 'أذكار المساء المباركة', 'evening');
          }
          if (settings.notificationsEnabled) {
            backgroundService.sendPrayerNotification(
              'حان وقت أذكار المساء',
              'احفظ نفسك وليلتك بذكر الله والأذكار المأثورة'
            );
          }
          setScheduledAdhkarBanner({ period: 'evening', title: 'حان الآن وقت أذكار المساء 🌙' });
        }
      }
    };

    return createPrecisionClockTicker(checkAdhkarSchedule);
  }, [
    settings.morningAdhkarEnabled,
    settings.eveningAdhkarEnabled,
    settings.morningAdhkarTime,
    settings.eveningAdhkarTime,
    settings.adhkarReciter,
    settings.morningAdhkarReciter,
    settings.eveningAdhkarReciter,
    settings.adhkarAutoPlayAudio,
    settings.meetingModeEnabled,
    settings.notificationsEnabled,
  ]);

  // Scheduled Sunrise & Duha Prayer Reminders using precision ticker + catch-up window
  useEffect(() => {
    if (!settings.sunriseReminderEnabled && !settings.duhaReminderEnabled) return;

    const checkDuhaSunriseReminders = (now: Date) => {
      if (shouldSuppressGeneralNotification(loadQuietModeState(), now)) return;
      const nowMs = now.getTime();
      const dateKey = toSchedulerDateKey(now);
      const schedule = calculateDuhaSchedule(prayerTimes.sunrise, prayerTimes.dhuhr, now);

      const triggerAlert = (id: string, targetHHmm: string, title: string, subtitle: string) => {
        const targetEpoch = parsePrayerTimeEpoch(now, targetHHmm, 0);
        const trigKey = `${dateKey}|duha_sunrise|${id}|${targetHHmm}`;
        if (
          targetEpoch === null ||
          hasSchedulerFired(trigKey) ||
          !isEventDueInWindow(nowMs, targetEpoch, appMountedAtRef.current)
        ) {
          return;
        }
        markSchedulerFired(trigKey);

        if (settings.duhaReminderSoundEnabled !== false && !settings.meetingModeEnabled) {
          adhanPlayer.playChime();
        }
        if (settings.notificationsEnabled) {
          backgroundService.sendPrayerNotification(title, subtitle);
        }
        setDuhaSunriseBanner({ title, subtitle });
      };

      if (settings.sunriseReminderEnabled) {
        triggerAlert(
          'sunrise',
          schedule.sunriseStr,
          'حان الآن وقت شروق الشمس ☀️',
          `تُفتح نافذة صلاة الإشراق والضحى الساعة ${formatTime12Ar(schedule.ishraqStartStr)}`
        );
      }

      if (settings.duhaReminderEnabled) {
        const timing = settings.duhaReminderTiming || 'ishraq';
        if (timing === 'ishraq' || timing === 'both') {
          triggerAlert(
            'duha_ishraq',
            schedule.ishraqStartStr,
            'حان الآن وقت صلاة الإشراق والضحى ✨',
            `ابدأ بركعتي الإشراق (ينتهي وقت الضحى الساعة ${formatTime12Ar(schedule.duhaEndStr)})`
          );
        }
        if (timing === 'peak' || timing === 'both') {
          triggerAlert(
            'duha_peak',
            schedule.bestDuhaStr,
            'أفضل وقت لصلاة الضحى الآن ☀️',
            `صلاة الأوّابين حين ترمض الفصال — متاحة حتى ${formatTime12Ar(schedule.duhaEndStr)}`
          );
        }
      }
    };

    return createPrecisionClockTicker(checkDuhaSunriseReminders);
  }, [
    prayerTimes.sunrise,
    prayerTimes.dhuhr,
    settings.sunriseReminderEnabled,
    settings.duhaReminderEnabled,
    settings.duhaReminderTiming,
    settings.duhaReminderSoundEnabled,
    settings.meetingModeEnabled,
    settings.notificationsEnabled,
  ]);

  useEffect(() => {
    saveKhatmaState(khatmaState);
  }, [khatmaState]);

  const khatmaSchedule = getDailyWirdSchedule(khatmaState);

  const handleSwitchKhatmaPlan = (plan: KhatmaPlanDays) => {
    setKhatmaState((prev) => ({ ...prev, plan }));
  };

  const handleTogglePrayerWird = (prayerKey: KhatmaPrayerKey, forceValue?: boolean) => {
    adhanPlayer.playChime();
    const nextVal =
      typeof forceValue === 'boolean' ? forceValue : !khatmaState.completedToday[prayerKey];
    setKhatmaState((prev) => ({
      ...prev,
      completedToday: {
        ...prev.completedToday,
        [prayerKey]: nextVal,
      },
    }));
    const updatedCheckin = toggleCheckinField(prayerKey, 'wird', nextVal);
    setCheckinState(updatedCheckin);
  };

  const handleStartNewKhatma = () => {
    setKhatmaState((prev) => ({
      plan: prev.plan,
      basePagesRead: 0,
      todayDate: getTodayKhatmaDateKey(),
      completedToday: createEmptyCompletedToday(),
    }));
  };

  const activeThemeId = normalizeThemeId(settings.theme);

  const autoThemeEvaluation = evaluateAutoThemePeriod({
    mode: settings.autoThemeMode || 'sunrise_maghrib',
    sunriseStr: prayerTimes.sunrise,
    maghribStr: prayerTimes.maghrib,
    customDayTime: settings.autoThemeCustomDayTime || '06:00',
    customNightTime: settings.autoThemeCustomNightTime || '18:00',
    dayThemeId: settings.autoThemeDayId || 'parchment',
    nightThemeId: settings.autoThemeNightId || 'indigo',
  });

  // Apply CSS Variable data-theme attribute to document root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', activeThemeId);
    saveThemePreference(activeThemeId);
  }, [activeThemeId]);

  // Smart Auto Day/Night Theme checker: runs immediately on change and every 60 seconds
  useEffect(() => {
    if (!settings.autoThemeEnabled || autoThemeManualPause) return;

    const syncAutoTheme = () => {
      const evaluation = evaluateAutoThemePeriod({
        now: new Date(),
        mode: settings.autoThemeMode || 'sunrise_maghrib',
        sunriseStr: prayerTimes.sunrise,
        maghribStr: prayerTimes.maghrib,
        customDayTime: settings.autoThemeCustomDayTime || '06:00',
        customNightTime: settings.autoThemeCustomNightTime || '18:00',
        dayThemeId: settings.autoThemeDayId || 'parchment',
        nightThemeId: settings.autoThemeNightId || 'indigo',
      });

      setSettings((prev) => {
        if (!prev.autoThemeEnabled) return prev;
        if (normalizeThemeId(prev.theme) === evaluation.targetThemeId) return prev;
        saveThemePreference(evaluation.targetThemeId);
        return { ...prev, theme: evaluation.targetThemeId };
      });
    };

    syncAutoTheme();
    const timer = window.setInterval(syncAutoTheme, 60_000);
    return () => window.clearInterval(timer);
  }, [
    settings.autoThemeEnabled,
    settings.autoThemeMode,
    settings.autoThemeDayId,
    settings.autoThemeNightId,
    settings.autoThemeCustomDayTime,
    settings.autoThemeCustomNightTime,
    prayerTimes.sunrise,
    prayerTimes.maghrib,
    autoThemeManualPause,
  ]);

  // Auto-dismiss manual theme override notice after 14 seconds
  useEffect(() => {
    if (!autoThemeOverrideNotice) return;
    const timer = window.setTimeout(() => {
      setAutoThemeOverrideNotice(null);
    }, 14_000);
    return () => window.clearTimeout(timer);
  }, [autoThemeOverrideNotice]);

  const handleManualThemeSelect = (chosenThemeId: AppThemeId) => {
    handleUpdateSettings({ theme: chosenThemeId });
    if (settings.autoThemeEnabled) {
      setAutoThemeManualPause(true);
      setAutoThemeOverrideNotice({ chosenThemeId });
    }
  };

  const handleCycleTheme = () => {
    const nextTheme = getNextThemeId(activeThemeId);
    handleManualThemeSelect(nextTheme);
  };

  const handleReEnableAutoTheme = () => {
    setAutoThemeManualPause(false);
    setAutoThemeOverrideNotice(null);
    const evaluation = evaluateAutoThemePeriod({
      now: new Date(),
      mode: settings.autoThemeMode || 'sunrise_maghrib',
      sunriseStr: prayerTimes.sunrise,
      maghribStr: prayerTimes.maghrib,
      customDayTime: settings.autoThemeCustomDayTime || '06:00',
      customNightTime: settings.autoThemeCustomNightTime || '18:00',
      dayThemeId: settings.autoThemeDayId || 'parchment',
      nightThemeId: settings.autoThemeNightId || 'indigo',
    });
    handleUpdateSettings({ autoThemeEnabled: true, theme: evaluation.targetThemeId });
  };

  const handlePinManualTheme = (chosenThemeId: AppThemeId) => {
    setAutoThemeManualPause(false);
    setAutoThemeOverrideNotice(null);
    handleUpdateSettings({ autoThemeEnabled: false, theme: chosenThemeId });
  };

  // Sync autoDua configuration with adhanPlayer
  useEffect(() => {
    adhanPlayer.setAutoDua(settings.autoDuaAfterAdhan, settings.duaAudioReciter);
  }, [settings.autoDuaAfterAdhan, settings.duaAudioReciter]);

  // Background pre-cache essential Adhan, Ruqyah & Dua audio files for instant offline playback
  useEffect(() => {
    precacheEssentialAudioOnce(settings);
  }, []);

  // Keep Screen Awake Always (for Android TV / Mosque Display / Bedside Clock)
  useEffect(() => {
    if (settings.keepScreenAwakeAlways || isLikelyAndroidTvDevice()) {
      void backgroundService.requestWakeLock();
    } else if (!isStandbyModeOpen) {
      void backgroundService.releaseWakeLock();
    }
  }, [settings.keepScreenAwakeAlways, isStandbyModeOpen]);

  // Auto-open Unified Mosque / TV Display on startup when configured for dedicated screens
  useEffect(() => {
    if (settings.autoEnterTvDisplay && !isStandbyModeOpen) {
      setDisplayInitialMode('mosque');
      setIsStandbyModeOpen(true);
    }
  }, []);

  const familyBackHandlerRef = React.useRef<(() => boolean) | null>(null);
  const pendingTimesSimulationEventRef = React.useRef<string | null>(null);

  const getNextPrayerInfo = useCallback((times: PrayerTimeData): { key: PrayerName; nameAr: string } => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
    const isFriday = now.getDay() === 5;
    const toMins = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return (h || 0) * 60 + (m || 0);
    };
    const list: { key: PrayerName; nameAr: string; mins: number }[] = [
      { key: 'fajr', nameAr: 'الفجر', mins: toMins(times.fajr) },
      { key: 'dhuhr', nameAr: isFriday ? 'الجمعة' : 'الظهر', mins: toMins(times.dhuhr) },
      { key: 'asr', nameAr: 'العصر', mins: toMins(times.asr) },
      { key: 'maghrib', nameAr: 'المغرب', mins: toMins(times.maghrib) },
      { key: 'isha', nameAr: 'العشاء', mins: toMins(times.isha) },
    ];
    const next = list.find((p) => p.mins > currentMinutes) || list[0];
    return { key: next.key, nameAr: next.nameAr };
  }, []);

  const handleOpenFullScreenAdhanModal = useCallback(
    (prayerKey?: PrayerName, customNameAr?: string, isSimulation: boolean = false) => {
      const fallback = getNextPrayerInfo(prayerTimes);
      const targetKey = prayerKey || fallback.key;
      if (!isSimulation) {
        if (shouldSuppressPrayerAudioOrAlert(loadQuietModeState(), targetKey, new Date())) {
          return;
        }
        const nowTs = Date.now();
        if (
          lastAdhanTriggerRef.current &&
          lastAdhanTriggerRef.current.key === targetKey &&
          nowTs - lastAdhanTriggerRef.current.at < 65000
        ) {
          return;
        }
        lastAdhanTriggerRef.current = { key: targetKey, at: nowTs };
      }
      const defaultNames: Record<PrayerName, string> = {
        fajr: 'الفجر',
        sunrise: 'الشروق',
        dhuhr: new Date().getDay() === 5 ? 'الجمعة' : 'الظهر',
        asr: 'العصر',
        maghrib: 'المغرب',
        isha: 'العشاء',
      };
      const resolvedName = customNameAr || defaultNames[targetKey] || fallback.nameAr;
      void adhanPlayer.unlockAudio();
      if (!isSimulation && !isNativeAndroidApp() && settings.adhanBannerNotificationEnabled !== false) {
        backgroundService.sendPrayerNotification(
          resolvedName,
          currentLocation.nameAr,
          settings.notificationMosqueTheme || 'auto',
          targetKey
        );
      }
      setFullScreenAdhanState({
        isOpen: true,
        prayerKey: targetKey,
        prayerNameAr: resolvedName,
        isSimulation,
      });
    },
    [
      getNextPrayerInfo,
      prayerTimes,
      currentLocation.nameAr,
      settings.adhanBannerNotificationEnabled,
      settings.notificationMosqueTheme,
    ]
  );

  // Global listener so Full-Screen Adhan simulation & PrayerTimesCard simulations work from ANY active tab
  useEffect(() => {
    const onOpenFullScreenSim = () => {
      handleOpenFullScreenAdhanModal(undefined, undefined, true);
    };
    window.addEventListener('open_fullscreen_adhan_simulation', onOpenFullScreenSim);

    const timesSimEvents = [
      'toggle_near_adhan_simulation',
      'open_post_prayer_simulation',
      'toggle_jumuah_preview',
      'toggle_jumuah_sunan',
      'toggle_golden_hour',
      'open_last_third_night_simulation',
      'toggle_last_third_simulation',
      'simulate_last_third_qiyam_toast',
    ];
    const eventHandlers = timesSimEvents.map((eventName) => {
      const handler = () => {
        if (eventName === 'simulate_last_third_qiyam_toast') {
          void adhanPlayer.unlockAudio();
        }
        if (activeTab !== 'times') {
          pendingTimesSimulationEventRef.current = eventName;
          setActiveTab('times');
        }
      };
      window.addEventListener(eventName, handler);
      return { eventName, handler };
    });

    return () => {
      window.removeEventListener('open_fullscreen_adhan_simulation', onOpenFullScreenSim);
      eventHandlers.forEach(({ eventName, handler }) => {
        window.removeEventListener(eventName, handler);
      });
    };
  }, [activeTab, handleOpenFullScreenAdhanModal]);

  useEffect(() => {
    if (activeTab === 'times' && pendingTimesSimulationEventRef.current) {
      const pendingEvent = pendingTimesSimulationEventRef.current;
      pendingTimesSimulationEventRef.current = null;
      const timer = window.setTimeout(() => {
        window.dispatchEvent(new CustomEvent(pendingEvent));
      }, 60);
      return () => window.clearTimeout(timer);
    }
  }, [activeTab]);

  const handleTvOrAndroidBack = useCallback((): boolean => {
    if (fullScreenAdhanState.isOpen) {
      adhanPlayer.stop();
      setFullScreenAdhanState((prev) => ({ ...prev, isOpen: false }));
      return true;
    }
    if (activeTab === 'family' && familyBackHandlerRef.current?.()) {
      return true;
    }
    if (isSettingsOpen) {
      setIsSettingsOpen(false);
      return true;
    }
    if (isBackgroundPickerOpen) {
      setIsBackgroundPickerOpen(false);
      return true;
    }
    if (isWidgetStudioOpen) {
      setIsWidgetStudioOpen(false);
      return true;
    }
    if (isSteadfastnessOpen) {
      setIsSteadfastnessOpen(false);
      return true;
    }
    if (isIstikharaHajahOpen) {
      setIsIstikharaHajahOpen(false);
      return true;
    }
    if (selectedWirdModal) {
      setSelectedWirdModal(null);
      return true;
    }
    if (forcedCheckinPrayer) {
      setForcedCheckinPrayer(null);
      return true;
    }
    if (isPeriodicPopupOpen) {
      setIsPeriodicPopupOpen(false);
      return true;
    }
    if (isStandbyModeOpen) {
      standbyDismissedInLandscapeRef.current = true;
      setIsStandbyModeOpen(false);
      return true;
    }
    return false;
  }, [
    fullScreenAdhanState.isOpen,
    activeTab,
    isSettingsOpen,
    isBackgroundPickerOpen,
    isWidgetStudioOpen,
    isSteadfastnessOpen,
    isIstikharaHajahOpen,
    selectedWirdModal,
    forcedCheckinPrayer,
    isPeriodicPopupOpen,
    isStandbyModeOpen,
  ]);

  useTvRemoteNavigation({
    enabled: settings.tvRemoteFocusEnabled !== false,
    onBack: handleTvOrAndroidBack,
  });

  useEffect(() => {
    return subscribeNativeBackButton(handleTvOrAndroidBack);
  }, [handleTvOrAndroidBack]);

  // Auto-enter Ambient StandBy Mode on mobile landscape rotation if enabled
  useEffect(() => {
    if (!settings.ambientStandbyAutoLandscape) return;
    const handleOrientationCheck = () => {
      const isLandscape = window.innerWidth > window.innerHeight;
      const isCompactDevice = window.innerHeight <= 620 || ('ontouchstart' in window && window.innerWidth <= 1024);
      if (isLandscape && isCompactDevice) {
        if (!standbyDismissedInLandscapeRef.current) {
          setIsStandbyModeOpen(true);
        }
      } else {
        standbyDismissedInLandscapeRef.current = false;
      }
    };
    window.addEventListener('resize', handleOrientationCheck);
    window.addEventListener('orientationchange', handleOrientationCheck);
    return () => {
      window.removeEventListener('resize', handleOrientationCheck);
      window.removeEventListener('orientationchange', handleOrientationCheck);
    };
  }, [settings.ambientStandbyAutoLandscape]);

  // Recalculate prayer times when location or calculation method changes
  useEffect(() => {
    const times = calculatePrayerTimes(
      new Date(),
      currentLocation.lat,
      currentLocation.lng,
      currentLocation.timezone,
      settings.calculationMethod,
      settings.asrMethod
    );
    setBasePrayerTimes(times);
  }, [currentLocation, settings.calculationMethod, settings.asrMethod]);

  // Handle PWA Home Screen shortcut ?shortcut=wird on initial load & strip transient launch params
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const shortcut = params.get('shortcut');
    if (shortcut === 'wird') {
      const now = new Date();
      const nowMins = now.getHours() * 60 + now.getMinutes();
      const prayers: Array<{ key: KhatmaPrayerKey; label: string; time: string }> = [
        { key: 'fajr', label: 'الفجر', time: prayerTimes.fajr },
        { key: 'dhuhr', label: now.getDay() === 5 ? 'الجمعة' : 'الظهر', time: prayerTimes.dhuhr },
        { key: 'asr', label: 'العصر', time: prayerTimes.asr },
        { key: 'maghrib', label: 'المغرب', time: prayerTimes.maghrib },
        { key: 'isha', label: 'العشاء', time: prayerTimes.isha },
      ];
      let target = prayers[0];
      for (const p of prayers) {
        const [h, m] = p.time.split(':').map(Number);
        if ((h || 0) * 60 + (m || 0) > nowMins) {
          target = p;
          break;
        }
      }
      setSelectedWirdModal({ prayerKey: target.key, prayerNameAr: target.label });
    }

    const transientKeys = ['tab', 'mode', 'shortcut'];
    let mutated = false;
    transientKeys.forEach((k) => {
      if (params.has(k)) {
        params.delete(k);
        mutated = true;
      }
    });
    if (mutated) {
      try {
        const nextSearch = params.toString();
        const cleanUrl = window.location.pathname + (nextSearch ? `?${nextSearch}` : '') + window.location.hash;
        window.history.replaceState({}, document.title, cleanUrl);
      } catch {
        // ignore history errors
      }
    }
  }, []);

  // Native Android App Icon Shortcuts, Widget Launch & Alarm Notification Router
  useEffect(() => {
    const handleNativeShortcut = async () => {
      const action = await consumeNativeLaunchAction();
      if (!action) return;
      const { route, adhanPrayerKey, adhanPrayerName, periodicReminderId } = action;
      if (!route && !adhanPrayerKey && !periodicReminderId) return;

      setShowSplashOverlay(false);
      setIsSettingsOpen(false);
      setIsBackgroundPickerOpen(false);
      setIsWidgetStudioOpen(false);
      setIsStandbyModeOpen(false);
      setIsSteadfastnessOpen(false);
      setIsIstikharaHajahOpen(false);

      if (adhanPrayerKey) {
        const validKeys: PrayerName[] = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
        const safeKey = validKeys.includes(adhanPrayerKey as PrayerName)
          ? (adhanPrayerKey as PrayerName)
          : 'dhuhr';
        setActiveTab('times');
        handleOpenFullScreenAdhanModal(safeKey, adhanPrayerName || undefined, false);
        return;
      }

      if (periodicReminderId) {
        setActiveTab('times');
        setForcedPeriodicItemId(periodicReminderId);
        setIsPeriodicPopupOpen(true);
        return;
      }

      if (route === 'times') {
        setActiveTab('times');
      } else if (route === 'adhkar') {
        setActiveTab('adhkar');
      } else if (route === 'qibla') {
        setActiveTab('qibla');
      } else if (route === 'wird') {
        setActiveTab('times');
        const now = new Date();
        const nowMins = now.getHours() * 60 + now.getMinutes();
        const prayers: Array<{ key: KhatmaPrayerKey; label: string; time: string }> = [
          { key: 'fajr', label: 'الفجر', time: prayerTimes.fajr },
          { key: 'dhuhr', label: now.getDay() === 5 ? 'الجمعة' : 'الظهر', time: prayerTimes.dhuhr },
          { key: 'asr', label: 'العصر', time: prayerTimes.asr },
          { key: 'maghrib', label: 'المغرب', time: prayerTimes.maghrib },
          { key: 'isha', label: 'العشاء', time: prayerTimes.isha },
        ];
        let target = prayers[0];
        for (const p of prayers) {
          const [h, m] = p.time.split(':').map(Number);
          if ((h || 0) * 60 + (m || 0) > nowMins) {
            target = p;
            break;
          }
        }
        setSelectedWirdModal({ prayerKey: target.key, prayerNameAr: target.label });
      }
    };

    const onNativeAdhanTriggered = (evt: Event) => {
      const detail = (evt as CustomEvent<{ prayerKey?: PrayerName; prayerNameAr?: string }>).detail;
      if (detail?.prayerKey) {
        setShowSplashOverlay(false);
        handleOpenFullScreenAdhanModal(detail.prayerKey, detail.prayerNameAr, false);
      }
    };

    const reconcileNativeInteractiveState = async () => {
      const nativeState = await getNativeWidgetInteractiveState();
      if (!nativeState) return;
      const webTasbih = loadWidgetTasbihState();
      if (
        nativeState.tasbihDateKey &&
        nativeState.tasbihDateKey === webTasbih.dateKey &&
        nativeState.tasbihUpdatedAtMs > (webTasbih.updatedAtMs ?? 0)
      ) {
        saveWidgetTasbihState({
          ...webTasbih,
          count: Math.max(0, nativeState.tasbihCount),
          updatedAtMs: nativeState.tasbihUpdatedAtMs,
        });
      }
      if (nativeState.quietOverrideSet) {
        const webQuiet = loadQuietModeState();
        if (nativeState.quietUpdatedAtMs > (webQuiet.updatedAtMs ?? 0)) {
          saveQuietModeState({
            ...webQuiet,
            manualActive: nativeState.quietOverrideActive,
            pauseUntilMs: nativeState.quietOverrideActive ? webQuiet.pauseUntilMs : null,
            pauseLabelAr: nativeState.quietOverrideActive ? webQuiet.pauseLabelAr : null,
            updatedAtMs: nativeState.quietUpdatedAtMs,
          });
        }
      }
    };

    void handleNativeShortcut();
    void reconcileNativeInteractiveState();
    const unsubResume = subscribeNativeResume(() => {
      void handleNativeShortcut();
      void reconcileNativeInteractiveState();
    });
    const onShortcutEvent = () => {
      void handleNativeShortcut();
      void reconcileNativeInteractiveState();
    };
    window.addEventListener('mihrabNativeShortcutCheck', onShortcutEvent);
    window.addEventListener('mihrabNativeAdhanTriggered', onNativeAdhanTriggered);
    return () => {
      unsubResume();
      window.removeEventListener('mihrabNativeShortcutCheck', onShortcutEvent);
      window.removeEventListener('mihrabNativeAdhanTriggered', onNativeAdhanTriggered);
    };
  }, [prayerTimes, handleOpenFullScreenAdhanModal]);

  const nativeNotifPromptedRef = React.useRef(false);
  useEffect(() => {
    if (
      !isNativeAndroidApp() ||
      settings.notificationsEnabled === false ||
      nativeNotifPromptedRef.current
    ) {
      return;
    }
    nativeNotifPromptedRef.current = true;
    const timer = window.setTimeout(() => {
      void getNativeNotificationPermission().then((status) => {
        if (!status.requiresPrompt) return;
        void requestNativeNotificationPermission().then((res) => {
          if (res.granted) {
            syncWidgetDataBridge({
              prayerTimes,
              currentLocation,
              settings,
              widgetConfig,
            });
          }
        });
      });
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [settings.notificationsEnabled, prayerTimes, currentLocation, settings, widgetConfig]);

  // Widget Data Bridge: syncs unified JSON in localStorage & dispatches 'mihrabWidgetSync'
  useEffect(() => {
    if (!widgetConfig.autoSync && !isNativeAndroidApp()) return;
    const runBridgeSync = () => {
      syncWidgetDataBridge({
        prayerTimes,
        currentLocation,
        settings,
        widgetConfig,
      });
    };
    runBridgeSync();
    window.addEventListener('sunnah_rawatib_changed', runBridgeSync);
    window.addEventListener('fasting_intent_changed', runBridgeSync);
    window.addEventListener('post_prayer_checkin_changed', runBridgeSync);
    window.addEventListener(QUIET_MODE_UPDATED_EVENT, runBridgeSync);
    window.addEventListener(WIDGET_TASBIH_EVENT, runBridgeSync);
    return () => {
      window.removeEventListener('sunnah_rawatib_changed', runBridgeSync);
      window.removeEventListener('fasting_intent_changed', runBridgeSync);
      window.removeEventListener('post_prayer_checkin_changed', runBridgeSync);
      window.removeEventListener(QUIET_MODE_UPDATED_EVENT, runBridgeSync);
      window.removeEventListener(WIDGET_TASBIH_EVENT, runBridgeSync);
    };
  }, [prayerTimes, currentLocation, settings, khatmaState, widgetConfig]);

  // Keep Post-Prayer Check-in state synced across events, URL query actions, and Service Worker clicks
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const validKeys: CheckinPrayerKey[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
    const handleCheckinAction = (
      action: string,
      rawPrayer: string | null,
      rawDate?: string | null
    ) => {
      const prayerKey: CheckinPrayerKey =
        rawPrayer && validKeys.includes(rawPrayer as CheckinPrayerKey)
          ? (rawPrayer as CheckinPrayerKey)
          : 'dhuhr';
      const dateKey = rawDate || getTodayCheckinDateKey();
      const prayerNameAr = getCheckinPrayerNameAr(prayerKey);

      if (action === 'complete_all') {
        const updated = completePrayerFardAndAdhkar(prayerKey, dateKey);
        setCheckinState(updated);
        adhanPlayer.playChime();
      } else {
        setForcedCheckinPrayer({ prayerKey, prayerNameAr });
      }
    };

    const params = new URLSearchParams(window.location.search);
    const urlAction = params.get('checkin_action');
    if (urlAction) {
      handleCheckinAction(urlAction, params.get('prayer'), params.get('date'));
      params.delete('checkin_action');
      params.delete('prayer');
      params.delete('date');
      const cleanedSearch = params.toString();
      const newUrl =
        window.location.pathname + (cleanedSearch ? `?${cleanedSearch}` : '') + window.location.hash;
      window.history.replaceState({}, '', newUrl);
    }

    const onCheckinChanged = () => {
      setCheckinState(loadTodayCheckinState());
    };

    const onSunnahChanged = () => {
      setSunnahState(loadSunnahRawatibState());
    };

    const onSwMessage = (event: MessageEvent) => {
      const data = event.data;
      if (data && data.type === 'POST_PRAYER_ACTION') {
        handleCheckinAction(data.action, data.prayerKey, data.dateKey);
      }
    };

    window.addEventListener('post_prayer_checkin_changed', onCheckinChanged);
    window.addEventListener('sunnah_rawatib_changed', onSunnahChanged);
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', onSwMessage);
    }

    return () => {
      window.removeEventListener('post_prayer_checkin_changed', onCheckinChanged);
      window.removeEventListener('sunnah_rawatib_changed', onSunnahChanged);
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', onSwMessage);
      }
    };
  }, []);

  // Scheduled Interactive Post-Prayer Check-in Notification (default 20 min after Adhan)
  useEffect(() => {
    if (settings.postPrayerCheckinEnabled === false) return;

    const checkDueCheckin = () => {
      const now = new Date();
      if (shouldSuppressGeneralNotification(loadQuietModeState(), now)) return;
      const currentCheckin = loadTodayCheckinState();
      const delayMins = settings.postPrayerCheckinMinutes ?? 20;
      const due = getDuePostPrayerNotification(prayerTimes, delayMins, currentCheckin, now);
      if (due) {
        const updated = markPostPrayerNotified(due.prayerKey, due.dateKey);
        setCheckinState(updated);
        setActivePostPrayerToast(due);
        void backgroundService.sendPostPrayerCheckinNotification({
          prayerKey: due.prayerKey,
          prayerNameAr: due.prayerNameAr,
          dateKey: due.dateKey,
        });
      }
    };

    checkDueCheckin();
    const timer = window.setInterval(checkDueCheckin, 30_000);
    return () => window.clearInterval(timer);
  }, [prayerTimes, settings.postPrayerCheckinEnabled, settings.postPrayerCheckinMinutes]);

  const handleTriggerCompanionReminderTest = (kind: 'qada' | 'hifz') => {
    if (kind === 'qada') {
      const qState = loadQadaState();
      const analytics = computeQadaAnalytics(qState);
      const bodyAr =
        analytics.totalRemainingWithWitr > 0
          ? `متبقي ${toArabicDigits(analytics.totalRemainingWithWitr)} صلوات في خطتك — بادر بقضاء فرض الآن.`
          : 'تذكير يومي بمتابعة خطة قضاء الصلوات والصيام الفائت.';
      setActiveCompanionToast({
        kind: 'qada',
        titleAr: 'تذكير خطة قضاء الفوائت',
        bodyAr,
      });
      backgroundService.sendPrayerNotification('تذكير خطة قضاء الفوائت', bodyAr);
    } else {
      const hState = loadHifzState();
      const due = isHifzReminderDue(hState, new Date());
      const bodyAr = due
        ? due.summaryLabel
        : 'حان وقت ورد الحفظ والمراجعة اليومي لتثبيت محفوظاتك من القرآن الكريم.';
      setActiveCompanionToast({
        kind: 'hifz',
        titleAr: 'تذكير مراجعة الحفظ القرآني',
        bodyAr,
      });
      backgroundService.sendPrayerNotification('تذكير مراجعة الحفظ القرآني', bodyAr);
    }
  };

  // Scheduled Daily Qada & Hifz Revision Reminders
  useEffect(() => {
    const checkCompanionReminders = () => {
      const now = new Date();
      if (shouldSuppressGeneralNotification(loadQuietModeState(), now)) return;
      const qState = loadQadaState();
      if (isQadaReminderDue(qState, now)) {
        const analytics = computeQadaAnalytics(qState, now);
        const bodyAr =
          analytics.totalRemainingWithWitr > 0
            ? `متبقي ${toArabicDigits(analytics.totalRemainingWithWitr)} صلوات في خطتك — خصص بضع دقائق الآن لقضاء فرض.`
            : 'تذكير يومي بمتابعة خطة قضاء الصيام الفائت.';
        saveQadaState({ ...qState, lastRemindedDate: getTodayQadaDateKey(now) });
        setActiveCompanionToast({
          kind: 'qada',
          titleAr: 'تذكير قضاء الفوائت اليومي',
          bodyAr,
        });
        backgroundService.sendPrayerNotification('تذكير قضاء الفوائت اليومي', bodyAr);
      }

      const hState = loadHifzState();
      const dueHifz = isHifzReminderDue(hState, now);
      if (dueHifz) {
        saveHifzState({ ...hState, lastRemindedDate: getTodayHifzDateKey(now) });
        setActiveCompanionToast({
          kind: 'hifz',
          titleAr: 'موعد مراجعة الحفظ المستحقة',
          bodyAr: dueHifz.summaryLabel,
        });
        backgroundService.sendPrayerNotification('موعد مراجعة الحفظ المستحقة', dueHifz.summaryLabel);
      }
    };

    checkCompanionReminders();
    const timer = window.setInterval(checkCompanionReminders, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const handleToggleCheckinField = (
    prayerKey: CheckinPrayerKey,
    field: keyof PrayerCheckinItem,
    forceValue?: boolean
  ) => {
    const updated = toggleCheckinField(prayerKey, field, forceValue);
    setCheckinState(updated);
    if (field === 'wird') {
      const nextWirdVal = updated.prayers[prayerKey].wird;
      setKhatmaState((prev) =>
        prev.completedToday[prayerKey] === nextWirdVal
          ? prev
          : {
              ...prev,
              completedToday: {
                ...prev.completedToday,
                [prayerKey]: nextWirdVal,
              },
            }
      );
    }
  };

  const handleTogglePrayerSunnah = (prayerKey: KhatmaPrayerKey) => {
    adhanPlayer.playChime();
    const updated = togglePrayerSunnahCompleted(prayerKey);
    setSunnahState(updated);
  };

  const handleClosePostPrayerToast = useCallback(() => {
    setActivePostPrayerToast(null);
  }, []);

  const handleTestPostPrayerCheckin = () => {
    const target = getLatestPassedPrayer(prayerTimes, new Date());
    const dateKey = getTodayCheckinDateKey();
    setActivePostPrayerToast({
      prayerKey: target.prayerKey,
      prayerNameAr: target.prayerNameAr,
      dateKey,
      isTest: true,
    });
    void backgroundService.sendPostPrayerCheckinNotification({
      prayerKey: target.prayerKey,
      prayerNameAr: target.prayerNameAr,
      dateKey,
      isTest: true,
    });
  };

  // Periodic Verse & Hadith Popup scheduler (+ Night Quiet Hours + optional soft chime)
  useEffect(() => {
    if (!settings.periodicReminderEnabled) return;
    const intervalMs = (settings.periodicReminderInterval ?? 15) * 60 * 1000;
    const quietEnabled = settings.periodicQuietHoursEnabled ?? true;
    const quietStart = settings.periodicQuietStart || '23:00';
    const quietEnd = settings.periodicQuietEnd || '06:00';
    let timeoutId: number | null = null;
    let cancelled = false;

    const scheduleNext = () => {
      if (cancelled) return;
      const now = new Date();
      let targetMs = now.getTime() + intervalMs;
      if (quietEnabled && isWithinPeriodicQuietHours(new Date(targetMs), quietStart, quietEnd)) {
        targetMs = getNextTimeAfterPeriodicQuietHours(
          new Date(targetMs),
          quietStart,
          quietEnd
        ).getTime();
      }
      const delay = Math.max(5000, targetMs - now.getTime());

      timeoutId = window.setTimeout(() => {
        if (cancelled) return;
        const fireNow = new Date();
        if (
          (quietEnabled && isWithinPeriodicQuietHours(fireNow, quietStart, quietEnd)) ||
          shouldSuppressGeneralNotification(loadQuietModeState(), fireNow)
        ) {
          scheduleNext();
          return;
        }

        setForcedPeriodicItemId(null);
        setIsPeriodicPopupOpen(true);

        if (settings.periodicReminderSoundEnabled && !settings.meetingModeEnabled) {
          adhanPlayer.playPeriodicChime(settings.volume ?? 0.8);
        }

        if (
          !isNativeAndroidApp() &&
          typeof document !== 'undefined' &&
          document.hidden &&
          'Notification' in window &&
          Notification.permission === 'granted'
        ) {
          const picked = pickRandomReminder(settings.periodicReminderContentType || 'both');
          const notifTitle =
            picked.type === 'quran'
              ? '✦ آية قرآنية كريمة'
              : picked.type === 'wisdom'
              ? '✦ حكمة اليوم الدينية'
              : '✦ حديث نبوي شريف';
          try {
            new Notification(notifTitle, {
              body: `${picked.text}\n— ${picked.source}`,
              icon: '/pwa-192x192.png',
              dir: 'rtl',
              lang: 'ar',
            });
          } catch {
            // ignore browser notification restriction
          }
        }

        scheduleNext();
      }, delay);
    };

    scheduleNext();
    return () => {
      cancelled = true;
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [
    settings.periodicReminderEnabled,
    settings.periodicReminderInterval,
    settings.periodicReminderContentType,
    settings.periodicQuietHoursEnabled,
    settings.periodicQuietStart,
    settings.periodicQuietEnd,
    settings.periodicReminderSoundEnabled,
    settings.meetingModeEnabled,
    settings.volume,
  ]);

  // Periodic Salawat upon the Prophet (ﷺ) audio & notification scheduler (every N minutes)
  useEffect(() => {
    if (!settings.salawatEnabled || settings.meetingModeEnabled) return;
    const intervalMinutes = settings.salawatIntervalMinutes ?? 10;
    const intervalMs = Math.max(1, intervalMinutes) * 60 * 1000;
    let lastSalawatFiredAt = Date.now();

    const maybeTriggerSalawat = () => {
      const nowMs = Date.now();
      if (nowMs - lastSalawatFiredAt < intervalMs) return;
      if (shouldSuppressGeneralNotification(loadQuietModeState(), new Date(nowMs))) {
        lastSalawatFiredAt = nowMs;
        return;
      }

      const spokenProfile = adhanPlayer.playSalawat(settings.salawatVoiceMode || 'rotate', {
        isAutoTrigger: true,
      });
      if (spokenProfile) {
        lastSalawatFiredAt = nowMs;
        setActiveSalawatToast(spokenProfile);
        void backgroundService.sendSalawatNotification(
          spokenProfile.nameAr,
          spokenProfile.formulaAr,
          { isTest: false }
        );
      }
    };

    const timer = window.setInterval(maybeTriggerSalawat, Math.min(15000, intervalMs));
    const onVisibilityOrFocus = () => {
      if (typeof document !== 'undefined' && !document.hidden) {
        maybeTriggerSalawat();
      }
    };
    window.addEventListener('focus', onVisibilityOrFocus);
    document.addEventListener('visibilitychange', onVisibilityOrFocus);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', onVisibilityOrFocus);
      document.removeEventListener('visibilitychange', onVisibilityOrFocus);
    };
  }, [
    settings.salawatEnabled,
    settings.salawatIntervalMinutes,
    settings.salawatVoiceMode,
    settings.meetingModeEnabled,
  ]);

  // Global Last Third of the Night monitor (works regardless of active tab)
  useEffect(() => {
    if (settings.lastThirdNightEnabled === false) return;

    const checkGlobalLastThirdEntry = () => {
      const now = new Date();
      const nowMins = now.getHours() * 60 + now.getMinutes();
      const [fajrH, fajrM] = (prayerTimes.fajr || '05:00').split(':').map(Number);
      const todayFajrMins = (fajrH || 0) * 60 + (fajrM || 0);

      let nextFajrStr = prayerTimes.fajr;
      if (nowMins >= todayFajrMins) {
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const rawTomorrow = calculatePrayerTimes(
          tomorrow,
          currentLocation.lat,
          currentLocation.lng,
          currentLocation.timezone,
          settings.calculationMethod,
          settings.asrMethod
        );
        const adjTomorrow = applyPrayerTimeOffsets(rawTomorrow, settings.prayerOffsets);
        nextFajrStr = adjTomorrow.fajr;
      }

      const nightThirds = calculateNightThirds(
        prayerTimes.maghrib,
        nextFajrStr,
        now,
        settings.lastThirdNightMode || 'astronomical',
        settings.lastThirdNightCustomTime || '03:00',
        settings.lastThirdBeforeFajrMinutes || 30
      );

      if (!nightThirds.isLastThirdNow) return;
      const nightCycleKey = `${now.toDateString()}-${nextFajrStr}`;

      try {
        if (localStorage.getItem('last_third_auto_triggered_night_key') === nightCycleKey) {
          return;
        }
      } catch {
        // ignore storage errors
      }

      if (shouldSuppressGeneralNotification(loadQuietModeState(), now)) {
        return;
      }

      try {
        localStorage.setItem('last_third_auto_triggered_night_key', nightCycleKey);
      } catch {
        // ignore storage errors
      }

      const tonight = pickTonightQiyamSelection(nightCycleKey);
      const reciterInfo = QIYAM_RECITERS[tonight.reciterId];

      if (!settings.meetingModeEnabled) {
        void adhanPlayer
          .playQiyamRecitation(
            buildQiyamVerseAudioUrlSets(tonight.verse, tonight.reciterId),
            settings.volume ?? 0.85,
            undefined,
            tonight.verse.verse
          )
          .then((res) => {
            if (res !== 'playing' && settings.lastThirdFadeInAlarm !== false) {
              adhanPlayer.playGentleFadeInAlarm();
            }
          });
      }

      if (settings.notificationsEnabled !== false) {
        void backgroundService.sendLastThirdNotification({
          verseText: tonight.verse.verse,
          surah: tonight.verse.surah,
          reciterNameAr: reciterInfo.nameAr,
          fajrTime12: nextFajrStr,
          remainingToFajr: nightThirds.formattedRemainingToFajr,
        });
      }

      window.dispatchEvent(
        new CustomEvent('mihrab_global_last_third_entered', {
          detail: {
            nightCycleKey,
            verse: tonight.verse,
            reciterId: tonight.reciterId,
          },
        })
      );
    };

    checkGlobalLastThirdEntry();
    const timer = window.setInterval(checkGlobalLastThirdEntry, 5000);
    window.addEventListener('focus', checkGlobalLastThirdEntry);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', checkGlobalLastThirdEntry);
    };
  }, [
    prayerTimes.fajr,
    prayerTimes.maghrib,
    currentLocation.lat,
    currentLocation.lng,
    currentLocation.timezone,
    settings.calculationMethod,
    settings.asrMethod,
    settings.prayerOffsets,
    settings.lastThirdNightEnabled,
    settings.lastThirdNightMode,
    settings.lastThirdNightCustomTime,
    settings.lastThirdBeforeFajrMinutes,
    settings.lastThirdFadeInAlarm,
    settings.meetingModeEnabled,
    settings.notificationsEnabled,
    settings.volume,
  ]);

  // Auto-dismiss Salawat floating toast after 9 seconds
  useEffect(() => {
    if (!activeSalawatToast) return;
    const dismissTimer = window.setTimeout(() => {
      setActiveSalawatToast(null);
    }, 9000);
    return () => window.clearTimeout(dismissTimer);
  }, [activeSalawatToast]);

  // Auto-dismiss Pre-Adhan Sheikh Alert toast after 11 seconds
  useEffect(() => {
    if (!activePreAdhanToast) return;
    const dismissTimer = window.setTimeout(() => {
      setActivePreAdhanToast(null);
    }, 11000);
    return () => window.clearTimeout(dismissTimer);
  }, [activePreAdhanToast]);

  // Auto-dismiss Iqama Sheikh Alert toast after 20 seconds
  useEffect(() => {
    if (!activeIqamaToast) return;
    const dismissTimer = window.setTimeout(() => {
      setActiveIqamaToast(null);
    }, 20000);
    return () => window.clearTimeout(dismissTimer);
  }, [activeIqamaToast]);

  const handleTestSalawat = (voiceMode?: string) => {
    const profile = adhanPlayer.playSalawat(voiceMode || settings.salawatVoiceMode || 'rotate', {
      isAutoTrigger: false,
    });
    if (profile) {
      setActiveSalawatToast(profile);
      void backgroundService.sendSalawatNotification(profile.nameAr, profile.formulaAr, {
        isTest: true,
        requestPermissionOnTest: true,
      });
    }
  };

  const handleTestPreAdhan = (
    voiceMode?: string,
    prayerNameAr?: string,
    isAutoTrigger: boolean = false
  ): PreAdhanVoiceProfile | null => {
    const profile = adhanPlayer.playPreAdhanReminderSound(
      voiceMode || settings.preAdhanVoiceMode || 'rotate',
      { isAutoTrigger }
    );
    if (profile) {
      setActivePreAdhanToast({ profile, prayerNameAr });
      if (!isAutoTrigger) {
        const nextPrayerInfo = getNextPrayerInfo(prayerTimes);
        void backgroundService.sendPreAdhanNotification({
          prayerKey: nextPrayerInfo.key,
          prayerNameAr: prayerNameAr || nextPrayerInfo.nameAr,
          reminderMinutes: settings.preAdhanReminderMinutes || 10,
          cityNameAr: currentLocation.nameAr,
          sheikhNameAr: profile.nameAr,
          mosqueTheme: settings.notificationMosqueTheme || 'auto',
          isTest: true,
          requestPermissionOnTest: true,
        });
      }
    }
    return profile;
  };

  const handleTestIqama = useCallback((
    voiceMode?: string,
    prayerNameAr?: string,
    isAutoTrigger: boolean = false
  ): IqamaVoiceProfile | null => {
    const profile = adhanPlayer.playIqamaSound(
      voiceMode || settings.iqamaVoiceMode || 'rotate',
      { isAutoTrigger }
    );
    if (profile) {
      setActiveIqamaToast({ profile, prayerNameAr });
    }
    return profile;
  }, [settings.iqamaVoiceMode]);

  // Global Always-On Precision Prayer Scheduler (Adhan, Pre-Adhan, Iqama, Post-Prayer)
  // Runs continuously regardless of active tab, open modal, or standalone widget mode.
  const globalPrayerSchedulerRef = React.useRef<(now: Date) => void>(() => {});
  globalPrayerSchedulerRef.current = (now: Date) => {
    const jumuahPreview =
      typeof window !== 'undefined' && localStorage.getItem('jumuah_preview_mode') === 'true';
    const dueEvents = evaluateDuePrayerEvents({
      now,
      prayerTimes,
      settings,
      appMountedAtMs: appMountedAtRef.current,
      jumuahPreviewMode: jumuahPreview,
    });

    for (const evt of dueEvents) {
      markSchedulerFired(evt.dedupKey);

      if (evt.type === 'adhan') {
        if (settings.meetingModeEnabled) {
          adhanPlayer.stop();
          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate([300, 150, 300]);
          }
          setGlobalSilentMeetingAlert({
            prayerNameAr: evt.prayerNameAr,
            timeStr: evt.adhanTimeStr,
          });
          if (!isNativeAndroidApp() && settings.adhanBannerNotificationEnabled !== false) {
            backgroundService.sendPrayerNotification(
              `تنبيه صامت · حان وقت صلاة ${evt.prayerNameAr}`,
              `${currentLocation.nameAr} • وضع الاجتماع نشط (اهتزاز هادئ)`,
              settings.notificationMosqueTheme || 'auto',
              evt.prayerKey
            );
          }
        } else {
          handleOpenFullScreenAdhanModal(evt.prayerKey, evt.prayerNameAr, false);
        }
      } else if (evt.type === 'pre_adhan') {
        const reminderWindow = settings.preAdhanReminderMinutes || 10;
        let spokenProfile: PreAdhanVoiceProfile | null = null;
        if (settings.meetingModeEnabled) {
          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate([250, 120, 250]);
          }
          spokenProfile = adhanPlayer.selectPreAdhanVoice(settings.preAdhanVoiceMode || 'rotate');
          setActivePreAdhanToast({ profile: spokenProfile, prayerNameAr: evt.prayerNameAr });
        } else if (settings.preAdhanSoundEnabled !== false) {
          spokenProfile = handleTestPreAdhan(undefined, evt.prayerNameAr, true);
          if (!spokenProfile) {
            spokenProfile = adhanPlayer.selectPreAdhanVoice(settings.preAdhanVoiceMode || 'rotate');
            setActivePreAdhanToast({ profile: spokenProfile, prayerNameAr: evt.prayerNameAr });
          }
        } else {
          spokenProfile = adhanPlayer.selectPreAdhanVoice(settings.preAdhanVoiceMode || 'rotate');
          setActivePreAdhanToast({ profile: spokenProfile, prayerNameAr: evt.prayerNameAr });
        }

        if (settings.notificationsEnabled !== false) {
          void backgroundService.sendPreAdhanNotification({
            prayerKey: evt.prayerKey,
            prayerNameAr: evt.prayerNameAr,
            reminderMinutes: reminderWindow,
            cityNameAr: currentLocation.nameAr,
            sheikhNameAr: spokenProfile?.nameAr,
            mosqueTheme: settings.notificationMosqueTheme || 'auto',
            isMeetingMode: Boolean(settings.meetingModeEnabled),
            isTest: false,
          });
        }
      } else if (evt.type === 'iqama') {
        if (settings.meetingModeEnabled) {
          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate([300, 150, 300]);
          }
        } else if (settings.iqamaAutoPlayEnabled !== false) {
          handleTestIqama(undefined, evt.prayerNameAr, true);
        }
        if (settings.notificationsEnabled !== false) {
          backgroundService.sendPrayerNotification(
            `قد قامت الصلاة · إقامة صلاة ${evt.prayerNameAr}`,
            `${currentLocation.nameAr} • حان وقت إقامة الصلاة الآن`,
            settings.notificationMosqueTheme || 'auto',
            evt.prayerKey
          );
        }
      } else if (evt.type === 'post10') {
        setGlobalPostPrayerModal({
          isOpen: true,
          prayerNameAr: evt.prayerNameAr,
        });
      }
    }
  };

  useEffect(() => {
    return createPrecisionClockTicker((now) => {
      globalPrayerSchedulerRef.current(now);
    });
  }, []);

  const handleUpdateSettings = (newSettings: Partial<UserSettings>) => {
    if (newSettings.autoThemeEnabled) {
      setAutoThemeManualPause(false);
      setAutoThemeOverrideNotice(null);
    }
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      if (newSettings.iqamaMinutes) {
        localStorage.setItem('iqama_minutes_map', JSON.stringify(newSettings.iqamaMinutes));
      }
      if (typeof newSettings.iqamaAutoPlayEnabled === 'boolean') {
        localStorage.setItem('iqama_autoplay_enabled', String(newSettings.iqamaAutoPlayEnabled));
      }
      if (newSettings.iqamaVoiceMode) {
        localStorage.setItem('iqama_voice_mode', newSettings.iqamaVoiceMode);
      }
      if (newSettings.iqamaStyle) {
        localStorage.setItem('iqama_style_preference', newSettings.iqamaStyle);
      }
      if (newSettings.adhanModalLayout) {
        localStorage.setItem('adhan_modal_layout', newSettings.adhanModalLayout);
      }
      if (newSettings.adhanCountdownStyle) {
        localStorage.setItem('adhan_countdown_islamic_style', newSettings.adhanCountdownStyle);
      }
      if (typeof newSettings.adhanBackgroundAutoRotate === 'boolean') {
        localStorage.setItem('adhan_bg_auto_rotate', String(newSettings.adhanBackgroundAutoRotate));
      }
      if (newSettings.adhanBackgroundMotionStyle) {
        localStorage.setItem('adhan_bg_motion_style', newSettings.adhanBackgroundMotionStyle);
      }
      if (Array.isArray(newSettings.adhanEnabledMosques) && newSettings.adhanEnabledMosques.length > 0) {
        localStorage.setItem('adhan_enabled_mosques', JSON.stringify(newSettings.adhanEnabledMosques));
      }
      if (typeof newSettings.periodicReminderEnabled === 'boolean') {
        localStorage.setItem('periodic_reminder_enabled', String(newSettings.periodicReminderEnabled));
      }
      if (newSettings.periodicReminderInterval) {
        localStorage.setItem('periodic_reminder_interval', String(newSettings.periodicReminderInterval));
      }
      if (newSettings.periodicReminderContentType) {
        localStorage.setItem('periodic_reminder_content_type', newSettings.periodicReminderContentType);
      }
      if (typeof newSettings.periodicOverlayEnabled === 'boolean') {
        localStorage.setItem('periodic_overlay_enabled', String(newSettings.periodicOverlayEnabled));
      }
      if (typeof newSettings.periodicQuietHoursEnabled === 'boolean') {
        localStorage.setItem('periodic_quiet_hours_enabled', String(newSettings.periodicQuietHoursEnabled));
      }
      if (newSettings.periodicQuietStart) {
        localStorage.setItem('periodic_quiet_start', newSettings.periodicQuietStart);
      }
      if (newSettings.periodicQuietEnd) {
        localStorage.setItem('periodic_quiet_end', newSettings.periodicQuietEnd);
      }
      if (typeof newSettings.periodicReminderSoundEnabled === 'boolean') {
        localStorage.setItem('periodic_reminder_sound_enabled', String(newSettings.periodicReminderSoundEnabled));
      }
      if (typeof newSettings.salawatEnabled === 'boolean') {
        localStorage.setItem('salawat_enabled', String(newSettings.salawatEnabled));
      }
      if (newSettings.salawatIntervalMinutes) {
        localStorage.setItem('salawat_interval_minutes', String(newSettings.salawatIntervalMinutes));
      }
      if (newSettings.salawatVoiceMode) {
        localStorage.setItem('salawat_voice_mode', newSettings.salawatVoiceMode);
      }
      if (typeof newSettings.preAdhanReminderMinutes === 'number') {
        localStorage.setItem('pre_adhan_reminder_minutes', String(newSettings.preAdhanReminderMinutes));
      }
      if (typeof newSettings.preAdhanSoundEnabled === 'boolean') {
        localStorage.setItem('pre_adhan_sound_enabled', String(newSettings.preAdhanSoundEnabled));
      }
      if (newSettings.preAdhanVoiceMode) {
        localStorage.setItem('pre_adhan_voice_mode', newSettings.preAdhanVoiceMode);
      }
      if (typeof newSettings.autoDuaAfterAdhan === 'boolean') {
        localStorage.setItem('auto_dua_after_adhan', String(newSettings.autoDuaAfterAdhan));
      }
      if (newSettings.duaAudioReciter) {
        localStorage.setItem('dua_audio_reciter', getDuaSource(newSettings.duaAudioReciter).id);
      }
      if (newSettings.morningAdhkarTime) {
        localStorage.setItem('morning_adhkar_time', newSettings.morningAdhkarTime);
      }
      if (newSettings.eveningAdhkarTime) {
        localStorage.setItem('evening_adhkar_time', newSettings.eveningAdhkarTime);
      }
      if (typeof newSettings.morningAdhkarEnabled === 'boolean') {
        localStorage.setItem('morning_adhkar_enabled', String(newSettings.morningAdhkarEnabled));
      }
      if (typeof newSettings.eveningAdhkarEnabled === 'boolean') {
        localStorage.setItem('evening_adhkar_enabled', String(newSettings.eveningAdhkarEnabled));
      }
      if (typeof newSettings.adhkarAutoPlayAudio === 'boolean') {
        localStorage.setItem('adhkar_auto_play_audio', String(newSettings.adhkarAutoPlayAudio));
      }
      if (newSettings.adhkarReciter) {
        localStorage.setItem('adhkar_reciter', newSettings.adhkarReciter);
      }
      if (newSettings.morningAdhkarReciter) {
        localStorage.setItem('morning_adhkar_reciter', newSettings.morningAdhkarReciter);
      }
      if (newSettings.eveningAdhkarReciter) {
        localStorage.setItem('evening_adhkar_reciter', newSettings.eveningAdhkarReciter);
      }
      if (newSettings.adhkarShortSheikh) {
        localStorage.setItem('adhkar_short_sheikh', newSettings.adhkarShortSheikh);
      }
      if (newSettings.theme) {
        saveThemePreference(normalizeThemeId(newSettings.theme));
      }
      if (typeof newSettings.lastThirdNightEnabled === 'boolean') {
        localStorage.setItem('last_third_night_enabled', String(newSettings.lastThirdNightEnabled));
      }
      if (newSettings.lastThirdNightMode) {
        localStorage.setItem('last_third_night_mode', newSettings.lastThirdNightMode);
      }
      if (newSettings.lastThirdBeforeFajrMinutes) {
        localStorage.setItem('last_third_before_fajr_minutes', String(newSettings.lastThirdBeforeFajrMinutes));
      }
      if (newSettings.lastThirdNightCustomTime) {
        localStorage.setItem('last_third_night_custom_time', newSettings.lastThirdNightCustomTime);
      }
      if (newSettings.lastThirdNightTheme) {
        localStorage.setItem('last_third_night_theme', newSettings.lastThirdNightTheme);
      }
      if (typeof newSettings.lastThirdAutoOpen === 'boolean') {
        localStorage.setItem('last_third_auto_open', String(newSettings.lastThirdAutoOpen));
      }
      if (typeof newSettings.lastThirdFadeInAlarm === 'boolean') {
        localStorage.setItem('last_third_fade_in_alarm', String(newSettings.lastThirdFadeInAlarm));
      }
      if (typeof newSettings.lastThirdAutoOpenAdhkar === 'boolean') {
        localStorage.setItem('last_third_auto_open_adhkar', String(newSettings.lastThirdAutoOpenAdhkar));
      }
      if (typeof newSettings.witrReminderEnabled === 'boolean') {
        localStorage.setItem('witr_reminder_enabled', String(newSettings.witrReminderEnabled));
      }
      if (newSettings.witrReminderMinutes) {
        localStorage.setItem('witr_reminder_minutes', String(newSettings.witrReminderMinutes));
      }
      if (typeof newSettings.suhoorReminderEnabled === 'boolean') {
        localStorage.setItem('suhoor_reminder_enabled', String(newSettings.suhoorReminderEnabled));
      }
      if (newSettings.suhoorReminderMinutes) {
        localStorage.setItem('suhoor_reminder_minutes', String(newSettings.suhoorReminderMinutes));
      }
      if (typeof newSettings.meetingModeEnabled === 'boolean') {
        localStorage.setItem('meeting_mode_enabled', String(newSettings.meetingModeEnabled));
      }
      if (typeof newSettings.autoThemeEnabled === 'boolean') {
        localStorage.setItem(AUTO_THEME_STORAGE_KEYS.enabled, String(newSettings.autoThemeEnabled));
      }
      if (newSettings.autoThemeDayId) {
        localStorage.setItem(AUTO_THEME_STORAGE_KEYS.dayThemeId, newSettings.autoThemeDayId);
      }
      if (newSettings.autoThemeNightId) {
        localStorage.setItem(AUTO_THEME_STORAGE_KEYS.nightThemeId, newSettings.autoThemeNightId);
      }
      if (newSettings.autoThemeMode) {
        localStorage.setItem(AUTO_THEME_STORAGE_KEYS.mode, newSettings.autoThemeMode);
      }
      if (newSettings.autoThemeCustomDayTime) {
        localStorage.setItem(AUTO_THEME_STORAGE_KEYS.customDayTime, newSettings.autoThemeCustomDayTime);
      }
      if (newSettings.autoThemeCustomNightTime) {
        localStorage.setItem(AUTO_THEME_STORAGE_KEYS.customNightTime, newSettings.autoThemeCustomNightTime);
      }
      if (
        typeof newSettings.fastingWhiteDaysEnabled === 'boolean' ||
        typeof newSettings.fastingMonThuEnabled === 'boolean' ||
        typeof newSettings.fastingAshuraArafahEnabled === 'boolean' ||
        typeof newSettings.showFastingStatsInRecord === 'boolean'
      ) {
        saveFastingPreferences({
          whiteDaysEnabled: newSettings.fastingWhiteDaysEnabled,
          monThuEnabled: newSettings.fastingMonThuEnabled,
          ashuraArafahEnabled: newSettings.fastingAshuraArafahEnabled,
          showFastingStatsInRecord: newSettings.showFastingStatsInRecord,
        });
      }
      if (typeof newSettings.ambientStandbyAutoLandscape === 'boolean') {
        localStorage.setItem('ambient_standby_auto_landscape', String(newSettings.ambientStandbyAutoLandscape));
      }
      if (typeof newSettings.travelModeEnabled === 'boolean') {
        localStorage.setItem('travel_mode_enabled', String(newSettings.travelModeEnabled));
      }
      if (typeof newSettings.travelDistanceKm === 'number') {
        localStorage.setItem('travel_distance_km', String(newSettings.travelDistanceKm));
      }
      if (newSettings.travelJamType) {
        localStorage.setItem('travel_jam_type', newSettings.travelJamType);
      }
      if (typeof newSettings.postPrayerCheckinEnabled === 'boolean') {
        localStorage.setItem('post_prayer_checkin_enabled', String(newSettings.postPrayerCheckinEnabled));
      }
      if (
        newSettings.postPrayerCheckinMinutes === 15 ||
        newSettings.postPrayerCheckinMinutes === 20 ||
        newSettings.postPrayerCheckinMinutes === 30
      ) {
        localStorage.setItem('post_prayer_checkin_minutes', String(newSettings.postPrayerCheckinMinutes));
      }
      if (typeof newSettings.postPrayerIncludeWird === 'boolean') {
        localStorage.setItem('post_prayer_include_wird', String(newSettings.postPrayerIncludeWird));
      }
      if (typeof newSettings.postPrayerIncludeAdhkar === 'boolean') {
        localStorage.setItem('post_prayer_include_adhkar', String(newSettings.postPrayerIncludeAdhkar));
      }
      if (typeof newSettings.postPrayerIncludeSunnah === 'boolean') {
        localStorage.setItem('post_prayer_include_sunnah', String(newSettings.postPrayerIncludeSunnah));
      }
      if (typeof newSettings.tvRemoteFocusEnabled === 'boolean') {
        localStorage.setItem('tv_remote_focus_enabled', String(newSettings.tvRemoteFocusEnabled));
      }
      if (typeof newSettings.keepScreenAwakeAlways === 'boolean') {
        localStorage.setItem('keep_screen_awake_always', String(newSettings.keepScreenAwakeAlways));
      }
      if (typeof newSettings.autoEnterTvDisplay === 'boolean') {
        localStorage.setItem('auto_enter_tv_display', String(newSettings.autoEnterTvDisplay));
      }
      if (typeof newSettings.remoteApiBaseUrl === 'string') {
        const cleanApi = newSettings.remoteApiBaseUrl.trim().replace(/\/+$/, '');
        if (cleanApi) {
          localStorage.setItem('remote_api_base_url', cleanApi);
        } else {
          localStorage.removeItem('remote_api_base_url');
        }
      }
      if (typeof newSettings.stickyNotificationEnabled === 'boolean') {
        localStorage.setItem(
          'sticky_notification_enabled',
          String(newSettings.stickyNotificationEnabled)
        );
      }
      if (typeof newSettings.adhanBannerNotificationEnabled === 'boolean') {
        localStorage.setItem(
          'adhan_banner_notification_enabled',
          String(newSettings.adhanBannerNotificationEnabled)
        );
      }
      if (
        newSettings.notificationMosqueTheme === 'auto' ||
        newSettings.notificationMosqueTheme === 'nabawi' ||
        newSettings.notificationMosqueTheme === 'kaaba' ||
        newSettings.notificationMosqueTheme === 'azhar'
      ) {
        localStorage.setItem('notification_mosque_theme', newSettings.notificationMosqueTheme);
      }
      if (newSettings.prayerOffsets) {
        localStorage.setItem('mihrab_prayer_offsets', JSON.stringify(newSettings.prayerOffsets));
      }
      if (newSettings.prayerAdhanEnabled) {
        localStorage.setItem('mihrab_prayer_adhan_enabled', JSON.stringify(newSettings.prayerAdhanEnabled));
      }
      if (newSettings.prayerReciters) {
        localStorage.setItem('mihrab_prayer_reciters', JSON.stringify(newSettings.prayerReciters));
      }
      if (typeof newSettings.sunriseReminderEnabled === 'boolean') {
        localStorage.setItem(
          'mihrab_sunrise_reminder_enabled',
          String(newSettings.sunriseReminderEnabled)
        );
      }
      if (typeof newSettings.duhaReminderEnabled === 'boolean') {
        localStorage.setItem(
          'mihrab_duha_reminder_enabled',
          String(newSettings.duhaReminderEnabled)
        );
      }
      if (
        newSettings.duhaReminderTiming === 'ishraq' ||
        newSettings.duhaReminderTiming === 'peak' ||
        newSettings.duhaReminderTiming === 'both'
      ) {
        localStorage.setItem('mihrab_duha_reminder_timing', newSettings.duhaReminderTiming);
      }
      if (typeof newSettings.duhaReminderSoundEnabled === 'boolean') {
        localStorage.setItem(
          'mihrab_duha_reminder_sound',
          String(newSettings.duhaReminderSoundEnabled)
        );
      }
      return updated;
    });
  };

  const handleSelectCity = (city: CityLocation) => {
    setCurrentLocation(city);
    handleUpdateSettings({ cityId: city.id });
  };

  // Automatically determine if current time is daytime or nighttime
  const isDaytime = isCurrentTimeDay(prayerTimes);

  // Find currently active background (smartly switches day/night mosque automatically)
  const currentBg = getSmartBackground(
    settings.activeBackgroundId,
    settings.autoDayNightBackground ?? true,
    isDaytime
  );

  // Standalone Live Widget Mode (?widget=true)
  if (standaloneWidgetConfig) {
    const isParchmentStandalone = standaloneWidgetConfig.theme === 'parchment';
    return (
      <div
        dir="rtl"
        className={`min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 gap-5 transition-colors ${
          isParchmentStandalone ? 'bg-[#F5EBD0]' : 'bg-[#050807]'
        }`}
        style={{
          backgroundImage:
            standaloneWidgetConfig.theme === 'glass'
              ? 'radial-gradient(circle at 30% 25%, rgba(16,185,129,0.28), transparent 55%), radial-gradient(circle at 75% 75%, rgba(212,175,55,0.22), transparent 55%)'
              : standaloneWidgetConfig.theme === 'royal_gold'
                ? 'radial-gradient(circle at 50% 20%, rgba(246,216,132,0.16), transparent 60%)'
                : undefined,
        }}
      >
        <div className="w-full max-w-md space-y-4">
          <PrayerWidgetPreview
            config={standaloneWidgetConfig}
            prayerTimes={prayerTimes}
            currentLocation={currentLocation}
            settings={settings}
            onNavigateShortcut={(target) => {
              setStandaloneWidgetConfig(null);
              if (typeof window !== 'undefined') {
                window.history.replaceState({}, '', '/');
              }
              if (target === 'standby') {
                setIsStandbyModeOpen(true);
              } else {
                setActiveTab(target);
              }
            }}
          />

          <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
            {WIDGET_SIZES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  const next = { ...standaloneWidgetConfig, size: s.id };
                  setStandaloneWidgetConfig(next);
                  saveWidgetConfig(next);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                  standaloneWidgetConfig.size === s.id
                    ? 'bg-[#D4AF37] text-slate-950 border-[#D4AF37]'
                    : 'bg-[#111C18] text-slate-300 border-[#D4AF37]/30'
                }`}
              >
                {s.badgeAr}
              </button>
            ))}
            {WIDGET_THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  const next = { ...standaloneWidgetConfig, theme: t.id };
                  setStandaloneWidgetConfig(next);
                  saveWidgetConfig(next);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                  standaloneWidgetConfig.theme === t.id
                    ? 'bg-[#10B981] text-slate-950 border-[#10B981]'
                    : 'bg-[#111C18] text-slate-300 border-[#D4AF37]/30'
                }`}
              >
                {t.nameAr}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => {
                setStandaloneWidgetConfig(null);
                if (typeof window !== 'undefined') {
                  window.history.replaceState({}, '', '/');
                }
              }}
              className="px-4 py-2 rounded-xl bg-[#111C18] border border-[#D4AF37]/45 hover:border-[#F3CA63] text-[#F3CA63] text-xs font-bold transition-all"
            >
              العودة إلى التطبيق الكامل
            </button>
          </div>
        </div>

        <FullScreenAdhanModal
          isOpen={fullScreenAdhanState.isOpen}
          onClose={() => setFullScreenAdhanState((prev) => ({ ...prev, isOpen: false }))}
          prayerKey={fullScreenAdhanState.prayerKey}
          prayerNameAr={fullScreenAdhanState.prayerNameAr}
          currentLocation={currentLocation}
          settings={settings}
          isSimulation={fullScreenAdhanState.isSimulation}
        />

        {activePreAdhanToast && (
          <div
            className="fixed bottom-5 right-5 z-[60] max-w-sm w-[calc(100vw-2.5rem)] rounded-2xl bg-gradient-to-br from-[#062f26]/95 via-[#031b16]/98 to-[#02120e]/98 border-2 border-[#e5b869]/60 shadow-[0_14px_40px_rgba(0,0,0,0.6),0_0_28px_rgba(229,184,105,0.22)] p-4 text-right backdrop-blur-xl"
            dir="rtl"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className="text-xs font-bold text-[#fbbf24]">
                {activePreAdhanToast.prayerNameAr
                  ? `تنبيه الاستعداد لصلاة ${activePreAdhanToast.prayerNameAr}`
                  : 'تنبيه الاستعداد للوضوء والصلاة'}
              </span>
              <button
                type="button"
                onClick={() => {
                  adhanPlayer.stop();
                  setActivePreAdhanToast(null);
                }}
                className="text-slate-400 hover:text-[#fbbf24] text-xs px-1.5 py-0.5 rounded-lg"
                aria-label="إغلاق"
              >
                ✕
              </button>
            </div>
            <p className="font-amiri text-base text-white leading-relaxed mb-2">
              {activePreAdhanToast.profile.verseAr}
            </p>
            <div className="text-[11px] font-bold text-emerald-300">
              {activePreAdhanToast.profile.nameAr}
            </div>
          </div>
        )}

        {activeIqamaToast && (
          <div
            className="fixed bottom-5 right-5 z-[65] max-w-sm w-[calc(100vw-2.5rem)] rounded-2xl bg-gradient-to-br from-[#062f26]/95 via-[#031b16]/98 to-[#02120e]/98 border-2 border-[#fbbf24]/75 shadow-[0_14px_40px_rgba(0,0,0,0.65),0_0_32px_rgba(251,191,36,0.28)] p-4 text-right backdrop-blur-xl"
            dir="rtl"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className="text-sm font-bold text-[#fbbf24] font-amiri">
                {activeIqamaToast.prayerNameAr
                  ? `قد قامت الصلاة · إقامة صلاة ${activeIqamaToast.prayerNameAr}`
                  : 'قد قامت الصلاة · إقامة الصلاة'}
              </span>
              <button
                type="button"
                onClick={() => {
                  adhanPlayer.stop();
                  setActiveIqamaToast(null);
                }}
                className="text-slate-400 hover:text-[#fbbf24] text-xs px-1.5 py-0.5 rounded-lg"
                aria-label="إغلاق"
              >
                ✕
              </button>
            </div>
            <p className="font-amiri text-base text-white leading-relaxed mb-2">
              حيّ على الصلاة · حيّ على الفلاح · قد قامت الصلاة قد قامت الصلاة
            </p>
            <div className="text-[11px] font-bold text-emerald-300">
              {activeIqamaToast.profile.nameAr}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative min-h-screen theme-app-shell flex flex-col font-sans selection:bg-emerald-600 selection:text-white overflow-x-hidden">
      {/* Dynamic Background Layer (Live Video or HD Image over Royal Emerald Sanctuary) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {currentBg.type === 'video' && currentBg.videoUrl ? (
          <video
            key={currentBg.id}
            autoPlay
            loop
            muted
            playsInline
            poster={currentBg.imageUrl}
            style={{
              opacity: ((settings.backgroundOpacity ?? 65) / 100) * (activeThemeId === 'parchment' ? 0.14 : 0.55),
              filter: `blur(${settings.backgroundBlur ?? 0}px)`,
            }}
            className="w-full h-full object-cover transform scale-105 transition-all duration-300"
          >
            <source src={currentBg.videoUrl} type="video/mp4" />
          </video>
        ) : (
          <div
            className="w-full h-full bg-cover bg-center transition-all duration-300"
            style={{
              backgroundImage: currentBg.imageUrl ? `url('${currentBg.imageUrl}')` : undefined,
              opacity: ((settings.backgroundOpacity ?? 65) / 100) * (activeThemeId === 'parchment' ? 0.14 : 0.5),
              filter: `blur(${settings.backgroundBlur ?? 0}px)`,
            }}
          />
        )}

        {/* Dynamic Theme Ambient Gradient Wash */}
        <div
          className="absolute inset-0 transition-opacity duration-300"
          style={{
            background: 'var(--theme-wash)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'var(--theme-radial-glow)' }}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'var(--theme-bottom-fade)' }}
        />

        {/* Subtle Islamic Geometric Pattern SVG Overlay (opacity 0.045) */}
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.045]"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <pattern
              id="islamic-geometric-sanctuary"
              width="96"
              height="96"
              patternUnits="userSpaceOnUse"
            >
              {/* 8-Pointed Rub el Hizb Star */}
              <rect
                x="28"
                y="28"
                width="40"
                height="40"
                fill="none"
                stroke="#e5b869"
                strokeWidth="1.2"
              />
              <rect
                x="28"
                y="28"
                width="40"
                height="40"
                fill="none"
                stroke="#e5b869"
                strokeWidth="1.2"
                transform="rotate(45 48 48)"
              />
              {/* Inner Octagon & Crosshair Lattice */}
              <circle cx="48" cy="48" r="10" fill="none" stroke="#fbbf24" strokeWidth="0.9" />
              <path
                d="M0 48 H20 M76 48 H96 M48 0 V20 M48 76 V96"
                stroke="#e5b869"
                strokeWidth="0.8"
              />
              <path
                d="M0 0 L28 28 M96 0 L68 28 M0 96 L28 68 M96 96 L68 68"
                stroke="#e5b869"
                strokeWidth="0.7"
              />
              {/* Corner Diamonds */}
              <polygon
                points="0,-8 8,0 0,8 -8,0"
                fill="none"
                stroke="#e5b869"
                strokeWidth="0.9"
              />
              <polygon
                points="96,-8 104,0 96,8 88,0"
                fill="none"
                stroke="#e5b869"
                strokeWidth="0.9"
              />
              <polygon
                points="0,88 8,96 0,104 -8,96"
                fill="none"
                stroke="#e5b869"
                strokeWidth="0.9"
              />
              <polygon
                points="96,88 104,96 96,104 88,96"
                fill="none"
                stroke="#e5b869"
                strokeWidth="0.9"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#islamic-geometric-sanctuary)" />
        </svg>
      </div>

      {/* Content Container above background */}
      <div className="relative z-10 flex flex-col flex-1">
        {/* Navbar */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          currentLocation={currentLocation}
          settings={settings}
          autoThemeStatusBadge={
            settings.autoThemeEnabled && !autoThemeManualPause
              ? autoThemeEvaluation.statusBadgeAr
              : undefined
          }
          onOpenSettings={() => openSettingsOnTab('general')}
          onOpenIqamaTab={() => openSettingsOnTab('iqama')}
          onOpenBackgroundPicker={() => setIsBackgroundPickerOpen(true)}
          onCycleTheme={handleCycleTheme}
          khatmaState={khatmaState}
          khatmaSchedule={khatmaSchedule}
          onSwitchKhatmaPlan={handleSwitchKhatmaPlan}
          onTogglePrayerWird={handleTogglePrayerWird}
          onStartNewKhatma={handleStartNewKhatma}
          onOpenWirdModal={(prayerKey, prayerNameAr) => setSelectedWirdModal({ prayerKey, prayerNameAr })}
          onOpenSteadfastness={() => setIsSteadfastnessOpen(true)}
          onOpenStandbyMode={() => {
            setDisplayInitialMode(undefined);
            setIsStandbyModeOpen(true);
          }}
          onOpenIstikharaHajah={() => setIsIstikharaHajahOpen(true)}
          onOpenWidgetsStudio={() => setIsWidgetStudioOpen(true)}
          onNavigateHome={() => {
            setActiveTab('times');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 pb-12">
          {settings.autoThemeEnabled && (
            <div className="mb-3 flex items-center justify-center" dir="rtl">
              <button
                type="button"
                onClick={() => openSettingsOnTab('themes')}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#041d17]/90 border border-[#e5b869]/40 hover:border-[#fbbf24] text-xs font-bold text-[#fbbf24] shadow-sm transition-all"
                title="إعدادات المظهر التلقائي للنهار والليل"
              >
                <span>
                  {autoThemeManualPause
                    ? `⏸️ تم اختيار «${getThemeDefinition(activeThemeId).nameAr}» يدوياً · انقر لإدارة التلقائي`
                    : autoThemeEvaluation.statusBadgeAr}
                </span>
              </button>
            </div>
          )}

          {activeTab === 'times' && (
            <PrayerTimesCard
              prayerTimes={prayerTimes}
              currentLocation={currentLocation}
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              onTestSalawat={() => handleTestSalawat()}
              onTestPreAdhan={(prayerNameAr, isAutoTrigger) =>
                handleTestPreAdhan(undefined, prayerNameAr, isAutoTrigger)
              }
              onTestIqama={(prayerNameAr, isAutoTrigger) =>
                handleTestIqama(undefined, prayerNameAr, isAutoTrigger)
              }
              onOpenIqamaTab={() => openSettingsOnTab('iqama')}
              khatmaSchedule={khatmaSchedule}
              onTogglePrayerWird={handleTogglePrayerWird}
              onOpenWirdModal={(prayerKey, prayerNameAr) => setSelectedWirdModal({ prayerKey, prayerNameAr })}
              onNavigateToAdhkar={() => setActiveTab('adhkar')}
              onOpenStandbyMode={() => setIsStandbyModeOpen(true)}
              onOpenTravelTab={() => setActiveTab('companion')}
              onOpenFullScreenAdhan={(prayerKey, prayerNameAr) =>
                handleOpenFullScreenAdhanModal(prayerKey, prayerNameAr, false)
              }
              isGlobalFullScreenAdhanOpen={fullScreenAdhanState.isOpen}
            />
          )}

          {scheduledAdhkarBanner && (
            <div
              dir="rtl"
              className="mb-6 rounded-3xl border-2 border-[#fbbf24]/80 bg-gradient-to-r from-[#072b21] via-[#05221b] to-[#031410] p-4 sm:p-5 shadow-[0_12px_36px_rgba(0,0,0,0.5),0_0_28px_rgba(251,191,36,0.22)] flex flex-col sm:flex-row items-center justify-between gap-4 text-right animate-in fade-in duration-300"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#031713] border border-[#fbbf24]/60 flex items-center justify-center text-[#fbbf24] shrink-0">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-[#fbbf24]">
                    ❖ تنبيه أذكار التوقيت المحدد ❖
                  </div>
                  <h4 className="font-bold text-base sm:text-lg font-amiri text-white">
                    {scheduledAdhkarBanner.title}
                  </h4>
                  <p className="text-xs text-slate-300">
                    {settings.adhkarAutoPlayAudio !== false
                      ? `تم تشغيل تلاوة الأذكار تلقائياً في الوقت المحدد في الإعدادات (${scheduledAdhkarBanner.period === 'morning' ? settings.morningAdhkarTime : settings.eveningAdhkarTime})`
                      : `حان الموعد المحدد في الإعدادات (${scheduledAdhkarBanner.period === 'morning' ? settings.morningAdhkarTime : settings.eveningAdhkarTime})`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('adhkar');
                    setScheduledAdhkarBanner(null);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#fbbf24] to-[#d97706] text-slate-950 font-black text-xs transition-all shadow-md hover:brightness-105 whitespace-nowrap"
                >
                  فتح تبويب الأذكار
                </button>
                <button
                  type="button"
                  onClick={() => setScheduledAdhkarBanner(null)}
                  className="w-10 h-10 rounded-xl bg-[#031713] border border-[#e5b869]/35 text-slate-300 hover:text-white flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {duhaSunriseBanner && (
            <div
              dir="rtl"
              className="mb-6 rounded-3xl border-2 border-[#D4AF37]/80 bg-gradient-to-r from-[#08261C] via-[#061D15] to-[#04130E] p-4 sm:p-5 shadow-[0_12px_36px_rgba(0,0,0,0.5)] flex items-center justify-between gap-4 text-right"
            >
              <div className="space-y-0.5 min-w-0">
                <h4 className="font-bold text-base sm:text-lg font-amiri text-[#F6D884]">
                  {duhaSunriseBanner.title}
                </h4>
                <p className="text-xs text-slate-200">{duhaSunriseBanner.subtitle}</p>
              </div>
              <button
                type="button"
                onClick={() => setDuhaSunriseBanner(null)}
                aria-label="إغلاق تنبيه الشروق والضحى"
                className="min-w-[44px] min-h-[44px] rounded-xl bg-[#031713] border border-[#D4AF37]/40 text-slate-200 hover:text-[#F6D884] flex items-center justify-center shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {activeTab === 'tracker' && (
            <PrayerTracker
              checkinState={checkinState}
              onToggleCheckinField={handleToggleCheckinField}
            />
          )}

          {activeTab === 'qibla' && (
            <QiblaCompass currentLocation={currentLocation} />
          )}

          {activeTab === 'adhkar' && (
            <AdhkarSection
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              onNavigateHome={() => setActiveTab('times')}
              onOpenAdhkarSettings={() => openSettingsOnTab('adhkar')}
            />
          )}

          {activeTab === 'quran' && (
            <QuranSection />
          )}

          {activeTab === 'ai' && (
            <AiAssistant />
          )}

          {activeTab === 'companion' && (
            <CompanionHubSection
              currentLocation={currentLocation}
              prayerTimes={prayerTimes}
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              initialSubTab={companionSubTab}
              onSubTabChange={setCompanionSubTab}
              onTestCompanionReminder={handleTriggerCompanionReminderTest}
            />
          )}

          {activeTab === 'commute' && (
            <CommuteWirdSection />
          )}

          {activeTab === 'family' && (
            <FamilyHomeSection
              prayerTimes={prayerTimes}
              currentLocation={currentLocation}
              settings={settings}
              onRegisterBackHandler={(fn) => {
                familyBackHandlerRef.current = fn;
              }}
            />
          )}
        </main>

        {/* Settings Modal matching user screenshots */}
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          initialTab={settingsInitialTab}
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onManualThemeSelect={handleManualThemeSelect}
          autoThemeManualPause={autoThemeManualPause}
          onReEnableAutoTheme={handleReEnableAutoTheme}
          currentLocation={currentLocation}
          prayerTimes={prayerTimes}
          basePrayerTimes={basePrayerTimes}
          onSelectCity={handleSelectCity}
          onOpenBackgroundPicker={() => {
            setIsSettingsOpen(false);
            setIsBackgroundPickerOpen(true);
          }}
          onTestPeriodicReminder={() => {
            setIsSettingsOpen(false);
            setIsPeriodicPopupOpen(true);
            if (settings.periodicReminderSoundEnabled && !settings.meetingModeEnabled) {
              adhanPlayer.playPeriodicChime(settings.volume ?? 0.8);
            }
          }}
          onTestSalawat={handleTestSalawat}
          onTestPreAdhan={(voiceMode) => handleTestPreAdhan(voiceMode, undefined, false)}
          onTestIqama={(voiceMode, prayerNameAr) => handleTestIqama(voiceMode, prayerNameAr, false)}
          widgetConfig={widgetConfig}
          onUpdateWidgetConfig={handleUpdateWidgetConfig}
          onOpenWidgetsStudio={() => {
            setIsSettingsOpen(false);
            setIsWidgetStudioOpen(true);
          }}
          onTestPostPrayerCheckin={handleTestPostPrayerCheckin}
          onOpenFullScreenAdhanSimulation={() => {
            setIsSettingsOpen(false);
            handleOpenFullScreenAdhanModal(undefined, undefined, true);
          }}
        />

        {/* Mosque Backgrounds & Clarity Modal */}
        <BackgroundPickerModal
          isOpen={isBackgroundPickerOpen}
          onClose={() => setIsBackgroundPickerOpen(false)}
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
        />

        {/* Periodic Verse & Hadith Floating Mihrab Toast */}
        <PeriodicReminderPopup
          isOpen={isPeriodicPopupOpen}
          contentType={settings.periodicReminderContentType || 'both'}
          forcedItemId={forcedPeriodicItemId}
          onClose={() => {
            setIsPeriodicPopupOpen(false);
            setForcedPeriodicItemId(null);
          }}
        />

        {/* Heart Steadfastness Record Modal */}
        <SteadfastnessModal
          isOpen={isSteadfastnessOpen}
          onClose={() => setIsSteadfastnessOpen(false)}
          showFastingCounter={settings.showFastingStatsInRecord}
        />

        {/* Unified Display Mode (StandBy Nightstand + Smart Home/Mosque Display) */}
        <AmbientStandByModal
          isOpen={isStandbyModeOpen}
          onClose={() => {
            if (window.innerWidth > window.innerHeight) {
              standbyDismissedInLandscapeRef.current = true;
            }
            setIsStandbyModeOpen(false);
          }}
          onDisableAutoStart={() => {
            handleUpdateSettings({ autoEnterTvDisplay: false });
            setIsStandbyModeOpen(false);
          }}
          prayerTimes={prayerTimes}
          currentLocation={currentLocation}
          settings={settings}
          initialMode={displayInitialMode}
        />

        {/* Global Full-Screen Cinematic Adhan & Dua Modal */}
        <FullScreenAdhanModal
          isOpen={fullScreenAdhanState.isOpen}
          onClose={() => setFullScreenAdhanState((prev) => ({ ...prev, isOpen: false }))}
          prayerKey={fullScreenAdhanState.prayerKey}
          prayerNameAr={fullScreenAdhanState.prayerNameAr}
          currentLocation={currentLocation}
          settings={settings}
          isSimulation={fullScreenAdhanState.isSimulation}
        />

        {/* Global Post-Prayer Adhkar + Dual Tasbih Modal (fires from any active tab at +10m) */}
        <PostPrayerTasbihModal
          isOpen={globalPostPrayerModal.isOpen}
          onClose={() => setGlobalPostPrayerModal((prev) => ({ ...prev, isOpen: false }))}
          prayerNameAr={globalPostPrayerModal.prayerNameAr}
          isSimulated={false}
          isJumuahMode={new Date().getDay() === 5}
          initialPurpose="post_prayer"
        />

        {/* Global Silent Meeting Mode Banner (when Adhan arrives during any tab) */}
        {globalSilentMeetingAlert && (
          <div
            dir="rtl"
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[65] max-w-md w-[calc(100vw-2rem)] rounded-2xl border-2 border-[#fbbf24]/80 bg-gradient-to-br from-[#062f26]/95 via-[#031b16]/98 to-[#02120e]/98 p-4 shadow-[0_14px_40px_rgba(0,0,0,0.65)] backdrop-blur-xl text-right"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-xs font-bold text-[#fbbf24]">
                  ❖ المؤذن الصامت للمكاتب والاجتماعات ❖
                </div>
                <div className="font-amiri text-base font-bold text-white mt-1">
                  حان وقت صلاة {globalSilentMeetingAlert.prayerNameAr} ({globalSilentMeetingAlert.timeStr})
                </div>
                <div className="text-xs text-emerald-300 mt-0.5">
                  تم كتم صوت الأذان وتفعيل الاهتزاز الهادئ تلقائياً
                </div>
              </div>
              <button
                type="button"
                onClick={() => setGlobalSilentMeetingAlert(null)}
                className="text-slate-400 hover:text-[#fbbf24] text-xs px-2 py-1 rounded-lg"
                aria-label="إغلاق"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Istikhara & Hajah Prayer Helper Modal */}
        <IstikharaHajahModal
          isOpen={isIstikharaHajahOpen}
          onClose={() => setIsIstikharaHajahOpen(false)}
        />

        {/* Widgets & Home Screen Studio Modal */}
        <WidgetStudioModal
          isOpen={isWidgetStudioOpen}
          onClose={() => setIsWidgetStudioOpen(false)}
          prayerTimes={prayerTimes}
          currentLocation={currentLocation}
          settings={settings}
          config={widgetConfig}
          onUpdateConfig={handleUpdateWidgetConfig}
          onLaunchStandaloneWidget={(cfg) => {
            setIsWidgetStudioOpen(false);
            setStandaloneWidgetConfig(cfg);
          }}
          onNavigateShortcut={(target) => {
            if (target === 'standby') {
              setIsStandbyModeOpen(true);
            } else if (target === 'istikhara') {
              setIsIstikharaHajahOpen(true);
            } else {
              setActiveTab(target);
            }
          }}
        />

        {/* Daily Khatma Wird Mushaf Reader Modal */}
        {selectedWirdModal && (() => {
          const wirdInfo = khatmaSchedule.wirdByPrayer[selectedWirdModal.prayerKey];
          if (!wirdInfo) return null;
          return (
            <QuranWirdModal
              isOpen={true}
              onClose={() => setSelectedWirdModal(null)}
              wird={wirdInfo}
              prayerNameAr={selectedWirdModal.prayerNameAr}
              isCompleted={wirdInfo.isCompleted}
              onToggleComplete={() => handleTogglePrayerWird(selectedWirdModal.prayerKey)}
            />
          );
        })()}

        {/* In-App Floating Post-Prayer Check-in Notification Toast */}
        {activePostPrayerToast && (
          <PostPrayerNotificationToast
            prayerKey={activePostPrayerToast.prayerKey}
            prayerNameAr={activePostPrayerToast.prayerNameAr}
            dateKey={activePostPrayerToast.dateKey}
            isTest={activePostPrayerToast.isTest}
            includeWird={settings.postPrayerIncludeWird ?? true}
            includeAdhkar={settings.postPrayerIncludeAdhkar ?? true}
            includeSunnah={settings.postPrayerIncludeSunnah ?? true}
            wirdCompleted={Boolean(
              khatmaState.completedToday[activePostPrayerToast.prayerKey] ||
                checkinState.prayers[activePostPrayerToast.prayerKey]?.wird
            )}
            wirdSummary={khatmaSchedule.wirdByPrayer[activePostPrayerToast.prayerKey]?.summary}
            adhkarCompleted={Boolean(
              checkinState.prayers[activePostPrayerToast.prayerKey]?.adhkar
            )}
            sunnahCompleted={isPrayerSunnahCompleted(
              sunnahState,
              activePostPrayerToast.prayerKey
            )}
            sunnahLabel={SUNNAH_RAWATIB_LABELS[activePostPrayerToast.prayerKey].title}
            onToggleWird={() => handleTogglePrayerWird(activePostPrayerToast.prayerKey)}
            onToggleAdhkar={() => {
              adhanPlayer.playChime();
              handleToggleCheckinField(activePostPrayerToast.prayerKey, 'adhkar');
            }}
            onToggleSunnah={() => handleTogglePrayerSunnah(activePostPrayerToast.prayerKey)}
            onOpenDetails={() => {
              const target = activePostPrayerToast;
              setForcedCheckinPrayer({
                prayerKey: target.prayerKey,
                prayerNameAr: target.prayerNameAr,
              });
              setActivePostPrayerToast(null);
            }}
            onClose={handleClosePostPrayerToast}
          />
        )}

        {/* On-Demand Post-Prayer Details & Quick Tasbih Modal */}
        {forcedCheckinPrayer && (
          <PostPrayerCheckinModal
            isOpen={true}
            prayerKey={forcedCheckinPrayer.prayerKey}
            prayerNameAr={forcedCheckinPrayer.prayerNameAr}
            onClose={() => setForcedCheckinPrayer(null)}
            checkinState={checkinState}
            wirdCompleted={Boolean(
              khatmaState.completedToday[forcedCheckinPrayer.prayerKey] ||
                checkinState.prayers[forcedCheckinPrayer.prayerKey]?.wird
            )}
            wirdSummary={khatmaSchedule.wirdByPrayer[forcedCheckinPrayer.prayerKey]?.summary}
            sunnahCompleted={isPrayerSunnahCompleted(
              sunnahState,
              forcedCheckinPrayer.prayerKey
            )}
            sunnahLabel={SUNNAH_RAWATIB_LABELS[forcedCheckinPrayer.prayerKey].title}
            onToggleFard={() => {
              adhanPlayer.playChime();
              handleToggleCheckinField(forcedCheckinPrayer.prayerKey, 'fard');
            }}
            onToggleAdhkar={(forceTrue) => {
              if (!forceTrue) adhanPlayer.playChime();
              handleToggleCheckinField(
                forcedCheckinPrayer.prayerKey,
                'adhkar',
                forceTrue ? true : undefined
              );
            }}
            onToggleWird={() => handleTogglePrayerWird(forcedCheckinPrayer.prayerKey)}
            onToggleSunnah={() => handleTogglePrayerSunnah(forcedCheckinPrayer.prayerKey)}
          />
        )}

        {/* Daily Qada & Hifz Reminder Toast */}
        {activeCompanionToast && (
          <div
            className="fixed bottom-5 right-5 z-[62] max-w-sm w-[calc(100vw-2.5rem)] rounded-2xl bg-[#041b16]/98 border-2 border-[#D4AF37]/65 shadow-[0_14px_40px_rgba(0,0,0,0.65)] p-4 text-right backdrop-blur-xl animate-fade-in"
            dir="rtl"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className="text-xs font-bold text-[#F3CA63]">
                {activeCompanionToast.titleAr}
              </span>
              <button
                type="button"
                onClick={() => setActiveCompanionToast(null)}
                className="text-slate-400 hover:text-[#F3CA63] text-xs px-1.5 py-0.5 rounded-lg"
                aria-label="إغلاق"
              >
                ✕
              </button>
            </div>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed mb-3">
              {activeCompanionToast.bodyAr}
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveCompanionToast(null)}
                className="min-h-[36px] px-3 py-1 rounded-lg bg-[#071410] border border-slate-700 text-slate-300 text-xs font-bold"
              >
                لاحقاً
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = activeCompanionToast.kind;
                  setActiveCompanionToast(null);
                  setCompanionSubTab(target);
                  setActiveTab('companion');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="min-h-[36px] px-4 py-1 rounded-lg bg-[#D4AF37] text-slate-950 text-xs font-black"
              >
                فتح الآن
              </button>
            </div>
          </div>
        )}

        {/* Periodic Salawat Audio Floating Mihrab Toast */}
        {activeSalawatToast && (
          <div
            className="fixed bottom-5 left-5 z-[60] max-w-sm w-[calc(100vw-2.5rem)] rounded-2xl bg-gradient-to-br from-[#062f26]/95 via-[#031b16]/98 to-[#02120e]/98 border-2 border-[#e5b869]/60 shadow-[0_14px_40px_rgba(0,0,0,0.6),0_0_28px_rgba(229,184,105,0.22)] p-4 text-right backdrop-blur-xl animate-fade-in"
            dir="rtl"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#fbbf24] animate-pulse shadow-[0_0_8px_#fbbf24]" />
                <span className="text-xs font-bold text-[#fbbf24] tracking-wide">
                  تذكير الصلاة على النبي ﷺ
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  adhanPlayer.stop();
                  setActiveSalawatToast(null);
                }}
                className="text-slate-400 hover:text-[#fbbf24] text-xs px-1.5 py-0.5 rounded-lg border border-transparent hover:border-[#e5b869]/30 transition-colors"
                aria-label="إغلاق"
              >
                ✕
              </button>
            </div>

            <p className="font-amiri text-base sm:text-lg text-white leading-relaxed mb-2.5">
              {activeSalawatToast.formulaAr}
            </p>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#e5b869]/20">
              <span className="text-[11px] font-bold text-emerald-300 truncate">
                {activeSalawatToast.nameAr}
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleTestSalawat('rotate')}
                  className="px-2.5 py-1 rounded-lg bg-[#073a2f] border border-[#e5b869]/35 hover:border-[#fbbf24] text-[#fbbf24] text-[11px] font-bold transition-all"
                >
                  صوت شيخ آخر
                </button>
                <button
                  type="button"
                  onClick={() => {
                    adhanPlayer.stop();
                    setActiveSalawatToast(null);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-[#041814] border border-slate-700 hover:border-rose-400/50 text-slate-300 hover:text-rose-300 text-[11px] font-bold transition-all"
                >
                  إيقاف
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pre-Adhan Sheikh Prayer Alert Floating Mihrab Toast */}
        {activePreAdhanToast && (
          <div
            className="fixed bottom-5 right-5 z-[60] max-w-sm w-[calc(100vw-2.5rem)] rounded-2xl bg-gradient-to-br from-[#062f26]/95 via-[#031b16]/98 to-[#02120e]/98 border-2 border-[#e5b869]/60 shadow-[0_14px_40px_rgba(0,0,0,0.6),0_0_28px_rgba(229,184,105,0.22)] p-4 text-right backdrop-blur-xl animate-fade-in"
            dir="rtl"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#fbbf24] animate-pulse shadow-[0_0_8px_#fbbf24]" />
                <span className="text-xs font-bold text-[#fbbf24] tracking-wide">
                  {activePreAdhanToast.prayerNameAr
                    ? `تنبيه الاستعداد لصلاة ${activePreAdhanToast.prayerNameAr}`
                    : 'تنبيه الاستعداد للوضوء والصلاة'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  adhanPlayer.stop();
                  setActivePreAdhanToast(null);
                }}
                className="text-slate-400 hover:text-[#fbbf24] text-xs px-1.5 py-0.5 rounded-lg border border-transparent hover:border-[#e5b869]/30 transition-colors"
                aria-label="إغلاق"
              >
                ✕
              </button>
            </div>

            <p className="font-amiri text-base sm:text-lg text-white leading-relaxed mb-2.5">
              {activePreAdhanToast.profile.verseAr}
            </p>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#e5b869]/20">
              <span className="text-[11px] font-bold text-emerald-300 truncate">
                {activePreAdhanToast.profile.nameAr}
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleTestPreAdhan('rotate', activePreAdhanToast.prayerNameAr, false)}
                  className="px-2.5 py-1 rounded-lg bg-[#073a2f] border border-[#e5b869]/35 hover:border-[#fbbf24] text-[#fbbf24] text-[11px] font-bold transition-all"
                >
                  صوت شيخ آخر
                </button>
                <button
                  type="button"
                  onClick={() => {
                    adhanPlayer.stop();
                    setActivePreAdhanToast(null);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-[#041814] border border-slate-700 hover:border-rose-400/50 text-slate-300 hover:text-rose-300 text-[11px] font-bold transition-all"
                >
                  إيقاف
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Iqama Arrival Floating Mihrab Toast */}
        {activeIqamaToast && (
          <div
            className="fixed bottom-5 right-5 z-[65] max-w-sm w-[calc(100vw-2.5rem)] rounded-2xl bg-gradient-to-br from-[#062f26]/95 via-[#031b16]/98 to-[#02120e]/98 border-2 border-[#fbbf24]/75 shadow-[0_14px_40px_rgba(0,0,0,0.65),0_0_32px_rgba(251,191,36,0.28)] p-4 text-right backdrop-blur-xl animate-fade-in"
            dir="rtl"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[#fbbf24] tracking-wide font-amiri">
                  {activeIqamaToast.prayerNameAr
                    ? `قد قامت الصلاة · إقامة صلاة ${activeIqamaToast.prayerNameAr}`
                    : 'قد قامت الصلاة · إقامة الصلاة'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  adhanPlayer.stop();
                  setActiveIqamaToast(null);
                }}
                className="text-slate-400 hover:text-[#fbbf24] text-xs px-1.5 py-0.5 rounded-lg border border-transparent hover:border-[#e5b869]/30 transition-colors"
                aria-label="إغلاق"
              >
                ✕
              </button>
            </div>

            <p className="font-amiri text-base sm:text-lg text-white leading-relaxed mb-2.5">
              حيّ على الصلاة · حيّ على الفلاح · قد قامت الصلاة قد قامت الصلاة
            </p>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#e5b869]/20">
              <span className="text-[11px] font-bold text-emerald-300 truncate">
                {activeIqamaToast.profile.nameAr}
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleTestIqama('rotate', activeIqamaToast.prayerNameAr, false)}
                  className="px-2.5 py-1 rounded-lg bg-[#073a2f] border border-[#e5b869]/35 hover:border-[#fbbf24] text-[#fbbf24] text-[11px] font-bold transition-all"
                >
                  صوت شيخ آخر
                </button>
                <button
                  type="button"
                  onClick={() => {
                    adhanPlayer.stop();
                    setActiveIqamaToast(null);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-[#041814] border border-slate-700 hover:border-rose-400/50 text-slate-300 hover:text-rose-300 text-[11px] font-bold transition-all"
                >
                  إيقاف
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Manual Theme Override Gentle Floating Toast (when Auto Day/Night is enabled) */}
        {autoThemeOverrideNotice && (
          <div
            className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[65] max-w-md w-[calc(100vw-2rem)] rounded-2xl bg-gradient-to-br from-[#062f26]/95 via-[#031b16]/98 to-[#02120e]/98 border-2 border-[#e5b869]/65 shadow-[0_14px_40px_rgba(0,0,0,0.65),0_0_28px_rgba(229,184,105,0.22)] p-4 text-right backdrop-blur-xl animate-fade-in"
            dir="rtl"
            role="status"
          >
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <span className="text-xs font-bold text-[#fbbf24] tracking-wide">
                ❖ الوضع التلقائي للنهار والليل مفعّل ❖
              </span>
              <button
                type="button"
                onClick={() => setAutoThemeOverrideNotice(null)}
                className="text-slate-400 hover:text-[#fbbf24] text-xs px-1.5 py-0.5 rounded-lg border border-transparent hover:border-[#e5b869]/30 transition-colors"
                aria-label="إغلاق التنبيه"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed mb-3">
              تم اختيار مظهر{' '}
              <strong className="text-[#fbbf24]">
                «{getThemeDefinition(autoThemeOverrideNotice.chosenThemeId).nameAr}»
              </strong>{' '}
              يدوياً. يمكنك العودة إلى التبديل التلقائي حسب الشمس أو تثبيت هذا المظهر دائماً.
            </p>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => handlePinManualTheme(autoThemeOverrideNotice.chosenThemeId)}
                className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-[#05261f] border border-[#e5b869]/40 text-slate-200 hover:text-[#fbbf24] hover:border-[#fbbf24] text-xs font-bold transition-all"
              >
                تثبيت الثيم المختار
              </button>
              <button
                type="button"
                onClick={handleReEnableAutoTheme}
                className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#fbbf24] via-[#e5b869] to-emerald-400 text-slate-950 font-black text-xs shadow hover:brightness-105 transition-all"
              >
                إعادة التفعيل التلقائي
              </button>
            </div>
          </div>
        )}

        {/* Offline Status Indicator */}
        <OfflineIndicator />

        {/* Footer */}
        <footer className="bg-[#031410]/85 backdrop-blur-md border-t border-[#e5b869]/20 py-4 text-center text-xs text-[#e5b869]/75">
          تطبيق مواقيت الصلاة والأذان الشامل · حساب فلكي رسمي دقيق · جميع الحقوق محفوظة © {new Date().getFullYear()}
        </footer>
      </div>

      {/* Independent Spiritual Audio Splash Overlay (does not modify main app screen) */}
      <SpiritualSplashOverlay
        isOpen={showSplashOverlay && !fullScreenAdhanState.isOpen}
        onEnterCommute={() => {
          setShowSplashOverlay(false);
          setActiveTab('commute');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onEnterHome={() => {
          setShowSplashOverlay(false);
        }}
      />
    </div>
  );
}
