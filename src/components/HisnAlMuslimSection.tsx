import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Heart,
  Volume2,
  Square,
  RotateCcw,
  CheckCircle2,
  X,
  Sun,
  Moon,
  Sparkles,
  Plane,
  BookOpen,
  BedDouble,
  Home,
  ShieldAlert,
  Utensils,
  HandHeart,
  Copy,
  Check,
} from 'lucide-react';
import { HISN_AL_MUSLIM_ADHKAR } from '../utils/islamicData';
import { DhikrItem } from '../types';
import { adhanPlayer, AudioPlayerState, ActiveAudioType } from '../utils/audioAdhan';

type HisnCategoryKey =
  | 'morning'
  | 'evening'
  | 'after_prayer'
  | 'travel'
  | 'sleep_wake'
  | 'home_mosque'
  | 'distress_healing'
  | 'food_weather'
  | 'forgiveness_dua';

type HisnFilterCategory = 'all' | HisnCategoryKey | 'favorites';

const FAVORITES_STORAGE_KEY = 'hisn_muslim_favorites';
const DAILY_COUNTS_STORAGE_KEY = 'hisn_muslim_daily_counts';

function getTodayDateKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function loadDailyCounts(): Record<string, number> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(DAILY_COUNTS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === 'object' &&
      parsed.date === getTodayDateKey() &&
      parsed.counts &&
      typeof parsed.counts === 'object'
    ) {
      return parsed.counts as Record<string, number>;
    }
  } catch {
    // Ignore malformed storage
  }
  return {};
}

const CATEGORY_META: Record<HisnCategoryKey, { label: string; icon: React.ReactNode }> = {
  morning: { label: 'أذكار الصباح', icon: <Sun className="w-3.5 h-3.5 text-[#fbbf24]" /> },
  evening: { label: 'أذكار المساء', icon: <Moon className="w-3.5 h-3.5 text-emerald-300" /> },
  after_prayer: { label: 'أذكار بعد الصلاة', icon: <Sparkles className="w-3.5 h-3.5 text-[#e5b869]" /> },
  travel: { label: 'أذكار السفر', icon: <Plane className="w-3.5 h-3.5 text-teal-300" /> },
  sleep_wake: { label: 'النوم والاستيقاظ', icon: <BedDouble className="w-3.5 h-3.5 text-[#fbbf24]" /> },
  home_mosque: { label: 'المنزل والمسجد والوضوء', icon: <Home className="w-3.5 h-3.5 text-emerald-300" /> },
  distress_healing: { label: 'الهم والشفاء والاستخارة', icon: <ShieldAlert className="w-3.5 h-3.5 text-[#e5b869]" /> },
  food_weather: { label: 'الطعام واللباس والمطر', icon: <Utensils className="w-3.5 h-3.5 text-teal-300" /> },
  forgiveness_dua: { label: 'الاستغفار وجوامع الدعاء', icon: <HandHeart className="w-3.5 h-3.5 text-[#fbbf24]" /> },
};

/**
 * Strips Arabic tashkeel (diacritics) and normalizes Alef/Teh Marbuta variants
 * so users can search smoothly without typing harakat.
 */
function normalizeArabic(input: string): string {
  return input
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .trim()
    .toLowerCase();
}

