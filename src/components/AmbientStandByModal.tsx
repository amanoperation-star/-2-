import React, { useState, useEffect } from 'react';
import {
  X,
  Sun,
  Moon,
  Sunrise,
  Sunset,
  Clock,
  Volume2,
  VolumeX,
  Square,
  MapPin,
  Smartphone,
  Users,
  Timer,
  RotateCcw,
  RefreshCw,
} from 'lucide-react';
import { PrayerTimeData, CityLocation, UserSettings, PrayerName } from '../types';
import { adhanPlayer, AudioPlayerState } from '../utils/audioAdhan';
import { backgroundService } from '../utils/backgroundService';

export type UnifiedDisplayMode = 'standby' | 'mosque';

const DISPLAY_MODE_STORAGE_KEY = 'unified_display_mode';
const TASBIH_STORAGE_KEY = 'standby_tasbih_state';

const TASBIH_PHRASES = [
  'سُبْحَانَ اللَّهِ',
  'الْحَمْدُ لِلَّهِ',
  'اللَّهُ أَكْبَرُ',
  'لَا إِلَٰهَ إِلَّا اللَّهُ',
  'أَسْتَغْفِرُ اللَّهَ',
] as const;

interface TasbihState {
  phraseIndex: number;
  count: number;
  total: number;
}

function loadTasbihState(): TasbihState {
  if (typeof window === 'undefined') {
    return { phraseIndex: 0, count: 0, total: 0 };
  }
  try {
    const raw = localStorage.getItem(TASBIH_STORAGE_KEY);
    if (!raw) return { phraseIndex: 0, count: 0, total: 0 };
    const parsed = JSON.parse(raw);
    return {
      phraseIndex:
        typeof parsed.phraseIndex === 'number' &&
        parsed.phraseIndex >= 0 &&
        parsed.phraseIndex < TASBIH_PHRASES.length
          ? parsed.phraseIndex
          : 0,
      count: typeof parsed.count === 'number' && parsed.count >= 0 ? parsed.count : 0,
      total: typeof parsed.total === 'number' && parsed.total >= 0 ? parsed.total : 0,
    };
  } catch {
    return { phraseIndex: 0, count: 0, total: 0 };
  }
}

export function loadSavedDisplayMode(): UnifiedDisplayMode {
  if (typeof window === 'undefined') return 'standby';
  const saved = localStorage.getItem(DISPLAY_MODE_STORAGE_KEY);
  return saved === 'mosque' ? 'mosque' : 'standby';
}

interface AmbientStandByModalProps {
  isOpen: boolean;
  onClose: () => void;
  prayerTimes: PrayerTimeData;
  currentLocation: CityLocation;
  settings: UserSettings;
  initialMode?: UnifiedDisplayMode;
}

const PRAYER_META: Record<PrayerName, { nameAr: string; icon: (cls?: string) => React.ReactNode }> = {
  fajr: { nameAr: 'الفجر', icon: (cls = 'w-6 h-6 text-[#F3CA63]') => <Sunrise className={cls} /> },
  sunrise: { nameAr: 'الشروق', icon: (cls = 'w-6 h-6 text-[#F3CA63]') => <Sun className={cls} /> },
  dhuhr: { nameAr: 'الظهر', icon: (cls = 'w-6 h-6 text-[#F3CA63]') => <Sun className={cls} /> },
  asr: { nameAr: 'العصر', icon: (cls = 'w-6 h-6 text-[#F3CA63]') => <Sun className={cls} /> },
  maghrib: { nameAr: 'المغرب', icon: (cls = 'w-6 h-6 text-[#F3CA63]') => <Sunset className={cls} /> },
  isha: { nameAr: 'العشاء', icon: (cls = 'w-6 h-6 text-[#F3CA63]') => <Moon className={cls} /> },
};

function parseTimeMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function format12Hour(timeStr: string): string {
  const [h, m] = timeStr.split(':').map(Number);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const suffix = h >= 12 ? 'م' : 'ص';
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${suffix}`;
}

function addMinutes12Hour(timeStr: string, addMins: number): string {
  const total = (parseTimeMinutes(timeStr) + addMins) % (24 * 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const suffix = h >= 12 ? 'م' : 'ص';
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${suffix}`;
}

