import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  Clock,
  Play,
  RotateCcw,
  Save,
  Sliders,
  Square,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { CityLocation, PrayerTimeData, UserSettings } from '../types';
import {
  AppSheikhOption,
  AppSheikhsRegistry,
  AudioPlayerState,
  adhanPlayer,
  getAppSheikhsFromWindow,
  syncAppSheikhsToWindow,
} from '../utils/audioAdhan';
import {
  applyOffsetToTimeStr,
  computeTimeOffsetMinutes,
} from '../utils/prayerCalculator';
import { toArabicDigits } from '../utils/khatmaData';

export type FivePrayerKey = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

const FIVE_PRAYERS: Array<{
  key: FivePrayerKey;
  nameAr: string;
  nameEn: string;
  isFajr?: boolean;
}> = [
  { key: 'fajr', nameAr: 'الفجر', nameEn: 'FAJR', isFajr: true },
  { key: 'dhuhr', nameAr: 'الظهر', nameEn: 'DHUHR' },
  { key: 'asr', nameAr: 'العصر', nameEn: 'ASR' },
  { key: 'maghrib', nameAr: 'المغرب', nameEn: 'MAGHRIB' },
  { key: 'isha', nameAr: 'العشاء', nameEn: 'ISHA' },
];

interface PrayerTimesControlPageProps {
  basePrayerTimes: PrayerTimeData;
  currentLocation: CityLocation;
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  onNavigateHome: () => void;
}

