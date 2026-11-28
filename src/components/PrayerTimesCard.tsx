import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Clock,
  Volume2,
  Square,
  Bell,
  BellOff,
  Calendar,
  Sun,
  Moon,
  Sunrise,
  Sunset,
  CheckCircle2,
  AlertTriangle,
  Play,
  ShieldCheck,
  Radio,
  Loader2,
  Timer,
  Sparkles,
  BookOpen,
  Check,
  Vibrate,
  X,
  Plane,
  Pause,
  RefreshCw,
} from 'lucide-react';
import { PrayerTimeData, CityLocation, UserSettings, PrayerName } from '../types';
import {
  adhanPlayer,
  AudioPlayerState,
  ADHAN_SOURCES,
  PreAdhanVoiceProfile,
  IqamaVoiceProfile,
  resolvePrayerReciter,
} from '../utils/audioAdhan';
import { backgroundService } from '../utils/backgroundService';
import { createPrecisionClockTicker } from '../utils/prayerScheduler';
import { HERO_MOSQUE_BACKDROPS } from '../utils/adhanScenesData';
import { FullScreenAdhanModal } from './FullScreenAdhanModal';
import { DuaModal } from './DuaModal';
import { PostPrayerTasbihModal } from './PostPrayerTasbihModal';
import { SurahKahfCompanion } from './SurahKahfCompanion';
import { GoldenHourDuasModal } from './GoldenHourDuasModal';
import { JumuahSunanCard } from './JumuahSunanCard';
import { LastThirdNightModal } from './LastThirdNightModal';
import { SujudSahwModal } from './SujudSahwModal';
import { SelectedSurahModalData, SurahReaderModal } from './SurahReaderModal';
import { applyPrayerTimeOffsets, calculateNightThirds, calculatePrayerTimes } from '../utils/prayerCalculator';
import { loadJumuahSalawatProgress } from '../utils/jumuahData';
import {
  KhatmaPrayerKey,
  getDailyWirdSchedule,
  toArabicDigits,
} from '../utils/khatmaData';
import { DAILY_PRAYER_SURAHS } from '../utils/dailyPrayerSurahsData';
import {
  RAWATIB_TOTAL_TARGET,
  SUNNAH_RAWATIB_LABELS,
  SunnahRawatibState,
  countCompletedRawatibRakats,
  isPrayerSunnahCompleted,
  loadSunnahRawatibState,
  saveSunnahRawatibState,
} from '../utils/sunnahRawatibData';
import { evaluateFastingCalculator, loadFastingIntent, saveFastingIntent } from '../utils/fastingCalculator';
import { SunnahRadarCard } from './SunnahRadarCard';
import { QuietModeModal } from './QuietModeModal';
import {
  QUIET_MODE_UPDATED_EVENT,
  QuietModeState,
  evaluateQuietMode,
  loadQuietModeState,
  saveQuietModeState,
  shouldSuppressGeneralNotification,
  shouldSuppressPrayerAudioOrAlert,
} from '../utils/quietModeData';
import { LastThirdQiyamToast, QiyamToastPlaybackState } from './LastThirdQiyamToast';
import {
  QIYAM_RECITERS,
  QiyamNightVerse,
  QiyamReciterId,
  buildQiyamVerseAudioUrlSets,
  pickNextQiyamVerse,
  pickTonightQiyamSelection,
} from '../utils/lastThirdNightData';

interface PrayerTimesCardProps {
  prayerTimes: PrayerTimeData;
  currentLocation: CityLocation;
  settings: UserSettings;
  onUpdateSettings?: (newSettings: Partial<UserSettings>) => void;
  onTestSalawat?: () => void;
  onTestPreAdhan?: (prayerNameAr?: string, isAutoTrigger?: boolean) => PreAdhanVoiceProfile | null;
  onTestIqama?: (prayerNameAr?: string, isAutoTrigger?: boolean) => IqamaVoiceProfile | null;
  onOpenIqamaTab?: () => void;
  khatmaSchedule: ReturnType<typeof getDailyWirdSchedule>;
  onTogglePrayerWird: (prayerKey: KhatmaPrayerKey) => void;
  onOpenWirdModal: (prayerKey: KhatmaPrayerKey, prayerNameAr: string) => void;
  onNavigateToAdhkar?: () => void;
  onOpenStandbyMode?: () => void;
  onOpenTravelTab?: () => void;
  onOpenFullScreenAdhan?: (prayerKey: PrayerName, prayerNameAr?: string) => void;
  isGlobalFullScreenAdhanOpen?: boolean;
}

interface PrayerInfo {
  key: PrayerName;
  nameAr: string;
  nameEn: string;
  icon: React.ReactNode;
}

const PRAYERS: PrayerInfo[] = [
  { key: 'fajr', nameAr: 'الفجر', nameEn: 'Fajr', icon: <Sunrise className="w-5 h-5 text-sky-300" /> },
  { key: 'sunrise', nameAr: 'الشروق', nameEn: 'Sunrise', icon: <Sun className="w-5 h-5 text-amber-300" /> },
  { key: 'dhuhr', nameAr: 'الظهر', nameEn: 'Dhuhr', icon: <Sun className="w-5 h-5 text-yellow-300" /> },
  { key: 'asr', nameAr: 'العصر', nameEn: 'Asr', icon: <Sun className="w-5 h-5 text-orange-300" /> },
  { key: 'maghrib', nameAr: 'المغرب', nameEn: 'Maghrib', icon: <Sunset className="w-5 h-5 text-rose-300" /> },
  { key: 'isha', nameAr: 'العشاء', nameEn: 'Isha', icon: <Moon className="w-5 h-5 text-indigo-300" /> },
];

const ArabesqueCorner: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    width="44"
    height="44"
    viewBox="0 0 44 44"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`pointer-events-none text-[#e5b869]/45 ${className}`}
    aria-hidden="true"
  >
    <path
      d="M2 2H26C20 2 14 8 14 14C14 8 8 14 2 14V2Z"
      stroke="currentColor"
      strokeWidth="1.2"
    />
    <path d="M2 2C12 2 18 8 18 18C8 18 2 12 2 2Z" stroke="currentColor" strokeWidth="1" strokeOpacity="0.6" />
    <circle cx="9" cy="9" r="2" fill="currentColor" fillOpacity="0.7" />
  </svg>
);

const HangingIslamicLantern: React.FC<{ isNext?: boolean }> = ({ isNext = false }) => (
  <div className="flex flex-col items-center pointer-events-none">
    <div className={`w-[1.5px] h-5 ${isNext ? 'bg-[#fbbf24]' : 'bg-[#e5b869]/70'}`} />
    <div
      className={`animate-swing ${
        isNext
          ? 'drop-shadow-[0_0_18px_rgba(251,191,36,0.95)]'
          : 'drop-shadow-[0_0_12px_rgba(229,184,105,0.65)]'
      }`}
    >
      <svg width="28" height="36" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle cx="14" cy="2.5" r="1.8" stroke="#e5b869" strokeWidth="1.2" />
        <path d="M14 4.5L9 9H19L14 4.5Z" fill="#d97706" stroke="#fbbf24" strokeWidth="0.8" />
        <path d="M7 9H21L23 14H5L7 9Z" fill="#b45309" stroke="#fbbf24" strokeWidth="0.8" />
        <path
          d="M6.5 14H21.5V23.5C21.5 26.5 19 29 14 29C9 29 6.5 26.5 6.5 23.5V14Z"
          fill="#06372c"
          stroke="#fbbf24"
          strokeWidth="1.2"
        />
        {/* Warm Inner Flame Glow */}
        <ellipse cx="14" cy="21" rx="4.5" ry="5.5" fill="#fef08a" fillOpacity={isNext ? '0.95' : '0.75'} className="animate-pulse" />
        <path d="M14 16.5C15.6 18.8 16.2 21 14 23.5C11.8 21 12.4 18.8 14 16.5Z" fill="#f59e0b" />
        {/* Lattice Bars */}
        <path d="M10.5 14V28M17.5 14V28M6.5 19.5H21.5" stroke="#e5b869" strokeWidth="0.8" strokeOpacity="0.7" />
        <path d="M10 29H18L16 32.5H12L10 29Z" fill="#d97706" />
        <circle cx="14" cy="34" r="1.2" fill="#fbbf24" />
      </svg>
    </div>
  </div>
);

