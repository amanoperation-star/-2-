import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Copy,
  Check,
  Share2,
  ArrowLeft,
  Download,
  Pause,
  BookOpen,
} from 'lucide-react';
import { PeriodicReminderItem } from '../types';
import { PERIODIC_VERSES_AND_HADITHS } from '../utils/islamicData';

interface PeriodicReminderPopupProps {
  isOpen: boolean;
  contentType: 'both' | 'quran' | 'hadith';
  onClose: () => void;
}

const DURATION_MS = 15000;

export function pickRandomReminder(
  contentType: 'both' | 'quran' | 'hadith',
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

function wrapCanvasTextRtl(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

async function render9x16CardBlob(item: PeriodicReminderItem): Promise<Blob | null> {
  const width = 1080;
  const height = 1920;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  if (typeof document !== 'undefined' && document.fonts?.ready) {
    await document.fonts.ready;
  }

  // Royal Emerald Gradient Background
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, '#03120f');
  bgGrad.addColorStop(0.5, '#072f26');
  bgGrad.addColorStop(1, '#020f0c');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Subtle Radial Golden Glow near Arch Top
  const radialGrad = ctx.createRadialGradient(width / 2, 420, 20, width / 2, 420, 560);
  radialGrad.addColorStop(0, 'rgba(251, 191, 36, 0.22)');
  radialGrad.addColorStop(0.55, 'rgba(229, 184, 105, 0.06)');
  radialGrad.addColorStop(1, 'rgba(3, 18, 15, 0)');
  ctx.fillStyle = radialGrad;
  ctx.fillRect(0, 0, width, height);

  // Subtle Islamic Geometric Lattice (8-pointed stars)
  ctx.save();
  ctx.strokeStyle = 'rgba(229, 184, 105, 0.06)';
  ctx.lineWidth = 2;
  const step = 180;
  for (let y = 0; y < height + step; y += step) {
    for (let x = 0; x < width + step; x += step) {
      ctx.save();
      ctx.translate(x, y);
      ctx.strokeRect(-42, -42, 84, 84);
      ctx.rotate(Math.PI / 4);
      ctx.strokeRect(-42, -42, 84, 84);
      ctx.restore();
    }
  }
  ctx.restore();

  // Outer Double Gold Mihrab Arch Frame
  const drawMihrabPath = (inset: number, radius: number) => {
    const left = inset;
    const right = width - inset;
    const top = inset;
    const bottom = height - inset;
    const bottomRadius = 56;

    ctx.beginPath();
    ctx.moveTo(left, top + radius);
    ctx.arcTo(left, top, left + radius, top, radius);
    ctx.lineTo(right - radius, top);
    ctx.arcTo(right, top, right, top + radius, radius);
    ctx.lineTo(right, bottom - bottomRadius);
    ctx.arcTo(right, bottom, right - bottomRadius, bottom, bottomRadius);
    ctx.lineTo(left + bottomRadius, bottom);
    ctx.arcTo(left, bottom, left, bottom - bottomRadius, bottomRadius);
    ctx.closePath();
  };

  ctx.save();
  drawMihrabPath(76, 464);
  ctx.strokeStyle = 'rgba(229, 184, 105, 0.72)';
  ctx.lineWidth = 5;
  ctx.stroke();

  drawMihrabPath(104, 436);
  ctx.strokeStyle = 'rgba(229, 184, 105, 0.28)';
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.restore();

  // Glowing Lantern at Top Center
  ctx.save();
  const lx = width / 2;
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(lx, 104);
  ctx.lineTo(lx, 240);
  ctx.stroke();

  // Lantern Body
  ctx.shadowColor = 'rgba(251, 191, 36, 0.85)';
  ctx.shadowBlur = 32;
  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.ellipse(lx, 305, 22, 30, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 4;
  ctx.strokeRect(lx - 34, 260, 68, 86);
  ctx.beginPath();
  ctx.moveTo(lx - 42, 260);
  ctx.lineTo(lx, 228);
  ctx.lineTo(lx + 42, 260);
  ctx.closePath();
  ctx.fillStyle = '#d97706';
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Type Kicker
  ctx.save();
  ctx.direction = 'rtl';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#e5b869';
  ctx.font = 'bold 34px Cairo, sans-serif';
  ctx.fillText(
    item.type === 'quran' ? '✦  آيـة قـرآنـيـة كـريـمـة  ✦' : '✦  حـديـث نـبـوي شـريـف  ✦',
    width / 2,
    460
  );

  // Main Quote in Amiri
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 62px Amiri, serif';
  const lines = wrapCanvasTextRtl(ctx, item.text, 760);
  const lineHeight = 114;
  const blockHeight = lines.length * lineHeight;
  let startY = Math.max(620, height / 2 - blockHeight / 2 + 20);

  for (const line of lines) {
    ctx.fillText(line, width / 2, startY);
    startY += lineHeight;
  }

  // Divider Line
  const dividerY = Math.min(startY + 46, 1460);
  ctx.strokeStyle = 'rgba(229, 184, 105, 0.45)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(width / 2 - 160, dividerY);
  ctx.lineTo(width / 2 + 160, dividerY);
  ctx.stroke();

  // Source Citation
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 34px Cairo, sans-serif';
  ctx.fillText(item.source, width / 2, dividerY + 68);

  if (item.reflection) {
    ctx.fillStyle = 'rgba(226, 232, 240, 0.85)';
    ctx.font = '28px Cairo, sans-serif';
    const refLines = wrapCanvasTextRtl(ctx, item.reflection, 720);
    let refY = dividerY + 132;
    for (const rLine of refLines.slice(0, 2)) {
      ctx.fillText(rLine, width / 2, refY);
      refY += 44;
    }
  }

  // App Signature Footer
  ctx.fillStyle = 'rgba(229, 184, 105, 0.8)';
  ctx.font = 'bold 28px Amiri, serif';
  ctx.fillText('مواقيت الصلاة  ·  التذكير الدوري بالآيات والأحاديث', width / 2, 1750);
  ctx.restore();

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png', 1.0);
  });
}

