import React, { useCallback, useEffect, useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { PrayerTimesCard } from './components/PrayerTimesCard';
import { PrayerTracker } from './components/PrayerTracker';
import { QiblaCompass } from './components/QiblaCompass';
import { AdhkarSection } from './components/AdhkarSection';
import { QuranSection } from './components/QuranSection';
import { AiAssistant } from './components/AiAssistant';
import { SettingsModal, SettingsTabId } from './components/SettingsModal';
import { BackgroundPickerModal } from './components/BackgroundPickerModal';
import { PeriodicReminderPopup } from './components/PeriodicReminderPopup';
import { QuranWirdModal } from './components/QuranWirdModal';
import { SteadfastnessModal } from './components/SteadfastnessModal';
import { AmbientStandByModal, UnifiedDisplayMode } from './components/AmbientStandByModal';
import { IstikharaHajahModal } from './components/IstikharaHajahModal';
import { WidgetStudioModal } from './components/WidgetStudioModal';
import { PrayerWidgetPreview } from './components/PrayerWidgetPreview';
import {
  WIDGET_SIZES,
  WIDGET_THEMES,
  WidgetStudioConfig,
  loadWidgetConfig,
  saveWidgetConfig,
  syncWidgetDataBridge,
} from './utils/widgetStudioData';
import { CompanionHubSection } from './components/CompanionHubSection';
import { OfflineIndicator } from './components/PWAInstallButton';
import { precacheEssentialAudioOnce } from './utils/offlineAudioManager';
import { loadFastingPreferences, saveFastingPreferences } from './utils/fastingCalculator';
import { backgroundService } from './utils/backgroundService';
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
import { CityLocation, UserSettings, PrayerTimeData, AppThemeId } from './types';
import { CITIES, calculatePrayerTimes } from './utils/prayerCalculator';
import { adhanPlayer, getDuaSource, SalawatVoiceProfile, PreAdhanVoiceProfile, IqamaVoiceProfile } from './utils/audioAdhan';
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

export default function App() {
  const [activeTab, setActiveTab] = useState<'times' | 'tracker' | 'qibla' | 'adhkar' | 'quran' | 'ai' | 'companion'>(() => {
    if (typeof window === 'undefined') return 'times';
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    const valid = ['times', 'tracker', 'qibla', 'adhkar', 'quran', 'ai', 'companion'];
    if (tab && valid.includes(tab)) {
      try {
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch {
        // ignore history errors
      }
      return tab as any;
    }
    return 'times';
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
    autoDuaAfterAdhan: true,
    duaAudioReciter: (() => {
      if (typeof window === 'undefined') return 'shaarawy';
      const saved = localStorage.getItem('dua_audio_reciter');
      return getDuaSource(saved || 'shaarawy').id;
    })(),
    preAdhanReminderMinutes: 10,
    preAdhanSoundEnabled: true,
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
    adhkarShortSheikh:
      (typeof window !== 'undefined' ? localStorage.getItem('adhkar_short_sheikh') : null) || 'rotate',
    iqamaStyle: (typeof window !== 'undefined' ? (localStorage.getItem('iqama_style_preference') as 'ring' | 'split' | 'pill') : 'ring') || 'ring',
    adhanModalLayout: (typeof window !== 'undefined' ? (localStorage.getItem('adhan_modal_layout') as any) : 'editorial-horizon') || 'editorial-horizon',
    adhanCountdownStyle: (typeof window !== 'undefined' ? (localStorage.getItem('adhan_countdown_islamic_style') as any) : 'islamic-mihrab') || 'islamic-mihrab',
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
      return (saved === 'quran' || saved === 'hadith' || saved === 'both' ? saved : 'both') as
        | 'both'
        | 'quran'
        | 'hadith';
    })(),
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
    const rate = params.get('rate');
    return {
      ...base,
      size: size === 'lock_pill' || size === 'medium' || size === 'large' ? size : base.size,
      theme: theme === 'emerald' || theme === 'glass' || theme === 'oled' ? theme : base.theme,
      showLiveSeconds: sec !== null ? sec === '1' : base.showLiveSeconds,
      showHijriDate: hijri !== null ? hijri === '1' : base.showHijriDate,
      showSunnahWird: wird !== null ? wird === '1' : base.showSunnahWird,
      showFastingAlert: fasting !== null ? fasting === '1' : base.showFastingAlert,
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
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimeData>(() =>
    calculatePrayerTimes(new Date(), CITIES[0].lat, CITIES[0].lng, CITIES[0].timezone, 'egypt', 'standard')
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

  const [scheduledAdhkarBanner, setScheduledAdhkarBanner] = useState<{
    period: 'morning' | 'evening';
    title: string;
  } | null>(null);
  const lastMorningAdhkarTriggerRef = React.useRef<string>('');
  const lastEveningAdhkarTriggerRef = React.useRef<string>('');

  useEffect(() => {
    const checkAdhkarSchedule = () => {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const todayKey = now.toDateString();

      if (
        settings.morningAdhkarEnabled !== false &&
        settings.morningAdhkarTime &&
        timeStr === settings.morningAdhkarTime
      ) {
        const trigKey = `${todayKey}-morning-${settings.morningAdhkarTime}`;
        if (lastMorningAdhkarTriggerRef.current !== trigKey) {
          lastMorningAdhkarTriggerRef.current = trigKey;
          if (settings.adhkarAutoPlayAudio !== false && !settings.meetingModeEnabled) {
            adhanPlayer.playAdhkar(settings.adhkarReciter || 'alafasy_adhkar', 'أذكار الصباح المباركة', 'morning');
          }
          if (settings.notificationsEnabled) {
            backgroundService.sendPrayerNotification('حان وقت أذكار الصباح', 'ابدأ يومك بذكر الله وحصن نفسك بالأذكار المأثورة');
          }
          setScheduledAdhkarBanner({ period: 'morning', title: 'حان الآن وقت أذكار الصباح ☀️' });
        }
      }

      if (
        settings.eveningAdhkarEnabled !== false &&
        settings.eveningAdhkarTime &&
        timeStr === settings.eveningAdhkarTime
      ) {
        const trigKey = `${todayKey}-evening-${settings.eveningAdhkarTime}`;
        if (lastEveningAdhkarTriggerRef.current !== trigKey) {
          lastEveningAdhkarTriggerRef.current = trigKey;
          if (settings.adhkarAutoPlayAudio !== false && !settings.meetingModeEnabled) {
            adhanPlayer.playAdhkar(settings.adhkarReciter || 'alafasy_adhkar', 'أذكار المساء المباركة', 'evening');
          }
          if (settings.notificationsEnabled) {
            backgroundService.sendPrayerNotification('حان وقت أذكار المساء', 'احفظ نفسك وليلتك بذكر الله والأذكار المأثورة');
          }
          setScheduledAdhkarBanner({ period: 'evening', title: 'حان الآن وقت أذكار المساء 🌙' });
        }
      }
    };

    checkAdhkarSchedule();
    const timer = setInterval(checkAdhkarSchedule, 1000);

    return () => clearInterval(timer);
  }, [
    settings.morningAdhkarEnabled,
    settings.eveningAdhkarEnabled,
    settings.morningAdhkarTime,
    settings.eveningAdhkarTime,
    settings.adhkarReciter,
    settings.adhkarAutoPlayAudio,
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
    setPrayerTimes(times);
  }, [currentLocation, settings.calculationMethod, settings.asrMethod]);

  // Handle PWA Home Screen shortcut ?shortcut=wird on initial load
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const shortcut = new URLSearchParams(window.location.search).get('shortcut');
    if (shortcut !== 'wird') return;
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
  }, []);

  // Widget Data Bridge: syncs unified JSON in localStorage & dispatches 'mihrabWidgetSync'
  useEffect(() => {
    if (!widgetConfig.autoSync) return;
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
    return () => {
      window.removeEventListener('sunnah_rawatib_changed', runBridgeSync);
      window.removeEventListener('fasting_intent_changed', runBridgeSync);
      window.removeEventListener('post_prayer_checkin_changed', runBridgeSync);
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
      const currentCheckin = loadTodayCheckinState();
      const delayMins = settings.postPrayerCheckinMinutes ?? 20;
      const due = getDuePostPrayerNotification(prayerTimes, delayMins, currentCheckin, new Date());
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

  // Periodic Verse & Hadith Popup scheduler
  useEffect(() => {
    if (!settings.periodicReminderEnabled) return;
    const intervalMinutes = settings.periodicReminderInterval ?? 15;
    const timer = window.setInterval(() => {
      setIsPeriodicPopupOpen(true);
    }, intervalMinutes * 60 * 1000);
    return () => window.clearInterval(timer);
  }, [settings.periodicReminderEnabled, settings.periodicReminderInterval]);

  // Periodic Salawat upon the Prophet (ﷺ) audio scheduler (every N minutes)
  useEffect(() => {
    if (!settings.salawatEnabled || settings.meetingModeEnabled) return;
    const intervalMinutes = settings.salawatIntervalMinutes ?? 10;
    const timer = window.setInterval(() => {
      const spokenProfile = adhanPlayer.playSalawat(settings.salawatVoiceMode || 'rotate', {
        isAutoTrigger: true,
      });
      if (spokenProfile) {
        setActiveSalawatToast(spokenProfile);
      }
    }, intervalMinutes * 60 * 1000);
    return () => window.clearInterval(timer);
  }, [settings.salawatEnabled, settings.salawatIntervalMinutes, settings.salawatVoiceMode, settings.meetingModeEnabled]);

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
    }
    return profile;
  };

  const handleTestIqama = (
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
  };

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
      if (typeof newSettings.periodicReminderEnabled === 'boolean') {
        localStorage.setItem('periodic_reminder_enabled', String(newSettings.periodicReminderEnabled));
      }
      if (newSettings.periodicReminderInterval) {
        localStorage.setItem('periodic_reminder_interval', String(newSettings.periodicReminderInterval));
      }
      if (newSettings.periodicReminderContentType) {
        localStorage.setItem('periodic_reminder_content_type', newSettings.periodicReminderContentType);
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
      if (newSettings.preAdhanVoiceMode) {
        localStorage.setItem('pre_adhan_voice_mode', newSettings.preAdhanVoiceMode);
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
    return (
      <div
        dir="rtl"
        className="min-h-screen bg-[#050807] flex flex-col items-center justify-center p-4 sm:p-6 gap-5"
        style={{
          backgroundImage:
            standaloneWidgetConfig.theme === 'glass'
              ? 'radial-gradient(circle at 30% 25%, rgba(16,185,129,0.28), transparent 55%), radial-gradient(circle at 75% 75%, rgba(212,175,55,0.22), transparent 55%)'
              : undefined,
        }}
      >
        <div className="w-full max-w-md space-y-4">
          <PrayerWidgetPreview
            config={standaloneWidgetConfig}
            prayerTimes={prayerTimes}
            currentLocation={currentLocation}
            settings={settings}
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
          onSelectCity={handleSelectCity}
          onOpenBackgroundPicker={() => {
            setIsSettingsOpen(false);
            setIsBackgroundPickerOpen(true);
          }}
          onTestPeriodicReminder={() => {
            setIsSettingsOpen(false);
            setIsPeriodicPopupOpen(true);
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
          onClose={() => setIsPeriodicPopupOpen(false)}
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
          prayerTimes={prayerTimes}
          currentLocation={currentLocation}
          settings={settings}
          initialMode={displayInitialMode}
        />

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
    </div>
  );
}