export const PrayerTimesCard: React.FC<PrayerTimesCardProps> = ({
  prayerTimes,
  currentLocation,
  settings,
  onUpdateSettings,
  onTestSalawat,
  onTestPreAdhan,
  onTestIqama,
  onOpenIqamaTab,
  khatmaSchedule,
  onTogglePrayerWird,
  onOpenWirdModal,
  onNavigateToAdhkar,
  onOpenStandbyMode,
  onOpenTravelTab,
  onOpenFullScreenAdhan,
  isGlobalFullScreenAdhanOpen = false,
}) => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [nextPrayerKey, setNextPrayerKey] = useState<PrayerName>('fajr');
  const [timeRemaining, setTimeRemaining] = useState<string>('00:00:00');
  const [notificationsMuted, setNotificationsMuted] = useState<boolean>(!settings.notificationsEnabled);

  // Audio player state
  const [playerState, setPlayerState] = useState<AudioPlayerState>('idle');
  const [activeAudioType, setActiveAudioType] = useState<string>('none');
  const [isAudioUnlocked, setIsAudioUnlocked] = useState<boolean>(false);
  const [audioProgress, setAudioProgress] = useState<number>(0);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<{ text: string; isFatal: boolean } | null>(null);
  const [isActivatingAudio, setIsActivatingAudio] = useState<boolean>(false);
  const [quietModeState, setQuietModeState] = useState<QuietModeState>(() => loadQuietModeState());
  const [isQuietModeOpen, setIsQuietModeOpen] = useState<boolean>(false);

  // New features:
  const [isFullScreenAdhanOpen, setIsFullScreenAdhanOpen] = useState<boolean>(false);
  const [fullScreenAdhanPrayer, setFullScreenAdhanPrayer] = useState<PrayerName>('fajr');
  const [isDuaModalOpen, setIsDuaModalOpen] = useState<boolean>(false);
  const [lastFinishedPrayer, setLastFinishedPrayer] = useState<string>('الفجر');
  const [iqamaRemaining, setIqamaRemaining] = useState<string | null>(null);
  const [iqamaPrayerName, setIqamaPrayerName] = useState<string>('');
  const [isPostPrayerModalOpen, setIsPostPrayerModalOpen] = useState<boolean>(false);
  const [postPrayerNameAr, setPostPrayerNameAr] = useState<string>('العصر');
  const [isPostPrayerSimulated, setIsPostPrayerSimulated] = useState<boolean>(false);
  const [tasbihInitialPurpose, setTasbihInitialPurpose] = useState<'post_prayer' | 'jumuah_salawat'>('post_prayer');
  const [simulateNearAdhan, setSimulateNearAdhan] = useState<boolean>(false);

  // Hero Next Prayer Card: 6-Mosque Scenic Backdrop & Motion Controls
  const [activeHeroBackdropIdx, setActiveHeroBackdropIdx] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    const saved = Number(localStorage.getItem('mihrab_hero_mosque_idx'));
    return Number.isFinite(saved) && saved >= 0 && saved < HERO_MOSQUE_BACKDROPS.length ? saved : 0;
  });
  const [isHeroMotionPlaying, setIsHeroMotionPlaying] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem('mihrab_hero_motion_enabled');
    if (saved === 'false') return false;
    if (saved === 'true') return true;
    return !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  });
  const [failedHeroImages, setFailedHeroImages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!isHeroMotionPlaying || HERO_MOSQUE_BACKDROPS.length <= 1) return;
    const timer = window.setInterval(() => {
      setActiveHeroBackdropIdx((prev) => {
        const next = (prev + 1) % HERO_MOSQUE_BACKDROPS.length;
        try {
          localStorage.setItem('mihrab_hero_mosque_idx', String(next));
        } catch {
          // ignore storage limits
        }
        return next;
      });
    }, 8500);
    return () => window.clearInterval(timer);
  }, [isHeroMotionPlaying]);

  const handleCycleHeroBackdrop = () => {
    setActiveHeroBackdropIdx((prev) => {
      const next = (prev + 1) % HERO_MOSQUE_BACKDROPS.length;
      try {
        localStorage.setItem('mihrab_hero_mosque_idx', String(next));
      } catch {
        // ignore storage limits
      }
      return next;
    });
  };

  const handleToggleHeroMotion = () => {
    setIsHeroMotionPlaying((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('mihrab_hero_motion_enabled', String(next));
      } catch {
        // ignore storage limits
      }
      return next;
    });
  };

  useEffect(() => {
    setNotificationsMuted(settings.notificationsEnabled === false);
  }, [settings.notificationsEnabled]);

  const [fastingRevision, setFastingRevision] = useState(0);

  const fastingInfo = useMemo(() => {
    return evaluateFastingCalculator(prayerTimes.fajr, prayerTimes.maghrib, currentTime, {
      whiteDaysEnabled: settings.fastingWhiteDaysEnabled,
      monThuEnabled: settings.fastingMonThuEnabled,
      ashuraArafahEnabled: settings.fastingAshuraArafahEnabled,
    });
  }, [
    prayerTimes.fajr,
    prayerTimes.maghrib,
    currentTime,
    fastingRevision,
    settings.fastingWhiteDaysEnabled,
    settings.fastingMonThuEnabled,
    settings.fastingAshuraArafahEnabled,
  ]);

  const [isFastingIntent, setIsFastingIntent] = useState(() => fastingInfo.isFastingIntent);

  useEffect(() => {
    setIsFastingIntent(fastingInfo.isFastingIntent);
  }, [fastingInfo.isFastingIntent]);

  useEffect(() => {
    const handler = () => {
      setIsFastingIntent(loadFastingIntent());
      setFastingRevision((r) => r + 1);
    };
    window.addEventListener('fasting_intent_changed', handler);
    return () => window.removeEventListener('fasting_intent_changed', handler);
  }, []);

  const handleToggleFasting = () => {
    const next = !isFastingIntent;
    setIsFastingIntent(next);
    saveFastingIntent(next);
  };

  // Jumu'ah Golden Sanctuary Mode & Preview Controls (off by default on non-Fridays)
  const [jumuahPreviewMode, setJumuahPreviewMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('jumuah_preview_mode') === 'true';
  });
  const [simulateJumuahSunan, setSimulateJumuahSunan] = useState<boolean>(false);
  const [simulateGoldenHour, setSimulateGoldenHour] = useState<boolean>(false);
  const [isGoldenHourDuasOpen, setIsGoldenHourDuasOpen] = useState<boolean>(false);
  const [previewGoldenSeconds, setPreviewGoldenSeconds] = useState<number>(47 * 60 + 25);
  const [salawatSummary, setSalawatSummary] = useState<{ count: number; target: 100 | 1000 }>(() => {
    const s = loadJumuahSalawatProgress();
    return { count: s.count, target: s.target };
  });

  // Last Third of the Night State & Qiyam Verse Auto-Recitation Toast
  const [isLastThirdModalOpen, setIsLastThirdModalOpen] = useState<boolean>(false);
  const [simulateLastThirdNight, setSimulateLastThirdNight] = useState<boolean>(false);
  const [isQiyamToastOpen, setIsQiyamToastOpen] = useState<boolean>(false);
  const [activeQiyamReciter, setActiveQiyamReciter] = useState<QiyamReciterId>('qatami');
  const [activeQiyamVerse, setActiveQiyamVerse] = useState<QiyamNightVerse>(() =>
    pickTonightQiyamSelection('init').verse
  );
  const [qiyamPlaybackState, setQiyamPlaybackState] = useState<QiyamToastPlaybackState>('paused');
  const lastThirdAutoOpenedRef = useRef<string>('');
  const qiyamNightInitRef = useRef<string>('');
  const witrAlertSentRef = useRef<string>('');
  const suhoorAlertSentRef = useRef<string>('');

  // Feature: Interactive Sujud As-Sahw Guide Modal
  const [isSujudSahwModalOpen, setIsSujudSahwModalOpen] = useState<boolean>(false);

  // Feature: Next Prayer Mihrab Suggested Surahs Reader Modal
  const [mihrabSelectedSurah, setMihrabSelectedSurah] = useState<SelectedSurahModalData | null>(null);

  // Feature: Smart Office & Meeting Mode (المؤذن الصامت للمكاتب والاجتماعات)
  const meetingModeEnabled = Boolean(settings.meetingModeEnabled);
  const [silentMeetingAlert, setSilentMeetingAlert] = useState<{
    prayerNameAr: string;
    timeStr: string;
    reminderScheduledFor: string | null;
  } | null>(null);
  const [postMeetingReminderBanner, setPostMeetingReminderBanner] = useState<{
    prayerNameAr: string;
  } | null>(null);
  const meetingReminderTimerRef = useRef<number | null>(null);

  // Feature: 12 Daily Sunnah Rawatib Tracker (persisted in localStorage)
  const [sunnahState, setSunnahState] = useState<SunnahRawatibState>(() => loadSunnahRawatibState());

  useEffect(() => {
    const onSunnahChanged = () => {
      setSunnahState(loadSunnahRawatibState());
    };
    window.addEventListener('sunnah_rawatib_changed', onSunnahChanged);
    return () => window.removeEventListener('sunnah_rawatib_changed', onSunnahChanged);
  }, []);

  const rawatibRakatsCompleted = countCompletedRawatibRakats(sunnahState);

  const handleTogglePrayerSunnah = (prayerKey: KhatmaPrayerKey) => {
    adhanPlayer.playChime();
    setSunnahState((prev) => {
      const updated =
        prayerKey === 'dhuhr'
          ? {
              ...prev,
              dhuhrBefore: !(prev.dhuhrBefore && prev.dhuhrAfter),
              dhuhrAfter: !(prev.dhuhrBefore && prev.dhuhrAfter),
            }
          : { ...prev, [prayerKey]: !prev[prayerKey] };
      saveSunnahRawatibState(updated);
      return updated;
    });
  };

  const handleToggleDhuhrSubSunnah = (part: 'before' | 'after') => {
    adhanPlayer.playChime();
    setSunnahState((prev) => {
      const updated =
        part === 'before'
          ? { ...prev, dhuhrBefore: !prev.dhuhrBefore }
          : { ...prev, dhuhrAfter: !prev.dhuhrAfter };
      saveSunnahRawatibState(updated);
      return updated;
    });
  };

  useEffect(() => {
    return () => {
      if (meetingReminderTimerRef.current !== null) {
        window.clearTimeout(meetingReminderTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('jumuah_preview_mode', String(jumuahPreviewMode));
  }, [jumuahPreviewMode]);

  useEffect(() => {
    if (!simulateGoldenHour) return;
    const id = window.setInterval(() => {
      setPreviewGoldenSeconds((prev) => (prev > 1 ? prev - 1 : 59 * 60 + 59));
    }, 1000);
    return () => window.clearInterval(id);
  }, [simulateGoldenHour]);

  useEffect(() => {
    const handleToggleNear = () => setSimulateNearAdhan((prev) => !prev);
    const handlePostPrayer = () => {
      const targetPrayer = getDisplayPrayerName(
        nextPrayerKey,
        PRAYERS.find((p) => p.key === nextPrayerKey)?.nameAr || 'العصر'
      );
      setPostPrayerNameAr(targetPrayer);
      setTasbihInitialPurpose('post_prayer');
      setIsPostPrayerSimulated(true);
      setIsPostPrayerModalOpen(true);
    };
    const handleJumuahToggle = () => {
      setJumuahPreviewMode((prev) => {
        const next = !prev;
        if (!next) {
          setSimulateJumuahSunan(false);
          setSimulateGoldenHour(false);
        }
        return next;
      });
    };
    const handleSunanToggle = () => setSimulateJumuahSunan((prev) => !prev);
    const handleGoldenHourToggle = () => setSimulateGoldenHour((prev) => !prev);
    const handleOpenLastThird = () => setIsLastThirdModalOpen(true);
    const handleToggleLastThirdSim = () => {
      setSimulateLastThirdNight((prev) => {
        const next = !prev;
        if (next) {
          window.dispatchEvent(new CustomEvent('simulate_last_third_qiyam_toast'));
        }
        return next;
      });
    };

    window.addEventListener('toggle_near_adhan_simulation', handleToggleNear);
    window.addEventListener('open_post_prayer_simulation', handlePostPrayer);
    window.addEventListener('toggle_jumuah_preview', handleJumuahToggle);
    window.addEventListener('toggle_jumuah_sunan', handleSunanToggle);
    window.addEventListener('toggle_golden_hour', handleGoldenHourToggle);
    window.addEventListener('open_last_third_night_simulation', handleOpenLastThird);
    window.addEventListener('toggle_last_third_simulation', handleToggleLastThirdSim);

    return () => {
      window.removeEventListener('toggle_near_adhan_simulation', handleToggleNear);
      window.removeEventListener('open_post_prayer_simulation', handlePostPrayer);
      window.removeEventListener('toggle_jumuah_preview', handleJumuahToggle);
      window.removeEventListener('toggle_jumuah_sunan', handleSunanToggle);
      window.removeEventListener('toggle_golden_hour', handleGoldenHourToggle);
      window.removeEventListener('open_last_third_night_simulation', handleOpenLastThird);
      window.removeEventListener('toggle_last_third_simulation', handleToggleLastThirdSim);
    };
  }, [nextPrayerKey]);

  const isFullScreenActiveRef = useRef<boolean>(false);
  isFullScreenActiveRef.current = isFullScreenAdhanOpen || isGlobalFullScreenAdhanOpen;

  // Subscribe to adhanPlayer events
  useEffect(() => {
    setIsAudioUnlocked(adhanPlayer.getIsUnlocked());
    const unsubscribe = adhanPlayer.subscribe({
      onStateChange: (state, type) => {
        setPlayerState(state);
        setActiveAudioType(type);
      },
      onProgress: (current, duration, percentage) => {
        setAudioCurrentTime(current);
        setAudioDuration(duration);
        setAudioProgress(percentage);
      },
      onError: (msg, isFatal) => {
        setErrorMessage({ text: msg, isFatal });
        setTimeout(() => {
          if (!isFatal) setErrorMessage(null);
        }, 8000);
      },
      onUnlocked: () => setIsAudioUnlocked(true),
      onAdhanEnded: (prayerKey) => {
        if (isFullScreenActiveRef.current) return;
        const pName = PRAYERS.find((p) => p.key === prayerKey)?.nameAr || 'الصلاة';
        setLastFinishedPrayer(pName);
        setIsDuaModalOpen(true);
      },
    });

    return () => unsubscribe();
  }, []);

  const checkPrayersRef = useRef<(now: Date) => void>(() => {});

  // Precision clock ticker for live countdowns & Iqama display (resistant to tab throttling)
  useEffect(() => {
    return createPrecisionClockTicker((now) => {
      setCurrentTime(now);
      checkPrayersRef.current(now);
    });
  }, []);

  const timeToMinutes = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const checkPrayersCountdownAndIqama = (now: Date) => {
    const currentMinutes = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;

    const prayersList: { key: PrayerName; time: number; nameAr: string }[] = [
      { key: 'fajr', time: timeToMinutes(prayerTimes.fajr), nameAr: 'الفجر' },
      { key: 'dhuhr', time: timeToMinutes(prayerTimes.dhuhr), nameAr: 'الظهر' },
      { key: 'asr', time: timeToMinutes(prayerTimes.asr), nameAr: 'العصر' },
      { key: 'maghrib', time: timeToMinutes(prayerTimes.maghrib), nameAr: 'المغرب' },
      { key: 'isha', time: timeToMinutes(prayerTimes.isha), nameAr: 'العشاء' },
    ];

    let next = prayersList.find((p) => p.time > currentMinutes);
    if (!next) {
      next = prayersList[0];
    }

    setNextPrayerKey(next.key);

    let diffMinutes = next.time - currentMinutes;
    if (diffMinutes < 0) {
      diffMinutes += 24 * 60;
    }

    const hours = Math.floor(diffMinutes / 60);
    const minutes = Math.floor(diffMinutes % 60);
    const seconds = Math.floor((diffMinutes * 60) % 60);

    setTimeRemaining(
      `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    );

    // Iqama Live Countdown UI detection (auto-playback, Pre-Adhan, Adhan & Post-Prayer alerts run globally in App.tsx)
    let foundIqama = false;
    for (const p of prayersList) {
      if (p.key === 'sunrise') continue;
      const iqamaDuration = settings.iqamaMinutes?.[p.key] || 20;
      let diffFromAdhan = currentMinutes - p.time;
      if (diffFromAdhan < -12 * 60) {
        diffFromAdhan += 24 * 60;
      }
      const displayName = (now.getDay() === 5 || jumuahPreviewMode) && p.key === 'dhuhr' ? 'الجمعة' : p.nameAr;

      if (diffFromAdhan >= 0 && diffFromAdhan < iqamaDuration) {
        foundIqama = true;
        setIqamaPrayerName(displayName);
        const rem = Math.max(0, iqamaDuration - diffFromAdhan);
        const m = Math.floor(rem);
        const s = Math.floor((rem - m) * 60);
        setIqamaRemaining(`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
        break;
      }
    }
    if (!foundIqama) {
      setIqamaRemaining((prev) => (prev === null ? prev : null));
    }
  };
  checkPrayersRef.current = checkPrayersCountdownAndIqama;

  const handleActivateAudio = async () => {
    setIsActivatingAudio(true);
    setErrorMessage(null);
    try {
      await adhanPlayer.unlockAudio();
      adhanPlayer.playChime();
      setIsAudioUnlocked(true);
      await backgroundService.requestNotificationPermission();
    } catch (e) {
      console.error(e);
    } finally {
      setIsActivatingAudio(false);
    }
  };

  const handleToggleAdhan = () => {
    setErrorMessage(null);
    if (playerState === 'playing' || playerState === 'loading') {
      adhanPlayer.stop();
    } else {
      const isFajr = nextPrayerKey === 'fajr';
      const reciter = resolvePrayerReciter(settings, nextPrayerKey);
      adhanPlayer.playAdhan(reciter, nextPrayerKey, isFajr && settings.fajrBoostVolume);
    }
  };

  useEffect(() => {
    const syncQuiet = () => {
      setQuietModeState(loadQuietModeState());
    };
    window.addEventListener(QUIET_MODE_UPDATED_EVENT, syncQuiet);
    return () => window.removeEventListener(QUIET_MODE_UPDATED_EVENT, syncQuiet);
  }, []);

  const quietEvaluation = useMemo(
    () => evaluateQuietMode(quietModeState, currentTime),
    [quietModeState, currentTime]
  );

  // Auto-clear expired quick-pause timestamp cleanly
  useEffect(() => {
    if (quietModeState.pauseUntilMs !== null && quietModeState.pauseUntilMs <= currentTime.getTime()) {
      const cleared = saveQuietModeState({
        ...quietModeState,
        pauseUntilMs: null,
        pauseLabelAr: null,
      });
      setQuietModeState(cleared);
    }
  }, [quietModeState, currentTime]);

  const handleUpdateQuietState = (updater: (prev: QuietModeState) => QuietModeState) => {
    setQuietModeState((prev) => {
      const next = saveQuietModeState(updater(prev));
      return next;
    });
  };

  const handleToggleMeetingMode = () => {
    const nextEnabled = !meetingModeEnabled;
    if (nextEnabled) {
      adhanPlayer.stop();
      if ('vibrate' in navigator) {
        navigator.vibrate([300, 150, 300]);
      }
      const nextTimeStr = prayerTimes[nextPrayerKey];
      setSilentMeetingAlert({
        prayerNameAr: activePrayerNameAr,
        timeStr: nextTimeStr,
        reminderScheduledFor: null,
      });
    } else {
      setSilentMeetingAlert(null);
      setPostMeetingReminderBanner(null);
      if (meetingReminderTimerRef.current !== null) {
        window.clearTimeout(meetingReminderTimerRef.current);
        meetingReminderTimerRef.current = null;
      }
    }
    onUpdateSettings?.({ meetingModeEnabled: nextEnabled });
  };

  const handleScheduleMeetingReminder20Min = () => {
    const targetDate = new Date(Date.now() + 20 * 60 * 1000);
    const targetTimeStr = `${String(targetDate.getHours()).padStart(2, '0')}:${String(
      targetDate.getMinutes()
    ).padStart(2, '0')}`;
    const targetPrayerName = silentMeetingAlert?.prayerNameAr || activePrayerNameAr;

    if (meetingReminderTimerRef.current !== null) {
      window.clearTimeout(meetingReminderTimerRef.current);
    }

    if ('vibrate' in navigator) {
      navigator.vibrate([120, 80, 120]);
    }

    setSilentMeetingAlert((prev) =>
      prev
        ? { ...prev, reminderScheduledFor: targetTimeStr }
        : {
            prayerNameAr: targetPrayerName,
            timeStr: prayerTimes[nextPrayerKey],
            reminderScheduledFor: targetTimeStr,
          }
    );

    meetingReminderTimerRef.current = window.setTimeout(() => {
      meetingReminderTimerRef.current = null;
      if ('vibrate' in navigator) {
        navigator.vibrate([300, 150, 300]);
      }
      adhanPlayer.playChime();
      backgroundService.sendPrayerNotification(
        `تذكير ما بعد الاجتماع · صلاة ${targetPrayerName}`,
        'انتهت الـ ٢٠ دقيقة — تفضّل لأداء الصلاة الآن بارك الله في وقتك'
      );
      setSilentMeetingAlert(null);
      setPostMeetingReminderBanner({ prayerNameAr: targetPrayerName });
    }, 20 * 60 * 1000);
  };

  const isActualFriday = currentTime.getDay() === 5;
  const isJumuahActive = isActualFriday || jumuahPreviewMode;

  const getDisplayPrayerName = (key: PrayerName, fallback: string) =>
    isJumuahActive && key === 'dhuhr' ? 'الجمعة' : fallback;

  const activePrayerNameAr = getDisplayPrayerName(
    nextPrayerKey,
    PRAYERS.find((p) => p.key === nextPrayerKey)?.nameAr || 'الفجر'
  );
  const reciterLabel = ADHAN_SOURCES[settings.adhanReciter]?.nameAr || 'الحرم المكي';

  const handleOpenFullScreenAdhan = (key?: PrayerName) => {
    const targetKey = key || nextPrayerKey;
    const displayName = getDisplayPrayerName(
      targetKey,
      PRAYERS.find((p) => p.key === targetKey)?.nameAr || 'الفجر'
    );
    if (onOpenFullScreenAdhan) {
      onOpenFullScreenAdhan(targetKey, displayName);
      return;
    }
    setFullScreenAdhanPrayer(targetKey);
    setIsFullScreenAdhanOpen(true);
  };

  const getAdhanTotalSeconds = (timeStr: string) => {
    if (simulateNearAdhan) return 250;
    const parts = timeStr.split(':').map(Number);
    return parts.length === 3 ? parts[0] * 3600 + parts[1] * 60 + parts[2] : 9999;
  };
  const adhanSecs = getAdhanTotalSeconds(timeRemaining);
  const isAdhanNear = adhanSecs <= 300 && adhanSecs >= 0;

  // Compute exact Iqama time string (HH:MM) for a given prayer
  const getIqamaTimeString = (prayerKey: PrayerName, adhanTimeStr: string): string | null => {
    if (prayerKey === 'sunrise') return null;
    const iqamaKey = prayerKey as 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
    const offset = settings.iqamaMinutes?.[iqamaKey] ?? 20;
    const [h, m] = adhanTimeStr.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return null;
    const total = (h * 60 + m + offset) % (24 * 60);
    const iqH = Math.floor(total / 60).toString().padStart(2, '0');
    const iqM = (total % 60).toString().padStart(2, '0');
    return `${iqH}:${iqM}`;
  };

  // Current minutes for accurate past prayer dimming & Jumu'ah timed windows
  const nowMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const exactNowMinutes = nowMinutes + currentTime.getSeconds() / 60;
  const dhuhrMinutes = timeToMinutes(prayerTimes.dhuhr);
  const maghribMinutes = timeToMinutes(prayerTimes.maghrib);
  const diffToJumuahMinutes = dhuhrMinutes - exactNowMinutes;
  const diffToMaghribMinutes = maghribMinutes - exactNowMinutes;

  const isRealEarlyJumuahWindow =
    isActualFriday && diffToJumuahMinutes > 0 && diffToJumuahMinutes <= 60;
  const isEarlyJumuahVisible = isRealEarlyJumuahWindow || simulateJumuahSunan;

  const isRealGoldenHourWindow =
    isActualFriday && diffToMaghribMinutes > 0 && diffToMaghribMinutes <= 60;
  const isGoldenHourVisible = isRealGoldenHourWindow || simulateGoldenHour;

  const goldenHourCountdownStr = (() => {
    const totalSecs = isRealGoldenHourWindow
      ? Math.max(0, Math.floor(diffToMaghribMinutes * 60))
      : previewGoldenSeconds;
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  })();

  // Compute tomorrow's Fajr for accurate Shari'ah night division (nextFajr - maghrib)
  const todayDateKey = currentTime.toDateString();
  const tomorrowPrayerTimes = useMemo(() => {
    const tomorrow = new Date(currentTime);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const rawTomorrow = calculatePrayerTimes(
      tomorrow,
      currentLocation.lat,
      currentLocation.lng,
      currentLocation.timezone,
      settings.calculationMethod,
      settings.asrMethod
    );
    return applyPrayerTimeOffsets(rawTomorrow, settings.prayerOffsets);
  }, [
    todayDateKey,
    currentLocation.lat,
    currentLocation.lng,
    currentLocation.timezone,
    settings.calculationMethod,
    settings.asrMethod,
    settings.prayerOffsets,
  ]);

  const todayFajrMinutes = timeToMinutes(prayerTimes.fajr);
  const nextNightFajrStr = nowMinutes < todayFajrMinutes ? prayerTimes.fajr : tomorrowPrayerTimes.fajr;

  // Calculate Last Third of the Night (حساب الثلث الأخير من الليل والأسحار)
  const nightThirds = calculateNightThirds(
    prayerTimes.maghrib,
    nextNightFajrStr,
    currentTime,
    settings.lastThirdNightMode || 'astronomical',
    settings.lastThirdNightCustomTime || '03:00',
    settings.lastThirdBeforeFajrMinutes || 30
  );

  const isLastThirdActive =
    (settings.lastThirdNightEnabled !== false && nightThirds.isLastThirdNow) ||
    simulateLastThirdNight;

  const startQiyamVersePlayback = async (
    verse: QiyamNightVerse,
    reciterId: QiyamReciterId,
    allowFadeFallback: boolean = false
  ) => {
    setActiveQiyamVerse(verse);
    setActiveQiyamReciter(reciterId);
    setIsQiyamToastOpen(true);

    if (meetingModeEnabled) {
      setQiyamPlaybackState('paused');
      return;
    }

    setQiyamPlaybackState('loading');
    const urlSets = buildQiyamVerseAudioUrlSets(verse, reciterId);
    const result = await adhanPlayer.playQiyamRecitation(
      urlSets,
      settings.volume ?? 0.85,
      () => {
        setQiyamPlaybackState('ended');
      },
      verse.verse
    );

    if (result === 'playing') {
      setQiyamPlaybackState('playing');
    } else if (result === 'blocked') {
      setQiyamPlaybackState('blocked');
      if (allowFadeFallback && settings.lastThirdFadeInAlarm !== false) {
        adhanPlayer.playGentleFadeInAlarm();
      }
    } else {
      setQiyamPlaybackState('ended');
      if (allowFadeFallback && settings.lastThirdFadeInAlarm !== false) {
        adhanPlayer.playGentleFadeInAlarm();
      }
    }
  };

  useEffect(() => {
    const nightCycleKey = `${todayDateKey}-${nextNightFajrStr}`;
    if (qiyamNightInitRef.current !== nightCycleKey) {
      qiyamNightInitRef.current = nightCycleKey;
      const tonight = pickTonightQiyamSelection(nightCycleKey);
      setActiveQiyamReciter(tonight.reciterId);
      setActiveQiyamVerse(tonight.verse);
    }

    const onSimulateQiyamToast = () => {
      const tonight = pickTonightQiyamSelection(nightCycleKey);
      void startQiyamVersePlayback(tonight.verse, tonight.reciterId, false);
    };

    const onGlobalLastThirdEntered = (e: Event) => {
      const detail = (e as CustomEvent<{
        nightCycleKey?: string;
        verse?: QiyamNightVerse;
        reciterId?: QiyamReciterId;
      }>).detail;
      if (detail?.verse && detail?.reciterId) {
        setActiveQiyamVerse(detail.verse);
        setActiveQiyamReciter(detail.reciterId);
      }
      setIsQiyamToastOpen(true);
      if (adhanPlayer.getActiveType() === 'qiyam_verse' && adhanPlayer.getState() === 'playing') {
        setQiyamPlaybackState('playing');
      } else if (adhanPlayer.getState() === 'loading') {
        setQiyamPlaybackState('loading');
      }
    };

    window.addEventListener('simulate_last_third_qiyam_toast', onSimulateQiyamToast);
    window.addEventListener('mihrab_global_last_third_entered', onGlobalLastThirdEntered);
    return () => {
      window.removeEventListener('simulate_last_third_qiyam_toast', onSimulateQiyamToast);
      window.removeEventListener('mihrab_global_last_third_entered', onGlobalLastThirdEntered);
    };
  }, [todayDateKey, nextNightFajrStr, meetingModeEnabled, settings.volume]);

  useEffect(() => {
    const nightCycleKey = `${todayDateKey}-${nextNightFajrStr}`;

    const isGeneralQuietNow = shouldSuppressGeneralNotification(quietModeState, currentTime);

    if (isLastThirdActive && lastThirdAutoOpenedRef.current !== nightCycleKey) {
      let alreadyTriggeredGlobally = false;
      try {
        alreadyTriggeredGlobally =
          localStorage.getItem('last_third_auto_triggered_night_key') === nightCycleKey;
      } catch {
        alreadyTriggeredGlobally = false;
      }

      const shouldAutoAct =
        settings.lastThirdAutoOpen ||
        settings.lastThirdAutoOpenAdhkar ||
        (nightThirds.isLastThirdNow && settings.lastThirdNightEnabled !== false);

      if (shouldAutoAct) {
        lastThirdAutoOpenedRef.current = nightCycleKey;
        if (!isGeneralQuietNow) {
          const tonight = pickTonightQiyamSelection(nightCycleKey);
          const reciterInfo = QIYAM_RECITERS[tonight.reciterId];

          if (nightThirds.isLastThirdNow && settings.lastThirdNightEnabled !== false && !alreadyTriggeredGlobally) {
            try {
              localStorage.setItem('last_third_auto_triggered_night_key', nightCycleKey);
            } catch {
              // ignore storage quota errors
            }
            void startQiyamVersePlayback(tonight.verse, tonight.reciterId, true);
            if (!notificationsMuted) {
              void backgroundService.sendLastThirdNotification({
                verseText: tonight.verse.verse,
                surah: tonight.verse.surah,
                reciterNameAr: reciterInfo.nameAr,
                fajrTime12: nextNightFajrStr,
                remainingToFajr: nightThirds.formattedRemainingToFajr,
              });
            }
          } else if (alreadyTriggeredGlobally) {
            setActiveQiyamVerse(tonight.verse);
            setActiveQiyamReciter(tonight.reciterId);
            setIsQiyamToastOpen(true);
            if (adhanPlayer.getActiveType() === 'qiyam_verse' && adhanPlayer.getState() === 'playing') {
              setQiyamPlaybackState('playing');
            }
          }

          if (settings.lastThirdAutoOpenAdhkar && onNavigateToAdhkar) {
            onNavigateToAdhkar();
          }
          if (settings.lastThirdAutoOpen) {
            setIsLastThirdModalOpen(true);
          }
        }
      }
    }

    // Independent Witr & Suhoor Alerts before Fajr
    if (nightThirds.isNightTime) {
      const remainingMinsToFajr = nightThirds.remainingSecondsToFajr / 60;

      if (settings.witrReminderEnabled !== false) {
        const witrTarget = settings.witrReminderMinutes || 20;
        if (
          remainingMinsToFajr <= witrTarget &&
          remainingMinsToFajr > witrTarget - 1 &&
          witrAlertSentRef.current !== nightCycleKey
        ) {
          witrAlertSentRef.current = nightCycleKey;
          if (!isGeneralQuietNow) {
            if (settings.lastThirdFadeInAlarm !== false) {
              adhanPlayer.playGentleFadeInAlarm();
            }
            if (!notificationsMuted) {
              backgroundService.sendPrayerNotification(
                'منبّه صلاة الوتر',
                `متبقي ${witrTarget} دقيقة على أذان الفجر — اجعلوا آخر صلاتكم بالليل وتراً`
              );
            }
          }
        }
      }

      if (settings.suhoorReminderEnabled === true) {
        const suhoorTarget = settings.suhoorReminderMinutes || 45;
        if (
          remainingMinsToFajr <= suhoorTarget &&
          remainingMinsToFajr > suhoorTarget - 1 &&
          suhoorAlertSentRef.current !== nightCycleKey
        ) {
          suhoorAlertSentRef.current = nightCycleKey;
          if (!isGeneralQuietNow) {
            if (settings.lastThirdFadeInAlarm !== false) {
              adhanPlayer.playGentleFadeInAlarm();
            }
            if (!notificationsMuted) {
              backgroundService.sendPrayerNotification(
                'منبّه السحور المبارك',
                `متبقي ${suhoorTarget} دقيقة على أذان الفجر — تسحروا فإن في السحور بركة`
              );
            }
          }
        }
      }
    }
  }, [
    isLastThirdActive,
    nightThirds.isLastThirdNow,
    nightThirds.isNightTime,
    nightThirds.remainingSecondsToFajr,
    nightThirds.formattedRemainingToFajr,
    todayDateKey,
    nextNightFajrStr,
    notificationsMuted,
    settings.lastThirdNightEnabled,
    settings.lastThirdAutoOpen,
    settings.lastThirdAutoOpenAdhkar,
    settings.lastThirdFadeInAlarm,
    settings.witrReminderEnabled,
    settings.witrReminderMinutes,
    settings.suhoorReminderEnabled,
    settings.suhoorReminderMinutes,
    onNavigateToAdhkar,
  ]);

  return (
    <div className="space-y-6">
      {/* Last Third of the Night Sanctuary Modal */}
      <LastThirdNightModal
        isOpen={isLastThirdModalOpen}
        onClose={() => setIsLastThirdModalOpen(false)}
        nightInfo={nightThirds}
        settings={settings}
        onUpdateSettings={onUpdateSettings}
        onNavigateToAdhkar={onNavigateToAdhkar}
      />

      {/* Interactive Last Third Entry Qiyam Verse Toast (Al-Qatami & Alafasy) */}
      <LastThirdQiyamToast
        isOpen={isQiyamToastOpen}
        verse={activeQiyamVerse}
        reciterId={activeQiyamReciter}
        playbackState={qiyamPlaybackState}
        remainingToFajr={nightThirds.formattedRemainingToFajr}
        onTogglePlayPause={() => {
          if (qiyamPlaybackState === 'playing') {
            adhanPlayer.pauseQiyamRecitation();
            setQiyamPlaybackState('paused');
          } else if (qiyamPlaybackState === 'paused') {
            void adhanPlayer.resumeQiyamRecitation().then((res) => {
              if (res === 'playing') {
                setQiyamPlaybackState('playing');
              } else {
                void startQiyamVersePlayback(activeQiyamVerse, activeQiyamReciter, false);
              }
            });
          } else {
            void startQiyamVersePlayback(activeQiyamVerse, activeQiyamReciter, false);
          }
        }}
        onSwitchReciter={() => {
          const nextReciter: QiyamReciterId =
            activeQiyamReciter === 'qatami' ? 'alafasy' : 'qatami';
          void startQiyamVersePlayback(activeQiyamVerse, nextReciter, false);
        }}
        onNextVerse={() => {
          const nextVerse = pickNextQiyamVerse(activeQiyamVerse.id);
          void startQiyamVersePlayback(nextVerse, activeQiyamReciter, false);
        }}
        onOpenSanctuary={() => {
          setIsQiyamToastOpen(false);
          setIsLastThirdModalOpen(true);
        }}
        onClose={() => {
          adhanPlayer.stopQiyamRecitation();
          setQiyamPlaybackState('paused');
          setIsQiyamToastOpen(false);
        }}
      />

      {/* Full-Screen Adhan & Dua Cinematic Modal */}
      <FullScreenAdhanModal
        isOpen={isFullScreenAdhanOpen}
        onClose={() => setIsFullScreenAdhanOpen(false)}
        prayerKey={fullScreenAdhanPrayer}
        prayerNameAr={getDisplayPrayerName(
          fullScreenAdhanPrayer,
          PRAYERS.find((p) => p.key === fullScreenAdhanPrayer)?.nameAr || 'الفجر'
        )}
        currentLocation={currentLocation}
        settings={settings}
      />

      {/* Dua Modal automatically shown after adhan ends */}
      <DuaModal
        isOpen={isDuaModalOpen}
        onClose={() => setIsDuaModalOpen(false)}
        prayerNameAr={lastFinishedPrayer}
        settings={settings}
      />

      {/* Post-Prayer Adhkar + Dual Interactive Tasbih + Jumuah Salawat Modal */}
      <PostPrayerTasbihModal
        isOpen={isPostPrayerModalOpen}
        onClose={() => setIsPostPrayerModalOpen(false)}
        prayerNameAr={postPrayerNameAr}
        isSimulated={isPostPrayerSimulated}
        isJumuahMode={isJumuahActive}
        initialPurpose={tasbihInitialPurpose}
        onSalawatProgressChange={(count, target) =>
          setSalawatSummary((prev) =>
            prev.count === count && prev.target === target ? prev : { count, target }
          )
        }
      />

      {/* Golden Hour of Jumuah Duas Modal */}
      <GoldenHourDuasModal
        isOpen={isGoldenHourDuasOpen}
        remainingText={goldenHourCountdownStr}
        maghribTime={prayerTimes.maghrib}
        onClose={() => setIsGoldenHourDuasOpen(false)}
      />

      {/* Interactive Sujud As-Sahw Guide Modal */}
      <SujudSahwModal
        isOpen={isSujudSahwModalOpen}
        onClose={() => setIsSujudSahwModalOpen(false)}
      />

      {/* Next Prayer Mihrab Built-in Surah Reader Modal */}
      <SurahReaderModal
        selectedSurah={mihrabSelectedSurah}
        onClose={() => setMihrabSelectedSurah(null)}
      />

      {/* Quiet Mode & Scheduled Notification Control Modal */}
      <QuietModeModal
        isOpen={isQuietModeOpen}
        onClose={() => setIsQuietModeOpen(false)}
        quietState={quietModeState}
        evaluation={quietEvaluation}
        onUpdateQuietState={handleUpdateQuietState}
        fajrTimeStr={prayerTimes.fajr}
        settings={settings}
        onUpdateSettings={onUpdateSettings}
      />

      {/* Alert / Error Message Banner if any */}
      {errorMessage && (
        <div
          className={`flex items-start gap-3 p-4 rounded-2xl border transition-all ${
            errorMessage.isFatal
              ? 'bg-amber-950/80 border-amber-600 text-amber-200'
              : 'bg-emerald-950/80 border-emerald-600 text-emerald-200'
          }`}
        >
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" />
          <div className="flex-1 text-sm leading-relaxed">
            <span className="font-bold block mb-1">تنبيه نظام الصوت:</span>
            {errorMessage.text}
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-xs px-2 py-1 rounded bg-slate-800/80 text-slate-300 hover:bg-slate-700"
          >
            إغلاق
          </button>
        </div>
      )}

      {/* Golden Hour of Jumuah Smart Radar Strip (آخر ساعة قبل المغرب) */}
      {isGoldenHourVisible && (
        <button
          type="button"
          onClick={() => setIsGoldenHourDuasOpen(true)}
          className="w-full text-right relative overflow-hidden rounded-2xl border-2 border-[#fbbf24] bg-gradient-to-l from-[#1a1604]/90 via-[#08382c]/95 to-[#04211b]/95 px-5 py-4 shadow-[0_0_40px_rgba(251,191,36,0.28)] hover:shadow-[0_0_52px_rgba(251,191,36,0.42)] transition-all group"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_right,rgba(251,191,36,0.22)_0%,transparent_55%)] pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-right">
              <div className="w-10 h-10 rounded-xl bg-[#fbbf24]/20 border border-[#fbbf24]/70 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-[#fbbf24]" />
              </div>
              <div className="space-y-0.5">
                <div className="text-sm sm:text-base font-bold font-amiri text-[#fef08a] tracking-wide">
                  ساعة الاستجابة — آخر ساعة من يوم الجمعة
                </div>
                <div className="text-xs text-emerald-200/95">
                  اضغط لفتح باقة جوامع الدعاء من القرآن والسنة قبل أذان المغرب ({prayerTimes.maghrib})
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="text-left">
                <span className="text-[10px] text-[#e5b869] block">المتبقي حتى المغرب</span>
                <span className="font-mono text-2xl font-black text-[#fbbf24] tabular-nums">
                  {goldenHourCountdownStr}
                </span>
              </div>
              <span className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#fbbf24] to-[#d97706] text-slate-950 font-black text-xs whitespace-nowrap group-hover:brightness-105 transition-all">
                فتح الأدعية المأثورة
              </span>
            </div>
          </div>
        </button>
      )}

      {/* Hero Banner / Next Prayer Architectural Sanctuary Frame */}
      <div
        className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#04120D] via-[#07261c] to-[#04120D] border transition-all duration-300 ${
          isAdhanNear
            ? 'border-[#F6D884] ring-4 ring-[#CFA632]/30 shadow-[0_0_55px_rgba(246,216,132,0.28)]'
            : isJumuahActive
            ? 'border-2 border-[#F6D884]/85 ring-2 ring-[#CFA632]/30 shadow-[0_0_75px_rgba(246,216,132,0.26)]'
            : 'border-[#CFA632]/45 ring-1 ring-inset ring-[#F6D884]/15'
        } p-5 sm:p-6 md:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl`}
      >
        {/* Subtle Inner Geometric Dot/Lattice Pattern */}
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[radial-gradient(#F6D884_1px,transparent_1px)] [background-size:20px_20px]" />
        {isJumuahActive && (
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,rgba(246,216,132,0.18)_0%,rgba(207,166,50,0.05)_45%,transparent_75%)]" />
        )}

        {/* Delicate Arabesque Gold Corner Ornaments */}
        <ArabesqueCorner className="absolute top-2 right-2" />
        <ArabesqueCorner className="absolute top-2 left-2 -scale-x-100" />
        <ArabesqueCorner className="absolute bottom-2 right-2 -scale-y-100" />
        <ArabesqueCorner className="absolute bottom-2 left-2 -scale-x-100 -scale-y-100" />

        {/* Main Banner Row */}
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-5 sm:gap-6">
          {/* Right Column (RTL Start): Next Prayer Badge, Amiri Title & Dates */}
          <div className="text-center lg:text-right space-y-2.5 lg:shrink-0">
            <div className="flex items-center gap-2 justify-center lg:justify-start flex-wrap text-xs font-bold">
              <div className="inline-flex items-center gap-1.5 text-[#F6D884]">
                <Clock className="w-3.5 h-3.5 text-[#CFA632]" />
                <span>الصلاة القادمة</span>
              </div>
              {isJumuahActive && (
                <>
                  <span className="text-[#e5b869]/50" aria-hidden="true">·</span>
                  <span className="text-[#fef08a]">وضع الجمعة المباركة الذهبي</span>
                </>
              )}
              {isJumuahActive && nextPrayerKey === 'dhuhr' && (
                <>
                  <span className="text-[#e5b869]/50" aria-hidden="true">·</span>
                  <span className="text-emerald-300">خطبة الجمعة</span>
                </>
              )}
              {isAdhanNear && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-[#fbbf24] to-amber-500 text-slate-950 text-xs font-black shadow-lg">
                  اقترب موعد الأذان
                </span>
              )}
            </div>

            <h2 className="text-4xl md:text-5xl font-bold text-white font-amiri tracking-wide drop-shadow">
              صلاة {activePrayerNameAr}
            </h2>

            <p className="text-slate-300 text-xs sm:text-sm flex items-center justify-center lg:justify-start gap-2 font-sans flex-wrap">
              <Calendar className="w-4 h-4 text-[#e5b869] shrink-0" />
              <span>{prayerTimes.dateString}</span>
              <span className="text-[#e5b869]/60" aria-hidden="true">|</span>
              <span className="text-[#fbbf24] font-semibold">{prayerTimes.hijriDate}</span>
            </p>

            {/* Voluntary Fasting Reminder Capsule */}
            {(fastingInfo.isUpcomingSeason || fastingInfo.reminderMessage || isFastingIntent) && (
              <div className="mt-2.5 inline-flex flex-wrap items-center gap-2 px-3.5 py-2 rounded-2xl bg-[#111C18] border border-[#D4AF37]/50 shadow-[0_4px_16px_rgba(0,0,0,0.4)] text-xs text-amber-200">
                <span className="font-bold text-[#F3CA63]">
                  {fastingInfo.reminderMessage || `❖ ${fastingInfo.occasionTitle} المبارك ❖`}
                </span>
                <button
                  type="button"
                  onClick={handleToggleFasting}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    isFastingIntent
                      ? 'bg-emerald-600 text-white shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                      : 'bg-gradient-to-r from-[#D4AF37] to-[#B8962E] text-slate-950 hover:brightness-110 shadow-sm'
                  }`}
                >
                  {isFastingIntent ? (
                    <>
                      <span>نويت الصيام</span>
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </>
                  ) : (
                    <span>نويت الصيام ✓</span>
                  )}
                </button>
              </div>
            )}

            {/* Travel Mode Active Indicator */}
            {settings.travelModeEnabled && (
              <div className="mt-2">
                <button
                  type="button"
                  onClick={onOpenTravelTab}
                  className="inline-flex flex-wrap items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-[#111C18] border border-emerald-500/45 hover:border-[#D4AF37]/70 text-xs text-emerald-200 transition-all shadow-sm"
                  title="فتح إعدادات رخصة المسافر وأوقات الجمع"
                >
                  <Plane className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="font-bold text-[#F3CA63]">وضع السفر نشط:</span>
                  <span>
                    قصر الرباعية ركعتان ·{' '}
                    {settings.travelJamType === 'takheer' ? 'جمع تأخير متاح' : 'جمع تقديم متاح'}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Center Column: Scenic Mosque Stage Behind Pointed Islamic Mihrab Arch Countdown */}
          <div
            className="theme-keep-light relative w-full lg:flex-1 lg:max-w-[520px] min-h-[268px] sm:min-h-[296px] rounded-2xl overflow-hidden border border-[#CFA632]/50 shadow-[0_14px_34px_rgba(0,0,0,0.45)] flex items-center justify-center px-4 pt-12 pb-6 sm:px-6 sm:pt-11 sm:pb-7"
            style={{
              background:
                HERO_MOSQUE_BACKDROPS[activeHeroBackdropIdx % HERO_MOSQUE_BACKDROPS.length]
                  ?.cssFallback,
            }}
          >
            {/* Cross-fading High-Clarity Mosque Photos (No text/titles over photos) */}
            {HERO_MOSQUE_BACKDROPS.map((scene, idx) => {
              const isActive = idx === activeHeroBackdropIdx % HERO_MOSQUE_BACKDROPS.length;
              const hasImgFailed = Boolean(failedHeroImages[scene.id]);
              return (
                <div
                  key={scene.id}
                  aria-hidden="true"
                  className={`absolute inset-0 pointer-events-none select-none transition-opacity duration-[1600ms] ease-in-out ${
                    isActive ? 'opacity-100 z-[1]' : 'opacity-0 z-0'
                  }`}
                >
                  {!hasImgFailed ? (
                    <img
                      src={scene.imageUrl}
                      alt="خلفية مسجد"
                      referrerPolicy="no-referrer"
                      onError={() => setFailedHeroImages((prev) => ({ ...prev, [scene.id]: true }))}
                      style={{
                        animationPlayState: isHeroMotionPlaying ? 'running' : 'paused',
                      }}
                      className={`w-full h-full object-cover object-center brightness-[1.03] contrast-[1.04] saturate-[1.06] ${scene.cameraClass}`}
                    />
                  ) : (
                    <div className="w-full h-full" style={{ background: scene.cssFallback }} />
                  )}
                </div>
              );
            })}

            {/* Very Light Edge-Only Vignette Scrim (Preserves vivid mosque clarity at center) */}
            <div
              aria-hidden="true"
              className="absolute inset-0 z-[2] pointer-events-none"
              style={{
                background:
                  'radial-gradient(ellipse at center, rgba(4, 18, 13, 0) 46%, rgba(4, 18, 13, 0.34) 82%, rgba(4, 18, 13, 0.62) 100%)',
              }}
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 z-[2] pointer-events-none"
              style={{
                background:
                  'linear-gradient(to bottom, rgba(4, 18, 13, 0.28) 0%, transparent 24%, transparent 76%, rgba(4, 18, 13, 0.36) 100%)',
              }}
            />

            {/* Compact Icon-Only Controls: Manual Switch + Motion Play/Pause */}
            <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleCycleHeroBackdrop}
                aria-label="تغيير الخلفية يدوياً"
                title="تغيير الخلفية"
                className="w-10 h-10 rounded-xl bg-[#04120D]/75 hover:bg-[#04120D]/90 border border-[#CFA632]/55 hover:border-[#F6D884] text-[#F6D884] backdrop-blur-md flex items-center justify-center transition-all duration-150 active:scale-95 shadow-[0_4px_12px_rgba(0,0,0,0.4)] cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleToggleHeroMotion}
                aria-pressed={isHeroMotionPlaying}
                aria-label={isHeroMotionPlaying ? 'إيقاف الحركة التلقائية' : 'تشغيل الحركة التلقائية'}
                title={isHeroMotionPlaying ? 'إيقاف الحركة التلقائية' : 'تشغيل الحركة التلقائية'}
                className={`w-10 h-10 rounded-xl border backdrop-blur-md flex items-center justify-center transition-all duration-150 active:scale-95 shadow-[0_4px_12px_rgba(0,0,0,0.4)] cursor-pointer ${
                  isHeroMotionPlaying
                    ? 'bg-[#04120D]/75 hover:bg-[#04120D]/90 border-[#34D399]/60 text-[#34D399]'
                    : 'bg-[#04120D]/80 hover:bg-[#04120D]/95 border-[#CFA632]/55 text-[#F6D884]'
                }`}
              >
                {isHeroMotionPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4 fill-current" />
                )}
              </button>
            </div>

            <div className="relative z-10 flex flex-col items-center">
              {iqamaRemaining ? (
                (() => {
                  const getIqamaSecs = (rem: string) => {
                    const parts = rem.split(':').map(Number);
                    return parts.length === 2 ? parts[0] * 60 + parts[1] : 999;
                  };
                  const secs = getIqamaSecs(iqamaRemaining);
                  const isNear = secs <= 120 && secs >= 0;
                  const styleMode = settings.iqamaStyle || 'ring';

                  return (
                    <div className="flex flex-col items-center">
                      {/* Style 1: Radial Progress Ring */}
                      {styleMode === 'ring' && (
                        <div
                          className={`relative px-6 py-4 rounded-3xl border-2 backdrop-blur-md shadow-2xl flex items-center gap-4 transition-all ${
                            isNear
                              ? 'bg-rose-950/80 border-rose-500 text-rose-200 animate-pulse'
                              : 'bg-[#04120D]/74 border-[#CFA632]/85 text-[#F6D884]'
                          }`}
                        >
                          <div className="relative w-14 h-14 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                              <path
                                className="text-emerald-950"
                                strokeWidth="3"
                                stroke="currentColor"
                                fill="none"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              />
                              <path
                                className={isNear ? 'text-rose-400' : 'text-[#F6D884]'}
                                strokeDasharray="75, 100"
                                strokeWidth="3.5"
                                strokeLinecap="round"
                                stroke="currentColor"
                                fill="none"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              />
                            </svg>
                            <Timer className={`absolute w-6 h-6 ${isNear ? 'text-rose-400' : 'text-[#F6D884]'}`} />
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="text-xs font-bold text-[#F6D884]">متبقي حتى إقامة صلاة {iqamaPrayerName}</span>
                            </div>
                            <div className="text-3xl font-black font-mono tracking-wider tabular-nums text-white drop-shadow-[0_2px_10px_rgba(4,18,13,0.9)]">
                              {iqamaRemaining}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Style 2: Split Digit Tiles */}
                      {styleMode === 'split' && (
                        <div
                          className={`p-4 rounded-2xl border backdrop-blur-md shadow-xl space-y-2.5 ${
                            isNear ? 'bg-rose-950/80 border-rose-500' : 'bg-[#04120D]/74 border-[#CFA632]/70'
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs text-[#F6D884] font-bold px-1">
                            <span>إقامة صلاة {iqamaPrayerName}</span>
                          </div>
                          <div className="flex items-center gap-2 font-mono text-3xl font-black">
                            <div className="bg-[#04120D]/90 border border-[#CFA632]/55 px-3 py-1.5 rounded-xl text-[#F6D884] tabular-nums shadow-inner">
                              {iqamaRemaining.split(':')[0]}
                            </div>
                            <span className={`${isNear ? 'text-rose-400' : 'text-[#F6D884]'}`}>:</span>
                            <div className="bg-[#04120D]/90 border border-[#CFA632]/55 px-3 py-1.5 rounded-xl text-[#F6D884] tabular-nums shadow-inner">
                              {iqamaRemaining.split(':')[1]}
                            </div>
                          </div>
                          <div className="w-full bg-[#04120D] h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${isNear ? 'bg-rose-500' : 'bg-gradient-to-r from-[#34D399] to-[#F6D884]'}`}
                              style={{ width: '70%' }}
                            ></div>
                          </div>
                        </div>
                      )}

                      {/* Style 3: Glass Capsule Pill */}
                      {styleMode === 'pill' && (
                        <div
                          className={`px-6 py-3 rounded-full border backdrop-blur-md shadow-lg flex items-center gap-3 ${
                            isNear ? 'bg-rose-950/85 border-rose-500 text-rose-200' : 'bg-[#04120D]/74 border-[#CFA632]/70 text-[#F6D884]'
                          }`}
                        >
                          <Timer className={`w-5 h-5 ${isNear ? 'text-rose-400' : 'text-[#F6D884]'}`} />
                          <div className="flex items-center gap-2 text-right">
                            <span className="text-xs font-bold">إقامة {iqamaPrayerName}:</span>
                            <span className="text-2xl font-black font-mono tracking-wider tabular-nums text-white drop-shadow-[0_2px_10px_rgba(4,18,13,0.9)]">
                              {iqamaRemaining}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()
              ) : (
                (() => {
                  const countdownStyle = settings.adhanCountdownStyle || 'islamic-mihrab';
                  const [hStr, mStr, sStr] = timeRemaining.split(':');
                  const displayH = simulateNearAdhan ? '00' : hStr;
                  const displayM = simulateNearAdhan ? '04' : mStr;
                  const displayS = simulateNearAdhan ? '59' : sStr;
                  const displayTime = simulateNearAdhan ? '00:04:59' : timeRemaining;

                  return (
                    <div className="flex flex-col items-center">
                      {/* Style 1: Pointed Islamic Mihrab Arch (المحراب المذهّب) */}
                      {countdownStyle === 'islamic-mihrab' && (
                        <div
                          className={`relative px-7 sm:px-9 pt-7 pb-4 rounded-t-[90px] rounded-b-2xl border-2 backdrop-blur-md shadow-[0_12px_36px_rgba(0,0,0,0.55)] flex flex-col items-center transition-all ${
                            isAdhanNear
                              ? 'bg-amber-950/75 border-[#F6D884] ring-2 ring-[#F6D884]/40 text-amber-100'
                              : 'bg-[#04120D]/72 border-[#CFA632]/85 text-[#F6D884]'
                          }`}
                        >
                          {/* Inner Double Gold Hairline Arch */}
                          <div className="absolute inset-1.5 rounded-t-[84px] rounded-b-xl border border-[#CFA632]/35 pointer-events-none" />

                          {/* 8-Pointed Golden Star Crown at Apex */}
                          <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[#04120D] border border-[#CFA632]/80 flex items-center justify-center shadow-[0_0_16px_rgba(246,216,132,0.45)]">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                              <rect x="5" y="5" width="14" height="14" stroke="#F6D884" strokeWidth="1.5" fill="#F6D884" fillOpacity="0.2" />
                              <rect x="5" y="5" width="14" height="14" stroke="#F6D884" strokeWidth="1.5" fill="#F6D884" fillOpacity="0.2" transform="rotate(45 12 12)" />
                              <circle cx="12" cy="12" r="2.2" fill="#F6D884" />
                            </svg>
                          </div>

                          {isFastingIntent && (
                            <div className="mt-1 mb-1 px-3 py-0.5 rounded-full bg-[#04120D]/85 border border-[#CFA632]/60 text-[11px] font-bold text-[#F6D884] flex items-center gap-1.5 shadow-inner">
                              <Sparkles className="w-3 h-3 text-[#F6D884]" />
                              <span>✦ صائم اليوم ({fastingInfo.occasionTitle}) ✦</span>
                            </div>
                          )}
                          <span className="text-xs text-[#F6D884] font-bold mb-0.5 font-amiri tracking-wide flex items-center gap-2">
                            <span>المتبقي حتى الأذان</span>
                            {isFastingIntent && (
                              <span className="text-[10px] text-[#34D399] font-mono tabular-nums">
                                (السحور: {fastingInfo.suhoorTimeStr} · الإفطار: {prayerTimes.maghrib})
                              </span>
                            )}
                          </span>
                          <div
                            dir="ltr"
                            className="text-3xl sm:text-4xl md:text-5xl font-black font-mono tracking-wider tabular-nums text-white drop-shadow-[0_2px_12px_rgba(4,18,13,0.95)]"
                          >
                            {displayTime}
                          </div>
                          {isFastingIntent && fastingInfo.isMaghribNear && (
                            <div className="mt-2 px-3 py-1.5 rounded-xl bg-amber-950/85 border border-amber-500/50 text-[11px] text-amber-200 text-center font-amiri">
                              دعاء الإفطار: «ذَهَبَ الظَّمَأُ وَابْتَلَّتِ الْعُرُوقُ، وَثَبَتَ الأَجْرُ إِنْ شَاءَ اللَّهُ»
                            </div>
                          )}
                        </div>
                      )}

                      {/* Style 2: Rub el Hizb (النجمة المثمّنة - ربع الحزب) */}
                      {countdownStyle === 'rub-el-hizb' && (
                        <div className="flex flex-col items-center gap-2">
                          <span className="text-xs text-[#F6D884] font-bold font-amiri px-3 py-0.5 rounded-full bg-[#04120D]/65 backdrop-blur-sm">
                            المتبقي حتى الأذان
                          </span>
                          <div className="flex items-center gap-3" dir="ltr">
                            {[
                              { val: displayH, label: 'ساعة' },
                              { val: displayM, label: 'دقيقة' },
                              { val: displayS, label: 'ثانية' },
                            ].map((item, idx) => (
                              <div
                                key={idx}
                                className={`relative p-3.5 rounded-2xl border-2 backdrop-blur-md shadow-xl flex flex-col items-center min-w-[74px] ${
                                  isAdhanNear
                                    ? 'bg-amber-950/80 border-[#F6D884] text-amber-100'
                                    : 'bg-[#04120D]/74 border-[#CFA632]/75 text-[#F6D884]'
                                }`}
                              >
                                <span className="absolute -top-2.5 text-[10px] text-[#F6D884] font-bold bg-[#04120D] px-2 py-0.5 rounded-full border border-[#CFA632]/65">
                                  ۞
                                </span>
                                <div className="text-2xl md:text-3xl font-black font-mono tabular-nums mt-1 text-white drop-shadow-[0_2px_8px_rgba(4,18,13,0.9)]">
                                  {item.val}
                                </div>
                                <span className="text-[10px] text-[#F6D884] font-bold mt-1 font-sans">{item.label}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Style 3: Mashrabiya Arabesque (المشربية والأرابيسك) */}
                      {countdownStyle === 'mashrabiya-arabesque' && (
                        <div
                          className={`relative px-7 py-4 rounded-2xl border-2 backdrop-blur-md shadow-2xl flex flex-col items-center space-y-2.5 ${
                            isAdhanNear
                              ? 'bg-amber-950/80 border-[#F6D884] text-amber-100'
                              : 'bg-[#04120D]/74 border-[#CFA632]/75 text-[#F6D884]'
                          }`}
                        >
                          <span className="text-xs text-[#F6D884] font-bold font-amiri">المتبقي حتى الأذان</span>
                          <div className="flex items-center gap-3 font-mono text-3xl md:text-4xl font-black tabular-nums text-white drop-shadow-[0_2px_10px_rgba(4,18,13,0.9)]" dir="ltr">
                            <span>{displayH}</span>
                            <span className="text-[#CFA632]">❖</span>
                            <span>{displayM}</span>
                            <span className="text-[#CFA632]">❖</span>
                            <span>{displayS}</span>
                          </div>
                          <div className="w-full bg-[#04120D] h-1.5 rounded-full overflow-hidden border border-[#CFA632]/40">
                            <div
                              className={`h-full transition-all duration-300 ${
                                isAdhanNear ? 'bg-[#F6D884] animate-pulse' : 'bg-gradient-to-r from-[#34D399] to-[#F6D884]'
                              }`}
                              style={{ width: simulateNearAdhan ? '15%' : '75%' }}
                            ></div>
                          </div>
                        </div>
                      )}

                      {/* Style 4: Celestial Astrolabe (الهلال والإسطرلاب الفلكي) */}
                      {countdownStyle === 'celestial-astrolabe' && (
                        <div
                          className={`relative px-8 py-4 rounded-full border-2 backdrop-blur-md shadow-2xl flex flex-col items-center ${
                            isAdhanNear
                              ? 'bg-amber-950/80 border-[#F6D884] text-amber-100'
                              : 'bg-[#04120D]/74 border-[#CFA632]/75 text-[#F6D884]'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-[#F6D884] text-xs font-bold font-amiri">المتبقي حتى الأذان</span>
                          </div>
                          <div dir="ltr" className="text-3xl md:text-4xl font-black font-mono tracking-wider tabular-nums text-white drop-shadow-[0_2px_10px_rgba(4,18,13,0.9)]">
                            {displayTime}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()
              )}
            </div>
          </div>

          {/* Left Column (RTL End): Sound Activation, Notification Bell & Quick Last Third Card */}
          <div className="flex flex-col items-stretch sm:items-end gap-2.5 w-full lg:w-auto lg:shrink-0">
            <div className="flex flex-wrap sm:flex-nowrap items-center justify-center sm:justify-end gap-2 w-full lg:w-auto">
              <button
                onClick={handleActivateAudio}
                disabled={isActivatingAudio}
                className={`min-h-[44px] flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl font-semibold border transition-all text-xs sm:text-sm whitespace-nowrap ${
                  isAudioUnlocked
                    ? 'bg-emerald-950/75 border-[#34D399]/60 text-[#34D399]'
                    : 'bg-[#04120D] hover:bg-[#072219] border-[#CFA632]/45 text-[#F6D884]'
                }`}
                title="تفعيل الإذن الصوتي لتشغيل الأذان التلقائي"
              >
                {isActivatingAudio ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#34D399]" />
                    <span>جاري التفعيل...</span>
                  </>
                ) : isAudioUnlocked ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-[#34D399]" />
                    <span>تم تفعيل الصوت</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-[#F6D884]" />
                    <span>تفعيل الصوت</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleToggleMeetingMode}
                aria-pressed={meetingModeEnabled}
                className={`min-h-[44px] flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-2xl font-semibold border transition-all text-xs sm:text-sm whitespace-nowrap shrink-0 ${
                  meetingModeEnabled
                    ? 'bg-gradient-to-r from-[#F6D884]/25 to-emerald-900/75 border-[#F6D884] text-[#F6D884] shadow-[0_0_16px_rgba(246,216,132,0.22)]'
                    : 'bg-[#04120D] hover:bg-[#072219] border-[#CFA632]/45 text-slate-200 hover:text-[#F6D884]'
                }`}
                title="تبديل وضع المؤذن الصامت للمكاتب والاجتماعات (اهتزاز هادئ بدون صوت مرتفع)"
              >
                <Vibrate className="w-4 h-4 shrink-0" />
                <span>وضع الاجتماع</span>
              </button>

              <button
                onClick={() => {
                  const nextState = !notificationsMuted;
                  setNotificationsMuted(nextState);
                  onUpdateSettings?.({ notificationsEnabled: !nextState });
                  if (!nextState) {
                    backgroundService.requestNotificationPermission();
                  }
                }}
                className={`min-w-[44px] min-h-[44px] p-3 rounded-2xl border transition-all shrink-0 flex items-center justify-center ${
                  notificationsMuted
                    ? 'bg-rose-950/50 border-rose-700/60 text-rose-300'
                    : 'bg-[#04120D] border-[#CFA632]/45 text-[#F6D884] hover:bg-[#072219]'
                }`}
                title={notificationsMuted ? 'تنبيهات الأذان مكتومة' : 'التنبيهات التلقائية مفعلة'}
              >
                {notificationsMuted ? <BellOff className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
              </button>
            </div>

            {/* Compact Last Third of the Night & Witr Quick-Access Card below Bell button */}
            <button
              type="button"
              onClick={() => setIsLastThirdModalOpen(true)}
              className="group flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-2xl bg-[#041814]/90 hover:bg-[#06261f] border border-[#e5b869]/40 hover:border-[#fbbf24]/70 transition-all text-right w-full lg:w-auto shadow-md"
              title="فتح شاشة الثلث الأخير من الليل وتقسيم الليل وحاسبة قيام الليل"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-[#031713] border border-[#e5b869]/35 flex items-center justify-center shrink-0 text-[#fbbf24] group-hover:scale-105 transition-transform">
                  <Moon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#fbbf24] whitespace-nowrap">
                    <span>الثلث الأخير</span>
                    <span className="text-[#e5b869]/70">❖</span>
                    <span className="font-mono tabular-nums text-white">{nightThirds.astronomicalLastThirdStr}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-300 whitespace-nowrap mt-0.5">
                    <span>
                      منبه الوتر:{' '}
                      <strong className={settings.witrReminderEnabled !== false ? 'text-emerald-300' : 'text-slate-400'}>
                        {settings.witrReminderEnabled !== false
                          ? `مفعّل (قبل ${settings.witrReminderMinutes || 20} د)`
                          : 'متوقف'}
                      </strong>
                    </span>
                  </div>
                </div>
              </div>
              <Sparkles className="w-3.5 h-3.5 text-[#e5b869] group-hover:text-[#fbbf24] shrink-0" />
            </button>
          </div>
        </div>

        {/* Bottom Status Bar - Clean and Uncluttered */}
        <div className="relative z-10 mt-6 pt-4 border-t border-[#e5b869]/20 flex flex-wrap items-center justify-between gap-3 text-xs font-sans">
          <span className="text-[#e5b869]/90 font-medium">
            {isAdhanNear
              ? 'وضع التنبيه الذهبي الدافئ نشط حالياً (أقل من 5 دقائق للأذان)'
              : isJumuahActive
              ? isActualFriday
                ? 'وضع الجمعة المباركة التلقائي نشط طوال اليوم'
                : 'معاينة وضع «الجمعة المباركة» مفعّلة'
              : 'أوقات الصلاة محسوبة فلكياً بدقة لمدينتك'}
          </span>
          <div className="flex items-center gap-2 text-[11px] text-[#e5b869]/70">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>حساب المواقيت فلكياً دقيق وموثوق</span>
          </div>
        </div>

        {/* Audio Progress Bar during playback */}
        {(playerState === 'playing' || playerState === 'loading') && (
          <div className="relative z-10 mt-5 pt-4 border-t border-[#e5b869]/20 space-y-2">
            <div className="flex items-center justify-between text-xs text-[#fbbf24] font-mono">
              <span className="flex items-center gap-1.5 font-sans font-bold">
                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>
                  جاري بث:{' '}
                  {activeAudioType === 'dua'
                    ? 'دعاء ما بعد الأذان'
                    : activeAudioType === 'salawat'
                    ? 'الصلاة على النبي ﷺ'
                    : activeAudioType === 'iqama'
                    ? 'إقامة الصلاة'
                    : reciterLabel}
                </span>
              </span>
              <span className="tabular-nums">
                {formatSeconds(audioCurrentTime)} / {audioDuration > 0 ? formatSeconds(audioDuration) : '--:--'}
              </span>
            </div>
            <div className="w-full bg-[#02100d] h-2 rounded-full overflow-hidden border border-[#e5b869]/30">
              <div
                className="bg-gradient-to-r from-emerald-400 to-[#fbbf24] h-full transition-all duration-200"
                style={{ width: `${Math.min(100, Math.max(0, audioProgress))}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Unified Ultra-Compact Islamic Mihrab Box: Forgotten Sunnah + Sujud Sahw + Quiet Mode */}
      <SunnahRadarCard
        onOpenSujudSahw={() => setIsSujudSahwModalOpen(true)}
        quietModeActive={quietEvaluation.isQuietNow}
        quietModeScheduled={!quietEvaluation.isQuietNow && quietEvaluation.enabledSchedulesCount > 0}
        quietModeStatusLabel={quietEvaluation.tileSubLabelAr}
        onOpenQuietMode={() => setIsQuietModeOpen(true)}
      />

      {/* Smart Office & Meeting Mode: Silent Alert Card & Post-Meeting Reminder */}
      {silentMeetingAlert && (
        <div
          dir="rtl"
          className="relative overflow-hidden rounded-3xl border-2 border-[#fbbf24]/70 bg-gradient-to-br from-[#062d24]/95 via-[#041f1a]/95 to-[#03120f]/95 p-5 shadow-[0_14px_40px_rgba(0,0,0,0.5),0_0_28px_rgba(251,191,36,0.18)] backdrop-blur-xl text-right animate-in fade-in duration-200"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#031713] border border-[#fbbf24]/60 flex items-center justify-center text-[#fbbf24] shrink-0">
                <Vibrate className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-[#fbbf24]">
                  <span>❖ المؤذن الصامت للمكاتب والاجتماعات ❖</span>
                  <span className="text-[#e5b869]/60" aria-hidden="true">·</span>
                  <span className="text-emerald-300">نبضة اهتزاز هادئة بدون صوت</span>
                </div>
                <h4 className="font-bold text-base sm:text-lg font-amiri text-white">
                  تنبيه صلاة {silentMeetingAlert.prayerNameAr} ({silentMeetingAlert.timeStr})
                </h4>
                <p className="text-xs text-slate-300">
                  {silentMeetingAlert.reminderScheduledFor
                    ? `تم ضبط التذكير اللطيف بنجاح — سيصلك تنبيه الساعة ${silentMeetingAlert.reminderScheduledFor} بعد انتهاء الاجتماع`
                    : 'تم كتم صوت الأذان تلقائياً حفاظاً على هدوء الاجتماع أو المحاضرة'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <button
                type="button"
                onClick={handleScheduleMeetingReminder20Min}
                className={`min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 whitespace-nowrap ${
                  silentMeetingAlert.reminderScheduledFor
                    ? 'bg-emerald-950/90 border border-emerald-500/60 text-emerald-300'
                    : 'bg-gradient-to-r from-[#fbbf24] to-[#d97706] text-slate-950 shadow-lg hover:brightness-105'
                }`}
              >
                <Clock className="w-4 h-4 shrink-0" />
                <span>
                  {silentMeetingAlert.reminderScheduledFor
                    ? `مجدول للساعة ${silentMeetingAlert.reminderScheduledFor}`
                    : 'ذكّرني بعد 20 دقيقة'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSilentMeetingAlert(null)}
                className="min-w-[44px] min-h-[44px] rounded-xl bg-[#031713] border border-[#e5b869]/35 text-slate-300 hover:text-[#fbbf24] flex items-center justify-center transition-colors"
                title="إخفاء التنبيه الصامت"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {postMeetingReminderBanner && (
        <div
          dir="rtl"
          className="rounded-2xl border-2 border-emerald-400/70 bg-gradient-to-r from-emerald-950/90 via-[#052921]/95 to-[#031713]/95 px-5 py-4 flex items-center justify-between gap-3 text-right shadow-lg"
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-sm font-bold font-amiri text-white">
              ❖ حان الآن وقت أداء صلاة {postMeetingReminderBanner.prayerNameAr} بعد انتهاء الـ ٢٠ دقيقة ❖
            </span>
          </div>
          <button
            type="button"
            onClick={() => setPostMeetingReminderBanner(null)}
            className="min-w-[40px] min-h-[40px] rounded-lg bg-[#031713] text-slate-300 hover:text-white flex items-center justify-center"
            title="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Jumuah Early Attendance & Sunan Alert Card (1 hour before Jumuah Adhan) */}
      <JumuahSunanCard
        visible={isJumuahActive && isEarlyJumuahVisible}
        minutesToJumuah={isRealEarlyJumuahWindow ? diffToJumuahMinutes : 52}
        dhuhrTimeStr={prayerTimes.dhuhr}
        isSimulated={!isRealEarlyJumuahWindow}
        onDismiss={() => setSimulateJumuahSunan(false)}
      />

      {/* Surah Al-Kahf Companion + Built-in Full Surah Reader + PNG Card + Jumuah Salawat Trigger */}
      <SurahKahfCompanion
        isJumuahActive={isJumuahActive}
        salawatCount={salawatSummary.count}
        salawatTarget={salawatSummary.target}
        onOpenTasbihSalawat={() => {
          setPostPrayerNameAr('الجمعة');
          setTasbihInitialPurpose('jumuah_salawat');
          setIsPostPrayerSimulated(false);
          setIsPostPrayerModalOpen(true);
        }}
      />

      {/* Last Third of the Night Sanctuary Active Banner — Sleek Horizon Card */}
      {isLastThirdActive && (
        <div
          style={{
            background: 'linear-gradient(145deg, #13221D 0%, #0A1310 100%)',
            border: '1px solid rgba(212, 175, 55, 0.45)',
          }}
          className="theme-keep-light relative overflow-hidden rounded-[26px] p-5 md:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.45)] backdrop-blur-xl flex flex-col gap-4 text-right transition-all"
        >
          {/* Soft Golden Halo in the Left Corner */}
          <div
            className="pointer-events-none absolute -top-10 -left-10 w-44 h-44 rounded-full bg-[#D4AF37]/15 blur-2xl"
            aria-hidden="true"
          />

          {/* Top Section: Split Right (Status, Title, Verse) & Left (Countdown Capsule) */}
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Right Side */}
            <div className="flex-1 min-w-0">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#10B981]/15 border border-[#10B981]/45 text-[#10B981] text-xs font-bold">
                <span className="inline-block w-2 h-2 rounded-full bg-[#10B981] animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.85)]" />
                <span>نشط الآن</span>
              </div>

              <h3 className="mt-2.5 font-extrabold text-lg sm:text-xl text-white tracking-tight">
                الثلث الأخير من الليل • وقت السحر
              </h3>

              <div className="h-px w-full max-w-md bg-gradient-to-l from-[#D4AF37]/35 via-[#D4AF37]/15 to-transparent my-2.5" />

              <p className="font-amiri text-base sm:text-lg font-bold text-[#F3D06B] leading-relaxed">
                {activeQiyamVerse.verse}
              </p>
              <p className="text-xs sm:text-sm text-slate-300/90 mt-0.5">
                {activeQiyamVerse.surah} · بصوت {QIYAM_RECITERS[activeQiyamReciter].nameAr}
              </p>
            </div>

            {/* Left Side: Dark Digital Countdown Capsule */}
            <div className="shrink-0 flex flex-col items-center justify-center rounded-2xl bg-[#070E0C] border border-[#D4AF37]/45 px-5 py-3.5 min-w-[160px] shadow-[inset_0_1px_1px_rgba(243,208,107,0.08),0_10px_28px_rgba(0,0,0,0.45)]">
              <div className="w-10 h-10 rounded-full bg-[#111C18] border border-[#D4AF37]/35 flex items-center justify-center mb-2 shadow-[0_0_16px_rgba(243,208,107,0.22)]">
                <Moon className="w-5 h-5 text-[#F3D06B] fill-current drop-shadow-[0_0_8px_rgba(243,208,107,0.65)]" />
              </div>
              <span className="text-[11px] font-medium text-slate-300/90 mb-0.5">
                المتبقي للفجر
              </span>
              <span
                dir="ltr"
                className="font-mono text-xl sm:text-2xl font-extrabold text-[#F3D06B] tabular-nums tracking-wider"
              >
                {nightThirds.formattedRemainingToFajr}
              </span>
            </div>
          </div>

          {/* Bottom Section: Metallic Gold CTA Button + Qiyam Verse Playback Trigger */}
          <div className="relative z-10 flex flex-col sm:flex-row items-stretch gap-2.5">
            <button
              type="button"
              onClick={() => setIsLastThirdModalOpen(true)}
              style={{
                background: 'linear-gradient(135deg, #F3D06B 0%, #D4AF37 55%, #B89124 100%)',
              }}
              className="flex-1 py-3.5 px-5 rounded-2xl font-extrabold text-sm sm:text-base text-[#060B09] shadow-[0_8px_24px_rgba(212,175,55,0.28)] hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#060B09] fill-current shrink-0" />
              <span>دخول خلوة السحر والتهجد</span>
            </button>

            <button
              type="button"
              onClick={() => void startQiyamVersePlayback(activeQiyamVerse, activeQiyamReciter, false)}
              className="min-h-[48px] px-4 py-3 rounded-2xl bg-[#0B1D17] border border-[#10B981]/50 hover:border-[#34D399] text-[#34D399] font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current shrink-0" />
              <span>استماع لآية القيام ({QIYAM_RECITERS[activeQiyamReciter].shortNameAr})</span>
            </button>
          </div>
        </div>
      )}

      {/* 6 Pointed Islamic Mihrab Prayer Cards with Hanging Lanterns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-3">
        {PRAYERS.map((prayer) => {
          const timeValue = prayerTimes[prayer.key];
          const iqamaValue = getIqamaTimeString(prayer.key, timeValue);
          const isNext = prayer.key === nextPrayerKey;
          const prayerMins = timeToMinutes(timeValue);
          const isPast = !isNext && prayerMins <= nowMinutes;
          const spacedEnglishName = prayer.nameEn.toUpperCase().split('').join(' ');

          return (
            <div
              key={prayer.key}
              style={
                isNext
                  ? { background: 'linear-gradient(180deg, #0E3A2A 0%, #08241A 100%)' }
                  : undefined
              }
              className={`relative rounded-t-full rounded-b-3xl p-5 sm:p-6 pt-14 border transition-all duration-300 flex flex-col justify-between items-center text-center backdrop-blur-md overflow-hidden ${
                isNext
                  ? 'theme-keep-light border-2 border-[#D4AF37] shadow-[0_0_50px_rgba(243,202,99,0.28)] ring-2 ring-[#F3CA63]/35 opacity-100'
                  : isPast
                  ? 'bg-gradient-to-b from-[#041b16]/85 via-[#031511]/90 to-[#020d0a]/95 border-[#e5b869]/20 opacity-75 hover:opacity-100 shadow-lg'
                  : 'bg-gradient-to-b from-[#062922]/90 via-[#041d18]/90 to-[#03120f]/95 border-[#D4AF37]/40 hover:border-[#F3CA63]/75 shadow-[0_12px_32px_rgba(0,0,0,0.45)]'
              }`}
            >
              {/* Double Golden Arch Inner Hairline Border (#D4AF37 & #F3CA63) */}
              <div
                className={`absolute inset-1.5 rounded-t-full rounded-b-[20px] border pointer-events-none ${
                  isNext ? 'border-[#F3CA63]/65' : 'border-[#D4AF37]/25'
                }`}
              />

              {/* Subtle Islamic Geometric Lattice in Mihrab Background */}
              <div
                className="absolute inset-0 pointer-events-none opacity-[0.06] bg-[radial-gradient(#F3CA63_1px,transparent_1px)] [background-size:18px_18px]"
                aria-hidden="true"
              />

              {/* Hanging Islamic Lantern at Top of Mihrab */}
              <div className="absolute top-1.5 left-1/2 -translate-x-1/2 z-20">
                <HangingIslamicLantern isNext={isNext} />
              </div>

              {/* Mihrab Inner Warm Golden Radiance */}
              <div
                className={`absolute inset-0 pointer-events-none ${
                  isNext
                    ? 'bg-[radial-gradient(ellipse_at_top,rgba(243,202,99,0.18)_0%,transparent_65%)]'
                    : 'bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.08)_0%,transparent_60%)]'
                }`}
              />

              {/* Mihrab Header: Next Prayer Crown, Icon in Golden Rounded Box, Arabic & Spaced English Name */}
              <div className="relative z-10 space-y-1.5 mt-3 w-full">
                {isNext && (
                  <div className="text-xs font-black text-[#F3CA63] tracking-wide mb-1 drop-shadow-[0_0_8px_rgba(243,202,99,0.45)]">
                    ✦ الصلاة القادمة ✦
                  </div>
                )}
                {isPast && (
                  <div className="text-[11px] font-medium text-slate-400 tracking-wide mb-1">
                    مضت بحمد الله
                  </div>
                )}
                {prayer.key !== 'sunrise' && settings.prayerAdhanEnabled?.[prayer.key] === false && (
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-950/70 border border-rose-500/40 text-rose-200 text-[10px] font-bold mb-1">
                    <span>🔇</span>
                    <span>صامت</span>
                  </div>
                )}

                <div className="flex items-center justify-center">
                  <div
                    className={`w-11 h-11 rounded-xl border flex items-center justify-center shadow-inner ${
                      isNext
                        ? 'bg-[#08241A]/90 border-[#D4AF37]/85 text-[#F3CA63] shadow-[0_0_14px_rgba(212,175,55,0.28)]'
                        : 'bg-[#041d17] border-[#D4AF37]/35'
                    }`}
                  >
                    {prayer.icon}
                  </div>
                </div>

                <h3 className="text-3xl sm:text-4xl font-bold text-white font-amiri tracking-wide pt-0.5">
                  {getDisplayPrayerName(prayer.key, prayer.nameAr)}
                </h3>
                {isJumuahActive && prayer.key === 'dhuhr' ? (
                  <span className="text-[11px] font-bold text-[#F3CA63] block tracking-widest uppercase font-mono">
                    J U M U &apos; A H · خطبة الجمعة
                  </span>
                ) : (
                  <span
                    className="text-[11px] text-[#F3CA63]/85 block uppercase font-mono tracking-[0.18em]"
                    dir="ltr"
                  >
                    {spacedEnglishName}
                  </span>
                )}
              </div>

              {/* Mihrab Center: Adhan Time & Framed Iqama Row */}
              <div className="relative z-10 my-4 w-full space-y-2.5">
                <div>
                  <span className="text-xs text-slate-300 block mb-0.5">
                    {prayer.key === 'sunrise' ? 'وقت الشروق' : 'وقت الأذان'}
                  </span>
                  <div
                    className={`text-4xl sm:text-5xl font-black font-mono tracking-wider tabular-nums ${
                      isNext
                        ? 'text-[#F3CA63] drop-shadow-[0_0_16px_rgba(243,202,99,0.45)]'
                        : 'text-slate-100 drop-shadow-md'
                    }`}
                  >
                    {timeValue}
                  </div>
                </div>

                {/* Iqama Time enclosed between two thin muted-gold horizontal lines */}
                <div className="py-2 border-y border-[#D4AF37]/30 flex items-center justify-center gap-2 text-xs w-full">
                  {iqamaValue ? (
                    <>
                      <span className="text-slate-300">وقت الإقامة:</span>
                      <span
                        className={`font-mono font-bold tabular-nums ${
                          isNext ? 'text-[#F3CA63]' : 'text-[#e5b869]'
                        }`}
                      >
                        {iqamaValue}
                      </span>
                    </>
                  ) : (
                    <span className="text-slate-300">بداية وقت صلاة الضحى</span>
                  )}
                </div>
              </div>

              {/* Mihrab Base: Pill Buttons + Prayer Wird Row + Sunnah Rawatib Row */}
              <div className="relative z-10 w-full pt-1 space-y-2.5">
                {/* Main Action Row: Wide Pill Buttons */}
                <div className="flex items-center justify-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (playerState === 'playing') {
                        adhanPlayer.stop();
                      } else {
                        const isFajr = prayer.key === 'fajr';
                        const reciter = resolvePrayerReciter(settings, prayer.key);
                        adhanPlayer.playAdhan(reciter, prayer.key, isFajr && settings.fajrBoostVolume);
                      }
                    }}
                    className="flex-1 min-h-[44px] flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-[#08241A] hover:bg-[#0c3325] border border-[#D4AF37]/65 text-emerald-200 hover:text-[#F3CA63] text-xs sm:text-sm font-bold transition-all shadow whitespace-nowrap"
                    title="تشغيل صوت الأذان لهذه الصلاة"
                  >
                    <Volume2 className="w-4 h-4 shrink-0 text-[#F3CA63]" />
                    <span>{playerState === 'playing' ? 'إيقاف' : 'سماع'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenStandbyMode) {
                        onOpenStandbyMode();
                      } else {
                        handleOpenFullScreenAdhan(prayer.key);
                      }
                    }}
                    style={{ background: 'linear-gradient(to right, #F59E0B, #D97706)' }}
                    className="flex-1 min-h-[44px] flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full hover:brightness-105 text-slate-950 text-xs sm:text-sm font-black transition-all shadow-lg shadow-amber-950/40 whitespace-nowrap"
                    title="فتح وضع المنضدة الذكية والشاشة الكاملة"
                  >
                    <Sparkles className="w-4 h-4 fill-current shrink-0" />
                    <span>الشاشة الكاملة</span>
                  </button>
                </div>

                {/* Prayer Wird Strip (صف وِرد الصلاة) & Sunnah Rawatib Strip (صف السنن الرواتب) */}
                {prayer.key !== 'sunrise' && (() => {
                  const pKey = prayer.key as KhatmaPrayerKey;
                  const wird = khatmaSchedule.wirdByPrayer[pKey];
                  const sunnahInfo = SUNNAH_RAWATIB_LABELS[pKey];
                  const isSunnahDone = isPrayerSunnahCompleted(sunnahState, pKey);
                  const hasBuiltHouseInJannah = rawatibRakatsCompleted >= RAWATIB_TOTAL_TARGET;
                  const prayerSurahsGroup = DAILY_PRAYER_SURAHS.find((g) => g.prayerKey === pKey);

                  return (
                    <div className="space-y-2 w-full">
                      {/* Row 2: Prayer Wird Capsule + Matching Square Completion Check Button */}
                      {wird && (
                        <div className="flex items-stretch gap-2 w-full">
                          <button
                            type="button"
                            onClick={() => onOpenWirdModal(pKey, getDisplayPrayerName(prayer.key, prayer.nameAr))}
                            className="theme-keep-light flex-1 min-h-[44px] px-3 py-2 rounded-2xl border border-[#D4AF37]/40 bg-[#111C18] hover:border-[#F3CA63] hover:bg-[#162520] text-xs transition-all flex items-center gap-2 text-right text-slate-100"
                            title="عرض آيات وِرد القرآن الكريم"
                          >
                            <BookOpen className="w-4 h-4 shrink-0 text-[#F3CA63]" />
                            <span className="truncate font-medium">
                              وِرد {getDisplayPrayerName(prayer.key, prayer.nameAr)}: {wird.summary}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onTogglePrayerWird(pKey)}
                            aria-pressed={wird.isCompleted}
                            className={`w-[44px] min-h-[44px] rounded-2xl border transition-all flex items-center justify-center shrink-0 ${
                              wird.isCompleted
                                ? 'bg-[#10B981] border-[#34D399] text-slate-950 font-black shadow-[0_0_16px_rgba(16,185,129,0.5)]'
                                : 'bg-[#111C18] border-[#D4AF37]/40 text-slate-400 hover:border-[#F3CA63] hover:text-[#F3CA63]'
                            }`}
                            title={wird.isCompleted ? 'تم إنجاز الوِرد (انقر لإلغاء التحديد)' : 'تسجيل إنجاز الوِرد'}
                          >
                            <Check className={`w-4 h-4 stroke-[3] ${wird.isCompleted ? 'text-slate-950' : 'text-slate-300'}`} />
                          </button>
                        </div>
                      )}

                      {/* Row 3: Sunnah Rawatib Capsule + Matching Square Completion Check Button */}
                      <div className="flex items-stretch gap-2 w-full">
                        <div className="theme-keep-light flex-1 min-h-[44px] px-3 py-2 rounded-2xl border border-[#D4AF37]/40 bg-[#111C18] text-right flex flex-col justify-center gap-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 text-[10px]">
                            <span className="font-bold text-[#F3CA63] tabular-nums whitespace-nowrap">
                              السنن الرواتب: {toArabicDigits(rawatibRakatsCompleted)} / ١٢ ركعة
                            </span>
                            {hasBuiltHouseInJannah && (
                              <span className="font-bold text-[#F3CA63] whitespace-nowrap animate-in fade-in duration-200">
                                بُني لك بيت في الجنة ✨
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-1.5">
                            <span className="text-xs font-medium text-slate-100 leading-snug">
                              {sunnahInfo.title}
                            </span>

                            {pKey === 'dhuhr' && (
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleToggleDhuhrSubSunnah('before')}
                                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all ${
                                    sunnahState.dhuhrBefore
                                      ? 'bg-[#10B981] border-[#34D399] text-slate-950'
                                      : 'bg-[#08241A] border-[#D4AF37]/40 text-slate-200 hover:border-[#F3CA63]'
                                  }`}
                                >
                                  ٤ قبلية
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleDhuhrSubSunnah('after')}
                                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all ${
                                    sunnahState.dhuhrAfter
                                      ? 'bg-[#10B981] border-[#34D399] text-slate-950'
                                      : 'bg-[#08241A] border-[#D4AF37]/40 text-slate-200 hover:border-[#F3CA63]'
                                  }`}
                                >
                                  ٢ بعدية
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleTogglePrayerSunnah(pKey)}
                          aria-pressed={isSunnahDone}
                          className={`w-[44px] min-h-[44px] rounded-2xl border transition-all flex items-center justify-center shrink-0 ${
                            isSunnahDone
                              ? 'bg-[#10B981] border-[#34D399] text-slate-950 font-black shadow-[0_0_16px_rgba(16,185,129,0.5)]'
                              : 'bg-[#111C18] border-[#D4AF37]/40 text-slate-400 hover:border-[#F3CA63] hover:text-[#F3CA63]'
                          }`}
                          title={
                            isSunnahDone
                              ? `تم إتمام ${sunnahInfo.title} (انقر لإلغاء التحديد)`
                              : `تسجيل إتمام ${sunnahInfo.title}`
                          }
                        >
                          <Check className={`w-4 h-4 stroke-[3] ${isSunnahDone ? 'text-slate-950' : 'text-slate-300'}`} />
                        </button>
                      </div>

                      {/* Row 4 (Inside Next Prayer Mihrab Base): Two Suggested Surahs for the 1st & 2nd Rakah */}
                      {isNext && prayerSurahsGroup && (
                        <div className="theme-keep-light w-full rounded-2xl bg-[#111C18] border border-[rgba(212,175,55,0.45)] p-3 space-y-2.5 text-right">
                          <div className="theme-keep-light text-[11px] font-bold text-[#F3CA63] text-center leading-relaxed">
                            ❖ سورتا صلاة {getDisplayPrayerName(prayer.key, prayer.nameAr)} (اضغط للقراءة بالتشكيل) ❖
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            {prayerSurahsGroup.surahs.slice(0, 2).map((surah, surahIdx) => (
                              <button
                                key={surah.surahNumber}
                                type="button"
                                onClick={() =>
                                  setMihrabSelectedSurah({
                                    surah,
                                    prayerNameAr: `صلاة ${getDisplayPrayerName(prayer.key, prayer.nameAr)}`,
                                  })
                                }
                                className="theme-keep-light min-h-[44px] p-2.5 rounded-xl bg-[#0B1713] hover:bg-[#162620] border border-[#D4AF37]/30 hover:border-[#F3CA63] text-right flex flex-col justify-between gap-1 transition-all active:scale-[0.98]"
                                title={`قراءة ${surah.title} (${surahIdx === 0 ? 'الركعة الأولى' : 'الركعة الثانية'}) بالتشكيل`}
                              >
                                <div className="flex flex-wrap items-baseline justify-between gap-x-1 gap-y-0.5 w-full">
                                  <span className="theme-keep-light font-amiri font-bold text-sm text-[#F3CA63] leading-snug">
                                    {surah.title}
                                  </span>
                                  <span className="theme-keep-light text-[10px] text-[#CBD5E1] font-medium whitespace-nowrap">
                                    ({toArabicDigits(surah.ayahsCount)} آيات)
                                  </span>
                                </div>

                                <p className="theme-keep-light text-[11px] leading-snug text-[#E2E8F0] line-clamp-2">
                                  <span className="theme-keep-light font-amiri font-semibold text-[#F3CA63]/95">
                                    {surah.gharibWord}:
                                  </span>{' '}
                                  {surah.gharibMeaning.replace(/^أي:\s*/, '')}
                                </p>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