export const HisnAlMuslimSection: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<HisnFilterCategory>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [favorites, setFavorites] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch {
      // Ignore malformed storage
    }
    return [];
  });
  const [counts, setCounts] = useState<Record<string, number>>(() => loadDailyCounts());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [playerState, setPlayerState] = useState<AudioPlayerState>('idle');
  const [activeAudioType, setActiveAudioType] = useState<ActiveAudioType>('none');
  const [playingId, setPlayingId] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
    } catch {
      // Ignore storage quota issues
    }
  }, [favorites]);

  // Persist repetition counters automatically per current date
  useEffect(() => {
    try {
      localStorage.setItem(
        DAILY_COUNTS_STORAGE_KEY,
        JSON.stringify({ date: getTodayDateKey(), counts })
      );
    } catch {
      // Ignore storage quota issues
    }
  }, [counts]);

  useEffect(() => {
    const unsub = adhanPlayer.subscribe({
      onStateChange: (st, type) => {
        setPlayerState(st);
        setActiveAudioType(type);
        if (st === 'idle') {
          setPlayingId(null);
        }
      },
    });
    return () => unsub();
  }, []);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleCopyDhikr = async (item: DhikrItem) => {
    const lines = [
      item.title ? `${item.title}:` : '',
      item.text,
      item.source ? `— ${item.source}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    try {
      await navigator.clipboard.writeText(lines);
      setCopiedId(item.id);
      window.setTimeout(() => {
        setCopiedId((prev) => (prev === item.id ? null : prev));
      }, 2000);
    } catch {
      // Clipboard unavailable
    }
  };

  const handleIncrement = (item: DhikrItem) => {
    adhanPlayer.playChime();
    setCounts((prev) => {
      const current = prev[item.id] || 0;
      if (current < item.count) {
        return { ...prev, [item.id]: current + 1 };
      }
      return prev;
    });
  };

  const handleResetCount = (id: string) => {
    setCounts((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const handleResetAllCounts = () => {
    setCounts({});
  };

  const handleToggleAudio = (item: DhikrItem) => {
    if (
      playingId === item.id &&
      (playerState === 'playing' || playerState === 'loading') &&
      activeAudioType === 'adhkar'
    ) {
      adhanPlayer.stop();
      setPlayingId(null);
    } else {
      setPlayingId(item.id);
      void adhanPlayer.playShortDhikrClip(item.id, 'rotate', item.text);
    }
  };

  const filteredAdhkar = useMemo(() => {
    const normalizedQuery = normalizeArabic(searchQuery);
    return HISN_AL_MUSLIM_ADHKAR.filter((item) => {
      if (activeCategory === 'favorites') {
        if (!favorites.includes(item.id)) return false;
      } else if (activeCategory !== 'all' && item.category !== activeCategory) {
        return false;
      }

      if (!normalizedQuery) return true;
      const haystack = normalizeArabic(
        `${item.title || ''} ${item.text} ${item.virtue || ''} ${item.source || ''}`
      );
      return haystack.includes(normalizedQuery);
    });
  }, [activeCategory, searchQuery, favorites]);

  const completedCount = useMemo(() => {
    return HISN_AL_MUSLIM_ADHKAR.filter((item) => (counts[item.id] || 0) >= item.count).length;
  }, [counts]);

  const hasAnyProgress = useMemo(() => {
    return Object.values(counts).some((val) => val > 0);
  }, [counts]);

  const categoryCounts = useMemo(() => {
    const map: Record<HisnCategoryKey, number> = {
      morning: 0,
      evening: 0,
      after_prayer: 0,
      travel: 0,
      sleep_wake: 0,
      home_mosque: 0,
      distress_healing: 0,
      food_weather: 0,
      forgiveness_dua: 0,
    };
    for (const item of HISN_AL_MUSLIM_ADHKAR) {
      if (item.category in map) {
        map[item.category as HisnCategoryKey] += 1;
      }
    }
    return {
      all: HISN_AL_MUSLIM_ADHKAR.length,
      ...map,
      favorites: favorites.length,
    };
  }, [favorites]);

  const filterTabs: { id: HisnFilterCategory; label: string; count: number; icon: React.ReactNode }[] = [
    { id: 'all', label: 'الكل', count: categoryCounts.all, icon: <BookOpen className="w-3.5 h-3.5" /> },
    { id: 'morning', label: 'أذكار الصباح', count: categoryCounts.morning, icon: <Sun className="w-3.5 h-3.5" /> },
    { id: 'evening', label: 'أذكار المساء', count: categoryCounts.evening, icon: <Moon className="w-3.5 h-3.5" /> },
    { id: 'after_prayer', label: 'أذكار بعد الصلاة', count: categoryCounts.after_prayer, icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: 'sleep_wake', label: 'النوم والاستيقاظ', count: categoryCounts.sleep_wake, icon: <BedDouble className="w-3.5 h-3.5" /> },
    { id: 'home_mosque', label: 'المنزل والمسجد والوضوء', count: categoryCounts.home_mosque, icon: <Home className="w-3.5 h-3.5" /> },
    { id: 'distress_healing', label: 'الهم والشفاء والاستخارة', count: categoryCounts.distress_healing, icon: <ShieldAlert className="w-3.5 h-3.5" /> },
    { id: 'food_weather', label: 'الطعام واللباس والمطر', count: categoryCounts.food_weather, icon: <Utensils className="w-3.5 h-3.5" /> },
    { id: 'forgiveness_dua', label: 'الاستغفار وجوامع الدعاء', count: categoryCounts.forgiveness_dua, icon: <HandHeart className="w-3.5 h-3.5" /> },
    { id: 'travel', label: 'أذكار السفر', count: categoryCounts.travel, icon: <Plane className="w-3.5 h-3.5" /> },
    { id: 'favorites', label: 'المفضلة', count: categoryCounts.favorites, icon: <Heart className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Architectural Emerald & Gold Header Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-[#e5b869]/40 bg-gradient-to-br from-[#041f1a]/95 via-[#072e26]/90 to-[#031410]/95 p-6 md:p-8 shadow-[0_18px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl">
        {/* Inner Double Hairline Gold Frame */}
        <div className="absolute inset-2 rounded-[20px] border border-[#e5b869]/15 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(229,184,105,0.1)_0%,transparent_65%)] pointer-events-none" />

        {/* Subtle Corner Arabesque Ornaments */}
        <svg
          className="absolute top-3 right-3 w-12 h-12 text-[#e5b869]/25 pointer-events-none"
          viewBox="0 0 48 48"
          fill="none"
          aria-hidden="true"
        >
          <path d="M48 2H18C9.16 2 2 9.16 2 18V48" stroke="currentColor" strokeWidth="1.2" />
          <path d="M40 8H20C13.37 8 8 13.37 8 20V40" stroke="currentColor" strokeWidth="0.9" />
          <circle cx="14" cy="14" r="2.2" fill="currentColor" />
        </svg>
        <svg
          className="absolute top-3 left-3 w-12 h-12 text-[#e5b869]/25 pointer-events-none -scale-x-100"
          viewBox="0 0 48 48"
          fill="none"
          aria-hidden="true"
        >
          <path d="M48 2H18C9.16 2 2 9.16 2 18V48" stroke="currentColor" strokeWidth="1.2" />
          <path d="M40 8H20C13.37 8 8 13.37 8 20V40" stroke="currentColor" strokeWidth="0.9" />
          <circle cx="14" cy="14" r="2.2" fill="currentColor" />
        </svg>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 text-right">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-[#e5b869] tracking-wide">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="5" y="5" width="14" height="14" stroke="#fbbf24" strokeWidth="1.5" />
                <rect x="5" y="5" width="14" height="14" stroke="#fbbf24" strokeWidth="1.5" transform="rotate(45 12 12)" />
              </svg>
              <span>موسوعة الأذكار المأثورة من الكتاب والسنة</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-[#fbbf24] font-amiri tracking-wide">
              حصن المسلم الشامل
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              يضم أذكار الصباح والمساء وبعد الصلاة، وأذكار النوم والاستيقاظ، والمنزل والمسجد والوضوء، وأدعية الهم والشفاء والاستخارة، والطعام والمطر والاستغفار والسفر، مع حفظ عدّادك اليومي تلقائياً.
            </p>
          </div>

          {/* Summary Metrics & Quick Reset */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="bg-[#031612]/90 border border-[#e5b869]/30 rounded-2xl px-4 py-2.5 text-center min-w-[110px]">
              <span className="block text-[11px] text-slate-400">المفضلة المحفوظة</span>
              <span className="text-xl font-bold text-[#fbbf24] tabular-nums">{favorites.length}</span>
            </div>
            <div className="bg-[#031612]/90 border border-emerald-500/35 rounded-2xl px-4 py-2.5 text-center min-w-[110px]">
              <span className="block text-[11px] text-slate-400">أُنجز اليوم</span>
              <span className="text-xl font-bold text-emerald-300 tabular-nums">
                {completedCount} / {HISN_AL_MUSLIM_ADHKAR.length}
              </span>
            </div>
            {hasAnyProgress && (
              <button
                onClick={handleResetAllCounts}
                title="تصفير جميع عدادات اليوم"
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-[#05261f] border border-[#e5b869]/35 text-xs font-semibold text-[#e5b869] hover:border-[#fbbf24] hover:text-[#fbbf24] transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>تصفير الكل</span>
              </button>
            )}
          </div>
        </div>

        {/* Search & Category Controls */}
        <div className="relative z-10 mt-6 pt-5 border-t border-[#e5b869]/20 space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#e5b869] absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث في الأذكار والأدعية أو فضل الذكر (بدون الحاجة للتشكيل)..."
              aria-label="بحث في أذكار حصن المسلم"
              className="w-full bg-[#031511]/90 border border-[#e5b869]/35 focus:border-[#fbbf24] rounded-2xl pr-11 pl-10 py-3 text-sm text-white placeholder:text-slate-400 outline-none transition-colors shadow-inner"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="مسح البحث"
                className="absolute left-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-[#fbbf24] hover:bg-[#083027] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Filter Bar */}
          <div className="flex flex-wrap items-center gap-2">
            {filterTabs.map((tab) => {
              const isActive = activeCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveCategory(tab.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-[13px] font-semibold border transition-all whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-gradient-to-r from-[#e5b869]/25 via-emerald-700/40 to-teal-800/45 text-[#fbbf24] border-[#e5b869]/70 shadow-[0_0_16px_rgba(229,184,105,0.2)] font-bold'
                      : 'bg-[#031612]/80 border-[#e5b869]/20 text-slate-300 hover:text-[#fbbf24] hover:border-[#e5b869]/45'
                  }`}
                >
                  <span className={isActive ? 'text-[#fbbf24]' : 'text-[#e5b869]/80'}>
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                  <span
                    className={`text-[11px] tabular-nums px-1.5 py-0.5 rounded-md ${
                      isActive
                        ? 'bg-[#fbbf24]/20 text-[#fbbf24]'
                        : 'bg-[#06261f] text-slate-400'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Mihrab Cards Grid */}
      {filteredAdhkar.length === 0 ? (
        <div className="relative rounded-t-[88px] rounded-b-3xl border border-[#e5b869]/35 bg-gradient-to-b from-[#062922]/90 via-[#041d18]/90 to-[#03120f]/95 p-10 text-center max-w-xl mx-auto shadow-xl">
          <div className="absolute inset-2 rounded-t-[80px] rounded-b-2xl border border-[#e5b869]/15 pointer-events-none" />
          <div className="relative z-10 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#041f1a] border border-[#e5b869]/45 flex items-center justify-center mx-auto text-[#fbbf24]">
              {activeCategory === 'favorites' ? (
                <Heart className="w-6 h-6" />
              ) : (
                <Search className="w-6 h-6" />
              )}
            </div>
            <h3 className="text-2xl font-bold font-amiri text-[#fbbf24]">
              {activeCategory === 'favorites' && !searchQuery
                ? 'لا توجد أذكار محفوظة في المفضلة بعد'
                : 'لم يتم العثور على أذكار مطابقة'}
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              {activeCategory === 'favorites' && !searchQuery
                ? 'اضغط على أيقونة القلب أعلى أي بطاقة محراب لحفظ الذكر والرجوع إليه سريعاً في كل وقت.'
                : 'جرّب البحث بكلمة أخرى أو تصفّح جميع فئات حصن المسلم.'}
            </p>
            <div className="pt-2 flex items-center justify-center gap-2">
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-4 py-2 rounded-xl bg-[#072e26] border border-[#e5b869]/50 text-xs font-bold text-[#fbbf24] hover:bg-[#0a3c32] transition-colors"
                >
                  مسح نص البحث
                </button>
              )}
              {activeCategory !== 'all' && (
                <button
                  onClick={() => setActiveCategory('all')}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#e5b869]/25 to-emerald-800/50 border border-[#fbbf24]/60 text-xs font-bold text-[#fbbf24] hover:brightness-110 transition-all"
                >
                  عرض جميع الأذكار
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {filteredAdhkar.map((item) => {
            const currentCount = counts[item.id] || 0;
            const isCompleted = currentCount >= item.count;
            const isFavorited = favorites.includes(item.id);
            const isCopied = copiedId === item.id;
            const isPlayingThis =
              playingId === item.id &&
              (playerState === 'playing' || playerState === 'loading') &&
              activeAudioType === 'adhkar';
            const catKey: HisnCategoryKey =
              item.category in CATEGORY_META
                ? (item.category as HisnCategoryKey)
                : 'morning';
            const catMeta = CATEGORY_META[catKey];
            const progressPercent = Math.min(100, Math.round((currentCount / item.count) * 100));

            return (
              <article
                key={item.id}
                className={`relative rounded-t-[84px] sm:rounded-t-[100px] rounded-b-3xl p-6 sm:p-7 pt-14 border transition-all duration-300 flex flex-col justify-between backdrop-blur-md overflow-hidden ${
                  isCompleted
                    ? 'bg-gradient-to-b from-[#073a30]/95 via-[#05261f]/95 to-[#03130f]/95 border-[#fbbf24]/80 shadow-[0_0_32px_rgba(251,191,36,0.18)]'
                    : 'bg-gradient-to-b from-[#062922]/92 via-[#041d18]/92 to-[#03120f]/95 border-[#e5b869]/35 hover:border-[#e5b869]/65 shadow-[0_12px_32px_rgba(0,0,0,0.45)]'
                }`}
              >
                {/* Inner Double Golden Mihrab Arch Hairline */}
                <div
                  className={`absolute inset-2 rounded-t-[76px] sm:rounded-t-[92px] rounded-b-2xl border pointer-events-none ${
                    isCompleted ? 'border-[#fbbf24]/45' : 'border-[#e5b869]/15'
                  }`}
                />

                {/* Warm Golden Top Radiance Inside the Mihrab */}
                <div
                  className={`absolute inset-0 pointer-events-none ${
                    isCompleted
                      ? 'bg-[radial-gradient(ellipse_at_top,rgba(251,191,36,0.16)_0%,transparent_62%)]'
                      : 'bg-[radial-gradient(ellipse_at_top,rgba(229,184,105,0.08)_0%,transparent_60%)]'
                  }`}
                />

                {/* Golden 8-Pointed Crown Medallion at Arch Apex */}
                <div className="absolute top-3.5 left-1/2 -translate-x-1/2 z-10 flex items-center justify-center">
                  <div
                    className={`w-8 h-8 rounded-full bg-[#041f1a] border flex items-center justify-center shadow-[0_0_14px_rgba(229,184,105,0.28)] ${
                      isCompleted ? 'border-[#fbbf24]' : 'border-[#e5b869]/55'
                    }`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <rect
                        x="5"
                        y="5"
                        width="14"
                        height="14"
                        stroke="#fbbf24"
                        strokeWidth="1.4"
                        fill="#fbbf24"
                        fillOpacity="0.18"
                      />
                      <rect
                        x="5"
                        y="5"
                        width="14"
                        height="14"
                        stroke="#fbbf24"
                        strokeWidth="1.4"
                        fill="#fbbf24"
                        fillOpacity="0.18"
                        transform="rotate(45 12 12)"
                      />
                      <circle cx="12" cy="12" r="2" fill="#fef08a" />
                    </svg>
                  </div>
                </div>

                {/* Top Metadata & Action Row */}
                <div className="relative z-10 space-y-4">
                  <div className="flex items-start justify-between gap-3 pt-1">
                    <div className="text-right space-y-1">
                      <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#e5b869]">
                        {catMeta.icon}
                        <span>{catMeta.label}</span>
                      </div>
                      {item.title && (
                        <h3 className="text-xl sm:text-2xl font-bold font-amiri text-[#fbbf24] leading-snug">
                          {item.title}
                        </h3>
                      )}
                    </div>

                    {/* Action Controls: Copy, Audio & Favorite */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCopyDhikr(item)}
                        title={isCopied ? 'تم النسخ' : 'نسخ الذكر'}
                        aria-label={isCopied ? 'تم نسخ الذكر' : 'نسخ نص الذكر'}
                        className={`p-2 rounded-xl border transition-all ${
                          isCopied
                            ? 'bg-emerald-950/90 border-emerald-400 text-emerald-300'
                            : 'bg-[#041d17] border-[#e5b869]/30 text-slate-300 hover:border-[#fbbf24] hover:text-[#fbbf24]'
                        }`}
                      >
                        {isCopied ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleAudio(item)}
                        title={isPlayingThis ? 'إيقاف الاستماع' : 'الاستماع للذكر'}
                        aria-label={isPlayingThis ? 'إيقاف الاستماع للذكر' : 'الاستماع للذكر'}
                        className={`p-2 rounded-xl border transition-all ${
                          isPlayingThis
                            ? 'bg-rose-900/75 border-rose-400 text-rose-200'
                            : 'bg-[#041d17] border-[#e5b869]/30 text-emerald-300 hover:border-[#fbbf24] hover:text-[#fbbf24]'
                        }`}
                      >
                        {isPlayingThis ? (
                          <Square className="w-4 h-4 fill-current" />
                        ) : (
                          <Volume2 className="w-4 h-4" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleFavorite(item.id)}
                        title={isFavorited ? 'إزالة من المفضلة' : 'حفظ في المفضلة'}
                        aria-label={isFavorited ? 'إزالة الذكر من المفضلة' : 'حفظ الذكر في المفضلة'}
                        className={`p-2 rounded-xl border transition-all ${
                          isFavorited
                            ? 'bg-[#fbbf24]/20 border-[#fbbf24] text-[#fbbf24] shadow-[0_0_14px_rgba(251,191,36,0.28)]'
                            : 'bg-[#041d17] border-[#e5b869]/30 text-slate-300 hover:border-[#fbbf24] hover:text-[#fbbf24]'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Dhikr Text */}
                  <p className="font-amiri text-xl sm:text-[22px] leading-[2.05] text-white text-center px-1 sm:px-2 py-2 select-text">
                    {item.text}
                  </p>

                  {/* Virtue & Source */}
                  {(item.virtue || item.source) && (
                    <div className="pt-3 border-t border-[#e5b869]/15 space-y-1 text-right">
                      {item.virtue && (
                        <p className="text-xs text-slate-300 leading-relaxed">
                          <span className="text-[#e5b869] font-bold">الفضل: </span>
                          {item.virtue}
                        </p>
                      )}
                      {item.source && (
                        <p className="text-[11px] text-emerald-300/80 font-medium">
                          {item.source}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom Interactive Counter Controls */}
                <div className="relative z-10 mt-5 pt-4 border-t border-[#e5b869]/20 space-y-2.5">
                  {/* Thin Progress Strip */}
                  <div className="w-full h-1.5 rounded-full bg-[#02100d] overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isCompleted
                          ? 'bg-[#fbbf24]'
                          : 'bg-gradient-to-l from-[#fbbf24] to-emerald-400'
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleIncrement(item)}
                      disabled={isCompleted}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold border transition-all ${
                        isCompleted
                          ? 'bg-emerald-950/90 border-emerald-500/70 text-emerald-300 cursor-default'
                          : 'bg-gradient-to-r from-[#09382e] to-[#062820] border-[#e5b869]/55 text-[#fbbf24] hover:border-[#fbbf24] hover:from-[#0c473b] hover:to-[#08342a] active:scale-[0.99]'
                      }`}
                    >
                      {isCompleted ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>أتممت التكرار ({item.count})</span>
                        </>
                      ) : (
                        <>
                          <span>تسبيح / تكرار</span>
                          <span className="font-mono tabular-nums text-white bg-[#031511]/85 border border-[#e5b869]/35 px-2 py-0.5 rounded-lg">
                            {currentCount} / {item.count}
                          </span>
                        </>
                      )}
                    </button>

                    {currentCount > 0 && (
                      <button
                        type="button"
                        onClick={() => handleResetCount(item.id)}
                        title="إعادة العد"
                        aria-label="إعادة عداد الذكر"
                        className="p-2.5 rounded-xl bg-[#041d17] border border-[#e5b869]/30 text-slate-300 hover:border-[#fbbf24] hover:text-[#fbbf24] transition-colors shrink-0"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
