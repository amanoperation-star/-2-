import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Copy,
  Share2,
  Loader2,
  Download,
} from 'lucide-react';
import {
  ALL_99_NAMES_OF_ALLAH,
  AllahNameEntry,
  DAILY_AYAH_KEYS,
  DAILY_PROPHETIC_SUNAN,
  FEATURED_NAME_NUMBERS,
  FEELING_DUAS_CATEGORIES,
  FeelingCategoryId,
  KHAZAIN_STORAGE_KEYS,
  MULTIPLIED_DHIKR_BUNDLES,
  MUNJIYAT_ITEMS,
  MushafBookmark,
  SAKINAH_PROPHETIC_DUAS,
  SAKINAH_RUQYAH_VERSES,
  formatBookmarkLabel,
  getTodayKhazainKey,
  loadSavedBookmark,
  saveBookmark,
} from '../utils/khazainAlNoorData';
import {
  HifzAyah,
  QURAN_SURAH_CATALOG,
  fetchSurahAyahsWithCache,
} from '../utils/hifzData';
import { toArabicDigits } from '../utils/khatmaData';
import { adhanPlayer } from '../utils/audioAdhan';

interface ShareCardPayload {
  badgeAr: string;
  titleAr?: string;
  mainText: string;
  subtitleAr: string;
}

