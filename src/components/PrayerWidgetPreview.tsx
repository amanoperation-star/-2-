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
} from 'lucide-react';
import { CityLocation, PrayerName, PrayerTimeData, UserSettings } from '../types';
import {
  WidgetSizeId,
  WidgetStudioConfig,
  WidgetThemeId,
} from '../utils/widgetStudioData';
import {
  RAWATIB_TOTAL_TARGET,
  countCompletedRawatibRakats,
  loadSunnahRawatibState,
} from '../utils/sunnahRawatibData';
import { getDailyWirdSchedule, loadKhatmaState, toArabicDigits } from '../utils/khatmaData';
import { evaluateFastingCalculator } from '../utils/fastingCalculator';

interface PrayerWidgetPreviewProps {
  config: WidgetStudioConfig;
  prayerTimes: PrayerTimeData;
  currentLocation: CityLocation;
  settings: UserSettings;
  compactScale?: boolean;
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

function getThemeSurfaceClasses(theme: WidgetThemeId): string {
  if (theme === 'glass') {
    return 'bg-[#111C18]/50 backdrop-blur-xl border border-white/25 shadow-[0_12px_32px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.2)]';
  }
  if (theme === 'oled') {
    return 'bg-[#050807] border border-[#D4AF37]/60 shadow-[0_12px_32px_rgba(0,0,0,0.85)]';
  }
  return 'bg-[#111C18] border border-[#D4AF37]/50 shadow-[0_12px_32px_rgba(0,0,0,0.6),0_0_24px_rgba(212,175,55,0.08)]';
}

export const PrayerWidgetPreview: React.FC<PrayerWidgetPreviewProps> = ({
  config,
  prayerTimes,
  currentLocation,
  settings,
  compactScale = false,
}) => {
  const [now, setNow] = useState<Date>(() => new Date());
  const [, setSyncVersion] = useState(0);

  useEffect(() => {
    setNow(new Date());
    const intervalMs = config.refreshInterval === '1m' ? 60_000 : 1000;
    const id = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(id);
  }, [config.refreshInterval, config.showLiveSeconds]);

  useEffect(() => {
    const bump = () => setSyncVersion((v) => v + 1);
    window.addEventListener('sunnah_rawatib_changed', bump);
    window.addEventListener('fasting_intent_changed', bump);
    window.addEventListener('mihrabWidgetSync', bump);
    return () => {
      window.removeEventListener('sunnah_rawatib_changed', bump);
      window.removeEventListener('fasting_intent_changed', bump);
      window.removeEventListener('mihrabWidgetSync', bump);
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

  // Sunnah Rawatib & Khatma Wird live progress
  const sunnahState = loadSunnahRawatibState();
  const rawatibCompleted = countCompletedRawatibRakats(sunnahState);
  const rawatibPercent = Math.round((rawatibCompleted / RAWATIB_TOTAL_TARGET) * 100);
  const khatmaSchedule = getDailyWirdSchedule(loadKhatmaState());

  // Fasting & White Days alert
  const fastingInfo = evaluateFastingCalculator(prayerTimes.fajr, prayerTimes.maghrib, now, {
    whiteDaysEnabled: settings.fastingWhiteDaysEnabled,
    monThuEnabled: settings.fastingMonThuEnabled,
    ashuraArafahEnabled: settings.fastingAshuraArafahEnabled,
  });
  const hasFastingAlert =
    config.showFastingAlert && (fastingInfo.isUpcomingSeason || fastingInfo.isFastingIntent);

  const surfaceCls = getThemeSurfaceClasses(config.theme);
  const size: WidgetSizeId = config.size;

  // 1. LOCK SCREEN PILL (ودجت شاشة القفل المصغّر)
  // Sleek horizontal capsule displaying only next prayer icon, name, and live countdown
  if (size === 'lock_pill') {
    return (
      <div
        dir="rtl"
        className={`w-full rounded-full px-3.5 py-2 transition-all duration-300 ${surfaceCls}`}
      >
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-[#071410]/90 border border-[#D4AF37]/55 flex items-center justify-center shrink-0">
              {PRAYER_META[nextKey].icon('w-3.5 h-3.5 text-[#D4AF37]')}
            </div>
            <span className="text-xs sm:text-sm font-bold font-amiri text-[#F3CA63] truncate">
              {nextPrayerName}
            </span>
            <span className="text-[#D4AF37]/60 text-xs" aria-hidden="true">
              •
            </span>
            <span className="font-mono font-black text-xs sm:text-sm text-[#10B981] tabular-nums shrink-0">
              {countdownText}
            </span>
          </div>

          <span className="text-[10px] font-mono text-slate-300 tabular-nums shrink-0">
            {nextAdhanFormatted}
          </span>
        </div>
      </div>
    );
  }

  // 2. 2×2 MIHRAB ARCH (ودجت المحراب المتوسط)
  // Arched mini-mihrab silhouette with next prayer, adhan time, countdown, and thin progress bar
  if (size === 'medium') {
    return (
      <div
        dir="rtl"
        className={`w-full rounded-t-[54px] rounded-b-3xl ${compactScale ? 'px-3.5 pt-4 pb-3.5' : 'px-4 pt-5 pb-4'} transition-all duration-300 space-y-2.5 relative overflow-hidden ${surfaceCls}`}
      >
        {/* Inner Golden Mihrab Arch Silhouette */}
        <div className="absolute inset-1.5 rounded-t-[48px] rounded-b-[20px] border border-[#D4AF37]/25 pointer-events-none" />

        {/* Arch Crown Accent */}
        <div className="relative z-10 flex flex-col items-center text-center space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#D4AF37]">
            <MapPin className="w-2.5 h-2.5" />
            <span>{currentLocation.nameAr}</span>
          </div>

          <div className="w-9 h-9 rounded-t-full rounded-b-xl bg-[#071410]/90 border border-[#D4AF37]/50 flex items-center justify-center shadow-inner">
            {PRAYER_META[nextKey].icon('w-4 h-4 text-[#F3CA63]')}
          </div>

          <div className="text-lg font-bold font-amiri text-white leading-tight">
            {nextPrayerName}
          </div>

          <div className="flex items-center justify-center gap-2 text-[11px]">
            <span className="font-mono font-bold text-[#F3CA63] tabular-nums">
              {nextAdhanFormatted}
            </span>
            {iqamaTimeFormatted && (
              <>
                <span className="text-[#D4AF37]/40">·</span>
                <span className="text-emerald-300 font-mono tabular-nums">
                  إقامة {iqamaTimeFormatted}
                </span>
              </>
            )}
          </div>

          <div className="text-2xl font-mono font-black text-[#10B981] tabular-nums tracking-tight pt-0.5">
            {countdownText}
          </div>
        </div>

        {/* Thin Remaining Time Progress Bar */}
        <div className="relative z-10 w-full h-1.5 rounded-full bg-black/50 overflow-hidden border border-[#D4AF37]/25">
          <div
            className="h-full bg-gradient-to-l from-[#10B981] to-[#D4AF37] transition-all duration-500"
            style={{ width: `${elapsedPercent}%` }}
          />
        </div>

        {(config.showHijriDate || config.showSunnahWird || hasFastingAlert) && (
          <div className="relative z-10 space-y-1 pt-1 border-t border-[#D4AF37]/20 text-[10px]">
            {(config.showHijriDate || config.showSunnahWird) && (
              <div className="flex flex-wrap items-center justify-between gap-1">
                {config.showHijriDate ? (
                  <span className="text-amber-100/90 font-amiri truncate">
                    {prayerTimes.hijriDate}
                  </span>
                ) : (
                  <span />
                )}

                {config.showSunnahWird && (
                  <span className="text-emerald-300 font-bold shrink-0 tabular-nums">
                    الرواتب {toArabicDigits(rawatibCompleted)}/{toArabicDigits(RAWATIB_TOTAL_TARGET)} · الوِرد{' '}
                    {toArabicDigits(khatmaSchedule.dailyPercent)}%
                  </span>
                )}
              </div>
            )}

            {hasFastingAlert && (
              <div className="flex items-center justify-center gap-1 rounded-lg bg-[#071410]/85 border border-[#D4AF37]/30 px-2 py-1 text-[9px] font-bold text-[#F3CA63] truncate">
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
      </div>
    );
  }

  // 3. 4×2 FULL PRAYER & TRACKER (ودجت الجدول الكامل)
  // Two sides: Right side mini Mihrab card for next prayer & countdown;
  // Left side 5-prayer daily schedule highlighting next prayer in gold;
  // Bottom bar showing today's Wird & Sunnah Rawatib status (and optional fasting alert).
  const dailyRows: PrayerName[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
  return (
    <div
      dir="rtl"
      className={`w-full rounded-3xl ${compactScale ? 'p-3' : 'p-4'} transition-all duration-300 space-y-2.5 relative overflow-hidden ${surfaceCls}`}
    >
      {/* Subtle Golden Inner Frame */}
      <div className="absolute inset-1.5 rounded-[20px] border border-[#D4AF37]/20 pointer-events-none" />

      {/* Top Meta Line */}
      <div className="relative z-10 flex items-center justify-between gap-2 px-0.5 text-[10px]">
        <span className="font-bold font-amiri text-[#F3CA63] flex items-center gap-1 truncate">
          <Clock className="w-3 h-3 text-[#10B981] shrink-0" />
          <span>محراب {currentLocation.nameAr}</span>
        </span>
        {config.showHijriDate && (
          <span className="font-amiri text-amber-100/90 truncate">{prayerTimes.hijriDate}</span>
        )}
      </div>

      {/* Split Body: Right = Mini Mihrab Arch Card | Left = 5 Daily Prayers Table */}
      <div className="relative z-10 grid grid-cols-12 gap-2 items-stretch">
        {/* Right Side (5 cols): Mini Mihrab Arch for Next Prayer & Countdown */}
        <div className="col-span-5 rounded-t-[36px] rounded-b-2xl bg-black/35 border border-[#D4AF37]/40 p-2.5 flex flex-col items-center justify-between text-center">
          <div className="text-[9px] font-bold text-[#D4AF37]">الصلاة القادمة</div>

          <div className="w-7 h-7 rounded-t-full rounded-b-lg bg-[#071410] border border-[#D4AF37]/50 flex items-center justify-center my-0.5">
            {PRAYER_META[nextKey].icon('w-3.5 h-3.5 text-[#F3CA63]')}
          </div>

          <div className="text-sm font-bold font-amiri text-white leading-tight">
            {nextPrayerName}
          </div>

          <div className="text-[10px] font-mono font-bold text-[#F3CA63] tabular-nums">
            {nextAdhanFormatted}
          </div>

          <div className="text-sm font-mono font-black text-[#10B981] tabular-nums leading-tight">
            {countdownText}
          </div>

          <div className="w-full h-1 rounded-full bg-black/55 overflow-hidden border border-[#D4AF37]/20 mt-1">
            <div
              className="h-full bg-gradient-to-l from-[#10B981] to-[#D4AF37]"
              style={{ width: `${elapsedPercent}%` }}
            />
          </div>
        </div>

        {/* Left Side (7 cols): 5 Daily Prayers Schedule with Gold Highlight */}
        <div className="col-span-7 flex flex-col justify-between gap-1">
          {dailyRows.map((pKey) => {
            const isNext = nextKey === pKey;
            return (
              <div
                key={pKey}
                className={`flex items-center justify-between px-2.5 py-1 rounded-xl border text-[10px] transition-all ${
                  isNext
                    ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-[#F3CA63] font-bold shadow-[0_0_10px_rgba(212,175,55,0.18)]'
                    : 'bg-black/25 border-[#D4AF37]/15 text-slate-200'
                }`}
              >
                <span className="flex items-center gap-1.5 truncate">
                  {PRAYER_META[pKey].icon(
                    `w-3 h-3 shrink-0 ${isNext ? 'text-[#F3CA63]' : 'text-emerald-300/80'}`
                  )}
                  <span className="font-amiri">{getPrayerLabel(pKey)}</span>
                </span>
                <span
                  className={`font-mono tabular-nums ${
                    isNext ? 'text-[#F3CA63] font-black' : 'text-slate-300'
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
        <div className="relative z-10 space-y-1.5 pt-1 border-t border-[#D4AF37]/20">
          {config.showSunnahWird && (
            <div className="grid grid-cols-2 gap-1.5">
              <div className="px-2 py-1.5 rounded-xl bg-black/30 border border-[#D4AF37]/25 space-y-1">
                <div className="flex items-center justify-between text-[9px] font-bold">
                  <span className="text-[#F3CA63] flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>الرواتب</span>
                  </span>
                  <span className="text-emerald-300 tabular-nums">
                    {toArabicDigits(rawatibCompleted)}/{toArabicDigits(RAWATIB_TOTAL_TARGET)}
                  </span>
                </div>
                <div className="h-1 rounded-full bg-black/50 overflow-hidden">
                  <div
                    className="h-full bg-[#D4AF37] transition-all"
                    style={{ width: `${rawatibPercent}%` }}
                  />
                </div>
              </div>

              <div className="px-2 py-1.5 rounded-xl bg-black/30 border border-[#10B981]/30 space-y-1">
                <div className="flex items-center justify-between text-[9px] font-bold">
                  <span className="text-emerald-300 flex items-center gap-1">
                    <BookOpen className="w-2.5 h-2.5" />
                    <span>الوِرد</span>
                  </span>
                  <span className="text-[#F3CA63] tabular-nums">
                    {toArabicDigits(khatmaSchedule.pagesCompletedToday)}/
                    {toArabicDigits(khatmaSchedule.dailyTargetPages)} ص
                  </span>
                </div>
                <div className="h-1 rounded-full bg-black/50 overflow-hidden">
                  <div
                    className="h-full bg-[#10B981] transition-all"
                    style={{ width: `${khatmaSchedule.dailyPercent}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {hasFastingAlert && (
            <div className="flex items-center justify-between gap-2 px-2.5 py-1 rounded-xl bg-[#071c16] border border-[#D4AF37]/35 text-[9px] font-bold text-[#F3CA63]">
              <span className="truncate">🌙 {fastingInfo.occasionTitle}</span>
              <span className="text-emerald-300 font-mono tabular-nums shrink-0">
                السحور {fastingInfo.suhoorTimeStr}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
