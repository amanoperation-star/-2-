import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X, Download, Share2, Check, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';
import { KAHF_AYAHS } from '../utils/surahKahfData';
import { KAHF_FEATURED_SHARE_PRESETS } from '../utils/jumuahData';

interface KahfShareCardModalProps {
  isOpen: boolean;
  initialAyahNumber?: number;
  onClose: () => void;
}

function wrapArabicText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const width = ctx.measureText(testLine).width;
    if (width > maxWidth && currentLine) {
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

export const KahfShareCardModal: React.FC<KahfShareCardModalProps> = ({
  isOpen,
  initialAyahNumber = 10,
  onClose,
}) => {
  const [selectedAyahNumber, setSelectedAyahNumber] = useState<number>(initialAyahNumber);
  const [previewDataUrl, setPreviewDataUrl] = useState<string>('');
  const [shareFeedback, setShareFeedback] = useState<string>('');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (isOpen && initialAyahNumber) {
      setSelectedAyahNumber(initialAyahNumber);
    }
  }, [isOpen, initialAyahNumber]);

  const currentAyah =
    KAHF_AYAHS.find((a) => a.number === selectedAyahNumber) || KAHF_AYAHS[9];
  const matchedPreset = KAHF_FEATURED_SHARE_PRESETS.find(
    (p) => p.ayahNumber === selectedAyahNumber
  );

  const renderCanvasCard = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (typeof document !== 'undefined' && document.fonts?.ready) {
      await document.fonts.ready;
    }

    const W = 1080;
    const H = 1350;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Royal Emerald Sanctuary Gradient Background
    const bgGrad = ctx.createLinearGradient(0, 0, W, H);
    bgGrad.addColorStop(0, '#02120e');
    bgGrad.addColorStop(0.45, '#062f26');
    bgGrad.addColorStop(1, '#020f0c');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // 2. Warm Radial Apex Illumination
    const halo = ctx.createRadialGradient(W / 2, 260, 20, W / 2, 320, 640);
    halo.addColorStop(0, 'rgba(251, 191, 36, 0.22)');
    halo.addColorStop(0.55, 'rgba(229, 184, 105, 0.08)');
    halo.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, W, H);

    // 3. Subtle Geometric Lattice Pattern
    ctx.save();
    ctx.strokeStyle = 'rgba(229, 184, 105, 0.06)';
    ctx.lineWidth = 1.5;
    for (let x = 0; x <= W; x += 90) {
      for (let y = 0; y <= H; y += 90) {
        ctx.strokeRect(x + 25, y + 25, 40, 40);
        ctx.save();
        ctx.translate(x + 45, y + 45);
        ctx.rotate(Math.PI / 4);
        ctx.strokeRect(-20, -20, 40, 40);
        ctx.restore();
      }
    }
    ctx.restore();

    // 4. Outer & Inner Pointed Mihrab Arch Frame
    const drawMihrabPath = (inset: number, archTop: number) => {
      const left = inset;
      const right = W - inset;
      const bottom = H - inset;
      const shoulderY = archTop + 260;
      ctx.beginPath();
      ctx.moveTo(left, bottom);
      ctx.lineTo(left, shoulderY);
      ctx.quadraticCurveTo(left + 40, archTop + 90, W / 2, archTop);
      ctx.quadraticCurveTo(right - 40, archTop + 90, right, shoulderY);
      ctx.lineTo(right, bottom);
      ctx.closePath();
    };

    ctx.save();
    drawMihrabPath(56, 72);
    ctx.fillStyle = 'rgba(3, 22, 17, 0.72)';
    ctx.fill();
    ctx.lineWidth = 5;
    const goldStroke = ctx.createLinearGradient(0, 70, W, H);
    goldStroke.addColorStop(0, '#fef08a');
    goldStroke.addColorStop(0.45, '#e5b869');
    goldStroke.addColorStop(1, '#b45309');
    ctx.strokeStyle = goldStroke;
    ctx.stroke();

    drawMihrabPath(78, 96);
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = 'rgba(229, 184, 105, 0.42)';
    ctx.stroke();
    ctx.restore();

    // 5. Apex 8-Pointed Rub el Hizb Star Crown
    ctx.save();
    ctx.translate(W / 2, 165);
    ctx.strokeStyle = '#fbbf24';
    ctx.fillStyle = 'rgba(251, 191, 36, 0.14)';
    ctx.lineWidth = 2.5;
    ctx.fillRect(-26, -26, 52, 52);
    ctx.strokeRect(-26, -26, 52, 52);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-26, -26, 52, 52);
    ctx.strokeRect(-26, -26, 52, 52);
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#fef08a';
    ctx.fill();
    ctx.restore();

    // 6. Header Title
    ctx.textAlign = 'center';
    ctx.direction = 'rtl';
    ctx.fillStyle = '#e5b869';
    ctx.font = '700 32px Cairo, sans-serif';
    ctx.fillText('نُورُ سُورَةِ الْكَهْفِ · جُمُعَةٌ مُبَارَكَةٌ', W / 2, 260);

    // Subtle divider below header
    ctx.strokeStyle = 'rgba(229, 184, 105, 0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 210, 290);
    ctx.lineTo(W / 2 + 210, 290);
    ctx.stroke();

    // 7. Verse Text (Adaptive font sizing for short vs long verses)
    const verseStr = `﴿ ${currentAyah.text} ﴾`;
    const charLen = verseStr.length;
    let fontSize = 58;
    if (charLen > 300) fontSize = 36;
    else if (charLen > 210) fontSize = 42;
    else if (charLen > 140) fontSize = 48;
    else if (charLen > 90) fontSize = 54;

    ctx.font = `700 ${fontSize}px Amiri, serif`;
    const maxTextWidth = W - 240;
    const lines = wrapArabicText(ctx, verseStr, maxTextWidth);
    const lineHeight = Math.round(fontSize * 1.72);
    const totalBlockHeight = lines.length * lineHeight;

    const areaTop = 345;
    const areaBottom = 970;
    const startY = Math.max(
      areaTop + fontSize,
      areaTop + (areaBottom - areaTop - totalBlockHeight) / 2 + fontSize * 0.7
    );

    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 12;
    lines.forEach((line, idx) => {
      ctx.fillText(line, W / 2, startY + idx * lineHeight);
    });
    ctx.shadowBlur = 0;

    // 8. Verse Attribution & Reflection
    ctx.fillStyle = '#fbbf24';
    ctx.font = '700 34px Amiri, serif';
    ctx.fillText(`سُورَةُ الْكَهْفِ · الآيَةُ ${currentAyah.number}`, W / 2, 1055);

    if (matchedPreset?.reflection) {
      ctx.fillStyle = '#a7f3d0';
      ctx.font = '500 26px Cairo, sans-serif';
      ctx.fillText(matchedPreset.reflection, W / 2, 1110);
    }

    // 9. Bottom Gold Separator & Clean Signature
    ctx.strokeStyle = 'rgba(229, 184, 105, 0.32)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(220, 1175);
    ctx.lineTo(W - 220, 1175);
    ctx.stroke();

    ctx.fillStyle = 'rgba(229, 184, 105, 0.85)';
    ctx.font = '600 24px Cairo, sans-serif';
    ctx.fillText('«مَنْ قَرَأَ سُورَةَ الْكَهْفِ فِي يَوْمِ الْجُمُعَةِ أَضَاءَ لَهُ مِنَ النُّورِ مَا بَيْنَ الْجُمُعَتَيْنِ»', W / 2, 1228);

    setPreviewDataUrl(canvas.toDataURL('image/png'));
  }, [currentAyah, matchedPreset]);

  useEffect(() => {
    if (!isOpen) return;
    renderCanvasCard();
  }, [isOpen, renderCanvasCard]);

  if (!isOpen) return null;

  const handleDownloadPng = () => {
    if (!previewDataUrl) return;
    const link = document.createElement('a');
    link.href = previewDataUrl;
    link.download = `surah-alkahf-ayah-${currentAyah.number}.png`;
    link.click();
    setShareFeedback('تم تحميل البطاقة بصيغة PNG بنجاح');
    window.setTimeout(() => setShareFeedback(''), 3500);
  };

  const handleSharePng = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), 'image/png')
      );
      if (blob && typeof navigator !== 'undefined' && 'share' in navigator) {
        const file = new File([blob], `surah-alkahf-ayah-${currentAyah.number}.png`, {
          type: 'image/png',
        });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `سورة الكهف – الآية ${currentAyah.number}`,
            text: `${currentAyah.text} — سورة الكهف (${currentAyah.number})`,
            files: [file],
          });
          setShareFeedback('تم فتح نافذة المشاركة');
          window.setTimeout(() => setShareFeedback(''), 3500);
          return;
        }
      }
      handleDownloadPng();
    } catch {
      handleDownloadPng();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#041b16]/98 border-2 border-[#e5b869]/55 rounded-3xl shadow-[0_0_70px_rgba(229,184,105,0.22)] overflow-hidden my-auto text-right">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-[#e5b869]/25 bg-gradient-to-b from-[#07382d] to-[#031914] flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h3 className="text-xl sm:text-2xl font-bold font-amiri text-[#fbbf24]">
              مولّد بطاقة آية من سورة الكهف (PNG)
            </h3>
            <p className="text-xs text-slate-300">
              اختر آيةً من سورة الكهف لتوليد بطاقة محراب ذهبية جاهزة للمشاركة يوم الجمعة
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق مولّد البطاقة"
            className="w-10 h-10 rounded-xl bg-[#041d17] border border-[#e5b869]/35 hover:border-[#fbbf24] text-[#fbbf24] flex items-center justify-center transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start max-h-[82vh] overflow-y-auto">
          {/* Controls Column */}
          <div className="lg:col-span-6 space-y-4">
            <div className="space-y-2">
              <span className="text-xs font-bold text-[#e5b869] block">
                آيات مختارة من نور سورة الكهف
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {KAHF_FEATURED_SHARE_PRESETS.map((preset) => {
                  const isActive = selectedAyahNumber === preset.ayahNumber;
                  return (
                    <button
                      key={preset.ayahNumber}
                      type="button"
                      onClick={() => setSelectedAyahNumber(preset.ayahNumber)}
                      className={`p-3 rounded-xl border text-right transition-all ${
                        isActive
                          ? 'bg-[#073d31] border-[#fbbf24] text-[#fbbf24] shadow-[0_0_16px_rgba(251,191,36,0.2)]'
                          : 'bg-[#031611] border-[#e5b869]/25 text-slate-200 hover:border-[#e5b869]/60'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 text-xs font-bold">
                        <span className="truncate">{preset.title}</span>
                        <span className="font-mono text-[11px] tabular-nums shrink-0 text-[#e5b869]">
                          آية {preset.ayahNumber}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Ayah Stepper (1 - 110) */}
            <div className="p-4 rounded-2xl bg-[#031511]/90 border border-[#e5b869]/30 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-emerald-300">
                  أو اختر أي آية من السورة (١ – ١١٠)
                </span>
                <span className="font-mono text-xs font-bold text-[#fbbf24] tabular-nums">
                  الآية {selectedAyahNumber} / ١١٠
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedAyahNumber((n) => Math.max(1, n - 1))}
                  className="p-2.5 rounded-xl bg-[#062b23] border border-[#e5b869]/35 text-[#fbbf24] hover:border-[#fbbf24] transition-colors"
                  aria-label="الآية السابقة"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <input
                  type="range"
                  min={1}
                  max={110}
                  value={selectedAyahNumber}
                  onChange={(e) => setSelectedAyahNumber(Number(e.target.value))}
                  className="flex-1 accent-amber-400 cursor-pointer"
                  aria-label="رقم الآية"
                />
                <button
                  type="button"
                  onClick={() => setSelectedAyahNumber((n) => Math.min(110, n + 1))}
                  className="p-2.5 rounded-xl bg-[#062b23] border border-[#e5b869]/35 text-[#fbbf24] hover:border-[#fbbf24] transition-colors"
                  aria-label="الآية التالية"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>

              <p className="font-amiri text-base text-slate-200 leading-relaxed pt-1 border-t border-[#e5b869]/15">
                ﴿ {currentAyah.text} ﴾
              </p>
            </div>

            {/* Download & Share Actions */}
            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={handleDownloadPng}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#fbbf24] via-[#e5b869] to-emerald-400 text-slate-950 font-black text-sm hover:brightness-105 transition-all shadow-lg whitespace-nowrap"
              >
                <Download className="w-4 h-4 shrink-0" />
                <span>تحميل البطاقة (PNG)</span>
              </button>

              <button
                type="button"
                onClick={handleSharePng}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#062f26] border border-[#e5b869]/50 hover:border-[#fbbf24] text-[#fbbf24] font-bold text-sm transition-all whitespace-nowrap"
              >
                <Share2 className="w-4 h-4 shrink-0" />
                <span>مشاركة للأهل والأصدقاء</span>
              </button>
            </div>

            {shareFeedback && (
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-300 bg-emerald-950/70 border border-emerald-500/40 px-3.5 py-2 rounded-xl">
                <Check className="w-4 h-4 shrink-0" />
                <span>{shareFeedback}</span>
              </div>
            )}
          </div>

          {/* Live Canvas Preview */}
          <div className="lg:col-span-6 flex flex-col items-center space-y-2.5">
            <canvas ref={canvasRef} className="hidden" />
            <div className="w-full max-w-[340px] rounded-2xl overflow-hidden border-2 border-[#e5b869]/45 shadow-[0_16px_45px_rgba(0,0,0,0.65)] bg-[#02120e]">
              {previewDataUrl ? (
                <img
                  src={previewDataUrl}
                  alt={`بطاقة سورة الكهف الآية ${currentAyah.number}`}
                  className="w-full h-auto block"
                />
              ) : (
                <div className="aspect-[4/5] flex items-center justify-center text-xs text-[#e5b869] gap-2">
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>جاري تصميم البطاقة...</span>
                </div>
              )}
            </div>
            <span className="text-[11px] text-slate-400">
              معاينة مباشرة بدقة عالية (١٠٨٠ × ١٣٥٠ بكسل)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
