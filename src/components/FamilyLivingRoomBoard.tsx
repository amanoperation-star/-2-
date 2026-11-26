import React, { useEffect, useState } from 'react';
import { X, Users, Star, Check, Tv, BellRing } from 'lucide-react';
import { CityLocation, PrayerTimeData } from '../types';
import {
  FAMILY_PRAYER_LABELS,
  FAMILY_PRAYER_ORDER,
  FAMILY_ROLE_LABELS,
  FamilyHomeState,
  FamilyPrayerKey,
  getFamilyWeeklySummary,
  getMemberDayLog,
  getMemberDayStats,
  getNextHomeJamaahAlert,
  getTodayFamilyDateKey,
} from '../utils/familyHomeData';
import { backgroundService } from '../utils/backgroundService';

interface FamilyLivingRoomBoardProps {
  isOpen: boolean;
  onClose: () => void;
  familyState: FamilyHomeState;
  prayerTimes: PrayerTimeData;
  currentLocation: CityLocation;
  onCycleMemberPrayer: (memberId: string, prayerKey: FamilyPrayerKey) => void;
}

export const FamilyLivingRoomBoard: React.FC<FamilyLivingRoomBoardProps> = ({
  isOpen,
  onClose,
  familyState,
  prayerTimes,
  currentLocation,
  onCycleMemberPrayer,
}) => {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    if (!isOpen) return;
    void backgroundService.requestWakeLock();
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => {
      clearInterval(timer);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const todayKey = getTodayFamilyDateKey(now);
  const isFriday = now.getDay() === 5;
  const summary = getFamilyWeeklySummary(familyState, now);
  const jamaahAlert = getNextHomeJamaahAlert(
    prayerTimes,
    familyState.jamaahAlertMinutesBefore,
    now
  );

  const getPrayerLabel = (pk: FamilyPrayerKey) =>
    pk === 'dhuhr' && isFriday ? 'الجمعة' : FAMILY_PRAYER_LABELS[pk];

  const prayerStrip: Array<{ key: FamilyPrayerKey; label: string; time: string }> = [
    { key: 'fajr', label: 'الفجر', time: prayerTimes.fajr },
    { key: 'dhuhr', label: isFriday ? 'الجمعة' : 'الظهر', time: prayerTimes.dhuhr },
    { key: 'asr', label: 'العصر', time: prayerTimes.asr },
    { key: 'maghrib', label: 'المغرب', time: prayerTimes.maghrib },
    { key: 'isha', label: 'العشاء', time: prayerTimes.isha },
  ];

  const formatCountdown = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0) return `${h} س ${m} د`;
    return `${m} دقيقة`;
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="شاشة غرفة المعيشة للبيت المسلم"
      dir="rtl"
      className="fixed inset-0 z-[72] bg-[#020d0a] text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8 overflow-y-auto"
    >
      {/* Top Living-Room Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e5b869]/25 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#062d24] border border-[#e5b869]/50 flex items-center justify-center text-[#fbbf24]">
            <Tv className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold font-amiri text-[#fbbf24]">
              {familyState.customFamilyTitle || 'بيتنا المسلم'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 tabular-nums">
              <span>{currentLocation.nameAr}</span>
              <span> · </span>
              <span>{prayerTimes.hijriDate}</span>
              <span> · </span>
              <span>{prayerTimes.dateString}</span>
            </p>
          </div>
        </div>

        {/* Live Clock + Close */}
        <div className="flex items-center gap-4">
          <div className="text-left sm:text-right">
            <div className="text-3xl sm:text-5xl font-black font-mono text-white tabular-nums tracking-wider">
              {now.toLocaleTimeString('en-GB', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
              })}
            </div>
            <p className="text-xs sm:text-sm text-emerald-300 font-semibold tabular-nums">
              القادمة: {jamaahAlert.prayerNameAr} ({jamaahAlert.prayerTimeStr}) · بعد{' '}
              {formatCountdown(jamaahAlert.minutesUntil)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق شاشة غرفة المعيشة"
            className="min-h-[48px] px-4 py-2 rounded-xl bg-[#06261f] border border-[#e5b869]/40 text-slate-100 hover:text-[#fbbf24] text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap shrink-0"
          >
            <X className="w-5 h-5" />
            <span>خروج</span>
          </button>
        </div>
      </div>

      {/* Live Home Jama'ah Alert Banner (when approaching prayer) */}
      {familyState.jamaahAlertEnabled && jamaahAlert.isWithinWindow && (
        <div className="my-4 p-4 rounded-2xl bg-gradient-to-r from-[#0a3628] via-[#062d24] to-[#0a3628] border-2 border-[#fbbf24] flex items-center justify-between flex-wrap gap-3 shadow-[0_0_25px_rgba(251,191,36,0.2)]">
          <div className="flex items-center gap-3">
            <BellRing className="w-6 h-6 text-[#fbbf24] shrink-0" />
            <div>
              <h3 className="text-base sm:text-xl font-bold font-amiri text-[#fbbf24]">
                نداء الوضوء وصلاة الجماعة في البيت — صلاة {jamaahAlert.prayerNameAr}
              </h3>
              <p className="text-xs sm:text-sm text-emerald-200 tabular-nums">
                تبقّى {jamaahAlert.minutesUntil} دقيقة على الأذان · هيّا نتوضأ ونستعد للوقوف بين يدي الله
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 5 Prayer Times Horizontal Strip */}
      <div className="grid grid-cols-5 gap-2 sm:gap-3 my-4">
        {prayerStrip.map((p) => {
          const isNext = p.key === jamaahAlert.prayerKey;
          return (
            <div
              key={p.key}
              className={`p-3 sm:p-4 rounded-2xl border text-center transition-colors ${
                isNext
                  ? 'bg-[#08362a] border-[#fbbf24] shadow-[0_0_18px_rgba(251,191,36,0.18)]'
                  : 'bg-[#041b16] border-[#e5b869]/25'
              }`}
            >
              <div className="text-xs sm:text-base font-bold text-slate-300">{p.label}</div>
              <div
                className={`text-lg sm:text-2xl font-mono font-extrabold tabular-nums mt-1 ${
                  isNext ? 'text-[#fbbf24]' : 'text-white'
                }`}
              >
                {p.time}
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Family Scoreboard Grid */}
      <div className="flex-1 my-2">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
          <h3 className="text-lg sm:text-xl font-bold font-amiri text-[#fbbf24] flex items-center gap-2">
            <Users className="w-5 h-5" />
            <span>متابعة الأسرة اليوم — اضغط بالريموت أو اللمس لتسجيل الصلاة</span>
          </h3>
          <div className="text-xs sm:text-sm text-slate-300 tabular-nums">
            <span>
              صلوات اليوم: <strong className="text-emerald-300">{summary.todayCompletedPrayers}</strong> /{' '}
              {summary.todayMaxPrayers}
            </span>
            <span> · </span>
            <span>
              جماعة اليوم: <strong className="text-[#fbbf24]">{summary.todayJamaahPrayers}</strong>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {familyState.members.map((member) => {
            const log = getMemberDayLog(familyState, member.id, todayKey);
            const stats = getMemberDayStats(familyState, member.id, todayKey);
            return (
              <div
                key={member.id}
                className={`p-4 rounded-2xl border flex flex-col gap-3 ${
                  stats.allFiveDone
                    ? 'bg-[#073026] border-[#fbbf24]/70'
                    : 'bg-[#041b16] border-[#e5b869]/30'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-10 h-10 rounded-xl bg-[#03120f] border border-[#e5b869]/40 flex items-center justify-center text-xl">
                      {member.avatarSymbol}
                    </span>
                    <div>
                      <h4 className="text-base sm:text-lg font-bold text-white">{member.name}</h4>
                      <p className="text-xs text-slate-300 tabular-nums">
                        <span>{FAMILY_ROLE_LABELS[member.role]}</span>
                        <span> · </span>
                        <span className="text-[#fbbf24]">★ {stats.stars} اليوم</span>
                        <span> · </span>
                        <span className="text-emerald-300">{stats.completedCount}/5</span>
                      </p>
                    </div>
                  </div>
                  {stats.allFiveDone && (
                    <span className="text-xs font-bold text-[#fbbf24] flex items-center gap-1 whitespace-nowrap">
                      <Star className="w-4 h-4 fill-current" />
                      <span>ما شاء الله · أتمّ الصلوات</span>
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {FAMILY_PRAYER_ORDER.map((pk) => {
                    const status = log.prayers[pk];
                    return (
                      <button
                        key={pk}
                        type="button"
                        onClick={() => onCycleMemberPrayer(member.id, pk)}
                        className={`min-h-[52px] px-1.5 py-2 rounded-xl border text-center flex flex-col items-center justify-center gap-0.5 transition-colors ${
                          status === 'jamaah'
                            ? 'bg-emerald-800/75 border-[#fbbf24] text-[#fbbf24] font-bold'
                            : status === 'solo'
                              ? 'bg-emerald-950/85 border-emerald-400/70 text-emerald-200 font-bold'
                              : 'bg-[#03120f] border-[#e5b869]/20 text-slate-400 hover:border-[#fbbf24]/50'
                        }`}
                      >
                        <span className="text-xs whitespace-nowrap">{getPrayerLabel(pk)}</span>
                        <span className="text-[11px] flex items-center gap-0.5 tabular-nums whitespace-nowrap">
                          {status === 'jamaah' ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>جماعة</span>
                            </>
                          ) : status === 'solo' ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>منفرد</span>
                            </>
                          ) : (
                            <span>—</span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Quiet Footer */}
      <div className="pt-3 border-t border-[#e5b869]/20 flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm text-slate-300">
        <span className="font-amiri text-[#e5b869]">
          «اجْعَلُوا فِي بُيُوتِكُمْ مِنْ صَلَاتِكُمْ وَلَا تَتَّخِذُوهَا قُبُورًا»
        </span>
        <span className="tabular-nums">
          ميثاق البيت الأسبوعي: {summary.covenantDoneCount}/{summary.covenantTotalCount} ({summary.covenantPercent}%) ·
          نجوم الأسبوع للأسرة: ★ {summary.weeklyStarsTotal}
        </span>
      </div>
    </div>
  );
};
