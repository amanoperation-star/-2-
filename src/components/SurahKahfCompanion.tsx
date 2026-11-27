import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen,
  Check,
  CheckCircle2,
  Share2,
  Bookmark,
  ChevronDown,
  ChevronUp,
  Volume2,
  Square,
  Loader2,
  AlignJustify,
  ListOrdered,
  Sparkles,
} from 'lucide-react';
import { KAHF_AYAHS, KAHF_QUARTERS, KahfQuarter } from '../utils/surahKahfData';
import {
  KahfReadingProgress,
  getTodayKey,
  loadKahfProgress,
  saveKahfProgress,
} from '../utils/jumuahData';
import { KahfShareCardModal } from './KahfShareCardModal';
import { resolvePlayableAudioUrl } from '../utils/offlineAudioManager';

interface SurahKahfCompanionProps {
  isJumuahActive: boolean;
  onOpenTasbihSalawat?: () => void;
  salawatCount?: number;
  salawatTarget?: 100 | 1000;
}

const KAHF_RECITERS = [
  {
    id: 'afs',
    label: 'الشيخ مشاري راشد العفاسي',
    url: 'https://server8.mp3quran.net/afs/018.mp3',
  },
  {
    id: 'yasser',
    label: 'الشيخ ياسر الدوسري',
    url: 'https://server11.mp3quran.net/yasser/018.mp3',
  },
  {
    id: 'basit',
    label: 'الشيخ عبد الباسط عبد الصمد',
    url: 'https://server7.mp3quran.net/basit/018.mp3',
  },
];

function toArabicIndicDigits(num: number): string {
  const map = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return String(num)
    .split('')
    .map((ch) => map[Number(ch)] ?? ch)
    .join('');
}

