import React from 'react';
import { Moon, Play, Pause, RefreshCw, ArrowLeft, Sparkles, X, Volume2 } from 'lucide-react';
import { QIYAM_RECITERS, QiyamNightVerse, QiyamReciterId } from '../utils/lastThirdNightData';

export type QiyamToastPlaybackState = 'loading' | 'playing' | 'paused' | 'blocked' | 'ended';

interface LastThirdQiyamToastProps {
  isOpen: boolean;
  verse: QiyamNightVerse;
  reciterId: QiyamReciterId;
  playbackState: QiyamToastPlaybackState;
  remainingToFajr: string;
  onTogglePlayPause: () => void;
  onSwitchReciter: () => void;
  onNextVerse: () => void;
  onOpenSanctuary: () => void;
  onClose: () => void;
}

export const LastThirdQiyamToast: React.FC<LastThirdQiyamToastProps> = ({
  isOpen,
  verse,
  reciterId,
  playbackState,
  remainingToFajr,
  onTogglePlayPause,
  onSwitchReciter,
  onNextVerse,
  onOpenSanctuary,
  onClose,
}) => {
  if (!isOpen) return null;

  const currentReciter = QIYAM_RECITERS[reciterId] || QIYAM_RECITERS.qatami;
  const alternateReciter =
    reciterId === 'qatami' ? QIYAM_RECITERS.alafasy : QIYAM_RECITERS.qatami;

  const statusLabel =
    playbackState === 'playing'
      ? 'يتلو الآن'
      : playbackState === 'loading'
      ? 'جاري التحميل'
      : playbackState === 'blocked'
      ? 'اضغط للاستماع'
      : playbackState === 'ended'
      ? 'تمت التلاوة'
      : 'متوقف مؤقتاً';

  return (
    <aside
      dir="rtl"
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[58] w-[calc(100%-1.5rem)] max-w-lg animate-fade-in theme-keep-light"
      style={{ fontFamily: "'Cairo', sans-serif" }}
    >
      <div className="relative overflow-hidden rounded-2xl border border-[#D4AF37]/50 bg-[#071412]/96 px-4 pt-3 pb-3.5 shadow-[0_18px_50px_rgba(0,0,0,0.78)] backdrop-blur-xl">
        {/* Clean Unboxed Header Metadata */}
        <div className="flex items-center justify-between gap-2 text-[11px] leading-tight">
          <div className="flex items-center gap-1.5 min-w-0">
            <Moon className="w-3.5 h-3.5 text-[#F3D06B] fill-current shrink-0" />
            <span className="font-bold text-[#F3D06B] whitespace-nowrap">
              دخول الثلث الأخير
            </span>
            <span className="text-[#D4AF37]/45" aria-hidden="true">
              ·
            </span>
            <span className="font-bold text-[#10B981] truncate">
              {currentReciter.nameAr}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 text-slate-300 tabular-nums">
            <span className="text-[#10B981] font-semibold">{statusLabel}</span>
            <span className="text-[#D4AF37]/45" aria-hidden="true">
              ·
            </span>
            <span dir="ltr" className="font-mono text-[#F3D06B]">
              {remainingToFajr}
            </span>
          </div>
        </div>

        {/* Qiyam Quranic Verse */}
        <p className="mt-2 font-amiri text-[17px] sm:text-lg leading-[1.85] text-white">
          {verse.verse}
        </p>

        {/* Surah Citation & Short Reflection */}
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px]">
          <span className="font-bold text-[#F3D06B]">{verse.surah}</span>
          <span className="text-[#D4AF37]/45" aria-hidden="true">
            ·
          </span>
          <span className="text-slate-300">{verse.reflection}</span>
        </div>

        {/* Interactive Action Controls (>= 44px touch targets) */}
        <div className="mt-3 pt-2.5 border-t border-[#D4AF37]/20 grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={onTogglePlayPause}
            className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap ${
              playbackState === 'playing'
                ? 'bg-[#0D2C24] border border-[#10B981]/65 text-[#10B981]'
                : playbackState === 'blocked'
                ? 'bg-gradient-to-r from-[#F3D06B] via-[#D4AF37] to-[#10B981] text-[#04130E] shadow-md'
                : 'bg-[#0D2C24] border border-[#D4AF37]/55 text-[#F3D06B] hover:border-[#F3D06B]'
            }`}
          >
            {playbackState === 'playing' ? (
              <>
                <Pause className="w-3.5 h-3.5 shrink-0" />
                <span>إيقاف مؤقت</span>
              </>
            ) : playbackState === 'blocked' ? (
              <>
                <Volume2 className="w-4 h-4 shrink-0" />
                <span>تشغيل التلاوة الآن</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current shrink-0" />
                <span>تشغيل التلاوة</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onSwitchReciter}
            title={`التبديل إلى ${alternateReciter.nameAr}`}
            className="min-h-[44px] px-3 py-2 rounded-xl bg-[#0A1D18] border border-[#D4AF37]/35 hover:border-[#F3D06B] text-[#F3D06B] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <RefreshCw className="w-3.5 h-3.5 shrink-0" />
            <span>{alternateReciter.shortNameAr}</span>
          </button>

          <button
            type="button"
            onClick={onNextVerse}
            className="min-h-[44px] px-3 py-2 rounded-xl bg-[#0A1D18] border border-[#D4AF37]/30 hover:border-[#F3D06B] text-slate-200 hover:text-[#F3D06B] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
            <span>آية أخرى</span>
          </button>

          <button
            type="button"
            onClick={onOpenSanctuary}
            className="min-h-[44px] px-3 py-2 rounded-xl bg-[#10B981]/15 border border-[#10B981]/45 hover:bg-[#10B981]/25 text-[#34D399] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>خلوة السحر</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق إشعار الثلث الأخير"
            className="col-span-2 sm:col-span-1 min-h-[44px] px-3 py-2 rounded-xl bg-[#04130E] border border-[#D4AF37]/20 hover:border-rose-400/55 text-slate-300 hover:text-rose-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <X className="w-3.5 h-3.5 shrink-0" />
            <span>إغلاق</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