export const PrayerTimesControlPage: React.FC<PrayerTimesControlPageProps> = ({
  basePrayerTimes,
  currentLocation,
  settings,
  onUpdateSettings,
  onNavigateHome,
}) => {
  const [sheikhsRegistry, setSheikhsRegistry] = useState<AppSheikhsRegistry>(() => {
    syncAppSheikhsToWindow();
    return getAppSheikhsFromWindow();
  });

  useEffect(() => {
    const refreshSheikhs = () => {
      syncAppSheikhsToWindow();
      setSheikhsRegistry(getAppSheikhsFromWindow());
    };
    refreshSheikhs();
    window.addEventListener('mihrab_app_sheikhs_updated', refreshSheikhs);
    return () => {
      window.removeEventListener('mihrab_app_sheikhs_updated', refreshSheikhs);
    };
  }, []);

  const defaultFajrSheikhId = useMemo(() => {
    const list = sheikhsRegistry.fajr;
    if (settings.fajrAdhanReciter && list.some((s) => s.id === settings.fajrAdhanReciter)) {
      return settings.fajrAdhanReciter;
    }
    return list[0]?.id || '';
  }, [sheikhsRegistry.fajr, settings.fajrAdhanReciter]);

  const defaultRegularSheikhId = useMemo(() => {
    const list = sheikhsRegistry.regular;
    if (settings.adhanReciter && list.some((s) => s.id === settings.adhanReciter)) {
      return settings.adhanReciter;
    }
    return list[0]?.id || '';
  }, [sheikhsRegistry.regular, settings.adhanReciter]);

  // 1. Per-prayer Adhan Enabled state (🔊 يؤذّن / 🔇 صامت)
  const [draftAdhanEnabled, setDraftAdhanEnabled] = useState<Record<FivePrayerKey, boolean>>(() => ({
    fajr: settings.prayerAdhanEnabled?.fajr ?? true,
    dhuhr: settings.prayerAdhanEnabled?.dhuhr ?? true,
    asr: settings.prayerAdhanEnabled?.asr ?? true,
    maghrib: settings.prayerAdhanEnabled?.maghrib ?? true,
    isha: settings.prayerAdhanEnabled?.isha ?? true,
  }));

  // 2. Global Fajr Sheikh + Global Regular Sheikh + Per-Prayer Sheikh
  const [draftFajrSheikh, setDraftFajrSheikh] = useState<string>(
    settings.prayerReciters?.fajr || settings.fajrAdhanReciter || defaultFajrSheikhId
  );
  const [draftRegularSheikh, setDraftRegularSheikh] = useState<string>(
    settings.adhanReciter || defaultRegularSheikhId
  );
  const [draftPrayerSheikhs, setDraftPrayerSheikhs] = useState<Record<FivePrayerKey, string>>(() => ({
    fajr: settings.prayerReciters?.fajr || settings.fajrAdhanReciter || defaultFajrSheikhId,
    dhuhr: settings.prayerReciters?.dhuhr || settings.adhanReciter || defaultRegularSheikhId,
    asr: settings.prayerReciters?.asr || settings.adhanReciter || defaultRegularSheikhId,
    maghrib: settings.prayerReciters?.maghrib || settings.adhanReciter || defaultRegularSheikhId,
    isha: settings.prayerReciters?.isha || settings.adhanReciter || defaultRegularSheikhId,
  }));

  // Ensure draft sheikh ids sync cleanly when window.APP_SHEIKHS loads/updates
  useEffect(() => {
    if (!draftFajrSheikh && defaultFajrSheikhId) {
      setDraftFajrSheikh(defaultFajrSheikhId);
    }
    if (!draftRegularSheikh && defaultRegularSheikhId) {
      setDraftRegularSheikh(defaultRegularSheikhId);
    }
    setDraftPrayerSheikhs((prev) => ({
      fajr: prev.fajr || defaultFajrSheikhId,
      dhuhr: prev.dhuhr || defaultRegularSheikhId,
      asr: prev.asr || defaultRegularSheikhId,
      maghrib: prev.maghrib || defaultRegularSheikhId,
      isha: prev.isha || defaultRegularSheikhId,
    }));
  }, [defaultFajrSheikhId, defaultRegularSheikhId, draftFajrSheikh, draftRegularSheikh]);

  // 3. Per-prayer minute offsets
  const [draftOffsets, setDraftOffsets] = useState<Record<FivePrayerKey, number>>(() => ({
    fajr: Number(settings.prayerOffsets?.fajr) || 0,
    dhuhr: Number(settings.prayerOffsets?.dhuhr) || 0,
    asr: Number(settings.prayerOffsets?.asr) || 0,
    maghrib: Number(settings.prayerOffsets?.maghrib) || 0,
    isha: Number(settings.prayerOffsets?.isha) || 0,
  }));

  // Audio preview state
  const [playerState, setPlayerState] = useState<AudioPlayerState>('idle');
  const [previewingKey, setPreviewingKey] = useState<string | null>(null);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);

  useEffect(() => {
    const unsub = adhanPlayer.subscribe({
      onStateChange: (st, type) => {
        setPlayerState(st);
        if ((st !== 'playing' && st !== 'loading') || type !== 'adhan') {
          setPreviewingKey(null);
        }
      },
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!statusFeedback) return;
    const timer = window.setTimeout(() => setStatusFeedback(null), 4000);
    return () => window.clearTimeout(timer);
  }, [statusFeedback]);

  const activeAdhanCount = useMemo(
    () => FIVE_PRAYERS.filter((p) => draftAdhanEnabled[p.key]).length,
    [draftAdhanEnabled]
  );

  const isFriday = new Date().getDay() === 5;
  const getPrayerLabel = (prayer: (typeof FIVE_PRAYERS)[number]) =>
    prayer.key === 'dhuhr' && isFriday ? 'الجمعة' : prayer.nameAr;

  const handleTogglePrayerAdhan = (key: FivePrayerKey) => {
    setDraftAdhanEnabled((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleEnableAllAdhan = () => {
    setDraftAdhanEnabled({
      fajr: true,
      dhuhr: true,
      asr: true,
      maghrib: true,
      isha: true,
    });
  };

  const handleMuteAllAdhan = () => {
    setDraftAdhanEnabled({
      fajr: false,
      dhuhr: false,
      asr: false,
      maghrib: false,
      isha: false,
    });
  };

  const handleSelectFajrSheikh = (sheikhId: string) => {
    setDraftFajrSheikh(sheikhId);
    setDraftPrayerSheikhs((prev) => ({ ...prev, fajr: sheikhId }));
  };

  const handleApplyRegularSheikhToAll = () => {
    if (!draftRegularSheikh) return;
    setDraftPrayerSheikhs((prev) => ({
      ...prev,
      dhuhr: draftRegularSheikh,
      asr: draftRegularSheikh,
      maghrib: draftRegularSheikh,
      isha: draftRegularSheikh,
    }));
    const sheikhName =
      sheikhsRegistry.regular.find((s) => s.id === draftRegularSheikh)?.nameAr || '';
    setStatusFeedback(
      sheikhName
        ? `تم تعميم «${sheikhName}» على صلوات الظهر والعصر والمغرب والعشاء`
        : 'تم تعميم الشيخ على الصلوات العادية'
    );
  };

  const handleAdjustOffset = (key: FivePrayerKey, deltaMinutes: number) => {
    setDraftOffsets((prev) => ({
      ...prev,
      [key]: Math.max(-180, Math.min(180, (prev[key] || 0) + deltaMinutes)),
    }));
  };

  const handleDirectTimeChange = (key: FivePrayerKey, newTimeStr: string) => {
    if (!newTimeStr || !newTimeStr.includes(':')) return;
    const baseTime = basePrayerTimes[key];
    const diff = computeTimeOffsetMinutes(baseTime, newTimeStr);
    setDraftOffsets((prev) => ({
      ...prev,
      [key]: Math.max(-180, Math.min(180, diff)),
    }));
  };

  const handleResetAllOffsets = () => {
    setDraftOffsets({
      fajr: 0,
      dhuhr: 0,
      asr: 0,
      maghrib: 0,
      isha: 0,
    });
    setStatusFeedback('تم تصفير ضبط المواقيت والعودة إلى التوقيت الفلكي الأصلي');
  };

  const handlePreviewSheikh = (previewId: string, reciterId: string, isFajr: boolean) => {
    if (!reciterId) return;
    if (
      (playerState === 'playing' || playerState === 'loading') &&
      previewingKey === previewId
    ) {
      adhanPlayer.stop();
      setPreviewingKey(null);
      return;
    }
    setPreviewingKey(previewId);
    void adhanPlayer.playAdhan(reciterId, isFajr ? 'fajr' : 'dhuhr', isFajr && settings.fajrBoostVolume, {
      skipAutoCache: true,
      disableAutoDua: true,
    });
  };

  const handleSaveAndApply = () => {
    onUpdateSettings({
      prayerAdhanEnabled: { ...draftAdhanEnabled },
      prayerOffsets: { ...draftOffsets },
      prayerReciters: { ...draftPrayerSheikhs },
      fajrAdhanReciter: draftFajrSheikh || draftPrayerSheikhs.fajr || settings.fajrAdhanReciter,
      adhanReciter: draftRegularSheikh || settings.adhanReciter,
    });
    adhanPlayer.playChime();
    setStatusFeedback('تم حفظ وتطبيق ضبط المواقيت وشيوخ الأذان بنجاح ✓');
  };

  const formatOffsetBadge = (offset: number) => {
    if (!offset) return 'أصلي (0 د)';
    const sign = offset > 0 ? '+' : '-';
    return `${sign}${Math.abs(offset)} د`;
  };

  const renderSheikhOptions = (list: AppSheikhOption[]) => {
    if (list.length === 0) {
      return <option value="">لا توجد قوائم شيوخ محمّلة</option>;
    }
    return list.map((sheikh) => (
      <option key={sheikh.id} value={sheikh.id} className="bg-[#05140F] text-slate-100">
        {sheikh.nameAr}
      </option>
    ));
  };

  return (
    <section
      id="prayer-times-page"
      dir="rtl"
      aria-label="صفحة المواقيت والتحكم بالأذان والشيوخ"
      className="max-w-3xl mx-auto space-y-4 pb-8 text-right animate-fadeIn"
      style={{ fontFamily: "'Cairo', sans-serif" }}
    >
      {/* Top Navigation Bar with Clear Back-to-Home Button */}
      <div className="rounded-3xl bg-gradient-to-br from-[#08241B] via-[#061A13] to-[#05140F] border border-[#CFA632]/55 p-4 shadow-[0_14px_38px_rgba(0,0,0,0.5)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-[#05140F] border border-[#F6D884]/60 flex items-center justify-center text-[#F6D884] shadow-[0_0_16px_rgba(207,166,50,0.25)] shrink-0">
              <Sliders className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="font-amiri text-xl sm:text-2xl font-bold text-[#F6D884] leading-tight truncate">
                صفحة المواقيت والأذان
              </h2>
              <p className="text-xs text-slate-300 truncate mt-0.5">
                {currentLocation.nameAr}، {currentLocation.countryAr} · تحكم بالأذان، الشيوخ، وضبط الدقائق
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onNavigateHome}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-gradient-to-r from-[#F6D884] via-[#E5BE53] to-[#CFA632] text-[#05140F] text-xs sm:text-sm font-black shadow-[0_6px_18px_rgba(207,166,50,0.3)] hover:brightness-105 active:scale-[0.98] transition-all flex items-center gap-1.5 shrink-0"
          >
            <span aria-hidden="true">🏠</span>
            <span>الرئيسية</span>
          </button>
        </div>

        {/* Live Counter + Bulk Mute/Enable Controls */}
        <div className="mt-4 pt-3.5 border-t border-[#CFA632]/25 flex flex-wrap items-center justify-between gap-2.5">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#05140F] border border-[#34D399]/45 text-xs font-bold text-[#34D399] tabular-nums">
            <span className="w-2 h-2 rounded-full bg-[#34D399] animate-pulse" />
            <span>
              {toArabicDigits(activeAdhanCount)} من {toArabicDigits(5)} صلوات يؤذّن
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleEnableAllAdhan}
              className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#0A2B20] hover:bg-[#0D382A] border border-[#34D399]/45 text-[#34D399] text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>تشغيل الكل</span>
            </button>
            <button
              type="button"
              onClick={handleMuteAllAdhan}
              className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#1A0D10] hover:bg-[#271217] border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <VolumeX className="w-3.5 h-3.5" />
              <span>إيقاف الكل</span>
            </button>
          </div>
        </div>
      </div>

      {/* Feedback Banner */}
      {statusFeedback && (
        <div
          role="status"
          className="rounded-2xl bg-[#09291E] border border-[#34D399]/60 px-4 py-3 text-xs sm:text-sm font-bold text-[#34D399] flex items-center justify-between gap-2 shadow-lg animate-fadeIn"
        >
          <span className="flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{statusFeedback}</span>
          </span>
        </div>
      )}

      {/* App Sheikhs Master Assignment Panel (Bound exclusively to window.APP_SHEIKHS) */}
      <div className="rounded-3xl bg-gradient-to-br from-[#071E17] via-[#061812] to-[#05140F] border border-[#CFA632]/40 p-4 space-y-3.5 shadow-[0_10px_28px_rgba(0,0,0,0.4)]">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-amiri text-lg font-bold text-[#F6D884] flex items-center gap-2">
            <span>🕌</span>
            <span>ربط شيوخ التطبيق للأذان</span>
          </h3>
          <span className="text-[11px] font-bold text-[#34D399] bg-[#05140F] border border-[#34D399]/35 px-2.5 py-0.5 rounded-full tabular-nums">
            {toArabicDigits(sheikhsRegistry.fajr.length + sheikhsRegistry.regular.length)} صوتاً متاحاً
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Fajr Special Sheikh Selector */}
          <div className="rounded-2xl bg-[#05140F]/90 border border-[#CFA632]/30 p-3 space-y-2">
            <label
              htmlFor="fajr-master-sheikh"
              className="block text-xs font-bold text-[#F6D884]"
            >
              شيخ أذان الفجر (الصلاة خير من النوم)
            </label>
            <div className="flex items-center gap-1.5">
              <select
                id="fajr-master-sheikh"
                value={draftFajrSheikh}
                onChange={(e) => handleSelectFajrSheikh(e.target.value)}
                className="flex-1 min-w-0 min-h-[42px] px-2.5 py-2 rounded-xl bg-[#071E17] border border-[#CFA632]/40 text-xs text-slate-100 focus:outline-none focus:border-[#F6D884]"
              >
                {renderSheikhOptions(sheikhsRegistry.fajr)}
              </select>
              <button
                type="button"
                onClick={() => handlePreviewSheikh('master-fajr', draftFajrSheikh, true)}
                title="سماع عينة أذان الفجر"
                className={`min-w-[42px] min-h-[42px] rounded-xl border flex items-center justify-center transition-all shrink-0 ${
                  previewingKey === 'master-fajr' && (playerState === 'playing' || playerState === 'loading')
                    ? 'bg-rose-900/70 border-rose-500 text-rose-100'
                    : 'bg-[#0A2B20] border-[#34D399]/45 text-[#34D399] hover:border-[#34D399]'
                }`}
              >
                {previewingKey === 'master-fajr' && (playerState === 'playing' || playerState === 'loading') ? (
                  <Square className="w-3.5 h-3.5 fill-current" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-current" />
                )}
              </button>
            </div>
          </div>

          {/* Regular Adhan Sheikh Selector + Broadcast ("تعميم") */}
          <div className="rounded-2xl bg-[#05140F]/90 border border-[#CFA632]/30 p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="regular-master-sheikh"
                className="block text-xs font-bold text-[#F6D884]"
              >
                شيخ الأذان العادي
              </label>
              <button
                type="button"
                onClick={handleApplyRegularSheikhToAll}
                className="px-2.5 py-1 rounded-lg bg-[#CFA632]/20 hover:bg-[#CFA632]/35 border border-[#F6D884]/55 text-[#F6D884] text-[11px] font-extrabold transition-all"
              >
                تعميم
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <select
                id="regular-master-sheikh"
                value={draftRegularSheikh}
                onChange={(e) => setDraftRegularSheikh(e.target.value)}
                className="flex-1 min-w-0 min-h-[42px] px-2.5 py-2 rounded-xl bg-[#071E17] border border-[#CFA632]/40 text-xs text-slate-100 focus:outline-none focus:border-[#F6D884]"
              >
                {renderSheikhOptions(sheikhsRegistry.regular)}
              </select>
              <button
                type="button"
                onClick={() => handlePreviewSheikh('master-regular', draftRegularSheikh, false)}
                title="سماع عينة الأذان العادي"
                className={`min-w-[42px] min-h-[42px] rounded-xl border flex items-center justify-center transition-all shrink-0 ${
                  previewingKey === 'master-regular' && (playerState === 'playing' || playerState === 'loading')
                    ? 'bg-rose-900/70 border-rose-500 text-rose-100'
                    : 'bg-[#0A2B20] border-[#34D399]/45 text-[#34D399] hover:border-[#34D399]'
                }`}
              >
                {previewingKey === 'master-regular' && (playerState === 'playing' || playerState === 'loading') ? (
                  <Square className="w-3.5 h-3.5 fill-current" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-current" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 5 Prayers Individual Control Cards */}
      <div className="space-y-3">
        {FIVE_PRAYERS.map((prayer) => {
          const isEnabled = draftAdhanEnabled[prayer.key];
          const baseTime = basePrayerTimes[prayer.key];
          const offset = draftOffsets[prayer.key] || 0;
          const effectiveTime = applyOffsetToTimeStr(baseTime, offset);
          const prayerSheikhList = prayer.isFajr
            ? sheikhsRegistry.fajr
            : sheikhsRegistry.regular;
          const selectedSheikh = draftPrayerSheikhs[prayer.key] || '';
          const previewToken = `prayer-${prayer.key}`;
          const isPreviewPlaying =
            previewingKey === previewToken &&
            (playerState === 'playing' || playerState === 'loading');

          return (
            <div
              key={prayer.key}
              className={`rounded-3xl border p-4 space-y-3.5 transition-all shadow-[0_10px_28px_rgba(0,0,0,0.4)] ${
                isEnabled
                  ? 'bg-gradient-to-br from-[#08261D] via-[#061A13] to-[#05140F] border-[#CFA632]/45'
                  : 'bg-gradient-to-br from-[#091511] to-[#05140F] border-slate-700/50 opacity-85'
              }`}
            >
              {/* Row 1: Prayer Name + Times + Adhan Toggle (🔊 يؤذّن / 🔇 صامت) */}
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#05140F] border border-[#CFA632]/45 flex items-center justify-center text-[#F6D884] shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-amiri text-xl font-bold text-[#F6D884]">
                        {getPrayerLabel(prayer)}
                      </h4>
                      <span className="text-[10px] font-mono tracking-widest text-slate-400">
                        {prayer.nameEn}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs tabular-nums mt-0.5">
                      <span className="text-slate-400">
                        الأصلي: <strong className="font-mono text-slate-200">{baseTime}</strong>
                      </span>
                      <span className="text-[#CFA632]/50">←</span>
                      <span className="text-[#34D399] font-bold">
                        المعتمد: <strong className="font-mono text-sm text-[#F6D884]">{effectiveTime}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleTogglePrayerAdhan(prayer.key)}
                  aria-pressed={isEnabled}
                  className={`min-h-[42px] px-3.5 py-2 rounded-xl border text-xs font-extrabold transition-all flex items-center gap-1.5 shrink-0 ${
                    isEnabled
                      ? 'bg-[#0B3527] border-[#34D399]/65 text-[#34D399] shadow-[0_0_14px_rgba(52,211,153,0.18)]'
                      : 'bg-[#1D1014] border-rose-500/45 text-rose-300'
                  }`}
                >
                  <span>{isEnabled ? '🔊 يؤذّن' : '🔇 صامت'}</span>
                </button>
              </div>

              {/* Row 2: Per-Prayer Sheikh Selection */}
              <div className="rounded-2xl bg-[#05140F]/85 border border-[#CFA632]/25 p-2.5 space-y-1.5">
                <label
                  htmlFor={`sheikh-select-${prayer.key}`}
                  className="block text-[11px] font-bold text-slate-300"
                >
                  شيخ الأذان لصلاة {getPrayerLabel(prayer)}
                </label>
                <div className="flex items-center gap-1.5">
                  <select
                    id={`sheikh-select-${prayer.key}`}
                    value={selectedSheikh}
                    onChange={(e) => {
                      const nextId = e.target.value;
                      setDraftPrayerSheikhs((prev) => ({ ...prev, [prayer.key]: nextId }));
                      if (prayer.isFajr) {
                        setDraftFajrSheikh(nextId);
                      }
                    }}
                    className="flex-1 min-w-0 min-h-[40px] px-2.5 py-1.5 rounded-xl bg-[#071E17] border border-[#CFA632]/35 text-xs text-slate-100 focus:outline-none focus:border-[#F6D884]"
                  >
                    {renderSheikhOptions(prayerSheikhList)}
                  </select>
                  <button
                    type="button"
                    onClick={() => handlePreviewSheikh(previewToken, selectedSheikh, Boolean(prayer.isFajr))}
                    title={`استماع لأذان ${getPrayerLabel(prayer)}`}
                    className={`min-w-[40px] min-h-[40px] rounded-xl border flex items-center justify-center transition-all shrink-0 ${
                      isPreviewPlaying
                        ? 'bg-rose-900/70 border-rose-500 text-rose-100'
                        : 'bg-[#0A2B20] border-[#34D399]/40 text-[#34D399] hover:border-[#34D399]'
                    }`}
                  >
                    {isPreviewPlaying ? (
                      <Square className="w-3.5 h-3.5 fill-current" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-current" />
                    )}
                  </button>
                </div>
              </div>

              {/* Row 3: Exact Time Adjustment (Direct Time Input + -/+ Minute Buttons + Live Diff) */}
              <div className="rounded-2xl bg-[#05140F]/85 border border-[#CFA632]/25 p-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-bold text-slate-300">
                    ضبط الوقت بالضبط (إدخال مباشر أو بالدقائق)
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold tabular-nums border ${
                      offset === 0
                        ? 'bg-[#071E17] border-slate-700 text-slate-300'
                        : offset > 0
                        ? 'bg-[#0A2B20] border-[#34D399]/45 text-[#34D399]'
                        : 'bg-[#251A09] border-[#CFA632]/50 text-[#F6D884]'
                    }`}
                  >
                    الفارق: {formatOffsetBadge(offset)}
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  {/* Direct Time Input */}
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor={`time-input-${prayer.key}`}
                      className="text-[11px] text-slate-400"
                    >
                      تعديل مباشر:
                    </label>
                    <input
                      id={`time-input-${prayer.key}`}
                      type="time"
                      dir="ltr"
                      value={effectiveTime}
                      onChange={(e) => handleDirectTimeChange(prayer.key, e.target.value)}
                      className="min-h-[40px] px-2.5 py-1.5 rounded-xl bg-[#071E17] border border-[#CFA632]/45 text-[#F6D884] font-mono font-bold text-sm tabular-nums focus:outline-none focus:border-[#34D399]"
                    />
                  </div>

                  {/* - / + Minute Stepper Controls */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleAdjustOffset(prayer.key, -1)}
                      aria-label={`تقديم ${getPrayerLabel(prayer)} دقيقة واحدة`}
                      className="min-w-[44px] min-h-[40px] px-3 rounded-xl bg-[#071E17] hover:bg-[#0D2E23] border border-[#CFA632]/45 text-[#F6D884] font-mono font-black text-base transition-all active:scale-95"
                    >
                      -
                    </button>
                    <span className="min-w-[60px] text-center font-mono text-xs font-bold text-slate-200 tabular-nums">
                      {offset > 0 ? `+${offset}` : offset} د
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAdjustOffset(prayer.key, 1)}
                      aria-label={`تأخير ${getPrayerLabel(prayer)} دقيقة واحدة`}
                      className="min-w-[44px] min-h-[40px] px-3 rounded-xl bg-[#071E17] hover:bg-[#0D2E23] border border-[#CFA632]/45 text-[#F6D884] font-mono font-black text-base transition-all active:scale-95"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Action Bar: Reset & Save/Apply */}
      <div className="rounded-3xl bg-gradient-to-br from-[#08241B] via-[#061A13] to-[#05140F] border border-[#CFA632]/50 p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shadow-[0_12px_32px_rgba(0,0,0,0.45)]">
        <button
          type="button"
          onClick={handleResetAllOffsets}
          className="min-h-[46px] px-4 py-2.5 rounded-2xl bg-[#05140F] hover:bg-[#0A251C] border border-[#CFA632]/45 text-[#F6D884] text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all"
        >
          <RotateCcw className="w-4 h-4" />
          <span>تصفير الضبط</span>
        </button>

        <button
          type="button"
          onClick={handleSaveAndApply}
          className="flex-1 min-h-[46px] px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#F6D884] via-[#E5BE53] to-[#CFA632] text-[#05140F] text-xs sm:text-sm font-black shadow-[0_8px_24px_rgba(207,166,50,0.3)] hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          <span>حفظ وتطبيق ضبط المواقيت وشيوخ الأذان</span>
        </button>
      </div>
    </section>
  );
};
