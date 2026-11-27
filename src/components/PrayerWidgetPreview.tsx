import React, { useEffect, useState } from 'react';
import {
  Sunrise,
  Sun,
  Sunset,
  Moon,
  Clock,
  BookOpen,
  Sparkles,
  MapPin,
  Compass,
  RotateCw,
  RotateCcw,
  BellOff,
  Bell,
} from 'lucide-react';
import { CityLocation, PrayerName, PrayerTimeData, UserSettings } from '../types';
import {
  WIDGET_TASBIH_EVENT,
  WIDGET_TASBIH_PHRASES,
  WidgetFontScale,
  WidgetSizeId,
  WidgetStudioConfig,
  WidgetTasbihState,
  WidgetThemeId,
  getWidgetMosqueImageUrl,
  loadWidgetTasbihState,
  saveWidgetTasbihState,
} from '../utils/widgetStudioData';
import {
  RAWATIB_TOTAL_TARGET,
  countCompletedRawatibRakats,
  loadSunnahRawatibState,
} from '../utils/sunnahRawatibData';
import { getDailyWirdSchedule, loadKhatmaState, toArabicDigits } from '../utils/khatmaData';
import { evaluateFastingCalculator } from '../utils/fastingCalculator';
import { calculateDuhaSchedule, formatTime12Ar } from '../utils/duhaSunriseData';
import {
  QUIET_MODE_UPDATED_EVENT,
  QuietModeState,
  evaluateQuietMode,
  loadQuietModeState,
  saveQuietModeState,
} from '../utils/quietModeData';
import { calculateNightThirds } from '../utils/prayerCalculator';
import { PERIODIC_VERSES_AND_HADITHS } from '../utils/islamicData';
import { adhanPlayer } from '../utils/audioAdhan';

interface PrayerWidgetPreviewProps {
  config: WidgetStudioConfig;
  prayerTimes: PrayerTimeData;
  currentLocation: CityLocation;
  settings: UserSettings;
  compactScale?: boolean;
  onNavigateShortcut?: (
    target: 'times' | 'adhkar' | 'qibla' | 'quran' | 'companion' | 'standby'
  ) => void;
}

interface ThemeTokens {
  isLight: boolean;
  surface: string;
  innerFrame: string;
  scrim: string;
  primaryText: string;
  mutedText: string;
  accentGold: string;
  accentEmerald: string;
  subCard: string;
  trackBg: string;
  borderMuted: string;
  actionBg: string;
}

function getThemeTokens(theme: WidgetThemeId): ThemeTokens {
  if (theme === 'parchment') {
    return {
      isLight: true,
      surface:
        'bg-gradient-to-br from-[#FCF7E8] via-[#FAF2DC] to-[#F3E5C2] border border-[#C49A3A] shadow-[0_12px_32px_rgba(104,76,18,0.18)]',
      innerFrame: 'border-[#C49A3A]/35',
      scrim: 'bg-gradient-to-b from-[#FCF7E8]/85 via-[#FAF2DC]/78 to-[#F3E5C2]/90',
      primaryText: 'text-[#0F3D2E]',
      mutedText: 'text-[#4B5E54]',
      accentGold: 'text-[#9A6B11]',
      accentEmerald: 'text-[#0D7A56]',
      subCard: 'bg-[#FFFDF6]/80 border-[#C49A3A]/35',
      trackBg: 'bg-[#E5D7B3]',
      borderMuted: 'border-[#C49A3A]/30',
      actionBg: 'bg-[#EFE2BE]/90 hover:bg-[#E7D4A3] border-[#C49A3A]/50 text-[#0F3D2E]',
    };
  }
  if (theme === 'royal_gold') {
    return {
      isLight: false,
      surface:
        'bg-gradient-to-br from-[#2B1F09] via-[#1B1406] to-[#0D0903] border border-[#F6D884]/70 shadow-[0_14px_36px_rgba(0,0,0,0.75),0_0_26px_rgba(246,216,132,0.16)]',
      innerFrame: 'border-[#F6D884]/35',
      scrim: 'bg-gradient-to-b from-[#1B1406]/80 via-[#150F04]/70 to-[#0B0802]/88',
      primaryText: 'text-[#FFF7E2]',
      mutedText: 'text-[#E6D19E]/85',
      accentGold: 'text-[#F6D884]',
      accentEmerald: 'text-[#34D399]',
      subCard: 'bg-black/40 border-[#F6D884]/35',
      trackBg: 'bg-black/60',
      borderMuted: 'border-[#F6D884]/25',
      actionBg: 'bg-[#2A1F0A]/90 hover:bg-[#3A2B0E] border-[#F6D884]/45 text-[#F6D884]',
    };
  }
  if (theme === 'glass') {
    return {
      isLight: false,
      surface:
        'bg-[#111C18]/55 backdrop-blur-xl border border-white/25 shadow-[0_12px_32px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.2)]',
      innerFrame: 'border-white/15',
      scrim: 'bg-gradient-to-b from-[#091814]/65 via-[#091814]/55 to-[#06110E]/80',
      primaryText: 'text-white',
      mutedText: 'text-slate-200',
      accentGold: 'text-[#F3CA63]',
      accentEmerald: 'text-[#34D399]',
      subCard: 'bg-black/30 border-white/15',
      trackBg: 'bg-black/45',
      borderMuted: 'border-white/15',
      actionBg: 'bg-black/40 hover:bg-black/55 border-white/25 text-white',
    };
  }
  if (theme === 'oled') {
    return {
      isLight: false,
      surface: 'bg-[#050807] border border-[#D4AF37]/60 shadow-[0_12px_32px_rgba(0,0,0,0.85)]',
      innerFrame: 'border-[#D4AF37]/20',
      scrim: 'bg-gradient-to-b from-black/80 via-black/70 to-black/90',
      primaryText: 'text-white',
      mutedText: 'text-slate-300',
      accentGold: 'text-[#F3CA63]',
      accentEmerald: 'text-[#10B981]',
      subCard: 'bg-[#0A0F0D] border-[#D4AF37]/25',
      trackBg: 'bg-neutral-900',
      borderMuted: 'border-[#D4AF37]/20',
      actionBg: 'bg-[#0C1411] hover:bg-[#13201B] border-[#D4AF37]/35 text-[#F3CA63]',
    };
  }
  return {
    isLight: false,
    surface:
      'bg-[#111C18] border border-[#D4AF37]/50 shadow-[0_12px_32px_rgba(0,0,0,0.6),0_0_24px_rgba(212,175,55,0.08)]',
    innerFrame: 'border-[#D4AF37]/25',
    scrim: 'bg-gradient-to-b from-[#0C1914]/78 via-[#0E1D18]/70 to-[#091310]/85',
    primaryText: 'text-white',
    mutedText: 'text-slate-300',
    accentGold: 'text-[#F3CA63]',
    accentEmerald: 'text-[#10B981]',
    subCard: 'bg-black/30 border-[#D4AF37]/25',
    trackBg: 'bg-black/50',
    borderMuted: 'border-[#D4AF37]/20',
    actionBg: 'bg-[#08241A] hover:bg-[#0D3225] border-[#D4AF37]/40 text-[#F3CA63]',
  };
}

