import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Check,
  Sun,
  Moon,
  Maximize2,
  Minimize2,
  RotateCcw,
} from 'lucide-react';
import {
  PrayerWirdInfo,
  TOTAL_MUSHAF_PAGES,
  getJuzNameForPage,
  toArabicDigits,
} from '../utils/khatmaData';

interface QuranWirdModalProps {
  isOpen: boolean;
  onClose: () => void;
  wird: PrayerWirdInfo;
  prayerNameAr: string;
  isCompleted: boolean;
  onToggleComplete: () => void;
}

interface AyahItem {
  number: number;
  text: string;
  surah: {
    number: number;
    name: string;
    englishName: string;
    revelationType?: string;
    numberOfAyahs?: number;
  };
  numberInSurah: number;
  juz: number;
  page: number;
}

interface SurahSegment {
  surahNumber: number;
  surahName: string;
  revelationType?: string;
  startsOnThisPage: boolean;
  ayahs: AyahItem[];
}

type MushafTheme = 'cream' | 'emerald';

const MUSHAF_THEME_KEY = 'mushaf_wird_theme';
const MUSHAF_FONT_SIZE_KEY = 'mushaf_wird_font_size';

const mushafPageCache = new Map<number, AyahItem[]>();

function normalizeArabicBase(input: string): string {
  return input
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .trim();
}

function stripLeadingBismillah(
  text: string,
  surahNumber: number,
  ayahNumberInSurah: number
): string {
  if (surahNumber === 1 || surahNumber === 9 || ayahNumberInSurah !== 1) {
    return text;
  }
  const tokens = text.trim().split(/\s+/);
  if (tokens.length <= 4) return text;
  const firstFour = tokens.slice(0, 4).map(normalizeArabicBase);
  if (
    firstFour[0] === 'بسم' &&
    firstFour[1] === 'الله' &&
    firstFour[2] === 'الرحمن' &&
    firstFour[3] === 'الرحيم'
  ) {
    return tokens.slice(4).join(' ').trim();
  }
  return text;
}

async function fetchMushafPage(page: number): Promise<AyahItem[]> {
  const cached = mushafPageCache.get(page);
  if (cached) return cached;

  const res = await fetch(`https://api.alquran.cloud/v1/page/${page}/quran-uthmani`);
  if (!res.ok) {
    throw new Error('تعذر تحميل صفحة المصحف الشريف');
  }
  const data = await res.json();
  if (data && data.code === 200 && data.data && Array.isArray(data.data.ayahs)) {
    mushafPageCache.set(page, data.data.ayahs);
    return data.data.ayahs as AyahItem[];
  }
  throw new Error('تعذر تحميل صفحة المصحف الشريف');
}

const MushafCornerOrnament: React.FC<{
  position: 'tr' | 'tl' | 'br' | 'bl';
  strokeColor: string;
}> = ({ position, strokeColor }) => {
  const posClass =
    position === 'tr'
      ? 'top-1.5 right-1.5 rotate-0'
      : position === 'tl'
        ? 'top-1.5 left-1.5 -scale-x-100'
        : position === 'br'
          ? 'bottom-1.5 right-1.5 -scale-y-100'
          : 'bottom-1.5 left-1.5 -scale-x-100 -scale-y-100';

  return (
    <svg
      width="34"
      height="34"
      viewBox="0 0 36 36"
      fill="none"
      aria-hidden="true"
      className={`pointer-events-none absolute ${posClass} opacity-80`}
    >
      <path
        d="M34 2H14C7.373 2 2 7.373 2 14V34"
        stroke={strokeColor}
        strokeWidth="1.4"
      />
      <path
        d="M30 6H16C10.477 6 6 10.477 6 16V30"
        stroke={strokeColor}
        strokeWidth="0.9"
        strokeOpacity="0.65"
      />
      <path
        d="M11 6L13.5 11L11 16L8.5 11L11 6Z"
        stroke={strokeColor}
        strokeWidth="0.9"
        fill={strokeColor}
        fillOpacity="0.16"
      />
      <circle cx="6.5" cy="6.5" r="2.2" fill={strokeColor} fillOpacity="0.75" />
    </svg>
  );
};

