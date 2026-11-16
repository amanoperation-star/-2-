import React, { useState } from 'react';
import { X, Copy, Check, Clock, BookOpen, Sparkles } from 'lucide-react';
import { JUMUAH_GOLDEN_HOUR_DUAS } from '../utils/jumuahData';

interface GoldenHourDuasModalProps {
  isOpen: boolean;
  remainingText: string;
  maghribTime: string;
  onClose: () => void;
}

export const GoldenHourDuasModal: React.FC<GoldenHourDuasModalProps> = ({
  isOpen,
  remainingText,
  maghribTime,
  onClose,
}) => {
  const [filter, setFilter] = useState<'all' | 'quran' | 'sunnah'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [prayedIds, setPrayedIds] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const filteredDuas =
    filter === 'all'
      ? JUMUAH_GOLDEN_HOUR_DUAS
      : JUMUAH_GOLDEN_HOUR_DUAS.filter((d) => d.category === filter);

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(null), 2200);
    } catch {
      // ignore clipboard restriction
    }
  };

  const togglePrayed = (id: string) => {
    setPrayedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[#041b16]/98 border-2 border-[#fbbf24]/60 rounded-3xl shadow-[0_0_80px_rgba(251,191,36,0.24)] overflow-hidden my-auto text-right">
        {/* Header */}
        <div className="px-5 sm:px-6 pt-5 pb-4 border-b border-[#e5b869]/25 bg-gradient-to-b from-[#08382c] via-[#04231c] to-[#031612]">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-[#e5b869]">
                <Clock className="w-3.5 h-3.5 text-[#fbbf24]" />
                <span>الوقت المتبقي لأذان المغرب ({maghribTime}):</span>
                <span className="font-mono text-sm text-[#fbbf24] tabular-nums">{remainingText}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold font-amiri text-white">
                جوامع الدعاء — ساعة الاستجابة يوم الجمعة
              </h2>
              <p className="text-xs text-emerald-200/90 leading-relaxed max-w-2xl">
                قال رسول الله ﷺ: «يَوْمُ الْجُمُعَةِ اثْنَتَا عَشْرَةَ سَاعَةً، لَا يُوجَدُ فِيهَا عَبْدٌ مُسْلِمٌ يَسْأَلُ اللَّهَ شَيْئًا إِلَّا آتَاهُ إِيَّاهُ، فَالْتَمِسُوهَا آخِرَ سَاعَةٍ بَعْدَ الْعَصْرِ».
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="إغلاق نافذة ساعة الاستجابة"
              className="w-10 h-10 rounded-xl bg-[#041d17] border border-[#e5b869]/35 hover:border-[#fbbf24] text-[#fbbf24] flex items-center justify-center transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="mt-4 flex items-center gap-1.5 bg-[#031410]/90 p-1 rounded-xl border border-[#e5b869]/25 w-fit">
            {[
              { id: 'all', label: 'جميع الجوامع' },
              { id: 'quran', label: 'من القرآن الكريم' },
              { id: 'sunnah', label: 'من السنة النبوية' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id as 'all' | 'quran' | 'sunnah')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  filter === tab.id
                    ? 'bg-gradient-to-r from-[#fbbf24] via-[#e5b869] to-emerald-400 text-slate-950 shadow'
                    : 'text-slate-300 hover:text-[#fbbf24]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Duas List */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[68vh] overflow-y-auto">
          {filteredDuas.map((dua) => {
            const isPrayed = Boolean(prayedIds[dua.id]);
            const isCopied = copiedId === dua.id;
            return (
              <div
                key={dua.id}
                className={`rounded-2xl p-5 border transition-all space-y-3 ${
                  isPrayed
                    ? 'bg-emerald-950/60 border-[#fbbf24]/60 shadow-[0_0_20px_rgba(251,191,36,0.12)]'
                    : 'bg-[#031612]/90 border-[#e5b869]/25 hover:border-[#e5b869]/50'
                }`}
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#fbbf24]">
                    <BookOpen className="w-3.5 h-3.5 text-[#e5b869] shrink-0" />
                    <span>{dua.title}</span>
                    <span className="text-[#e5b869]/50" aria-hidden="true">·</span>
                    <span className="text-emerald-300 font-medium">{dua.source}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleCopy(dua.id, dua.text)}
                      className="px-3 py-1.5 rounded-lg bg-[#05251e] border border-[#e5b869]/30 hover:border-[#fbbf24] text-xs font-bold text-slate-200 hover:text-[#fbbf24] flex items-center gap-1 transition-colors whitespace-nowrap"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>نُسخ</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>نسخ</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => togglePrayed(dua.id)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1 transition-all whitespace-nowrap ${
                        isPrayed
                          ? 'bg-[#fbbf24] border-[#fbbf24] text-slate-950'
                          : 'bg-[#05251e] border-emerald-500/40 text-emerald-300 hover:border-[#fbbf24]'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isPrayed ? 'تم الدعاء' : 'دعوتُ به'}</span>
                    </button>
                  </div>
                </div>

                <p className="font-amiri text-xl sm:text-2xl text-white leading-[1.95]">
                  {dua.text}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
