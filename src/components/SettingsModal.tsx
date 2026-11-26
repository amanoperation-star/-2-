import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  MapPin,
  Calculator,
  Volume2,
  Globe,
  ShieldCheck,
  CheckCircle2,
  Play,
  Square,
  Loader2,
  Video,
  Heart,
  Check,
  Settings as SettingsIcon,
  BellRing,
  Timer,
  Sunrise,
  VolumeX,
  Sparkles,
  BookOpen,
  Moon,
  Palette,
  Image as ImageIcon,
  Plus,
  Minus,
  RotateCcw,
  Clock,
  Sun,
  Smartphone,
  Download,
  Trash2,
  WifiOff,
  HardDrive,
  ChevronDown,
  ChevronUp,
  Tv,
} from 'lucide-react';
import { ApkGuideCard } from './ApkGuideCard';
import { NotificationShadeSettingsCard } from './NotificationShadeSettingsCard';
import {
  CityLocation,
  CalculationMethodId,
  UserSettings,
  IqamaTimes,
  PrayerTimeData,
  AppThemeId,
  AutoThemeTriggerMode,
} from '../types';
import { CITIES, CALCULATION_METHODS_LIST } from '../utils/prayerCalculator';
import {
  adhanPlayer,
  AdhanAudioSource,
  ADHAN_SOURCES,
  FAJR_ADHAN_SOURCES,
  DUA_SOURCES,
  getDuaSource,
  ADHKAR_SOURCES,
  SALAWAT_SHEIKH_VOICES,
  SalawatVoiceProfile,
  PRE_ADHAN_SHEIKH_VOICES,
  PreAdhanVoiceProfile,
  IQAMA_SHEIKH_VOICES,
  IqamaVoiceProfile,
  AudioPlayerState,
} from '../utils/audioAdhan';
import {
  getAudioSourcesCacheMap,
  downloadAudioUrlsForOffline,
  removeAudioUrlsFromOffline,
} from '../utils/offlineAudioManager';
import {
  NotificationMosqueTheme,
  getNativeBackgroundReliabilityStatus,
  isNativeAndroidApp,
  isLikelyAndroidTvDevice,
  openNativeAppInfoSettings,
  requestNativeOverlayPermission,
  subscribeNativeResume,
  testNativeBackgroundAlarm,
} from '../utils/nativeAndroidBridge';
import {
  formatQuietTime12Ar,
  isWithinPeriodicQuietHours,
} from '../utils/periodicQuietHours';
import { LIVE_BACKGROUNDS } from '../utils/backgroundsData';
import { APP_THEMES, evaluateAutoThemePeriod, normalizeThemeId } from '../utils/themesData';
import {
  countCompletedFastingDays,
  evaluateFastingCalculator,
  loadFastingIntent,
  loadFastingPreferences,
  saveFastingIntent,
  saveFastingPreferences,
} from '../utils/fastingCalculator';
import {
  WIDGET_SIZES,
  WIDGET_THEMES,
  WidgetStudioConfig,
  loadWidgetConfig,
  saveWidgetConfig,
} from '../utils/widgetStudioData';
import { SHORT_ADHKAR_SHEIKHS, ShortAdhkarSheikhId } from '../utils/shortAdhkarAudio';
import {
  ADHAN_MOSQUE_SCENES,
  AdhanMotionStyle,
  DEFAULT_ENABLED_ADHAN_MOSQUES,
} from '../utils/adhanScenesData';

