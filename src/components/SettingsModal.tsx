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
} from 'lucide-react';
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

export type SettingsTabId = 'general' | 'iqama' | 'themes' | 'simulations' | 'fasting' | 'widgets';

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
  const [fajrBoost, setFajrBoost] = useState<boolean>(settings.fajrBoostVolume ?? true);
  const [preReminder, setPreReminder] = useState<number>(settings.preAdhanReminderMinutes ?? 10);
  const [preSound, setPreSound] = useState<boolean>(settings.preAdhanSoundEnabled ?? true);
  const [iqamaTimes, setIqamaTimes] = useState<IqamaTimes>(
    settings.iqamaMinutes || { fajr: 25, dhuhr: 20, asr: 20, maghrib: 10, isha: 20 }
  );
  const [morningTime, setMorningTime] = useState<string>(settings.morningAdhkarTime || '06:00');
  const [eveningTime, setEveningTime] = useState<string>(settings.eveningAdhkarTime || '17:00');
  const [selectedAdhkarReciter, setSelectedAdhkarReciter] = useState<string>(settings.adhkarReciter || 'alafasy_adhkar');
  const [selectedIqamaStyle, setSelectedIqamaStyle] = useState<'ring' | 'split' | 'pill'>(settings.iqamaStyle || 'ring');
  const [selectedAdhanLayout, setSelectedAdhanLayout] = useState<'editorial-horizon' | 'architectural-sanctuary' | 'ambient-aura'>(settings.adhanModalLayout || 'editorial-horizon');
  const [selectedAdhanCountdownStyle, setSelectedAdhanCountdownStyle] = useState<'islamic-mihrab' | 'rub-el-hizb' | 'mashrabiya-arabesque' | 'celestial-astrolabe'>(settings.adhanCountdownStyle || 'islamic-mihrab');
  const [periodicEnabled, setPeriodicEnabled] = useState<boolean>(settings.periodicReminderEnabled ?? true);
  const [periodicInterval, setPeriodicInterval] = useState<5 | 10 | 15 | 30 | 60>(settings.periodicReminderInterval ?? 15);
  const [periodicContentType, setPeriodicContentType] = useState<'both' | 'quran' | 'hadith'>(settings.periodicReminderContentType || 'both');
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
  const [fastingIntentDraft, setFastingIntentDraft] = useState<boolean>(() => loadFastingIntent());

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
        }
      },
      onError: (msg) => {
        setSalawatErrorMsg(msg);
      },
      onUnlocked: () => setIsAudioUnlocked(true),
    });
    return () => unsub();
  }, []);

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
      setSelectedAdhkarReciter(s.adhkarReciter || 'alafasy_adhkar');
      setSelectedIqamaStyle(s.iqamaStyle || 'ring');
      setSelectedAdhanLayout(s.adhanModalLayout || 'editorial-horizon');
      setSelectedAdhanCountdownStyle(s.adhanCountdownStyle || 'islamic-mihrab');
      setPeriodicEnabled(s.periodicReminderEnabled ?? true);
      setPeriodicInterval(s.periodicReminderInterval ?? 15);
      setPeriodicContentType(s.periodicReminderContentType || 'both');
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
      setFastingIntentDraft(loadFastingIntent());
    }
  }, [isOpen, initialTab]);

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

  const handleToggleAdhkarPreview = () => {
    if (playerState === 'playing' && activeAudioType === 'adhkar') {
      adhanPlayer.stop();
    } else {
      adhanPlayer.playAdhkar(selectedAdhkarReciter, 'أذكار الصباح والمساء المكتوبة');
    }
  };

  const handleToggleSample = (reciterKey: string, isFajr: boolean = false) => {
    const kind = isFajr ? 'fajr' : 'regular';
    if (
      (playerState === 'playing' || playerState === 'loading') &&
      activeAudioType === 'adhan' &&
      previewingAdhanKind === kind
    ) {
      adhanPlayer.stop();
      setPreviewingAdhanKind(null);
    } else {
      setPreviewingAdhanKind(kind);
      adhanPlayer.playAdhan(reciterKey, isFajr ? 'fajr' : 'dhuhr', isFajr && fajrBoost);
    }
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
      adhkarReciter: selectedAdhkarReciter,
      iqamaStyle: selectedIqamaStyle,
      adhanModalLayout: selectedAdhanLayout,
      adhanCountdownStyle: selectedAdhanCountdownStyle,
      periodicReminderEnabled: periodicEnabled,
      periodicReminderInterval: periodicInterval,
      periodicReminderContentType: periodicContentType,
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
    });
    saveFastingPreferences({
      whiteDaysEnabled: fastingWhiteDaysEnabled,
      monThuEnabled: fastingMonThuEnabled,
      ashuraArafahEnabled: fastingAshuraArafahEnabled,
      showFastingStatsInRecord,
    });
    adhanPlayer.setAutoDua(autoDua, selectedDuaReciter);
    onClose();
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
          </div>
        </div>

        {/* Scrollable Modal Body */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 py-3 md:px-6 md:py-5 space-y-6 relative z-10 w-full max-w-full">

          {activeSettingsTab === 'iqama' ? (
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
                  <div
                    className="theme-keep-light p-5 rounded-3xl bg-[#111C18] border-2 border-[#D4AF37]/50 space-y-4 sm:col-span-2 shadow-lg text-right"
                    dir="rtl"
                  >
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div>
                        <h5 className="font-bold text-base text-[#D4AF37] font-amiri flex items-center gap-1.5">
                          <span>🕌 إشعارات المتابعة الذكية بعد كل صلاة</span>
                        </h5>
                        <p className="text-xs text-slate-300 mt-0.5">
                          إشعار تفاعلي بعد الأذان لتسجيل الفريضة وأذكار ما بعد الصلاة والوِرد اليومي بلمسة واحدة
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
                              className={`min-h-[42px] px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
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
                        onClose();
                        window.dispatchEvent(new CustomEvent('open_fullscreen_adhan_simulation'));
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
                        الاستماع لتلاوة أذكار الصباح والمساء بصوت نقي وعذب (الشيخ مشاري راشد العفاسي).
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleToggleAdhkarPreview}
                      className={`w-full px-4 py-2.5 rounded-xl border font-bold text-xs shadow transition-all flex items-center justify-center gap-2 ${
                        playerState === 'playing' && activeAudioType === 'adhkar'
                          ? 'bg-rose-600 border-rose-500 text-white'
                          : 'bg-[#05261f] border-[#e5b869]/40 text-[#fbbf24] hover:bg-[#07362c]'
                      }`}
                    >
                      {playerState === 'playing' && activeAudioType === 'adhkar' ? (
                        <>
                          <Square className="w-3.5 h-3.5 fill-current" />
                          <span>إيقاف تلاوة الأذكار</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>اختبار صوت الأذكار</span>
                        </>
                      )}
                    </button>
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
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleToggleSample(selectedAdhanReciter, false)}
                  className="text-xs px-3 py-1.5 rounded-xl bg-emerald-950 border border-emerald-500/45 text-emerald-300 hover:bg-emerald-900 flex items-center gap-1.5 font-bold"
                >
                  <span>
                    {(playerState === 'playing' || playerState === 'loading') &&
                    activeAudioType === 'adhan' &&
                    previewingAdhanKind === 'regular'
                      ? 'إيقاف المعاينة'
                      : 'معاينة صوت المؤذن'}
                  </span>
                  {(playerState === 'playing' || playerState === 'loading') &&
                  activeAudioType === 'adhan' &&
                  previewingAdhanKind === 'regular' ? (
                    <Square className="w-3 h-3 fill-current" />
                  ) : (
                    <Play className="w-3 h-3 fill-current text-[#fbbf24]" />
                  )}
                </button>
                <label className="text-xs font-bold text-[#e5b869] flex items-center gap-1.5">
                  <span>صوت المؤذن للصلوات الخمس (أصوات شيوخ حقيقية):</span>
                  <Volume2 className="w-4 h-4" />
                </label>
              </div>
              <select
                value={selectedAdhanReciter}
                onChange={(e) => setSelectedAdhanReciter(e.target.value)}
                className="w-full bg-[#021410] border border-[#e5b869]/35 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-[#fbbf24] text-right font-sans"
              >
                {Object.values(ADHAN_SOURCES).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nameAr}
                  </option>
                ))}
              </select>
            </div>

            {/* Distinct Full-Length Fajr Adhan Dropdown */}
            <div className="space-y-2 pt-2 border-t border-[#e5b869]/15">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleToggleSample(selectedFajrReciter, true)}
                  className="text-xs px-3 py-1.5 rounded-xl bg-emerald-950 border border-sky-500/45 text-sky-300 hover:bg-emerald-900 flex items-center gap-1.5 font-bold"
                >
                  <span>
                    {(playerState === 'playing' || playerState === 'loading') &&
                    activeAudioType === 'adhan' &&
                    previewingAdhanKind === 'fajr'
                      ? 'إيقاف الفجر'
                      : 'معاينة الفجر الكامل'}
                  </span>
                  {(playerState === 'playing' || playerState === 'loading') &&
                  activeAudioType === 'adhan' &&
                  previewingAdhanKind === 'fajr' ? (
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
                onChange={(e) => setSelectedFajrReciter(e.target.value)}
                className="w-full bg-[#021410] border border-[#e5b869]/35 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-[#fbbf24] text-right font-sans"
              >
                {Object.values(FAJR_ADHAN_SOURCES).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nameAr}
                  </option>
                ))}
              </select>
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
                    onChange={(e) => setAutoDua(e.target.checked)}
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
                  onChange={(e) => setSelectedDuaReciter(e.target.value)}
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

          {/* 4. Periodic Verse & Hadith Popup */}
          <div className="p-5 rounded-2xl bg-[#03201a]/85 border border-[#e5b869]/35 space-y-4 shadow-lg">
            <div className="flex items-center justify-between flex-wrap gap-2">
              {onTestPeriodicReminder && (
                <button
                  type="button"
                  onClick={onTestPeriodicReminder}
                  className="text-xs px-3.5 py-2 rounded-xl bg-[#052921] border border-[#e5b869]/40 text-[#fbbf24] hover:bg-[#07382e] flex items-center gap-1.5 font-bold transition-all"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>معاينة التذكير الآن</span>
                </button>
              )}

              <div className="flex items-center gap-2 text-[#fbbf24] font-bold text-base font-amiri">
                <span className="text-lg">4. التذكير الدوري بالآيات والأحاديث</span>
                <BookOpen className="w-5 h-5 text-[#fbbf24]" />
              </div>
            </div>

            {/* Enable/Disable Toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#041814] border border-[#e5b869]/25">
              <label className="relative inline-flex items-center cursor-pointer">
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
                  تظهر تلقائياً أسفل الشاشة بالفاصل الزمني المحدد وتُحفظ إعداداتها محلياً
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

            {/* Content Filter Buttons */}
            <div className="space-y-2 pt-1">
              <div className="text-xs font-bold text-[#e5b869] text-right">
                نوع المحتوى المعروض:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {([
                  { id: 'both', label: 'آيات وأحاديث معاً' },
                  { id: 'quran', label: 'آيات قرآنية فقط' },
                  { id: 'hadith', label: 'أحاديث نبوية فقط' },
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
                      className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition-all text-center whitespace-nowrap ${
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
