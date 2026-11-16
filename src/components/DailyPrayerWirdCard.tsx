import React, { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { PrayerName } from '../types';
import {
  DAILY_PRAYER_SURAHS,
  DailyPrayerWirdGroup,
} from '../utils/dailyPrayerSurahsData';
import { toArabicDigits } from '../utils/khatmaData';
import { SelectedSurahModalData, SurahReaderModal } from './SurahReaderModal';

interface DailyPrayerWirdCardProps {
  nextPrayerKey: PrayerName;
  isJumuahActive?: boolean;
}

export const DailyPrayerWirdCard: React.FC<DailyPrayerWirdCardProps> = ({
  nextPrayerKey,
  isJumuahActive = false,
}) => {
  const [selectedSurah, setSelectedSurah] = useState<SelectedSurahModalData | null>(null);

  const getGroupTitle = (group: DailyPrayerWirdGroup) =>
    isJumuahActive && group.prayerKey === 'dhuhr' ? 'صلاة الجمعة / الظهر' : group.prayerNameAr;

  return (
    <>
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#041f1a]/95 via-[#072e26]/90 to-[#031410]/95 border border-[#e5b869]/40 p-5 sm:p-6 shadow-[0_14px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl text-right">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#e5b869]/20">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#031713] border border-[#e5b869]/45 flex items-center justify-center shrink-0 text-[#fbbf24]">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold font-amiri text-[#fbbf24] tracking-wide flex items-center gap-2">
                <span>❖ ورد صلوات اليوم ❖</span>
              </h3>
              <p className="text-xs text-slate-300">
                سورتان مقترحتان لكل صلاة مع معنى كلمة غريبة للتدبر — اضغط على اسم السورة لقراءتها فوراً بالتشكيل
              </p>
            </div>
          </div>
        </div>

        {/* 5 Prayers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3.5 mt-4">
          {DAILY_PRAYER_SURAHS.map((group) => {
            const isNextPrayer = group.prayerKey === nextPrayerKey;
            const prayerLabel = getGroupTitle(group);

            return (
              <div
                key={group.prayerKey}
                className={`rounded-2xl border p-3.5 flex flex-col gap-3 transition-all ${
                  isNextPrayer
                    ? 'bg-[#062d24]/95 border-[#fbbf24]/75 shadow-[0_0_24px_rgba(251,191,36,0.16)]'
                    : 'bg-[#031713]/90 border-[#e5b869]/25 hover:border-[#e5b869]/50'
                }`}
              >
                {/* Prayer Header */}
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#e5b869]/15">
                  <span className="font-bold text-sm font-amiri text-white flex items-center gap-1.5">
                    <span className="text-[#e5b869] text-xs" aria-hidden="true">❖</span>
                    <span>{prayerLabel}</span>
                  </span>
                  {isNextPrayer && (
                    <span className="text-[11px] font-bold text-[#fbbf24] whitespace-nowrap">
                      الصلاة القادمة
                    </span>
                  )}
                </div>

                {/* Two Short Surahs */}
                <div className="flex flex-col gap-2.5 flex-1">
                  {group.surahs.map((surah) => (
                    <div key={surah.surahNumber} className="space-y-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedSurah({ surah, prayerNameAr: prayerLabel })}
                        className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-[#05221c] hover:bg-[#08362d] border border-[#e5b869]/35 hover:border-[#fbbf24] text-right transition-all flex items-center justify-between gap-2 group active:scale-[0.98]"
                        title={`فتح وقراءة ${surah.title} بالتشكيل`}
                      >
                        <span className="font-bold text-sm font-amiri text-[#fbbf24] group-hover:text-white transition-colors whitespace-nowrap">
                          {surah.title}
                        </span>
                        <span className="text-[11px] text-emerald-300 font-medium whitespace-nowrap shrink-0">
                          {toArabicDigits(surah.ayahsCount)} آيات ◂
                        </span>
                      </button>

                      {/* Concise Rare Quranic Word Meaning */}
                      <p className="text-[11px] leading-relaxed text-slate-300 px-1">
                        <strong className="text-[#e5b869] font-amiri text-xs">{surah.gharibWord}</strong>{' '}
                        {surah.gharibMeaning}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Built-in Diacritized Surah Reader Modal */}
      <SurahReaderModal
        selectedSurah={selectedSurah}
        onClose={() => setSelectedSurah(null)}
      />
    </>
  );
};