export const QuranWirdModal: React.FC<QuranWirdModalProps> = ({
  isOpen,
  onClose,
  wird,
  prayerNameAr,
  isCompleted,
  onToggleComplete,
}) => {
  const [currentPage, setCurrentPage] = useState<number>(wird.startPage);
  const [ayahs, setAyahs] = useState<AyahItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [reloadNonce, setReloadNonce] = useState<number>(0);

  const [mushafTheme, setMushafTheme] = useState<MushafTheme>(() => {
    if (typeof window === 'undefined') return 'cream';
    const saved = localStorage.getItem(MUSHAF_THEME_KEY);
    return saved === 'emerald' ? 'emerald' : 'cream';
  });

  const [fontSize, setFontSize] = useState<number>(() => {
    if (typeof window === 'undefined') return 26;
    const saved = Number(localStorage.getItem(MUSHAF_FONT_SIZE_KEY));
    return Number.isFinite(saved) && saved >= 20 && saved <= 40 ? saved : 26;
  });

  const [barsVisible, setBarsVisible] = useState<boolean>(true);
  const [flipDirection, setFlipDirection] = useState<'none' | 'next' | 'prev'>('none');

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  useEffect(() => {
    setCurrentPage(wird.startPage);
    setBarsVisible(true);
    setFlipDirection('none');
  }, [wird.startPage, isOpen]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(MUSHAF_THEME_KEY, mushafTheme);
  }, [mushafTheme]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(MUSHAF_FONT_SIZE_KEY, String(fontSize));
  }, [fontSize]);

  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    const cached = mushafPageCache.get(currentPage);

    if (cached) {
      setAyahs(cached);
      setLoading(false);
      setError('');
    } else {
      setLoading(true);
      setError('');
    }

    fetchMushafPage(currentPage)
      .then((list) => {
        if (!isMounted) return;
        setAyahs(list);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        if (!cached) {
          setError(err instanceof Error ? err.message : 'حدث خطأ في الاتصال بالإنترنت');
        }
        setLoading(false);
      });

    // Silently prefetch adjacent pages inside this Wird
    const nextCandidate = currentPage + 1;
    if (nextCandidate <= wird.endPage && nextCandidate <= TOTAL_MUSHAF_PAGES) {
      fetchMushafPage(nextCandidate).catch(() => {});
    }
    const prevCandidate = currentPage - 1;
    if (prevCandidate >= wird.startPage && prevCandidate >= 1) {
      fetchMushafPage(prevCandidate).catch(() => {});
    }

    return () => {
      isMounted = false;
    };
  }, [currentPage, isOpen, reloadNonce, wird.startPage, wird.endPage]);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [currentPage]);

  useEffect(() => {
    if (flipDirection === 'none') return;
    const t = window.setTimeout(() => setFlipDirection('none'), 220);
    return () => window.clearTimeout(t);
  }, [flipDirection]);

  const handlePrevPage = useCallback(() => {
    setCurrentPage((p) => {
      if (p <= wird.startPage) return p;
      setFlipDirection('prev');
      return p - 1;
    });
  }, [wird.startPage]);

  const handleNextPage = useCallback(() => {
    setCurrentPage((p) => {
      if (p >= wird.endPage) return p;
      setFlipDirection('next');
      return p + 1;
    });
  }, [wird.endPage]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handleNextPage();
      } else if (e.key === 'ArrowRight') {
        handlePrevPage();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose, handleNextPage, handlePrevPage]);

  const surahSegments = useMemo<SurahSegment[]>(() => {
    if (ayahs.length === 0) return [];
    const segments: SurahSegment[] = [];
    for (const ayah of ayahs) {
      const lastSeg = segments[segments.length - 1];
      if (!lastSeg || lastSeg.surahNumber !== ayah.surah.number) {
        segments.push({
          surahNumber: ayah.surah.number,
          surahName: ayah.surah.name,
          revelationType: ayah.surah.revelationType,
          startsOnThisPage: ayah.numberInSurah === 1,
          ayahs: [ayah],
        });
      } else {
        lastSeg.ayahs.push(ayah);
      }
    }
    return segments;
  }, [ayahs]);

  const pageSurahsLabel = useMemo(() => {
    if (surahSegments.length === 0) return wird.surahLabel;
    return surahSegments.map((s) => s.surahName).join(' · ');
  }, [surahSegments, wird.surahLabel]);

  const juzName = useMemo(() => getJuzNameForPage(currentPage), [currentPage]);

  const wirdPages = useMemo(() => {
    const pages: number[] = [];
    for (let p = wird.startPage; p <= wird.endPage; p++) {
      pages.push(p);
    }
    return pages;
  }, [wird.startPage, wird.endPage]);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length !== 1) return;
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now(),
    };
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start || e.changedTouches.length !== 1) return;

    const dx = e.changedTouches[0].clientX - start.x;
    const dy = e.changedTouches[0].clientY - start.y;
    const elapsed = Date.now() - start.time;

    // Require clear horizontal intent so vertical reading scroll never misfires
    if (elapsed < 700 && Math.abs(dx) > 56 && Math.abs(dx) > Math.abs(dy) * 1.35) {
      if (dx > 0) {
        // RTL Mushaf: dragging right pulls the left-hand next page into view
        handleNextPage();
      } else {
        handlePrevPage();
      }
    }
  };

  const handleCanvasTap = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement | null;
    if (target?.closest('button, a, input, [role="button"]')) return;
    const selectedText = window.getSelection()?.toString().trim();
    if (selectedText) return;
    setBarsVisible((v) => !v);
  };

  if (!isOpen) return null;

  const isCream = mushafTheme === 'cream';
  const isFatihaOnlyPage = currentPage === 1 && surahSegments.length === 1 && surahSegments[0].surahNumber === 1;
  const totalPagesCount = Math.max(1, wird.endPage - wird.startPage + 1);
  const currentStepInWird = currentPage - wird.startPage + 1;

  const ornamentStroke = isCream ? '#B88928' : '#D4AF37';

  return (
    <div
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-label={`مصحف وِرد صلاة ${prayerNameAr}`}
      className="mushaf-reader-isolated fixed inset-0 z-[85] w-full h-[100dvh] overflow-hidden select-none"
      style={{
        fontFamily: "'Cairo', sans-serif",
        background: isCream
          ? 'radial-gradient(circle at 50% 42%, #FDF8EB 0%, #F5EBD4 72%, #EADBB9 100%)'
          : 'radial-gradient(circle at 50% 42%, #08261D 0%, #041812 65%, #020E0A 100%)',
        color: isCream ? '#1E1912' : '#FAF3E0',
      }}
    >
      {/* =====================================================================
          1. SLEEK AUTO-HIDEABLE TOP BAR
         ===================================================================== */}
      <header
        aria-hidden={!barsVisible}
        className={`fixed top-0 inset-x-0 z-20 h-14 px-2.5 sm:px-5 border-b flex items-center justify-between gap-2 backdrop-blur-md transition-[transform,opacity] duration-200 ease-out motion-reduce:transition-none ${
          barsVisible
            ? 'translate-y-0 opacity-100 pointer-events-auto'
            : '-translate-y-full opacity-0 pointer-events-none'
        }`}
        style={{
          backgroundColor: isCream ? 'rgba(251, 245, 230, 0.92)' : 'rgba(4, 21, 15, 0.92)',
          borderColor: isCream ? 'rgba(184, 137, 40, 0.35)' : 'rgba(212, 175, 55, 0.32)',
          color: isCream ? '#1E1912' : '#FAF3E0',
        }}
      >
        {/* Right Slot: Close & Compact Single-Line Title */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={onClose}
            tabIndex={barsVisible ? 0 : -1}
            aria-label="إغلاق المصحف"
            title="إغلاق المصحف"
            className="min-w-[44px] min-h-[44px] rounded-xl border flex items-center justify-center shrink-0 transition-transform active:scale-95"
            style={{
              backgroundColor: isCream ? 'rgba(184, 137, 40, 0.1)' : 'rgba(10, 42, 32, 0.85)',
              borderColor: isCream ? 'rgba(184, 137, 40, 0.32)' : 'rgba(212, 175, 55, 0.35)',
              color: isCream ? '#5C430D' : '#F6D884',
            }}
          >
            <X className="w-5 h-5" />
          </button>

          <div className="min-w-0 leading-tight">
            <div className="flex items-center gap-1.5 text-sm sm:text-base font-bold font-amiri truncate">
              <span className="truncate" style={{ color: isCream ? '#1E1912' : '#F6D884' }}>
                وِرد {prayerNameAr}
              </span>
              <span aria-hidden="true" className="opacity-45">
                ·
              </span>
              <span
                className="text-xs font-sans tabular-nums shrink-0"
                style={{ color: isCream ? '#0F5132' : '#34D399' }}
              >
                ص {toArabicDigits(currentPage)}
              </span>
            </div>
          </div>
        </div>

        {/* Left Slot: Font Size, Theme Switch & Focus Toggle */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Font Resize */}
          <div
            className="flex items-center rounded-xl border p-0.5"
            style={{
              backgroundColor: isCream ? 'rgba(184, 137, 40, 0.08)' : 'rgba(7, 32, 24, 0.9)',
              borderColor: isCream ? 'rgba(184, 137, 40, 0.3)' : 'rgba(212, 175, 55, 0.3)',
            }}
          >
            <button
              type="button"
              onClick={() => setFontSize((s) => Math.max(20, s - 2))}
              disabled={fontSize <= 20}
              tabIndex={barsVisible ? 0 : -1}
              aria-label="تصغير الخط"
              title="تصغير الخط"
              className="min-w-[38px] min-h-[38px] rounded-lg text-xs font-extrabold flex items-center justify-center disabled:opacity-35 transition-opacity"
              style={{ color: isCream ? '#3B2D12' : '#FAF3E0' }}
            >
              أ-
            </button>
            <span
              className="hidden sm:inline-block px-1.5 text-[11px] font-mono tabular-nums font-bold"
              style={{ color: isCream ? '#8A6314' : '#F6D884' }}
            >
              {toArabicDigits(fontSize)}
            </span>
            <button
              type="button"
              onClick={() => setFontSize((s) => Math.min(40, s + 2))}
              disabled={fontSize >= 40}
              tabIndex={barsVisible ? 0 : -1}
              aria-label="تكبير الخط"
              title="تكبير الخط"
              className="min-w-[38px] min-h-[38px] rounded-lg text-xs font-extrabold flex items-center justify-center disabled:opacity-35 transition-opacity"
              style={{ color: isCream ? '#3B2D12' : '#FAF3E0' }}
            >
              أ+
            </button>
          </div>

          {/* Theme Toggle (Cream Paper <-> Dark Emerald) */}
          <button
            type="button"
            onClick={() => setMushafTheme((t) => (t === 'cream' ? 'emerald' : 'cream'))}
            tabIndex={barsVisible ? 0 : -1}
            aria-label={isCream ? 'التبديل للمصحف الزمردي الداكن' : 'التبديل للورق الكريمي الدافئ'}
            title={isCream ? 'المصحف الزمردي الداكن' : 'ورق المصحف الكريمي'}
            className="min-w-[44px] min-h-[40px] sm:px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 whitespace-nowrap transition-transform active:scale-95"
            style={{
              backgroundColor: isCream ? '#072219' : '#FBF5E6',
              borderColor: isCream ? '#0F5132' : '#C59B38',
              color: isCream ? '#F6D884' : '#1E1912',
            }}
          >
            {isCream ? (
              <>
                <Moon className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">زمردي</span>
              </>
            ) : (
              <>
                <Sun className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">كريمي</span>
              </>
            )}
          </button>

          {/* Focus Mode Toggle */}
          <button
            type="button"
            onClick={() => setBarsVisible(false)}
            tabIndex={barsVisible ? 0 : -1}
            aria-label="وضع التركيز الكامل"
            title="إخفاء الأشرطة للتركيز الكامل"
            className="min-w-[44px] min-h-[40px] rounded-xl border flex items-center justify-center transition-transform active:scale-95"
            style={{
              backgroundColor: isCream ? 'rgba(184, 137, 40, 0.1)' : 'rgba(10, 42, 32, 0.85)',
              borderColor: isCream ? 'rgba(184, 137, 40, 0.32)' : 'rgba(212, 175, 55, 0.35)',
              color: isCream ? '#5C430D' : '#F6D884',
            }}
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* =====================================================================
          2. FULL-VIEWPORT MUSHAF PAGE CANVAS (TAP TO TOGGLE FOCUS, SWIPE TO TURN)
         ===================================================================== */}
      <div
        ref={scrollContainerRef}
        onClick={handleCanvasTap}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={`w-full h-full overflow-y-auto no-scrollbar transition-[padding] duration-200 ease-out ${
          barsVisible ? 'pt-[62px] pb-[74px]' : 'py-3 sm:py-5'
        } px-2 sm:px-5`}
      >
        <div
          className={`mx-auto w-full max-w-3xl min-h-full flex flex-col transition-[transform,opacity] duration-200 ease-out motion-reduce:transition-none ${
            flipDirection === 'next'
              ? 'opacity-90 translate-x-2'
              : flipDirection === 'prev'
                ? 'opacity-90 -translate-x-2'
                : 'opacity-100 translate-x-0'
          }`}
        >
          {/* Outer Illuminated Mushaf Frame */}
          <article
            aria-label={`صفحة ${toArabicDigits(currentPage)} من المصحف الشريف`}
            className="relative flex-1 flex flex-col justify-between rounded-2xl sm:rounded-3xl p-2 sm:p-3.5 shadow-[0_14px_45px_rgba(0,0,0,0.28)]"
            style={{
              backgroundColor: isCream ? '#FBF5E6' : '#051C15',
              border: `1.5px solid ${isCream ? 'rgba(184, 137, 40, 0.68)' : 'rgba(212, 175, 55, 0.58)'}`,
            }}
          >
            {/* Corner Arabesque Medallions */}
            <MushafCornerOrnament position="tr" strokeColor={ornamentStroke} />
            <MushafCornerOrnament position="tl" strokeColor={ornamentStroke} />
            <MushafCornerOrnament position="br" strokeColor={ornamentStroke} />
            <MushafCornerOrnament position="bl" strokeColor={ornamentStroke} />

            {/* Inner Ornamental Manuscript Border */}
            <div
              className="flex-1 flex flex-col justify-between rounded-xl sm:rounded-2xl px-4 py-4 sm:px-8 sm:py-6"
              style={{
                border: `1px solid ${isCream ? 'rgba(184, 137, 40, 0.34)' : 'rgba(212, 175, 55, 0.28)'}`,
                backgroundColor: isCream ? 'rgba(255, 252, 244, 0.55)' : 'rgba(4, 24, 18, 0.65)',
              }}
            >
              {/* Running Manuscript Top Strip (Juz + Surah Name) */}
              <div
                className="flex items-center justify-between gap-3 pb-2.5 mb-3 border-b text-xs sm:text-sm font-amiri font-bold"
                style={{
                  borderColor: isCream ? 'rgba(184, 137, 40, 0.28)' : 'rgba(212, 175, 55, 0.25)',
                  color: isCream ? '#7C5A12' : '#E9C975',
                }}
              >
                <span className="truncate">{juzName}</span>
                <span aria-hidden="true" className="text-sm opacity-75 shrink-0">
                  ۞
                </span>
                <span className="truncate text-left">{pageSurahsLabel}</span>
              </div>

              {/* Main Quranic Verses Body */}
              <div className="flex-1 flex flex-col justify-center">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <div
                      className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
                      style={{
                        borderColor: `${isCream ? '#B88928' : '#F6D884'} transparent ${isCream ? '#B88928' : '#F6D884'} ${isCream ? '#B88928' : '#F6D884'}`,
                      }}
                    />
                    <p
                      className="text-sm font-semibold"
                      style={{ color: isCream ? '#5E4B27' : '#CBD5E1' }}
                    >
                      جارٍ فتح صفحة المصحف الشريف...
                    </p>
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                    <p
                      className="text-sm font-semibold"
                      style={{ color: isCream ? '#991B1B' : '#FDA4AF' }}
                    >
                      {error}
                    </p>
                    <button
                      type="button"
                      onClick={() => setReloadNonce((n) => n + 1)}
                      className="min-h-[44px] px-5 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 transition-transform active:scale-95"
                      style={{
                        backgroundColor: isCream ? '#072219' : '#F6D884',
                        borderColor: isCream ? '#0F5132' : '#CFA632',
                        color: isCream ? '#F6D884' : '#04130E',
                      }}
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>إعادة المحاولة</span>
                    </button>
                  </div>
                ) : (
                  <div
                    className={`space-y-5 select-text ${
                      isFatihaOnlyPage ? 'my-auto py-4' : ''
                    }`}
                  >
                    {surahSegments.map((segment) => (
                      <section
                        key={`${segment.surahNumber}-${segment.ayahs[0]?.number}`}
                        className="space-y-4"
                      >
                        {/* Ornamental Surah Title Cartouche when Surah starts on this page */}
                        {segment.startsOnThisPage && (
                          <div className="space-y-3 pt-1">
                            <div
                              className="relative mx-auto max-w-md rounded-xl px-4 py-2 text-center border"
                              style={{
                                background: isCream
                                  ? 'linear-gradient(90deg, rgba(184,137,40,0.08) 0%, rgba(184,137,40,0.2) 50%, rgba(184,137,40,0.08) 100%)'
                                  : 'linear-gradient(90deg, rgba(212,175,55,0.08) 0%, rgba(212,175,55,0.22) 50%, rgba(212,175,55,0.08) 100%)',
                                borderColor: isCream
                                  ? 'rgba(184, 137, 40, 0.58)'
                                  : 'rgba(212, 175, 55, 0.58)',
                              }}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <span
                                  aria-hidden="true"
                                  className="text-sm opacity-80"
                                  style={{ color: isCream ? '#9A7418' : '#F6D884' }}
                                >
                                  ❖
                                </span>
                                <h2
                                  className="font-amiri text-xl sm:text-2xl font-bold tracking-wide"
                                  style={{ color: isCream ? '#5C4008' : '#F6D884' }}
                                >
                                  {segment.surahName}
                                </h2>
                                <span
                                  aria-hidden="true"
                                  className="text-sm opacity-80"
                                  style={{ color: isCream ? '#9A7418' : '#F6D884' }}
                                >
                                  ❖
                                </span>
                              </div>
                            </div>

                            {/* Centered Bismillah for Surahs starting on page (except Al-Fatiha 1 & At-Tawbah 9) */}
                            {segment.surahNumber !== 1 && segment.surahNumber !== 9 && (
                              <div
                                className="text-center font-amiri font-bold py-1"
                                style={{
                                  fontSize: `${Math.max(22, Math.round(fontSize * 0.92))}px`,
                                  color: isCream ? '#2B2214' : '#F6D884',
                                }}
                              >
                                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                              </div>
                            )}
                          </div>
                        )}

                        {/* Flowing Uthmani Verses */}
                        <div
                          className={`font-amiri leading-[2.25] tracking-normal ${
                            isFatihaOnlyPage ? 'text-center' : 'text-justify'
                          }`}
                          style={{
                            fontSize: `${fontSize}px`,
                            color: isCream ? '#1E1912' : '#FAF3E0',
                            textAlignLast: 'center',
                          }}
                        >
                          {segment.ayahs.map((ayah) => {
                            const cleanText = stripLeadingBismillah(
                              ayah.text,
                              ayah.surah.number,
                              ayah.numberInSurah
                            );
                            return (
                              <React.Fragment key={ayah.number}>
                                <span>{cleanText}</span>{' '}
                                <span
                                  className="inline-flex items-center justify-center align-middle mx-1 select-none font-amiri font-bold tabular-nums"
                                  style={{
                                    fontSize: `${Math.max(15, Math.round(fontSize * 0.72))}px`,
                                    color: isCream ? '#9A7418' : '#F6D884',
                                  }}
                                >
                                  ﴿{toArabicDigits(ayah.numberInSurah)}﴾
                                </span>{' '}
                              </React.Fragment>
                            );
                          })}
                        </div>
                      </section>
                    ))}
                  </div>
                )}
              </div>

              {/* Running Manuscript Bottom Folio Ornament */}
              <div
                className="pt-3 mt-4 border-t flex items-center justify-between gap-3 text-xs font-amiri"
                style={{
                  borderColor: isCream ? 'rgba(184, 137, 40, 0.28)' : 'rgba(212, 175, 55, 0.25)',
                  color: isCream ? '#7C5A12' : '#D9BE75',
                }}
              >
                <span className="font-sans text-[11px] tabular-nums opacity-85">
                  {wird.pagesLabel}
                </span>
                <span className="font-bold text-sm tabular-nums">
                  ❖ ﴿ {toArabicDigits(currentPage)} ﴾ ❖
                </span>
                <span className="font-bold">
                  {currentPage === wird.endPage ? 'صدق الله العظيم' : `وِرد ${prayerNameAr}`}
                </span>
              </div>
            </div>
          </article>
        </div>
      </div>

      {/* =====================================================================
          3. FLOATING RESTORE BUTTON IN FOCUS MODE
         ===================================================================== */}
      {!barsVisible && (
        <button
          type="button"
          onClick={() => setBarsVisible(true)}
          aria-label="إظهار شريط التحكم"
          title="إظهار أدوات القراءة"
          className="fixed bottom-4 left-4 z-30 min-w-[44px] min-h-[44px] px-3 rounded-full border shadow-lg backdrop-blur-md flex items-center justify-center gap-1.5 text-xs font-bold transition-transform active:scale-95"
          style={{
            backgroundColor: isCream ? 'rgba(251, 245, 230, 0.9)' : 'rgba(5, 28, 21, 0.9)',
            borderColor: isCream ? 'rgba(184, 137, 40, 0.55)' : 'rgba(212, 175, 55, 0.55)',
            color: isCream ? '#5C4008' : '#F6D884',
          }}
        >
          <Minimize2 className="w-4 h-4 shrink-0" />
          <span>الأدوات</span>
        </button>
      )}

      {/* =====================================================================
          4. SLEEK AUTO-HIDEABLE BOTTOM BAR (THUMB ZONE)
         ===================================================================== */}
      <footer
        aria-hidden={!barsVisible}
        className={`fixed bottom-0 inset-x-0 z-20 min-h-[64px] px-2.5 sm:px-5 py-2 border-t flex items-center justify-between gap-2 backdrop-blur-md transition-[transform,opacity] duration-200 ease-out motion-reduce:transition-none ${
          barsVisible
            ? 'translate-y-0 opacity-100 pointer-events-auto'
            : 'translate-y-full opacity-0 pointer-events-none'
        }`}
        style={{
          backgroundColor: isCream ? 'rgba(251, 245, 230, 0.94)' : 'rgba(4, 21, 15, 0.94)',
          borderColor: isCream ? 'rgba(184, 137, 40, 0.35)' : 'rgba(212, 175, 55, 0.32)',
        }}
      >
        {/* Previous Page (RTL Right) */}
        <button
          type="button"
          onClick={handlePrevPage}
          disabled={currentPage <= wird.startPage}
          tabIndex={barsVisible ? 0 : -1}
          aria-label="الصفحة السابقة"
          className="min-h-[44px] px-2.5 sm:px-3.5 rounded-xl border text-xs font-bold flex items-center gap-1 whitespace-nowrap shrink-0 disabled:opacity-35 disabled:cursor-not-allowed transition-transform active:scale-95"
          style={{
            backgroundColor: isCream ? 'rgba(184, 137, 40, 0.1)' : 'rgba(10, 42, 32, 0.85)',
            borderColor: isCream ? 'rgba(184, 137, 40, 0.32)' : 'rgba(212, 175, 55, 0.32)',
            color: isCream ? '#5C4008' : '#F6D884',
          }}
        >
          <ChevronRight className="w-4 h-4 shrink-0" />
          <span className="sm:hidden">السابقة</span>
          <span className="hidden sm:inline">الصفحة السابقة</span>
        </button>

        {/* Center: Page Progress & Complete Wird Action */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 min-w-0">
          {totalPagesCount > 1 && totalPagesCount <= 6 ? (
            <div className="hidden xs:flex sm:flex items-center gap-1" aria-label="صفحات الوِرد">
              {wirdPages.map((p) => {
                const isActive = p === currentPage;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setCurrentPage(p)}
                    tabIndex={barsVisible ? 0 : -1}
                    aria-label={`انتقل إلى صفحة ${toArabicDigits(p)}`}
                    className="min-w-[24px] min-h-[36px] flex items-center justify-center"
                  >
                    <span
                      className={`block rounded-full transition-all duration-200 ${
                        isActive ? 'w-5 h-2' : 'w-2 h-2 opacity-45'
                      }`}
                      style={{
                        backgroundColor: isCream ? '#9A7418' : '#F6D884',
                      }}
                    />
                  </button>
                );
              })}
            </div>
          ) : (
            totalPagesCount > 1 && (
              <span
                className="text-[11px] font-mono tabular-nums font-bold shrink-0"
                style={{ color: isCream ? '#7C5A12' : '#E9C975' }}
              >
                {toArabicDigits(currentStepInWird)}/{toArabicDigits(totalPagesCount)}
              </span>
            )
          )}

          <button
            type="button"
            onClick={onToggleComplete}
            tabIndex={barsVisible ? 0 : -1}
            className="min-h-[44px] px-3.5 sm:px-5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 shadow transition-transform active:scale-95"
            style={
              isCompleted
                ? {
                    background: 'linear-gradient(135deg, #10B981, #059669)',
                    color: '#04130E',
                  }
                : {
                    background: isCream
                      ? 'linear-gradient(135deg, #0B3B2B, #06241A)'
                      : 'linear-gradient(135deg, #F6D884, #CFA632)',
                    color: isCream ? '#F6D884' : '#04130E',
                  }
            }
          >
            <Check className="w-4 h-4 stroke-[2.75] shrink-0" />
            <span className="sm:hidden">{isCompleted ? 'تم الإنجاز' : 'إنجاز الوِرد'}</span>
            <span className="hidden sm:inline">
              {isCompleted ? 'تم إنجاز الوِرد' : 'تسجيل إنجاز الوِرد'}
            </span>
          </button>
        </div>

        {/* Next Page (RTL Left) */}
        <button
          type="button"
          onClick={handleNextPage}
          disabled={currentPage >= wird.endPage}
          tabIndex={barsVisible ? 0 : -1}
          aria-label="الصفحة التالية"
          className="min-h-[44px] px-2.5 sm:px-3.5 rounded-xl border text-xs font-bold flex items-center gap-1 whitespace-nowrap shrink-0 disabled:opacity-35 disabled:cursor-not-allowed transition-transform active:scale-95"
          style={{
            backgroundColor: isCream ? 'rgba(184, 137, 40, 0.1)' : 'rgba(10, 42, 32, 0.85)',
            borderColor: isCream ? 'rgba(184, 137, 40, 0.32)' : 'rgba(212, 175, 55, 0.32)',
            color: isCream ? '#5C4008' : '#F6D884',
          }}
        >
          <span className="sm:hidden">التالية</span>
          <span className="hidden sm:inline">الصفحة التالية</span>
          <ChevronLeft className="w-4 h-4 shrink-0" />
        </button>
      </footer>
    </div>
  );
};
