import React, { useState, useEffect } from 'react';
import { Sun, Check, Clock, X } from 'lucide-react';
import {
  JUMUAH_SUNAN,
  loadJumuahSunanChecklist,
  saveJumuahSunanChecklist,
} from '../utils/jumuahData';

interface JumuahSunanCardProps {
  visible: boolean;
  minutesToJumuah: number | null;
  dhuhrTimeStr: string;
  isSimulated: boolean;
  onDismiss?: () => void;
}

export const JumuahSunanCard: React.FC<JumuahSunanCardProps> = ({
  visible,
  minutesToJumuah,
  dhuhrTimeStr,
  isSimulated,
  onDismiss,
}) => {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>(() =>
    loadJumuahSunanChecklist()
  );

  useEffect(() => {
    saveJumuahSunanChecklist(checkedItems);
  }, [checkedItems]);

  if (!visible) return null;

  const doneCount = JUMUAH_SUNAN.filter((item) => checkedItems[item.id]).length;

  const toggleItem = (id: string) => {
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <section className="relative overflow-hidden rounded-3xl border-2 border-[#fbbf24]/70 bg-gradient-to-br from-[#07362b]/95 via-[#05261f]/95 to-[#031410]/95 p-5 md:p-6 shadow-[0_14px_45px_rgba(251,191,36,0.18)] backdrop-blur-xl space-y-4 text-right">
      <div className="absolute inset-1.5 rounded-[20px] border border-[#fbbf24]/25 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.16)_0%,transparent_55%)] pointer-events-none" />

      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-[#fbbf24]">
            <Sun className="w-4 h-4 shrink-0" />
            <span>تنبيه التبكير وسنن يوم الجمعة (قبل الأذان بساعة)</span>
            {minutesToJumuah !== null && (
              <>
                <span className="text-[#e5b869]/50" aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1 text-emerald-300 font-mono tabular-nums">
                  <Clock className="w-3.5 h-3.5" />
                  {isSimulated
                    ? `معاينة: باقي ٥٢ دقيقة على خطبة الجمعة (${dhuhrTimeStr})`
                    : `باقي ${Math.max(1, Math.round(minutesToJumuah))} دقيقة على أذان الجمعة (${dhuhrTimeStr})`}
                </span>
              </>
            )}
          </div>
          <h3 className="text-xl sm:text-2xl font-bold font-amiri text-white">
            سُنن التهيؤ والتبكير إلى صلاة الجمعة المباركة
          </h3>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-bold text-[#fbbf24] font-mono tabular-nums">
            {doneCount} / {JUMUAH_SUNAN.length}
          </span>
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              aria-label="إخفاء تنبيه سنن الجمعة"
              className="w-8 h-8 rounded-xl bg-[#041d17] border border-[#e5b869]/35 hover:border-[#fbbf24] text-[#fbbf24] flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 5 Interactive Sunan Grid */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
        {JUMUAH_SUNAN.map((sunnah) => {
          const isChecked = Boolean(checkedItems[sunnah.id]);
          return (
            <button
              key={sunnah.id}
              type="button"
              onClick={() => toggleItem(sunnah.id)}
              className={`p-3.5 rounded-2xl border text-right transition-all flex flex-col justify-between gap-2 ${
                isChecked
                  ? 'bg-emerald-950/75 border-[#fbbf24] shadow-[0_0_16px_rgba(251,191,36,0.18)]'
                  : 'bg-[#031612]/85 border-[#e5b869]/30 hover:border-[#e5b869]/65'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs sm:text-sm font-bold text-[#fbbf24]">{sunnah.title}</span>
                <span
                  className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                    isChecked
                      ? 'bg-[#fbbf24] border-[#fbbf24] text-slate-950'
                      : 'border-[#e5b869]/45 text-transparent'
                  }`}
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">{sunnah.detail}</p>
            </button>
          );
        })}
      </div>

      {/* Reward of the First Hour Hadith */}
      <div className="relative z-10 rounded-2xl bg-[#031612]/90 border border-[#e5b869]/30 p-3.5 sm:p-4 text-xs sm:text-sm text-amber-100/95 leading-relaxed">
        <strong className="text-[#fbbf24] block mb-1 font-amiri text-base">
          فضل الساعة الأولى كمن قرّب بَدَنة:
        </strong>
        {JUMUAH_SUNAN[4].hadithNote}
      </div>
    </section>
  );
};