export const SurahKahfCompanion: React.FC<SurahKahfCompanionProps> = ({
  isJumuahActive,
  onOpenTasbihSalawat,
  salawatCount = 0,
  salawatTarget = 100,
}) => {
  const [progress, setProgress] = useState<KahfReadingProgress>(() => loadKahfProgress());
  const [isReaderOpen, setIsReaderOpen] = useState<boolean>(false);
  const [readerScope, setReaderScope] = useState<1 | 2 | 3 | 4 | 'all'>(
    progress.activeQuarter || 1
  );
  const [layoutMode, setLayoutMode] = useState<'mushaf' | 'verses'>('mushaf');
  const [fontSizeLevel, setFontSizeLevel] = useState<'md' | 'lg' | 'xl'>('lg');

  // Share PNG Modal state
  const [isShareOpen, setIsShareOpen] = useState<boolean>(false);
  const [shareAyahNumber, setShareAyahNumber] = useState<number>(10);

  // Audio player for Surah Al-Kahf recitation
  const [selectedReciterId, setSelectedReciterId] = useState<string>('afs');
  const [audioStatus, setAudioStatus] = useState<'idle' | 'loading' | 'playing'>('idle');
  const [audioError, setAudioError] = useState<string>('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const readerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    saveKahfProgress(progress);
  }, [progress]);

  useEffect(() => {
    const stopKahfAudio = () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      setAudioStatus('idle');
    };
    window.addEventListener('mihrab_stop_background_media', stopKahfAudio);
    return () => {
      window.removeEventListener('mihrab_stop_background_media', stopKahfAudio);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
    };
  }, []);

  if (!isJumuahActive) return null;

  const completedCount = Object.values(progress.completedQuarters).filter(Boolean).length;
  const quarterPercent = Math.round((completedCount / 4) * 100);
  const ayahPercent = Math.round((progress.lastAyah / 110) * 100);
  const overallPercent = Math.max(quarterPercent, completedCount === 0 && progress.lastAyah <= 1 ? 0 : ayahPercent);

  const handleToggleQuarterDone = (qId: 1 | 2 | 3 | 4) => {
    setProgress((prev) => ({
      ...prev,
      dateKey: getTodayKey(),
      completedQuarters: {
        ...prev.completedQuarters,
        [qId]: !prev.completedQuarters[qId],
      },
    }));
  };

  const handleOpenQuarterInReader = (qId: 1 | 2 | 3 | 4) => {
    setReaderScope(qId);
    setProgress((prev) => ({
      ...prev,
      activeQuarter: qId,
      dateKey: getTodayKey(),
    }));
    setIsReaderOpen(true);
    window.setTimeout(() => {
      readerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleBookmarkAyah = (ayahNum: number) => {
    const matchedQuarter =
      KAHF_QUARTERS.find((q) => ayahNum >= q.startAyah && ayahNum <= q.endAyah)?.id || 1;
    setProgress((prev) => ({
      ...prev,
      lastAyah: ayahNum,
      activeQuarter: matchedQuarter,
      dateKey: getTodayKey(),
    }));
  };

  const handleCompleteQuarterAndNext = (qId: 1 | 2 | 3 | 4) => {
    const q = KAHF_QUARTERS.find((item) => item.id === qId);
    const nextQ = qId < 4 ? ((qId + 1) as 1 | 2 | 3 | 4) : qId;
    setProgress((prev) => ({
      ...prev,
      dateKey: getTodayKey(),
      lastAyah: q ? q.endAyah : prev.lastAyah,
      activeQuarter: nextQ,
      completedQuarters: {
        ...prev.completedQuarters,
        [qId]: true,
      },
    }));
    if (qId < 4) {
      setReaderScope(nextQ);
      readerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleToggleSurahAudio = async () => {
    setAudioError('');
    if (audioStatus === 'playing' || audioStatus === 'loading') {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      setAudioStatus('idle');
      return;
    }

    const reciter = KAHF_RECITERS.find((r) => r.id === selectedReciterId) || KAHF_RECITERS[0];
    try {
      setAudioStatus('loading');
      if (!audioRef.current) {
        audioRef.current = new Audio();
      }
      const audio = audioRef.current;
      const playableUrl = await resolvePlayableAudioUrl(reciter.url);
      audio.src = playableUrl;
      audio.onplaying = () => setAudioStatus('playing');
      audio.onended = () => setAudioStatus('idle');
      audio.onerror = () => {
        setAudioStatus('idle');
        setAudioError('تعذر تشغيل التلاوة الصوتية حالياً، يمكنك متابعة القراءة النصية.');
      };
      await audio.play();
      setAudioStatus('playing');
    } catch {
      setAudioStatus('idle');
      setAudioError('تعذر تشغيل التلاوة الصوتية حالياً، تأكد من اتصال الإنترنت.');
    }
  };

  const handleOpenShareForAyah = (ayahNumber: number) => {
    setShareAyahNumber(ayahNumber);
    setIsShareOpen(true);
  };

  const visibleAyahs =
    readerScope === 'all'
      ? KAHF_AYAHS
      : (() => {
          const q = KAHF_QUARTERS.find((item) => item.id === readerScope);
          return q
            ? KAHF_AYAHS.filter((a) => a.number >= q.startAyah && a.number <= q.endAyah)
            : KAHF_AYAHS;
        })();

  const fontSizeClass =
    fontSizeLevel === 'xl'
      ? 'text-2xl sm:text-3xl leading-[2.3]'
      : fontSizeLevel === 'lg'
      ? 'text-xl sm:text-2xl leading-[2.15]'
      : 'text-lg sm:text-xl leading-[2.0]';

  const salawatPercent = Math.min(100, Math.round((salawatCount / salawatTarget) * 100));

  return (
    <section className="relative overflow-hidden rounded-3xl border-2 border-[#e5b869]/55 bg-gradient-to-br from-[#052921]/95 via-[#062d24]/92 to-[#031511]/95 p-5 md:p-7 shadow-[0_18px_50px_rgba(0,0,0,0.52),0_0_40px_rgba(251,191,36,0.12)] backdrop-blur-xl space-y-5">
      <div className="absolute inset-1.5 rounded-[20px] border border-[#e5b869]/20 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(251,191,36,0.14)_0%,transparent_60%)] pointer-events-none" />

      <KahfShareCardModal
        isOpen={isShareOpen}
        initialAyahNumber={shareAyahNumber}
        onClose={() => setIsShareOpen(false)}
      />

      {/* Top Row: Title, Saved Bookmark & Primary Actions */}
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1.5 text-right">
          <div className="flex flex-wrap items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#fbbf24] shrink-0" />
            <h3 className="text-xl sm:text-2xl font-bold font-amiri text-[#fbbf24] tracking-wide">
              نور سورة الكهف — مُرافق الجمعة
            </h3>
            <span className="text-[#e5b869]/50" aria-hidden="true">·</span>
            <span className="text-xs font-bold text-emerald-300 tabular-nums">
              {completedCount} من ٤ أرباع مكتملة
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
            «مَنْ قَرَأَ سُورَةَ الْكَهْفِ فِي يَوْمِ الْجُمُعَةِ أَضَاءَ لَهُ مِنَ النُّورِ مَا بَيْنَ الْجُمُعَتَيْنِ»
            <span className="text-[#e5b869]/60 mx-2" aria-hidden="true">·</span>
            <span className="text-[#fbbf24] font-semibold">
              موضع التوقف المحفوظ: الآية {toArabicIndicDigits(progress.lastAyah)} من ١١٠
            </span>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => handleOpenShareForAyah(progress.lastAyah > 1 ? progress.lastAyah : 10)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#04211b] border border-[#e5b869]/45 hover:border-[#fbbf24] text-[#fbbf24] text-xs font-bold transition-all shadow whitespace-nowrap"
          >
            <Share2 className="w-4 h-4 shrink-0" />
            <span>مشاركة آية ببطاقة PNG</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (!isReaderOpen) {
                setReaderScope(progress.activeQuarter || 1);
              }
              setIsReaderOpen((prev) => !prev);
            }}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#fbbf24] via-[#e5b869] to-emerald-400 text-slate-950 font-black text-xs sm:text-sm hover:brightness-105 transition-all shadow-lg whitespace-nowrap"
          >
            <BookOpen className="w-4 h-4 shrink-0" />
            <span>
              {isReaderOpen
                ? 'إغلاق قارئ سورة الكهف'
                : progress.lastAyah > 1
                ? `متابعة القراءة (الآية ${toArabicIndicDigits(progress.lastAyah)})`
                : 'قراءة سورة الكهف كاملة هنا'}
            </span>
            {isReaderOpen ? (
              <ChevronUp className="w-4 h-4 shrink-0" />
            ) : (
              <ChevronDown className="w-4 h-4 shrink-0" />
            )}
          </button>
        </div>
      </div>

      {/* Golden Progress Bar */}
      <div className="relative z-10 space-y-1.5">
        <div className="w-full h-3 rounded-full bg-[#02100d] border border-[#e5b869]/30 overflow-hidden">
          <div
            className="h-full bg-gradient-to-l from-[#fef08a] via-[#fbbf24] to-emerald-400 transition-all duration-300"
            style={{ width: `${Math.max(overallPercent, overallPercent > 0 ? 4 : 0)}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-300">
          <span>اضغط على أي ربع لبدء القراءة أو وضع علامة الإتمام</span>
          <span className="font-mono font-bold text-[#fbbf24] tabular-nums">
            {overallPercent}% مكتمل
          </span>
        </div>
      </div>

      {/* 4 Interactive Quarters Grid */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {KAHF_QUARTERS.map((quarter: KahfQuarter) => {
          const isDone = progress.completedQuarters[quarter.id];
          const isCurrentFocus =
            progress.lastAyah >= quarter.startAyah && progress.lastAyah <= quarter.endAyah;

          return (
            <div
              key={quarter.id}
              className={`rounded-2xl p-4 border transition-all flex flex-col justify-between gap-3 text-right ${
                isDone
                  ? 'bg-emerald-950/65 border-[#fbbf24]/70 shadow-[0_0_24px_rgba(251,191,36,0.16)]'
                  : isCurrentFocus
                  ? 'bg-[#062d24]/90 border-[#e5b869]/60'
                  : 'bg-[#031713]/85 border-[#e5b869]/25 hover:border-[#e5b869]/50'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-[#fbbf24]">{quarter.subtitle}</span>
                  <button
                    type="button"
                    onClick={() => handleToggleQuarterDone(quarter.id)}
                    aria-label={isDone ? `إلغاء إتمام ${quarter.title}` : `تأكيد إتمام ${quarter.title}`}
                    className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all shrink-0 ${
                      isDone
                        ? 'bg-[#fbbf24] border-[#fbbf24] text-slate-950'
                        : 'bg-[#041d17] border-[#e5b869]/35 text-slate-400 hover:border-[#fbbf24] hover:text-[#fbbf24]'
                    }`}
                  >
                    <Check className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>

                <h4 className="text-base font-bold font-amiri text-white leading-snug">
                  {quarter.title}
                </h4>

                <p className="text-[11px] text-slate-300/90 leading-relaxed">{quarter.summary}</p>
              </div>

              <button
                type="button"
                onClick={() => handleOpenQuarterInReader(quarter.id)}
                className={`w-full py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                  isDone
                    ? 'bg-emerald-900/50 border-emerald-500/50 text-emerald-200 hover:border-[#fbbf24]'
                    : 'bg-[#05261f] border-[#e5b869]/35 text-[#fbbf24] hover:bg-[#08392e] hover:border-[#fbbf24]'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 shrink-0" />
                <span>{isDone ? 'مراجعة القراءة' : 'اقرأ هذا الربع'}</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Jumu'ah Salawat Quick Launcher Strip inside Companion */}
      {onOpenTasbihSalawat && (
        <div className="relative z-10 rounded-2xl bg-[#031612]/90 border border-[#e5b869]/35 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-right space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-[#fbbf24]">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>وِرد الصلاة على النبي ﷺ ليوم الجمعة (المسبحة المزدوجة)</span>
            </div>
            <p className="text-xs text-slate-300">
              إنجازك اليوم:{' '}
              <strong className="text-white font-mono tabular-nums">
                {salawatCount} / {salawatTarget}
              </strong>{' '}
              صلاة على النبي ﷺ ({salawatPercent}%) — متاح عبر المسبحة الشرقية والخاتم الإلكتروني الشبابي
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenTasbihSalawat}
            className="px-4 py-2.5 rounded-xl bg-[#073a2f] border border-[#fbbf24]/55 hover:border-[#fbbf24] hover:bg-[#0a4b3d] text-[#fbbf24] text-xs font-black transition-all whitespace-nowrap shrink-0 shadow"
          >
            فتح مسبحة وِرد الجمعة ﷺ
          </button>
        </div>
      )}

      {/* Built-in Surah Al-Kahf Full Interactive Sanctuary Reader */}
      {isReaderOpen && (
        <div
          ref={readerRef}
          className="relative z-10 rounded-3xl border-2 border-[#fbbf24]/55 bg-[#02120e]/98 p-4 sm:p-6 space-y-5 shadow-[0_20px_55px_rgba(0,0,0,0.65)]"
        >
          {/* Reader Toolbar */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 pb-4 border-b border-[#e5b869]/25">
            {/* Quarter / Full Surah Switcher */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {KAHF_QUARTERS.map((q) => (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setReaderScope(q.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all whitespace-nowrap shrink-0 ${
                    readerScope === q.id
                      ? 'bg-gradient-to-r from-[#fbbf24] via-[#e5b869] to-emerald-400 text-slate-950 border-transparent shadow'
                      : 'bg-[#041d17] border-[#e5b869]/25 text-slate-200 hover:border-[#fbbf24]'
                  }`}
                >
                  {q.title.split(':')[0]} ({q.subtitle.replace('الآيات ', '')})
                </button>
              ))}
              <button
                type="button"
                onClick={() => setReaderScope('all')}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all whitespace-nowrap shrink-0 ${
                  readerScope === 'all'
                    ? 'bg-gradient-to-r from-[#fbbf24] via-[#e5b869] to-emerald-400 text-slate-950 border-transparent shadow'
                    : 'bg-[#041d17] border-[#e5b869]/25 text-slate-200 hover:border-[#fbbf24]'
                }`}
              >
                السورة كاملة (١١٠ آيات)
              </button>
            </div>

            {/* Reader Controls: Audio Recitation + Display Mode + Font Scale */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {/* Recitation Audio Picker & Play */}
              <div className="flex items-center gap-1.5 bg-[#041d17] p-1 rounded-xl border border-[#e5b869]/30">
                <select
                  value={selectedReciterId}
                  onChange={(e) => {
                    setSelectedReciterId(e.target.value);
                    if (audioStatus !== 'idle' && audioRef.current) {
                      audioRef.current.pause();
                      setAudioStatus('idle');
                    }
                  }}
                  aria-label="اختر قارئ سورة الكهف"
                  className="bg-transparent text-xs text-slate-200 font-semibold px-2 py-1 focus:outline-none cursor-pointer"
                >
                  {KAHF_RECITERS.map((r) => (
                    <option key={r.id} value={r.id} className="bg-[#031511] text-white">
                      {r.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleToggleSurahAudio}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                    audioStatus !== 'idle'
                      ? 'bg-rose-600 text-white'
                      : 'bg-[#073a2f] text-[#fbbf24] hover:bg-[#0a4b3d]'
                  }`}
                >
                  {audioStatus === 'loading' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : audioStatus === 'playing' ? (
                    <Square className="w-3.5 h-3.5 fill-current" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5" />
                  )}
                  <span>{audioStatus === 'playing' ? 'إيقاف التلاوة' : 'استماع للسورة'}</span>
                </button>
              </div>

              {/* Mushaf vs Verse-by-Verse Toggle */}
              <div className="flex items-center gap-1 bg-[#041d17] p-1 rounded-xl border border-[#e5b869]/30">
                <button
                  type="button"
                  onClick={() => setLayoutMode('mushaf')}
                  title="نمط المصحف المتصل"
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                    layoutMode === 'mushaf'
                      ? 'bg-[#fbbf24] text-slate-950'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <AlignJustify className="w-3.5 h-3.5" />
                  <span>مصحف</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLayoutMode('verses')}
                  title="آية بآية مع زر البطاقة والموضع"
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                    layoutMode === 'verses'
                      ? 'bg-[#fbbf24] text-slate-950'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <ListOrdered className="w-3.5 h-3.5" />
                  <span>آية بآية</span>
                </button>
              </div>

              {/* Font Size Selector */}
              <div className="flex items-center gap-1 bg-[#041d17] p-1 rounded-xl border border-[#e5b869]/30">
                {(
                  [
                    { id: 'md', label: 'أ-' },
                    { id: 'lg', label: 'أ' },
                    { id: 'xl', label: 'أ+' },
                  ] as const
                ).map((sz) => (
                  <button
                    key={sz.id}
                    type="button"
                    onClick={() => setFontSizeLevel(sz.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      fontSizeLevel === sz.id
                        ? 'bg-emerald-700 text-white'
                        : 'text-slate-300 hover:text-[#fbbf24]'
                    }`}
                  >
                    {sz.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {audioError && (
            <p className="text-xs text-amber-300 bg-amber-950/60 border border-amber-600/40 px-3 py-2 rounded-xl">
              {audioError}
            </p>
          )}

          {/* Surah Ornament Header + Basmala */}
          <div className="text-center space-y-2 py-2 border-b border-[#e5b869]/15">
            <div className="inline-block px-6 py-1.5 rounded-full border border-[#e5b869]/40 bg-[#05261f]/80 text-[#fbbf24] font-amiri text-xl font-bold">
              سُورَةُ الْكَهْفِ
            </div>
            {(readerScope === 1 || readerScope === 'all') && (
              <p className="font-amiri text-2xl sm:text-3xl text-[#fef08a] pt-1">
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </p>
            )}
            <p className="text-[11px] text-slate-400">
              اضغط على أي آية لحفظ موضع توقفك تلقائياً
            </p>
          </div>

          {/* Reading Body */}
          <div className="max-h-[62vh] overflow-y-auto px-1 sm:px-3 py-2 space-y-3">
            {layoutMode === 'mushaf' ? (
              <div
                className={`font-amiri text-slate-100 text-justify ${fontSizeClass} bg-[#031914]/75 border border-[#e5b869]/20 rounded-2xl p-4 sm:p-7`}
                dir="rtl"
              >
                {visibleAyahs.map((ayah) => {
                  const isBookmarked = progress.lastAyah === ayah.number;
                  return (
                    <span
                      key={ayah.number}
                      onClick={() => handleBookmarkAyah(ayah.number)}
                      title={`اضغط لحفظ التوقف عند الآية ${ayah.number}`}
                      className={`cursor-pointer rounded-lg px-1 transition-colors ${
                        isBookmarked
                          ? 'bg-[#fbbf24]/20 text-[#fef08a] ring-1 ring-[#fbbf24]/50'
                          : 'hover:bg-emerald-900/40'
                      }`}
                    >
                      {ayah.text}{' '}
                      <span className="inline-flex items-center justify-center text-[#fbbf24] font-bold text-[0.78em] mx-1 select-none">
                        ﴿{toArabicIndicDigits(ayah.number)}﴾
                      </span>{' '}
                    </span>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-2.5" dir="rtl">
                {visibleAyahs.map((ayah) => {
                  const isBookmarked = progress.lastAyah === ayah.number;
                  return (
                    <div
                      key={ayah.number}
                      className={`p-4 rounded-2xl border transition-all space-y-2.5 ${
                        isBookmarked
                          ? 'bg-[#073329] border-[#fbbf24]/70 shadow-[0_0_20px_rgba(251,191,36,0.14)]'
                          : 'bg-[#031813]/85 border-[#e5b869]/20 hover:border-[#e5b869]/45'
                      }`}
                    >
                      <p className={`font-amiri text-white ${fontSizeClass}`}>
                        {ayah.text}{' '}
                        <span className="text-[#fbbf24] font-bold text-[0.82em]">
                          ﴿{toArabicIndicDigits(ayah.number)}﴾
                        </span>
                      </p>
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#e5b869]/15 text-xs">
                        <span className="text-slate-400 font-mono">
                          الآية {toArabicIndicDigits(ayah.number)} · صفحة {toArabicIndicDigits(ayah.page)}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleBookmarkAyah(ayah.number)}
                            className={`px-2.5 py-1 rounded-lg border flex items-center gap-1 transition-colors ${
                              isBookmarked
                                ? 'bg-[#fbbf24] border-[#fbbf24] text-slate-950 font-bold'
                                : 'bg-[#041f19] border-[#e5b869]/30 text-emerald-300 hover:border-[#fbbf24]'
                            }`}
                          >
                            <Bookmark className="w-3.5 h-3.5" />
                            <span>{isBookmarked ? 'موضع التوقف الحالي' : 'توقف هنا'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenShareForAyah(ayah.number)}
                            className="px-2.5 py-1 rounded-lg bg-[#041f19] border border-[#e5b869]/30 hover:border-[#fbbf24] text-[#fbbf24] flex items-center gap-1 transition-colors"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                            <span>بطاقة PNG</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Reader Footer Completion Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#e5b869]/20">
            <span className="text-xs text-emerald-300 flex items-center gap-1.5">
              <Bookmark className="w-4 h-4 text-[#fbbf24]" />
              <span>آخر آية محفوظة: الآية {toArabicIndicDigits(progress.lastAyah)} من ١١٠</span>
            </span>

            {readerScope !== 'all' && (
              <button
                type="button"
                onClick={() => handleCompleteQuarterAndNext(readerScope)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#fbbf24] via-[#e5b869] to-emerald-400 text-slate-950 font-black text-xs sm:text-sm hover:brightness-105 transition-all shadow-lg"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>
                  {readerScope < 4
                    ? 'أتممت هذا الربع — الانتقال للربع التالي'
                    : 'أتممت قراءة سورة الكهف كاملة بحمد الله'}
                </span>
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