const PRAYER_META: Record<
  PrayerName,
  { nameAr: string; icon: (cls?: string) => React.ReactNode }
> = {
  fajr: {
    nameAr: 'الفجر',
    icon: (cls = 'w-4 h-4 text-sky-300') => <Sunrise className={cls} />,
  },
  sunrise: {
    nameAr: 'الشروق',
    icon: (cls = 'w-4 h-4 text-amber-300') => <Sun className={cls} />,
  },
  dhuhr: {
    nameAr: 'الظهر',
    icon: (cls = 'w-4 h-4 text-yellow-300') => <Sun className={cls} />,
  },
  asr: {
    nameAr: 'العصر',
    icon: (cls = 'w-4 h-4 text-orange-300') => <Sun className={cls} />,
  },
  maghrib: {
    nameAr: 'المغرب',
    icon: (cls = 'w-4 h-4 text-rose-300') => <Sunset className={cls} />,
  },
  isha: {
    nameAr: 'العشاء',
    icon: (cls = 'w-4 h-4 text-indigo-300') => <Moon className={cls} />,
  },
};

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

function getFontScaleClasses(scale: WidgetFontScale | undefined) {
  if (scale === 'sm') {
    return {
      title: 'text-base',
      countdown: 'text-xl',
      body: 'text-[10px]',
      micro: 'text-[9px]',
    };
  }
  if (scale === 'lg') {
    return {
      title: 'text-xl',
      countdown: 'text-3xl',
      body: 'text-xs',
      micro: 'text-[11px]',
    };
  }
  return {
    title: 'text-lg',
    countdown: 'text-2xl',
    body: 'text-[11px]',
    micro: 'text-[10px]',
  };
}

const MiniRing: React.FC<{
  percent: number;
  label: string;
  valueText: string;
  strokeColor: string;
  tokens: ThemeTokens;
}> = ({ percent, label, valueText, strokeColor, tokens }) => {
  const clamped = Math.min(100, Math.max(0, percent));
  const r = 15;
  const c = 2 * Math.PI * r;
  const offset = c - (clamped / 100) * c;

  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="relative w-9 h-9 shrink-0 flex items-center justify-center">
        <svg className="w-9 h-9 -rotate-90" viewBox="0 0 38 38" aria-hidden="true">
          <circle
            cx="19"
            cy="19"
            r={r}
            fill="none"
            stroke={tokens.isLight ? 'rgba(196,154,58,0.25)' : 'rgba(212,175,55,0.2)'}
            strokeWidth="3.2"
          />
          <circle
            cx="19"
            cy="19"
            r={r}
            fill="none"
            stroke={strokeColor}
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            className="transition-all duration-500"
          />
        </svg>
        <span className={`absolute text-[8px] font-mono font-bold tabular-nums ${tokens.primaryText}`}>
          {toArabicDigits(clamped)}%
        </span>
      </div>
      <div className="min-w-0 leading-tight">
        <div className={`text-[9px] font-bold truncate ${tokens.mutedText}`}>{label}</div>
        <div className={`text-[10px] font-bold tabular-nums truncate ${tokens.accentGold}`}>
          {valueText}
        </div>
      </div>
    </div>
  );
};