export const AmbientStandByModal: React.FC<AmbientStandByModalProps> = ({
  isOpen,
  onClose,
  prayerTimes,
  currentLocation,
  settings,
  initialMode,
}) => {
  const [displayMode, setDisplayMode] = useState<UnifiedDisplayMode>(
    () => initialMode ?? loadSavedDisplayMode()
  );
  const [now, setNow] = useState<Date>(() => new Date());
  const [tasbih, setTasbih] = useState<TasbihState>(() => loadTasbihState());
  const [tasbihPulse, setTasbihPulse] = useState<boolean>(false);

  const [playerState, setPlayerState] = useState<AudioPlayerState>('idle');
  const [isAudioUnlocked, setIsAudioUnlocked] = useState<boolean>(() => adhanPlayer.getIsUnlocked());
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(() => adhanPlayer.isMuted());

  useEffect(() => {
    if (initialMode) {
      setDisplayMode(initialMode);
    }
  }, [initialMode]);

  const handleSelectMode = (mode: UnifiedDisplayMode) => {
    setDisplayMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem(DISPLAY_MODE_STORAGE_KEY, mode);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(TASBIH_STORAGE_KEY, JSON.stringify(tasbih));
      } catch {
        // ignore storage quota errors
      }
    }
  }, [tasbih]);

  useEffect(() => {
    setIsAudioUnlocked(adhanPlayer.getIsUnlocked());
    setIsAudioMuted(adhanPlayer.isMuted());
    const unsub = adhanPlayer.subscribe({
      onStateChange: (st) => setPlayerState(st),
      onUnlocked: () => setIsAudioUnlocked(true),
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, [isOpen]);

  // Keep screen active while display overlay is open
  useEffect(() => {
    if (!isOpen) return;
    backgroundService.requestWakeLock();
    let wakeLock: any = null;
    const requestLock = async () => {
      try {
        if ('wakeLock' in navigator && (navigator as any).wakeLock) {
          wakeLock = await (navigator as any).wakeLock.request('screen');
        }
      } catch {
        // ignore if unsupported or blocked
      }
    };
    requestLock();
    return () => {
      if (wakeLock && typeof wakeLock.release === 'function') {
        wakeLock.release().catch(() => {});
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Next prayer & live countdown
  const order: PrayerName[] = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
  const currentSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  let nextKey: PrayerName = 'fajr';
  let diffSeconds = 0;

  for (const k of order) {
    const pSecs = parseTimeMinutes(prayerTimes[k]) * 60;
    if (pSecs > currentSeconds) {
      nextKey = k;
      diffSeconds = pSecs - currentSeconds;
      break;
    }
  }
  if (diffSeconds === 0) {
    nextKey = 'fajr';
    diffSeconds = 24 * 3600 - currentSeconds + parseTimeMinutes(prayerTimes.fajr) * 60;
  }

  const cdH = String(Math.floor(diffSeconds / 3600)).padStart(2, '0');
  const cdM = String(Math.floor((diffSeconds % 3600) / 60)).padStart(2, '0');
  const cdS = String(diffSeconds % 60).padStart(2, '0');
  const countdownStr = `${cdH}:${cdM}:${cdS}`;

  const isFriday = now.getDay() === 5;
  const getPrayerLabel = (key: PrayerName) =>
    key === 'dhuhr' && isFriday ? 'الجمعة' : PRAYER_META[key].nameAr;

  const nextPrayerNameAr = getPrayerLabel(nextKey);
  const nextAdhanStr = prayerTimes[nextKey];
  const iqamaMinutesMap = settings.iqamaMinutes || {
    fajr: 25,
    dhuhr: 20,
    asr: 20,
    maghrib: 10,
    isha: 20,
  };
  const iqamaOffset = nextKey === 'sunrise' ? 0 : iqamaMinutesMap[nextKey];
  const iqamaTimeStr =
    nextKey === 'sunrise' ? 'لا توجد إقامة' : addMinutes12Hour(nextAdhanStr, iqamaOffset);

  // Active post-Adhan Iqama window detection (for Mosque / Home Display & Standby)
  const currentMinutesDecimal = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  let activeIqamaPrayerLabel = '';
  let activeIqamaRemaining: string | null = null;
  const fardList: { key: Exclude<PrayerName, 'sunrise'>; nameAr: string }[] = [
    { key: 'fajr', nameAr: 'الفجر' },
    { key: 'dhuhr', nameAr: isFriday ? 'الجمعة' : 'الظهر' },
    { key: 'asr', nameAr: 'العصر' },
    { key: 'maghrib', nameAr: 'المغرب' },
    { key: 'isha', nameAr: 'العشاء' },
  ];
  for (const p of fardList) {
    const iqamaDuration = iqamaMinutesMap[p.key] || 20;
    const diff = currentMinutesDecimal - parseTimeMinutes(prayerTimes[p.key]);
    if (diff >= 0 && diff <= iqamaDuration) {
      activeIqamaPrayerLabel = p.nameAr;
      const remMinutes = iqamaDuration - diff;
      const m = Math.floor(remMinutes);
      const s = Math.floor((remMinutes - m) * 60);
      activeIqamaRemaining = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      break;
    }
  }

  // Clock formatting
  const clockHours24 = now.getHours();
  const clockHours12 = clockHours24 % 12 === 0 ? 12 : clockHours24 % 12;
  const clockAmPm = clockHours24 >= 12 ? 'م' : 'ص';
  const clockMain12 = `${String(clockHours12).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const clockMain24 = `${String(clockHours24).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const clockSecs = String(now.getSeconds()).padStart(2, '0');

  const handleToggleAudioControl = async () => {
    if (!isAudioUnlocked) {
      await adhanPlayer.unlockAudio();
      if (adhanPlayer.isMuted()) {
        adhanPlayer.toggleMute();
      }
      setIsAudioUnlocked(true);
      setIsAudioMuted(false);
      adhanPlayer.playChime();
      return;
    }
    const nextMuted = adhanPlayer.toggleMute();
    setIsAudioMuted(nextMuted);
    if (!nextMuted) {
      adhanPlayer.playChime();
    }
  };

  const handleToggleAdhanTest = async () => {
    if (playerState === 'playing' || playerState === 'loading') {
      adhanPlayer.stop();
    } else {
      if (!isAudioUnlocked) {
        await adhanPlayer.unlockAudio();
        setIsAudioUnlocked(true);
      }
      if (adhanPlayer.isMuted()) {
        adhanPlayer.toggleMute();
        setIsAudioMuted(false);
      }
      adhanPlayer.playAdhan(settings.adhanReciter);
    }
  };

  const handleTapTasbih = () => {
    setTasbih((prev) => {
      const nextCount = prev.count + 1;
      if (nextCount > 33) {
        return {
          phraseIndex: (prev.phraseIndex + 1) % TASBIH_PHRASES.length,
          count: 1,
          total: prev.total + 1,
        };
      }
      return {
        ...prev,
        count: nextCount,
        total: prev.total + 1,
      };
    });
    setTasbihPulse(true);
    window.setTimeout(() => setTasbihPulse(false), 180);
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(10);
      } catch {
        // ignore vibration errors
      }
    }
  };

  const tasbihProgressPct = Math.min(100, Math.round((tasbih.count / 33) * 100));

  return (
    <div
      dir="rtl"
      className="theme-keep-light fixed inset-0 z-[90] h-[100dvh] w-full bg-[#050807] text-slate-100 flex flex-col overflow-hidden select-none font-sans"
    >
      {/* Subtle Ambient Islamic Emerald & Gold Radial Glow */}
      <div
        className="absolute -top-24 right-1/4 w-[420px] h-[420px] rounded-full bg-[#10B981]/10 blur-[140px] pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-24 left-1/4 w-[420px] h-[420px] rounded-full bg-[#D4AF37]/10 blur-[140px] pointer-events-none"
        aria-hidden="true"
      />

      {/* Unified Top Control Bar */}
      <header className="relative z-20 shrink-0 w-full px-3 py-2.5 sm:px-6 sm:py-3.5 border-b border-[#D4AF37]/25 bg-[#09120F]/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-wrap md:flex-nowrap items-center justify-between gap-2.5">
          {/* Far Right (RTL first): Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="order-1 min-h-[40px] px-3.5 py-2 rounded-xl bg-[#111C18] hover:bg-[#192A24] border border-[#D4AF37]/50 text-[#D4AF37] text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-colors shrink-0"
            title="إغلاق وضع العرض والعودة للواجهة الرئيسية"
          >
            <X className="w-4 h-4 shrink-0" />
            <span>إغلاق</span>
          </button>

          {/* Center: Unified Segmented Pill Mode Switcher */}
          <div className="order-3 md:order-2 w-full md:w-auto flex justify-center">
            <div
              role="tablist"
              aria-label="أوضاع العرض"
              className="inline-flex items-center p-1 rounded-full bg-[#111C18] border border-[#D4AF37]/45 shadow-[0_6px_24px_rgba(0,0,0,0.45)] max-w-full overflow-x-auto no-scrollbar"
            >
              <button
                type="button"
                role="tab"
                aria-selected={displayMode === 'standby'}
                onClick={() => handleSelectMode('standby')}
                className={`px-3.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  displayMode === 'standby'
                    ? 'bg-gradient-to-r from-[#D4AF37] via-[#e5b869] to-[#10B981] text-slate-950 shadow-[0_0_18px_rgba(212,175,55,0.35)]'
                    : 'text-slate-300 hover:text-[#D4AF37]'
                }`}
              >
                <span>🌙</span>
                <span>وضع المنضدة الفردي</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={displayMode === 'mosque'}
                onClick={() => handleSelectMode('mosque')}
                className={`px-3.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  displayMode === 'mosque'
                    ? 'bg-gradient-to-r from-[#D4AF37] via-[#e5b869] to-[#10B981] text-slate-950 shadow-[0_0_18px_rgba(16,185,129,0.35)]'
                    : 'text-slate-300 hover:text-[#D4AF37]'
                }`}
              >
                <span>📺</span>
                <span>شاشة البيت / المصلى</span>
              </button>
            </div>
          </div>

          {/* Far Left (RTL last): Enable / Mute Sound Button */}
          <button
            type="button"
            onClick={handleToggleAudioControl}
            aria-pressed={isAudioUnlocked && !isAudioMuted}
            className={`order-2 md:order-3 min-h-[40px] px-3.5 py-2 rounded-xl border text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all shrink-0 ${
              isAudioUnlocked && !isAudioMuted
                ? 'bg-[#08241C] border-[#10B981] text-[#10B981] shadow-[0_0_16px_rgba(16,185,129,0.2)]'
                : isAudioMuted
                  ? 'bg-[#111C18] border-rose-500/50 text-rose-300 hover:bg-[#192A24]'
                  : 'bg-[#111C18] border-[#D4AF37]/50 text-[#D4AF37] hover:bg-[#192A24]'
            }`}
            title="تفعيل أو كتم تنبيهات الأذان والإقامة الصوتية"
          >
            {isAudioMuted ? (
              <>
                <VolumeX className="w-4 h-4 shrink-0" />
                <span>الصوت مكتوم</span>
              </>
            ) : isAudioUnlocked ? (
              <>
                <Volume2 className="w-4 h-4 shrink-0" />
                <span>الصوت مفعّل</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 shrink-0" />
                <span>تفعيل الصوت</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Content Region */}
      <main className="relative z-10 flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-3 py-4 sm:px-6 sm:py-6 flex flex-col">
        {displayMode === 'standby' ? (
          /* ================================================================
             MODE 1: 🌙 وضع المنضدة الفردي (Nightstand / Personal Bedside Mode)
             ================================================================ */
          <div className="w-full max-w-2xl mx-auto flex-1 flex flex-col items-center justify-between gap-4 sm:gap-6">
            {/* Subtle Top Location Pill */}
            <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-400">
              <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>
                {currentLocation.nameAr}، {currentLocation.countryAr}
              </span>
              <span className="text-[#D4AF37]/50" aria-hidden="true">
                ·
              </span>
              <span className="text-[#D4AF37] font-semibold">{prayerTimes.hijriDate}</span>
            </div>

            {/* Thin Mihrab Arch Framing Calm Digital Clock & Next Prayer */}
            <div className="relative w-full max-w-md sm:max-w-lg mx-auto my-auto px-5 pt-10 pb-7 sm:px-8 sm:pt-12 sm:pb-8 rounded-t-[240px] rounded-b-3xl border border-[#D4AF37]/50 bg-gradient-to-b from-[#111C18]/90 via-[#09120F]/95 to-[#050807] shadow-[0_0_65px_rgba(212,175,55,0.12)] flex flex-col items-center text-center space-y-5">
              {/* Thin Inner Golden Hairline Arch */}
              <div
                className="absolute inset-2 sm:inset-2.5 rounded-t-[232px] rounded-b-[20px] border border-[#D4AF37]/20 pointer-events-none"
                aria-hidden="true"
              />

              {/* Subtle Apex Crescent / Star Ornament */}
              <div className="relative z-10 flex items-center justify-center">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 32 32"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M18.2 7.5C13.8 7.9 10.4 11.6 10.4 16C10.4 20.6 14.1 24.3 18.7 24.3C20.7 24.3 22.6 23.6 24 22.3C22.4 22.8 20.7 22.7 19.2 22C16 20.5 14.5 16.7 16 13.5C16.8 11.6 18.4 10.1 20.4 9.3C19.7 8.1 19 7.5 18.2 7.5Z"
                    fill="#D4AF37"
                    fillOpacity="0.9"
                  />
                  <circle cx="22" cy="12" r="1.6" fill="#10B981" />
                </svg>
              </div>

              {/* Calm Digital Clock */}
              <div className="relative z-10 space-y-1">
                <div
                  dir="ltr"
                  className="flex items-baseline justify-center gap-2 text-slate-100 font-mono tabular-nums"
                >
                  <span className="text-6xl sm:text-7xl md:text-8xl font-black tracking-tight text-white drop-shadow-[0_0_24px_rgba(212,175,55,0.18)]">
                    {clockMain12}
                  </span>
                  <div className="flex flex-col items-start text-lg sm:text-xl font-bold text-[#D4AF37]">
                    <span>:{clockSecs}</span>
                    <span className="text-xs sm:text-sm text-slate-400 font-sans">
                      {clockAmPm}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-400">{prayerTimes.dateString}</p>
              </div>

              {/* Next Prayer Name & Countdown */}
              <div className="relative z-10 w-full pt-4 border-t border-[#D4AF37]/20 space-y-3">
                <div className="flex items-center justify-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#111C18] border border-[#D4AF37]/45 flex items-center justify-center">
                    {PRAYER_META[nextKey].icon('w-5 h-5 text-[#D4AF37]')}
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-[#D4AF37] font-bold block">
                      الصلاة القادمة
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-bold font-amiri text-white leading-tight">
                      صلاة {nextPrayerNameAr}
                    </h2>
                  </div>
                </div>

                <div
                  dir="ltr"
                  className="text-3xl sm:text-4xl font-black font-mono tabular-nums text-[#10B981] tracking-widest"
                >
                  {countdownStr}
                </div>

                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-slate-300">
                  <span>
                    الأذان:{' '}
                    <strong className="text-[#D4AF37] font-mono tabular-nums">
                      {format12Hour(nextAdhanStr)}
                    </strong>
                  </span>
                  <span className="text-[#D4AF37]/40" aria-hidden="true">
                    ·
                  </span>
                  <span>
                    الإقامة:{' '}
                    <strong className="text-emerald-300 font-mono tabular-nums">
                      {iqamaTimeStr}
                    </strong>
                  </span>
                </div>

                {activeIqamaRemaining && (
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#111C18] border border-[#10B981]/50 text-xs font-bold text-[#10B981]">
                    <Timer className="w-3.5 h-3.5" />
                    <span>
                      متبقي لإقامة {activeIqamaPrayerLabel}: {activeIqamaRemaining}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Calm Touch Tasbih at Bottom of Screen */}
            <div className="w-full max-w-lg mx-auto shrink-0">
              <div
                onClick={handleTapTasbih}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleTapTasbih();
                  }
                }}
                aria-label={`سبحة لمس هادئة: ${TASBIH_PHRASES[tasbih.phraseIndex]}، العدد ${tasbih.count} من 33`}
                className={`relative overflow-hidden cursor-pointer rounded-2xl bg-[#111C18]/90 hover:bg-[#15241E] border border-[#D4AF37]/45 px-4 py-3.5 sm:px-5 sm:py-4 transition-all shadow-[0_8px_28px_rgba(0,0,0,0.45)] ${
                  tasbihPulse ? 'scale-[0.985] border-[#10B981]' : ''
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  {/* Right: Dhikr Phrase */}
                  <div className="text-right min-w-0">
                    <span className="text-[11px] font-bold text-[#D4AF37]/85 block">
                      سبحة لمس هادئة · المس للتسبيح
                    </span>
                    <div className="text-lg sm:text-2xl font-bold font-amiri text-amber-100 truncate">
                      {TASBIH_PHRASES[tasbih.phraseIndex]}
                    </div>
                  </div>

                  {/* Left: Counter & Micro Controls */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-left px-3 py-1.5 rounded-xl bg-[#09120F] border border-[#10B981]/40">
                      <div
                        dir="ltr"
                        className="text-lg sm:text-xl font-black font-mono tabular-nums text-[#10B981] leading-none"
                      >
                        {tasbih.count}
                        <span className="text-xs text-slate-400 font-semibold">/33</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 text-center">
                        المجموع: {tasbih.total}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTasbih((prev) => ({
                          ...prev,
                          phraseIndex: (prev.phraseIndex + 1) % TASBIH_PHRASES.length,
                          count: 0,
                        }));
                      }}
                      title="تبديل الذكر"
                      aria-label="تبديل الذكر"
                      className="w-9 h-9 rounded-xl bg-[#09120F] border border-[#D4AF37]/35 text-[#D4AF37] hover:border-[#D4AF37] flex items-center justify-center transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTasbih((prev) => ({ ...prev, count: 0 }));
                      }}
                      title="تصفير العداد الحالي"
                      aria-label="تصفير العداد الحالي"
                      className="w-9 h-9 rounded-xl bg-[#09120F] border border-[#D4AF37]/35 text-slate-300 hover:text-[#D4AF37] flex items-center justify-center transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Soft Emerald Progress Bar */}
                <div className="mt-3 h-1 w-full rounded-full bg-[#09120F] overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-l from-[#D4AF37] to-[#10B981] transition-all duration-200"
                    style={{ width: `${tasbihProgressPct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ================================================================
             MODE 2: 📺 شاشة البيت / المصلى (Responsive Home & Mosque Display)
             ================================================================ */
          <div className="w-full max-w-7xl mx-auto flex-1 flex flex-col justify-between gap-4 sm:gap-6">
            {/* Mosque / Home Header Info Strip */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#D4AF37]/20">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#111C18] border border-[#D4AF37]/55 flex items-center justify-center text-xl sm:text-2xl text-[#D4AF37] shadow-lg shrink-0">
                  ☪
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg sm:text-2xl font-extrabold text-white font-amiri">
                      شاشة البيت / المصلى
                    </h2>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#10B981] text-slate-950 font-black">
                      LIVE DISPLAY
                    </span>
                  </div>
                  <p className="text-slate-300 text-xs sm:text-sm flex items-center gap-1.5 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                    <span>
                      {currentLocation.nameAr} ({currentLocation.countryAr})
                    </span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleToggleAdhanTest}
                className={`min-h-[40px] flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all border shrink-0 ${
                  playerState === 'playing'
                    ? 'bg-rose-600 border-rose-500 text-white'
                    : 'bg-[#111C18] hover:bg-[#182721] border-[#D4AF37]/50 text-[#D4AF37]'
                }`}
              >
                {playerState === 'playing' ? (
                  <>
                    <Square className="w-4 h-4 fill-current" />
                    <span>إيقاف الأذان</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4 text-[#10B981]" />
                    <span>تجربة الأذان</span>
                  </>
                )}
              </button>
            </div>

            {/* Center Giant Mosque / Home Clock, Date & Live Iqama / Next Prayer */}
            <div className="flex flex-col items-center justify-center text-center space-y-4 my-auto py-2">
              <div
                dir="ltr"
                className="flex items-baseline justify-center gap-2 sm:gap-3 font-mono tabular-nums"
              >
                <span className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black text-white tracking-wider drop-shadow-[0_10px_35px_rgba(16,185,129,0.22)]">
                  {clockMain24}
                </span>
                <span className="text-2xl sm:text-4xl lg:text-5xl font-black text-[#D4AF37]">
                  :{clockSecs}
                </span>
              </div>

              <p className="text-base sm:text-xl lg:text-2xl text-[#10B981] font-amiri font-bold flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                <span>{prayerTimes.dateString}</span>
                <span className="text-[#D4AF37] font-extrabold">• {prayerTimes.hijriDate}</span>
              </p>

              {activeIqamaRemaining ? (
                <div className="bg-[#111C18] border-2 border-[#D4AF37] px-5 py-3.5 sm:px-8 sm:py-4 rounded-3xl shadow-[0_0_30px_rgba(212,175,55,0.22)] flex items-center gap-4 max-w-full">
                  <Timer className="w-7 h-7 sm:w-8 sm:h-8 text-[#10B981] shrink-0" />
                  <div className="text-right">
                    <span className="text-xs sm:text-sm text-[#D4AF37] font-bold block">
                      الوقت المتبقي لإقامة صلاة {activeIqamaPrayerLabel}:
                    </span>
                    <div
                      dir="ltr"
                      className="text-3xl sm:text-4xl font-black text-[#10B981] font-mono tabular-nums"
                    >
                      {activeIqamaRemaining}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="inline-flex flex-wrap items-center justify-center gap-2 sm:gap-3 px-4 py-2.5 sm:px-6 sm:py-3 rounded-2xl bg-[#111C18] border border-[#D4AF37]/45 shadow-lg">
                  <Clock className="w-4 h-4 text-[#10B981] shrink-0" />
                  <span className="text-xs sm:text-sm font-bold text-slate-200">
                    الصلاة القادمة:{' '}
                    <strong className="text-[#D4AF37]">صلاة {nextPrayerNameAr}</strong>
                  </span>
                  <span className="text-[#D4AF37]/50" aria-hidden="true">
                    ·
                  </span>
                  <span className="text-xs sm:text-sm font-mono tabular-nums text-white font-bold">
                    {format12Hour(nextAdhanStr)}
                  </span>
                  <span className="text-[#D4AF37]/50" aria-hidden="true">
                    ·
                  </span>
                  <span
                    dir="ltr"
                    className="text-sm sm:text-base font-black font-mono tabular-nums text-[#10B981]"
                  >
                    -{countdownStr}
                  </span>
                </div>
              )}

              {/* Mosque Community Alerts Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-4xl w-full pt-1">
                <div className="bg-[#111C18]/90 border border-[#D4AF37]/40 p-3.5 sm:p-4 rounded-2xl flex items-center justify-center gap-2.5 text-[#D4AF37] shadow-lg">
                  <Smartphone className="w-5 h-5 shrink-0" />
                  <span className="text-xs sm:text-sm md:text-base font-extrabold font-amiri">
                    يرجى إغلاق الهاتف المحمول أو وضعه على الصامت 📴
                  </span>
                </div>

                <div className="bg-[#111C18]/90 border border-[#10B981]/40 p-3.5 sm:p-4 rounded-2xl flex items-center justify-center gap-2.5 text-[#10B981] shadow-lg">
                  <Users className="w-5 h-5 shrink-0" />
                  <span className="text-xs sm:text-sm md:text-base font-extrabold font-amiri">
                    استووا واعتدلوا، وتراصوا وسوّوا صفوفكم 🕌
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Responsive 6-Prayer Times Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3.5 pb-1">
              {order.map((pKey) => {
                const isNext = pKey === nextKey;
                return (
                  <div
                    key={pKey}
                    className={`rounded-2xl sm:rounded-3xl p-3 sm:p-4 text-center flex flex-col items-center justify-center transition-all shadow-lg border ${
                      isNext
                        ? 'bg-[#08241C] border-[#10B981] ring-1 ring-[#10B981]/50 shadow-[0_0_24px_rgba(16,185,129,0.2)]'
                        : 'bg-[#111C18]/95 border-[#D4AF37]/30'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-xs sm:text-sm font-bold ${
                          isNext ? 'text-[#10B981]' : 'text-slate-300'
                        }`}
                      >
                        {getPrayerLabel(pKey)}
                      </span>
                      {isNext && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#10B981]/20 text-[#10B981] font-bold">
                          التالية
                        </span>
                      )}
                    </div>
                    <span
                      dir="ltr"
                      className={`text-xl sm:text-2xl lg:text-3xl font-black font-mono tabular-nums mt-1 ${
                        isNext ? 'text-[#D4AF37]' : 'text-white'
                      }`}
                    >
                      {format12Hour(prayerTimes[pKey])}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
