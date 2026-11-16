import React, { useState, useEffect, useRef } from 'react';
import { X, Lightbulb, Plus, Minus, BookOpen, CheckCircle2 } from 'lucide-react';

interface IstikharaHajahModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type HelperTab = 'istikhara' | 'hajah';

const TAB_DATA: Record<
  HelperTab,
  {
    title: string;
    subtitle: string;
    steps: string[];
    duaTitle: string;
    duaText: string;
    duaNote: string;
    source: string;
  }
> = {
  istikhara: {
    title: 'صلاة الاستخارة',
    subtitle: 'طلب الخيرة من الله تعالى في الأمور المباحة',
    steps: [
      'توضأ ثم صلِّ ركعتين من غير الفريضة (بنية الاستخارة) في أي وقت ما عدا أوقات النهي.',
      'يُقرأ في الركعة الأولى بعد الفاتحة ﴿قُلْ يَا أَيُّهَا الْكَافِرُونَ﴾، وفي الثانية ﴿قُلْ هُوَ اللَّهُ أَحَدٌ﴾.',
      'بعد السلام من الركعتين ارفع يديك وأثنِ على الله وصلِّ على النبي ﷺ ثم اقرأ الدعاء وسمِّ حاجتك.',
    ],
    duaTitle: 'دعاء الاستخارة المأثور',
    duaText:
      'اللَّهُمَّ إِنِّي أَسْتَخِيرُكَ بِعِلْمِكَ، وَأَسْتَقْدِرُكَ بِقُدْرَتِكَ، وَأَسْأَلُكَ مِنْ فَضْلِكَ الْعَظِيمِ؛ فَإِنَّكَ تَقْدِرُ وَلَا أَقْدِرُ، وَتَعْلَمُ وَلَا أَعْلَمُ، وَأَنْتَ عَلَّامُ الْغُيُوبِ.\n\nاللَّهُمَّ إِنْ كُنْتَ تَعْلَمُ أَنَّ هَذَا الْأَمْرَ — وَيُسَمِّي حَاجَتَهُ — خَيْرٌ لِي فِي دِينِي وَمَعَاشِي وَعَاقِبَةِ أَمْرِي، عَاجِلِ أَمْرِي وَآجِلِهِ، فَاقْدُرْهُ لِي وَيَسِّرْهُ لِي، ثُمَّ بَارِكْ لِي فِيهِ.\n\nوَإِنْ كُنْتَ تَعْلَمُ أَنَّ هَذَا الْأَمْرَ شَرٌّ لِي فِي دِينِي وَمَعَاشِي وَعَاقِبَةِ أَمْرِي، عَاجِلِ أَمْرِي وَآجِلِهِ، فَاصْرِفْهُ عَنِّي وَاصْرِفْنِي عَنْهُ، وَاقْدُرْ لِيَ الْخَيْرَ حَيْثُ كَانَ، ثُمَّ أَرْضِنِي بِهِ.',
    duaNote: 'يُقرأ الدعاء بعد السلام من الركعتين، وتجوز قراءته من شاشة الهاتف لمن لا يحفظه.',
    source: 'رواه البخاري عن جابر بن عبد الله رضي الله عنهما',
  },
  hajah: {
    title: 'صلاة الحاجة',
    subtitle: 'التضرع إلى الله لقضاء الحوائج وتفريج الكربات',
    steps: [
      'أحسِنِ الوضوءَ وتوجّه إلى القبلة بقلبٍ حاضرٍ خاشع.',
      'صلِّ ركعتين خالصتين لله تعالى من غير الفريضة.',
      'بعد السلام، أثنِ على الله تعالى وصلِّ على النبي ﷺ، ثم اقرأ الدعاء واسأل الله حاجتك.',
    ],
    duaTitle: 'دعاء صلاة الحاجة المأثور',
    duaText:
      'لَا إِلَهَ إِلَّا اللَّهُ الْحَلِيمُ الْكَرِيمُ، سُبْحَانَ اللَّهِ رَبِّ الْعَرْشِ الْعَظِيمِ، الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ؛ أَسْأَلُكَ مُوجِبَاتِ رَحْمَتِكَ، وَعَزَائِمَ مَغْفِرَتِكَ، وَالْغَنِيمَةَ مِنْ كُلِّ بِرٍّ، وَالسَّلَامَةَ مِنْ كُلِّ إِثْمٍ.\n\nلَا تَدَعْ لِي ذَنْبًا إِلَّا غَفَرْتَهُ، وَلَا هَمًّا إِلَّا فَرَّجْتَهُ، وَلَا حَاجَةً هِيَ لَكَ رِضًا إِلَّا قَضَيْتَهَا يَا أَرْحَمَ الرَّاحِمِينَ.',
    duaNote: 'ثم تسأل الله تعالى من أمر الدنيا والآخرة ما شئت، وتجوز القراءة من الهاتف.',
    source: 'رواه الترمذي وابن ماجه عن عبد الله بن أبي أوفى رضي الله عنهما',
  },
};