export const PrayerWidgetPreview: React.FC<PrayerWidgetPreviewProps> = ({
  config,
  prayerTimes,
  currentLocation,
  settings,
  compactScale = false,
  onNavigateShortcut,
}) => {
  const [now, setNow] = useState<Date>(() => new Date());
  const [, setSyncVersion] = useState(0);
  const [tasbihState, setTasbihState] = useState<WidgetTasbihState>(() => loadWidgetTasbihState());
  const [quietState, setQuietState] = useState<QuietModeState>(() => loadQuietModeState());
  const [inspirationIdx, setInspirationIdx] = useState<number>(() => {
    const daySeed = new Date().getDate() + new Date().getHours();
    return daySeed % Math.max(1, PERIODIC_VERSES_AND_HADITHS.length);
  });

  useEffect(() => {
    setNow(new Date());
    const intervalMs = config.refreshInterval === '1m' ? 60_000 : 1000;
    const id = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(id);
  }, [config.refreshInterval, config.showLiveSeconds]);

  useEffect(() => {
    const bump = () => setSyncVersion((v) => v + 1);
    const syncTasbih = () => setTasbihState(loadWidgetTasbihState());
    const syncQuiet = () => setQuietState(loadQuietModeState());

    window.addEventListener('sunnah_rawatib_changed', bump);
    window.addEventListener('fasting_intent_changed', bump);
    window.addEventListener('mihrabWidgetSync', bump);
    window.addEventListener(WIDGET_TASBIH_EVENT, syncTasbih);
    window.addEventListener(QUIET_MODE_UPDATED_EVENT, syncQuiet);
    return () => {
      window.removeEventListener('sunnah_rawatib_changed', bump);
      window.removeEventListener('fasting_intent_changed', bump);
      window.removeEventListener('mihrabWidgetSync', bump);
      window.removeEventListener(WIDGET_TASBIH_EVENT, syncTasbih);
      window.removeEventListener(QUIET_MODE_UPDATED_EVENT, syncQuiet);
    };
  }, []);

  // Next prayer calculation
  const order: PrayerName[] = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
  const currentSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  let nextKey: PrayerName = 'fajr';
  let prevSeconds = parseMinutes(prayerTimes.isha) * 60 - 24 * 3600;
  let nextSeconds = 24 * 3600 + parseMinutes(prayerTimes.fajr) * 60;

  for (let i = 0; i < order.length; i++) {
    const k = order[i];
    const pSecs = parseMinutes(prayerTimes[k]) * 60;
    if (pSecs > currentSeconds) {
      nextKey = k;
      nextSeconds = pSecs;
      if (i > 0) {
        prevSeconds = parseMinutes(prayerTimes[order[i - 1]]) * 60;
      }
      break;
    }
  }

  const diffSeconds = Math.max(0, nextSeconds - currentSeconds);
  const totalWindowSeconds = Math.max(60, nextSeconds - prevSeconds);
  const elapsedPercent = Math.min(
    100,
    Math.max(4, Math.round(((totalWindowSeconds - diffSeconds) / totalWindowSeconds) * 100))
  );

  // Day progress (Fajr -> Isha)
  const fajrSecs = parseMinutes(prayerTimes.fajr) * 60;
  const ishaSecs = parseMinutes(prayerTimes.isha) * 60;
  const daySpan = Math.max(3600, ishaSecs - fajrSecs);
  const dayProgressPercent =
    currentSeconds <= fajrSecs
      ? 0
      : currentSeconds >= ishaSecs
      ? 100
      : Math.round(((currentSeconds - fajrSecs) / daySpan) * 100);

  const cdH = String(Math.floor(diffSeconds / 3600)).padStart(2, '0');
  const cdM = String(Math.floor((diffSeconds % 3600) / 60)).padStart(2, '0');
  const cdS = String(diffSeconds % 60).padStart(2, '0');
  const countdownText =
    config.showLiveSeconds && config.refreshInterval !== '1m'
      ? `${cdH}:${cdM}:${cdS}`
      : `${cdH}:${cdM}`;

  const isFriday = now.getDay() === 5;
  const getPrayerLabel = (k: PrayerName) =>
    k === 'dhuhr' && isFriday ? 'الجمعة' : PRAYER_META[k].nameAr;

  const nextPrayerName = getPrayerLabel(nextKey);
  const nextAdhanFormatted = format12HourShort(prayerTimes[nextKey]);
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
  const iqamaTimeFormatted =
    nextKey !== 'sunrise' ? addMinutes12HourShort(prayerTimes[nextKey], iqamaOffset) : null;

  // Progress & companions
  const sunnahState = loadSunnahRawatibState();
  const rawatibCompleted = countCompletedRawatibRakats(sunnahState);
  const rawatibPercent = Math.round((rawatibCompleted / RAWATIB_TOTAL_TARGET) * 100);
  const khatmaSchedule = getDailyWirdSchedule(loadKhatmaState());
  const overallDailyPercent = Math.round((rawatibPercent + khatmaSchedule.dailyPercent) / 2);

  const fastingInfo = evaluateFastingCalculator(prayerTimes.fajr, prayerTimes.maghrib, now, {
    whiteDaysEnabled: settings.fastingWhiteDaysEnabled,
    monThuEnabled: settings.fastingMonThuEnabled,
    ashuraArafahEnabled: settings.fastingAshuraArafahEnabled,
  });
  const hasFastingAlert =
    config.showFastingAlert && (fastingInfo.isUpcomingSeason || fastingInfo.isFastingIntent);

  const duhaSchedule = calculateDuhaSchedule(prayerTimes.sunrise, prayerTimes.dhuhr, now);
  const quietEval = evaluateQuietMode(quietState, now);
  const nightThirds = calculateNightThirds(
    prayerTimes.maghrib,
    prayerTimes.fajr,
    now,
    settings.lastThirdNightMode || 'astronomical',
    settings.lastThirdNightCustomTime || '03:00',
    settings.lastThirdBeforeFajrMinutes || 30
  );

  const currentInspiration =
    PERIODIC_VERSES_AND_HADITHS[
      inspirationIdx % Math.max(1, PERIODIC_VERSES_AND_HADITHS.length)
    ];

  const tokens = getThemeTokens(config.theme);
  const fScale = getFontScaleClasses(config.fontScale);
  const mosqueUrl = getWidgetMosqueImageUrl(config.mosqueBackgroundId);
  const mosqueOpacity = (config.mosqueBgOpacity ?? 35) / 100;
  const size: WidgetSizeId = config.size;

  const handleTapTasbih = () => {
    adhanPlayer.playChime();
    const fresh = loadWidgetTasbihState();
    const updated = saveWidgetTasbihState({
      ...fresh,
      count: fresh.count + 1,
    });
    setTasbihState(updated);
  };

  const handleCycleTasbihPhrase = () => {
    const fresh = loadWidgetTasbihState();
    const updated = saveWidgetTasbihState({
      ...fresh,
      phraseIndex: (fresh.phraseIndex + 1) % WIDGET_TASBIH_PHRASES.length,
    });
    setTasbihState(updated);
  };

  const handleResetTasbih = () => {
    const fresh = loadWidgetTasbihState();
    const updated = saveWidgetTasbihState({
      ...fresh,
      count: 0,
    });
    setTasbihState(updated);
  };

  const handleToggleQuietFromWidget = () => {
    adhanPlayer.playChime();
    const fresh = loadQuietModeState();
    const next = saveQuietModeState({
      ...fresh,
      manualActive: !quietEval.isQuietNow,
      pauseUntilMs: quietEval.isQuietNow ? null : fresh.pauseUntilMs,
      pauseLabelAr: quietEval.isQuietNow ? null : fresh.pauseLabelAr,
    });
    setQuietState(next);
  };

  const handleTriggerNav = (target: 'adhkar' | 'qibla') => {
    if (onNavigateShortcut) {
      onNavigateShortcut(target);
    } else if (typeof window !== 'undefined') {
      window.location.href = `/?tab=${target}`;
    }
  };

  const renderMosqueBackdrop = () => {
    if (!mosqueUrl) return null;
    return (
      <>
        <img
          src={mosqueUrl}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none transition-opacity duration-300"
          style={{ opacity: mosqueOpacity }}
        />
        <div className={`absolute inset-0 pointer-events-none ${tokens.scrim}`} aria-hidden="true" />
      </>
    );
  };

  const renderOptionalModules = (compact: boolean = false) => {
    const hasAnyModule =
      config.showDayProgressRings ||
      config.showDuhaSunrise ||
      config.showQuietAndLastThird ||
      config.showDailyInspiration ||
      config.showQuickActions;

    if (!hasAnyModule) return null;

    return (
      <div className={`relative z-10 space-y-2 pt-1.5 border-t ${tokens.borderMuted}`}>
        {/* Day Progress & Circular Completion Rings */}
        {config.showDayProgressRings && (
          <div className={`p-2 rounded-xl border ${tokens.subCard} space-y-1.5`}>
            <div className="flex items-center justify-between gap-2">
              <MiniRing
                percent={overallDailyPercent}
                label="إنجاز اليوم"
                valueText={`${toArabicDigits(rawatibCompleted)}/١٢ · ${toArabicDigits(
                  khatmaSchedule.dailyPercent
                )}%`}
                strokeColor={tokens.isLight ? '#0D7A56' : '#10B981'}
                tokens={tokens}
              />
              <div className="flex-1 space-y-1 min-w-0">
                <div className="flex items-center justify-between text-[9px] font-bold">
                  <span className={tokens.mutedText}>سير اليوم (فجر → عشاء)</span>
                  <span className={`font-mono tabular-nums ${tokens.accentGold}`}>
                    {toArabicDigits(dayProgressPercent)}%
                  </span>
                </div>
                <div className={`h-1.5 rounded-full ${tokens.trackBg} overflow-hidden`}>
                  <div
                    className="h-full bg-gradient-to-l from-[#10B981] to-[#D4AF37] transition-all duration-500"
                    style={{ width: `${dayProgressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sunrise & Duha Schedule Strip */}
        {config.showDuhaSunrise && (
          <div
            className={`px-2.5 py-1.5 rounded-xl border ${tokens.subCard} flex items-center justify-between gap-2 ${fScale.micro}`}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <Sun className={`w-3.5 h-3.5 shrink-0 ${tokens.accentGold}`} />
              <span className={`font-bold truncate ${tokens.primaryText}`}>
                الإشراق {formatTime12Ar(duhaSchedule.ishraqStartStr)} · نهاية الضحى{' '}
                {formatTime12Ar(duhaSchedule.duhaEndStr)}
              </span>
            </div>
            <span className={`font-bold shrink-0 ${tokens.accentEmerald}`}>
              {duhaSchedule.isDuhaActive ? 'الضحى متاحة' : duhaSchedule.statusLabelAr}
            </span>
          </div>
        )}

        {/* Quiet Mode & Last Third of Night Status */}
        {config.showQuietAndLastThird && (
          <div
            className={`px-2.5 py-1.5 rounded-xl border ${tokens.subCard} flex items-center justify-between gap-2 ${fScale.micro}`}
          >
            <span className="flex items-center gap-1 font-bold truncate">
              {quietEval.isQuietNow ? (
                <BellOff className={`w-3 h-3 shrink-0 ${tokens.accentEmerald}`} />
              ) : (
                <Bell className={`w-3 h-3 shrink-0 ${tokens.accentGold}`} />
              )}
              <span className={quietEval.isQuietNow ? tokens.accentEmerald : tokens.primaryText}>
                السكون: {quietEval.tileSubLabelAr}
              </span>
            </span>
            <span className={`font-bold tabular-nums shrink-0 ${tokens.accentGold}`}>
              {nightThirds.isLastThirdNow
                ? `الثلث الأخير الآن (${nightThirds.formattedRemainingToFajr})`
                : `الثلث الأخير ${format12HourShort(nightThirds.startTimeStr)}`}
            </span>
          </div>
        )}

        {/* Rotating Daily Ayah / Hadith / Wisdom */}
        {config.showDailyInspiration && currentInspiration && (
          <div className={`p-2 rounded-xl border ${tokens.subCard} space-y-1`}>
            <div className="flex items-start justify-between gap-2">
              <p
                className={`font-amiri leading-relaxed line-clamp-2 ${
                  compact ? 'text-[11px]' : 'text-xs'
                } ${tokens.primaryText}`}
              >
                {currentInspiration.text}
              </p>
              <button
                type="button"
                onClick={() =>
                  setInspirationIdx(
                    (prev) => (prev + 1) % Math.max(1, PERIODIC_VERSES_AND_HADITHS.length)
                  )
                }
                aria-label="عرض آية أو حديث آخر"
                className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${tokens.actionBg}`}
              >
                <RotateCw className="w-3 h-3" />
              </button>
            </div>
            <div className={`text-[9px] font-bold truncate ${tokens.accentGold}`}>
              {currentInspiration.source}
            </div>
          </div>
        )}

        {/* Interactive Quick Action Buttons */}
        {config.showQuickActions && (
          <div className="grid grid-cols-4 gap-1.5">
            <button
              type="button"
              onClick={handleTapTasbih}
              className={`min-h-[34px] px-1.5 py-1 rounded-xl border text-[10px] font-bold flex items-center justify-center gap-1 transition-all active:scale-95 ${tokens.actionBg}`}
              title="تسبيح سريع (+1)"
            >
              <Sparkles className="w-3 h-3 shrink-0" />
              <span className="tabular-nums truncate">سبحة ({toArabicDigits(tasbihState.count)})</span>
            </button>
            <button
              type="button"
              onClick={() => handleTriggerNav('adhkar')}
              className={`min-h-[34px] px-1.5 py-1 rounded-xl border text-[10px] font-bold flex items-center justify-center gap-1 transition-all active:scale-95 ${tokens.actionBg}`}
            >
              <BookOpen className="w-3 h-3 shrink-0" />
              <span>الأذكار</span>
            </button>
            <button
              type="button"
              onClick={() => handleTriggerNav('qibla')}
              className={`min-h-[34px] px-1.5 py-1 rounded-xl border text-[10px] font-bold flex items-center justify-center gap-1 transition-all active:scale-95 ${tokens.actionBg}`}
            >
              <Compass className="w-3 h-3 shrink-0" />
              <span>القبلة</span>
            </button>
            <button
              type="button"
              onClick={handleToggleQuietFromWidget}
              className={`min-h-[34px] px-1.5 py-1 rounded-xl border text-[10px] font-bold flex items-center justify-center gap-1 transition-all active:scale-95 ${
                quietEval.isQuietNow
                  ? 'bg-[#0C3325] border-[#34D399] text-[#34D399]'
                  : tokens.actionBg
              }`}
            >
              <Moon className="w-3 h-3 shrink-0" />
              <span>{quietEval.isQuietNow ? 'السكون ✓' : 'السكون'}</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  // 1. LOCK SCREEN PILL (ودجت شاشة القفل المصغّر)
  if (size === 'lock_pill') {
    return (
      <div
        dir="rtl"
        className={`relative overflow-hidden w-full rounded-full px-3.5 py-2 transition-all duration-300 ${tokens.surface}`}
      >
        {renderMosqueBackdrop()}
        <div className="relative z-10 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className={`w-7 h-7 rounded-full border flex items-center justify-center shrink-0 ${tokens.subCard}`}
            >
              {PRAYER_META[nextKey].icon(`w-3.5 h-3.5 ${tokens.accentGold}`)}
            </div>
            <span className={`text-xs sm:text-sm font-bold font-amiri truncate ${tokens.accentGold}`}>
              {nextPrayerName}
            </span>
            <span className="opacity-50 text-xs" aria-hidden="true">
              ·
            </span>
            <span className={`font-mono font-black text-xs sm:text-sm tabular-nums shrink-0 ${tokens.accentEmerald}`}>
              {countdownText}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {config.showQuietAndLastThird && quietEval.isQuietNow && (
              <Moon className={`w-3 h-3 ${tokens.accentEmerald}`} />
            )}
            <span className={`text-[10px] font-mono tabular-nums ${tokens.mutedText}`}>
              {nextAdhanFormatted}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // 2. 4×2 SPIRITUAL DHIKR, TASBIH & WIRD CARD (بطاقة الأذكار والتسبيح والوِرد اليومي)
  if (size === 'spiritual_card') {
    const activePhrase = WIDGET_TASBIH_PHRASES[tasbihState.phraseIndex] || WIDGET_TASBIH_PHRASES[0];
    return (
      <div
        dir="rtl"
        className={`w-full rounded-3xl ${compactScale ? 'p-3' : 'p-4'} transition-all duration-300 space-y-2.5 relative overflow-hidden ${tokens.surface}`}
      >
        {renderMosqueBackdrop()}
        <div
          className={`absolute inset-1.5 rounded-[20px] border pointer-events-none ${tokens.innerFrame}`}
        />

        {/* Header Strip: City + Hijri Date + Next Prayer */}
        <div className="relative z-10 flex items-center justify-between gap-2 text-[10px]">
          <span className={`font-bold font-amiri flex items-center gap-1 truncate ${tokens.accentGold}`}>
            <Sparkles className={`w-3 h-3 shrink-0 ${tokens.accentEmerald}`} />
            <span>{nextPrayerName}</span>
            <span className="font-mono tabular-nums">({countdownText})</span>
          </span>
          {config.showHijriDate && (
            <span className={`font-amiri truncate ${tokens.mutedText}`}>{prayerTimes.hijriDate}</span>
          )}
        </div>

        {/* Interactive Live Tasbih Box */}
        <div className={`relative z-10 p-3 rounded-2xl border ${tokens.subCard} flex items-center justify-between gap-2.5`}>
          <div className="min-w-0 flex-1 space-y-1">
            <button
              type="button"
              onClick={handleCycleTasbihPhrase}
              className={`text-right font-amiri font-bold ${fScale.title} leading-snug truncate max-w-full block ${tokens.primaryText} hover:opacity-80`}
              title="اضغط لتبديل صيغة الذكر"
            >
              {activePhrase}
            </button>
            <div className="flex items-center gap-2 text-[10px]">
              <span className={`font-mono font-black tabular-nums ${tokens.accentEmerald}`}>
                {toArabicDigits(tasbihState.count)} تسبيحة اليوم
              </span>
              {tasbihState.count > 0 && (
                <button
                  type="button"
                  onClick={handleResetTasbih}
                  className={`inline-flex items-center gap-0.5 ${tokens.mutedText} hover:opacity-100`}
                  title="تصفير العداد"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>تصفير</span>
                </button>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleTapTasbih}
            className="min-w-[54px] min-h-[54px] rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#B8962E] text-slate-950 font-black text-base shadow-lg active:scale-95 transition-transform flex flex-col items-center justify-center shrink-0"
          >
            <span className="tabular-nums leading-none">+١</span>
            <span className="text-[8px] font-bold mt-0.5">سبّح</span>
          </button>
        </div>

        {/* Circular Completion Rings (Wird & Sunnah Rawatib) */}
        {config.showSunnahWird && (
          <div className={`relative z-10 grid grid-cols-2 gap-2 p-2.5 rounded-2xl border ${tokens.subCard}`}>
            <MiniRing
              percent={khatmaSchedule.dailyPercent}
              label="الوِرد اليومي"
              valueText={`${toArabicDigits(khatmaSchedule.pagesCompletedToday)}/${toArabicDigits(
                khatmaSchedule.dailyTargetPages
              )} ص`}
              strokeColor={tokens.isLight ? '#0D7A56' : '#10B981'}
              tokens={tokens}
            />
            <MiniRing
              percent={rawatibPercent}
              label="السنن الرواتب"
              valueText={`${toArabicDigits(rawatibCompleted)}/${toArabicDigits(
                RAWATIB_TOTAL_TARGET
              )} ركعة`}
              strokeColor="#D4AF37"
              tokens={tokens}
            />
          </div>
        )}

        {hasFastingAlert && (
          <div
            className={`relative z-10 flex items-center justify-between gap-2 px-2.5 py-1 rounded-xl border ${tokens.subCard} text-[9px] font-bold ${tokens.accentGold}`}
          >
            <span className="truncate">🌙 {fastingInfo.occasionTitle}</span>
            <span className={`font-mono tabular-nums shrink-0 ${tokens.accentEmerald}`}>
              السحور {fastingInfo.suhoorTimeStr}
            </span>
          </div>
        )}

        {renderOptionalModules(compactScale)}
      </div>
    );
  }

  // 3. 2×2 MIHRAB ARCH (ودجت المحراب المتوسط)
  if (size === 'medium') {
    return (
      <div
        dir="rtl"
        className={`w-full rounded-t-[54px] rounded-b-3xl ${
          compactScale ? 'px-3.5 pt-4 pb-3.5' : 'px-4 pt-5 pb-4'
        } transition-all duration-300 space-y-2.5 relative overflow-hidden ${tokens.surface}`}
      >
        {renderMosqueBackdrop()}
        <div
          className={`absolute inset-1.5 rounded-t-[48px] rounded-b-[20px] border pointer-events-none ${tokens.innerFrame}`}
        />

        {/* Arch Crown Accent */}
        <div className="relative z-10 flex flex-col items-center text-center space-y-1">
          <div className={`flex items-center gap-1.5 text-[10px] font-bold ${tokens.accentGold}`}>
            <MapPin className="w-2.5 h-2.5" />
            <span>{currentLocation.nameAr}</span>
          </div>

          <div
            className={`w-9 h-9 rounded-t-full rounded-b-xl border flex items-center justify-center shadow-inner ${tokens.subCard}`}
          >
            {PRAYER_META[nextKey].icon(`w-4 h-4 ${tokens.accentGold}`)}
          </div>

          <div className={`${fScale.title} font-bold font-amiri leading-tight ${tokens.primaryText}`}>
            {nextPrayerName}
          </div>

          <div className={`flex items-center justify-center gap-2 ${fScale.body}`}>
            <span className={`font-mono font-bold tabular-nums ${tokens.accentGold}`}>
              {nextAdhanFormatted}
            </span>
            {iqamaTimeFormatted && (
              <>
                <span className="opacity-40">·</span>
                <span className={`font-mono tabular-nums ${tokens.accentEmerald}`}>
                  إقامة {iqamaTimeFormatted}
                </span>
              </>
            )}
          </div>

          <div
            className={`${fScale.countdown} font-mono font-black tabular-nums tracking-tight pt-0.5 ${tokens.accentEmerald}`}
          >
            {countdownText}
          </div>
        </div>

        {/* Thin Remaining Time Progress Bar */}
        <div className={`relative z-10 w-full h-1.5 rounded-full ${tokens.trackBg} overflow-hidden border ${tokens.borderMuted}`}>
          <div
            className="h-full bg-gradient-to-l from-[#10B981] to-[#D4AF37] transition-all duration-500"
            style={{ width: `${elapsedPercent}%` }}
          />
        </div>

        {(config.showHijriDate || config.showSunnahWird || hasFastingAlert) && (
          <div className={`relative z-10 space-y-1 pt-1 border-t ${tokens.borderMuted} ${fScale.micro}`}>
            {(config.showHijriDate || config.showSunnahWird) && (
              <div className="flex flex-wrap items-center justify-between gap-1">
                {config.showHijriDate ? (
                  <span className={`font-amiri truncate ${tokens.mutedText}`}>
                    {prayerTimes.hijriDate}
                  </span>
                ) : (
                  <span />
                )}

                {config.showSunnahWird && (
                  <span className={`font-bold shrink-0 tabular-nums ${tokens.accentEmerald}`}>
                    الرواتب {toArabicDigits(rawatibCompleted)}/{toArabicDigits(RAWATIB_TOTAL_TARGET)} · الوِرد{' '}
                    {toArabicDigits(khatmaSchedule.dailyPercent)}%
                  </span>
                )}
              </div>
            )}

            {hasFastingAlert && (
              <div
                className={`flex items-center justify-center gap-1 rounded-lg border px-2 py-1 text-[9px] font-bold truncate ${tokens.subCard} ${tokens.accentGold}`}
              >
                <span>🌙</span>
                <span className="truncate">
                  {fastingInfo.isFastingIntent
                    ? `صائم اليوم (${fastingInfo.occasionTitle})`
                    : fastingInfo.occasionTitle}
                </span>
              </div>
            )}
          </div>
        )}

        {renderOptionalModules(true)}
      </div>
    );
  }

  // 4. 4×2 FULL PRAYER & TRACKER (ودجت الجدول الكامل)
  const dailyRows: PrayerName[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
  return (
    <div
      dir="rtl"
      className={`w-full rounded-3xl ${compactScale ? 'p-3' : 'p-4'} transition-all duration-300 space-y-2.5 relative overflow-hidden ${tokens.surface}`}
    >
      {renderMosqueBackdrop()}
      <div
        className={`absolute inset-1.5 rounded-[20px] border pointer-events-none ${tokens.innerFrame}`}
      />

      {/* Top Meta Line */}
      <div className="relative z-10 flex items-center justify-between gap-2 px-0.5 text-[10px]">
        <span className={`font-bold font-amiri flex items-center gap-1 truncate ${tokens.accentGold}`}>
          <Clock className={`w-3 h-3 shrink-0 ${tokens.accentEmerald}`} />
          <span>محراب {currentLocation.nameAr}</span>
        </span>
        {config.showHijriDate && (
          <span className={`font-amiri truncate ${tokens.mutedText}`}>{prayerTimes.hijriDate}</span>
        )}
      </div>

      {/* Split Body: Right = Mini Mihrab Arch Card | Left = 5 Daily Prayers Table */}
      <div className="relative z-10 grid grid-cols-12 gap-2 items-stretch">
        {/* Right Side (5 cols): Mini Mihrab Arch for Next Prayer & Countdown */}
        <div
          className={`col-span-5 rounded-t-[36px] rounded-b-2xl border p-2.5 flex flex-col items-center justify-between text-center ${tokens.subCard}`}
        >
          <div className={`text-[9px] font-bold ${tokens.accentGold}`}>الصلاة القادمة</div>

          <div
            className={`w-7 h-7 rounded-t-full rounded-b-lg border flex items-center justify-center my-0.5 ${tokens.subCard}`}
          >
            {PRAYER_META[nextKey].icon(`w-3.5 h-3.5 ${tokens.accentGold}`)}
          </div>

          <div className={`text-sm font-bold font-amiri leading-tight ${tokens.primaryText}`}>
            {nextPrayerName}
          </div>

          <div className={`text-[10px] font-mono font-bold tabular-nums ${tokens.accentGold}`}>
            {nextAdhanFormatted}
          </div>

          <div className={`text-sm font-mono font-black tabular-nums leading-tight ${tokens.accentEmerald}`}>
            {countdownText}
          </div>

          <div className={`w-full h-1 rounded-full ${tokens.trackBg} overflow-hidden border ${tokens.borderMuted} mt-1`}>
            <div
              className="h-full bg-gradient-to-l from-[#10B981] to-[#D4AF37]"
              style={{ width: `${elapsedPercent}%` }}
            />
          </div>
        </div>

        {/* Left Side (7 cols): 5 Daily Prayers Schedule */}
        <div className="col-span-7 flex flex-col justify-between gap-1">
          {dailyRows.map((pKey) => {
            const isNext = nextKey === pKey;
            return (
              <div
                key={pKey}
                className={`flex items-center justify-between px-2.5 py-1 rounded-xl border text-[10px] transition-all ${
                  isNext
                    ? tokens.isLight
                      ? 'bg-[#C49A3A]/20 border-[#C49A3A] text-[#0F3D2E] font-bold'
                      : 'bg-[#D4AF37]/15 border-[#D4AF37] text-[#F3CA63] font-bold shadow-[0_0_10px_rgba(212,175,55,0.18)]'
                    : `${tokens.subCard} ${tokens.primaryText}`
                }`}
              >
                <span className="flex items-center gap-1.5 truncate">
                  {PRAYER_META[pKey].icon(
                    `w-3 h-3 shrink-0 ${isNext ? tokens.accentGold : tokens.accentEmerald}`
                  )}
                  <span className="font-amiri">{getPrayerLabel(pKey)}</span>
                </span>
                <span
                  className={`font-mono tabular-nums ${
                    isNext ? `${tokens.accentGold} font-black` : tokens.mutedText
                  }`}
                >
                  {format12HourShort(prayerTimes[pKey])}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Status Bar: Today's Wird & Sunnah Rawatib + Optional Fasting Alert */}
      {(config.showSunnahWird || hasFastingAlert) && (
        <div className={`relative z-10 space-y-1.5 pt-1 border-t ${tokens.borderMuted}`}>
          {config.showSunnahWird && (
            <div className="grid grid-cols-2 gap-1.5">
              <div className={`px-2 py-1.5 rounded-xl border space-y-1 ${tokens.subCard}`}>
                <div className="flex items-center justify-between text-[9px] font-bold">
                  <span className={`flex items-center gap-1 ${tokens.accentGold}`}>
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>الرواتب</span>
                  </span>
                  <span className={`tabular-nums ${tokens.accentEmerald}`}>
                    {toArabicDigits(rawatibCompleted)}/{toArabicDigits(RAWATIB_TOTAL_TARGET)}
                  </span>
                </div>
                <div className={`h-1 rounded-full ${tokens.trackBg} overflow-hidden`}>
                  <div
                    className="h-full bg-[#D4AF37] transition-all"
                    style={{ width: `${rawatibPercent}%` }}
                  />
                </div>
              </div>

              <div className={`px-2 py-1.5 rounded-xl border space-y-1 ${tokens.subCard}`}>
                <div className="flex items-center justify-between text-[9px] font-bold">
                  <span className={`flex items-center gap-1 ${tokens.accentEmerald}`}>
                    <BookOpen className="w-2.5 h-2.5" />
                    <span>الوِرد</span>
                  </span>
                  <span className={`tabular-nums ${tokens.accentGold}`}>
                    {toArabicDigits(khatmaSchedule.pagesCompletedToday)}/
                    {toArabicDigits(khatmaSchedule.dailyTargetPages)} ص
                  </span>
                </div>
                <div className={`h-1 rounded-full ${tokens.trackBg} overflow-hidden`}>
                  <div
                    className="h-full bg-[#10B981] transition-all"
                    style={{ width: `${khatmaSchedule.dailyPercent}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {hasFastingAlert && (
            <div
              className={`flex items-center justify-between gap-2 px-2.5 py-1 rounded-xl border text-[9px] font-bold ${tokens.subCard} ${tokens.accentGold}`}
            >
              <span className="truncate">🌙 {fastingInfo.occasionTitle}</span>
              <span className={`font-mono tabular-nums shrink-0 ${tokens.accentEmerald}`}>
                السحور {fastingInfo.suhoorTimeStr}
              </span>
            </div>
          )}
        </div>
      )}

      {renderOptionalModules(compactScale)}
    </div>
  );
};
