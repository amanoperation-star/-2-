import React, { useState, useEffect, useCallback } from 'react';
import { X, ArrowLeft } from 'lucide-react';
import { PeriodicReminderContentFilter, PeriodicReminderItem } from '../types';
import { PERIODIC_VERSES_AND_HADITHS } from '../utils/islamicData';

interface PeriodicReminderPopupProps {
  isOpen: boolean;
  contentType: PeriodicReminderContentFilter;
  forcedItemId?: string | null;
  onClose: () => void;
}

const DURATION_MS = 15000;

export function getPeriodicTypeLabelAr(type: PeriodicReminderItem['type']): string {
  switch (type) {
    case 'quran':
      return 'آية قرآنية';
    case 'hadith':
      return 'حديث نبوي شريف';
    case 'wisdom':
      return 'حكمة اليوم الدينية';
  }
}

export function pickRandomReminder(
  contentType: PeriodicReminderContentFilter,
  excludeId?: string
): PeriodicReminderItem {
  const pool = PERIODIC_VERSES_AND_HADITHS.filter((item) =>
    contentType === 'both' ? true : item.type === contentType
  );
  const candidates =
    pool.length > 1 && excludeId ? pool.filter((item) => item.id !== excludeId) : pool;
  const list = candidates.length > 0 ? candidates : PERIODIC_VERSES_AND_HADITHS;
  const idx = Math.floor(Math.random() * list.length);
  return list[idx];
}

export const PeriodicReminderPopup: React.FC<PeriodicReminderPopupProps> = ({
  isOpen,
  contentType,
  forcedItemId,
  onClose,
}) => {
  const [currentItem, setCurrentItem] = useState<PeriodicReminderItem>(() =>
    pickRandomReminder(contentType)
  );
  const [remainingMs, setRemainingMs] = useState<number>(DURATION_MS);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  const onCloseRef = React.useRef(onClose);
  onCloseRef.current = onClose;

  // Reset item and timer whenever popup opens or contentType changes
  useEffect(() => {
    if (isOpen) {
      const forcedMatch = forcedItemId
        ? PERIODIC_VERSES_AND_HADITHS.find((item) => item.id === forcedItemId)
        : undefined;
      setCurrentItem(forcedMatch || pickRandomReminder(contentType));
      setRemainingMs(DURATION_MS);
      setIsPaused(false);
    }
  }, [isOpen, contentType, forcedItemId]);

  // Smooth 15-second auto-dismiss countdown that pauses while interacting
  useEffect(() => {
    if (!isOpen || isPaused) return;

    const interval = window.setInterval(() => {
      setRemainingMs((prev) => {
        if (prev <= 50) {
          window.clearInterval(interval);
          window.setTimeout(() => onCloseRef.current(), 0);
          return 0;
        }
        return prev - 50;
      });
    }, 50);

    return () => window.clearInterval(interval);
  }, [isOpen, isPaused]);

  const handleNext = useCallback(() => {
    setCurrentItem((prev) => pickRandomReminder(contentType, prev.id));
    setRemainingMs(DURATION_MS);
  }, [contentType]);

  if (!isOpen) return null;

  const progressPct = Math.max(0, Math.min(100, (remainingMs / DURATION_MS) * 100));

  return (
    <aside
      dir="rtl"
      role="status"
      aria-live="polite"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
      className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-1.5rem)] max-w-md animate-fade-in theme-keep-light"
      style={{ fontFamily: "'Cairo', sans-serif" }}
    >
      <div className="relative overflow-hidden rounded-2xl border border-[#D4AF37]/45 bg-[#071E17]/95 px-3.5 pt-2.5 pb-3 shadow-[0_14px_38px_rgba(0,0,0,0.65)] backdrop-blur-xl">
        {/* Clean Unboxed Metadata Header */}
        <div className="flex items-center gap-1.5 text-[11px] leading-tight min-w-0">
          <span className="font-bold text-[#F3D078] whitespace-nowrap shrink-0">
            {getPeriodicTypeLabelAr(currentItem.type)}
          </span>
          <span className="text-[#D4AF37]/50 shrink-0" aria-hidden="true">
            ·
          </span>
          <span className="text-[#34D399] font-medium truncate">
            {currentItem.source}
          </span>
        </div>

        {/* Compact Verse / Hadith / Wisdom Body */}
        <p className="mt-1.5 font-amiri text-[15px] sm:text-base leading-[1.65] text-white line-clamp-3">
          {currentItem.text}
        </p>

        {/* Compact 2-Button Action Row: Next & Close Only */}
        <div className="mt-2 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleNext}
            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#0A241C] border border-[#D4AF37]/45 hover:border-[#F3D078] text-[#F3D078] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
            <span>التالي</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#04130E] border border-[#D4AF37]/25 hover:border-rose-400/60 text-slate-200 hover:text-rose-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
          >
            <X className="w-3.5 h-3.5 shrink-0" />
            <span>إغلاق</span>
          </button>
        </div>

        {/* Subtle 2px Bottom Progress Strip */}
        <div className="absolute bottom-0 inset-x-0 h-[2px] bg-[#04130E]" aria-hidden="true">
          <div
            className="h-full bg-gradient-to-l from-[#F3D078] via-[#D4AF37] to-[#34D399] transition-[width] duration-75 ease-linear"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>
    </aside>
  );
};
