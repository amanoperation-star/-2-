import React, { useState, useEffect } from 'react';
import { X, BookOpen, ChevronRight, ChevronLeft, Volume2, Sparkles, Check } from 'lucide-react';
import { PrayerWirdInfo, KhatmaPrayerKey, TOTAL_MUSHAF_PAGES, toArabicDigits } from '../utils/khatmaData';

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
  };
  numberInSurah: number;
  juz: number;
  page: number;
}

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

  useEffect(() => {
    setCurrentPage(wird.startPage);
  }, [wird.startPage]);

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    setLoading(true);
    setError('');

    fetch(`https://api.alquran.cloud/v1/page/${currentPage}/quran-uthmani`)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data && data.code === 200 && data.data && data.data.ayahs) {
          setAyahs(data.data.ayahs);
        } else {
          setError('تعذر تحميل صفحة القرآن الكريم');
        }
        setLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setError('حدث خطأ في الاتصال بالإنترنت');
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentPage, isOpen]);

  if (!isOpen) return null;

  const handlePrevPage = () => {
    if (currentPage > wird.startPage) {
      setCurrentPage((p) => p - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < wird.endPage) {
      setCurrentPage((p) => p + 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-gradient-to-br from-[#062922] via-[#041d18] to-[#02100d] border-2 border-[#e5b869]/60 shadow-[0_20px_60px_rgba(0,0,0,0.7)] text-slate-100 overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5b869]/30 bg-[#031410]/9otha">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#fbbf24] to-[#d97706] flex items-center justify-center text-slate-950 shadow">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold font-amiri text-[#fbbf24]">
                وِرد صلاة {prayerNameAr} ({wird.summary})
              </h3>
              <p className="text-xs text-emerald-300">
                الصفحات من {toArabicDigits(wird.startPage)} إلى {toArabicDigits(wird.endPage)} — عرض المصحف الشريف
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onToggleComplete}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                isCompleted
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow'
                  : 'bg-[#052720] border border-[#e5b869]/40 text-[#fbbf24] hover:bg-[#07362c]'
              }`}
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{isCompleted ? 'تم إنجاز الوِرد' : 'تسجيل إنجاز الوِرد'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-[#041d18] border border-[#e5b869]/30 text-slate-300 hover:text-white hover:bg-[#062a22] transition-colors"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Page navigation bar if multiple pages */}
        {wird.endPage > wird.startPage && (
          <div className="flex items-center justify-between px-6 py-2.5 bg-[#031511] border-b border-[#e5b869]/20 text-xs">
            <button
              type="button"
              onClick={handlePrevPage}
              disabled={currentPage <= wird.startPage}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#05221c] text-[#fbbf24] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#073128] transition-colors font-bold"
            >
              <ChevronRight className="w-4 h-4" />
              <span>الصفحة السابقة</span>
            </button>

            <span className="font-mono font-bold text-[#fbbf24] text-sm">
              صفحة {toArabicDigits(currentPage)} (من {toArabicDigits(wird.startPage)} إلى {toArabicDigits(wird.endPage)})
            </span>

            <button
              type="button"
              onClick={handleNextPage}
              disabled={currentPage >= wird.endPage}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#05221c] text-[#fbbf24] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#073128] transition-colors font-bold"
            >
              <span>الصفحة التالية</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Modal Body / Quran Reader Frame */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 text-center select-text bg-[radial-gradient(ellipse_at_center,rgba(4,33,27,0.7)_0%,rgba(2,14,11,0.95)_100%)]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <div className="w-10 h-10 rounded-full border-2 border-[#fbbf24] border-t-transparent animate-spin" />
              <p className="text-sm text-slate-300">جارِ تحميل صفحات المصحف الشريف...</p>
            </div>
          ) : error ? (
            <div className="py-16 text-rose-300 text-sm">{error}</div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6 bg-[#041a15]/90 border border-[#e5b869]/30 rounded-3xl p-6 md:p-10 shadow-2xl">
              <div className="text-xs text-[#e5b869] font-mono tracking-widest pb-3 border-b border-[#e5b869]/20 flex items-center justify-between">
                <span>صفحة رقم {toArabicDigits(currentPage)} من المصحف الشريف</span>
                <span>{wird.surahLabel}</span>
              </div>

              <div className="text-xl md:text-2xl lg:text-3xl font-amiri font-bold text-slate-100 leading-[2.4] text-justify tracking-wide px-2">
                {ayahs.map((ayah) => (
                  <span key={ayah.number} className="inline">
                    <span>{ayah.text}</span>
                    <span className="inline-flex items-center justify-center mx-1.5 px-2 py-0.5 rounded-full bg-[#e5b869]/15 text-[#fbbf24] text-xs font-mono font-bold border border-[#e5b869]/30">
                      ﴿{toArabicDigits(ayah.numberInSurah)}﴾
                    </span>
                  </span>
                ))}
              </div>

              <div className="pt-6 border-t border-[#e5b869]/20 flex items-center justify-between text-xs text-slate-400">
                <span>{wird.pagesLabel}</span>
                <span className="text-[#fbbf24] font-semibold">صدق الله العظيم</span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-[#03120f] border-t border-[#e5b869]/30 flex items-center justify-between">
          <div className="text-xs text-slate-300">
            انقر على «تسجيل إنجاز الوِرد» لحفظ تقدمك في ختمة القرآن اليومية
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#fbbf24] to-[#d97706] text-slate-950 font-bold text-xs shadow hover:brightness-105 transition-all"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