export const PeriodicReminderPopup: React.FC<PeriodicReminderPopupProps> = ({
  isOpen,
  contentType,
  onClose,
}) => {
  const [currentItem, setCurrentItem] = useState<PeriodicReminderItem>(() =>
    pickRandomReminder(contentType)
  );
  const [remainingMs, setRemainingMs] = useState<number>(DURATION_MS);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [isShareOpen, setIsShareOpen] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const onCloseRef = React.useRef(onClose);
  onCloseRef.current = onClose;

  // Reset item and timer whenever popup opens or contentType changes
  useEffect(() => {
    if (isOpen) {
      setCurrentItem(pickRandomReminder(contentType));
      setRemainingMs(DURATION_MS);
      setCopied(false);
      setIsShareOpen(false);
    }
  }, [isOpen, contentType]);

  // Smooth 15-second countdown that pauses on hover or while 9:16 share modal is open
  useEffect(() => {
    if (!isOpen || isHovered || isShareOpen) return;

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
  }, [isOpen, isHovered, isShareOpen]);

  const handleNext = useCallback(() => {
    setCurrentItem((prev) => pickRandomReminder(contentType, prev.id));
    setRemainingMs(DURATION_MS);
    setCopied(false);
  }, [contentType]);

  const handleCopy = async () => {
    const formatted = `${currentItem.text}\n— ${currentItem.source}`;
    try {
      await navigator.clipboard.writeText(formatted);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback silent
    }
  };

  const handleDownload9x16 = async () => {
    setIsExporting(true);
    try {
      const blob = await render9x16CardBlob(currentItem);
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `islamic-reminder-${currentItem.id}-9x16.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleNativeShare9x16 = async () => {
    setIsExporting(true);
    try {
      const blob = await render9x16CardBlob(currentItem);
      const shareText = `${currentItem.text}\n— ${currentItem.source}`;
      if (blob && typeof navigator.share === 'function') {
        const file = new File([blob], `islamic-reminder-${currentItem.id}.png`, {
          type: 'image/png',
        });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: currentItem.type === 'quran' ? 'آية قرآنية' : 'حديث نبوي شريف',
            text: shareText,
            files: [file],
          });
          return;
        }
      }
      if (typeof navigator.share === 'function') {
        await navigator.share({
          title: currentItem.type === 'quran' ? 'آية قرآنية' : 'حديث نبوي شريف',
          text: shareText,
        });
      } else {
        await handleDownload9x16();
      }
    } catch {
      // User cancelled share dialog
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  const progressPct = Math.max(0, Math.min(100, (remainingMs / DURATION_MS) * 100));
  const secondsLeft = Math.ceil(remainingMs / 1000);

  return (
    <>
      {/* Floating Mihrab Toast anchored at bottom of viewport */}
      <aside
        role="status"
        aria-live="polite"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-1.5rem)] max-w-lg animate-fade-in"
      >
        <div className="relative rounded-t-[76px] rounded-b-3xl border-2 border-[#e5b869]/75 bg-gradient-to-b from-[#062d24]/98 via-[#041d17]/98 to-[#03120f]/98 px-5 sm:px-7 pt-12 pb-4 shadow-[0_22px_65px_rgba(0,0,0,0.8),0_0_36px_rgba(229,184,105,0.24)] backdrop-blur-2xl overflow-visible">
          {/* Inner Double Gold Hairline Mihrab Arch */}
          <div className="absolute inset-1.5 rounded-t-[68px] rounded-b-[20px] border border-[#e5b869]/30 pointer-events-none" />

          {/* Warm Arch Radiance */}
          <div className="absolute inset-0 rounded-t-[76px] rounded-b-3xl bg-[radial-gradient(ellipse_at_top,rgba(251,191,36,0.16)_0%,transparent_62%)] pointer-events-none" />

          {/* Hanging Glowing Lantern at Arch Apex */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none">
            <div className="px-3 py-1.5 rounded-full bg-[#041f1a] border border-[#e5b869]/70 shadow-[0_0_22px_rgba(251,191,36,0.55)]">
              <div className="animate-swing drop-shadow-[0_0_12px_rgba(251,191,36,0.95)]">
                <svg width="24" height="28" viewBox="0 0 28 34" fill="none" aria-hidden="true">
                  <path d="M14 2L9 7H19L14 2Z" fill="#d97706" stroke="#fbbf24" strokeWidth="0.9" />
                  <path d="M7 7H21L23 12H5L7 7Z" fill="#b45309" stroke="#fbbf24" strokeWidth="0.9" />
                  <path
                    d="M6.5 12H21.5V22C21.5 25 19 27.5 14 27.5C9 27.5 6.5 25 6.5 22V12Z"
                    fill="#06372c"
                    stroke="#fbbf24"
                    strokeWidth="1.2"
                  />
                  <ellipse cx="14" cy="19.5" rx="4.2" ry="5.2" fill="#fef08a" />
                  <path d="M10 27.5H18L16 31H12L10 27.5Z" fill="#d97706" />
                </svg>
              </div>
            </div>
          </div>

          {/* Top Close Quick Icon */}
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق التذكير"
            title="إغلاق"
            className="absolute top-3.5 left-4 z-20 w-8 h-8 rounded-xl bg-[#041d17]/90 border border-[#e5b869]/35 text-[#e5b869] hover:border-[#fbbf24] hover:text-[#fbbf24] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Content */}
          <div className="relative z-10 text-center space-y-2.5">
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#e5b869]">
              <BookOpen className="w-3.5 h-3.5 text-[#fbbf24]" />
              <span>
                {currentItem.type === 'quran' ? 'آية قرآنية كريمة' : 'حديث نبوي شريف'}
              </span>
            </div>

            <p className="font-amiri text-xl sm:text-[22px] leading-[1.9] text-white px-1">
              {currentItem.text}
            </p>

            <div className="space-y-0.5">
              <p className="text-xs font-bold text-[#fbbf24]">{currentItem.source}</p>
              {currentItem.reflection && (
                <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-2">
                  {currentItem.reflection}
                </p>
              )}
            </div>
          </div>

          {/* 15s Countdown Progress Strip (Pauses on Hover) */}
          <div className="relative z-10 mt-4 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-300">
              <span className="flex items-center gap-1 text-[#e5b869]">
                {isHovered ? (
                  <>
                    <Pause className="w-3 h-3" />
                    <span>العد التنازلي متوقف مؤقتاً</span>
                  </>
                ) : (
                  <span>يُغلق تلقائياً خلال</span>
                )}
              </span>
              <span className="font-mono font-bold text-[#fbbf24] tabular-nums">
                {secondsLeft} ث
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-[#02100d] border border-[#e5b869]/20 overflow-hidden">
              <div
                className="h-full bg-gradient-to-l from-[#fbbf24] via-[#e5b869] to-emerald-400 transition-[width] duration-75 ease-linear"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* 4 Requested Action Buttons */}
          <div className="relative z-10 mt-3.5 pt-3 border-t border-[#e5b869]/20 grid grid-cols-4 gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center justify-center gap-1 py-2 px-2 rounded-xl bg-[#073329] border border-[#e5b869]/40 text-xs font-bold text-[#fbbf24] hover:border-[#fbbf24] hover:bg-[#0a4336] transition-colors whitespace-nowrap"
            >
              <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
              <span>التالي</span>
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className={`flex items-center justify-center gap-1 py-2 px-2 rounded-xl border text-xs font-bold transition-colors whitespace-nowrap ${
                copied
                  ? 'bg-emerald-950/90 border-emerald-400 text-emerald-300'
                  : 'bg-[#041d17] border-[#e5b869]/35 text-slate-200 hover:border-[#fbbf24] hover:text-[#fbbf24]'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span>تم النسخ</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 shrink-0" />
                  <span>نسخ النص</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsShareOpen(true)}
              className="flex items-center justify-center gap-1 py-2 px-2 rounded-xl bg-gradient-to-r from-[#e5b869]/25 to-emerald-800/50 border border-[#fbbf24]/55 text-xs font-bold text-[#fbbf24] hover:brightness-110 transition-all whitespace-nowrap"
            >
              <Share2 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">بطاقة 9:16</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="flex items-center justify-center gap-1 py-2 px-2 rounded-xl bg-[#041d17] border border-[#e5b869]/25 text-xs font-bold text-slate-300 hover:border-rose-400/60 hover:text-rose-200 transition-colors whitespace-nowrap"
            >
              <X className="w-3.5 h-3.5 shrink-0" />
              <span>إغلاق</span>
            </button>
          </div>
        </div>
      </aside>

      {/* 9:16 Share Card Modal */}
      {isShareOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/88 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-[#041b16]/95 border-2 border-[#e5b869]/50 rounded-3xl p-5 shadow-[0_0_60px_rgba(229,184,105,0.28)] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#fbbf24] font-amiri">
                بطاقة مشاركة 9:16 (قصص وحالات)
              </h3>
              <button
                type="button"
                onClick={() => setIsShareOpen(false)}
                aria-label="إغلاق معاينة البطاقة"
                className="w-8 h-8 rounded-xl bg-[#041d17] border border-[#e5b869]/35 text-[#fbbf24] hover:border-[#fbbf24] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Live 9:16 Vertical Preview */}
            <div className="mx-auto w-full max-w-[270px] aspect-[9/16] relative rounded-2xl overflow-hidden bg-gradient-to-b from-[#03120f] via-[#072f26] to-[#020f0c] border border-[#e5b869]/50 p-4 flex flex-col justify-between shadow-2xl">
              {/* Double Mihrab Arch Preview */}
              <div className="absolute inset-3 rounded-t-[130px] rounded-b-2xl border border-[#e5b869]/65 pointer-events-none" />
              <div className="absolute inset-4 rounded-t-[122px] rounded-b-xl border border-[#e5b869]/25 pointer-events-none" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_22%,rgba(251,191,36,0.18)_0%,transparent_60%)] pointer-events-none" />

              {/* Top Glowing Lantern */}
              <div className="relative z-10 flex flex-col items-center pt-3">
                <div className="w-[1px] h-4 bg-[#fbbf24]" />
                <div className="drop-shadow-[0_0_12px_rgba(251,191,36,0.95)]">
                  <svg width="24" height="28" viewBox="0 0 28 34" fill="none" aria-hidden="true">
                    <path d="M14 2L9 7H19L14 2Z" fill="#d97706" stroke="#fbbf24" strokeWidth="0.9" />
                    <path d="M7 7H21L23 12H5L7 7Z" fill="#b45309" stroke="#fbbf24" strokeWidth="0.9" />
                    <path
                      d="M6.5 12H21.5V22C21.5 25 19 27.5 14 27.5C9 27.5 6.5 25 6.5 22V12Z"
                      fill="#06372c"
                      stroke="#fbbf24"
                      strokeWidth="1.2"
                    />
                    <ellipse cx="14" cy="19.5" rx="4.2" ry="5.2" fill="#fef08a" />
                  </svg>
                </div>
                <span className="mt-2 text-[11px] font-bold text-[#e5b869]">
                  {currentItem.type === 'quran' ? '✦ آية قرآنية كريمة ✦' : '✦ حديث نبوي شريف ✦'}
                </span>
              </div>

              {/* Quote Body */}
              <div className="relative z-10 px-3 text-center space-y-3 my-auto">
                <p className="font-amiri text-lg leading-[1.9] text-white">
                  {currentItem.text}
                </p>
                <div className="w-20 h-[1px] bg-[#e5b869]/45 mx-auto" />
                <p className="text-[11px] font-bold text-[#fbbf24]">{currentItem.source}</p>
              </div>

              {/* Card Signature */}
              <div className="relative z-10 pb-2 text-center">
                <span className="font-amiri text-[11px] text-[#e5b869]/80">
                  مواقيت الصلاة · التذكير الدوري
                </span>
              </div>
            </div>

            {/* Export & Share Actions */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                disabled={isExporting}
                onClick={handleDownload9x16}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#fbbf24] via-[#e5b869] to-emerald-400 text-slate-950 font-black text-xs hover:brightness-105 transition-all disabled:opacity-60"
              >
                <Download className="w-4 h-4" />
                <span>{isExporting ? 'جارٍ التجهيز...' : 'تحميل الصورة 9:16'}</span>
              </button>

              <button
                type="button"
                disabled={isExporting}
                onClick={handleNativeShare9x16}
                className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-[#073329] border border-[#e5b869]/50 text-[#fbbf24] font-bold text-xs hover:border-[#fbbf24] transition-colors disabled:opacity-60"
              >
                <Share2 className="w-4 h-4" />
                <span>مشاركة</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