export const QuranSection: React.FC = () => {
  const todayKey = getTodayKhazainKey();

  // Toast feedback
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
  };

  useEffect(() => {
    if (!toastMsg) return;
    const t = window.setTimeout(() => setToastMsg(null), 3000);
    return () => window.clearTimeout(t);
  }, [toastMsg]);

  // 1. Daily Ayah Key
  const [ayahKeyIndex, setAyahKeyIndex] = useState<number>(() => new Date().getDate() % DAILY_AYAH_KEYS.length);
  const currentAyahKey = DAILY_AYAH_KEYS[ayahKeyIndex];

  // 2. Bookmark & Full Mushaf Modal
  const [bookmark, setBookmark] = useState<MushafBookmark>(() => loadSavedBookmark());
  const [isMushafOpen, setIsMushafOpen] = useState<boolean>(false);
  const [mushafView, setMushafView] = useState<'index' | 'reader'>('index');
  const [mushafSearch, setMushafSearch] = useState<string>('');
  const [activeSurahNumber, setActiveSurahNumber] = useState<number>(bookmark.surahNumber);
  const [surahAyahs, setSurahAyahs] = useState<HifzAyah[]>([]);
  const [loadingSurah, setLoadingSurah] = useState<boolean>(false);
  const [surahError, setSurahError] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState<number>(0);
  const [mushafFontSize, setMushafFontSize] = useState<number>(() => {
    if (typeof window === 'undefined') return 24;
    const saved = Number(localStorage.getItem(KHAZAIN_STORAGE_KEYS.fontSize));
    return Number.isFinite(saved) && saved >= 18 && saved <= 38 ? saved : 24;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(KHAZAIN_STORAGE_KEYS.fontSize, String(mushafFontSize));
    }
  }, [mushafFontSize]);

  useEffect(() => {
    if (!isMushafOpen || mushafView !== 'reader') return;
    let active = true;
    setLoadingSurah(true);
    setSurahError(null);
    fetchSurahAyahsWithCache(activeSurahNumber)
      .then((list) => {
        if (!active) return;
        setSurahAyahs(list);
        setLoadingSurah(false);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setSurahError(err instanceof Error ? err.message : 'تعذر تحميل السورة');
        setLoadingSurah(false);
      });
    return () => {
      active = false;
    };
  }, [isMushafOpen, mushafView, activeSurahNumber, reloadNonce]);

  const activeSurahMeta = useMemo(
    () => QURAN_SURAH_CATALOG.find((s) => s.number === activeSurahNumber) || QURAN_SURAH_CATALOG[0],
    [activeSurahNumber]
  );

  const filteredSurahs = useMemo(() => {
    const q = mushafSearch.trim();
    if (!q) return QURAN_SURAH_CATALOG;
    const normalizedDigits = q.replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
    return QURAN_SURAH_CATALOG.filter(
      (s) => s.nameAr.includes(q) || String(s.number) === normalizedDigits
    );
  }, [mushafSearch]);

  const openSurahInMushaf = (surahNumber: number) => {
    setActiveSurahNumber(surahNumber);
    setMushafView('reader');
    setIsMushafOpen(true);
  };

  const handleSaveBookmark = (ayahNumber: number = 1) => {
    const next: MushafBookmark = {
      surahNumber: activeSurahMeta.number,
      surahNameAr: activeSurahMeta.nameAr,
      ayahNumber,
      savedAt: new Date().toISOString(),
    };
    setBookmark(next);
    saveBookmark(next);
    adhanPlayer.playChime();
    showToast(`🔖 تم حفظ الوقوف عند سورة ${activeSurahMeta.nameAr} • الآية ${toArabicDigits(ayahNumber)}`);
  };

  // 3. Munjijat & Interactive Tadabbur + Sakinah Ruqyah Modal
  const [selectedMunjiyatId, setSelectedMunjiyatId] = useState<string>(MUNJIYAT_ITEMS[0].id);
  const [isTafsirOpen, setIsTafsirOpen] = useState<boolean>(false);
  const [isRuqyahModalOpen, setIsRuqyahModalOpen] = useState<boolean>(false);

  const currentMunjiyat = useMemo(
    () => MUNJIYAT_ITEMS.find((m) => m.id === selectedMunjiyatId) || MUNJIYAT_ITEMS[0],
    [selectedMunjiyatId]
  );

  // 4. Names of Allah (اسم اليوم + الـ 99 اسماً)
  const [selectedNameNumber, setSelectedNameNumber] = useState<number>(
    () => FEATURED_NAME_NUMBERS[new Date().getDate() % FEATURED_NAME_NUMBERS.length]
  );
  const [isAllNamesOpen, setIsAllNamesOpen] = useState<boolean>(false);
  const [namesSearch, setNamesSearch] = useState<string>('');

  const featuredNames = useMemo(
    () =>
      FEATURED_NAME_NUMBERS.map(
        (num) => ALL_99_NAMES_OF_ALLAH.find((n) => n.number === num) || ALL_99_NAMES_OF_ALLAH[0]
      ),
    []
  );

  const currentNameEntry: AllahNameEntry = useMemo(
    () =>
      ALL_99_NAMES_OF_ALLAH.find((n) => n.number === selectedNameNumber) || ALL_99_NAMES_OF_ALLAH[30],
    [selectedNameNumber]
  );

  const filteredAllNames = useMemo(() => {
    const q = namesSearch.trim();
    if (!q) return ALL_99_NAMES_OF_ALLAH;
    return ALL_99_NAMES_OF_ALLAH.filter(
      (n) => n.name.includes(q) || n.meaning.includes(q) || String(n.number) === q
    );
  }, [namesSearch]);

  // 5. Multiplied Dhikr Bundles
  const [dhikrCounts, setDhikrCounts] = useState<Record<string, number>>(() => {
    if (typeof window === 'undefined') return {};
    try {
      const raw = localStorage.getItem(`${KHAZAIN_STORAGE_KEYS.dhikrCountsPrefix}${todayKey}`);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const totalTasbihsToday = useMemo(
    () => Object.values(dhikrCounts).reduce((sum, n) => sum + (Number(n) || 0), 0),
    [dhikrCounts]
  );

  const handleIncrementDhikr = (id: string, target: number) => {
    setDhikrCounts((prev) => {
      const curr = prev[id] || 0;
      const nextVal = curr + 1;
      const updated = { ...prev, [id]: nextVal };
      try {
        localStorage.setItem(
          `${KHAZAIN_STORAGE_KEYS.dhikrCountsPrefix}${todayKey}`,
          JSON.stringify(updated)
        );
      } catch {
        // ignore
      }
      if (nextVal === target) {
        adhanPlayer.playChime();
        showToast('✨ تقبّل الله ذكرك! أتممت ورد هذا الذكر اليوم');
      }
      return updated;
    });
  };

  const handleResetDhikrCounts = () => {
    setDhikrCounts({});
    try {
      localStorage.removeItem(`${KHAZAIN_STORAGE_KEYS.dhikrCountsPrefix}${todayKey}`);
    } catch {
      // ignore
    }
    showToast('تم تصفير عدّاد الأذكار لبدء جولة جديدة');
  };

  // 6. Daily Sunnah Revival
  const [sunnahIndex, setSunnahIndex] = useState<number>(
    () => new Date().getDate() % DAILY_PROPHETIC_SUNAN.length
  );
  const [revivedSunan, setRevivedSunan] = useState<Record<string, boolean>>(() => {
    if (typeof window === 'undefined') return {};
    try {
      const raw = localStorage.getItem(`${KHAZAIN_STORAGE_KEYS.revivedSunanPrefix}${todayKey}`);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const currentSunnah = DAILY_PROPHETIC_SUNAN[sunnahIndex];
  const isCurrentSunnahRevived = Boolean(revivedSunan[currentSunnah.id]);

  const handleToggleReviveSunnah = () => {
    const nextState = !isCurrentSunnahRevived;
    setRevivedSunan((prev) => {
      const updated = { ...prev, [currentSunnah.id]: nextState };
      try {
        localStorage.setItem(
          `${KHAZAIN_STORAGE_KEYS.revivedSunanPrefix}${todayKey}`,
          JSON.stringify(updated)
        );
      } catch {
        // ignore
      }
      return updated;
    });
    if (nextState) {
      adhanPlayer.playChime();
      showToast('★ بارك الله فيك! أحييتَ سنة نبوية اليوم');
    }
  };

  // 7. Feeling Duas & Share Card Modal
  const [selectedFeelingId, setSelectedFeelingId] = useState<FeelingCategoryId>('distress');
  const [feelingDuaIdx, setFeelingDuaIdx] = useState<number>(0);
  const [sharePayload, setSharePayload] = useState<ShareCardPayload | null>(null);

  const currentFeelingCategory = useMemo(
    () =>
      FEELING_DUAS_CATEGORIES.find((c) => c.id === selectedFeelingId) ||
      FEELING_DUAS_CATEGORIES[0],
    [selectedFeelingId]
  );
  const currentFeelingDua =
    currentFeelingCategory.duas[feelingDuaIdx % currentFeelingCategory.duas.length];

  const handleCopyText = async (text: string, customToast?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(customToast || '📋 تم النسخ إلى الحافظة بنجاح');
    } catch {
      showToast('تعذر النسخ التلقائي — يمكنك التحديد والنسخ يدوياً');
    }
  };

  const handleWebShare = async (payload: ShareCardPayload) => {
    const formatted = `${payload.badgeAr}${payload.titleAr ? ` — ${payload.titleAr}` : ''}\n\n${payload.mainText}\n\n${payload.subtitleAr}\n۞ خزائن النور • تطبيق محراب`;
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: payload.badgeAr,
          text: formatted,
        });
        return;
      } catch {
        // fall through to copy if user cancelled or share unsupported in iframe
      }
    }
    await handleCopyText(formatted, '📋 تم نسخ البطاقة للمشاركة');
  };

  const handleDownloadSharePng = (payload: ShareCardPayload) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1350;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 1080, 1350);
    bgGrad.addColorStop(0, '#071E17');
    bgGrad.addColorStop(0.5, '#0C2A21');
    bgGrad.addColorStop(1, '#04130E');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1080, 1350);

    // Double gold border
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.75)';
    ctx.lineWidth = 4;
    ctx.strokeRect(48, 48, 984, 1254);
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.32)';
    ctx.lineWidth = 2;
    ctx.strokeRect(66, 66, 948, 1218);

    ctx.direction = 'rtl';
    ctx.textAlign = 'center';

    // Top badge
    ctx.fillStyle = '#F3D078';
    ctx.font = 'bold 34px Cairo, sans-serif';
    ctx.fillText(`۞ ${payload.badgeAr} ۞`, 540, 150);

    if (payload.titleAr) {
      ctx.fillStyle = '#34D399';
      ctx.font = 'bold 64px Amiri, serif';
      ctx.fillText(payload.titleAr, 540, 260);
    }

    // Wrap main text
    ctx.fillStyle = '#F8FAFC';
    ctx.font = 'bold 46px Amiri, serif';
    const words = payload.mainText.split(/\s+/);
    const lines: string[] = [];
    let currentLine = '';
    for (const w of words) {
      const test = currentLine ? `${currentLine} ${w}` : w;
      if (ctx.measureText(test).width > 820) {
        lines.push(currentLine);
        currentLine = w;
      } else {
        currentLine = test;
      }
    }
    if (currentLine) lines.push(currentLine);

    const startY = payload.titleAr ? 410 : 370;
    const lineHeight = 80;
    lines.slice(0, 9).forEach((line, idx) => {
      ctx.fillText(line, 540, startY + idx * lineHeight);
    });

    // Subtitle & footer
    ctx.fillStyle = '#D4AF37';
    ctx.font = '600 30px Cairo, sans-serif';
    ctx.fillText(payload.subtitleAr, 540, 1140);

    ctx.fillStyle = 'rgba(212, 175, 55, 0.7)';
    ctx.font = '500 26px Cairo, sans-serif';
    ctx.fillText('خزائن النور • تطبيق محراب', 540, 1220);

    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `mihrab-khazain-${Date.now()}.png`;
    a.click();
    showToast('🖼️ تم حفظ البطاقة كصورة بنجاح');
  };

  return (
    <div dir="rtl" className="w-full py-2 sm:py-4 text-right">
      {/* Centered Royal Emerald & Gold Mobile-First Container (max-w-md) */}
      <div className="max-w-md mx-auto rounded-[28px] bg-[#04130E] p-2.5 sm:p-3 border border-[#D4AF37]/30 shadow-[0_24px_65px_rgba(0,0,0,0.65)] theme-keep-light">
        <div className="rounded-[22px] khazain-geo-pattern border border-[#D4AF37]/35 p-4 sm:p-5 space-y-5">
          {/* 1. HEADER */}
          <header className="flex items-center justify-between gap-3 pb-4 border-b border-[#D4AF37]/25">
            <div className="space-y-0.5 min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold font-amiri text-[#F3D078] tracking-wide">
                ۞ خزائن النور
              </h2>
              <p className="text-[11px] text-emerald-200/80 truncate">
                المصحف كاملاً • التدبّر • الأذكار • السُنن
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setMushafView('index');
                setIsMushafOpen(true);
              }}
              className="min-h-[42px] px-3.5 py-2 rounded-xl royal-gold-foil text-xs font-black shadow-[0_6px_18px_rgba(212,175,55,0.28)] hover:brightness-105 active:scale-[0.98] transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5"
            >
              <span>📖</span>
              <span>المصحف كاملاً</span>
            </button>
          </header>

          {/* 2. DAILY AYAH KEY (مفتاح آية) */}
          <section className="rounded-2xl bg-[#0C2A21] border border-[#D4AF37]/35 p-4 space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-[#F3D078]">
                مفتاح آية • رسالتك القرآنية اليوم
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    setSharePayload({
                      badgeAr: 'رسالتك القرآنية اليوم',
                      mainText: currentAyahKey.ayahText,
                      subtitleAr: currentAyahKey.surahRef,
                    })
                  }
                  className="min-h-[34px] px-2.5 py-1 rounded-lg bg-[#061812] border border-[#D4AF37]/35 text-[11px] font-bold text-[#F3D078] hover:border-[#F3D078] transition-colors"
                >
                  🖼️ بطاقة
                </button>
                <button
                  type="button"
                  onClick={() => setAyahKeyIndex((i) => (i + 1) % DAILY_AYAH_KEYS.length)}
                  className="min-h-[34px] px-2.5 py-1 rounded-lg bg-[#061812] border border-[#D4AF37]/35 text-[11px] font-bold text-slate-200 hover:text-[#F3D078] transition-colors"
                >
                  ↻ رسالة أخرى
                </button>
              </div>
            </div>

            <blockquote className="font-amiri text-xl sm:text-2xl text-white leading-[2] text-center py-1">
              «{currentAyahKey.ayahText}»
            </blockquote>

            <div className="text-center text-[11px] text-[#D4AF37] tabular-nums">
              {currentAyahKey.surahRef}
            </div>

            <div className="rounded-xl emerald-badge p-3 space-y-1">
              <div className="text-[11px] font-bold text-[#34D399]">خطوتك العملية اليوم:</div>
              <p className="text-xs text-emerald-100 leading-relaxed">
                {currentAyahKey.practicalStep}
              </p>
            </div>
          </section>

          {/* 3. FULL MUSHAF LAUNCHER + MUNJIYAT + TADABBUR + SAKINAH RUQYAH */}
          <section className="rounded-2xl bg-[#0C2A21] border border-[#D4AF37]/35 p-4 space-y-4">
            {/* Full Mushaf Launch Bar */}
            <button
              type="button"
              onClick={() => openSurahInMushaf(bookmark.surahNumber)}
              className="w-full min-h-[54px] rounded-xl bg-[#061812] border border-[#D4AF37]/45 hover:border-[#F3D078] p-3.5 text-right flex items-center justify-between gap-3 transition-all group"
            >
              <div className="space-y-0.5 min-w-0">
                <div className="text-xs sm:text-sm font-bold text-[#F3D078] group-hover:text-white transition-colors">
                  تصفّح المصحف الشريف كاملاً (١١٤ سورة)
                </div>
                <div className="text-[11px] text-[#34D399] truncate tabular-nums">
                  🔖 علامة الوقوف المحفوظة: {formatBookmarkLabel(bookmark)}
                </div>
              </div>
              <ChevronLeft className="w-4 h-4 text-[#D4AF37] shrink-0" />
            </button>

            {/* Quick Munjijat Horizontal Strip */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#F3D078]">السور المنجيات والتدبر</span>
                <button
                  type="button"
                  onClick={() => setIsRuqyahModalOpen(true)}
                  className="min-h-[32px] px-2.5 py-1 rounded-lg emerald-badge text-[11px] font-bold hover:brightness-110 transition-all"
                >
                  🕊️ رقية السكينة
                </button>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {MUNJIYAT_ITEMS.map((item) => {
                  const isActive = item.id === selectedMunjiyatId;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setSelectedMunjiyatId(item.id);
                        setIsTafsirOpen(false);
                      }}
                      className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all ${
                        isActive
                          ? 'royal-gold-foil shadow'
                          : 'bg-[#061812] border border-[#D4AF37]/30 text-slate-200 hover:border-[#D4AF37]/65'
                      }`}
                    >
                      {item.titleAr}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Interactive Tadabbur Box */}
            <div className="rounded-xl bg-[#061812] border border-[#D4AF37]/30 p-3.5 space-y-3">
              <button
                type="button"
                onClick={() => setIsTafsirOpen((v) => !v)}
                className="w-full text-right space-y-2 group"
              >
                <p className="font-amiri text-lg sm:text-xl text-amber-50 leading-[2.05]">
                  {currentMunjiyat.passageText}
                </p>
                <div className="flex items-center justify-between text-[11px] text-[#34D399]">
                  <span>{currentMunjiyat.passageRef}</span>
                  <span className="font-bold group-hover:underline">
                    {isTafsirOpen ? 'إخفاء التفسير الميسّر ▴' : 'اضغط لعرض التفسير الميسّر ▾'}
                  </span>
                </div>
              </button>

              {isTafsirOpen && (
                <div className="pt-2.5 border-t border-[#D4AF37]/20 text-xs text-slate-200 leading-relaxed animate-fade-in">
                  <span className="font-bold text-[#F3D078]">التفسير الميسّر: </span>
                  {currentMunjiyat.tafsirMuyassar}
                </div>
              )}

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#D4AF37]/20">
                <button
                  type="button"
                  onClick={() => openSurahInMushaf(currentMunjiyat.surahNumber)}
                  className="min-h-[36px] px-3 py-1 rounded-lg bg-[#0C2A21] border border-[#D4AF37]/35 text-[11px] font-bold text-[#F3D078] hover:border-[#F3D078]"
                >
                  📖 قراءة السورة كاملة
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSharePayload({
                      badgeAr: currentMunjiyat.titleAr,
                      mainText: currentMunjiyat.passageText,
                      subtitleAr: currentMunjiyat.passageRef,
                    })
                  }
                  className="min-h-[36px] px-3 py-1 rounded-lg bg-[#0C2A21] border border-[#D4AF37]/35 text-[11px] font-bold text-slate-200 hover:text-[#F3D078]"
                >
                  🖼️ بطاقة مشاركة
                </button>
              </div>
            </div>
          </section>

          {/* 4. LIVING BY THE 99 NAMES OF ALLAH (معايشة أسماء الله الحسنى) */}
          <section className="rounded-2xl bg-[#0C2A21] border border-[#D4AF37]/35 p-4 space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-[#F3D078]">معايشة أسماء الله الحسنى</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    setSharePayload({
                      badgeAr: 'من أسماء الله الحسنى',
                      titleAr: currentNameEntry.name,
                      mainText: `${currentNameEntry.meaning}\n\n${currentNameEntry.dua}`,
                      subtitleAr: `الاسم رقم ${toArabicDigits(currentNameEntry.number)} من ٩٩`,
                    })
                  }
                  className="min-h-[34px] px-2.5 py-1 rounded-lg bg-[#061812] border border-[#D4AF37]/35 text-[11px] font-bold text-[#F3D078]"
                >
                  🖼️ بطاقة
                </button>
                <button
                  type="button"
                  onClick={() => setIsAllNamesOpen(true)}
                  className="min-h-[34px] px-2.5 py-1 rounded-lg emerald-badge text-[11px] font-bold"
                >
                  الـ ٩٩ اسماً ‹
                </button>
              </div>
            </div>

            {/* Ornate Name of the Day Showcase */}
            <div className="rounded-xl bg-[#061812] border border-[#D4AF37]/35 p-3.5 flex items-start gap-3.5">
              <div className="w-20 h-20 rounded-2xl bg-[#04130E] border-2 border-[#D4AF37]/70 flex flex-col items-center justify-center shrink-0 shadow-[0_0_20px_rgba(212,175,55,0.16)] px-1 text-center">
                <span className="font-amiri text-xl font-bold text-[#F3D078] leading-tight">
                  {currentNameEntry.name}
                </span>
                <span className="text-[10px] font-mono tabular-nums text-[#34D399] mt-0.5">
                  #{toArabicDigits(currentNameEntry.number)}
                </span>
              </div>

              <div className="space-y-1.5 min-w-0 flex-1">
                <p className="text-xs text-slate-200 leading-relaxed">
                  {currentNameEntry.meaning}
                </p>
                <p className="font-amiri text-sm text-[#34D399] leading-relaxed">
                  «{currentNameEntry.dua}»
                </p>
              </div>
            </div>

            {/* Quick Featured Names Selector Strip */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {featuredNames.map((item) => {
                const isActive = item.number === currentNameEntry.number;
                return (
                  <button
                    key={item.number}
                    type="button"
                    onClick={() => setSelectedNameNumber(item.number)}
                    className={`min-h-[36px] px-3 py-1 rounded-xl font-amiri text-sm font-bold whitespace-nowrap shrink-0 transition-all ${
                      isActive
                        ? 'royal-gold-foil shadow'
                        : 'bg-[#061812] border border-[#D4AF37]/30 text-slate-200 hover:border-[#D4AF37]/65'
                    }`}
                  >
                    {item.name}
                  </button>
                );
              })}
            </div>
          </section>

          {/* 5. MULTIPLIED DHIKR BUNDLES (باقات الذكر المضاعف) */}
          <section className="rounded-2xl bg-[#0C2A21] border border-[#D4AF37]/35 p-4 space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <div className="space-y-0.5">
                <h3 className="text-xs sm:text-sm font-bold text-[#F3D078]">
                  باقات الذكر المضاعف
                </h3>
                <p className="text-[11px] text-slate-300">
                  اضغط على الذكر للعدّ • يتغيّر الإطار عند إتمام الهدف
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <span className="emerald-badge px-2.5 py-1 rounded-lg text-xs font-mono font-bold tabular-nums">
                  {toArabicDigits(totalTasbihsToday)} تسبيحة
                </span>
                {totalTasbihsToday > 0 && (
                  <button
                    type="button"
                    onClick={handleResetDhikrCounts}
                    className="min-w-[32px] min-h-[32px] rounded-lg bg-[#061812] border border-[#D4AF37]/30 text-slate-400 hover:text-[#F3D078] flex items-center justify-center"
                    title="تصفير العدّاد"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2.5">
              {MULTIPLIED_DHIKR_BUNDLES.map((item) => {
                const count = dhikrCounts[item.id] || 0;
                const isComplete = count >= item.target;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleIncrementDhikr(item.id, item.target)}
                    className={`w-full text-right rounded-xl p-3.5 border transition-all active:scale-[0.99] space-y-2 ${
                      isComplete
                        ? 'bg-[#0A3628]/80 border-[#34D399]'
                        : 'bg-[#061812] border-[#D4AF37]/30 hover:border-[#D4AF37]/65'
                    }`}
                  >
                    <p className="font-amiri text-base sm:text-lg text-white leading-[1.9]">
                      {item.text}
                    </p>
                    <div className="flex items-center justify-between gap-2 text-[11px]">
                      <span className="text-slate-300 truncate">{item.virtue}</span>
                      <span
                        className={`font-mono font-bold tabular-nums shrink-0 ${
                          isComplete ? 'text-[#34D399]' : 'text-[#F3D078]'
                        }`}
                      >
                        {toArabicDigits(count)}/{toArabicDigits(item.target)} {isComplete ? '✓' : ''}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 6. REVIVING TODAY'S PROPHETIC SUNNAH (إحياء سُنة نبوية اليوم) */}
          <section className="rounded-2xl bg-[#0C2A21] border border-[#D4AF37]/35 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-[#F3D078]">إحياء سُنة نبوية اليوم</span>
              <button
                type="button"
                onClick={() => setSunnahIndex((i) => (i + 1) % DAILY_PROPHETIC_SUNAN.length)}
                className="min-h-[34px] px-2.5 py-1 rounded-lg bg-[#061812] border border-[#D4AF37]/35 text-[11px] font-bold text-slate-200 hover:text-[#F3D078]"
              >
                سُنة أخرى ↻
              </button>
            </div>

            <div className="rounded-xl bg-[#061812] border border-[#D4AF37]/25 p-3.5 space-y-2">
              <h4 className="font-amiri text-lg font-bold text-white">
                {currentSunnah.titleAr}
              </h4>
              <p className="text-xs text-slate-200 leading-relaxed">
                {currentSunnah.description}
              </p>
              <div className="text-[11px] text-[#34D399] leading-relaxed">
                {currentSunnah.evidence}
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggleReviveSunnah}
              className={`w-full min-h-[44px] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-1.5 ${
                isCurrentSunnahRevived
                  ? 'royal-gold-foil shadow-[0_6px_20px_rgba(212,175,55,0.28)]'
                  : 'bg-[#061812] border border-[#34D399]/50 text-[#34D399] hover:bg-[#0A3628]'
              }`}
            >
              <span>{isCurrentSunnahRevived ? 'تم الإحياء ★' : 'أحييتُها ✓'}</span>
            </button>
          </section>

          {/* 7. COMPREHENSIVE DUAS BY FEELING (جوامع الدعاء حسب شعورك الآن) */}
          <section className="rounded-2xl bg-[#0C2A21] border border-[#D4AF37]/35 p-4 space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-[#F3D078]">
                جوامع الدعاء حسب شعورك الآن
              </span>
              {currentFeelingCategory.duas.length > 1 && (
                <button
                  type="button"
                  onClick={() => setFeelingDuaIdx((i) => i + 1)}
                  className="text-[11px] font-bold text-[#34D399] hover:underline"
                >
                  دعاء آخر ↻
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {FEELING_DUAS_CATEGORIES.map((cat) => {
                const isActive = cat.id === selectedFeelingId;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setSelectedFeelingId(cat.id);
                      setFeelingDuaIdx(0);
                    }}
                    className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all ${
                      isActive
                        ? 'royal-gold-foil shadow'
                        : 'bg-[#061812] border border-[#D4AF37]/30 text-slate-200 hover:border-[#D4AF37]/65'
                    }`}
                  >
                    {cat.labelAr}
                  </button>
                );
              })}
            </div>

            <div className="rounded-xl bg-[#061812] border border-[#D4AF37]/30 p-3.5 space-y-3">
              <p className="font-amiri text-lg text-white leading-[2]">
                {currentFeelingDua.text}
              </p>
              <div className="text-[11px] text-[#34D399]">{currentFeelingDua.source}</div>

              <div className="flex items-center gap-2 pt-2 border-t border-[#D4AF37]/20">
                <button
                  type="button"
                  onClick={() => handleCopyText(currentFeelingDua.text, '📋 تم نسخ الدعاء بنجاح')}
                  className="flex-1 min-h-[40px] px-3 py-2 rounded-xl bg-[#0C2A21] border border-[#D4AF37]/35 text-xs font-bold text-slate-100 hover:border-[#F3D078] flex items-center justify-center gap-1.5"
                >
                  <span>📋 نسخ</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSharePayload({
                      badgeAr: currentFeelingCategory.labelAr,
                      mainText: currentFeelingDua.text,
                      subtitleAr: currentFeelingDua.source,
                    })
                  }
                  className="flex-1 min-h-[40px] px-3 py-2 rounded-xl royal-gold-foil text-xs font-black flex items-center justify-center gap-1.5"
                >
                  <span>🖼️ بطاقة</span>
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* ============================================================
          MODAL 1: FULL-SCREEN 114-SURAH MUSHAF MODAL
         ============================================================ */}
      {isMushafOpen && (
        <div
          dir="rtl"
          className="fixed inset-0 z-[70] bg-[#04130E]/98 backdrop-blur-md flex flex-col text-right theme-keep-light"
        >
          {/* Sticky Mushaf Header */}
          <div className="shrink-0 bg-[#071E17] border-b border-[#D4AF37]/35 px-4 py-3">
            <div className="max-w-2xl mx-auto flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                {mushafView === 'reader' && (
                  <button
                    type="button"
                    onClick={() => setMushafView('index')}
                    className="min-h-[40px] px-3 py-1.5 rounded-xl bg-[#0C2A21] border border-[#D4AF37]/35 text-xs font-bold text-[#F3D078] flex items-center gap-1"
                  >
                    <ChevronRight className="w-4 h-4" />
                    <span>الفهرس</span>
                  </button>
                )}
                <div>
                  <h3 className="font-amiri text-lg sm:text-xl font-bold text-[#F3D078]">
                    {mushafView === 'index'
                      ? 'المصحف الشريف كاملاً (١١٤ سورة)'
                      : `سورة ${activeSurahMeta.nameAr}`}
                  </h3>
                  <div className="text-[11px] text-[#34D399] tabular-nums">
                    {mushafView === 'index'
                      ? `🔖 علامة الوقوف: ${formatBookmarkLabel(bookmark)}`
                      : `${activeSurahMeta.revelationType} • ${toArabicDigits(activeSurahMeta.ayahCount)} آية • برواية حفص عن عاصم`}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {mushafView === 'reader' && (
                  <>
                    <div className="flex items-center gap-0.5 bg-[#04130E] p-1 rounded-xl border border-[#D4AF37]/30">
                      <button
                        type="button"
                        onClick={() => setMushafFontSize((s) => Math.max(18, s - 2))}
                        className="min-w-[36px] min-h-[36px] rounded-lg text-xs font-bold text-slate-200 hover:text-[#F3D078]"
                        title="تصغير الخط"
                      >
                        أ-
                      </button>
                      <button
                        type="button"
                        onClick={() => setMushafFontSize((s) => Math.min(38, s + 2))}
                        className="min-w-[36px] min-h-[36px] rounded-lg text-xs font-bold text-slate-200 hover:text-[#F3D078]"
                        title="تكبير الخط"
                      >
                        أ+
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSaveBookmark(1)}
                      className="min-h-[40px] px-3 py-1.5 rounded-xl royal-gold-foil text-xs font-black flex items-center gap-1"
                    >
                      <span>🔖 حفظ الوقوف</span>
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => setIsMushafOpen(false)}
                  className="min-w-[40px] min-h-[40px] rounded-xl bg-[#0C2A21] border border-[#D4AF37]/35 text-slate-200 hover:text-[#F3D078] flex items-center justify-center"
                  aria-label="إغلاق المصحف"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Mushaf Body */}
          <div className="flex-1 overflow-y-auto px-4 py-5">
            <div className="max-w-2xl mx-auto">
              {mushafView === 'index' ? (
                <div className="space-y-4">
                  {/* Resume Bookmark Quick Bar */}
                  <button
                    type="button"
                    onClick={() => openSurahInMushaf(bookmark.surahNumber)}
                    className="w-full min-h-[48px] px-4 py-3 rounded-2xl emerald-badge flex items-center justify-between text-xs font-bold"
                  >
                    <span>🔖 متابعة القراءة من علامة الوقوف: {formatBookmarkLabel(bookmark)}</span>
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {/* Search Input */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={mushafSearch}
                      onChange={(e) => setMushafSearch(e.target.value)}
                      placeholder="ابحث باسم السورة أو رقمها (١ - ١١٤)..."
                      className="w-full min-h-[46px] pr-10 pl-4 rounded-xl bg-[#071E17] border border-[#D4AF37]/40 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#F3D078]"
                    />
                  </div>

                  {/* 114 Surahs Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {filteredSurahs.map((s) => (
                      <button
                        key={s.number}
                        type="button"
                        onClick={() => openSurahInMushaf(s.number)}
                        className="min-h-[58px] px-3.5 py-2.5 rounded-xl bg-[#071E17] border border-[#D4AF37]/30 hover:border-[#F3D078] hover:bg-[#0C2A21] flex items-center justify-between gap-3 text-right transition-all"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-9 h-9 rounded-xl bg-[#04130E] border border-[#D4AF37]/45 text-xs font-mono font-bold tabular-nums text-[#F3D078] flex items-center justify-center shrink-0">
                            {toArabicDigits(s.number)}
                          </span>
                          <div className="min-w-0">
                            <div className="font-amiri text-base font-bold text-white truncate">
                              سورة {s.nameAr}
                            </div>
                            <div className="text-[11px] text-slate-400 tabular-nums">
                              {s.revelationType} • {toArabicDigits(s.ayahCount)} آية
                            </div>
                          </div>
                        </div>
                        <ChevronLeft className="w-4 h-4 text-[#D4AF37] shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {loadingSurah ? (
                    <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-300">
                      <Loader2 className="w-8 h-8 animate-spin text-[#F3D078]" />
                      <span className="text-sm">جاري فتح سورة {activeSurahMeta.nameAr}...</span>
                    </div>
                  ) : surahError ? (
                    <div className="py-14 text-center space-y-3">
                      <p className="text-sm text-rose-300">{surahError}</p>
                      <button
                        type="button"
                        onClick={() => setReloadNonce((n) => n + 1)}
                        className="min-h-[44px] px-5 py-2 rounded-xl royal-gold-foil text-xs font-black"
                      >
                        إعادة المحاولة
                      </button>
                    </div>
                  ) : (
                    <div className="rounded-3xl bg-[#071E17] border border-[#D4AF37]/40 p-5 sm:p-8 space-y-6">
                      {/* Bismillah except Al-Fatiha (1) & At-Tawbah (9) */}
                      {activeSurahMeta.number !== 1 && activeSurahMeta.number !== 9 && (
                        <div className="text-center font-amiri text-2xl sm:text-3xl text-[#F3D078] pb-4 border-b border-[#D4AF37]/25">
                          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                        </div>
                      )}

                      <div
                        className="font-amiri text-right text-amber-50 leading-[2.45] select-text"
                        style={{ fontSize: `${mushafFontSize}px` }}
                      >
                        {surahAyahs.map((ayah) => {
                          const isBookmarkedHere =
                            bookmark.surahNumber === activeSurahMeta.number &&
                            bookmark.ayahNumber === ayah.numberInSurah;
                          return (
                            <React.Fragment key={ayah.numberInSurah}>
                              <span
                                onClick={() => handleSaveBookmark(ayah.numberInSurah)}
                                title="اضغط لحفظ علامة الوقوف عند هذه الآية"
                                className={`cursor-pointer rounded-lg px-0.5 transition-colors ${
                                  isBookmarkedHere
                                    ? 'bg-[#0A3628] text-[#34D399]'
                                    : 'hover:bg-[#0C2A21]'
                                }`}
                              >
                                {ayah.text}
                              </span>{' '}
                              <span className="inline-block text-[#F3D078] text-[0.82em] tabular-nums select-none mx-0.5">
                                ﴿{toArabicDigits(ayah.numberInSurah)}﴾
                              </span>{' '}
                            </React.Fragment>
                          );
                        })}
                      </div>

                      <div className="text-center text-[11px] text-slate-400 pt-2">
                        اضغط على أي آية لحفظ علامة الوقوف عندها تلقائياً
                      </div>

                      {/* Previous / Next Surah */}
                      <div className="flex items-center justify-between gap-3 pt-4 border-t border-[#D4AF37]/25">
                        <button
                          type="button"
                          disabled={activeSurahNumber <= 1}
                          onClick={() => setActiveSurahNumber((n) => Math.max(1, n - 1))}
                          className="min-h-[42px] px-4 py-2 rounded-xl bg-[#0C2A21] border border-[#D4AF37]/35 text-xs font-bold text-[#F3D078] disabled:opacity-40"
                        >
                          السورة السابقة
                        </button>
                        <button
                          type="button"
                          disabled={activeSurahNumber >= 114}
                          onClick={() => setActiveSurahNumber((n) => Math.min(114, n + 1))}
                          className="min-h-[42px] px-4 py-2 rounded-xl bg-[#0C2A21] border border-[#D4AF37]/35 text-xs font-bold text-[#F3D078] disabled:opacity-40"
                        >
                          السورة التالية
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL 2: SAKINAH RUQYAH MODAL (🕊️ رقية السكينة)
         ============================================================ */}
      {isRuqyahModalOpen && (
        <div
          dir="rtl"
          className="fixed inset-0 z-[75] flex items-center justify-center p-3 sm:p-5 bg-[#04130E]/90 backdrop-blur-md theme-keep-light"
          onClick={() => setIsRuqyahModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md max-h-[88vh] rounded-3xl bg-[#071E17] border-2 border-[#D4AF37]/60 flex flex-col overflow-hidden text-right shadow-2xl"
          >
            <div className="shrink-0 px-5 py-4 border-b border-[#D4AF37]/25 flex items-center justify-between">
              <div>
                <h3 className="font-amiri text-xl font-bold text-[#F3D078]">
                  🕊️ رقية السكينة والتحصين
                </h3>
                <p className="text-[11px] text-[#34D399]">
                  آيات السكينة القرآنية وأدعية التحصين النبوية
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsRuqyahModalOpen(false)}
                className="min-w-[40px] min-h-[40px] rounded-xl bg-[#0C2A21] border border-[#D4AF37]/35 text-slate-200 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              <div className="text-xs font-bold text-[#F3D078]">أولاً: آيات السكينة والشفاء</div>
              {SAKINAH_RUQYAH_VERSES.map((v) => (
                <div
                  key={v.id}
                  className="rounded-xl bg-[#0C2A21] border border-[#D4AF37]/30 p-3.5 space-y-2"
                >
                  <div className="text-xs font-bold text-[#34D399]">{v.titleAr}</div>
                  <p className="font-amiri text-lg text-white leading-[1.95]">{v.text}</p>
                  <div className="flex items-center justify-between text-[11px] text-slate-300">
                    <span>{v.source}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyText(v.text)}
                      className="text-[#F3D078] hover:underline font-bold"
                    >
                      📋 نسخ
                    </button>
                  </div>
                </div>
              ))}

              <div className="text-xs font-bold text-[#F3D078] pt-2">ثانياً: أدعية التحصين النبوية</div>
              {SAKINAH_PROPHETIC_DUAS.map((d) => (
                <div
                  key={d.id}
                  className="rounded-xl bg-[#061812] border border-[#D4AF37]/30 p-3.5 space-y-2"
                >
                  <div className="text-xs font-bold text-[#34D399]">{d.titleAr}</div>
                  <p className="font-amiri text-lg text-white leading-[1.95]">{d.text}</p>
                  <div className="flex items-center justify-between text-[11px] text-slate-300">
                    <span>{d.source}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyText(d.text)}
                      className="text-[#F3D078] hover:underline font-bold"
                    >
                      📋 نسخ
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL 3: ALL 99 NAMES OF ALLAH GRID MODAL
         ============================================================ */}
      {isAllNamesOpen && (
        <div
          dir="rtl"
          className="fixed inset-0 z-[75] flex items-center justify-center p-3 sm:p-5 bg-[#04130E]/90 backdrop-blur-md theme-keep-light"
          onClick={() => setIsAllNamesOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl max-h-[90vh] rounded-3xl bg-[#071E17] border-2 border-[#D4AF37]/60 flex flex-col overflow-hidden text-right shadow-2xl"
          >
            <div className="shrink-0 px-5 py-4 border-b border-[#D4AF37]/25 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-amiri text-xl font-bold text-[#F3D078]">
                    أسماء الله الحسنى (٩٩ اسماً)
                  </h3>
                  <p className="text-[11px] text-[#34D399]">
                    اضغط على أي اسم لمعايشته والدعاء به في بطاقة اسم اليوم
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAllNamesOpen(false)}
                  className="min-w-[40px] min-h-[40px] rounded-xl bg-[#0C2A21] border border-[#D4AF37]/35 text-slate-200 flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={namesSearch}
                  onChange={(e) => setNamesSearch(e.target.value)}
                  placeholder="ابحث عن اسم أو معنى..."
                  className="w-full min-h-[42px] pr-10 pl-3 rounded-xl bg-[#04130E] border border-[#D4AF37]/35 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#F3D078]"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {filteredAllNames.map((entry) => {
                const isSelected = entry.number === selectedNameNumber;
                return (
                  <button
                    key={entry.number}
                    type="button"
                    onClick={() => {
                      setSelectedNameNumber(entry.number);
                      setIsAllNamesOpen(false);
                      showToast(`✨ تم اختيار اسم الله «${entry.name}» للمعايشة`);
                    }}
                    className={`rounded-xl p-3 border text-right space-y-1 transition-all ${
                      isSelected
                        ? 'bg-[#0A3628] border-[#34D399]'
                        : 'bg-[#0C2A21] border-[#D4AF37]/30 hover:border-[#F3D078]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-amiri text-xl font-bold text-[#F3D078]">
                        {entry.name}
                      </span>
                      <span className="text-[11px] font-mono tabular-nums text-[#34D399]">
                        {toArabicDigits(entry.number)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed">{entry.meaning}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL 4: SHARE CARD PREVIEW MODAL (بطاقة المشاركة الملكية)
         ============================================================ */}
      {sharePayload && (
        <div
          dir="rtl"
          className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-[#04130E]/92 backdrop-blur-md theme-keep-light"
          onClick={() => setSharePayload(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl bg-[#071E17] border border-[#D4AF37]/50 p-4 sm:p-5 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#F3D078]">
                🖼️ معاينة بطاقة المشاركة
              </span>
              <button
                type="button"
                onClick={() => setSharePayload(null)}
                className="min-w-[36px] min-h-[36px] rounded-xl bg-[#0C2A21] border border-[#D4AF37]/35 text-slate-200 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Designed Royal Emerald & Gold Share Card */}
            <div className="rounded-2xl khazain-geo-pattern border-2 border-[#D4AF37]/75 p-5 sm:p-6 text-center space-y-4 shadow-[0_14px_35px_rgba(0,0,0,0.5)]">
              <div className="text-xs font-bold text-[#F3D078]">۞ {sharePayload.badgeAr} ۞</div>

              {sharePayload.titleAr && (
                <div className="font-amiri text-3xl font-bold text-[#34D399]">
                  {sharePayload.titleAr}
                </div>
              )}

              <p className="font-amiri text-lg sm:text-xl text-white leading-[2] whitespace-pre-line">
                {sharePayload.mainText}
              </p>

              <div className="pt-3 border-t border-[#D4AF37]/25 space-y-1">
                <div className="text-xs font-semibold text-[#F3D078]">
                  {sharePayload.subtitleAr}
                </div>
                <div className="text-[11px] text-emerald-200/75">
                  خزائن النور • تطبيق محراب
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleWebShare(sharePayload)}
                className="min-h-[44px] px-3 py-2 rounded-xl royal-gold-foil text-xs font-black flex items-center justify-center gap-1"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>مشاركة</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  handleCopyText(
                    `${sharePayload.titleAr ? `${sharePayload.titleAr}\n` : ''}${sharePayload.mainText}\n(${sharePayload.subtitleAr})`,
                    '📋 تم نسخ نص البطاقة'
                  )
                }
                className="min-h-[44px] px-3 py-2 rounded-xl bg-[#0C2A21] border border-[#D4AF37]/40 text-xs font-bold text-slate-100 flex items-center justify-center gap-1"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>نسخ</span>
              </button>
              <button
                type="button"
                onClick={() => handleDownloadSharePng(sharePayload)}
                className="min-h-[44px] px-3 py-2 rounded-xl emerald-badge text-xs font-bold flex items-center justify-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>صورة</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          LIGHTWEIGHT BOTTOM TOAST NOTIFICATION
         ============================================================ */}
      {toastMsg && (
        <div
          dir="rtl"
          className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[90] max-w-sm w-[calc(100vw-2rem)] rounded-2xl bg-[#0A3628] border border-[#34D399]/60 text-[#34D399] px-4 py-3 text-xs sm:text-sm font-bold text-center shadow-[0_12px_32px_rgba(0,0,0,0.6)] animate-fade-in"
        >
          {toastMsg}
        </div>
      )}
    </div>
  );
};