export type SettingsTabId = 'general' | 'iqama' | 'adhkar' | 'themes' | 'simulations' | 'fasting' | 'widgets' | 'android';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: SettingsTabId;
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  onManualThemeSelect?: (themeId: AppThemeId) => void;
  autoThemeManualPause?: boolean;
  onReEnableAutoTheme?: () => void;
  currentLocation: CityLocation;
  prayerTimes?: PrayerTimeData;
  onSelectCity: (city: CityLocation) => void;
  onOpenBackgroundPicker?: () => void;
  onTestPeriodicReminder?: () => void;
  onTestSalawat?: (voiceMode: string) => void;
  onTestPreAdhan?: (voiceMode: string) => void;
  onTestIqama?: (voiceMode: string, prayerNameAr?: string) => void;
  widgetConfig?: WidgetStudioConfig;
  onUpdateWidgetConfig?: (partial: Partial<WidgetStudioConfig>) => void;
  onOpenWidgetsStudio?: () => void;
  onTestPostPrayerCheckin?: () => void;
  onOpenFullScreenAdhanSimulation?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'general',
  settings,
  onUpdateSettings,
  onManualThemeSelect,
  autoThemeManualPause = false,
  onReEnableAutoTheme,
  currentLocation,
  prayerTimes,
  onSelectCity,
  onOpenBackgroundPicker,
  onTestPeriodicReminder,
  onTestSalawat,
  onTestPreAdhan,
  onTestIqama,
  widgetConfig: controlledWidgetConfig,
  onUpdateWidgetConfig,
  onOpenWidgetsStudio,
  onTestPostPrayerCheckin,
  onOpenFullScreenAdhanSimulation,
}) => {
  const [internalWidgetConfig, setInternalWidgetConfig] = useState<WidgetStudioConfig>(() =>
    loadWidgetConfig()
  );
  const activeWidgetConfig = controlledWidgetConfig ?? internalWidgetConfig;

  const updateWidgetSetting = (partial: Partial<WidgetStudioConfig>) => {
    if (onUpdateWidgetConfig) {
      onUpdateWidgetConfig(partial);
    } else {
      setInternalWidgetConfig((prev) => {
        const next = { ...prev, ...partial };
        saveWidgetConfig(next);
        return next;
      });
    }
  };
  const [playerState, setPlayerState] = useState<AudioPlayerState>('idle');
  const [activeAudioType, setActiveAudioType] = useState<string>('none');
  const [isAudioUnlocked, setIsAudioUnlocked] = useState<boolean>(false);
  const [isUnlocking, setIsUnlocking] = useState<boolean>(false);

  // Local draft state for settings
  const [activeSettingsTab, setActiveSettingsTab] = useState<SettingsTabId>(initialTab);
  const [selectedBgId, setSelectedBgId] = useState<string>(settings.activeBackgroundId || 'makkah_live');
  const [autoDua, setAutoDua] = useState<boolean>(settings.autoDuaAfterAdhan ?? true);
  const [selectedDuaReciter, setSelectedDuaReciter] = useState<string>(
    getDuaSource(settings.duaAudioReciter).id
  );
  const [selectedCalcMethod, setSelectedCalcMethod] = useState<CalculationMethodId>(settings.calculationMethod || 'egypt');
  const [selectedCityId, setSelectedCityId] = useState<string>(currentLocation.id);
  const [selectedAdhanReciter, setSelectedAdhanReciter] = useState<string>(
    settings.adhanReciter && ADHAN_SOURCES[settings.adhanReciter] ? settings.adhanReciter : 'makkah'
  );

  // New Requested Controls:
  const [selectedFajrReciter, setSelectedFajrReciter] = useState<string>(() => {
    const raw = settings.fajrAdhanReciter || 'fajr_makkah';
    if (FAJR_ADHAN_SOURCES[raw]) return raw;
    if (FAJR_ADHAN_SOURCES[`fajr_${raw}`]) return `fajr_${raw}`;
    return 'fajr_makkah';
  });
  const [previewingAdhanKind, setPreviewingAdhanKind] = useState<'regular' | 'fajr' | null>(null);
  const [previewingAdhanReciterId, setPreviewingAdhanReciterId] = useState<string | null>(null);
  const [adhanCacheMap, setAdhanCacheMap] = useState<Record<string, boolean>>({});
  const [downloadingAdhanId, setDownloadingAdhanId] = useState<string | null>(null);
  const [offlineActionMessage, setOfflineActionMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [showOfflineAdhanManager, setShowOfflineAdhanManager] = useState<boolean>(false);
  const [offlineManagerFilter, setOfflineManagerFilter] = useState<'regular' | 'fajr'>('regular');
  const [fajrBoost, setFajrBoost] = useState<boolean>(settings.fajrBoostVolume ?? true);
  const [preReminder, setPreReminder] = useState<number>(settings.preAdhanReminderMinutes ?? 10);
  const [preSound, setPreSound] = useState<boolean>(settings.preAdhanSoundEnabled ?? true);
  const [iqamaTimes, setIqamaTimes] = useState<IqamaTimes>(
    settings.iqamaMinutes || { fajr: 25, dhuhr: 20, asr: 20, maghrib: 10, isha: 20 }
  );
  const [morningTime, setMorningTime] = useState<string>(settings.morningAdhkarTime || '06:00');
  const [eveningTime, setEveningTime] = useState<string>(settings.eveningAdhkarTime || '17:00');
  const [morningAdhkarEnabled, setMorningAdhkarEnabled] = useState<boolean>(settings.morningAdhkarEnabled ?? true);
  const [eveningAdhkarEnabled, setEveningAdhkarEnabled] = useState<boolean>(settings.eveningAdhkarEnabled ?? true);
  const [adhkarAutoPlayAudio, setAdhkarAutoPlayAudio] = useState<boolean>(settings.adhkarAutoPlayAudio ?? true);
  const [selectedAdhkarReciter, setSelectedAdhkarReciter] = useState<string>(settings.adhkarReciter || 'alafasy_adhkar');
  const [selectedShortAdhkarSheikh, setSelectedShortAdhkarSheikh] = useState<ShortAdhkarSheikhId>(
    (settings.adhkarShortSheikh as ShortAdhkarSheikhId) || 'rotate'
  );
  const [previewingAdhkarPeriod, setPreviewingAdhkarPeriod] = useState<'morning' | 'evening' | 'general' | null>(null);
  const [selectedIqamaStyle, setSelectedIqamaStyle] = useState<'ring' | 'split' | 'pill'>(settings.iqamaStyle || 'ring');
  const [selectedAdhanLayout, setSelectedAdhanLayout] = useState<'editorial-horizon' | 'architectural-sanctuary' | 'ambient-aura'>(settings.adhanModalLayout || 'editorial-horizon');
  const [selectedAdhanCountdownStyle, setSelectedAdhanCountdownStyle] = useState<'islamic-mihrab' | 'rub-el-hizb' | 'mashrabiya-arabesque' | 'celestial-astrolabe'>(settings.adhanCountdownStyle || 'islamic-mihrab');
  const [adhanBgAutoRotate, setAdhanBgAutoRotate] = useState<boolean>(settings.adhanBackgroundAutoRotate ?? true);
  const [adhanBgMotionStyle, setAdhanBgMotionStyle] = useState<AdhanMotionStyle>(settings.adhanBackgroundMotionStyle || 'hybrid');
  const [adhanEnabledMosques, setAdhanEnabledMosques] = useState<string[]>(
    settings.adhanEnabledMosques && settings.adhanEnabledMosques.length > 0
      ? settings.adhanEnabledMosques
      : DEFAULT_ENABLED_ADHAN_MOSQUES
  );
  const [periodicEnabled, setPeriodicEnabled] = useState<boolean>(settings.periodicReminderEnabled ?? true);
  const [periodicInterval, setPeriodicInterval] = useState<5 | 10 | 15 | 30 | 60>(settings.periodicReminderInterval ?? 15);
  const [periodicContentType, setPeriodicContentType] = useState<'both' | 'quran' | 'hadith' | 'wisdom'>(settings.periodicReminderContentType || 'both');
  const [periodicOverlayEnabled, setPeriodicOverlayEnabled] = useState<boolean>(settings.periodicOverlayEnabled ?? true);
  const [periodicQuietHoursEnabled, setPeriodicQuietHoursEnabled] = useState<boolean>(settings.periodicQuietHoursEnabled ?? true);
  const [periodicQuietStart, setPeriodicQuietStart] = useState<string>(settings.periodicQuietStart || '23:00');
  const [periodicQuietEnd, setPeriodicQuietEnd] = useState<string>(settings.periodicQuietEnd || '06:00');
  const [periodicSoundEnabled, setPeriodicSoundEnabled] = useState<boolean>(Boolean(settings.periodicReminderSoundEnabled));
  const [overlayGranted, setOverlayGranted] = useState<boolean>(true);
  const [periodicPreviewFeedback, setPeriodicPreviewFeedback] = useState<string | null>(null);
  const [salawatEnabled, setSalawatEnabled] = useState<boolean>(settings.salawatEnabled ?? true);
  const [salawatInterval, setSalawatInterval] = useState<5 | 10 | 15 | 30 | 60>(settings.salawatIntervalMinutes ?? 10);
  const [salawatVoiceMode, setSalawatVoiceMode] = useState<
    'rotate' | 'mishary' | 'dosari' | 'muaiqly' | 'naqshabandi' | 'naqshabandi_radio'
  >(
    settings.salawatVoiceMode &&
      ['rotate', 'mishary', 'dosari', 'muaiqly', 'naqshabandi', 'naqshabandi_radio'].includes(settings.salawatVoiceMode)
      ? settings.salawatVoiceMode
      : 'rotate'
  );
  const [preAdhanVoiceMode, setPreAdhanVoiceMode] = useState<
    'rotate' | 'mishary' | 'dosari' | 'muaiqly' | 'minshawi' | 'abdulbasit' | 'qatami'
  >(
    settings.preAdhanVoiceMode &&
      ['rotate', 'mishary', 'dosari', 'muaiqly', 'minshawi', 'abdulbasit', 'qatami'].includes(
        settings.preAdhanVoiceMode
      )
      ? settings.preAdhanVoiceMode
      : 'rotate'
  );
  const [previewingPreAdhanId, setPreviewingPreAdhanId] = useState<string | null>(null);
  const [previewingSalawatId, setPreviewingSalawatId] = useState<string | null>(null);
  const [salawatErrorMsg, setSalawatErrorMsg] = useState<string | null>(null);

  // Iqama Voice & Auto-Play State
  const [iqamaAutoPlayEnabled, setIqamaAutoPlayEnabled] = useState<boolean>(settings.iqamaAutoPlayEnabled ?? true);
  const [iqamaVoiceMode, setIqamaVoiceMode] = useState<
    'rotate' | 'basnawi' | 'hadrawi' | 'majed_abbas' | 'madinah_haram' | 'faisal_labban' | 'makkah_classic'
  >(
    settings.iqamaVoiceMode &&
      ['rotate', 'basnawi', 'hadrawi', 'majed_abbas', 'madinah_haram', 'faisal_labban', 'makkah_classic'].includes(
        settings.iqamaVoiceMode
      )
      ? settings.iqamaVoiceMode
      : 'rotate'
  );
  const [previewingIqamaId, setPreviewingIqamaId] = useState<string | null>(null);

  // Last Third of the Night Settings
  const [lastThirdEnabled, setLastThirdEnabled] = useState<boolean>(settings.lastThirdNightEnabled ?? true);
  const [lastThirdMode, setLastThirdMode] = useState<'astronomical' | 'before_fajr' | 'custom'>(settings.lastThirdNightMode || 'astronomical');
  const [lastThirdCustomTime, setLastThirdCustomTime] = useState<string>(settings.lastThirdNightCustomTime || '03:00');
  const [lastThirdTheme, setLastThirdTheme] = useState<'celestial' | 'dimmed' | 'oled'>(settings.lastThirdNightTheme || 'dimmed');
  const [lastThirdAutoOpen, setLastThirdAutoOpen] = useState<boolean>(settings.lastThirdAutoOpen ?? false);

  // Smart Auto Day/Night Theme Settings
  const [autoThemeEnabled, setAutoThemeEnabled] = useState<boolean>(settings.autoThemeEnabled ?? false);
  const [autoThemeDayId, setAutoThemeDayId] = useState<AppThemeId>(settings.autoThemeDayId || 'parchment');
  const [autoThemeNightId, setAutoThemeNightId] = useState<AppThemeId>(settings.autoThemeNightId || 'indigo');
  const [autoThemeMode, setAutoThemeMode] = useState<AutoThemeTriggerMode>(settings.autoThemeMode || 'sunrise_maghrib');
  const [autoThemeCustomDayTime, setAutoThemeCustomDayTime] = useState<string>(settings.autoThemeCustomDayTime || '06:00');
  const [autoThemeCustomNightTime, setAutoThemeCustomNightTime] = useState<string>(settings.autoThemeCustomNightTime || '18:00');

  // Fasting & Voluntary Alerts + Ambient StandBy Auto Landscape
  const initialFastingPrefs = loadFastingPreferences();
  const [fastingWhiteDaysEnabled, setFastingWhiteDaysEnabled] = useState<boolean>(
    settings.fastingWhiteDaysEnabled ?? initialFastingPrefs.whiteDaysEnabled
  );
  const [fastingMonThuEnabled, setFastingMonThuEnabled] = useState<boolean>(
    settings.fastingMonThuEnabled ?? initialFastingPrefs.monThuEnabled
  );
  const [fastingAshuraArafahEnabled, setFastingAshuraArafahEnabled] = useState<boolean>(
    settings.fastingAshuraArafahEnabled ?? initialFastingPrefs.ashuraArafahEnabled
  );
  const [showFastingStatsInRecord, setShowFastingStatsInRecord] = useState<boolean>(
    settings.showFastingStatsInRecord ?? initialFastingPrefs.showFastingStatsInRecord
  );
  const [ambientStandbyAutoLandscape, setAmbientStandbyAutoLandscape] = useState<boolean>(
    settings.ambientStandbyAutoLandscape ?? false
  );
  const [postPrayerCheckinEnabled, setPostPrayerCheckinEnabled] = useState<boolean>(
    settings.postPrayerCheckinEnabled ?? true
  );
  const [postPrayerCheckinMinutes, setPostPrayerCheckinMinutes] = useState<15 | 20 | 30>(
    settings.postPrayerCheckinMinutes ?? 20
  );
  const [postPrayerIncludeWird, setPostPrayerIncludeWird] = useState<boolean>(
    settings.postPrayerIncludeWird ?? true
  );
  const [postPrayerIncludeAdhkar, setPostPrayerIncludeAdhkar] = useState<boolean>(
    settings.postPrayerIncludeAdhkar ?? true
  );
  const [postPrayerIncludeSunnah, setPostPrayerIncludeSunnah] = useState<boolean>(
    settings.postPrayerIncludeSunnah ?? true
  );
  const [postPrayerItemGuardNotice, setPostPrayerItemGuardNotice] = useState<string | null>(null);
  const [fastingIntentDraft, setFastingIntentDraft] = useState<boolean>(() => loadFastingIntent());

  // Android Mobile & Android TV (APK) Settings
  const [tvRemoteFocusEnabled, setTvRemoteFocusEnabled] = useState<boolean>(
    settings.tvRemoteFocusEnabled ?? true
  );
  const [keepScreenAwakeAlways, setKeepScreenAwakeAlways] = useState<boolean>(
    settings.keepScreenAwakeAlways ?? false
  );
  const [autoEnterTvDisplay, setAutoEnterTvDisplay] = useState<boolean>(
    settings.autoEnterTvDisplay ?? false
  );
  const [remoteApiBaseUrl, setRemoteApiBaseUrl] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return settings.remoteApiBaseUrl || localStorage.getItem('remote_api_base_url') || '';
  });
  const [stickyNotificationEnabled, setStickyNotificationEnabled] = useState<boolean>(
    settings.stickyNotificationEnabled ?? true
  );
  const [adhanBannerNotificationEnabled, setAdhanBannerNotificationEnabled] = useState<boolean>(
    settings.adhanBannerNotificationEnabled ?? true
  );
  const [notificationMosqueTheme, setNotificationMosqueTheme] = useState<NotificationMosqueTheme>(
    settings.notificationMosqueTheme || 'auto'
  );

  useEffect(() => {
    setIsAudioUnlocked(adhanPlayer.getIsUnlocked());
    const unsub = adhanPlayer.subscribe({
      onStateChange: (st, type) => {
        setPlayerState(st);
        setActiveAudioType(type);
        if ((st !== 'playing' && st !== 'loading') || type !== 'salawat') {
          setPreviewingSalawatId(null);
        }
        if ((st !== 'playing' && st !== 'loading') || type !== 'pre_adhan_reminder') {
          setPreviewingPreAdhanId(null);
        }
        if ((st !== 'playing' && st !== 'loading') || type !== 'iqama') {
          setPreviewingIqamaId(null);
        }
        if ((st !== 'playing' && st !== 'loading') || type !== 'adhan') {
          setPreviewingAdhanKind(null);
          setPreviewingAdhanReciterId(null);
        }
        if ((st !== 'playing' && st !== 'loading') || type !== 'adhkar') {
          setPreviewingAdhkarPeriod(null);
        }
      },
      onError: (msg) => {
        setSalawatErrorMsg(msg);
      },
      onUnlocked: () => setIsAudioUnlocked(true),
    });
    return () => unsub();
  }, []);

  const refreshAdhanCacheMap = React.useCallback(async () => {
    const allSources = [
      ...Object.values(ADHAN_SOURCES),
      ...Object.values(FAJR_ADHAN_SOURCES),
    ].map((src) => ({ id: src.id, urls: src.urls }));
    const nextMap = await getAudioSourcesCacheMap(allSources);
    setAdhanCacheMap(nextMap);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setOfflineActionMessage(null);
    void refreshAdhanCacheMap();
    const handleCacheUpdate = () => {
      void refreshAdhanCacheMap();
    };
    window.addEventListener('offline_audio_cache_updated', handleCacheUpdate);
    return () => {
      window.removeEventListener('offline_audio_cache_updated', handleCacheUpdate);
    };
  }, [isOpen, refreshAdhanCacheMap]);

  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const currentLocationRef = useRef(currentLocation);
  currentLocationRef.current = currentLocation;

  useEffect(() => {
    if (isOpen) {
      setActiveSettingsTab(initialTab || 'general');
      const s = settingsRef.current;
      const loc = currentLocationRef.current;
      setSelectedBgId(s.activeBackgroundId || 'makkah_live');
      setAutoDua(s.autoDuaAfterAdhan ?? true);
      setSelectedDuaReciter(getDuaSource(s.duaAudioReciter).id);
      setSelectedCalcMethod(s.calculationMethod || 'egypt');
      setSelectedCityId(loc.id);
      setSelectedAdhanReciter(
        s.adhanReciter && ADHAN_SOURCES[s.adhanReciter] ? s.adhanReciter : 'makkah'
      );
      const rawFajr = s.fajrAdhanReciter || 'fajr_makkah';
      setSelectedFajrReciter(
        FAJR_ADHAN_SOURCES[rawFajr]
          ? rawFajr
          : FAJR_ADHAN_SOURCES[`fajr_${rawFajr}`]
            ? `fajr_${rawFajr}`
            : 'fajr_makkah'
      );
      setFajrBoost(s.fajrBoostVolume ?? true);
      setPreReminder(s.preAdhanReminderMinutes ?? 10);
      setPreSound(s.preAdhanSoundEnabled ?? true);
      setIqamaTimes(s.iqamaMinutes || { fajr: 25, dhuhr: 20, asr: 20, maghrib: 10, isha: 20 });
      setMorningTime(s.morningAdhkarTime || '06:00');
      setEveningTime(s.eveningAdhkarTime || '17:00');
      setMorningAdhkarEnabled(s.morningAdhkarEnabled ?? true);
      setEveningAdhkarEnabled(s.eveningAdhkarEnabled ?? true);
      setAdhkarAutoPlayAudio(s.adhkarAutoPlayAudio ?? true);
      setSelectedAdhkarReciter(s.adhkarReciter || 'alafasy_adhkar');
      const savedShortSheikh =
        s.adhkarShortSheikh ||
        (typeof window !== 'undefined' ? localStorage.getItem('adhkar_short_sheikh') : null) ||
        'rotate';
      setSelectedShortAdhkarSheikh(
        (SHORT_ADHKAR_SHEIKHS.some((item) => item.id === savedShortSheikh)
          ? savedShortSheikh
          : 'rotate') as ShortAdhkarSheikhId
      );
      setSelectedIqamaStyle(s.iqamaStyle || 'ring');
      setSelectedAdhanLayout(s.adhanModalLayout || 'editorial-horizon');
      setSelectedAdhanCountdownStyle(s.adhanCountdownStyle || 'islamic-mihrab');
      setAdhanBgAutoRotate(s.adhanBackgroundAutoRotate ?? true);
      setAdhanBgMotionStyle(s.adhanBackgroundMotionStyle || 'hybrid');
      setAdhanEnabledMosques(
        s.adhanEnabledMosques && s.adhanEnabledMosques.length > 0
          ? s.adhanEnabledMosques
          : DEFAULT_ENABLED_ADHAN_MOSQUES
      );
      setPeriodicEnabled(s.periodicReminderEnabled ?? true);
      setPeriodicInterval(s.periodicReminderInterval ?? 15);
      setPeriodicContentType(s.periodicReminderContentType || 'both');
      setPeriodicOverlayEnabled(s.periodicOverlayEnabled ?? true);
      setPeriodicQuietHoursEnabled(s.periodicQuietHoursEnabled ?? true);
      setPeriodicQuietStart(s.periodicQuietStart || '23:00');
      setPeriodicQuietEnd(s.periodicQuietEnd || '06:00');
      setPeriodicSoundEnabled(Boolean(s.periodicReminderSoundEnabled));
      setPeriodicPreviewFeedback(null);
      if (isNativeAndroidApp()) {
        void getNativeBackgroundReliabilityStatus().then((st) => {
          setOverlayGranted(st.overlayGranted);
        });
      }
      setSalawatEnabled(s.salawatEnabled ?? true);
      setSalawatInterval(s.salawatIntervalMinutes ?? 10);
      setSalawatVoiceMode(
        s.salawatVoiceMode &&
          ['rotate', 'mishary', 'dosari', 'muaiqly', 'naqshabandi', 'naqshabandi_radio'].includes(s.salawatVoiceMode)
          ? s.salawatVoiceMode
          : 'rotate'
      );
      setPreAdhanVoiceMode(
        s.preAdhanVoiceMode &&
          ['rotate', 'mishary', 'dosari', 'muaiqly', 'minshawi', 'abdulbasit', 'qatami'].includes(
            s.preAdhanVoiceMode
          )
          ? s.preAdhanVoiceMode
          : 'rotate'
      );
      setIqamaAutoPlayEnabled(s.iqamaAutoPlayEnabled ?? true);
      setIqamaVoiceMode(
        s.iqamaVoiceMode &&
          ['rotate', 'basnawi', 'hadrawi', 'majed_abbas', 'madinah_haram', 'faisal_labban', 'makkah_classic'].includes(
            s.iqamaVoiceMode
          )
          ? s.iqamaVoiceMode
          : 'rotate'
      );
      setLastThirdEnabled(s.lastThirdNightEnabled ?? true);
      setLastThirdMode(s.lastThirdNightMode || 'astronomical');
      setLastThirdCustomTime(s.lastThirdNightCustomTime || '03:00');
      setLastThirdTheme(s.lastThirdNightTheme || 'dimmed');
      setLastThirdAutoOpen(s.lastThirdAutoOpen ?? false);
      setAutoThemeEnabled(s.autoThemeEnabled ?? false);
      setAutoThemeDayId(s.autoThemeDayId || 'parchment');
      setAutoThemeNightId(s.autoThemeNightId || 'indigo');
      setAutoThemeMode(s.autoThemeMode || 'sunrise_maghrib');
      setAutoThemeCustomDayTime(s.autoThemeCustomDayTime || '06:00');
      setAutoThemeCustomNightTime(s.autoThemeCustomNightTime || '18:00');
      const fp = loadFastingPreferences();
      setFastingWhiteDaysEnabled(s.fastingWhiteDaysEnabled ?? fp.whiteDaysEnabled);
      setFastingMonThuEnabled(s.fastingMonThuEnabled ?? fp.monThuEnabled);
      setFastingAshuraArafahEnabled(s.fastingAshuraArafahEnabled ?? fp.ashuraArafahEnabled);
      setShowFastingStatsInRecord(s.showFastingStatsInRecord ?? fp.showFastingStatsInRecord);
      setAmbientStandbyAutoLandscape(s.ambientStandbyAutoLandscape ?? false);
      setPostPrayerCheckinEnabled(s.postPrayerCheckinEnabled ?? true);
      setPostPrayerCheckinMinutes(s.postPrayerCheckinMinutes ?? 20);
      setPostPrayerIncludeWird(s.postPrayerIncludeWird ?? true);
      setPostPrayerIncludeAdhkar(s.postPrayerIncludeAdhkar ?? true);
      setPostPrayerIncludeSunnah(s.postPrayerIncludeSunnah ?? true);
      setPostPrayerItemGuardNotice(null);
      setFastingIntentDraft(loadFastingIntent());
      setTvRemoteFocusEnabled(s.tvRemoteFocusEnabled ?? true);
      setKeepScreenAwakeAlways(s.keepScreenAwakeAlways ?? false);
      setAutoEnterTvDisplay(s.autoEnterTvDisplay ?? false);
      setRemoteApiBaseUrl(
        s.remoteApiBaseUrl ||
          (typeof window !== 'undefined' ? localStorage.getItem('remote_api_base_url') || '' : '')
      );
      setStickyNotificationEnabled(s.stickyNotificationEnabled ?? true);
      setAdhanBannerNotificationEnabled(s.adhanBannerNotificationEnabled ?? true);
      setNotificationMosqueTheme(s.notificationMosqueTheme || 'auto');
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (!isOpen || !isNativeAndroidApp()) return;
    const refreshOverlayPerm = () => {
      void getNativeBackgroundReliabilityStatus().then((st) => {
        setOverlayGranted(st.overlayGranted);
      });
    };
    const unsub = subscribeNativeResume(refreshOverlayPerm);
    window.addEventListener('focus', refreshOverlayPerm);
    return () => {
      unsub();
      window.removeEventListener('focus', refreshOverlayPerm);
    };
  }, [isOpen]);

  const tabButtonRefs = useRef<
    Partial<Record<SettingsTabId, HTMLButtonElement | null>>
  >({});

  useEffect(() => {
    if (!isOpen) return;
    const activeBtn = tabButtonRefs.current[activeSettingsTab];
    if (activeBtn && typeof activeBtn.scrollIntoView === 'function') {
      activeBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [isOpen, activeSettingsTab]);

  const handleSelectSettingsTab = (
    tab: SettingsTabId,
    buttonEl?: HTMLButtonElement | null
  ) => {
    setActiveSettingsTab(tab);
    const targetEl = buttonEl || tabButtonRefs.current[tab];
    if (targetEl && typeof targetEl.scrollIntoView === 'function') {
      targetEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  };

  if (!isOpen) return null;

  const handleUnlockAudio = async () => {
    setIsUnlocking(true);
    await adhanPlayer.unlockAudio();
    adhanPlayer.playChime();
    setIsUnlocking(false);
  };

  const handleToggleDuaPreview = () => {
    if ((playerState === 'playing' || playerState === 'loading') && activeAudioType === 'dua') {
      adhanPlayer.stop();
    } else {
      adhanPlayer.playDua(selectedDuaReciter);
    }
  };

  const handleToggleAdhkarPreview = (
    period: 'morning' | 'evening' | 'general' = 'general',
    reciterId: string = selectedAdhkarReciter
  ) => {
    if (
      (playerState === 'playing' || playerState === 'loading') &&
      activeAudioType === 'adhkar' &&
      previewingAdhkarPeriod === period
    ) {
      adhanPlayer.stop();
      setPreviewingAdhkarPeriod(null);
    } else {
      setPreviewingAdhkarPeriod(period);
      const label =
        period === 'morning'
          ? 'أذكار الصباح المباركة'
          : period === 'evening'
            ? 'أذكار المساء المباركة'
            : 'أذكار الصباح والمساء المكتوبة';
      adhanPlayer.playAdhkar(reciterId, label, period);
    }
  };

  const shiftTime24 = (baseTimeStr: string | undefined, offsetMinutes: number, fallback: string): string => {
    if (!baseTimeStr || !baseTimeStr.includes(':')) return fallback;
    const [hRaw, mRaw] = baseTimeStr.split(':').map(Number);
    if (Number.isNaN(hRaw) || Number.isNaN(mRaw)) return fallback;
    const total = (((hRaw * 60 + mRaw + offsetMinutes) % (24 * 60)) + 24 * 60) % (24 * 60);
    const nh = Math.floor(total / 60);
    const nm = total % 60;
    return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
  };

  const handleToggleSample = (reciterKey: string, isFajr: boolean = false) => {
    const kind = isFajr ? 'fajr' : 'regular';
    if (
      (playerState === 'playing' || playerState === 'loading') &&
      activeAudioType === 'adhan' &&
      previewingAdhanKind === kind &&
      previewingAdhanReciterId === reciterKey
    ) {
      adhanPlayer.stop();
      setPreviewingAdhanKind(null);
      setPreviewingAdhanReciterId(null);
    } else {
      setPreviewingAdhanKind(kind);
      setPreviewingAdhanReciterId(reciterKey);
      adhanPlayer.playAdhan(reciterKey, isFajr ? 'fajr' : 'dhuhr', isFajr && fajrBoost, {
        skipAutoCache: true,
        disableAutoDua: true,
      });
    }
  };

  const handleDownloadAdhanOffline = async (source: AdhanAudioSource) => {
    setOfflineActionMessage(null);
    if (typeof navigator !== 'undefined' && !navigator.onLine && !adhanCacheMap[source.id]) {
      setOfflineActionMessage({
        type: 'error',
        text: `لا يوجد اتصال بالإنترنت حالياً لحفظ (${source.nameAr}). تأكد من الاتصال ثم أعد المحاولة.`,
      });
      return;
    }

    setDownloadingAdhanId(source.id);
    try {
      const ok = await downloadAudioUrlsForOffline(source.urls);
      await refreshAdhanCacheMap();
      if (ok) {
        setOfflineActionMessage({
          type: 'success',
          text: `تم حفظ (${source.nameAr}) في ذاكرة الجهاز للعمل بدون إنترنت.`,
        });
      } else {
        setOfflineActionMessage({
          type: 'error',
          text: `تعذّر تنزيل الملف الصوتي لـ (${source.nameAr}) حالياً. حاول مرة أخرى عند توفر اتصال مستقر.`,
        });
      }
    } finally {
      setDownloadingAdhanId(null);
    }
  };

  const handleRemoveAdhanOffline = async (source: AdhanAudioSource) => {
    setOfflineActionMessage(null);
    await removeAudioUrlsFromOffline(source.urls);
    await refreshAdhanCacheMap();
    setOfflineActionMessage({
      type: 'success',
      text: `تمت إزالة (${source.nameAr}) من التخزين المحلي لتوفير المساحة.`,
    });
  };

  const handleTestPreAdhanChime = (voiceIdOrMode: string = preAdhanVoiceMode) => {
    if (
      (playerState === 'playing' || playerState === 'loading') &&
      activeAudioType === 'pre_adhan_reminder' &&
      previewingPreAdhanId === voiceIdOrMode
    ) {
      adhanPlayer.stop();
      setPreviewingPreAdhanId(null);
      return;
    }

    setPreviewingPreAdhanId(voiceIdOrMode);
    if (onTestPreAdhan) {
      onTestPreAdhan(voiceIdOrMode);
    } else {
      adhanPlayer.playPreAdhanReminderSound(voiceIdOrMode);
    }
  };

  const handleToggleSalawatPreview = (voiceIdOrMode: string) => {
    setSalawatErrorMsg(null);
    if (
      (playerState === 'playing' || playerState === 'loading') &&
      activeAudioType === 'salawat' &&
      previewingSalawatId === voiceIdOrMode
    ) {
      adhanPlayer.stop();
      setPreviewingSalawatId(null);
      return;
    }

    setPreviewingSalawatId(voiceIdOrMode);
    if (onTestSalawat) {
      onTestSalawat(voiceIdOrMode);
    } else {
      adhanPlayer.playSalawat(voiceIdOrMode);
    }
  };

  const handleToggleIqamaPreview = (voiceIdOrMode: string = iqamaVoiceMode, prayerNameAr?: string) => {
    if (
      (playerState === 'playing' || playerState === 'loading') &&
      activeAudioType === 'iqama' &&
      previewingIqamaId === voiceIdOrMode
    ) {
      adhanPlayer.stop();
      setPreviewingIqamaId(null);
      return;
    }

    setPreviewingIqamaId(voiceIdOrMode);
    if (onTestIqama) {
      onTestIqama(voiceIdOrMode, prayerNameAr);
    } else {
      adhanPlayer.playIqamaSound(voiceIdOrMode, { isAutoTrigger: false });
    }
  };

  const handleUpdateIqamaDuration = (key: keyof IqamaTimes, rawVal: number) => {
    const safeVal = Math.max(1, Math.min(60, Math.round(Number.isNaN(rawVal) ? 20 : rawVal)));
    const nextTimes: IqamaTimes = { ...iqamaTimes, [key]: safeVal };
    setIqamaTimes(nextTimes);
    onUpdateSettings({ iqamaMinutes: nextTimes });
  };

  const handleResetIqamaDefaults = () => {
    const defaults: IqamaTimes = { fajr: 25, dhuhr: 20, asr: 20, maghrib: 10, isha: 20 };
    setIqamaTimes(defaults);
    onUpdateSettings({ iqamaMinutes: defaults });
  };

  const formatTime12Ar = (timeStr?: string) => {
    if (!timeStr || !timeStr.includes(':')) return '--:--';
    const [hRaw, mRaw] = timeStr.split(':').map(Number);
    if (Number.isNaN(hRaw) || Number.isNaN(mRaw)) return '--:--';
    const suffix = hRaw >= 12 ? 'م' : 'ص';
    const h12 = hRaw % 12 === 0 ? 12 : hRaw % 12;
    return `${h12.toString().padStart(2, '0')}:${mRaw.toString().padStart(2, '0')} ${suffix}`;
  };

  const addMinutesToTimeStr = (timeStr: string | undefined, addMins: number) => {
    if (!timeStr || !timeStr.includes(':')) return '--:--';
    const [hRaw, mRaw] = timeStr.split(':').map(Number);
    if (Number.isNaN(hRaw) || Number.isNaN(mRaw)) return '--:--';
    const total = (hRaw * 60 + mRaw + addMins) % (24 * 60);
    const nh = Math.floor(total / 60);
    const nm = total % 60;
    return formatTime12Ar(`${nh.toString().padStart(2, '0')}:${nm.toString().padStart(2, '0')}`);
  };

  const handleSaveChanges = () => {
    const chosenCity = CITIES.find((c) => c.id === selectedCityId) || currentLocation;
    onSelectCity(chosenCity);
    onUpdateSettings({
      activeBackgroundId: selectedBgId,
      autoDuaAfterAdhan: autoDua,
      duaAudioReciter: selectedDuaReciter,
      calculationMethod: selectedCalcMethod,
      adhanReciter: selectedAdhanReciter,
      fajrAdhanReciter: selectedFajrReciter,
      fajrBoostVolume: fajrBoost,
      preAdhanReminderMinutes: preReminder,
      preAdhanSoundEnabled: preSound,
      preAdhanVoiceMode,
      iqamaMinutes: iqamaTimes,
      iqamaAutoPlayEnabled,
      iqamaVoiceMode,
      morningAdhkarTime: morningTime,
      eveningAdhkarTime: eveningTime,
      morningAdhkarEnabled,
      eveningAdhkarEnabled,
      adhkarAutoPlayAudio,
      adhkarReciter: selectedAdhkarReciter,
      adhkarShortSheikh: selectedShortAdhkarSheikh,
      iqamaStyle: selectedIqamaStyle,
      adhanModalLayout: selectedAdhanLayout,
      adhanCountdownStyle: selectedAdhanCountdownStyle,
      adhanBackgroundAutoRotate: adhanBgAutoRotate,
      adhanBackgroundMotionStyle: adhanBgMotionStyle,
      adhanEnabledMosques,
      periodicReminderEnabled: periodicEnabled,
      periodicReminderInterval: periodicInterval,
      periodicReminderContentType: periodicContentType,
      periodicOverlayEnabled,
      periodicQuietHoursEnabled,
      periodicQuietStart,
      periodicQuietEnd,
      periodicReminderSoundEnabled: periodicSoundEnabled,
      salawatEnabled,
      salawatIntervalMinutes: salawatInterval,
      salawatVoiceMode,
      cityId: chosenCity.id,
      lastThirdNightEnabled: lastThirdEnabled,
      lastThirdNightMode: lastThirdMode,
      lastThirdNightCustomTime: lastThirdCustomTime,
      lastThirdNightTheme: lastThirdTheme,
      lastThirdAutoOpen: lastThirdAutoOpen,
      autoThemeEnabled,
      autoThemeDayId,
      autoThemeNightId,
      autoThemeMode,
      autoThemeCustomDayTime,
      autoThemeCustomNightTime,
      fastingWhiteDaysEnabled,
      fastingMonThuEnabled,
      fastingAshuraArafahEnabled,
      showFastingStatsInRecord,
      ambientStandbyAutoLandscape,
      postPrayerCheckinEnabled,
      postPrayerCheckinMinutes,
      postPrayerIncludeWird,
      postPrayerIncludeAdhkar,
      postPrayerIncludeSunnah,
      tvRemoteFocusEnabled,
      keepScreenAwakeAlways,
      autoEnterTvDisplay,
      remoteApiBaseUrl: remoteApiBaseUrl.trim(),
      stickyNotificationEnabled,
      adhanBannerNotificationEnabled,
      notificationMosqueTheme,
    });
    if (typeof window !== 'undefined') {
      const cleanApi = remoteApiBaseUrl.trim().replace(/\/+$/, '');
      if (cleanApi) {
        localStorage.setItem('remote_api_base_url', cleanApi);
      } else {
        localStorage.removeItem('remote_api_base_url');
      }
    }
    saveFastingPreferences({
      whiteDaysEnabled: fastingWhiteDaysEnabled,
      monThuEnabled: fastingMonThuEnabled,
      ashuraArafahEnabled: fastingAshuraArafahEnabled,
      showFastingStatsInRecord,
    });
    adhanPlayer.setAutoDua(autoDua, selectedDuaReciter);
    onClose();
  };

  const renderAndroidApkSettingsSection = () => {
    const isNativeAndroid = isNativeAndroidApp();
    const isTvDevice = isLikelyAndroidTvDevice();
    return (
      <div className="space-y-5 text-right" dir="rtl">
        {/* Readiness & Runtime Card */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-[#062d24] via-[#041d18] to-[#02100d] border-2 border-[#e5b869]/45 space-y-4 shadow-xl">
          <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-[#e5b869]/20">
            <div className="text-xs text-slate-300 tabular-nums">
              <span>{isNativeAndroid ? 'يعمل كتطبيق أندرويد (APK)' : 'يعمل عبر المتصفح / PWA'}</span>
              <span> · </span>
              <span>{isTvDevice ? 'تم اكتشاف شاشة تلفاز' : 'وضع الهاتف / الحاسوب'}</span>
              <span> · </span>
              <span className="text-[#fbbf24] font-semibold">الحزمة الصوتية الأساسية ~7.1 م.ب</span>
            </div>
            <div className="flex items-center gap-2 text-[#fbbf24]">
              <h4 className="text-lg font-bold font-amiri">تجهيز الأندرويد والشاشات الذكية (APK)</h4>
              <Tv className="w-5 h-5" />
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
            التطبيق مُهيّأ بحزمة موحّدة (Capacitor Android + Leanback TV) للعمل على هواتف الأندرويد وشاشات التلفاز الذكية (Android TV / Google TV) مع تقليم تلقائي للصوتيات للإبقاء على حجم ملف الـ APK خفيفاً وتنزيل باقي الشيوخ اختيارياً من الإعدادات.
          </p>

          {/* Interactive Controls for Mobile & TV */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between gap-4 p-3.5 rounded-2xl bg-[#041814] border border-[#e5b869]/25">
              <button
                type="button"
                role="switch"
                aria-checked={tvRemoteFocusEnabled}
                onClick={() => setTvRemoteFocusEnabled((prev) => !prev)}
                className={`min-h-[44px] min-w-[56px] px-3 rounded-xl text-xs font-bold border transition-colors whitespace-nowrap shrink-0 ${
                  tvRemoteFocusEnabled
                    ? 'bg-emerald-950 border-emerald-400 text-emerald-300'
                    : 'bg-slate-900 border-slate-700 text-slate-400'
                }`}
              >
                {tvRemoteFocusEnabled ? 'مفعّل' : 'معطّل'}
              </button>
              <div className="space-y-0.5 text-right flex-1">
                <div className="text-xs sm:text-sm font-bold text-white">
                  التحكم بريموت التلفاز (D-Pad والتركيز الذهبي)
                </div>
                <div className="text-[11px] text-slate-400">
                  التنقل بالأسهم ومفتاح OK والعودة مع إطار ذهبي واضح لشاشات Android TV والمساجد
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 p-3.5 rounded-2xl bg-[#041814] border border-[#e5b869]/25">
              <button
                type="button"
                role="switch"
                aria-checked={keepScreenAwakeAlways}
                onClick={() => setKeepScreenAwakeAlways((prev) => !prev)}
                className={`min-h-[44px] min-w-[56px] px-3 rounded-xl text-xs font-bold border transition-colors whitespace-nowrap shrink-0 ${
                  keepScreenAwakeAlways
                    ? 'bg-emerald-950 border-emerald-400 text-emerald-300'
                    : 'bg-slate-900 border-slate-700 text-slate-400'
                }`}
              >
                {keepScreenAwakeAlways ? 'مفعّل' : 'معطّل'}
              </button>
              <div className="space-y-0.5 text-right flex-1">
                <div className="text-xs sm:text-sm font-bold text-white">
                  منع إطفاء الشاشة دائماً (Keep-Awake / WakeLock)
                </div>
                <div className="text-[11px] text-slate-400">
                  يُبقي شاشة الموبايل أو التلفاز مضاءة باستمرار لمتابعة المواقيت والعدّ التنازلي
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 p-3.5 rounded-2xl bg-[#041814] border border-[#e5b869]/25">
              <button
                type="button"
                role="switch"
                aria-checked={autoEnterTvDisplay}
                onClick={() => setAutoEnterTvDisplay((prev) => !prev)}
                className={`min-h-[44px] min-w-[56px] px-3 rounded-xl text-xs font-bold border transition-colors whitespace-nowrap shrink-0 ${
                  autoEnterTvDisplay
                    ? 'bg-emerald-950 border-emerald-400 text-emerald-300'
                    : 'bg-slate-900 border-slate-700 text-slate-400'
                }`}
              >
                {autoEnterTvDisplay ? 'مفعّل' : 'معطّل'}
              </button>
              <div className="space-y-0.5 text-right flex-1">
                <div className="text-xs sm:text-sm font-bold text-white">
                  بدء وضع شاشة المسجد والمنضدة تلقائياً عند التشغيل
                </div>
                <div className="text-[11px] text-slate-400">
                  مخصص لشاشات المساجد والمنازل المعلّقة لفتح ساعة المواقيت الكبرى فور تشغيل التطبيق
                </div>
              </div>
            </div>
          </div>

          {/* Optional Cloud Server URL for AI Chat in Standalone APK */}
          <div className="space-y-2 pt-2 border-t border-[#e5b869]/15">
            <label className="block text-xs font-bold text-[#e5b869]">
              رابط خادم المساعد الذكي (اختياري لنسخة الـ APK المستقلة):
            </label>
            <input
              type="url"
              dir="ltr"
              value={remoteApiBaseUrl}
              onChange={(e) => setRemoteApiBaseUrl(e.target.value)}
              placeholder="https://your-app-domain.run.app"
              className="w-full bg-[#021410] border border-[#e5b869]/30 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-[#fbbf24]"
            />
            <p className="text-[11px] text-slate-400">
              جميع المواقيت والقرآن والأذكار والأذان تعمل بدون إنترنت داخل الـ APK؛ يُستخدم هذا الرابط فقط إذا أردت تشغيل تبويب المساعد الشرعي الذكي من داخل التطبيق المستقل.
            </p>
          </div>
        </div>

        <NotificationShadeSettingsCard
          stickyEnabled={stickyNotificationEnabled}
          adhanBannerEnabled={adhanBannerNotificationEnabled}
          mosqueTheme={notificationMosqueTheme}
          onChangeStickyEnabled={(val) => {
            setStickyNotificationEnabled(val);
            onUpdateSettings({ stickyNotificationEnabled: val });
          }}
          onChangeAdhanBannerEnabled={(val) => {
            setAdhanBannerNotificationEnabled(val);
            onUpdateSettings({ adhanBannerNotificationEnabled: val });
          }}
          onChangeMosqueTheme={(val) => {
            setNotificationMosqueTheme(val);
            onUpdateSettings({ notificationMosqueTheme: val });
          }}
          currentLocation={currentLocation}
          prayerTimes={prayerTimes}
        />

        {/* Interactive GitHub Actions, Releases & Android TV / Mobile Step-by-Step Guide */}
        <ApkGuideCard />
      </div>
    );
  };

  const renderWidgetSettingsSection = () => (
    <div
      className="theme-keep-light p-5 rounded-3xl bg-[#111C18] border-2 border-[#D4AF37]/55 space-y-5 shadow-[0_14px_40px_rgba(0,0,0,0.45)] text-right"
      dir="rtl"
    >
      <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-[#D4AF37]/25">
        <div>
          <h4 className="text-lg sm:text-xl font-bold font-amiri text-[#D4AF37]">
            📱 إعدادات الودجات والشاشة الرئيسية
          </h4>
          <p className="text-xs text-slate-300 mt-0.5">
            تُحفظ تلقائياً في localStorage وتتزامن لحظياً مع استوديو الودجات وجسر بيانات الشاشة
          </p>
        </div>
        <span className="text-[11px] font-bold text-[#10B981]">
          {activeWidgetConfig.autoSync ? 'مزامنة تلقائية نشطة' : 'مزامنة يدوية'}
        </span>
      </div>

      {/* 1. Widget Auto-Sync */}
      <div className="flex items-center justify-between gap-4 p-3.5 rounded-2xl bg-[#09120F] border border-[#D4AF37]/25">
        <div className="space-y-0.5 text-right">
          <div className="text-xs sm:text-sm font-bold text-white">
            تفعيل مزامنة الودجات (Widget Auto-Sync)
          </div>
          <div className="text-[11px] text-slate-400">
            تحديث بيانات الودجت في الخلفية تلقائياً عند تغيير الموقع أو طريقة الحساب أو إتمام العبادات
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={activeWidgetConfig.autoSync}
          onClick={() => updateWidgetSetting({ autoSync: !activeWidgetConfig.autoSync })}
          className={`relative w-12 h-7 rounded-full transition-colors shrink-0 border ${
            activeWidgetConfig.autoSync
              ? 'bg-[#10B981] border-emerald-400'
              : 'bg-slate-800 border-slate-600'
          }`}
        >
          <span
            className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
              activeWidgetConfig.autoSync ? 'left-1' : 'right-1'
            }`}
          />
        </button>
      </div>

      {/* 2. Default Widget Size */}
      <div className="space-y-2">
        <div className="text-xs font-bold text-[#D4AF37]">
          الحجم الافتراضي للودجت (Default Widget Size):
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {WIDGET_SIZES.map((s) => {
            const isSelected = activeWidgetConfig.size === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => updateWidgetSetting({ size: s.id })}
                className={`p-3 rounded-2xl border text-right transition-all space-y-1 ${
                  isSelected
                    ? 'bg-[#08241C] border-[#10B981] ring-1 ring-[#10B981]/50 shadow-[0_0_16px_rgba(16,185,129,0.2)]'
                    : 'bg-[#09120F] border-[#D4AF37]/25 hover:border-[#D4AF37]/60'
                }`}
              >
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-[10px] font-mono font-bold text-[#D4AF37] truncate">
                    {s.badgeAr}
                  </span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#10B981] stroke-[3] shrink-0" />}
                </div>
                <div className="text-xs font-bold text-white">{s.nameAr}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Widget Theme */}
      <div className="space-y-2">
        <div className="text-xs font-bold text-[#D4AF37]">
          مظهر وثيم الودجت (Widget Theme):
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {WIDGET_THEMES.map((t) => {
            const isSelected = activeWidgetConfig.theme === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => updateWidgetSetting({ theme: t.id })}
                className={`p-3 rounded-2xl border text-right transition-all flex items-center justify-between gap-2.5 ${
                  isSelected
                    ? 'bg-[#08241C] border-[#10B981] ring-1 ring-[#10B981]/50 shadow-[0_0_16px_rgba(16,185,129,0.2)]'
                    : 'bg-[#09120F] border-[#D4AF37]/25 hover:border-[#D4AF37]/60'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-5 h-5 rounded-md border shrink-0 ${t.swatchClass}`} />
                  <span className="text-xs font-bold text-white truncate">{t.nameAr}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-[#10B981] stroke-[3] shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Data Displayed Inside Widget */}
      <div className="space-y-2">
        <div className="text-xs font-bold text-[#D4AF37]">
          البيانات المعروضة داخل الودجت:
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {[
            {
              key: 'showLiveSeconds' as const,
              label: 'إظهار الثواني الحية في العدّاد التنازلي',
            },
            {
              key: 'showHijriDate' as const,
              label: 'إظهار التاريخ الهجري',
            },
            {
              key: 'showSunnahWird' as const,
              label: 'إظهار مؤشر إنجاز السنن الرواتب والوِرد اليومي',
            },
            {
              key: 'showFastingAlert' as const,
              label: 'إظهار تنبيه صيام التطوع والأيام البيض عند اقتراب موعده',
            },
          ].map((toggle) => {
            const checked = activeWidgetConfig[toggle.key];
            return (
              <button
                key={toggle.key}
                type="button"
                role="switch"
                aria-checked={checked}
                onClick={() => updateWidgetSetting({ [toggle.key]: !checked })}
                className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#09120F] border border-[#D4AF37]/25 hover:border-[#D4AF37]/55 text-right transition-all"
              >
                <span className="text-xs font-bold text-slate-100 leading-snug">
                  {toggle.label}
                </span>
                <div
                  className={`w-10 h-5 rounded-full p-0.5 transition-colors shrink-0 ${
                    checked ? 'bg-[#10B981]' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${
                      checked ? '-translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Auto Refresh Interval */}
      <div className="space-y-2">
        <div className="text-xs font-bold text-[#D4AF37]">
          تكرار التحديث التلقائي (Refresh Interval):
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => updateWidgetSetting({ refreshInterval: '1s' })}
            className={`min-h-[44px] px-4 py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-between ${
              activeWidgetConfig.refreshInterval === '1s'
                ? 'bg-[#08241C] border-[#10B981] text-[#10B981]'
                : 'bg-[#09120F] border-[#D4AF37]/25 text-slate-300 hover:border-[#D4AF37]/60'
            }`}
          >
            <span>تحديث حيّ كل ثانية</span>
            {activeWidgetConfig.refreshInterval === '1s' && (
              <Check className="w-4 h-4 text-[#10B981] stroke-[3]" />
            )}
          </button>
          <button
            type="button"
            onClick={() => updateWidgetSetting({ refreshInterval: '1m' })}
            className={`min-h-[44px] px-4 py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-between ${
              activeWidgetConfig.refreshInterval === '1m'
                ? 'bg-[#08241C] border-[#D4AF37] text-[#D4AF37]'
                : 'bg-[#09120F] border-[#D4AF37]/25 text-slate-300 hover:border-[#D4AF37]/60'
            }`}
          >
            <span>كل دقيقة لتوفير البطارية</span>
            {activeWidgetConfig.refreshInterval === '1m' && (
              <Check className="w-4 h-4 text-[#D4AF37] stroke-[3]" />
            )}
          </button>
        </div>
      </div>

      {/* 6. Direct Studio Launcher Button */}
      {onOpenWidgetsStudio && (
        <div className="pt-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenWidgetsStudio();
            }}
            className="w-full min-h-[46px] px-5 py-3 rounded-2xl bg-[#09120F] hover:bg-[#0d1c17] border-2 border-[#D4AF37] text-[#D4AF37] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-[0_0_24px_rgba(212,175,55,0.18)]"
          >
            <span>🎨 فتح استوديو ومعاينة الودجات على الهاتف</span>
          </button>
        </div>
      )}
    </div>
  );

  const handleTogglePostPrayerChecklistItem = (item: 'wird' | 'adhkar' | 'sunnah') => {
    const activeCount = [
      postPrayerIncludeWird,
      postPrayerIncludeAdhkar,
      postPrayerIncludeSunnah,
    ].filter(Boolean).length;

    const currentVal =
      item === 'wird'
        ? postPrayerIncludeWird
        : item === 'adhkar'
          ? postPrayerIncludeAdhkar
          : postPrayerIncludeSunnah;

    if (currentVal && activeCount <= 1) {
      setPostPrayerItemGuardNotice('يجب الإبقاء على بند واحد على الأقل مفعّلاً داخل الإشعار.');
      return;
    }

    setPostPrayerItemGuardNotice(null);
    const nextVal = !currentVal;

    if (item === 'wird') {
      setPostPrayerIncludeWird(nextVal);
      onUpdateSettings({ postPrayerIncludeWird: nextVal });
    } else if (item === 'adhkar') {
      setPostPrayerIncludeAdhkar(nextVal);
      onUpdateSettings({ postPrayerIncludeAdhkar: nextVal });
    } else {
      setPostPrayerIncludeSunnah(nextVal);
      onUpdateSettings({ postPrayerIncludeSunnah: nextVal });
    }
  };

  const renderPostPrayerCheckinSettingsCard = () => (
    <div
      className="theme-keep-light p-5 rounded-3xl bg-[#111C18] border-2 border-[#D4AF37]/50 space-y-4 sm:col-span-2 shadow-lg text-right"
      dir="rtl"
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h5 className="font-bold text-base text-[#D4AF37] font-amiri flex items-center gap-1.5">
            <span>🕌 إشعارات المتابعة الذكية بعد كل صلاة</span>
          </h5>
          <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
            إشعار تفاعلي يظهر بعد الأذان لتعلّم على الوِرد وأذكار بعد الصلاة والسُّنة، وعند إتمامها تظهر آية قرآنية ثم يختفي تلقائياً
          </p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={postPrayerCheckinEnabled}
          onClick={() => {
            const next = !postPrayerCheckinEnabled;
            setPostPrayerCheckinEnabled(next);
            onUpdateSettings({ postPrayerCheckinEnabled: next });
          }}
          className={`relative w-12 h-7 rounded-full transition-colors shrink-0 border ${
            postPrayerCheckinEnabled
              ? 'bg-[#10B981] border-emerald-400'
              : 'bg-slate-800 border-slate-600'
          }`}
        >
          <span
            className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
              postPrayerCheckinEnabled ? 'left-1' : 'right-1'
            }`}
          />
        </button>
      </div>

      <div className="flex items-center justify-between gap-2 text-xs font-bold text-slate-200 px-1">
        <span>✅ تفعيل إشعار المتابعة بعد كل صلاة</span>
        <span className={postPrayerCheckinEnabled ? 'text-[#10B981]' : 'text-slate-400'}>
          {postPrayerCheckinEnabled ? 'مفعّل' : 'متوقف'}
        </span>
      </div>

      {/* Checklist items selection */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-xs font-bold text-[#D4AF37]">
            البنود الظاهرة للتعليم عليها داخل الإشعار:
          </span>
          <span className="text-[11px] text-slate-300">
            اختر ما تريد متابعته بعد كل صلاة
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {[
            {
              key: 'wird' as const,
              title: 'الوِرد القرآني',
              desc: 'مرتبط بسجل الختمة اليومية',
              checked: postPrayerIncludeWird,
            },
            {
              key: 'adhkar' as const,
              title: 'أذكار بعد الصلاة',
              desc: 'الاستغفار والتسبيح المأثور',
              checked: postPrayerIncludeAdhkar,
            },
            {
              key: 'sunnah' as const,
              title: 'السُّنة الراتبة',
              desc: 'السنن القبلية والبعدية للصلاة',
              checked: postPrayerIncludeSunnah,
            },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              role="switch"
              aria-checked={item.checked}
              onClick={() => handleTogglePostPrayerChecklistItem(item.key)}
              className={`min-h-[56px] p-3 rounded-2xl border text-right transition-colors flex items-center justify-between gap-2.5 ${
                item.checked
                  ? 'bg-[#08241C] border-[#10B981]/75 text-white'
                  : 'bg-[#09120F] border-[#D4AF37]/25 text-slate-300 hover:border-[#D4AF37]/55'
              }`}
            >
              <div className="min-w-0">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>{item.title}</span>
                </div>
                <div className="text-[11px] text-slate-300 mt-0.5 leading-snug">{item.desc}</div>
              </div>

              <span
                className={`px-2 py-1 rounded-lg text-[11px] font-bold shrink-0 border ${
                  item.checked
                    ? 'bg-[#10B981]/20 border-[#10B981]/60 text-[#10B981]'
                    : 'bg-slate-800/70 border-slate-600 text-slate-400'
                }`}
              >
                {item.checked ? 'مفعّل ✓' : 'مخفي'}
              </span>
            </button>
          ))}
        </div>

        {postPrayerItemGuardNotice && (
          <p className="text-xs text-amber-300 font-bold px-1">{postPrayerItemGuardNotice}</p>
        )}
      </div>

      {/* Delay selector */}
      <div className="space-y-2">
        <div className="text-xs font-bold text-[#D4AF37]">
          توقيت ظهور الإشعار بعد الأذان:
        </div>
        <div className="grid grid-cols-3 gap-2">
          {([
            { mins: 15 as const, label: 'بعد ١٥ دقيقة' },
            { mins: 20 as const, label: 'بعد ٢٠ دقيقة' },
            { mins: 30 as const, label: 'بعد ٣٠ دقيقة' },
          ]).map((opt) => {
            const selected = postPrayerCheckinMinutes === opt.mins;
            return (
              <button
                key={opt.mins}
                type="button"
                onClick={() => {
                  setPostPrayerCheckinMinutes(opt.mins);
                  onUpdateSettings({ postPrayerCheckinMinutes: opt.mins });
                }}
                className={`min-h-[44px] px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
                  selected
                    ? 'bg-[#08241C] border-[#10B981] text-[#10B981] shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                    : 'bg-[#09120F] border-[#D4AF37]/25 text-slate-300 hover:border-[#D4AF37]/60'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          onClose();
          onTestPostPrayerCheckin?.();
        }}
        className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#e5b869] to-[#10B981] text-slate-950 font-black text-xs sm:text-sm shadow hover:brightness-105 transition-all flex items-center justify-center gap-2"
      >
        <span>🔔 تجربة إشعار المتابعة الآن</span>
      </button>
    </div>
  );

  const renderAdhkarSettingsSection = () => {
    const morningPresets = [
      {
        id: 'after_fajr',
        label: 'بعد الفجر بـ ١٥ د',
        time: shiftTime24(prayerTimes?.fajr, 15, '05:30'),
      },
      {
        id: 'at_sunrise',
        label: 'عند الشروق',
        time: shiftTime24(prayerTimes?.sunrise, 0, '06:15'),
      },
      {
        id: 'after_sunrise',
        label: 'بعد الشروق بـ ١٥ د',
        time: shiftTime24(prayerTimes?.sunrise, 15, '06:30'),
      },
      {
        id: 'default_morning',
        label: '٠٦:٠٠ ص (افتراضي)',
        time: '06:00',
      },
    ];

    const eveningPresets = [
      {
        id: 'after_asr',
        label: 'بعد العصر بـ ٣٠ د',
        time: shiftTime24(prayerTimes?.asr, 30, '15:45'),
      },
      {
        id: 'before_maghrib',
        label: 'قبل المغرب بـ ٣٠ د',
        time: shiftTime24(prayerTimes?.maghrib, -30, '17:00'),
      },
      {
        id: 'at_maghrib',
        label: 'عند المغرب',
        time: shiftTime24(prayerTimes?.maghrib, 0, '17:30'),
      },
      {
        id: 'default_evening',
        label: '٠٥:٠٠ م (افتراضي)',
        time: '17:00',
      },
    ];

    const currentReciterObj = ADHKAR_SOURCES[selectedAdhkarReciter] || ADHKAR_SOURCES.alafasy_adhkar;
    const isMorningPlaying =
      (playerState === 'playing' || playerState === 'loading') &&
      activeAudioType === 'adhkar' &&
      previewingAdhkarPeriod === 'morning';
    const isEveningPlaying =
      (playerState === 'playing' || playerState === 'loading') &&
      activeAudioType === 'adhkar' &&
      previewingAdhkarPeriod === 'evening';

    return (
      <div className="space-y-6 w-full max-w-full overflow-x-hidden text-right" dir="rtl">
        {/* Header Card */}
        <div className="p-5 md:p-6 rounded-3xl bg-gradient-to-br from-[#062d24] via-[#041d18] to-[#02100d] border-2 border-[#e5b869]/50 shadow-xl space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#fbbf24] to-[#d97706] flex items-center justify-center text-slate-950 shadow-lg shrink-0">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-xl font-bold font-amiri text-[#fbbf24]">
                  ❖ مواعيد وإعدادات أذكار الصباح والمساء ❖
                </h4>
                <p className="text-xs text-slate-300">
                  اضبط توقيت التذكير اليومي لأذكار الصباح والمساء واختر القارئ المفضل وسلوك التشغيل التلقائي
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setMorningAdhkarEnabled(true);
                setEveningAdhkarEnabled(true);
                setMorningTime('06:00');
                setEveningTime('17:00');
                setAdhkarAutoPlayAudio(true);
                setSelectedAdhkarReciter('alafasy_adhkar');
                setSelectedShortAdhkarSheikh('rotate');
                onUpdateSettings({
                  morningAdhkarEnabled: true,
                  eveningAdhkarEnabled: true,
                  morningAdhkarTime: '06:00',
                  eveningAdhkarTime: '17:00',
                  adhkarAutoPlayAudio: true,
                  adhkarReciter: 'alafasy_adhkar',
                  adhkarShortSheikh: 'rotate',
                });
              }}
              className="px-3.5 py-2 rounded-xl bg-[#052921] border border-[#e5b869]/35 text-[#fbbf24] hover:bg-[#07382e] text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>استعادة الافتراضي</span>
            </button>
          </div>

          {/* Morning & Evening Schedule Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Morning Adhkar Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#031713]/90 border border-[#e5b869]/35 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-400/40 flex items-center justify-center text-[#fbbf24] shrink-0">
                    <Sunrise className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-base font-bold text-[#fbbf24] font-amiri">أذكار الصباح</h5>
                    <span className="text-[11px] text-slate-400">
                      {morningAdhkarEnabled ? `مفعّلة · ${formatTime12Ar(morningTime)}` : 'متوقفة مؤقتاً'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={morningAdhkarEnabled}
                  onClick={() => {
                    const next = !morningAdhkarEnabled;
                    setMorningAdhkarEnabled(next);
                    onUpdateSettings({ morningAdhkarEnabled: next });
                  }}
                  className={`relative w-12 h-7 rounded-full transition-colors shrink-0 border ${
                    morningAdhkarEnabled
                      ? 'bg-[#10B981] border-emerald-400'
                      : 'bg-slate-800 border-slate-600'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      morningAdhkarEnabled ? 'left-1' : 'right-1'
                    }`}
                  />
                </button>
              </div>

              <div className={`space-y-3 transition-opacity ${morningAdhkarEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                <label className="block space-y-1.5">
                  <span className="text-xs font-bold text-slate-200 flex items-center justify-between">
                    <span>وقت التنبيه والتشغيل الصباحي:</span>
                    <span className="font-mono text-[#fbbf24]">{formatTime12Ar(morningTime)}</span>
                  </span>
                  <input
                    type="time"
                    dir="ltr"
                    value={morningTime}
                    onChange={(e) => {
                      const val = e.target.value || '06:00';
                      setMorningTime(val);
                      onUpdateSettings({ morningAdhkarTime: val });
                    }}
                    className="w-full min-h-[44px] bg-[#02100d] border border-[#e5b869]/40 rounded-xl px-4 py-2 text-sm font-mono font-bold text-white focus:outline-none focus:border-[#fbbf24]"
                  />
                </label>

                {/* Smart Sunnah Presets */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-[#e5b869]">اختصارات سريعة حسب مواقيت اليوم:</div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {morningPresets.map((preset) => {
                      const active = morningTime === preset.time;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => {
                            setMorningTime(preset.time);
                            onUpdateSettings({ morningAdhkarTime: preset.time });
                          }}
                          className={`px-2.5 py-2 rounded-xl border text-[11px] font-bold transition-all text-right flex items-center justify-between gap-1 ${
                            active
                              ? 'bg-[#073f34] border-[#fbbf24] text-[#fbbf24]'
                              : 'bg-[#02100d] border-[#e5b869]/20 text-slate-300 hover:border-[#e5b869]/50'
                          }`}
                        >
                          <span className="truncate">{preset.label}</span>
                          <span className="font-mono text-[10px] opacity-80 shrink-0">{preset.time}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleAdhkarPreview('morning', selectedAdhkarReciter)}
                  className={`w-full min-h-[40px] px-3 py-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    isMorningPlaying
                      ? 'bg-rose-600 border-rose-500 text-white'
                      : 'bg-[#052921] border-[#e5b869]/40 text-[#fbbf24] hover:bg-[#07382e]'
                  }`}
                >
                  {isMorningPlaying ? (
                    <>
                      <Square className="w-3.5 h-3.5 fill-current" />
                      <span>إيقاف تلاوة أذكار الصباح</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>استماع وتجربة أذكار الصباح</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Evening Adhkar Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#031713]/90 border border-[#e5b869]/35 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-sky-400/40 flex items-center justify-center text-sky-300 shrink-0">
                    <Moon className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-base font-bold text-[#fbbf24] font-amiri">أذكار المساء</h5>
                    <span className="text-[11px] text-slate-400">
                      {eveningAdhkarEnabled ? `مفعّلة · ${formatTime12Ar(eveningTime)}` : 'متوقفة مؤقتاً'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={eveningAdhkarEnabled}
                  onClick={() => {
                    const next = !eveningAdhkarEnabled;
                    setEveningAdhkarEnabled(next);
                    onUpdateSettings({ eveningAdhkarEnabled: next });
                  }}
                  className={`relative w-12 h-7 rounded-full transition-colors shrink-0 border ${
                    eveningAdhkarEnabled
                      ? 'bg-[#10B981] border-emerald-400'
                      : 'bg-slate-800 border-slate-600'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      eveningAdhkarEnabled ? 'left-1' : 'right-1'
                    }`}
                  />
                </button>
              </div>

              <div className={`space-y-3 transition-opacity ${eveningAdhkarEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                <label className="block space-y-1.5">
                  <span className="text-xs font-bold text-slate-200 flex items-center justify-between">
                    <span>وقت التنبيه والتشغيل المسائي:</span>
                    <span className="font-mono text-[#fbbf24]">{formatTime12Ar(eveningTime)}</span>
                  </span>
                  <input
                    type="time"
                    dir="ltr"
                    value={eveningTime}
                    onChange={(e) => {
                      const val = e.target.value || '17:00';
                      setEveningTime(val);
                      onUpdateSettings({ eveningAdhkarTime: val });
                    }}
                    className="w-full min-h-[44px] bg-[#02100d] border border-[#e5b869]/40 rounded-xl px-4 py-2 text-sm font-mono font-bold text-white focus:outline-none focus:border-[#fbbf24]"
                  />
                </label>

                {/* Smart Sunnah Presets */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-[#e5b869]">اختصارات سريعة حسب مواقيت اليوم:</div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {eveningPresets.map((preset) => {
                      const active = eveningTime === preset.time;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => {
                            setEveningTime(preset.time);
                            onUpdateSettings({ eveningAdhkarTime: preset.time });
                          }}
                          className={`px-2.5 py-2 rounded-xl border text-[11px] font-bold transition-all text-right flex items-center justify-between gap-1 ${
                            active
                              ? 'bg-[#073f34] border-[#fbbf24] text-[#fbbf24]'
                              : 'bg-[#02100d] border-[#e5b869]/20 text-slate-300 hover:border-[#e5b869]/50'
                          }`}
                        >
                          <span className="truncate">{preset.label}</span>
                          <span className="font-mono text-[10px] opacity-80 shrink-0">{preset.time}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleAdhkarPreview('evening', selectedAdhkarReciter)}
                  className={`w-full min-h-[40px] px-3 py-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    isEveningPlaying
                      ? 'bg-rose-600 border-rose-500 text-white'
                      : 'bg-[#052921] border-[#e5b869]/40 text-[#fbbf24] hover:bg-[#07382e]'
                  }`}
                >
                  {isEveningPlaying ? (
                    <>
                      <Square className="w-3.5 h-3.5 fill-current" />
                      <span>إيقاف تلاوة أذكار المساء</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>استماع وتجربة أذكار المساء</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Auto-play audio behavior toggle */}
          <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-[#031713]/90 border border-[#e5b869]/30">
            <div className="space-y-0.5 text-right">
              <div className="text-xs sm:text-sm font-bold text-white">
                تشغيل التلاوة الصوتية تلقائياً عند حلول وقت الأذكار
              </div>
              <div className="text-[11px] text-slate-400">
                عند الإيقاف، يظهر إشعار وبطاقة تنبيه فقط في الموعد المحدد دون تشغيل الصوت تلقائياً
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={adhkarAutoPlayAudio}
              onClick={() => {
                const next = !adhkarAutoPlayAudio;
                setAdhkarAutoPlayAudio(next);
                onUpdateSettings({ adhkarAutoPlayAudio: next });
              }}
              className={`relative w-12 h-7 rounded-full transition-colors shrink-0 border ${
                adhkarAutoPlayAudio
                  ? 'bg-[#10B981] border-emerald-400'
                  : 'bg-slate-800 border-slate-600'
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  adhkarAutoPlayAudio ? 'left-1' : 'right-1'
                }`}
              />
            </button>
          </div>

          {/* Full Wird Reciter Selection */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#031713]/90 border border-[#e5b869]/35 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h5 className="text-sm sm:text-base font-bold text-[#fbbf24] font-amiri">
                  القارئ المفضل لوِرد أذكار الصباح والمساء
                </h5>
                <p className="text-[11px] text-slate-400">
                  القارئ المختار حالياً: <strong className="text-emerald-300">{currentReciterObj.nameAr}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggleAdhkarPreview('general', selectedAdhkarReciter)}
                className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
                  (playerState === 'playing' || playerState === 'loading') &&
                  activeAudioType === 'adhkar' &&
                  previewingAdhkarPeriod === 'general'
                    ? 'bg-rose-600 border-rose-500 text-white'
                    : 'bg-[#052921] border-[#e5b869]/40 text-[#fbbf24] hover:bg-[#07382e]'
                }`}
              >
                {(playerState === 'playing' || playerState === 'loading') &&
                activeAudioType === 'adhkar' &&
                previewingAdhkarPeriod === 'general' ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>إيقاف المعاينة</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>معاينة القارئ المختار</span>
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {Object.values(ADHKAR_SOURCES).map((reciter) => {
                const isSelected = selectedAdhkarReciter === reciter.id;
                return (
                  <button
                    key={reciter.id}
                    type="button"
                    onClick={() => {
                      setSelectedAdhkarReciter(reciter.id);
                      onUpdateSettings({ adhkarReciter: reciter.id });
                    }}
                    className={`p-3 rounded-xl border text-right transition-all flex items-center justify-between gap-2.5 ${
                      isSelected
                        ? 'bg-gradient-to-br from-[#073f34] to-[#03221c] border-[#fbbf24] ring-1 ring-[#e5b869]/40'
                        : 'bg-[#02100d] border-[#e5b869]/20 hover:border-[#e5b869]/55'
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-100 leading-snug">{reciter.nameAr}</span>
                    <span
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected ? 'border-[#fbbf24] bg-[#fbbf24]/25' : 'border-slate-600'
                      }`}
                    >
                      {isSelected && <span className="w-2 h-2 rounded-full bg-[#fbbf24]" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Short Clips Sheikh Selection */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#031713]/90 border border-[#e5b869]/30 space-y-2.5">
            <label className="block space-y-1.5">
              <span className="text-xs sm:text-sm font-bold text-[#fbbf24] font-amiri block">
                الشيخ الافتراضي لمقاطع الأذكار القصيرة (في تبويب الأذكار):
              </span>
              <select
                value={selectedShortAdhkarSheikh}
                onChange={(e) => {
                  const val = e.target.value as ShortAdhkarSheikhId;
                  setSelectedShortAdhkarSheikh(val);
                  if (typeof window !== 'undefined') {
                    localStorage.setItem('adhkar_short_sheikh', val);
                  }
                  onUpdateSettings({ adhkarShortSheikh: val });
                }}
                className="w-full bg-[#02100d] border border-[#e5b869]/35 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-[#fbbf24] text-right"
              >
                {SHORT_ADHKAR_SHEIKHS.map((sh) => (
                  <option key={sh.id} value={sh.id}>
                    {sh.nameAr} — {sh.subtitleAr}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-2.5 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-md"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-3xl bg-[#041b16]/95 border-2 border-[#e5b869]/45 rounded-3xl shadow-[0_0_60px_rgba(229,184,105,0.22)] overflow-hidden max-h-[92vh] flex flex-col text-right font-sans backdrop-blur-2xl">
        {/* Inner Double Gold Hairline Border */}
        <div className="absolute inset-1.5 rounded-[20px] border border-[#e5b869]/20 pointer-events-none z-20" />

        {/* Subtle Islamic Geometric Pattern SVG Overlay */}
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.045] pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <pattern id="settings-islamic-pattern" width="80" height="80" patternUnits="userSpaceOnUse">
              <rect x="22" y="22" width="36" height="36" fill="none" stroke="#e5b869" strokeWidth="1" />
              <rect
                x="22"
                y="22"
                width="36"
                height="36"
                fill="none"
                stroke="#e5b869"
                strokeWidth="1"
                transform="rotate(45 40 40)"
              />
              <circle cx="40" cy="40" r="8" fill="none" stroke="#fbbf24" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#settings-islamic-pattern)" />
        </svg>

        {/* Gold Arabesque Corner Ornaments */}
        <svg width="38" height="38" viewBox="0 0 44 44" fill="none" className="absolute top-2.5 right-2.5 text-[#e5b869]/55 pointer-events-none z-20" aria-hidden="true">
          <path d="M2 2H26C20 2 14 8 14 14C14 8 8 14 2 14V2Z" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="9" cy="9" r="2" fill="currentColor" fillOpacity="0.7" />
        </svg>
        <svg width="38" height="38" viewBox="0 0 44 44" fill="none" className="absolute top-2.5 left-2.5 -scale-x-100 text-[#e5b869]/55 pointer-events-none z-20" aria-hidden="true">
          <path d="M2 2H26C20 2 14 8 14 14C14 8 8 14 2 14V2Z" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="9" cy="9" r="2" fill="currentColor" fillOpacity="0.7" />
        </svg>
        <svg width="38" height="38" viewBox="0 0 44 44" fill="none" className="absolute bottom-2.5 right-2.5 -scale-y-100 text-[#e5b869]/55 pointer-events-none z-20" aria-hidden="true">
          <path d="M2 2H26C20 2 14 8 14 14C14 8 8 14 2 14V2Z" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="9" cy="9" r="2" fill="currentColor" fillOpacity="0.7" />
        </svg>
        <svg width="38" height="38" viewBox="0 0 44 44" fill="none" className="absolute bottom-2.5 left-2.5 -scale-x-100 -scale-y-100 text-[#e5b869]/55 pointer-events-none z-20" aria-hidden="true">
          <path d="M2 2H26C20 2 14 8 14 14C14 8 8 14 2 14V2Z" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="9" cy="9" r="2" fill="currentColor" fillOpacity="0.7" />
        </svg>

        {/* Compact Single-Row Header */}
        <div className="relative shrink-0 flex items-center justify-between py-3 px-4 border-b border-[#e5b869]/30 bg-gradient-to-b from-[#07382d] via-[#04241d] to-[#031914] z-20">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="animate-swing drop-shadow-[0_0_10px_rgba(251,191,36,0.85)] shrink-0 pointer-events-none">
              <svg width="20" height="24" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M14 4L9 9H19L14 4Z" fill="#d97706" stroke="#fbbf24" strokeWidth="0.8" />
                <path d="M7 9H21L23 14H5L7 9Z" fill="#b45309" stroke="#fbbf24" strokeWidth="0.8" />
                <path d="M6.5 14H21.5V23.5C21.5 26.5 19 29 14 29C9 29 6.5 26.5 6.5 23.5V14Z" fill="#06372c" stroke="#fbbf24" strokeWidth="1.2" />
                <ellipse cx="14" cy="21" rx="4" ry="5" fill="#fef08a" className="animate-pulse" />
                <path d="M10 29H18L16 32.5H12L10 29Z" fill="#d97706" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-[#fbbf24] font-amiri tracking-wide drop-shadow truncate">
              إعدادات المظهر والتنبيهات
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-[#041d17] border border-[#e5b869]/40 hover:border-[#fbbf24] text-[#fbbf24] flex items-center justify-center transition-colors shrink-0"
            title="إغلاق"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Single-Row Horizontal Scrollable Pills Tabs */}
        <div className="shrink-0 bg-[#031511] border-b border-[#e5b869]/25 z-20">
          <div className="flex flex-nowrap overflow-x-auto gap-2 px-4 py-2 no-scrollbar items-center">
            <button
              ref={(el) => {
                tabButtonRefs.current.general = el;
              }}
              type="button"
              onClick={(e) => handleSelectSettingsTab('general', e.currentTarget)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                activeSettingsTab === 'general'
                  ? 'bg-gradient-to-r from-[#fbbf24] via-[#e5b869] to-emerald-400 text-slate-950 shadow'
                  : 'bg-[#041d17]/70 border border-[#e5b869]/20 text-slate-300 hover:text-[#fbbf24]'
              }`}
            >
              الإعدادات العامة والمظهر
            </button>
            <button
              ref={(el) => {
                tabButtonRefs.current.iqama = el;
              }}
              type="button"
              onClick={(e) => handleSelectSettingsTab('iqama', e.currentTarget)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                activeSettingsTab === 'iqama'
                  ? 'bg-gradient-to-r from-[#fbbf24] via-[#e5b869] to-emerald-400 text-slate-950 shadow'
                  : 'bg-[#041d17]/70 border border-[#e5b869]/20 text-slate-300 hover:text-[#fbbf24]'
              }`}
            >
              <Timer className="w-3.5 h-3.5" />
              <span>الإقامة</span>
            </button>
            <button
              ref={(el) => {
                tabButtonRefs.current.adhkar = el;
              }}
              type="button"
              onClick={(e) => handleSelectSettingsTab('adhkar', e.currentTarget)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                activeSettingsTab === 'adhkar'
                  ? 'bg-gradient-to-r from-[#fbbf24] via-[#e5b869] to-emerald-400 text-slate-950 shadow'
                  : 'bg-[#041d17]/70 border border-[#e5b869]/20 text-slate-300 hover:text-[#fbbf24]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>أذكار الصباح والمساء</span>
            </button>
            <button
              ref={(el) => {
                tabButtonRefs.current.themes = el;
              }}
              type="button"
              onClick={(e) => handleSelectSettingsTab('themes', e.currentTarget)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                activeSettingsTab === 'themes'
                  ? 'bg-gradient-to-r from-[#fbbf24] via-[#e5b869] to-emerald-400 text-slate-950 shadow'
                  : 'bg-[#041d17]/70 border border-[#e5b869]/20 text-slate-300 hover:text-[#fbbf24]'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>المظهر والثيمات</span>
            </button>
            <button
              ref={(el) => {
                tabButtonRefs.current.simulations = el;
              }}
              type="button"
              onClick={(e) => handleSelectSettingsTab('simulations', e.currentTarget)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                activeSettingsTab === 'simulations'
                  ? 'bg-gradient-to-r from-[#fbbf24] via-[#e5b869] to-emerald-400 text-slate-950 shadow'
                  : 'bg-[#041d17]/70 border border-[#e5b869]/20 text-slate-300 hover:text-[#fbbf24]'
              }`}
            >
              محاكاة التنبيهات والأصوات
            </button>
            <button
              ref={(el) => {
                tabButtonRefs.current.fasting = el;
              }}
              type="button"
              onClick={(e) => handleSelectSettingsTab('fasting', e.currentTarget)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                activeSettingsTab === 'fasting'
                  ? 'bg-gradient-to-r from-[#fbbf24] via-[#e5b869] to-emerald-400 text-slate-950 shadow'
                  : 'bg-[#041d17]/70 border border-[#e5b869]/20 text-slate-300 hover:text-[#fbbf24]'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>الصيام والتطوع</span>
            </button>
            <button
              ref={(el) => {
                tabButtonRefs.current.widgets = el;
              }}
              type="button"
              onClick={(e) => handleSelectSettingsTab('widgets', e.currentTarget)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                activeSettingsTab === 'widgets'
                  ? 'bg-gradient-to-r from-[#fbbf24] via-[#e5b869] to-emerald-400 text-slate-950 shadow'
                  : 'bg-[#041d17]/70 border border-[#e5b869]/20 text-slate-300 hover:text-[#fbbf24]'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>الودجات</span>
            </button>
            <button
              ref={(el) => {
                tabButtonRefs.current.android = el;
              }}
              type="button"
              onClick={(e) => handleSelectSettingsTab('android', e.currentTarget)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                activeSettingsTab === 'android'
                  ? 'bg-gradient-to-r from-[#fbbf24] via-[#e5b869] to-emerald-400 text-slate-950 shadow'
                  : 'bg-[#041d17]/70 border border-[#e5b869]/20 text-slate-300 hover:text-[#fbbf24]'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span>الأندرويد والشاشات (APK)</span>
            </button>
          </div>
        </div>

        {/* Scrollable Modal Body */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 py-3 md:px-6 md:py-5 space-y-6 relative z-10 w-full max-w-full">

          {activeSettingsTab === 'adhkar' ? (
            renderAdhkarSettingsSection()
          ) : activeSettingsTab === 'iqama' ? (
            <div className="space-y-6 w-full max-w-full overflow-x-hidden">
              {/* 1. Per-Prayer Iqama Duration Table */}
              <div className="p-5 md:p-6 rounded-3xl bg-gradient-to-br from-[#062d24] via-[#041d18] to-[#02100d] border-2 border-[#e5b869]/50 shadow-xl space-y-5 text-right">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleResetIqamaDefaults}
                    className="px-3.5 py-2 rounded-xl bg-[#052921] border border-[#e5b869]/35 text-[#fbbf24] hover:bg-[#07382e] text-xs font-bold flex items-center gap-1.5 transition-all"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>استعادة الافتراضي</span>
                  </button>

                  <div className="flex items-center gap-3">
                    <div>
                      <h4 className="text-xl font-bold font-amiri text-[#fbbf24]">
                        أوقات الإقامة لكل صلاة (بالدقائق بعد الأذان)
                      </h4>
                      <p className="text-xs text-slate-300">
                        عدّل مدة الانتظار بين الأذان والإقامة لكل صلاة مع معاينة وقت الإقامة المتوقع اليوم
                      </p>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#fbbf24] to-[#d97706] flex items-center justify-center text-slate-950 shadow-lg shrink-0">
                      <Clock className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {([
                    { key: 'fajr', nameAr: 'صلاة الفجر', adhanTime: prayerTimes?.fajr, defaultMins: 25 },
                    { key: 'dhuhr', nameAr: 'صلاة الظهر / الجمعة', adhanTime: prayerTimes?.dhuhr, defaultMins: 20 },
                    { key: 'asr', nameAr: 'صلاة العصر', adhanTime: prayerTimes?.asr, defaultMins: 20 },
                    { key: 'maghrib', nameAr: 'صلاة المغرب', adhanTime: prayerTimes?.maghrib, defaultMins: 10 },
                    { key: 'isha', nameAr: 'صلاة العشاء', adhanTime: prayerTimes?.isha, defaultMins: 20 },
                  ] as const).map((item) => {
                    const mins = iqamaTimes[item.key] ?? item.defaultMins;
                    const adhanDisplay = formatTime12Ar(item.adhanTime);
                    const iqamaDisplay = addMinutesToTimeStr(item.adhanTime, mins);
                    return (
                      <div
                        key={item.key}
                        className="p-3.5 sm:p-4 rounded-2xl bg-[#031713]/90 border border-[#e5b869]/30 flex flex-col md:flex-row md:items-center justify-between gap-3"
                      >
                        {/* Controls: Stepper & Input & Quick Presets */}
                        <div className="flex flex-wrap items-center gap-2 justify-end md:justify-start">
                          <div className="flex items-center gap-1.5 bg-[#02100d] p-1 rounded-xl border border-[#e5b869]/35">
                            <button
                              type="button"
                              onClick={() => handleUpdateIqamaDuration(item.key, mins - 1)}
                              className="min-w-[44px] min-h-[44px] rounded-lg bg-[#052921] hover:bg-[#073f34] text-[#fbbf24] flex items-center justify-center transition-colors border border-[#e5b869]/25"
                              aria-label={`إنقاص وقت إقامة ${item.nameAr}`}
                            >
                              <Minus className="w-4 h-4" />
                            </button>

                            <div className="flex items-center gap-1 px-2">
                              <input
                                type="number"
                                min={1}
                                max={60}
                                value={mins}
                                onChange={(e) => handleUpdateIqamaDuration(item.key, Number(e.target.value))}
                                className="w-12 bg-transparent text-center text-base font-black font-mono tabular-nums text-white focus:outline-none"
                                aria-label={`مدة إقامة ${item.nameAr} بالدقائق`}
                              />
                              <span className="text-[11px] font-bold text-[#e5b869]">دقيقة</span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleUpdateIqamaDuration(item.key, mins + 1)}
                              className="min-w-[44px] min-h-[44px] rounded-lg bg-[#052921] hover:bg-[#073f34] text-[#fbbf24] flex items-center justify-center transition-colors border border-[#e5b869]/25"
                              aria-label={`زيادة وقت إقامة ${item.nameAr}`}
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="flex items-center gap-1">
                            {[10, 15, 20, 25, 30].map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => handleUpdateIqamaDuration(item.key, preset)}
                                className={`px-2.5 py-2 rounded-lg text-[11px] font-bold font-mono tabular-nums border transition-all ${
                                  mins === preset
                                    ? 'bg-[#fbbf24] text-slate-950 border-[#fbbf24]'
                                    : 'bg-[#041814] text-slate-300 border-[#e5b869]/20 hover:border-[#e5b869]/50'
                                }`}
                              >
                                {preset}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Prayer Name & Calculated Times */}
                        <div className="flex items-center justify-between md:justify-end gap-4 text-right">
                          <div className="text-left md:text-right space-y-0.5">
                            <div className="text-[11px] text-slate-400 font-mono tabular-nums">
                              الأذان: <span className="text-slate-200 font-semibold">{adhanDisplay}</span>
                            </div>
                            <div className="text-xs text-emerald-300 font-bold font-mono tabular-nums">
                              الإقامة المتوقعة: {iqamaDisplay}
                            </div>
                          </div>

                          <div className="min-w-[115px] text-right">
                            <div className="text-sm sm:text-base font-bold text-white font-amiri">
                              {item.nameAr}
                            </div>
                            <div className="text-[11px] text-[#e5b869]">
                              بعد الأذان بـ {mins} د
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. Real Sheikh Voices for Iqama & Auto-Play */}
              <div className="p-5 md:p-6 rounded-3xl bg-[#03201a]/85 border border-[#e5b869]/40 space-y-5 shadow-lg text-right">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleIqamaPreview(iqamaVoiceMode, 'العصر')}
                    className={`text-xs px-4 py-2.5 rounded-xl border font-bold flex items-center gap-1.5 transition-all ${
                      (playerState === 'playing' || playerState === 'loading') && activeAudioType === 'iqama'
                        ? 'bg-rose-600 border-rose-500 text-white'
                        : 'bg-[#052921] border-[#e5b869]/40 text-[#fbbf24] hover:bg-[#07382e]'
                    }`}
                  >
                    {playerState === 'loading' && activeAudioType === 'iqama' ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>جاري تحضير الصوت...</span>
                      </>
                    ) : playerState === 'playing' && activeAudioType === 'iqama' ? (
                      <>
                        <Square className="w-3.5 h-3.5 fill-current" />
                        <span>إيقاف صوت الإقامة</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>تجربة صوت الإقامة الآن</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-2 text-[#fbbf24] font-bold text-base font-amiri">
                    <span className="text-lg">أصوات إقامة الصلاة (أصوات شيوخ حقيقية من الحرمين)</span>
                    <Volume2 className="w-5 h-5 text-[#fbbf24]" />
                  </div>
                </div>

                {/* Auto-Play Toggle */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#041814] border border-[#e5b869]/25">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={iqamaAutoPlayEnabled}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setIqamaAutoPlayEnabled(checked);
                        onUpdateSettings({ iqamaAutoPlayEnabled: checked });
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-[#fbbf24] peer-checked:to-emerald-500"></div>
                  </label>
                  <div className="text-right">
                    <span className="text-xs sm:text-sm text-slate-100 font-bold block">
                      تشغيل صوت الإقامة تلقائياً عند انتهاء عداد الإقامة (00:00)
                    </span>
                    <span className="text-[11px] text-slate-400">
                      ينطلق نداء الإقامة بصوت الشيخ المختار تلقائياً مع بطاقة تذكير أسفل الشاشة فور انتهاء العداد
                    </span>
                  </div>
                </div>

                {/* Auto-Rotate Multi-Sheikh Option */}
                <button
                  type="button"
                  onClick={() => {
                    setIqamaVoiceMode('rotate');
                    onUpdateSettings({ iqamaVoiceMode: 'rotate' });
                  }}
                  className={`w-full p-3.5 rounded-2xl border text-right transition-all flex items-center justify-between gap-3 ${
                    iqamaVoiceMode === 'rotate'
                      ? 'bg-gradient-to-br from-[#073f34] to-[#03221c] border-[#fbbf24] ring-2 ring-[#e5b869]/40 shadow-[0_0_20px_rgba(229,184,105,0.18)]'
                      : 'bg-[#041814]/90 border-[#e5b869]/20 hover:border-[#e5b869]/50'
                  }`}
                >
                  <span className="px-2.5 py-1 rounded-lg bg-[#fbbf24]/20 border border-[#fbbf24]/40 text-[#fbbf24] text-[11px] font-bold shrink-0">
                    متنوع تلقائياً
                  </span>
                  <div className="flex-1 text-right">
                    <div className="text-sm font-bold text-white font-amiri">
                      التبديل التلقائي بين أصوات الشيوخ الستة لإقامة الصلاة
                    </div>
                    <div className="text-[11px] text-slate-300 mt-0.5">
                      يتغيّر صوت المؤذن للإقامة في كل صلاة تلقائياً (أحمد بصنوي · فاروق حضراوي · ماجد العباس · المسجد النبوي · فيصل اللبان · الحرمين)
                    </div>
                  </div>
                  <span
                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                      iqamaVoiceMode === 'rotate' ? 'border-[#fbbf24] bg-[#fbbf24]/25' : 'border-slate-600'
                    }`}
                  >
                    {iqamaVoiceMode === 'rotate' && <span className="w-2 h-2 rounded-full bg-[#fbbf24]" />}
                  </span>
                </button>

                {/* Individual Real Sheikh Iqama Voice Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {IQAMA_SHEIKH_VOICES.map((voice: IqamaVoiceProfile) => {
                    const isSelected = iqamaVoiceMode === voice.id;
                    const isThisPlaying =
                      playerState === 'playing' &&
                      activeAudioType === 'iqama' &&
                      previewingIqamaId === voice.id;
                    const isThisLoading =
                      playerState === 'loading' &&
                      activeAudioType === 'iqama' &&
                      previewingIqamaId === voice.id;
                    return (
                      <div
                        key={voice.id}
                        onClick={() => {
                          setIqamaVoiceMode(voice.id);
                          onUpdateSettings({ iqamaVoiceMode: voice.id });
                        }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setIqamaVoiceMode(voice.id);
                            onUpdateSettings({ iqamaVoiceMode: voice.id });
                          }
                        }}
                        className={`p-3 rounded-xl border text-right transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                          isSelected
                            ? 'bg-gradient-to-br from-[#073f34] to-[#03221c] border-[#fbbf24] ring-1 ring-[#e5b869]/40'
                            : 'bg-[#041814]/90 border-[#e5b869]/20 hover:border-[#e5b869]/50'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleIqamaPreview(voice.id);
                          }}
                          className={`min-h-[40px] px-3 py-1.5 rounded-lg border text-[11px] font-bold flex items-center gap-1 shrink-0 transition-all ${
                            isThisPlaying || isThisLoading
                              ? 'bg-[#fbbf24] text-slate-950 border-[#fbbf24]'
                              : 'bg-[#031914] text-[#fbbf24] border-[#e5b869]/35 hover:border-[#fbbf24]'
                          }`}
                          title={`استماع لإقامة ${voice.nameAr}`}
                        >
                          {isThisLoading ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              <span>تحضير...</span>
                            </>
                          ) : isThisPlaying ? (
                            <>
                              <Square className="w-3 h-3 fill-current" />
                              <span>إيقاف</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3 h-3 fill-current" />
                              <span>استماع</span>
                            </>
                          )}
                        </button>

                        <div className="flex-1 min-w-0 text-right">
                          <div className="text-xs font-bold text-white truncate">{voice.nameAr}</div>
                          <div className="text-[11px] text-slate-400 truncate mt-0.5">{voice.styleAr}</div>
                        </div>

                        <span
                          className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                            isSelected ? 'border-[#fbbf24] bg-[#fbbf24]/25' : 'border-slate-600'
                          }`}
                        >
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#fbbf24]" />}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Iqama Counter Visual Style inside Iqama Tab */}
                <div className="pt-3 border-t border-[#e5b869]/20 space-y-2.5">
                  <div className="flex items-center justify-end gap-2 text-sm text-[#e5b869] font-bold font-amiri">
                    <span>مظهر عدّاد الإقامة في الشاشة الرئيسية:</span>
                    <Timer className="w-4 h-4" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {[
                      { id: 'ring', name: 'الحلقة الفلكية الذهبية' },
                      { id: 'split', name: 'بطاقات التوقيت المنفصلة' },
                      { id: 'pill', name: 'الكبسولة الزجاجية المينيمال' },
                    ].map((style) => {
                      const isSelected = selectedIqamaStyle === style.id;
                      return (
                        <button
                          key={style.id}
                          type="button"
                          onClick={() => {
                            const val = style.id as 'ring' | 'split' | 'pill';
                            setSelectedIqamaStyle(val);
                            onUpdateSettings({ iqamaStyle: val });
                          }}
                          className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                            isSelected
                              ? 'bg-[#073f34] border-[#fbbf24] text-[#fbbf24] ring-1 ring-[#e5b869]/40'
                              : 'bg-[#041814] border-[#e5b869]/20 text-slate-300 hover:border-[#e5b869]/45'
                          }`}
                        >
                          {style.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ) : activeSettingsTab === 'themes' ? (
            <div className="space-y-6 w-full max-w-full overflow-x-hidden">
              <div className="p-6 rounded-3xl bg-gradient-to-br from-[#062d24] via-[#041d18] to-[#02100d] border-2 border-[#e5b869]/50 shadow-xl space-y-5 text-right">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <span className="text-[11px] font-semibold text-emerald-300">
                    انتقال سلس وحفظ تلقائي في المتصفح
                  </span>
                  <div className="flex items-center gap-3">
                    <div>
                      <h4 className="text-xl font-bold font-amiri text-[#fbbf24]">
                        المظهر والثيمات الأربعة
                      </h4>
                      <p className="text-xs text-slate-300">
                        اختر الهوية اللونية المفضلة للتطبيق مع الحفاظ الكامل على الزخارف والتخطيط
                      </p>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#fbbf24] to-[#d97706] flex items-center justify-center text-slate-950 shadow-lg shrink-0">
                      <Palette className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {/* 2x2 Themes Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {APP_THEMES.map((themeItem) => {
                    const activeTheme = normalizeThemeId(settings.theme);
                    const isSelected = activeTheme === themeItem.id;
                    return (
                      <button
                        key={themeItem.id}
                        type="button"
                        onClick={() =>
                          onManualThemeSelect
                            ? onManualThemeSelect(themeItem.id)
                            : onUpdateSettings({ theme: themeItem.id })
                        }
                        className={`relative p-4 rounded-2xl border-2 text-right transition-all flex flex-col justify-between gap-4 ${
                          isSelected
                            ? 'bg-gradient-to-br from-[#073f34] to-[#03221c] border-[#fbbf24] ring-2 ring-[#e5b869]/45 shadow-[0_0_24px_rgba(229,184,105,0.22)]'
                            : 'bg-[#031713]/90 border-[#e5b869]/25 hover:border-[#e5b869]/60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 w-full">
                          <span
                            className={`w-7 h-7 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                              isSelected
                                ? 'bg-emerald-500 border-emerald-300 text-slate-950 shadow'
                                : 'bg-[#041d17] border-[#e5b869]/30 text-transparent'
                            }`}
                          >
                            <Check className="w-4 h-4 stroke-[3]" />
                          </span>

                          <div className="flex-1 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {themeItem.isLight && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold">
                                  نهاري
                                </span>
                              )}
                              <h5 className="text-base font-bold text-white font-amiri">
                                {themeItem.nameAr}
                              </h5>
                            </div>
                            <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                              {themeItem.subtitleAr}
                            </p>
                          </div>
                        </div>

                        {/* Miniature Color Swatches */}
                        <div className="flex items-center justify-between pt-3 border-t border-[#e5b869]/20 w-full">
                          <span className="text-[11px] font-bold text-[#e5b869]">
                            {isSelected ? 'الثيم النشط حالياً' : 'انقر للتطبيق'}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {themeItem.swatches.map((hex, sIdx) => (
                              <span
                                key={sIdx}
                                className="theme-swatch w-5 h-5 rounded-full border border-white/30 shadow-sm"
                                style={{ backgroundColor: hex }}
                                title={hex}
                              />
                            ))}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Mosque Live Backgrounds Shortcut */}
                {onOpenBackgroundPicker && (
                  <div className="pt-3 border-t border-[#e5b869]/20 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={onOpenBackgroundPicker}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#05261f] border border-[#e5b869]/40 text-[#fbbf24] hover:bg-[#07362c] font-bold text-xs flex items-center justify-center gap-2 transition-all"
                    >
                      <ImageIcon className="w-4 h-4" />
                      <span>اختيار خلفيات المساجد ودرجة الضبابية</span>
                    </button>
                    <p className="text-xs text-slate-300 text-right">
                      يمكنك أيضاً التبديل السريع بين الثيمات مباشرة من أيقونة الصورة في الشريط العلوي
                    </p>
                  </div>
                )}
              </div>

              {/* ❖ Smart Auto Day/Night Theme Section ❖ */}
              {(() => {
                const autoEval = evaluateAutoThemePeriod({
                  mode: autoThemeMode,
                  sunriseStr: prayerTimes?.sunrise,
                  maghribStr: prayerTimes?.maghrib,
                  customDayTime: autoThemeCustomDayTime,
                  customNightTime: autoThemeCustomNightTime,
                  dayThemeId: autoThemeDayId,
                  nightThemeId: autoThemeNightId,
                });
                const isLiveAuto = autoThemeEnabled && !autoThemeManualPause;

                return (
                  <div className="p-6 rounded-3xl bg-gradient-to-br from-[#062d24] via-[#041d18] to-[#02100d] border-2 border-[#e5b869]/50 shadow-xl space-y-5 text-right">
                    {/* Header + Active Status Badge */}
                    <div className="flex items-start justify-between flex-wrap gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {autoThemeEnabled && autoThemeManualPause ? (
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-400/50 text-amber-300 text-xs font-bold">
                            <span>⏸️ متوقف مؤقتاً لاختيار يدوي</span>
                            {onReEnableAutoTheme && (
                              <button
                                type="button"
                                onClick={onReEnableAutoTheme}
                                className="underline text-[#fbbf24] hover:text-white mr-1"
                              >
                                إعادة التفعيل
                              </button>
                            )}
                          </div>
                        ) : (
                          <span
                            className={`px-3.5 py-1.5 rounded-full text-xs font-bold border ${
                              isLiveAuto
                                ? 'bg-emerald-950/80 border-emerald-400/50 text-emerald-300 shadow-sm'
                                : 'bg-[#031713]/90 border-[#e5b869]/30 text-slate-300'
                            }`}
                          >
                            {isLiveAuto
                              ? autoEval.statusBadgeAr
                              : `متوقف · عند التفعيل: ${autoEval.statusBadgeAr}`}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 mr-auto">
                        <div>
                          <h4 className="text-xl font-bold font-amiri text-[#fbbf24]">
                            ❖ مظهر النهار والليل التلقائي ❖
                          </h4>
                          <p className="text-xs text-slate-300">
                            تحويل سلس ومريح للعين بين ثيم النهار وثيم الليل تلقائياً
                          </p>
                        </div>
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#fbbf24] to-[#d97706] flex items-center justify-center text-slate-950 shadow-lg shrink-0">
                          {autoEval.isDayPeriod ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </div>
                      </div>
                    </div>

                    {/* 1. Main Toggle Switch */}
                    <div
                      onClick={() => {
                        const nextEnabled = !autoThemeEnabled;
                        setAutoThemeEnabled(nextEnabled);
                        onUpdateSettings({ autoThemeEnabled: nextEnabled });
                      }}
                      role="switch"
                      aria-checked={autoThemeEnabled}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          const nextEnabled = !autoThemeEnabled;
                          setAutoThemeEnabled(nextEnabled);
                          onUpdateSettings({ autoThemeEnabled: nextEnabled });
                        }
                      }}
                      className={`min-h-[56px] p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between gap-4 ${
                        autoThemeEnabled
                          ? 'bg-[#073a2f]/90 border-[#fbbf24]/70 shadow-[0_0_20px_rgba(229,184,105,0.16)]'
                          : 'bg-[#031713]/90 border-[#e5b869]/25 hover:border-[#e5b869]/50'
                      }`}
                    >
                      <div
                        className={`w-14 h-8 rounded-full p-1 transition-colors flex items-center shrink-0 ${
                          autoThemeEnabled ? 'bg-emerald-500 justify-start' : 'bg-slate-700 justify-end'
                        }`}
                      >
                        <span className="w-6 h-6 rounded-full bg-white shadow-md transition-transform" />
                      </div>

                      <div className="flex-1 text-right">
                        <div className="text-sm font-bold text-white">
                          التبديل التلقائي حسب توقيت الشمس
                        </div>
                        <div className="text-[11px] text-slate-300 mt-0.5">
                          يفحص التطبيق التوقيت عند التشغيل وكل دقيقة لتبديل المظهر بسلاسة دون انقطاع
                        </div>
                      </div>
                    </div>

                    {/* 2 & 3. Day Theme & Night Theme Pickers */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Day Theme Selector */}
                      <div className="p-4 rounded-2xl bg-[#031713]/90 border border-[#e5b869]/30 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-amber-300">
                            {APP_THEMES.find((t) => t.id === autoThemeDayId)?.nameAr}
                          </span>
                          <div className="flex items-center gap-1.5 text-sm font-bold text-[#fbbf24] font-amiri">
                            <span>ثيم النهار</span>
                            <Sun className="w-4 h-4 text-[#fbbf24]" />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                          {APP_THEMES.map((themeItem) => {
                            const selectedDay = autoThemeDayId === themeItem.id;
                            return (
                              <button
                                key={`day-${themeItem.id}`}
                                type="button"
                                onClick={() => {
                                  setAutoThemeDayId(themeItem.id);
                                  onUpdateSettings({ autoThemeDayId: themeItem.id });
                                }}
                                className={`min-h-[44px] px-3 py-2 rounded-xl border text-right transition-all flex items-center justify-between gap-2 ${
                                  selectedDay
                                    ? 'bg-[#073f34] border-[#fbbf24] text-white shadow'
                                    : 'bg-[#041d17] border-[#e5b869]/20 text-slate-300 hover:border-[#e5b869]/55'
                                }`}
                              >
                                <div className="flex items-center gap-1 shrink-0">
                                  {themeItem.swatches.slice(0, 3).map((hex, i) => (
                                    <span
                                      key={i}
                                      className="theme-swatch w-3.5 h-3.5 rounded-full border border-white/30"
                                      style={{ backgroundColor: hex }}
                                    />
                                  ))}
                                </div>
                                <div className="flex items-center gap-1.5 flex-1 justify-end">
                                  {themeItem.id === 'parchment' && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                                      افتراضي للنهار
                                    </span>
                                  )}
                                  <span className="text-xs font-bold">{themeItem.nameAr}</span>
                                  {selectedDay && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Night Theme Selector */}
                      <div className="p-4 rounded-2xl bg-[#031713]/90 border border-[#e5b869]/30 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-sky-300">
                            {APP_THEMES.find((t) => t.id === autoThemeNightId)?.nameAr}
                          </span>
                          <div className="flex items-center gap-1.5 text-sm font-bold text-[#fbbf24] font-amiri">
                            <span>ثيم الليل</span>
                            <Moon className="w-4 h-4 text-sky-300" />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                          {APP_THEMES.map((themeItem) => {
                            const selectedNight = autoThemeNightId === themeItem.id;
                            return (
                              <button
                                key={`night-${themeItem.id}`}
                                type="button"
                                onClick={() => {
                                  setAutoThemeNightId(themeItem.id);
                                  onUpdateSettings({ autoThemeNightId: themeItem.id });
                                }}
                                className={`min-h-[44px] px-3 py-2 rounded-xl border text-right transition-all flex items-center justify-between gap-2 ${
                                  selectedNight
                                    ? 'bg-[#073f34] border-[#fbbf24] text-white shadow'
                                    : 'bg-[#041d17] border-[#e5b869]/20 text-slate-300 hover:border-[#e5b869]/55'
                                }`}
                              >
                                <div className="flex items-center gap-1 shrink-0">
                                  {themeItem.swatches.slice(0, 3).map((hex, i) => (
                                    <span
                                      key={i}
                                      className="theme-swatch w-3.5 h-3.5 rounded-full border border-white/30"
                                      style={{ backgroundColor: hex }}
                                    />
                                  ))}
                                </div>
                                <div className="flex items-center gap-1.5 flex-1 justify-end">
                                  {themeItem.id === 'indigo' && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 font-bold">
                                      افتراضي لليل
                                    </span>
                                  )}
                                  <span className="text-xs font-bold">{themeItem.nameAr}</span>
                                  {selectedNight && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* 4. Trigger Mode Selection */}
                    <div className="p-4 rounded-2xl bg-[#031713]/90 border border-[#e5b869]/30 space-y-3">
                      <div className="flex items-center justify-end gap-2 text-sm font-bold text-[#fbbf24] font-amiri">
                        <span>تحديد وقت التحول</span>
                        <Clock className="w-4 h-4 text-[#fbbf24]" />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Sunrise & Maghrib Recommended Option */}
                        <button
                          type="button"
                          onClick={() => {
                            setAutoThemeMode('sunrise_maghrib');
                            onUpdateSettings({ autoThemeMode: 'sunrise_maghrib' });
                          }}
                          className={`min-h-[56px] p-3.5 rounded-xl border-2 text-right transition-all flex flex-col justify-between gap-1.5 ${
                            autoThemeMode === 'sunrise_maghrib'
                              ? 'bg-[#073f34] border-[#fbbf24] shadow'
                              : 'bg-[#041d17] border-[#e5b869]/25 hover:border-[#e5b869]/60'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 w-full">
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-bold">
                              مُوصى به
                            </span>
                            <span className="text-xs font-bold text-white">
                              تلقائي حسب الشروق والمغرب
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 leading-relaxed">
                            حسب مواقيت {currentLocation.nameAr}: الشروق{' '}
                            <strong className="text-[#fbbf24]">{formatTime12Ar(prayerTimes?.sunrise)}</strong> · المغرب{' '}
                            <strong className="text-[#fbbf24]">{formatTime12Ar(prayerTimes?.maghrib)}</strong>
                          </p>
                        </button>

                        {/* Custom Manual Schedule Option */}
                        <button
                          type="button"
                          onClick={() => {
                            setAutoThemeMode('custom');
                            onUpdateSettings({ autoThemeMode: 'custom' });
                          }}
                          className={`min-h-[56px] p-3.5 rounded-xl border-2 text-right transition-all flex flex-col justify-between gap-1.5 ${
                            autoThemeMode === 'custom'
                              ? 'bg-[#073f34] border-[#fbbf24] shadow'
                              : 'bg-[#041d17] border-[#e5b869]/25 hover:border-[#e5b869]/60'
                          }`}
                        >
                          <div className="flex items-center justify-end gap-2 w-full">
                            <span className="text-xs font-bold text-white">
                              توقيت يدوي مخصص
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 leading-relaxed">
                            تحديد ساعة بداية النهار ({autoThemeCustomDayTime}) وبداية الليل ({autoThemeCustomNightTime}) يدوياً
                          </p>
                        </button>
                      </div>

                      {autoThemeMode === 'custom' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#e5b869]/20">
                          <label className="flex flex-col gap-1.5 text-right">
                            <span className="text-xs font-bold text-amber-300">
                              ☀️ ساعة بداية النهار
                            </span>
                            <input
                              type="time"
                              dir="ltr"
                              value={autoThemeCustomDayTime}
                              onChange={(e) => {
                                const val = e.target.value || '06:00';
                                setAutoThemeCustomDayTime(val);
                                onUpdateSettings({ autoThemeCustomDayTime: val });
                              }}
                              className="min-h-[44px] w-full bg-[#021410] border border-[#e5b869]/40 rounded-xl px-3.5 py-2 text-sm font-mono font-bold text-white focus:outline-none focus:border-[#fbbf24]"
                            />
                          </label>

                          <label className="flex flex-col gap-1.5 text-right">
                            <span className="text-xs font-bold text-sky-300">
                              🌙 ساعة بداية الليل
                            </span>
                            <input
                              type="time"
                              dir="ltr"
                              value={autoThemeCustomNightTime}
                              onChange={(e) => {
                                const val = e.target.value || '18:00';
                                setAutoThemeCustomNightTime(val);
                                onUpdateSettings({ autoThemeCustomNightTime: val });
                              }}
                              className="min-h-[44px] w-full bg-[#021410] border border-[#e5b869]/40 rounded-xl px-3.5 py-2 text-sm font-mono font-bold text-white focus:outline-none focus:border-[#fbbf24]"
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : activeSettingsTab === 'fasting' ? (
            <div className="space-y-6 w-full max-w-full overflow-x-hidden">
              <div className="p-6 rounded-3xl bg-gradient-to-br from-[#062d24] via-[#041d18] to-[#02100d] border-2 border-[#e5b869]/50 shadow-xl space-y-6 text-right">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#fbbf24] to-[#d97706] flex items-center justify-center text-slate-950 shadow-lg shrink-0">
                      <Moon className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold font-amiri text-[#fbbf24]">
                        ❖ الصيام والتطوع ❖
                      </h4>
                      <p className="text-xs text-slate-300">
                        تخصيص التنبيهات التلقائية لمواسم صيام التطوع وعرض عداد أيام الصيام المنجزة في الإحصائيات
                      </p>
                    </div>
                  </div>
                  <div className="px-4 py-2 rounded-xl bg-[#111C18] border border-[#D4AF37]/40 text-xs text-[#F3CA63] font-bold">
                    أيام الصيام المنجزة: <span className="font-mono tabular-nums text-white">{countCompletedFastingDays()}</span> يوم
                  </div>
                </div>

                {/* Today Fasting Status & Toggle */}
                {(() => {
                  const fastingInfo = evaluateFastingCalculator(prayerTimes?.fajr, prayerTimes?.maghrib, new Date(), {
                    whiteDaysEnabled: fastingWhiteDaysEnabled,
                    monThuEnabled: fastingMonThuEnabled,
                    ashuraArafahEnabled: fastingAshuraArafahEnabled,
                  });

                  return (
                    <div className="p-5 rounded-2xl bg-[#031713]/90 border border-[#e5b869]/40 space-y-4">
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div>
                          <h5 className="font-bold text-sm text-[#fbbf24] flex items-center gap-1.5">
                            <span>حالة صيام اليوم</span>
                            <Sparkles className="w-4 h-4 text-emerald-400" />
                          </h5>
                          <p className="text-xs text-slate-300 mt-1">
                            {fastingInfo.reminderMessage || `المناسبة الحالية: ${fastingInfo.occasionTitle}`}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const next = !fastingIntentDraft;
                            setFastingIntentDraft(next);
                            saveFastingIntent(next);
                          }}
                          className={`min-h-[44px] px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
                            fastingIntentDraft
                              ? 'bg-emerald-600 text-white shadow-[0_0_16px_rgba(16,185,129,0.5)]'
                              : 'bg-gradient-to-r from-[#fbbf24] to-[#d97706] text-slate-950 hover:brightness-105'
                          }`}
                        >
                          {fastingIntentDraft ? (
                            <>
                              <span>تم تفعيل نية الصيام ✓</span>
                              <Check className="w-4 h-4 stroke-[3]" />
                            </>
                          ) : (
                            <span>نويت صيام اليوم ✓</span>
                          )}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#e5b869]/20 text-xs">
                        <div className="p-3 rounded-xl bg-[#02100d] border border-[#e5b869]/20 text-slate-200">
                          <span className="text-[#e5b869] block font-bold mb-1">وقت السحور والإمساك المقترح</span>
                          <span className="font-mono tabular-nums text-emerald-300 text-sm font-bold">{fastingInfo.suhoorTimeStr}</span>
                        </div>
                        <div className="p-3 rounded-xl bg-[#02100d] border border-[#e5b869]/20 text-slate-200">
                          <span className="text-[#e5b869] block font-bold mb-1">وقت الإفطار (أذان المغرب)</span>
                          <span className="font-mono tabular-nums text-[#fbbf24] text-sm font-bold">{prayerTimes?.maghrib || '17:59'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Automatic Fasting Alerts Controls */}
                <div className="p-5 rounded-2xl bg-[#031713]/90 border border-[#e5b869]/35 space-y-3">
                  <h5 className="font-bold text-sm text-[#fbbf24] mb-1">
                    ❖ تفعيل / تعطيل التنبيهات التلقائية لمواسم الصيام ❖
                  </h5>

                  {[
                    {
                      id: 'white_days',
                      title: 'التنبيهات التلقائية للأيام البيض (١٣، ١٤، ١٥ هجري)',
                      desc: 'تذكير يظهر في الصفحة الرئيسية بدءاً من مساء يوم ١٢ من كل شهر هجري',
                      checked: fastingWhiteDaysEnabled,
                      onToggle: () => {
                        const next = !fastingWhiteDaysEnabled;
                        setFastingWhiteDaysEnabled(next);
                        saveFastingPreferences({ whiteDaysEnabled: next });
                        onUpdateSettings({ fastingWhiteDaysEnabled: next });
                      },
                    },
                    {
                      id: 'mon_thu',
                      title: 'التنبيهات التلقائية لصيام الإثنين والخميس',
                      desc: 'تذكير استباقي بدءاً من مساء يومي الأحد والأربعاء وطوال يومي الإثنين والخميس',
                      checked: fastingMonThuEnabled,
                      onToggle: () => {
                        const next = !fastingMonThuEnabled;
                        setFastingMonThuEnabled(next);
                        saveFastingPreferences({ monThuEnabled: next });
                        onUpdateSettings({ fastingMonThuEnabled: next });
                      },
                    },
                    {
                      id: 'ashura_arafah',
                      title: 'التنبيهات التلقائية ليوم عاشوراء وعرفة وست من شوال',
                      desc: 'يشمل يوم عرفة (٩ ذو الحجة)، وتاسوعاء وعاشوراء (٩-١٠ محرم)، والست من شوال',
                      checked: fastingAshuraArafahEnabled,
                      onToggle: () => {
                        const next = !fastingAshuraArafahEnabled;
                        setFastingAshuraArafahEnabled(next);
                        saveFastingPreferences({ ashuraArafahEnabled: next });
                        onUpdateSettings({ fastingAshuraArafahEnabled: next });
                      },
                    },
                    {
                      id: 'show_stats',
                      title: 'عرض عداد «أيام الصيام المنجزة» في لوحة الإحصائيات',
                      desc: 'إضافة بطاقة إجمالي أيام الصيام المنجزة داخل نافذة سِجلّ استقامة القلب',
                      checked: showFastingStatsInRecord,
                      onToggle: () => {
                        const next = !showFastingStatsInRecord;
                        setShowFastingStatsInRecord(next);
                        saveFastingPreferences({ showFastingStatsInRecord: next });
                        onUpdateSettings({ showFastingStatsInRecord: next });
                      },
                    },
                  ].map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-4 p-3.5 rounded-xl bg-[#02100d] border border-[#e5b869]/20"
                    >
                      <div className="space-y-0.5 text-right">
                        <div className="text-xs sm:text-sm font-bold text-slate-100">{item.title}</div>
                        <div className="text-[11px] text-slate-400">{item.desc}</div>
                      </div>
                      <button
                        type="button"
                        onClick={item.onToggle}
                        role="switch"
                        aria-checked={item.checked}
                        className={`relative w-12 h-7 rounded-full transition-colors shrink-0 border ${
                          item.checked
                            ? 'bg-[#10B981] border-emerald-400'
                            : 'bg-slate-800 border-slate-600'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                            item.checked ? 'left-1' : 'right-1'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : activeSettingsTab === 'simulations' ? (
            <div className="space-y-6 w-full max-w-full overflow-x-hidden">
              <div className="p-6 rounded-3xl bg-gradient-to-br from-[#062d24] via-[#041d18] to-[#02100d] border-2 border-[#e5b869]/50 shadow-xl space-y-6 text-right">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#fbbf24] to-[#d97706] flex items-center justify-center text-slate-950 shadow-lg shrink-0">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold font-amiri text-[#fbbf24]">
                      محاكاة التنبيهات والأصوات
                    </h4>
                    <p className="text-xs text-slate-300">
                      معاينة واختبار كافة التنبيهات والأصوات وحالات الأذان والجمعة المباركة دون التأثير على بساطة الواجهة الرئيسية
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {/* Post-Prayer Check-in & Interactive Notification Settings */}
                  {renderPostPrayerCheckinSettingsCard()}

                  {/* 0. Full-Screen Cinematic Adhan Simulation */}
                  <div className="p-5 rounded-2xl bg-[#031713]/90 border border-[#e5b869]/30 space-y-3 flex flex-col justify-between sm:col-span-2">
                    <div>
                      <h5 className="font-bold text-sm text-[#fbbf24] flex items-center gap-1.5 justify-end">
                        <span>تجربة الأذان الكامل والسينمائي (Full-Screen)</span>
                        <Sparkles className="w-4 h-4 text-[#fbbf24]" />
                      </h5>
                      <p className="text-xs text-slate-300 leading-relaxed mt-1">
                        معاينة شاشة الأذان والدعاء السينمائية الكاملة بالخلفية الحية والخطوط الأندلسية ومؤثرات البث المباشر.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        void adhanPlayer.unlockAudio();
                        if (onOpenFullScreenAdhanSimulation) {
                          onOpenFullScreenAdhanSimulation();
                        } else {
                          onClose();
                          window.dispatchEvent(new CustomEvent('open_fullscreen_adhan_simulation'));
                        }
                      }}
                      className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-[#fbbf24] via-[#e5b869] to-emerald-400 text-slate-950 font-black text-xs shadow hover:brightness-105 transition-all flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-4 h-4 fill-current text-slate-950 shrink-0" />
                      <span>عرض شاشة الأذان الكاملة السينمائية الآن (Full-Screen)</span>
                    </button>
                  </div>

                  {/* 0.5. Last Third of the Night Sanctuary Simulation */}
                  <div className="p-5 rounded-2xl bg-[#031713]/90 border border-[#e5b869]/30 space-y-3 flex flex-col justify-between sm:col-span-2">
                    <div>
                      <h5 className="font-bold text-sm text-[#fbbf24] flex items-center gap-1.5 justify-end">
                        <span>معاينة وضع الثلث الأخير من الليل والتهجد</span>
                        <Moon className="w-4 h-4 text-sky-300" />
                      </h5>
                      <p className="text-xs text-slate-300 leading-relaxed mt-1">
                        معاينة الواجهة الليلية الهادئة (الأنماط الثلاثة: السماء الساهرة، المحراب الخافت، سواد OLED) مع حاسبة ركعات التهجد ومسبحة الاستغفار وأدعية السحر.
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          window.dispatchEvent(new CustomEvent('open_last_third_night_simulation'));
                        }}
                        className="flex-1 w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-400 via-sky-300 to-amber-300 text-slate-950 font-black text-xs shadow hover:brightness-105 transition-all flex items-center justify-center gap-2"
                      >
                        <Moon className="w-3.5 h-3.5 fill-current" />
                        <span>فتح شاشة الثلث الأخير وخلوة السحر فوراً</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          window.dispatchEvent(new CustomEvent('toggle_last_third_simulation'));
                          onClose();
                        }}
                        className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#05261f] border border-[#e5b869]/40 text-[#fbbf24] hover:bg-[#07362c] font-bold text-xs shadow transition-all whitespace-nowrap"
                      >
                        تبديل ظهور شريط السحر في الرئيسية
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        void adhanPlayer.unlockAudio();
                        onClose();
                        window.dispatchEvent(new CustomEvent('simulate_last_third_qiyam_toast'));
                      }}
                      className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-[#07261E] border border-[#10B981]/50 hover:border-[#34D399] text-[#34D399] font-bold text-xs shadow transition-all flex items-center justify-center gap-2"
                    >
                      <Volume2 className="w-4 h-4 shrink-0" />
                      <span>معاينة إشعار وتلاوة دخول الثلث الأخير (القطامي / العفاسي)</span>
                    </button>
                  </div>

                  {/* 1. Near Adhan Simulation (5 minutes left) */}
                  <div className="p-5 rounded-2xl bg-[#031713]/90 border border-[#e5b869]/30 space-y-3 flex flex-col justify-between">
                    <div>
                      <h5 className="font-bold text-sm text-[#fbbf24] flex items-center gap-1.5 justify-end">
                        <span>محاكاة آخر ٥ دقائق قبل الأذان</span>
                        <Timer className="w-4 h-4 text-[#fbbf24]" />
                      </h5>
                      <p className="text-xs text-slate-300 leading-relaxed mt-1">
                        اختبار مظهر الشاشة والعدّاد الدافئ والوضع الذهبي المتوهج عند اقتراب وقت الصلاة (04:59).
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent('toggle_near_adhan_simulation'));
                        onClose();
                      }}
                      className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#fbbf24] to-amber-500 text-slate-950 font-bold text-xs shadow hover:brightness-105 transition-all"
                    >
                      تبديل محاكاة آخر ٥ دقائق (04:59) وعرض الصفحة
                    </button>
                  </div>

                  {/* 2. Post Prayer Simulation (Adhkar + Tasbih) */}
                  <div className="p-5 rounded-2xl bg-[#031713]/90 border border-[#e5b869]/30 space-y-3 flex flex-col justify-between">
                    <div>
                      <h5 className="font-bold text-sm text-[#fbbf24] flex items-center gap-1.5 justify-end">
                        <span>محاكاة مرور ١٠ دقائق بعد الأذان</span>
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                      </h5>
                      <p className="text-xs text-slate-300 leading-relaxed mt-1">
                        فتح نافذة أذكار ما بعد الصلاة والمسبحة الإلكترونية لمحاكاة الفراغ من الصلاة.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        window.dispatchEvent(new CustomEvent('open_post_prayer_simulation'));
                      }}
                      className="w-full px-4 py-2.5 rounded-xl bg-emerald-950 border border-emerald-500/50 text-emerald-300 hover:bg-emerald-900 font-bold text-xs shadow transition-all"
                    >
                      بدء محاكاة ١٠ دقائق (أذكار + مسبحة)
                    </button>
                  </div>

                  {/* 3. Salawat Voice Test */}
                  <div className="p-5 rounded-2xl bg-[#031713]/90 border border-[#e5b869]/30 space-y-3 flex flex-col justify-between">
                    <div>
                      <h5 className="font-bold text-sm text-[#fbbf24] flex items-center gap-1.5 justify-end">
                        <span>تجربة الصلوات على النبي ﷺ صوتياً</span>
                        <Heart className="w-4 h-4 text-rose-400" />
                      </h5>
                      <p className="text-xs text-slate-300 leading-relaxed mt-1">
                        الاستماع المباشر للتذكير الصوتي بالصلاة على النبي ﷺ بصوت الشيخ المختار في الإعدادات.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleSalawatPreview(salawatVoiceMode)}
                      className={`w-full px-4 py-2.5 rounded-xl border font-bold text-xs shadow transition-all flex items-center justify-center gap-2 ${
                        playerState === 'playing' && activeAudioType === 'salawat'
                          ? 'bg-rose-600 border-rose-500 text-white'
                          : 'bg-[#05261f] border-[#e5b869]/40 text-[#fbbf24] hover:bg-[#07362c]'
                      }`}
                    >
                      {playerState === 'playing' && activeAudioType === 'salawat' ? (
                        <>
                          <Square className="w-3.5 h-3.5 fill-current" />
                          <span>إيقاف صوت الصلاة على النبي</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>تجربة الصلاة على النبي ﷺ الآن</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* 4. Pre-Adhan Preparation Alert Test */}
                  <div className="p-5 rounded-2xl bg-[#031713]/90 border border-[#e5b869]/30 space-y-3 flex flex-col justify-between">
                    <div>
                      <h5 className="font-bold text-sm text-[#fbbf24] flex items-center gap-1.5 justify-end">
                        <span>تجربة تنبيه الاستعداد للصلاة</span>
                        <BellRing className="w-4 h-4 text-amber-300" />
                      </h5>
                      <p className="text-xs text-slate-300 leading-relaxed mt-1">
                        الاستماع لتنبيه الاستعداد للوضوء قبل دخول الوقت بأصوات الشيوخ الحقيقية.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTestPreAdhanChime(preAdhanVoiceMode)}
                      className={`w-full px-4 py-2.5 rounded-xl border font-bold text-xs shadow transition-all flex items-center justify-center gap-2 ${
                        playerState === 'playing' && activeAudioType === 'pre_adhan_reminder'
                          ? 'bg-rose-600 border-rose-500 text-white'
                          : 'bg-[#05261f] border-[#e5b869]/40 text-[#fbbf24] hover:bg-[#07362c]'
                      }`}
                    >
                      {playerState === 'playing' && activeAudioType === 'pre_adhan_reminder' ? (
                        <>
                          <Square className="w-3.5 h-3.5 fill-current" />
                          <span>إيقاف تنبيه الصلاة</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>تجربة تنبيه الصلاة صوتياً</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* 5. Morning & Evening Adhkar Test */}
                  <div className="p-5 rounded-2xl bg-[#031713]/90 border border-[#e5b869]/30 space-y-3 flex flex-col justify-between">
                    <div>
                      <h5 className="font-bold text-sm text-[#fbbf24] flex items-center gap-1.5 justify-end">
                        <span>اختبار صوت الأذكار (الصباح والمساء)</span>
                        <BookOpen className="w-4 h-4 text-emerald-400" />
                      </h5>
                      <p className="text-xs text-slate-300 leading-relaxed mt-1">
                        الاستماع لتلاوة أذكار الصباح والمساء بصوت القارئ المختار (
                        {ADHKAR_SOURCES[selectedAdhkarReciter]?.nameAr || 'الشيخ مشاري راشد العفاسي'}).
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleAdhkarPreview('morning', selectedAdhkarReciter)}
                        className={`px-3 py-2.5 rounded-xl border font-bold text-xs shadow transition-all flex items-center justify-center gap-1.5 ${
                          (playerState === 'playing' || playerState === 'loading') &&
                          activeAudioType === 'adhkar' &&
                          previewingAdhkarPeriod === 'morning'
                            ? 'bg-rose-600 border-rose-500 text-white'
                            : 'bg-[#05261f] border-[#e5b869]/40 text-[#fbbf24] hover:bg-[#07362c]'
                        }`}
                      >
                        {(playerState === 'playing' || playerState === 'loading') &&
                        activeAudioType === 'adhkar' &&
                        previewingAdhkarPeriod === 'morning' ? (
                          <>
                            <Square className="w-3.5 h-3.5 fill-current" />
                            <span>إيقاف الصباح</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>أذكار الصباح</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleAdhkarPreview('evening', selectedAdhkarReciter)}
                        className={`px-3 py-2.5 rounded-xl border font-bold text-xs shadow transition-all flex items-center justify-center gap-1.5 ${
                          (playerState === 'playing' || playerState === 'loading') &&
                          activeAudioType === 'adhkar' &&
                          previewingAdhkarPeriod === 'evening'
                            ? 'bg-rose-600 border-rose-500 text-white'
                            : 'bg-[#05261f] border-[#e5b869]/40 text-[#fbbf24] hover:bg-[#07362c]'
                        }`}
                      >
                        {(playerState === 'playing' || playerState === 'loading') &&
                        activeAudioType === 'adhkar' &&
                        previewingAdhkarPeriod === 'evening' ? (
                          <>
                            <Square className="w-3.5 h-3.5 fill-current" />
                            <span>إيقاف المساء</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>أذكار المساء</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* 6. Dua After Adhan Test */}
                  <div className="p-5 rounded-2xl bg-[#031713]/90 border border-[#e5b869]/30 space-y-3 flex flex-col justify-between">
                    <div>
                      <h5 className="font-bold text-sm text-[#fbbf24] flex items-center gap-1.5 justify-end">
                        <span>تجربة دعاء ما بعد الأذان</span>
                        <Sparkles className="w-4 h-4 text-amber-300" />
                      </h5>
                      <p className="text-xs text-slate-300 leading-relaxed mt-1">
                        الاستماع لدعاء الوسيلة (اللهم رب هذه الدعوة التامة) بصوت الشيخ المختار (الشعراوي، السديس...).
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleToggleDuaPreview}
                      className={`w-full px-4 py-2.5 rounded-xl border font-bold text-xs shadow transition-all flex items-center justify-center gap-2 ${
                        (playerState === 'playing' || playerState === 'loading') && activeAudioType === 'dua'
                          ? 'bg-rose-600 border-rose-500 text-white'
                          : 'bg-[#05261f] border-[#e5b869]/40 text-[#fbbf24] hover:bg-[#07362c]'
                      }`}
                    >
                      {(playerState === 'playing' || playerState === 'loading') && activeAudioType === 'dua' ? (
                        <>
                          <Square className="w-3.5 h-3.5 fill-current" />
                          <span>إيقاف الدعاء</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>تجربة دعاء ما بعد الأذان</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* 7. Jumuah Golden Sanctuary Mode Toggle */}
                  <div className="p-5 rounded-2xl bg-[#031713]/90 border border-[#e5b869]/30 space-y-3 flex flex-col justify-between">
                    <div>
                      <h5 className="font-bold text-sm text-[#fbbf24] flex items-center gap-1.5 justify-end">
                        <span>وضع الجمعة المباركة التلقائي</span>
                        <Sparkles className="w-4 h-4 text-[#fbbf24]" />
                      </h5>
                      <p className="text-xs text-slate-300 leading-relaxed mt-1">
                        معاينة الهالة الذهبية المتوهجة للمحراب وتغيير اسم صلاة الظهر إلى صلاة الجمعة مع خطبة الجمعة وسورة الكهف.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent('toggle_jumuah_preview'));
                        onClose();
                      }}
                      className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#fbbf24] to-amber-500 text-slate-950 font-bold text-xs shadow hover:brightness-105 transition-all"
                    >
                      تبديل معاينة وضع الجمعة وعرض الصفحة
                    </button>
                  </div>

                  {/* 8. Jumuah Sunan & Early Attendance Test */}
                  <div className="p-5 rounded-2xl bg-[#031713]/90 border border-[#e5b869]/30 space-y-3 flex flex-col justify-between">
                    <div>
                      <h5 className="font-bold text-sm text-[#fbbf24] flex items-center gap-1.5 justify-end">
                        <span>تنبيه التبكير وسنن الجمعة</span>
                        <Sunrise className="w-4 h-4 text-emerald-400" />
                      </h5>
                      <p className="text-xs text-slate-300 leading-relaxed mt-1">
                        معاينة بطاقة سنن يوم الجمعة (الغسل، الطيب، السواك، لبس أحسن الثياب، وأجر التبكير للمسجد).
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent('toggle_jumuah_sunan'));
                        onClose();
                      }}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#05261f] border border-[#e5b869]/40 text-[#fbbf24] hover:bg-[#07362c] font-bold text-xs shadow transition-all"
                    >
                      تبديل معاينة تنبيه التبكير (قبل ساعة)
                    </button>
                  </div>

                  {/* 9. Golden Hour of Jumuah Radar */}
                  <div className="p-5 rounded-2xl bg-[#031713]/90 border border-[#e5b869]/30 space-y-3 flex flex-col justify-between">
                    <div>
                      <h5 className="font-bold text-sm text-[#fbbf24] flex items-center gap-1.5 justify-end">
                        <span>رادار ساعة الاستجابة في يوم الجمعة</span>
                        <Timer className="w-4 h-4 text-amber-300" />
                      </h5>
                      <p className="text-xs text-slate-300 leading-relaxed mt-1">
                        معاينة شريط العد التنازلي لآخر ساعة قبل مغرب الجمعة وباقة الأدعية المأثورة المستجابة.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent('toggle_golden_hour'));
                        onClose();
                      }}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#05261f] border border-[#e5b869]/40 text-[#fbbf24] hover:bg-[#07362c] font-bold text-xs shadow transition-all"
                    >
                      تبديل معاينة رادار ساعة الاستجابة
                    </button>
                  </div>

                  {/* 10. Periodic Verse & Hadith Popup Test */}
                  <div className="p-5 rounded-2xl bg-[#031713]/90 border border-[#e5b869]/30 space-y-3 flex flex-col justify-between">
                    <div>
                      <h5 className="font-bold text-sm text-[#fbbf24] flex items-center gap-1.5 justify-end">
                        <span>تذكير الآيات والأحاديث النبوية</span>
                        <BookOpen className="w-4 h-4 text-[#fbbf24]" />
                      </h5>
                      <p className="text-xs text-slate-300 leading-relaxed mt-1">
                        معاينة النافذة المنبثقة المباركة التي تظهر كل فترة لتذكير المستخدم بآيات القرآن العظيم والأحاديث.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (onTestPeriodicReminder) onTestPeriodicReminder();
                      }}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#05261f] border border-[#e5b869]/40 text-[#fbbf24] hover:bg-[#07362c] font-bold text-xs shadow transition-all"
                    >
                      معاينة نافذة التذكير المنبثقة الآن
                    </button>
                  </div>

                  {/* 11. Iqama Arrival (00:00) Simulation */}
                  <div className="p-5 rounded-2xl bg-[#031713]/90 border border-[#e5b869]/30 space-y-3 flex flex-col justify-between sm:col-span-2">
                    <div>
                      <h5 className="font-bold text-sm text-[#fbbf24] flex items-center gap-1.5 justify-end">
                        <span>محاكاة دخول وقت الإقامة (انتهاء العداد 00:00)</span>
                        <Volume2 className="w-4 h-4 text-emerald-400" />
                      </h5>
                      <p className="text-xs text-slate-300 leading-relaxed mt-1">
                        اختبار التشغيل التلقائي لصوت الإقامة بصوت الشيخ المختار مع بطاقة «قد قامت الصلاة» أسفل الشاشة.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleIqamaPreview(iqamaVoiceMode, 'العصر')}
                      className={`w-full px-4 py-2.5 rounded-xl border font-bold text-xs shadow transition-all flex items-center justify-center gap-2 ${
                        playerState === 'playing' && activeAudioType === 'iqama'
                          ? 'bg-rose-600 border-rose-500 text-white'
                          : 'bg-gradient-to-r from-[#fbbf24] to-amber-500 border-amber-300/40 text-slate-950 hover:brightness-105'
                      }`}
                    >
                      {playerState === 'playing' && activeAudioType === 'iqama' ? (
                        <>
                          <Square className="w-3.5 h-3.5 fill-current" />
                          <span>إيقاف صوت الإقامة</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>محاكاة إقامة الصلاة بصوت الشيخ الآن</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : activeSettingsTab === 'widgets' ? (
            <div className="space-y-6 w-full max-w-full overflow-x-hidden">
              {renderWidgetSettingsSection()}
            </div>
          ) : activeSettingsTab === 'android' ? (
            <div className="space-y-6 w-full max-w-full overflow-x-hidden">
              {renderAndroidApkSettingsSection()}
            </div>
          ) : (
            <div className="space-y-6 w-full max-w-full overflow-x-hidden">

          {/* 1. Islamic Countdown Style (Adhan & Iqama) - Applies Immediately */}
          <div className="p-5 rounded-2xl bg-[#03201a]/85 border border-[#e5b869]/35 space-y-4 shadow-lg">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-[11px] font-semibold text-emerald-300">
                يتحدّث في الصفحة الرئيسية فور الاختيار
              </span>
              <div className="flex items-center gap-2 text-[#fbbf24] font-bold text-base font-amiri">
                <span className="text-lg">1. الطراز الإسلامي لعدّاد الأذان والإقامة</span>
                <Sparkles className="w-5 h-5 text-[#fbbf24]" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { id: 'islamic-mihrab', name: 'المحراب المذهّب', desc: 'قوس محراب إسلامي مدبّب بحواف ذهبية مزدوجة وتاج نجمي' },
                { id: 'rub-el-hizb', name: 'النجمة المثمّنة (ربع الحزب)', desc: '3 بطاقات منفصلة بإطارات نجمية إسلامية زجاجية' },
                { id: 'mashrabiya-arabesque', name: 'المشربية والأرابيسك', desc: 'لوحة معمارية مزخرفة مع شريط تقدم ذهبي زمردي' },
                { id: 'celestial-astrolabe', name: 'الهلال والإسطرلاب الفلكي', desc: 'إطار دائري مستوحى من الإسطرلاب الفلكي العربي' },
              ].map((style) => {
                const isSelected = selectedAdhanCountdownStyle === style.id;
                return (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => {
                      const val = style.id as UserSettings['adhanCountdownStyle'];
                      setSelectedAdhanCountdownStyle(val!);
                      onUpdateSettings({ adhanCountdownStyle: val });
                    }}
                    className={`p-4 rounded-2xl border text-right transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-gradient-to-br from-[#073f34] to-[#03221c] border-[#fbbf24] ring-2 ring-[#e5b869]/40 text-[#fbbf24] font-bold shadow-[0_0_20px_rgba(229,184,105,0.2)]'
                        : 'bg-[#041814]/90 border-[#e5b869]/20 text-slate-300 hover:border-[#e5b869]/50 hover:bg-[#06261f]'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-[#fbbf24] bg-[#fbbf24]/25' : 'border-slate-600'
                        }`}
                      >
                        {isSelected && <span className="w-2 h-2 rounded-full bg-[#fbbf24]"></span>}
                      </span>
                      <h4 className="text-sm font-bold text-white font-amiri tracking-wide">{style.name}</h4>
                    </div>
                    <p className="text-xs text-slate-300 mt-2 leading-relaxed">{style.desc}</p>
                  </button>
                );
              })}
            </div>

            {/* Iqama Counter Style Sub-Row */}
            <div className="pt-3 border-t border-[#e5b869]/20 space-y-2.5">
              <div className="flex items-center justify-end gap-2 text-sm text-[#e5b869] font-bold font-amiri">
                <span>طراز عدّاد الإقامة:</span>
                <Timer className="w-4 h-4" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  { id: 'ring', name: 'الحلقة الفلكية الذهبية' },
                  { id: 'split', name: 'بطاقات التوقيت المنفصلة' },
                  { id: 'pill', name: 'الكبسولة الزجاجية المينيمال' },
                ].map((style) => {
                  const isSelected = selectedIqamaStyle === style.id;
                  return (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => {
                        const val = style.id as 'ring' | 'split' | 'pill';
                        setSelectedIqamaStyle(val);
                        onUpdateSettings({ iqamaStyle: val });
                      }}
                      className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                        isSelected
                          ? 'bg-[#073f34] border-[#fbbf24] text-[#fbbf24] ring-1 ring-[#e5b869]/40'
                          : 'bg-[#041814] border-[#e5b869]/20 text-slate-300 hover:border-[#e5b869]/45'
                      }`}
                    >
                      {style.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Ambient StandBy Mode Auto-Landscape Toggle */}
          <div className="p-5 rounded-2xl bg-[#03201a]/85 border border-[#e5b869]/35 flex items-center justify-between gap-4 shadow-lg">
            <div className="space-y-1 text-right">
              <h4 className="text-sm sm:text-base font-bold font-amiri text-[#fbbf24] flex items-center justify-end gap-2">
                <span>الدخول التلقائي لوضع المنضدة عند تدوير الهاتف أفقياً (Landscape)</span>
              </h4>
              <p className="text-xs text-slate-300">
                عند تدوير الهاتف أفقياً، يتم فتح شاشة المنضدة الذكية المريحة للعين والموفّرة للطاقة تلقائياً.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                const next = !ambientStandbyAutoLandscape;
                setAmbientStandbyAutoLandscape(next);
                onUpdateSettings({ ambientStandbyAutoLandscape: next });
              }}
              role="switch"
              aria-checked={ambientStandbyAutoLandscape}
              className={`relative w-12 h-7 rounded-full transition-colors shrink-0 border ${
                ambientStandbyAutoLandscape
                  ? 'bg-[#10B981] border-emerald-400'
                  : 'bg-slate-800 border-slate-600'
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  ambientStandbyAutoLandscape ? 'left-1' : 'right-1'
                }`}
              />
            </button>
          </div>

          {/* 🕌 إعدادات إشعار المتابعة الذكية بعد كل صلاة */}
          {renderPostPrayerCheckinSettingsCard()}

          {/* 📱 إعدادات الودجات والشاشة الرئيسية */}
          {renderWidgetSettingsSection()}

          {/* 2. Full-Screen Adhan Modal Design */}
          <div className="p-5 rounded-2xl bg-[#03201a]/85 border border-[#e5b869]/35 space-y-3 shadow-lg">
            <div className="flex items-center justify-end gap-2 text-[#fbbf24] font-bold text-base font-amiri">
              <span className="text-lg">2. تصميم شاشة الأذان الكاملة (Full-Screen Adhan)</span>
              <Sparkles className="w-5 h-5 text-[#fbbf24]" />
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              اختر التكوين البصري الفاخر لشاشة الأذان الكاملة مع صور المساجد والموجة الصوتية الحريرية:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {[
                { id: 'editorial-horizon', name: 'الأفق الإشراقي (Editorial Horizon)', desc: '65% مساحة علوية صافية للمساجد وأفق زجاجي سفلي فاخر' },
                { id: 'architectural-sanctuary', name: 'البوابة المعمارية', desc: 'قوس محراب إسلامي متناظر مع زخارف هندسية ذهبية' },
                { id: 'ambient-aura', name: 'الضوء النوراني الحر', desc: 'نصوص منسابة مع هالة نورانية زمردية هادئة' },
              ].map((layout) => {
                const isSelected = selectedAdhanLayout === layout.id;
                return (
                  <button
                    key={layout.id}
                    type="button"
                    onClick={() => {
                      const val = layout.id as UserSettings['adhanModalLayout'];
                      setSelectedAdhanLayout(val!);
                      onUpdateSettings({ adhanModalLayout: val });
                    }}
                    className={`p-4 rounded-2xl border text-right transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-gradient-to-br from-[#073f34] to-[#03221c] border-[#fbbf24] ring-2 ring-[#e5b869]/40 text-[#fbbf24] font-bold shadow-[0_0_20px_rgba(229,184,105,0.2)]'
                        : 'bg-[#041814]/90 border-[#e5b869]/20 text-slate-300 hover:border-[#e5b869]/50 hover:bg-[#06261f]'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-[#fbbf24] bg-[#fbbf24]/25' : 'border-slate-600'
                        }`}
                      >
                        {isSelected && <span className="w-2 h-2 rounded-full bg-[#fbbf24]"></span>}
                      </span>
                      <h4 className="text-sm font-bold text-white font-amiri tracking-wide">{layout.name}</h4>
                    </div>
                    <p className="text-xs text-slate-300 mt-2 leading-relaxed">{layout.desc}</p>
                  </button>
                );
              })}
            </div>

            {/* خلفيات المساجد المتحركة والأجواء النورانية أثناء الأذان */}
            <div className="pt-4 mt-2 border-t border-[#e5b869]/20 space-y-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="text-right">
                  <h4 className="text-sm font-bold text-[#F3D078]">
                    خلفيات المساجد المتحركة أثناء الأذان
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    تبديل تلقائي بين المساجد المختارة مع فيديو السماء والتحريك السينمائي والأجواء النورانية
                  </p>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={adhanBgAutoRotate}
                  onClick={() => {
                    const next = !adhanBgAutoRotate;
                    setAdhanBgAutoRotate(next);
                    onUpdateSettings({ adhanBackgroundAutoRotate: next });
                  }}
                  className={`relative w-12 h-7 rounded-full transition-colors shrink-0 border ${
                    adhanBgAutoRotate
                      ? 'bg-[#10B981] border-emerald-400'
                      : 'bg-slate-800 border-slate-600'
                  }`}
                  title="تفعيل التبديل التلقائي بين المساجد أثناء الأذان"
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      adhanBgAutoRotate ? 'left-1' : 'right-1'
                    }`}
                  />
                </button>
              </div>

              {/* أسلوب الحركة */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-200 block text-right">
                  أسلوب الحركة والأجواء:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    {
                      id: 'hybrid' as AdhanMotionStyle,
                      title: 'مزيج فيديو وتحريك نوراني',
                      desc: 'فيديو السماء والغيوم مع تقريب سينمائي وذرات ضوء',
                    },
                    {
                      id: 'video' as AdhanMotionStyle,
                      title: 'فيديو حي للسماء',
                      desc: 'بث متكرر للغيوم والأجواء السماوية فوق المساجد',
                    },
                    {
                      id: 'cinematic' as AdhanMotionStyle,
                      title: 'تحريك سينمائي نوراني',
                      desc: 'حركة كاميرا ناعمة وإضاءة نورانية خالصة بدون فيديو',
                    },
                  ].map((mode) => {
                    const active = adhanBgMotionStyle === mode.id;
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => {
                          setAdhanBgMotionStyle(mode.id);
                          onUpdateSettings({ adhanBackgroundMotionStyle: mode.id });
                        }}
                        className={`p-3 rounded-xl border text-right transition-all ${
                          active
                            ? 'bg-[#073f34] border-[#fbbf24] text-[#fbbf24]'
                            : 'bg-[#041814]/90 border-[#e5b869]/20 text-slate-300 hover:border-[#e5b869]/50'
                        }`}
                      >
                        <div className="text-xs font-bold text-white">{mode.title}</div>
                        <div className="text-[11px] text-slate-300 mt-1 leading-relaxed">{mode.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* المساجد المختارة للظهور أثناء الأذان */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-200">
                    المساجد الظاهرة أثناء الأذان ({adhanEnabledMosques.length}/{ADHAN_MOSQUE_SCENES.length}):
                  </span>
                  {onOpenFullScreenAdhanSimulation && (
                    <button
                      type="button"
                      onClick={onOpenFullScreenAdhanSimulation}
                      className="min-h-[36px] px-3 py-1.5 rounded-xl bg-[#073f34] border border-[#fbbf24]/50 text-[#fbbf24] hover:brightness-110 text-xs font-bold transition-all"
                    >
                      معاينة شاشة الأذان الآن
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {ADHAN_MOSQUE_SCENES.map((scene) => {
                    const isChecked = adhanEnabledMosques.includes(scene.id);
                    return (
                      <button
                        key={scene.id}
                        type="button"
                        onClick={() => {
                          let next: string[];
                          if (isChecked) {
                            if (adhanEnabledMosques.length <= 1) return;
                            next = adhanEnabledMosques.filter((id) => id !== scene.id);
                          } else {
                            next = [...adhanEnabledMosques, scene.id];
                          }
                          setAdhanEnabledMosques(next);
                          onUpdateSettings({ adhanEnabledMosques: next });
                        }}
                        className={`group relative overflow-hidden rounded-xl border text-right transition-all flex items-center gap-2.5 p-2 ${
                          isChecked
                            ? 'border-[#34D399]/70 bg-[#062f26]/90 shadow-[0_4px_16px_rgba(16,185,129,0.16)]'
                            : 'border-slate-700/80 bg-[#031612]/80 opacity-65 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={scene.imageUrl}
                          alt={scene.nameAr}
                          referrerPolicy="no-referrer"
                          className="w-16 h-12 rounded-lg object-cover shrink-0 border border-white/10"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-white truncate">{scene.shortNameAr}</div>
                          <div className="text-[11px] text-slate-300 truncate">{scene.locationAr}</div>
                        </div>
                        <span
                          className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 text-[11px] font-black ${
                            isChecked
                              ? 'bg-[#34D399] border-[#34D399] text-[#04130E]'
                              : 'border-slate-600 text-transparent'
                          }`}
                        >
                          ✓
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* 3. Audio, Muezzin & Pre-Adhan Preparation */}
          <div className="p-5 rounded-2xl bg-[#03201a]/85 border border-[#e5b869]/35 space-y-4 shadow-lg">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleTestPreAdhanChime(preAdhanVoiceMode)}
                className="text-xs px-3.5 py-2 rounded-xl bg-[#052921] border border-[#e5b869]/40 text-[#fbbf24] hover:bg-[#07382e] flex items-center gap-1.5 font-bold transition-all"
              >
                {playerState === 'loading' && activeAudioType === 'pre_adhan_reminder' ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>جاري التحضير...</span>
                  </>
                ) : playerState === 'playing' && activeAudioType === 'pre_adhan_reminder' ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>إيقاف تنبيه الصلاة</span>
                  </>
                ) : (
                  <>
                    <span>تجربة تنبيه الصلاة بصوت الشيخ</span>
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </>
                )}
              </button>

              <div className="flex items-center gap-2 text-[#fbbf24] font-bold text-base font-amiri">
                <BellRing className="w-5 h-5 text-[#fbbf24]" />
                <span className="text-lg">3. الصوت والتنبيه المسبق للاستعداد للوضوء والصلاة</span>
              </div>
            </div>

            {/* Muezzin Dropdown (Regular Prayers Only) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleToggleSample(selectedAdhanReciter, false)}
                  className="min-h-[44px] text-xs px-3.5 py-2 rounded-xl bg-emerald-950 border border-emerald-500/45 text-emerald-300 hover:bg-emerald-900 flex items-center gap-1.5 font-bold whitespace-nowrap shrink-0"
                >
                  <span>
                    {(playerState === 'playing' || playerState === 'loading') &&
                    activeAudioType === 'adhan' &&
                    previewingAdhanKind === 'regular' &&
                    previewingAdhanReciterId === selectedAdhanReciter
                      ? 'إيقاف المعاينة'
                      : 'معاينة صوت المؤذن'}
                  </span>
                  {(playerState === 'playing' || playerState === 'loading') &&
                  activeAudioType === 'adhan' &&
                  previewingAdhanKind === 'regular' &&
                  previewingAdhanReciterId === selectedAdhanReciter ? (
                    <Square className="w-3 h-3 fill-current" />
                  ) : (
                    <Play className="w-3 h-3 fill-current text-[#fbbf24]" />
                  )}
                </button>
                <label className="text-xs font-bold text-[#e5b869] flex items-center gap-1.5">
                  <span>صوت المؤذن للصلوات الخمس (أصوات شيوخ خاشعة):</span>
                  <Volume2 className="w-4 h-4" />
                </label>
              </div>
              <select
                value={selectedAdhanReciter}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedAdhanReciter(val);
                  onUpdateSettings({ adhanReciter: val });
                }}
                className="w-full bg-[#021410] border border-[#e5b869]/35 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-[#fbbf24] text-right font-sans"
              >
                {Object.values(ADHAN_SOURCES).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nameAr}
                  </option>
                ))}
              </select>

              {(() => {
                const currentSource = ADHAN_SOURCES[selectedAdhanReciter];
                if (!currentSource) return null;
                const isCached = Boolean(adhanCacheMap[currentSource.id]);
                const isDownloading = downloadingAdhanId === currentSource.id;
                const sizeText = (currentSource.approxSizeMb ?? 1.5).toFixed(1);
                return (
                  <div className="flex items-center justify-between gap-3 flex-wrap px-3.5 py-2.5 rounded-xl bg-[#041814]/90 border border-[#e5b869]/20">
                    <div className="flex items-center gap-2">
                      {isCached ? (
                        <button
                          type="button"
                          onClick={() => void handleRemoveAdhanOffline(currentSource)}
                          className="min-h-[44px] px-3 py-1.5 rounded-xl bg-rose-950/60 border border-rose-500/35 text-rose-200 hover:bg-rose-900/70 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>إزالة من الذاكرة</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={isDownloading}
                          onClick={() => void handleDownloadAdhanOffline(currentSource)}
                          className="min-h-[44px] px-3.5 py-1.5 rounded-xl bg-[#07382e] border border-emerald-500/45 text-emerald-200 hover:bg-[#094a3d] disabled:opacity-60 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
                        >
                          {isDownloading ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>جاري الحفظ...</span>
                            </>
                          ) : (
                            <>
                              <Download className="w-3.5 h-3.5" />
                              <span>حفظ بدون نت</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                    <div className="text-right space-y-0.5 flex-1 min-w-[200px]">
                      {currentSource.khushuTagAr && (
                        <p className="text-xs text-slate-200 font-medium">{currentSource.khushuTagAr}</p>
                      )}
                      <p className="text-[11px] text-slate-400 tabular-nums">
                        <span className="text-[#fbbf24]/90">~{sizeText} م.ب</span>
                        <span> · </span>
                        <span className={isCached ? 'text-emerald-300 font-semibold' : 'text-slate-400'}>
                          {isCached ? 'محفوظ بدون نت ✓' : 'يحتاج حفظاً للعمل بدون إنترنت'}
                        </span>
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Distinct Full-Length Fajr Adhan Dropdown */}
            <div className="space-y-2.5 pt-2 border-t border-[#e5b869]/15">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleToggleSample(selectedFajrReciter, true)}
                  className="min-h-[44px] text-xs px-3.5 py-2 rounded-xl bg-emerald-950 border border-sky-500/45 text-sky-300 hover:bg-emerald-900 flex items-center gap-1.5 font-bold whitespace-nowrap shrink-0"
                >
                  <span>
                    {(playerState === 'playing' || playerState === 'loading') &&
                    activeAudioType === 'adhan' &&
                    previewingAdhanKind === 'fajr' &&
                    previewingAdhanReciterId === selectedFajrReciter
                      ? 'إيقاف الفجر'
                      : 'معاينة الفجر الكامل'}
                  </span>
                  {(playerState === 'playing' || playerState === 'loading') &&
                  activeAudioType === 'adhan' &&
                  previewingAdhanKind === 'fajr' &&
                  previewingAdhanReciterId === selectedFajrReciter ? (
                    <Square className="w-3 h-3 fill-current" />
                  ) : (
                    <Play className="w-3 h-3 fill-current" />
                  )}
                </button>
                <label className="text-xs font-bold text-sky-300 flex items-center gap-1.5">
                  <span>أذان صلاة الفجر المستقل (أذان كامل — «الصلاة خير من النوم»):</span>
                  <Sunrise className="w-4 h-4" />
                </label>
              </div>
              <select
                value={selectedFajrReciter}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedFajrReciter(val);
                  onUpdateSettings({ fajrAdhanReciter: val });
                }}
                className="w-full bg-[#021410] border border-[#e5b869]/35 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-[#fbbf24] text-right font-sans"
              >
                {Object.values(FAJR_ADHAN_SOURCES).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nameAr}
                  </option>
                ))}
              </select>

              {(() => {
                const currentFajrSource = FAJR_ADHAN_SOURCES[selectedFajrReciter];
                if (!currentFajrSource) return null;
                const isCached = Boolean(adhanCacheMap[currentFajrSource.id]);
                const isDownloading = downloadingAdhanId === currentFajrSource.id;
                const sizeText = (currentFajrSource.approxSizeMb ?? 1.5).toFixed(1);
                return (
                  <div className="flex items-center justify-between gap-3 flex-wrap px-3.5 py-2.5 rounded-xl bg-[#041814]/90 border border-sky-500/20">
                    <div className="flex items-center gap-2">
                      {isCached ? (
                        <button
                          type="button"
                          onClick={() => void handleRemoveAdhanOffline(currentFajrSource)}
                          className="min-h-[44px] px-3 py-1.5 rounded-xl bg-rose-950/60 border border-rose-500/35 text-rose-200 hover:bg-rose-900/70 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>إزالة من الذاكرة</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={isDownloading}
                          onClick={() => void handleDownloadAdhanOffline(currentFajrSource)}
                          className="min-h-[44px] px-3.5 py-1.5 rounded-xl bg-[#07382e] border border-sky-500/45 text-sky-200 hover:bg-[#094a3d] disabled:opacity-60 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
                        >
                          {isDownloading ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>جاري الحفظ...</span>
                            </>
                          ) : (
                            <>
                              <Download className="w-3.5 h-3.5" />
                              <span>حفظ بدون نت</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                    <div className="text-right space-y-0.5 flex-1 min-w-[200px]">
                      {currentFajrSource.khushuTagAr && (
                        <p className="text-xs text-slate-200 font-medium">{currentFajrSource.khushuTagAr}</p>
                      )}
                      <p className="text-[11px] text-slate-400 tabular-nums">
                        <span className="text-sky-300/90">~{sizeText} م.ب</span>
                        <span> · </span>
                        <span className={isCached ? 'text-emerald-300 font-semibold' : 'text-slate-400'}>
                          {isCached ? 'محفوظ بدون نت ✓' : 'يحتاج حفظاً للعمل بدون إنترنت'}
                        </span>
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Offline Feedback Banner */}
            {offlineActionMessage && (
              <div
                className={`px-3.5 py-2.5 rounded-xl border text-xs font-medium text-right flex items-center justify-between gap-2 ${
                  offlineActionMessage.type === 'success'
                    ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-200'
                    : 'bg-rose-950/70 border-rose-500/40 text-rose-200'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOfflineActionMessage(null)}
                  className="text-slate-300 hover:text-white px-2 py-1 text-xs shrink-0"
                  aria-label="إغلاق التنبيه"
                >
                  ✕
                </button>
                <span className="flex-1">{offlineActionMessage.text}</span>
              </div>
            )}

            {/* Expandable Offline Sheikh Voices Manager */}
            <div className="pt-2 border-t border-[#e5b869]/15 space-y-3">
              {(() => {
                const allAdhanList = [
                  ...Object.values(ADHAN_SOURCES),
                  ...Object.values(FAJR_ADHAN_SOURCES),
                ];
                const cachedCount = allAdhanList.filter((item) => adhanCacheMap[item.id]).length;
                const activeList =
                  offlineManagerFilter === 'regular'
                    ? Object.values(ADHAN_SOURCES)
                    : Object.values(FAJR_ADHAN_SOURCES);

                return (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowOfflineAdhanManager((prev) => !prev)}
                      className="min-h-[44px] w-full px-4 py-2.5 rounded-xl bg-[#041814] border border-[#e5b869]/30 hover:border-[#fbbf24]/60 flex items-center justify-between gap-3 transition-colors"
                    >
                      <div className="flex items-center gap-2 text-[#fbbf24] shrink-0">
                        {showOfflineAdhanManager ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                        <span className="text-xs text-slate-300 tabular-nums whitespace-nowrap">
                          {cachedCount} من {allAdhanList.length} محفوظة
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-right">
                        <span className="text-xs sm:text-sm font-bold text-[#e5b869]">
                          إدارة وتنزيل أصوات الشيوخ بدون نت
                        </span>
                        <HardDrive className="w-4 h-4 text-[#fbbf24] shrink-0" />
                      </div>
                    </button>

                    {showOfflineAdhanManager && (
                      <div className="p-3.5 rounded-2xl bg-[#021410]/90 border border-[#e5b869]/25 space-y-3">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setOfflineManagerFilter('regular')}
                              className={`min-h-[44px] px-3.5 py-1.5 rounded-xl text-xs font-bold border whitespace-nowrap shrink-0 transition-colors ${
                                offlineManagerFilter === 'regular'
                                  ? 'bg-[#073f34] border-[#fbbf24] text-[#fbbf24]'
                                  : 'bg-[#041814] border-[#e5b869]/20 text-slate-300 hover:border-[#e5b869]/50'
                              }`}
                            >
                              أذان الصلوات الخمس ({Object.keys(ADHAN_SOURCES).length})
                            </button>
                            <button
                              type="button"
                              onClick={() => setOfflineManagerFilter('fajr')}
                              className={`min-h-[44px] px-3.5 py-1.5 rounded-xl text-xs font-bold border whitespace-nowrap shrink-0 transition-colors ${
                                offlineManagerFilter === 'fajr'
                                  ? 'bg-[#073f34] border-sky-400 text-sky-300'
                                  : 'bg-[#041814] border-[#e5b869]/20 text-slate-300 hover:border-sky-400/50'
                              }`}
                            >
                              أذان الفجر ({Object.keys(FAJR_ADHAN_SOURCES).length})
                            </button>
                          </div>
                          <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                            <span>اختر وحمّل ما تحتاجه فقط لتوفير مساحة جهازك</span>
                            <WifiOff className="w-3.5 h-3.5 text-[#e5b869]" />
                          </p>
                        </div>

                        <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                          {activeList.map((src) => {
                            const isFajrTab = offlineManagerFilter === 'fajr';
                            const isSelected = isFajrTab
                              ? selectedFajrReciter === src.id
                              : selectedAdhanReciter === src.id;
                            const isCached = Boolean(adhanCacheMap[src.id]);
                            const isDownloading = downloadingAdhanId === src.id;
                            const isPreviewing =
                              (playerState === 'playing' || playerState === 'loading') &&
                              activeAudioType === 'adhan' &&
                              previewingAdhanKind === offlineManagerFilter &&
                              previewingAdhanReciterId === src.id;
                            const sizeText = (src.approxSizeMb ?? 1.5).toFixed(1);

                            return (
                              <div
                                key={src.id}
                                className={`p-3 rounded-xl border transition-colors flex flex-col sm:flex-row-reverse sm:items-center justify-between gap-3 ${
                                  isSelected
                                    ? 'bg-[#062d24]/90 border-[#fbbf24]/70'
                                    : 'bg-[#041814]/85 border-[#e5b869]/20'
                                }`}
                              >
                                <div className="text-right space-y-1 flex-1 min-w-0">
                                  <div className="flex items-center justify-end gap-2 flex-wrap">
                                    {isSelected && (
                                      <span className="text-[11px] font-bold text-[#fbbf24] whitespace-nowrap">
                                        ✓ المختار حالياً
                                      </span>
                                    )}
                                    <h5 className="text-xs sm:text-sm font-bold text-slate-100">
                                      {src.nameAr}
                                    </h5>
                                  </div>
                                  <p className="text-[11px] text-slate-400 tabular-nums leading-relaxed">
                                    {src.khushuTagAr ? (
                                      <>
                                        <span className="text-slate-300">{src.khushuTagAr}</span>
                                        <span> · </span>
                                      </>
                                    ) : null}
                                    <span className="text-[#fbbf24]/85">~{sizeText} م.ب</span>
                                    <span> · </span>
                                    <span className={isCached ? 'text-emerald-300 font-semibold' : ''}>
                                      {isCached ? 'محفوظ بدون نت ✓' : 'غير محفوظ محلياً'}
                                    </span>
                                  </p>
                                </div>

                                <div className="flex items-center gap-2 flex-wrap justify-start shrink-0">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      isFajrTab
                                        ? setSelectedFajrReciter(src.id)
                                        : setSelectedAdhanReciter(src.id)
                                    }
                                    className={`min-h-[44px] px-3 py-1.5 rounded-xl text-xs font-bold border whitespace-nowrap shrink-0 transition-colors ${
                                      isSelected
                                        ? 'bg-[#fbbf24] text-[#021410] border-[#fbbf24]'
                                        : 'bg-[#03201a] text-slate-200 border-[#e5b869]/30 hover:border-[#fbbf24]/60'
                                    }`}
                                  >
                                    {isSelected ? 'مختار ✓' : 'اختيار'}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleToggleSample(src.id, isFajrTab)}
                                    className="min-h-[44px] px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-950/90 border border-emerald-500/40 text-emerald-200 hover:bg-emerald-900 flex items-center gap-1.5 whitespace-nowrap shrink-0"
                                  >
                                    {isPreviewing ? (
                                      <>
                                        <Square className="w-3 h-3 fill-current" />
                                        <span>إيقاف</span>
                                      </>
                                    ) : (
                                      <>
                                        <Play className="w-3 h-3 fill-current text-[#fbbf24]" />
                                        <span>معاينة</span>
                                      </>
                                    )}
                                  </button>

                                  {isCached ? (
                                    <button
                                      type="button"
                                      onClick={() => void handleRemoveAdhanOffline(src)}
                                      className="min-h-[44px] px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-950/60 border border-rose-500/35 text-rose-200 hover:bg-rose-900/70 flex items-center gap-1.5 whitespace-nowrap shrink-0"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span>إزالة</span>
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      disabled={isDownloading}
                                      onClick={() => void handleDownloadAdhanOffline(src)}
                                      className="min-h-[44px] px-3 py-1.5 rounded-xl text-xs font-bold bg-[#07382e] border border-emerald-500/45 text-emerald-200 hover:bg-[#094a3d] disabled:opacity-60 flex items-center gap-1.5 whitespace-nowrap shrink-0"
                                    >
                                      {isDownloading ? (
                                        <>
                                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                          <span>جاري الحفظ...</span>
                                        </>
                                      ) : (
                                        <>
                                          <Download className="w-3.5 h-3.5" />
                                          <span>حفظ بدون نت</span>
                                        </>
                                      )}
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            {/* Pre-Adhan Preparation Slider */}
            <div className="space-y-2 pt-2 border-t border-[#e5b869]/15">
              <div className="flex items-center justify-between text-xs text-slate-200 font-bold">
                <span className="text-[#fbbf24] font-mono text-sm tabular-nums">
                  {preReminder > 0 ? `قبل ${preReminder} دقيقة` : 'معطل'}
                </span>
                <span>التنبيه المسبق قبل الأذان (الافتراضي 10 دقائق):</span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                step="5"
                value={preReminder}
                onChange={(e) => setPreReminder(Number(e.target.value))}
                className="w-full h-2 bg-[#021410] rounded-lg appearance-none cursor-pointer accent-[#fbbf24] border border-[#e5b869]/35"
              />
              <div className="flex justify-between text-[10px] text-[#e5b869]/75 font-mono px-1 tabular-nums">
                <span>0 د</span>
                <span>5 د</span>
                <span>10 د</span>
                <span>15 د</span>
                <span>20 د</span>
                <span>25 د</span>
                <span>30 د</span>
              </div>
            </div>

            {/* Gold-Emerald Gradient Toggle Switches */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#041814] border border-[#e5b869]/25">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preSound}
                    onChange={(e) => setPreSound(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-[#fbbf24] peer-checked:to-emerald-500"></div>
                </label>
                <span className="text-xs text-slate-200 font-bold">نغمة التنبيه المسبق</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[#041814] border border-[#e5b869]/25">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fajrBoost}
                    onChange={(e) => setFajrBoost(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-[#fbbf24] peer-checked:to-emerald-500"></div>
                </label>
                <span className="text-xs text-slate-200 font-bold">رفع صوت الفجر</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[#041814] border border-[#e5b869]/25">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoDua}
                    onChange={(e) => {
                      const next = e.target.checked;
                      setAutoDua(next);
                      onUpdateSettings({ autoDuaAfterAdhan: next });
                      adhanPlayer.setAutoDua(next, selectedDuaReciter);
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-[#fbbf24] peer-checked:to-emerald-500"></div>
                </label>
                <span className="text-xs text-slate-200 font-bold">دعاء ما بعد الأذان</span>
              </div>
            </div>

            {/* Real Sheikh Voice Selection for Pre-Adhan Prayer Alerts */}
            <div className="space-y-2.5 pt-3 border-t border-[#e5b869]/20">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-[11px] text-emerald-300 font-semibold">
                  ﴿حَافِظُوا عَلَى الصَّلَوَاتِ وَالصَّلَاةِ الْوُسْطَىٰ﴾ — أصوات حقيقية
                </span>
                <div className="text-xs font-bold text-[#e5b869] text-right">
                  صوت الشيخ لتنبيه الاستعداد للصلاة (أصوات حقيقية):
                </div>
              </div>

              {/* Auto-Rotate Option */}
              <button
                type="button"
                onClick={() => {
                  setPreAdhanVoiceMode('rotate');
                  onUpdateSettings({ preAdhanVoiceMode: 'rotate' });
                }}
                className={`w-full p-3.5 rounded-2xl border text-right transition-all flex items-center justify-between gap-3 ${
                  preAdhanVoiceMode === 'rotate'
                    ? 'bg-gradient-to-br from-[#073f34] to-[#03221c] border-[#fbbf24] ring-2 ring-[#e5b869]/40 shadow-[0_0_20px_rgba(229,184,105,0.18)]'
                    : 'bg-[#041814]/90 border-[#e5b869]/20 hover:border-[#e5b869]/50'
                }`}
              >
                <span className="px-2.5 py-1 rounded-lg bg-[#fbbf24]/20 border border-[#fbbf24]/40 text-[#fbbf24] text-[11px] font-bold shrink-0">
                  متنوع تلقائياً
                </span>
                <div className="flex-1 text-right">
                  <div className="text-sm font-bold text-white font-amiri">
                    التبديل التلقائي بين أصوات الشيوخ الستة (أصوات حقيقية)
                  </div>
                  <div className="text-[11px] text-slate-300 mt-0.5">
                    يتغيّر صوت الشيخ قبل كل صلاة تلقائياً (العفاسي · الدوسري · المعيقلي · المنشاوي · عبد الباسط · القطامي)
                  </div>
                </div>
                <span
                  className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                    preAdhanVoiceMode === 'rotate' ? 'border-[#fbbf24] bg-[#fbbf24]/25' : 'border-slate-600'
                  }`}
                >
                  {preAdhanVoiceMode === 'rotate' && <span className="w-2 h-2 rounded-full bg-[#fbbf24]" />}
                </span>
              </button>

              {/* Individual Sheikh Cards for Pre-Adhan Alerts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {PRE_ADHAN_SHEIKH_VOICES.map((voice: PreAdhanVoiceProfile) => {
                  const isSelected = preAdhanVoiceMode === voice.id;
                  const isThisPlaying =
                    playerState === 'playing' &&
                    activeAudioType === 'pre_adhan_reminder' &&
                    previewingPreAdhanId === voice.id;
                  const isThisLoading =
                    playerState === 'loading' &&
                    activeAudioType === 'pre_adhan_reminder' &&
                    previewingPreAdhanId === voice.id;
                  return (
                    <div
                      key={voice.id}
                      onClick={() => {
                        setPreAdhanVoiceMode(voice.id);
                        onUpdateSettings({ preAdhanVoiceMode: voice.id });
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setPreAdhanVoiceMode(voice.id);
                          onUpdateSettings({ preAdhanVoiceMode: voice.id });
                        }
                      }}
                      className={`p-3 rounded-xl border text-right transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                        isSelected
                          ? 'bg-gradient-to-br from-[#073f34] to-[#03221c] border-[#fbbf24] ring-1 ring-[#e5b869]/40'
                          : 'bg-[#041814]/90 border-[#e5b869]/20 hover:border-[#e5b869]/50'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTestPreAdhanChime(voice.id);
                        }}
                        className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold flex items-center gap-1 shrink-0 transition-all ${
                          isThisPlaying || isThisLoading
                            ? 'bg-[#fbbf24] text-slate-950 border-[#fbbf24]'
                            : 'bg-[#031914] text-[#fbbf24] border-[#e5b869]/35 hover:border-[#fbbf24]'
                        }`}
                        title={`استماع لتنبيه الصلاة بصوت ${voice.nameAr}`}
                      >
                        {isThisLoading ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>تحضير...</span>
                          </>
                        ) : isThisPlaying ? (
                          <>
                            <Square className="w-3 h-3 fill-current" />
                            <span>إيقاف</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3 fill-current" />
                            <span>استماع</span>
                          </>
                        )}
                      </button>

                      <div className="flex-1 min-w-0 text-right">
                        <div className="text-xs font-bold text-white truncate">{voice.nameAr}</div>
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">{voice.styleAr}</div>
                      </div>

                      <span
                        className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected ? 'border-[#fbbf24] bg-[#fbbf24]/25' : 'border-slate-600'
                        }`}
                      >
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#fbbf24]" />}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {autoDua && (
              <div className="pt-2 border-t border-[#e5b869]/15 flex flex-col sm:flex-row items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleDuaPreview}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#fbbf24] to-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1 shrink-0"
                >
                  {playerState === 'loading' && activeAudioType === 'dua' ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>جاري التحميل...</span>
                    </>
                  ) : playerState === 'playing' && activeAudioType === 'dua' ? (
                    <>
                      <Square className="w-3.5 h-3.5 fill-current" />
                      <span>إيقاف الدعاء</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>معاينة الدعاء</span>
                    </>
                  )}
                </button>
                <select
                  value={selectedDuaReciter}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedDuaReciter(val);
                    onUpdateSettings({ duaAudioReciter: val });
                    adhanPlayer.setAutoDua(autoDua, val);
                  }}
                  className="w-full bg-[#021410] border border-[#e5b869]/30 rounded-xl px-4 py-2 text-xs text-slate-100 focus:outline-none focus:border-[#fbbf24] text-right"
                >
                  {Object.values(DUA_SOURCES).map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nameAr}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <NotificationShadeSettingsCard
            stickyEnabled={stickyNotificationEnabled}
            adhanBannerEnabled={adhanBannerNotificationEnabled}
            mosqueTheme={notificationMosqueTheme}
            onChangeStickyEnabled={(val) => {
              setStickyNotificationEnabled(val);
              onUpdateSettings({ stickyNotificationEnabled: val });
            }}
            onChangeAdhanBannerEnabled={(val) => {
              setAdhanBannerNotificationEnabled(val);
              onUpdateSettings({ adhanBannerNotificationEnabled: val });
            }}
            onChangeMosqueTheme={(val) => {
              setNotificationMosqueTheme(val);
              onUpdateSettings({ notificationMosqueTheme: val });
            }}
            currentLocation={currentLocation}
            prayerTimes={prayerTimes}
          />

          {/* 4. Periodic Verse & Hadith Popup */}
          <div className="p-5 rounded-2xl bg-[#03201a]/85 border border-[#e5b869]/35 space-y-4 shadow-lg">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                {onTestPeriodicReminder && (
                  <button
                    type="button"
                    onClick={onTestPeriodicReminder}
                    className="min-h-[40px] text-xs px-3.5 py-2 rounded-xl bg-[#052921] border border-[#e5b869]/40 text-[#fbbf24] hover:bg-[#07382e] flex items-center gap-1.5 font-bold transition-all whitespace-nowrap"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>معاينة داخل التطبيق</span>
                  </button>
                )}
                {isNativeAndroidApp() && (
                  <button
                    type="button"
                    onClick={() => {
                      void testNativeBackgroundAlarm('periodic').then((res) => {
                        if (res.triggered) {
                          setPeriodicPreviewFeedback(
                            overlayGranted && periodicOverlayEnabled
                              ? 'تم إطلاق بطاقة المحراب العائمة الآن — تظهر أسفل الشاشة حتى خارج التطبيق.'
                              : 'تم إرسال إشعار التذكير الدوري إلى الشريط العلوي (امنح إذن الظهور فوق التطبيقات لتعمل كبطاقة عائمة).'
                          );
                        }
                      });
                    }}
                    className="min-h-[40px] text-xs px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#fbbf24] to-[#d4af37] text-slate-950 font-black hover:brightness-105 flex items-center gap-1.5 transition-all whitespace-nowrap"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>معاينة البطاقة خارج التطبيق</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 text-[#fbbf24] font-bold text-base font-amiri">
                <span className="text-lg">4. التذكير الدوري بالآيات والأحاديث والحِكم</span>
                <BookOpen className="w-5 h-5 text-[#fbbf24]" />
              </div>
            </div>

            {periodicPreviewFeedback && (
              <div className="p-3 rounded-xl bg-[#041814] border border-emerald-500/40 text-xs text-emerald-200 text-right leading-relaxed">
                {periodicPreviewFeedback}
              </div>
            )}

            {/* Enable/Disable Toggle */}
            <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-[#041814] border border-[#e5b869]/25">
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={periodicEnabled}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setPeriodicEnabled(checked);
                    onUpdateSettings({ periodicReminderEnabled: checked });
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-[#fbbf24] peer-checked:to-emerald-500"></div>
              </label>
              <div className="text-right">
                <span className="text-xs sm:text-sm text-slate-100 font-bold block">
                  تفعيل البطاقة العائمة الدورية للآيات والأحاديث
                </span>
                <span className="text-[11px] text-slate-400">
                  تظهر تلقائياً بالفاصل الزمني المحدد سواء كنت داخل التطبيق أو خارجه
                </span>
              </div>
            </div>

            {/* Interval Selection Buttons */}
            <div className="space-y-2 pt-1">
              <div className="text-xs font-bold text-[#e5b869] text-right">
                الفاصل الزمني للظهور:
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {([
                  { value: 5, label: 'كل 5 دقائق' },
                  { value: 10, label: 'كل 10 دقائق' },
                  { value: 15, label: 'كل 15 دقيقة' },
                  { value: 30, label: 'كل 30 دقيقة' },
                  { value: 60, label: 'كل ساعة' },
                ] as const).map((opt) => {
                  const isSelected = periodicInterval === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setPeriodicInterval(opt.value);
                        onUpdateSettings({ periodicReminderInterval: opt.value });
                      }}
                      className={`min-h-[44px] px-3 py-2.5 rounded-xl border text-xs font-bold transition-all whitespace-nowrap ${
                        isSelected
                          ? 'bg-[#073f34] border-[#fbbf24] text-[#fbbf24] ring-1 ring-[#e5b869]/40 shadow-[0_0_12px_rgba(229,184,105,0.2)]'
                          : 'bg-[#041814] border-[#e5b869]/20 text-slate-300 hover:border-[#e5b869]/45'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content Filter Buttons */}
            <div className="space-y-2 pt-1">
              <div className="text-xs font-bold text-[#e5b869] text-right">
                نوع المحتوى المعروض:
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {([
                  { id: 'both', label: 'الكل بالتناوب' },
                  { id: 'quran', label: 'آيات قرآنية فقط' },
                  { id: 'hadith', label: 'أحاديث نبوية فقط' },
                  { id: 'wisdom', label: 'حكمة اليوم الدينية' },
                ] as const).map((filter) => {
                  const isSelected = periodicContentType === filter.id;
                  return (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => {
                        setPeriodicContentType(filter.id);
                        onUpdateSettings({ periodicReminderContentType: filter.id });
                      }}
                      className={`min-h-[44px] px-2.5 py-2 rounded-xl border text-xs font-bold transition-all text-center whitespace-nowrap ${
                        isSelected
                          ? 'bg-[#073f34] border-[#fbbf24] text-[#fbbf24] ring-1 ring-[#e5b869]/40 shadow-[0_0_12px_rgba(229,184,105,0.2)]'
                          : 'bg-[#041814] border-[#e5b869]/20 text-slate-300 hover:border-[#e5b869]/45'
                      }`}
                    >
                      {filter.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Out-of-App Floating Overlay Toggle & Permission */}
            <div className="p-3.5 rounded-xl bg-[#041814] border border-[#e5b869]/25 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={periodicOverlayEnabled}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setPeriodicOverlayEnabled(checked);
                      onUpdateSettings({ periodicOverlayEnabled: checked });
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-[#fbbf24] peer-checked:to-emerald-500"></div>
                </label>
                <div className="text-right">
                  <span className="text-xs sm:text-sm text-slate-100 font-bold block">
                    الظهور كبطاقة محراب عائمة خارج التطبيق
                  </span>
                  <span className="text-[11px] text-slate-400">
                    تظهر فوق أي تطبيق آخر كبطاقة مصغرة بأزرار التالي والإغلاق (مع إشعار احتياطي عند قفل الشاشة)
                  </span>
                </div>
              </div>

              {isNativeAndroidApp() && periodicOverlayEnabled && (
                <div className="pt-2 border-t border-[#e5b869]/15 space-y-2.5">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    {overlayGranted ? (
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold">
                        إذن الظهور فوق التطبيقات مفعّل
                      </span>
                    ) : (
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => {
                            void requestNativeOverlayPermission().then(() =>
                              getNativeBackgroundReliabilityStatus().then((st) =>
                                setOverlayGranted(st.overlayGranted)
                              )
                            );
                          }}
                          className="min-h-[44px] px-4 py-2 rounded-xl bg-[#fbbf24] text-slate-950 text-xs font-black whitespace-nowrap"
                        >
                          منح إذن الظهور فوق التطبيقات
                        </button>
                        <button
                          type="button"
                          onClick={() => void openNativeAppInfoSettings()}
                          className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#07261E] border border-[#e5b869]/45 text-[#fbbf24] text-xs font-bold whitespace-nowrap"
                        >
                          فتح معلومات التطبيق (لفك القيد)
                        </button>
                      </div>
                    )}
                    <span className="text-[11px] text-slate-400 text-right">
                      {overlayGranted
                        ? 'سيتم عرض البطاقة العائمة تلقائياً خارج التطبيق حسب الفاصل المحدد'
                        : 'مطلوب للبطاقة العائمة، وبدونه يصلك التذكير كإشعار منبثق عادي تلقائياً'}
                    </span>
                  </div>

                  {!overlayGranted && (
                    <div className="p-3 rounded-xl bg-[#03130f] border border-amber-500/30 text-right space-y-1.5 text-[11px] text-slate-300 leading-relaxed">
                      <div className="font-bold text-[#fbbf24]">
                        إذا ظهرت رسالة «تم رفض وصول التطبيق / الإعدادات المقيدة» (Android 13+):
                      </div>
                      <p>
                        ١. اضغط على <strong className="text-white">«فتح معلومات التطبيق (لفك القيد)»</strong>.
                      </p>
                      <p>
                        ٢. اضغط على <strong className="text-white">الثلاث نقاط (⋮)</strong> أعلى الزاوية (أو أسفل الصفحة) واختر{' '}
                        <strong className="text-emerald-300">«السماح بالإعدادات المقيدة / Allow restricted settings»</strong>.
                      </p>
                      <p>
                        ٣. ارجع واضغط <strong className="text-white">«منح إذن الظهور فوق التطبيقات»</strong> وفعّل المفتاح.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Night Quiet Hours (Pause During Sleep) */}
            <div className="p-3.5 rounded-xl bg-[#041814] border border-[#e5b869]/25 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={periodicQuietHoursEnabled}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setPeriodicQuietHoursEnabled(checked);
                      onUpdateSettings({ periodicQuietHoursEnabled: checked });
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-[#fbbf24] peer-checked:to-emerald-500"></div>
                </label>
                <div className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <span className="text-xs sm:text-sm text-slate-100 font-bold">
                      فترة الهدوء الليلية (توقف تلقائي أثناء النوم)
                    </span>
                    <Moon className="w-4 h-4 text-[#fbbf24]" />
                  </div>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    تُوقف التذكير الدوري مؤقتاً خلال ساعات النوم وتستأنف تلقائياً عند نهايتها
                  </span>
                </div>
              </div>

              {periodicQuietHoursEnabled && (
                <div className="space-y-2.5 pt-2 border-t border-[#e5b869]/15">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[#02120e] border border-[#e5b869]/20">
                      <input
                        type="time"
                        dir="ltr"
                        value={periodicQuietStart}
                        onChange={(e) => {
                          const val = e.target.value || '23:00';
                          setPeriodicQuietStart(val);
                          onUpdateSettings({ periodicQuietStart: val });
                        }}
                        className="bg-[#06261f] border border-[#e5b869]/35 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-[#fbbf24] tabular-nums focus:outline-none focus:border-[#fbbf24]"
                      />
                      <span className="text-xs font-bold text-slate-200">تبدأ من الساعة</span>
                    </label>

                    <label className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[#02120e] border border-[#e5b869]/20">
                      <input
                        type="time"
                        dir="ltr"
                        value={periodicQuietEnd}
                        onChange={(e) => {
                          const val = e.target.value || '06:00';
                          setPeriodicQuietEnd(val);
                          onUpdateSettings({ periodicQuietEnd: val });
                        }}
                        className="bg-[#06261f] border border-[#e5b869]/35 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-[#fbbf24] tabular-nums focus:outline-none focus:border-[#fbbf24]"
                      />
                      <span className="text-xs font-bold text-slate-200">وتنتهي الساعة</span>
                    </label>
                  </div>

                  <div className="text-[11px] text-slate-300 flex items-center justify-between flex-wrap gap-2 tabular-nums">
                    <span className="text-[#e5b869] font-semibold">
                      {isWithinPeriodicQuietHours(new Date(), periodicQuietStart, periodicQuietEnd)
                        ? 'فترة الهدوء نشطة الآن — التذكير متوقف مؤقتاً'
                        : 'الجدول نشط الآن خارج ساعات الهدوء'}
                    </span>
                    <span>
                      من {formatQuietTime12Ar(periodicQuietStart)} إلى{' '}
                      {formatQuietTime12Ar(periodicQuietEnd)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Optional Soft Notification Chime Toggle */}
            <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-[#041814] border border-[#e5b869]/25">
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={periodicSoundEnabled}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setPeriodicSoundEnabled(checked);
                    onUpdateSettings({ periodicReminderSoundEnabled: checked });
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-[#fbbf24] peer-checked:to-emerald-500"></div>
              </label>
              <div className="text-right">
                <span className="text-xs sm:text-sm text-slate-100 font-bold block">
                  نغمة تنبيه لطيفة عند ظهور الآية أو الحديث
                </span>
                <span className="text-[11px] text-slate-400">
                  {periodicSoundEnabled
                    ? 'مفعّلة — تصدر رنّة هادئة قصيرة (وتتوقف تلقائياً في وضع الاجتماعات والهدوء الليلي)'
                    : 'صامتة — تظهر البطاقة بهدوء تام بدون صوت'}
                </span>
              </div>
            </div>
          </div>

          {/* 5. Periodic Salawat Upon the Prophet (ﷺ) with Multiple Sheikh Voices */}
          <div className="p-5 rounded-2xl bg-[#03201a]/85 border border-[#e5b869]/35 space-y-4 shadow-lg">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleToggleSalawatPreview(salawatVoiceMode)}
                className="text-xs px-3.5 py-2 rounded-xl bg-[#052921] border border-[#e5b869]/40 text-[#fbbf24] hover:bg-[#07382e] flex items-center gap-1.5 font-bold transition-all"
              >
                {playerState === 'loading' && activeAudioType === 'salawat' ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>جاري تحضير الصوت...</span>
                  </>
                ) : playerState === 'playing' && activeAudioType === 'salawat' ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>إيقاف النطق الآن</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>تجربة الصلاة على النبي ﷺ</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-2 text-[#fbbf24] font-bold text-base font-amiri">
                <span className="text-lg">5. الصلاة على النبي ﷺ صوتياً (أصوات شيوخ متعددة)</span>
                <Heart className="w-5 h-5 text-[#fbbf24]" />
              </div>
            </div>

            {salawatErrorMsg && (
              <div className="p-3 rounded-xl bg-amber-950/70 border border-amber-500/40 text-amber-200 text-xs text-right">
                {salawatErrorMsg}
              </div>
            )}

            {/* Enable/Disable Salawat Audio Toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#041814] border border-[#e5b869]/25">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={salawatEnabled}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setSalawatEnabled(checked);
                    onUpdateSettings({ salawatEnabled: checked });
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-[#fbbf24] peer-checked:to-emerald-500"></div>
              </label>
              <div className="text-right">
                <span className="text-xs sm:text-sm text-slate-100 font-bold block">
                  تفعيل النطق الصوتي الدوري للصلاة على النبي ﷺ
                </span>
                <span className="text-[11px] text-slate-400">
                  ينطق الصلاة على النبي ﷺ تلقائياً حسب المدة المختارة دون مقاطعة الأذان أو الدعاء
                </span>
              </div>
            </div>

            {/* Salawat Interval Selector */}
            <div className="space-y-2 pt-1">
              <div className="text-xs font-bold text-[#e5b869] text-right">
                تكرار النطق الصوتي:
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {([
                  { value: 5, label: 'كل 5 دقائق' },
                  { value: 10, label: 'كل 10 دقائق' },
                  { value: 15, label: 'كل 15 دقيقة' },
                  { value: 30, label: 'كل 30 دقيقة' },
                  { value: 60, label: 'كل ساعة' },
                ] as const).map((opt) => {
                  const isSelected = salawatInterval === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setSalawatInterval(opt.value);
                        onUpdateSettings({ salawatIntervalMinutes: opt.value });
                      }}
                      className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition-all whitespace-nowrap ${
                        isSelected
                          ? 'bg-[#073f34] border-[#fbbf24] text-[#fbbf24] ring-1 ring-[#e5b869]/40 shadow-[0_0_12px_rgba(229,184,105,0.2)]'
                          : 'bg-[#041814] border-[#e5b869]/20 text-slate-300 hover:border-[#e5b869]/45'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sheikh Voice Selection (Auto-Rotate + Specific Sheikhs with Inline Preview) */}
            <div className="space-y-2.5 pt-1">
              <div className="text-xs font-bold text-[#e5b869] text-right">
                اختيار صوت الشيخ للنطق:
              </div>

              {/* Auto-rotate Multi-Sheikh Option */}
              <button
                type="button"
                onClick={() => {
                  setSalawatVoiceMode('rotate');
                  onUpdateSettings({ salawatVoiceMode: 'rotate' });
                }}
                className={`w-full p-3.5 rounded-2xl border text-right transition-all flex items-center justify-between gap-3 ${
                  salawatVoiceMode === 'rotate'
                    ? 'bg-gradient-to-br from-[#073f34] to-[#03221c] border-[#fbbf24] ring-2 ring-[#e5b869]/40 shadow-[0_0_20px_rgba(229,184,105,0.18)]'
                    : 'bg-[#041814]/90 border-[#e5b869]/20 hover:border-[#e5b869]/50'
                }`}
              >
                <span className="px-2.5 py-1 rounded-lg bg-[#fbbf24]/20 border border-[#fbbf24]/40 text-[#fbbf24] text-[11px] font-bold shrink-0">
                  متنوع تلقائياً
                </span>
                <div className="flex-1 text-right">
                  <div className="text-sm font-bold text-white font-amiri">
                    التبديل التلقائي بين أصوات الشيوخ الخمسة (أصوات حقيقية)
                  </div>
                  <div className="text-[11px] text-slate-300 mt-0.5">
                    يتغيّر صوت الشيخ الحقيقي تلقائياً في كل مرة (العفاسي · الدوسري · المعيقلي · النقشبندي الكامل · النقشبندي إذاعة القرآن)
                  </div>
                </div>
                <span
                  className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                    salawatVoiceMode === 'rotate' ? 'border-[#fbbf24] bg-[#fbbf24]/25' : 'border-slate-600'
                  }`}
                >
                  {salawatVoiceMode === 'rotate' && <span className="w-2 h-2 rounded-full bg-[#fbbf24]" />}
                </span>
              </button>

              {/* Individual Sheikh Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {SALAWAT_SHEIKH_VOICES.map((voice: SalawatVoiceProfile, idx: number) => {
                  const isSelected = salawatVoiceMode === voice.id;
                  const isThisPlaying =
                    playerState === 'playing' &&
                    activeAudioType === 'salawat' &&
                    previewingSalawatId === voice.id;
                  const isThisLoading =
                    playerState === 'loading' &&
                    activeAudioType === 'salawat' &&
                    previewingSalawatId === voice.id;
                  const isLastOdd =
                    idx === SALAWAT_SHEIKH_VOICES.length - 1 &&
                    SALAWAT_SHEIKH_VOICES.length % 2 === 1;
                  return (
                    <div
                      key={voice.id}
                      onClick={() => {
                        setSalawatVoiceMode(voice.id);
                        onUpdateSettings({ salawatVoiceMode: voice.id });
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSalawatVoiceMode(voice.id);
                          onUpdateSettings({ salawatVoiceMode: voice.id });
                        }
                      }}
                      className={`p-3 rounded-xl border text-right transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                        isLastOdd ? 'sm:col-span-2' : ''
                      } ${
                        isSelected
                          ? 'bg-gradient-to-br from-[#073f34] to-[#03221c] border-[#fbbf24] ring-1 ring-[#e5b869]/40'
                          : 'bg-[#041814]/90 border-[#e5b869]/20 hover:border-[#e5b869]/50'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleSalawatPreview(voice.id);
                        }}
                        className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold flex items-center gap-1 shrink-0 transition-all ${
                          isThisPlaying || isThisLoading
                            ? 'bg-[#fbbf24] text-slate-950 border-[#fbbf24]'
                            : 'bg-[#031914] text-[#fbbf24] border-[#e5b869]/35 hover:border-[#fbbf24]'
                        }`}
                        title={`تجربة صوت ${voice.nameAr}`}
                      >
                        {isThisLoading ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>تحضير...</span>
                          </>
                        ) : isThisPlaying ? (
                          <>
                            <Square className="w-3 h-3 fill-current" />
                            <span>إيقاف</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3 fill-current" />
                            <span>استماع</span>
                          </>
                        )}
                      </button>

                      <div className="flex-1 min-w-0 text-right">
                        <div className="text-xs font-bold text-white truncate">{voice.nameAr}</div>
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">{voice.styleAr}</div>
                      </div>

                      <span
                        className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected ? 'border-[#fbbf24] bg-[#fbbf24]/25' : 'border-slate-600'
                        }`}
                      >
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#fbbf24]" />}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 6. Calculation Method & City */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-[#03201a]/85 border border-[#e5b869]/35 space-y-3 shadow-lg">
              <label className="flex items-center justify-end gap-2 text-[#fbbf24] font-bold text-base font-amiri">
                <span>طريقة الحساب الفلكي:</span>
                <Calculator className="w-5 h-5 text-[#fbbf24]" />
              </label>
              <select
                value={selectedCalcMethod}
                onChange={(e) => setSelectedCalcMethod(e.target.value as any)}
                className="w-full bg-[#021410] border border-[#e5b869]/35 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-[#fbbf24] text-right"
              >
                {CALCULATION_METHODS_LIST.map((method) => (
                  <option key={method.id} value={method.id}>
                    {method.nameAr}
                  </option>
                ))}
              </select>
            </div>

            <div className="p-5 rounded-2xl bg-[#03201a]/85 border border-[#e5b869]/35 space-y-3 shadow-lg">
              <label className="flex items-center justify-end gap-2 text-[#fbbf24] font-bold text-base font-amiri">
                <span>المدينة والبلد:</span>
                <MapPin className="w-5 h-5 text-[#fbbf24]" />
              </label>
              <select
                value={selectedCityId}
                onChange={(e) => setSelectedCityId(e.target.value)}
                className="w-full bg-[#021410] border border-[#e5b869]/35 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-[#fbbf24] text-right"
              >
                {CITIES.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.nameAr} ({city.countryAr})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>

        {/* Sticky Bottom Footer with Luxury Gold-Emerald Save Button */}
        <div className="sticky bottom-0 shrink-0 px-4 py-3 sm:px-6 sm:py-3.5 border-t border-[#e5b869]/30 bg-gradient-to-t from-[#031914] to-[#04241d] flex items-center justify-between gap-3 z-20">
          <button
            type="button"
            onClick={handleSaveChanges}
            className="w-full sm:w-auto px-8 sm:px-10 py-3 rounded-2xl bg-gradient-to-r from-[#fbbf24] via-[#e5b869] to-emerald-400 hover:brightness-105 text-slate-950 font-black text-sm transition-all shadow-[0_8px_28px_rgba(229,184,105,0.28)] border border-amber-200/50 hover:scale-[1.02] active:scale-98"
          >
            حفظ وتطبيق الإعدادات
          </button>

          <button
            type="button"
            onClick={onClose}
            className="hidden sm:inline-flex px-5 py-3 rounded-2xl border border-[#e5b869]/30 text-slate-300 hover:text-white hover:border-[#e5b869]/60 text-xs font-bold transition-colors"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
};