export const IstikharaHajahModal: React.FC<IstikharaHajahModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<HelperTab>('istikhara');
  const [fontSize, setFontSize] = useState<number>(24);
  const [wakeLockActive, setWakeLockActive] = useState<boolean>(false);
  const [wakeLockNote, setWakeLockNote] = useState<string | null>(null);
  const wakeLockRef = useRef<any>(null);

  const releaseWakeLock = async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
      } catch {
        // ignore
      }
      wakeLockRef.current = null;
    }
    setWakeLockActive(false);
  };

  const toggleWakeLock = async () => {
    if (wakeLockActive) {
      await releaseWakeLock();
      setWakeLockNote(null);
      return;
    }

    try {
      if ('wakeLock' in navigator && (navigator as any).wakeLock) {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        wakeLockRef.current.addEventListener?.('release', () => {
          setWakeLockActive(false);
        });
        setWakeLockActive(true);
        setWakeLockNote('الشاشة ستبقى مضاءة أثناء الدعاء');
      } else {
        setWakeLockActive(true);
        setWakeLockNote('تم تفعيل وضع القراءة المتواصلة (المتصفح لا يدعم Wake Lock)');
      }
    } catch {
      setWakeLockActive(true);
      setWakeLockNote('تم تنشيط وضع القراءة المريحة');
    }
  };

  useEffect(() => {
    if (!isOpen) {
      releaseWakeLock();
      setWakeLockNote(null);
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      releaseWakeLock();
    };
  }, []);

  if (!isOpen) return null;

  const current = TAB_DATA[activeTab];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
        className="relative w-full max-w-2xl max-h-[92vh] rounded-3xl border-2 border-[#D4AF37]/60 bg-[#0A1512]/98 text-right flex flex-col overflow-hidden shadow-[0_24px_70px_rgba(0,0,0,0.7)] font-sans"
      >
        {/* Header */}
        <div className="shrink-0 px-5 pt-4 pb-3 border-b border-[#D4AF37]/30 bg-[#111C18] space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#B8962E] flex items-center justify-center text-slate-950 font-bold text-lg shrink-0 shadow">
                🤲
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold font-amiri text-[#F3CA63]">
                  ❖ مُساعد صلاة الاستخارة والحاجة ❖
                </h3>
                <p className="text-xs text-slate-300">
                  {current.subtitle}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="min-w-[44px] min-h-[44px] rounded-xl bg-[#07110E] hover:bg-[#172822] border border-[#D4AF37]/40 text-slate-200 hover:text-[#F3CA63] flex items-center justify-center transition-colors"
              title="إغلاق"
              aria-label="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Two Clear Tabs */}
          <div className="grid grid-cols-2 gap-1.5 bg-[#07110E] p-1 rounded-xl border border-[#D4AF37]/30">
            <button
              type="button"
              onClick={() => setActiveTab('istikhara')}
              className={`min-h-[44px] px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'istikhara'
                  ? 'bg-gradient-to-r from-[#D4AF37] to-[#B8962E] text-slate-950 shadow'
                  : 'text-slate-300 hover:text-[#F3CA63]'
              }`}
            >
              صلاة الاستخارة
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('hajah')}
              className={`min-h-[44px] px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'hajah'
                  ? 'bg-gradient-to-r from-[#D4AF37] to-[#B8962E] text-slate-950 shadow'
                  : 'text-slate-300 hover:text-[#F3CA63]'
              }`}
            >
              صلاة الحاجة
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* 3 Concise Practical Steps */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#111C18] border border-[#D4AF37]/35 space-y-3">
            <h4 className="text-xs sm:text-sm font-bold text-[#F3CA63] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
              <span>الخطوات العملية لأداء {current.title}:</span>
            </h4>

            <ol className="space-y-2.5 text-xs sm:text-sm text-slate-200 leading-relaxed">
              {current.steps.map((step, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-[#07110E] border border-[#D4AF37]/50 text-[#F3CA63] font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>

            <div className="pt-2.5 border-t border-[#D4AF37]/20 text-xs text-emerald-300 flex items-center gap-2">
              <BookOpen className="w-4 h-4 shrink-0 text-[#10B981]" />
              <span>تنبيه لطيف: تجوز قراءة الدعاء من شاشة الهاتف لمن لا يحفظه.</span>
            </div>
          </div>

          {/* Dua Reading Card */}
          <div className="rounded-2xl bg-[#111C18] border-2 border-[#D4AF37]/50 overflow-hidden shadow-lg">
            {/* Reading Card Header Controls */}
            <div className="px-4 py-3 bg-[#0B1411] border-b border-[#D4AF37]/30 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs sm:text-sm font-bold text-[#F3CA63] font-amiri">
                {current.duaTitle}
              </span>

              <div className="flex items-center gap-2">
                {/* Font Size Controls */}
                <div className="flex items-center gap-1 bg-[#07110E] p-1 rounded-xl border border-[#D4AF37]/30">
                  <button
                    type="button"
                    onClick={() => setFontSize((s) => Math.max(18, s - 2))}
                    className="min-w-[40px] min-h-[40px] px-2 rounded-lg text-slate-200 hover:bg-[#162721] hover:text-[#F3CA63] font-bold text-xs flex items-center justify-center gap-0.5 transition-colors"
                    title="تصغير الخط"
                  >
                    <span>أ-</span>
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-[11px] font-mono tabular-nums text-slate-400 px-1">
                    {fontSize}
                  </span>
                  <button
                    type="button"
                    onClick={() => setFontSize((s) => Math.min(36, s + 2))}
                    className="min-w-[40px] min-h-[40px] px-2 rounded-lg text-slate-200 hover:bg-[#162721] hover:text-[#F3CA63] font-bold text-xs flex items-center justify-center gap-0.5 transition-colors"
                    title="تكبير الخط"
                  >
                    <span>أ+</span>
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Wake Lock Toggle */}
                <button
                  type="button"
                  onClick={toggleWakeLock}
                  className={`min-h-[42px] px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                    wakeLockActive
                      ? 'bg-[#10B981]/20 border-[#10B981] text-emerald-300 shadow-[0_0_16px_rgba(16,185,129,0.25)]'
                      : 'bg-[#07110E] border-[#D4AF37]/40 text-[#F3CA63] hover:bg-[#162721]'
                  }`}
                  title="منع انطفاء الشاشة أثناء قراءة الدعاء"
                >
                  <Lightbulb className={`w-3.5 h-3.5 ${wakeLockActive ? 'text-emerald-300 fill-current' : 'text-[#F3CA63]'}`} />
                  <span>{wakeLockActive ? 'الشاشة مضاءة ✓' : 'إبقاء الشاشة مضاءة'}</span>
                </button>
              </div>
            </div>

            {wakeLockNote && (
              <div className="px-4 py-1.5 bg-emerald-950/60 border-b border-emerald-500/20 text-[11px] text-emerald-300 text-center">
                {wakeLockNote}
              </div>
            )}

            {/* Full Dua Text with Tashkeel */}
            <div className="p-5 sm:p-6 space-y-4">
              <p
                style={{ fontSize: `${fontSize}px`, lineHeight: 1.9 }}
                className="font-amiri text-amber-50 whitespace-pre-line text-center sm:text-right selection:bg-[#D4AF37] selection:text-slate-950"
              >
                {current.duaText}
              </p>

              <div className="pt-3 border-t border-[#D4AF37]/20 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                <span>{current.duaNote}</span>
                <span className="text-[#D4AF37] font-semibold">{current.source}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
