import React, { useState, useEffect } from 'react';
import { BookOpen, X, Sparkles } from 'lucide-react';
import { DailyPrayerSurah } from '../utils/dailyPrayerSurahsData';
import { toArabicDigits } from '../utils/khatmaData';

export interface SelectedSurahModalData {
  surah: DailyPrayerSurah;
  prayerNameAr: string;
}

interface SurahReaderModalProps {
  selectedSurah: SelectedSurahModalData | null;
  onClose: () => void;
}

export const SurahReaderModal: React.FC<SurahReaderModalProps> = ({
  selectedSurah,
  onClose,
}) => {
  const [fontSize, setFontSize] = useState<number>(() => {
    if (typeof window === 'undefined') return 26;
    const saved = Number(localStorage.getItem('daily_surah_font_size'));
    return !Number.isNaN(saved) && saved >= 20 && saved <= 40 ? saved : 26;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('daily_surah_font_size', String(fontSize));
  }, [fontSize]);

  if (!selectedSurah) return null;

  const { surah, prayerNameAr } = selectedSurah;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
        className="relative w-full max-w-2xl max-h-[90vh] rounded-3xl border-2 border-[#e5b869]/60 bg-[#041b16]/95 text-right flex flex-col overflow-hidden shadow-[0_24px_70px_rgba(0,0,0,0.65)]"
      >
        {/* Header: Surah Title, Revelation Type, Ayahs Count, Font Resize (أ+ / أ-) & Close */}
        <div className="shrink-0 px-4 sm:px-5 py-4 border-b border-[#e5b869]/25 bg-[#03120f]/90 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#05221c] border border-[#e5b869]/45 flex items-center justify-center text-[#fbbf24] shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-lg sm:text-xl font-amiri text-[#fbbf24] flex flex-wrap items-center gap-2">
                <span>{surah.title}</span>
                <span className="text-[#e5b869] text-sm" aria-hidden="true">❖</span>
                <span className="text-xs sm:text-sm font-sans text-emerald-300 font-medium">
                  {prayerNameAr}
                </span>
              </h4>
              <p className="text-xs text-slate-300 flex items-center gap-2 mt-0.5">
                <span className="font-semibold text-[#e5b869]">{surah.revelationType}</span>
                <span aria-hidden="true">·</span>
                <span>{toArabicDigits(surah.ayahsCount)} آيات</span>
                <span aria-hidden="true">·</span>
                <span>بالتشكيل الكامل</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Font Size Controls */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-[#031713] border border-[#e5b869]/30">
              <button
                type="button"
                onClick={() => setFontSize((s) => Math.max(20, s - 2))}
                className="min-w-[44px] min-h-[44px] rounded-lg bg-[#05221c] hover:bg-[#07332a] text-xs font-bold text-slate-200 transition-colors"
                title="تصغير الخط"
              >
                أ-
              </button>
              <span className="px-2 text-xs font-mono tabular-nums text-[#fbbf24]">
                {toArabicDigits(fontSize)}
              </span>
              <button
                type="button"
                onClick={() => setFontSize((s) => Math.min(40, s + 2))}
                className="min-w-[44px] min-h-[44px] rounded-lg bg-[#05221c] hover:bg-[#07332a] text-xs font-bold text-slate-200 transition-colors"
                title="تكبير الخط"
              >
                أ+
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="min-w-[44px] min-h-[44px] rounded-xl bg-[#031713] hover:bg-[#06261f] border border-[#e5b869]/35 text-slate-200 hover:text-[#fbbf24] flex items-center justify-center transition-colors"
              title="إغلاق النافذة"
              aria-label="إغلاق النافذة"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body: Bismillah + Full Diacritized Uthmani Verses in Amiri */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-5">
          <div className="text-center font-amiri text-2xl sm:text-3xl text-[#fbbf24] pb-3 border-b border-[#e5b869]/20">
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </div>

          <div
            className="font-amiri text-right text-slate-100 leading-[2.4] select-text"
            style={{ fontSize: `${fontSize}px` }}
          >
            {surah.ayahs.map((ayah) => (
              <React.Fragment key={ayah.numberInSurah}>
                <span>{ayah.text}</span>{' '}
                <span className="inline-block text-[#fbbf24] mx-1 text-[0.82em] select-none">
                  ﴿{toArabicDigits(ayah.numberInSurah)}﴾
                </span>{' '}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Footer: Compact Rare Word Tafsir Card in Emerald (#10B981) + Close */}
        <div className="shrink-0 px-4 sm:px-5 py-3.5 border-t border-[#e5b869]/25 bg-[#03120f]/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex-1 px-3.5 py-2.5 rounded-2xl border border-[#10B981]/50 bg-[#10B981]/12 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-[#10B981]" />
            <div className="text-xs sm:text-sm leading-relaxed">
              <span className="font-bold text-[#10B981]">تفسير الكلمة الغريبة: </span>
              <span className="font-amiri text-base font-bold text-[#10B981] mx-1">
                {surah.gharibWord}
              </span>
              <span className="text-[#10B981] font-medium">{surah.gharibMeaning}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-5 py-2 rounded-xl bg-gradient-to-r from-[#fbbf24] to-[#d97706] text-slate-950 text-xs sm:text-sm font-black hover:brightness-105 transition-all shrink-0"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
