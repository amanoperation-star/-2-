import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  BookOpen,
  Play,
  Square,
  Repeat,
  Eye,
  EyeOff,
  Check,
  RotateCcw,
  Search,
  Bell,
  Plus,
  Trash2,
  Loader2,
  Volume2,
  BookmarkCheck,
  Sparkles,
} from 'lucide-react';
import {
  HIFZ_QUICK_PRESETS,
  HIFZ_RECITERS,
  HIFZ_SPACED_INTERVALS_DAYS,
  HifzAyah,
  HifzMasteryLevel,
  HifzSegment,
  HifzState,
  HifzTasmiMode,
  QURAN_SURAH_CATALOG,
  addDaysToDateKey,
  buildAyahAudioUrls,
  computeHifzStats,
  fetchSurahAyahsWithCache,
  formatDueSummaryAr,
  getMasteryLabelAr,
  getTodayHifzDateKey,
  loadHifzState,
  saveHifzState,
} from '../utils/hifzData';
import { toArabicDigits } from '../utils/khatmaData';
import { resolvePlayableAudioUrl } from '../utils/offlineAudioManager';
import { adhanPlayer } from '../utils/audioAdhan';

interface HifzCompanionPanelProps {
  onTestReminder?: () => void;
}

export const HifzCompanionPanel: React.FC<HifzCompanionPanelProps> = ({ onTestReminder }) => {
  const [hifzState, setHifzState] = useState<HifzState>(() => loadHifzState());

  // Studio Selection
  const [selectedSurahNumber, setSelectedSurahNumber] = useState<number>(67); // Al-Mulk default
  const [startAyah, setStartAyah] = useState<number>(1);
  const [endAyah, setEndAyah] = useState<number>(10);
  const [surahSearch, setSurahSearch] = useState<string>('');

  // Loaded Ayahs
  const [ayahs, setAyahs] = useState<HifzAyah[]>([]);
  const [loadingAyahs, setLoadingAyahs] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState<number>(0);

  // Tasmi' Mode & Reveal State
  const [tasmiMode, setTasmiMode] = useState<HifzTasmiMode>('read');
  const [revealedWordKeys, setRevealedWordKeys] = useState<Record<string, boolean>>({});
  const [revealedAyahs, setRevealedAyahs] = useState<Record<number, boolean>>({});
  const [ayahGrades, setAyahGrades] = useState<Record<number, 'pass' | 'retry'>>({});
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  // Audio Loop State
  const [loopRange, setLoopRange] = useState<boolean>(true);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [activeAudioAyah, setActiveAudioAyah] = useState<number | null>(null);
  const [activeAudioRepeatIdx, setActiveAudioRepeatIdx] = useState<number>(1);
  const [audioLoading, setAudioLoading] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sessionIdRef = useRef<number>(0);

  useEffect(() => {
    const sync = () => setHifzState(loadHifzState());
    window.addEventListener('hifz_state_changed', sync);
    return () => window.removeEventListener('hifz_state_changed', sync);
  }, []);

  const updateAndSave = (next: HifzState) => {
    setHifzState(next);
    saveHifzState(next);
  };

  const selectedSurahMeta = useMemo(
    () =>
      QURAN_SURAH_CATALOG.find((s) => s.number === selectedSurahNumber) || QURAN_SURAH_CATALOG[66],
    [selectedSurahNumber]
  );

  const filteredSurahs = useMemo(() => {
    const q = surahSearch.trim();
    if (!q) return QURAN_SURAH_CATALOG;
    return QURAN_SURAH_CATALOG.filter(
      (s) => s.nameAr.includes(q) || String(s.number) === q
    );
  }, [surahSearch]);

  // Fetch surah ayahs when surah changes
  useEffect(() => {
    let active = true;
    setLoadingAyahs(true);
    setLoadError(null);
    fetchSurahAyahsWithCache(selectedSurahNumber)
      .then((list) => {
        if (!active) return;
        setAyahs(list);
        setLoadingAyahs(false);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setLoadError(err instanceof Error ? err.message : 'تعذر تحميل الآيات');
        setLoadingAyahs(false);
      });
    return () => {
      active = false;
    };
  }, [selectedSurahNumber, reloadNonce]);

  const stopAudio = () => {
    sessionIdRef.current += 1;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    setIsPlayingAudio(false);
    setActiveAudioAyah(null);
    setAudioLoading(false);
  };

  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  const handleSelectSurah = (surahNum: number, customStart?: number, customEnd?: number) => {
    stopAudio();
    const meta = QURAN_SURAH_CATALOG.find((s) => s.number === surahNum);
    const maxAyah = meta ? meta.ayahCount : 10;
    const s = customStart ? Math.max(1, Math.min(maxAyah, customStart)) : 1;
    const e = customEnd ? Math.max(s, Math.min(maxAyah, customEnd)) : Math.min(maxAyah, 15);
    setSelectedSurahNumber(surahNum);
    setStartAyah(s);
    setEndAyah(e);
    setRevealedWordKeys({});
    setRevealedAyahs({});
    setAyahGrades({});
  };

  const visibleAyahs = useMemo(() => {
    const safeStart = Math.max(1, Math.min(startAyah, endAyah));
    const safeEnd = Math.min(selectedSurahMeta.ayahCount, Math.max(startAyah, endAyah));
    return ayahs.filter((a) => a.numberInSurah >= safeStart && a.numberInSurah <= safeEnd);
  }, [ayahs, startAyah, endAyah, selectedSurahMeta.ayahCount]);

  const playSingleUrl = async (urls: string[], sessionId: number): Promise<boolean> => {
    for (const rawUrl of urls) {
      if (sessionIdRef.current !== sessionId) return false;
      setAudioLoading(true);
      const playableUrl = await resolvePlayableAudioUrl(rawUrl);
      if (sessionIdRef.current !== sessionId) return false;

      const ok = await new Promise<boolean>((resolve) => {
        if (!audioRef.current) {
          audioRef.current = new Audio();
        }
        const audio = audioRef.current;
        audio.pause();
        audio.src = playableUrl;
        audio.oncanplay = () => setAudioLoading(false);
        audio.onended = () => {
          setAudioLoading(false);
          resolve(true);
        };
        audio.onerror = () => {
          setAudioLoading(false);
          resolve(false);
        };
        audio.play().catch(() => {
          setAudioLoading(false);
          resolve(false);
        });
      });

      if (sessionIdRef.current !== sessionId) return false;
      if (ok) return true;
    }
    return false;
  };

  const handleStartAudioLoop = async (fromAyahNumber?: number) => {
    if (visibleAyahs.length === 0) return;
    if (isPlayingAudio && !fromAyahNumber) {
      stopAudio();
      return;
    }

    adhanPlayer.stop();
    stopAudio();
    const sessionId = ++sessionIdRef.current;
    const reciter =
      HIFZ_RECITERS.find((r) => r.id === hifzState.activeReciterId) || HIFZ_RECITERS[0];
    setIsPlayingAudio(true);

    const startIndex = fromAyahNumber
      ? Math.max(0, visibleAyahs.findIndex((a) => a.numberInSurah === fromAyahNumber))
      : 0;

    let firstPass = true;
    while (sessionIdRef.current === sessionId) {
      const idxStart = firstPass ? startIndex : 0;
      firstPass = false;

      for (let i = idxStart; i < visibleAyahs.length; i++) {
        if (sessionIdRef.current !== sessionId) break;
        const ayah = visibleAyahs[i];
        setActiveAudioAyah(ayah.numberInSurah);

        // Pre-warm next ayah URL softly
        const nextAyah = visibleAyahs[i + 1];
        if (nextAyah) {
          void resolvePlayableAudioUrl(
            buildAyahAudioUrls(reciter, selectedSurahNumber, nextAyah.numberInSurah)[0]
          );
        }

        for (let rep = 1; rep <= hifzState.repeatPerAyah; rep++) {
          if (sessionIdRef.current !== sessionId) break;
          setActiveAudioRepeatIdx(rep);
          const urls = buildAyahAudioUrls(reciter, selectedSurahNumber, ayah.numberInSurah);
          const ok = await playSingleUrl(urls, sessionId);
          if (!ok || sessionIdRef.current !== sessionId) {
            if (sessionIdRef.current === sessionId) stopAudio();
            return;
          }
        }
      }

      if (!loopRange) break;
    }

    if (sessionIdRef.current === sessionId) {
      stopAudio();
    }
  };

  const stats = useMemo(() => computeHifzStats(hifzState), [hifzState]);

  const sortedSegments = useMemo(() => {
    const todayKey = getTodayHifzDateKey();
    return [...hifzState.segments].sort((a, b) => {
      const aDue = a.nextReviewDate <= todayKey ? 0 : 1;
      const bDue = b.nextReviewDate <= todayKey ? 0 : 1;
      if (aDue !== bDue) return aDue - bDue;
      return a.nextReviewDate.localeCompare(b.nextReviewDate);
    });
  }, [hifzState.segments]);

  const handleSaveCurrentSegment = () => {
    const todayKey = getTodayHifzDateKey();
    const gradedValues = Object.values(ayahGrades);
    const passCount = gradedValues.filter((g) => g === 'pass').length;
    const scorePercent =
      gradedValues.length > 0 ? Math.round((passCount / gradedValues.length) * 100) : 100;

    const segId = `s${selectedSurahNumber}_${startAyah}_${endAyah}`;
    const existing = hifzState.segments.find((s) => s.id === segId);

    const nextMastery: HifzMasteryLevel = existing
      ? scorePercent >= 80
        ? (Math.min(5, existing.masteryLevel + 1) as HifzMasteryLevel)
        : (Math.max(0, existing.masteryLevel - 1) as HifzMasteryLevel)
      : scorePercent >= 80
      ? 1
      : 0;

    const intervalDays = HIFZ_SPACED_INTERVALS_DAYS[nextMastery];
    const nextReviewDate = addDaysToDateKey(todayKey, intervalDays);

    const updatedSeg: HifzSegment = {
      id: segId,
      surahNumber: selectedSurahNumber,
      surahNameAr: selectedSurahMeta.nameAr,
      startAyah,
      endAyah,
      masteryLevel: nextMastery,
      reviewCount: (existing?.reviewCount || 0) + 1,
      lastReviewedDate: todayKey,
      nextReviewDate,
      lastScorePercent: scorePercent,
      createdAt: existing?.createdAt || new Date().toISOString(),
    };

    const nextSegments = existing
      ? hifzState.segments.map((s) => (s.id === segId ? updatedSeg : s))
      : [updatedSeg, ...hifzState.segments];

    adhanPlayer.playChime();
    updateAndSave({
      ...hifzState,
      segments: nextSegments,
      dailyReviewLog: {
        ...hifzState.dailyReviewLog,
        [todayKey]: (hifzState.dailyReviewLog[todayKey] || 0) + visibleAyahs.length,
      },
    });
    setSaveFeedback(
      `تم حفظ سورة ${selectedSurahMeta.nameAr} (${toArabicDigits(startAyah)}–${toArabicDigits(
        endAyah
      )}) · المراجعة القادمة بعد ${toArabicDigits(intervalDays)} أيام`
    );
    window.setTimeout(() => setSaveFeedback(null), 4500);
  };

  const handleReviewSegmentOutcome = (seg: HifzSegment, passed: boolean) => {
    const todayKey = getTodayHifzDateKey();
    const nextMastery: HifzMasteryLevel = passed
      ? (Math.min(5, seg.masteryLevel + 1) as HifzMasteryLevel)
      : (Math.max(0, seg.masteryLevel - 1) as HifzMasteryLevel);
    const intervalDays = HIFZ_SPACED_INTERVALS_DAYS[nextMastery];
    const nextReviewDate = addDaysToDateKey(todayKey, intervalDays);

    adhanPlayer.playChime();
    updateAndSave({
      ...hifzState,
      segments: hifzState.segments.map((s) =>
        s.id === seg.id
          ? {
              ...s,
              masteryLevel: nextMastery,
              reviewCount: s.reviewCount + 1,
              lastReviewedDate: todayKey,
              nextReviewDate,
              lastScorePercent: passed ? 100 : 60,
            }
          : s
      ),
      dailyReviewLog: {
        ...hifzState.dailyReviewLog,
        [todayKey]:
          (hifzState.dailyReviewLog[todayKey] || 0) + (seg.endAyah - seg.startAyah + 1),
      },
    });
  };

  const handleDeleteSegment = (segId: string) => {
    updateAndSave({
      ...hifzState,
      segments: hifzState.segments.filter((s) => s.id !== segId),
    });
  };

  const toggleRevealAllInCurrentMode = () => {
    const anyHidden = visibleAyahs.some((a) => !revealedAyahs[a.numberInSurah]);
    if (anyHidden) {
      const next: Record<number, boolean> = {};
      visibleAyahs.forEach((a) => {
        next[a.numberInSurah] = true;
      });
      setRevealedAyahs(next);
    } else {
      setRevealedAyahs({});
      setRevealedWordKeys({});
    }
  };

  return (
    <div dir="rtl" className="space-y-6 text-right">
      {/* Top Hifz Stats Banner */}
      <div className="rounded-3xl bg-[#041b16]/95 border border-[#D4AF37]/40 p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#D4AF37]/20">
          <div className="space-y-1">
            <h3 className="text-xl sm:text-2xl font-bold font-amiri text-[#F3CA63]">
              رفيق الحفظ والتسميع التفاعلي للقرآن الكريم
            </h3>
            <p className="text-xs sm:text-sm text-slate-300">
              استماع وتكرار للآيات بصوت كبار القراء · تسميع متدرّج بإخفاء الكلمات · مراجعة متباعدة تلقائية
            </p>
          </div>

          <button
            type="button"
            onClick={handleSaveCurrentSegment}
            disabled={visibleAyahs.length === 0}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8962E] text-slate-950 hover:brightness-105 disabled:opacity-40 text-xs sm:text-sm font-black flex items-center gap-1.5 shadow transition-all whitespace-nowrap shrink-0"
          >
            <BookmarkCheck className="w-4 h-4" />
            <span>حفظ المقطع في جدول المراجعة</span>
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x lg:divide-x-reverse divide-[#D4AF37]/20">
          <div className="p-3 sm:px-4 space-y-1">
            <div className="text-xs text-slate-400">مقاطع محفوظة</div>
            <div className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-[#F3CA63]">
              {toArabicDigits(stats.totalSegments)}
            </div>
            <div className="text-[11px] text-slate-400">
              متقن تماماً: <span className="text-[#10B981] font-mono tabular-nums font-bold">{toArabicDigits(stats.masteredCount)}</span>
            </div>
          </div>

          <div className="p-3 sm:px-4 space-y-1">
            <div className="text-xs text-slate-400">إجمالي الآيات المسجلة</div>
            <div className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-white">
              {toArabicDigits(stats.totalMemorizedAyahs)}
            </div>
            <div className="text-[11px] text-slate-400">آية قرآنية مباركة</div>
          </div>

          <div className="p-3 sm:px-4 space-y-1">
            <div className="text-xs text-slate-400">مستحق للمراجعة اليوم</div>
            <div
              className={`text-2xl sm:text-3xl font-black font-mono tabular-nums ${
                stats.dueCount > 0 ? 'text-amber-300' : 'text-[#10B981]'
              }`}
            >
              {toArabicDigits(stats.dueCount)}
            </div>
            <div className="text-[11px] text-slate-400">
              {stats.dueCount > 0 ? 'جاهز للمراجعة الآن' : 'أتممت مراجعاتك اليوم'}
            </div>
          </div>

          <div className="p-3 sm:px-4 space-y-1">
            <div className="text-xs text-slate-400">مواظبة الحفظ والمراجعة</div>
            <div className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-[#10B981]">
              {toArabicDigits(stats.streakDays)} يوم
            </div>
            <div className="text-[11px] text-slate-400">
              مراجعة اليوم: <span className="font-mono tabular-nums text-[#F3CA63] font-bold">{toArabicDigits(stats.todayReviewedCount)} آية</span>
            </div>
          </div>
        </div>

        {saveFeedback && (
          <div className="px-4 py-2.5 rounded-xl bg-[#083027] border border-[#10B981]/50 text-xs font-bold text-emerald-200">
            ✓ {saveFeedback}
          </div>
        )}
      </div>

      {/* Main Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Main Studio (2 cols) */}
        <div className="lg:col-span-2 space-y-5">
          {/* Surah & Range + Audio Loop Bar */}
          <div className="rounded-3xl bg-[#041b16]/95 border border-[#D4AF37]/40 p-4 sm:p-5 space-y-4">
            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-[11px] text-slate-400 shrink-0 pl-1">مختارات:</span>
              {HIFZ_QUICK_PRESETS.map((preset) => {
                const isSelected =
                  selectedSurahNumber === preset.surahNumber &&
                  startAyah === preset.startAyah &&
                  endAyah === preset.endAyah;
                return (
                  <button
                    key={preset.labelAr}
                    type="button"
                    onClick={() =>
                      handleSelectSurah(preset.surahNumber, preset.startAyah, preset.endAyah)
                    }
                    className={`min-h-[36px] px-3 py-1 rounded-xl text-xs font-bold border whitespace-nowrap shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-[#083027] border-[#10B981] text-emerald-300'
                        : 'bg-[#111C18] border-[#D4AF37]/25 text-slate-300 hover:border-[#D4AF37]/60'
                    }`}
                  >
                    {preset.labelAr}
                  </button>
                );
              })}
            </div>

            {/* Surah Search + Surah Select + Ayah From/To */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              <div className="sm:col-span-4 relative">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={surahSearch}
                  onChange={(e) => setSurahSearch(e.target.value)}
                  placeholder="ابحث باسم السورة..."
                  className="w-full min-h-[44px] pr-9 pl-3 rounded-xl bg-[#071410] border border-[#D4AF37]/30 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#F3CA63]"
                />
              </div>

              <div className="sm:col-span-4">
                <select
                  value={selectedSurahNumber}
                  onChange={(e) => handleSelectSurah(Number(e.target.value))}
                  aria-label="اختيار السورة"
                  className="w-full min-h-[44px] px-3 rounded-xl bg-[#111C18] border border-[#D4AF37]/40 text-xs sm:text-sm font-bold text-[#F3CA63] focus:outline-none focus:border-[#F3CA63]"
                >
                  {filteredSurahs.map((s) => (
                    <option key={s.number} value={s.number}>
                      {toArabicDigits(s.number)}. سورة {s.nameAr} ({toArabicDigits(s.ayahCount)} آية)
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-4 grid grid-cols-2 gap-2">
                <label className="flex items-center gap-1.5 px-2.5 rounded-xl bg-[#071410] border border-[#D4AF37]/30 text-xs">
                  <span className="text-slate-400 shrink-0">من</span>
                  <input
                    type="number"
                    min={1}
                    max={selectedSurahMeta.ayahCount}
                    value={startAyah}
                    onChange={(e) => {
                      const val = Math.max(1, Math.min(selectedSurahMeta.ayahCount, Number(e.target.value) || 1));
                      setStartAyah(val);
                      if (val > endAyah) setEndAyah(val);
                    }}
                    className="w-full min-h-[42px] bg-transparent text-center font-mono tabular-nums font-bold text-white focus:outline-none"
                  />
                </label>
                <label className="flex items-center gap-1.5 px-2.5 rounded-xl bg-[#071410] border border-[#D4AF37]/30 text-xs">
                  <span className="text-slate-400 shrink-0">إلى</span>
                  <input
                    type="number"
                    min={startAyah}
                    max={selectedSurahMeta.ayahCount}
                    value={endAyah}
                    onChange={(e) => {
                      const val = Math.max(startAyah, Math.min(selectedSurahMeta.ayahCount, Number(e.target.value) || startAyah));
                      setEndAyah(val);
                    }}
                    className="w-full min-h-[42px] bg-transparent text-center font-mono tabular-nums font-bold text-white focus:outline-none"
                  />
                </label>
              </div>
            </div>

            {/* Audio Loop Controls */}
            <div className="pt-3 border-t border-[#D4AF37]/20 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 flex-1">
                <Volume2 className="w-4 h-4 text-[#10B981] shrink-0" />
                <select
                  value={hifzState.activeReciterId}
                  onChange={(e) => {
                    stopAudio();
                    updateAndSave({ ...hifzState, activeReciterId: e.target.value });
                  }}
                  aria-label="اختيار القارئ للحفظ"
                  className="flex-1 min-w-[180px] min-h-[42px] px-3 rounded-xl bg-[#111C18] border border-[#D4AF37]/35 text-xs font-bold text-white focus:outline-none"
                >
                  {HIFZ_RECITERS.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nameAr}
                    </option>
                  ))}
                </select>

                {/* Repeat Count per Ayah */}
                <div className="flex items-center gap-1 bg-[#071410] p-1 rounded-xl border border-[#D4AF37]/25">
                  <span className="text-[11px] text-slate-400 px-1.5">تكرار الآية:</span>
                  {([1, 3, 5, 7, 10] as const).map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => updateAndSave({ ...hifzState, repeatPerAyah: cnt })}
                      className={`min-w-[34px] min-h-[34px] rounded-lg text-xs font-mono font-bold tabular-nums transition-colors ${
                        hifzState.repeatPerAyah === cnt
                          ? 'bg-[#D4AF37] text-slate-950'
                          : 'text-slate-300 hover:text-[#F3CA63]'
                      }`}
                    >
                      ×{toArabicDigits(cnt)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setLoopRange((v) => !v)}
                  className={`min-h-[42px] px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors ${
                    loopRange
                      ? 'bg-[#083027] border-[#10B981] text-emerald-300'
                      : 'bg-[#111C18] border-[#D4AF37]/25 text-slate-300'
                  }`}
                  title="إعادة تشغيل كامل المقطع تلقائياً"
                >
                  <Repeat className="w-3.5 h-3.5" />
                  <span>تكرار المقطع</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleStartAudioLoop()}
                  disabled={loadingAyahs || visibleAyahs.length === 0}
                  className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all whitespace-nowrap ${
                    isPlayingAudio
                      ? 'bg-rose-600 text-white'
                      : 'bg-[#10B981] text-slate-950 hover:brightness-105 disabled:opacity-40'
                  }`}
                >
                  {audioLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isPlayingAudio ? (
                    <Square className="w-3.5 h-3.5 fill-current" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current" />
                  )}
                  <span>{isPlayingAudio ? 'إيقاف التلاوة' : 'تشغيل التكرار'}</span>
                </button>
              </div>
            </div>

            {isPlayingAudio && activeAudioAyah !== null && (
              <div className="px-3.5 py-2 rounded-xl bg-[#08241C] border border-[#10B981]/40 text-xs text-[#10B981] font-bold flex items-center justify-between">
                <span>
                  يُتلى الآن: الآية {toArabicDigits(activeAudioAyah)} من سورة {selectedSurahMeta.nameAr}
                </span>
                <span className="font-mono tabular-nums">
                  التكرار {toArabicDigits(activeAudioRepeatIdx)} / {toArabicDigits(hifzState.repeatPerAyah)}
                </span>
              </div>
            )}
          </div>

          {/* Interactive Tasmi' Canvas */}
          <div className="rounded-3xl bg-[#041b16]/95 border border-[#D4AF37]/40 p-4 sm:p-6 space-y-5">
            {/* Mode Switcher + Font Size + Reveal Toggle */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#D4AF37]/20">
              <div className="flex items-center gap-1 bg-[#02110E] p-1 rounded-xl border border-[#D4AF37]/25 overflow-x-auto">
                {[
                  { id: 'read' as const, label: 'القراءة والحفظ' },
                  { id: 'gradual' as const, label: 'التسميع المتدرّج' },
                  { id: 'blind' as const, label: 'الاختبار الكامل' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setTasmiMode(m.id);
                      setRevealedAyahs({});
                      setRevealedWordKeys({});
                    }}
                    className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                      tasmiMode === m.id
                        ? 'bg-[#D4AF37] text-slate-950'
                        : 'text-slate-300 hover:text-[#F3CA63]'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                {tasmiMode !== 'read' && (
                  <button
                    type="button"
                    onClick={toggleRevealAllInCurrentMode}
                    className="min-h-[40px] px-3 py-1.5 rounded-xl bg-[#111C18] border border-[#D4AF37]/35 text-xs font-bold text-[#F3CA63] hover:bg-[#172822] flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>كشف / إخفاء الكل</span>
                  </button>
                )}

                <div className="flex items-center gap-1 bg-[#111C18] p-1 rounded-xl border border-[#D4AF37]/25">
                  <button
                    type="button"
                    onClick={() =>
                      updateAndSave({ ...hifzState, fontSize: Math.max(20, hifzState.fontSize - 2) })
                    }
                    className="min-w-[36px] min-h-[36px] rounded-lg text-xs font-bold text-slate-200 hover:text-[#F3CA63]"
                  >
                    أ-
                  </button>
                  <span className="text-xs font-mono tabular-nums text-slate-400 px-1">
                    {toArabicDigits(hifzState.fontSize)}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      updateAndSave({ ...hifzState, fontSize: Math.min(40, hifzState.fontSize + 2) })
                    }
                    className="min-w-[36px] min-h-[36px] rounded-lg text-xs font-bold text-slate-200 hover:text-[#F3CA63]"
                  >
                    أ+
                  </button>
                </div>
              </div>
            </div>

            {/* Surah Header */}
            <div className="text-center space-y-1 pb-2">
              <div className="font-amiri text-2xl text-[#F3CA63] font-bold">
                سورة {selectedSurahMeta.nameAr}
              </div>
              <div className="text-xs text-slate-400">
                {selectedSurahMeta.revelationType} · الآيات {toArabicDigits(startAyah)} إلى {toArabicDigits(endAyah)}
              </div>
              {selectedSurahNumber !== 9 && startAyah === 1 && selectedSurahNumber !== 1 && (
                <div className="font-amiri text-xl text-amber-100/90 pt-2">
                  بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                </div>
              )}
            </div>

            {/* Ayah List / Loading / Error */}
            {loadingAyahs ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-300">
                <Loader2 className="w-7 h-7 animate-spin text-[#D4AF37]" />
                <span className="text-sm">جاري تحميل آيات سورة {selectedSurahMeta.nameAr}...</span>
              </div>
            ) : loadError ? (
              <div className="py-10 text-center space-y-3">
                <p className="text-sm text-rose-300">{loadError}</p>
                <button
                  type="button"
                  onClick={() => setReloadNonce((n) => n + 1)}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-[#D4AF37] text-slate-950 text-xs font-black"
                >
                  إعادة المحاولة
                </button>
              </div>
            ) : (
              <div className="divide-y divide-[#D4AF37]/15">
                {visibleAyahs.map((ayah) => {
                  const isActiveAudio = activeAudioAyah === ayah.numberInSurah;
                  const isAyahRevealed = Boolean(revealedAyahs[ayah.numberInSurah]);
                  const grade = ayahGrades[ayah.numberInSurah];
                  const words = ayah.text.split(/\s+/).filter(Boolean);

                  return (
                    <div
                      key={ayah.numberInSurah}
                      className={`py-4 px-2 sm:px-3 rounded-2xl transition-colors space-y-3 ${
                        isActiveAudio ? 'bg-[#08241C]' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        {/* Ayah Content depending on tasmiMode */}
                        <div
                          className="flex-1 font-amiri leading-[2.2] text-amber-50 select-text"
                          style={{ fontSize: `${hifzState.fontSize}px` }}
                        >
                          {tasmiMode === 'read' && (
                            <span>
                              {ayah.text}{' '}
                              <span className="text-[#F3CA63] text-[0.8em]">
                                ﴿{toArabicDigits(ayah.numberInSurah)}﴾
                              </span>
                            </span>
                          )}

                          {tasmiMode === 'gradual' && (
                            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-2">
                              {words.map((word, wIdx) => {
                                const wKey = `${ayah.numberInSurah}_${wIdx}`;
                                const isShown =
                                  isAyahRevealed || wIdx === 0 || Boolean(revealedWordKeys[wKey]);

                                if (isShown) {
                                  return (
                                    <span
                                      key={wKey}
                                      className={
                                        wIdx === 0
                                          ? 'text-[#F3CA63]'
                                          : 'text-emerald-100'
                                      }
                                    >
                                      {word}
                                    </span>
                                  );
                                }

                                return (
                                  <button
                                    key={wKey}
                                    type="button"
                                    onClick={() =>
                                      setRevealedWordKeys((prev) => ({ ...prev, [wKey]: true }))
                                    }
                                    className="inline-flex items-center justify-center min-h-[34px] px-2.5 rounded-lg bg-[#081914] border border-dashed border-[#D4AF37]/40 text-xs font-sans text-slate-400 hover:border-[#F3CA63] hover:text-[#F3CA63] transition-colors"
                                    title="اضغط لكشف الكلمة"
                                  >
                                    ···
                                  </button>
                                );
                              })}
                              <span className="text-[#F3CA63] text-[0.8em]">
                                ﴿{toArabicDigits(ayah.numberInSurah)}﴾
                              </span>
                            </div>
                          )}

                          {tasmiMode === 'blind' && (
                            <div>
                              {isAyahRevealed ? (
                                <span>
                                  {ayah.text}{' '}
                                  <span className="text-[#F3CA63] text-[0.8em]">
                                    ﴿{toArabicDigits(ayah.numberInSurah)}﴾
                                  </span>
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setRevealedAyahs((prev) => ({
                                      ...prev,
                                      [ayah.numberInSurah]: true,
                                    }))
                                  }
                                  className="w-full min-h-[54px] px-4 py-3 rounded-2xl bg-[#071410] border border-dashed border-[#D4AF37]/45 text-sm font-sans text-[#F3CA63] hover:bg-[#0b221b] flex items-center justify-center gap-2 transition-colors"
                                >
                                  <Eye className="w-4 h-4" />
                                  <span>
                                    سمّع الآية رقم {toArabicDigits(ayah.numberInSurah)} ثم اضغط للكشف والتحقق
                                  </span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Quick Play From This Ayah */}
                        <button
                          type="button"
                          onClick={() => handleStartAudioLoop(ayah.numberInSurah)}
                          className={`min-w-[40px] min-h-[40px] rounded-xl border flex items-center justify-center shrink-0 transition-colors ${
                            isActiveAudio
                              ? 'bg-[#10B981] border-emerald-400 text-slate-950'
                              : 'bg-[#071410] border-[#D4AF37]/25 text-[#F3CA63] hover:bg-[#172822]'
                          }`}
                          title="الاستماع من هذه الآية"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </button>
                      </div>

                      {/* Self-Grading & Reveal Row for Gradual/Blind Modes */}
                      {tasmiMode !== 'read' && (
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() =>
                              setRevealedAyahs((prev) => ({
                                ...prev,
                                [ayah.numberInSurah]: !isAyahRevealed,
                              }))
                            }
                            className="min-h-[36px] px-3 py-1 rounded-lg bg-[#071410] border border-[#D4AF37]/25 text-xs text-slate-300 hover:text-[#F3CA63] flex items-center gap-1"
                          >
                            {isAyahRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            <span>{isAyahRevealed ? 'إخفاء الآية' : 'كشف الآية كاملة'}</span>
                          </button>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                setAyahGrades((prev) => ({
                                  ...prev,
                                  [ayah.numberInSurah]: 'pass',
                                }))
                              }
                              className={`min-h-[36px] px-3 py-1 rounded-lg border text-xs font-bold flex items-center gap-1 transition-colors ${
                                grade === 'pass'
                                  ? 'bg-[#10B981] border-emerald-400 text-slate-950'
                                  : 'bg-[#071410] border-[#10B981]/40 text-emerald-300 hover:bg-[#083027]'
                              }`}
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>متقن</span>
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setAyahGrades((prev) => ({
                                  ...prev,
                                  [ayah.numberInSurah]: 'retry',
                                }))
                              }
                              className={`min-h-[36px] px-3 py-1 rounded-lg border text-xs font-bold flex items-center gap-1 transition-colors ${
                                grade === 'retry'
                                  ? 'bg-amber-400 border-amber-300 text-slate-950'
                                  : 'bg-[#071410] border-[#D4AF37]/30 text-[#F3CA63] hover:bg-[#172822]'
                              }`}
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>يحتاج إعادة</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar (1 col): Spaced Repetition Queue & Daily Reminder */}
        <div className="space-y-5">
          {/* Spaced Repetition Review Schedule */}
          <div className="rounded-3xl bg-[#111C18] border border-[#D4AF37]/40 p-5 space-y-4">
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#D4AF37]/20">
              <div className="flex items-center gap-2 text-base font-bold font-amiri text-[#F3CA63]">
                <BookOpen className="w-4 h-4 text-[#10B981]" />
                <span>جدول المحفوظات والمراجعة</span>
              </div>
              <span className="text-xs font-mono tabular-nums text-slate-400">
                {toArabicDigits(sortedSegments.length)}
              </span>
            </div>

            {sortedSegments.length === 0 ? (
              <div className="py-5 text-center space-y-3">
                <p className="text-xs text-slate-300 leading-relaxed">
                  لم تضف أي مقطع لجدول المراجعة بعد. اختر السورة والآيات ثم اضغط <strong className="text-[#F3CA63]">حفظ المقطع في جدول المراجعة</strong> ليذكّرك النظام بمراجعتها في مواعيد التثبيت الذكية.
                </p>
                <button
                  type="button"
                  onClick={handleSaveCurrentSegment}
                  disabled={visibleAyahs.length === 0}
                  className="min-h-[40px] px-4 py-2 rounded-xl bg-[#083027] border border-[#10B981]/50 text-emerald-300 text-xs font-bold inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>أضف المقطع الحالي الآن</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3 max-h-[460px] overflow-y-auto pl-1">
                {sortedSegments.map((seg) => {
                  const todayKey = getTodayHifzDateKey();
                  const isDue = seg.nextReviewDate <= todayKey;

                  return (
                    <div
                      key={seg.id}
                      className={`p-3.5 rounded-2xl border space-y-2.5 transition-colors ${
                        isDue
                          ? 'bg-[#08241C] border-[#F3CA63]/60'
                          : 'bg-[#071410] border-[#D4AF37]/25'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-sm font-bold font-amiri text-[#F3CA63]">
                            سورة {seg.surahNameAr} · الآيات {toArabicDigits(seg.startAyah)}–{toArabicDigits(seg.endAyah)}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <span className={isDue ? 'text-amber-300 font-bold' : 'text-emerald-300'}>
                              {formatDueSummaryAr(seg.nextReviewDate)}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>{getMasteryLabelAr(seg.masteryLevel)}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono tabular-nums">
                              {toArabicDigits(seg.reviewCount)} مراجعات
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteSegment(seg.id)}
                          className="min-w-[32px] min-h-[32px] rounded-lg text-slate-500 hover:text-rose-300 flex items-center justify-center"
                          title="حذف المقطع من الجدول"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            handleSelectSurah(seg.surahNumber, seg.startAyah, seg.endAyah);
                            setTasmiMode('gradual');
                          }}
                          className="min-h-[36px] px-2.5 py-1 rounded-lg bg-[#111C18] border border-[#D4AF37]/35 text-[#F3CA63] hover:bg-[#172822] text-[11px] font-bold"
                        >
                          تسميع الآن
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReviewSegmentOutcome(seg, true)}
                          className="min-h-[36px] px-2.5 py-1 rounded-lg bg-[#10B981]/20 border border-[#10B981]/50 text-emerald-300 hover:bg-[#10B981]/30 text-[11px] font-bold flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          <span>تمت المراجعة</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReviewSegmentOutcome(seg, false)}
                          className="min-h-[36px] px-2.5 py-1 rounded-lg bg-[#111C18] border border-slate-700 text-slate-300 hover:text-amber-300 text-[11px] font-bold"
                        >
                          إعادة التثبيت
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Daily Review Reminder Box */}
          <div className="rounded-3xl bg-[#111C18] border border-[#D4AF37]/40 p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-base font-bold font-amiri text-[#F3CA63]">
                <Bell className="w-4 h-4 text-[#10B981]" />
                <span>تذكير المراجعة اليومي</span>
              </div>
              <button
                type="button"
                onClick={() =>
                  updateAndSave({ ...hifzState, reminderEnabled: !hifzState.reminderEnabled })
                }
                className={`min-h-[36px] px-3 py-1 rounded-xl text-xs font-bold border transition-colors ${
                  hifzState.reminderEnabled
                    ? 'bg-[#10B981] border-emerald-400 text-slate-950'
                    : 'bg-[#071410] border-[#D4AF37]/30 text-slate-300'
                }`}
              >
                {hifzState.reminderEnabled ? 'مفعّل' : 'مغلق'}
              </button>
            </div>

            <div className="flex items-center justify-between gap-2 text-xs text-slate-300">
              <span>وقت تنبيه المراجعة:</span>
              <input
                type="time"
                value={hifzState.reminderTime}
                onChange={(e) =>
                  updateAndSave({ ...hifzState, reminderTime: e.target.value || '18:30' })
                }
                className="min-h-[40px] px-3 rounded-xl bg-[#071410] border border-[#D4AF37]/35 font-mono text-white"
              />
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              يتم التنبيه تلقائياً عند حلول الوقت المحدد في حال وجود مقاطع مستحقة للمراجعة اليوم.
            </p>

            {onTestReminder && (
              <button
                type="button"
                onClick={onTestReminder}
                className="min-h-[40px] px-3 py-1.5 rounded-xl bg-[#071410] border border-[#D4AF37]/35 text-[#F3CA63] hover:bg-[#172822] text-xs font-bold flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>معاينة تنبيه المراجعة</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
