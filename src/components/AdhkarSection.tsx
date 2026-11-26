import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen,
  Check,
  CheckCircle,
  RefreshCw,
  Sparkles,
  Volume2,
  Square,
  Play,
  Mic,
  Shield,
  Home,
  Settings,
} from 'lucide-react';
import { DAILY_ADHIKAR } from '../utils/islamicData';
import { DhikrItem, UserSettings } from '../types';
import { adhanPlayer, ADHKAR_SOURCES, AudioPlayerState, ActiveAudioType } from '../utils/audioAdhan';
import {
  SHORT_ADHKAR_SHEIKHS,
  ShortAdhkarSheikhId,
  hasExactShortClipForSheikh,
  resolveShortDhikrClip,
} from '../utils/shortAdhkarAudio';
import { PostPrayerTasbihModal } from './PostPrayerTasbihModal';
import { loadJumuahSalawatProgress } from '../utils/jumuahData';
import { HisnAlMuslimSection } from './HisnAlMuslimSection';

interface AdhkarSectionProps {
  settings?: UserSettings;
  onUpdateSettings?: (newSettings: Partial<UserSettings>) => void;
  onNavigateHome?: () => void;
  onOpenAdhkarSettings?: () => void;
}

export const AdhkarSection: React.FC<AdhkarSectionProps> = ({
  settings,
  onUpdateSettings,
  onNavigateHome,
  onOpenAdhkarSettings,
}) => {
  const [adhkarList] = useState<DhikrItem[]>(() =>
    DAILY_ADHIKAR.filter((item) => item.category !== 'after_prayer')
  );
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [activeTabMode, setActiveTabMode] = useState<'daily' | 'hisn'>('daily');
  const [activeCategory, setActiveCategory] = useState<'all' | 'morning' | 'evening'>('morning');
  const [selectedReciter, setSelectedReciter] = useState<string>(
    settings?.adhkarReciter &&
      ADHKAR_SOURCES[settings.adhkarReciter] &&
      settings.adhkarReciter !== 'speech_synth'
      ? settings.adhkarReciter
      : 'alafasy_adhkar'
  );
  const [audioMode, setAudioMode] = useState<'short' | 'full'>('short');
  const [selectedShortSheikh, setSelectedShortSheikh] = useState<ShortAdhkarSheikhId>(() => {
    if (typeof window === 'undefined') return 'rotate';
    const saved = localStorage.getItem('adhkar_short_sheikh') as ShortAdhkarSheikhId | null;
    if (saved && SHORT_ADHKAR_SHEIKHS.some((s) => s.id === saved)) {
      return saved;
    }
    localStorage.setItem('adhkar_short_sheikh', 'rotate');
    return 'rotate';
  });
  const [playerState, setPlayerState] = useState<AudioPlayerState>('idle');
  const [activeAudioType, setActiveAudioType] = useState<ActiveAudioType>('none');
  const [currentlyPlayingDhikrId, setCurrentlyPlayingDhikrId] = useState<string | null>(null);
  const [playingSheikhName, setPlayingSheikhName] = useState<string | null>(null);
  const [isSequentialShortPlaying, setIsSequentialShortPlaying] = useState<boolean>(false);
  const [isTasbihModalOpen, setIsTasbihModalOpen] = useState<boolean>(false);
  const [tasbihInitialPurpose, setTasbihInitialPurpose] = useState<'post_prayer' | 'jumuah_salawat'>(
    'jumuah_salawat'
  );
  const [salawatSummary, setSalawatSummary] = useState(() => loadJumuahSalawatProgress());

  const sequentialStateRef = useRef({
    active: false,
    currentId: null as string | null,
    items: [] as DhikrItem[],
    sheikhId: 'rotate' as ShortAdhkarSheikhId,
  });

  const isJumuahActive =
    new Date().getDay() === 5 ||
    (typeof window !== 'undefined' && localStorage.getItem('jumuah_preview_mode') === 'true');

  const baseFilteredAdhkar =
    activeCategory === 'all'
      ? adhkarList
      : adhkarList.filter(
          (item) => item.category === activeCategory || item.category === 'general'
        );

  // When a specific Sheikh is chosen, place cards recited by that Sheikh first
  // so changing the Sheikh in the dropdown immediately updates the top cards & playback order.
  const filteredAdhkar =
    selectedShortSheikh === 'rotate'
      ? baseFilteredAdhkar
      : [...baseFilteredAdhkar].sort((a, b) => {
          const aMatch = hasExactShortClipForSheikh(a.id, selectedShortSheikh) ? 0 : 1;
          const bMatch = hasExactShortClipForSheikh(b.id, selectedShortSheikh) ? 0 : 1;
          return aMatch - bMatch;
        });

  const matchingSheikhCardsCount =
    selectedShortSheikh === 'rotate'
      ? filteredAdhkar.length
      : filteredAdhkar.filter((it) => hasExactShortClipForSheikh(it.id, selectedShortSheikh)).length;

  useEffect(() => {
    sequentialStateRef.current.active = isSequentialShortPlaying;
    sequentialStateRef.current.currentId = currentlyPlayingDhikrId;
    sequentialStateRef.current.items = filteredAdhkar;
    sequentialStateRef.current.sheikhId = selectedShortSheikh;
  }, [isSequentialShortPlaying, currentlyPlayingDhikrId, filteredAdhkar, selectedShortSheikh]);

  useEffect(() => {
    const unsub = adhanPlayer.subscribe({
      onStateChange: (st, type) => {
        setPlayerState(st);
        setActiveAudioType(type);
        if (st === 'idle') {
          if (!sequentialStateRef.current.active) {
            setCurrentlyPlayingDhikrId(null);
            setPlayingSheikhName(null);
          }
        }
      },
      onAdhkarEnded: () => {
        if (!sequentialStateRef.current.active) return;
        const list = sequentialStateRef.current.items;
        const idx = list.findIndex((it) => it.id === sequentialStateRef.current.currentId);
        const nextItem = idx >= 0 && idx + 1 < list.length ? list[idx + 1] : null;
        if (nextItem) {
          setCurrentlyPlayingDhikrId(nextItem.id);
          void adhanPlayer
            .playShortDhikrClip(nextItem.id, sequentialStateRef.current.sheikhId, nextItem.text)
            .then(({ sheikhNameAr }) => {
              setPlayingSheikhName(sheikhNameAr);
            });
        } else {
          setIsSequentialShortPlaying(false);
          setCurrentlyPlayingDhikrId(null);
          setPlayingSheikhName(null);
        }
      },
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (
      settings?.adhkarReciter &&
      ADHKAR_SOURCES[settings.adhkarReciter] &&
      settings.adhkarReciter !== 'speech_synth'
    ) {
      setSelectedReciter(settings.adhkarReciter);
    }
  }, [settings?.adhkarReciter]);

  useEffect(() => {
    if (
      settings?.adhkarShortSheikh &&
      SHORT_ADHKAR_SHEIKHS.some((s) => s.id === settings.adhkarShortSheikh)
    ) {
      setSelectedShortSheikh(settings.adhkarShortSheikh as ShortAdhkarSheikhId);
    }
  }, [settings?.adhkarShortSheikh]);

  const handleReciterChange = (reciterId: string) => {
    setSelectedReciter(reciterId);
    if (onUpdateSettings) {
      onUpdateSettings({ adhkarReciter: reciterId });
    }
  };

  const handleShortSheikhChange = (sheikhId: ShortAdhkarSheikhId) => {
    setSelectedShortSheikh(sheikhId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('adhkar_short_sheikh', sheikhId);
    }
    if (onUpdateSettings) {
      onUpdateSettings({ adhkarShortSheikh: sheikhId });
    }

    // If short-clip audio is currently active on a card or sequential player,
    // immediately switch the active voice to the newly selected Sheikh.
    if (
      activeAudioType === 'adhkar' &&
      (playerState === 'playing' || playerState === 'loading') &&
      currentlyPlayingDhikrId
    ) {
      const nextList =
        sheikhId === 'rotate'
          ? baseFilteredAdhkar
          : [...baseFilteredAdhkar].sort((a, b) => {
              const aMatch = hasExactShortClipForSheikh(a.id, sheikhId) ? 0 : 1;
              const bMatch = hasExactShortClipForSheikh(b.id, sheikhId) ? 0 : 1;
              return aMatch - bMatch;
            });

      const currentItem = nextList.find((it) => it.id === currentlyPlayingDhikrId);
      const targetItem =
        currentItem && (sheikhId === 'rotate' || hasExactShortClipForSheikh(currentItem.id, sheikhId))
          ? currentItem
          : nextList[0];

      if (targetItem) {
        setCurrentlyPlayingDhikrId(targetItem.id);
        void adhanPlayer
          .playShortDhikrClip(targetItem.id, sheikhId, targetItem.text)
          .then(({ sheikhNameAr }) => {
            setPlayingSheikhName(sheikhNameAr);
          });
      }
    }
  };

  const handleIncrement = (id: string, maxCount: number) => {
    adhanPlayer.playChime();
    setCounts((prev) => {
      const current = prev[id] || 0;
      if (current < maxCount) {
        return { ...prev, [id]: current + 1 };
      }
      return prev;
    });
  };

  const handleReset = (id: string) => {
    setCounts((prev) => ({ ...prev, [id]: 0 }));
  };

  const handleToggleFullAdhkarAudio = () => {
    setIsSequentialShortPlaying(false);
    setCurrentlyPlayingDhikrId(null);
    if (
      (playerState === 'playing' || playerState === 'loading') &&
      activeAudioType === 'adhkar' &&
      !currentlyPlayingDhikrId
    ) {
      adhanPlayer.stop();
      setPlayingSheikhName(null);
    } else {
      const period = activeCategory === 'evening' ? 'evening' : 'morning';
      const sampleText = activeCategory === 'evening' ? 'أذكار المساء المباركة' : 'أذكار الصباح المباركة';
      const info = ADHKAR_SOURCES[selectedReciter] || ADHKAR_SOURCES.alafasy_adhkar;
      setPlayingSheikhName(info.nameAr);
      adhanPlayer.playAdhkar(selectedReciter, sampleText, period);
    }
  };

  const handleToggleSequentialShortAudio = () => {
    if (isSequentialShortPlaying && (playerState === 'playing' || playerState === 'loading')) {
      setIsSequentialShortPlaying(false);
      setCurrentlyPlayingDhikrId(null);
      setPlayingSheikhName(null);
      adhanPlayer.stop();
      return;
    }
    const firstItem = filteredAdhkar[0];
    if (!firstItem) return;
    setIsSequentialShortPlaying(true);
    setCurrentlyPlayingDhikrId(firstItem.id);
    void adhanPlayer
      .playShortDhikrClip(firstItem.id, selectedShortSheikh, firstItem.text)
      .then(({ sheikhNameAr }) => {
        setPlayingSheikhName(sheikhNameAr);
      });
  };

  const handlePlayIndividualDhikr = (item: DhikrItem) => {
    setIsSequentialShortPlaying(false);
    if (
      currentlyPlayingDhikrId === item.id &&
      (playerState === 'playing' || playerState === 'loading') &&
      activeAudioType === 'adhkar'
    ) {
      adhanPlayer.stop();
      setCurrentlyPlayingDhikrId(null);
      setPlayingSheikhName(null);
    } else {
      setCurrentlyPlayingDhikrId(item.id);
      void adhanPlayer
        .playShortDhikrClip(item.id, selectedShortSheikh, item.text)
        .then(({ sheikhNameAr }) => {
          setPlayingSheikhName(sheikhNameAr);
        });
    }
  };

  const completedItemsCount = filteredAdhkar.filter(
    (item) => (counts[item.id] || 0) >= item.count
  ).length;
  const totalRepsTarget = filteredAdhkar.reduce((sum, item) => sum + item.count, 0);
  const completedRepsCount = filteredAdhkar.reduce(
    (sum, item) => sum + Math.min(counts[item.id] || 0, item.count),
    0
  );
  const overallProgressPercent =
    totalRepsTarget > 0 ? Math.round((completedRepsCount / totalRepsTarget) * 100) : 0;

  const handleResetCategory = () => {
    setCounts((prev) => {
      const next = { ...prev };
      for (const item of filteredAdhkar) {
        next[item.id] = 0;
      }
      return next;
    });
  };

  const currentReciterInfo = ADHKAR_SOURCES[selectedReciter] || ADHKAR_SOURCES.alafasy_adhkar;
  const currentShortSheikhInfo =
    SHORT_ADHKAR_SHEIKHS.find((s) => s.id === selectedShortSheikh) || SHORT_ADHKAR_SHEIKHS[0];

  const getCategoryLabel = (category: DhikrItem['category']) => {
    switch (category) {
      case 'morning':
        return 'أذكار الصباح';
      case 'evening':
        return 'أذكار المساء';
      default:
        return 'ذكر عام';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-fade-in">
      <PostPrayerTasbihModal
        isOpen={isTasbihModalOpen}
        onClose={() => setIsTasbihModalOpen(false)}
        prayerNameAr={isJumuahActive ? 'الجمعة' : 'الصلاة'}
        isJumuahMode={isJumuahActive}
        initialPurpose={tasbihInitialPurpose}
        onSalawatProgressChange={(count, target) =>
          setSalawatSummary((prev) => ({ ...prev, count, target }))
        }
      />

      {/* Top Header Card — Mobile-Safe Royal Emerald & Gold Mihrab */}
      <div
        style={{
          background: 'linear-gradient(145deg, #0E231C 0%, #06130F 100%)',
          border: '1px solid rgba(212, 175, 55, 0.35)',
        }}
        className="theme-keep-light relative overflow-hidden rounded-[26px] p-4 sm:p-6 shadow-[0_16px_42px_rgba(0,0,0,0.45)] space-y-4"
      >
        <div
          className="pointer-events-none absolute -top-12 -left-12 w-44 h-44 rounded-full bg-[#D4AF37]/10 blur-2xl"
          aria-hidden="true"
        />

        <div className="relative z-10 flex items-center justify-between gap-2 flex-wrap">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-[#10B981]">
            <BookOpen className="w-4 h-4 shrink-0" />
            <span className="truncate">حصن المسلم والذكر النبوي</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onOpenAdhkarSettings && (
              <button
                type="button"
                onClick={onOpenAdhkarSettings}
                className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#040D0A]/85 border border-[#D4AF37]/40 hover:border-[#F3D06B] text-[#F3D06B] font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer"
                title="ضبط مواعيد أذكار الصباح والمساء والقارئ المفضل"
              >
                <Settings className="w-3.5 h-3.5 shrink-0" />
                <span>ضبط المواعيد</span>
                {settings && (
                  <span className="hidden sm:inline font-mono text-[10px] text-emerald-300 opacity-90">
                    ({settings.morningAdhkarEnabled !== false ? settings.morningAdhkarTime : 'متوقف'} ·{' '}
                    {settings.eveningAdhkarEnabled !== false ? settings.eveningAdhkarTime : 'متوقف'})
                  </span>
                )}
              </button>
            )}

            {onNavigateHome && (
              <button
                type="button"
                onClick={onNavigateHome}
                style={{
                  background: 'linear-gradient(135deg, #F3D06B 0%, #D4AF37 100%)',
                }}
                className="min-h-[38px] px-3.5 py-1.5 rounded-xl text-[#060B09] font-extrabold text-xs shadow-sm hover:brightness-105 active:scale-95 transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer"
                title="العودة السريعة إلى الصفحة الرئيسية (المواقيت)"
              >
                <Home className="w-3.5 h-3.5 shrink-0" />
                <span>الرئيسية</span>
              </button>
            )}
          </div>
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white font-amiri text-right">
            الأذكار اليومية وموسوعة حصن المسلم
          </h2>

          {/* Mobile-Safe 2-Column Tab Switcher (Never overflows horizontally) */}
          <div className="grid grid-cols-2 gap-1.5 bg-[#040D0A] p-1.5 rounded-2xl border border-[#D4AF37]/25 w-full lg:w-auto shrink-0">
            <button
              type="button"
              onClick={() => setActiveTabMode('daily')}
              className={`min-h-[44px] px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTabMode === 'daily'
                  ? 'bg-gradient-to-l from-[#10B981] to-[#059669] text-[#03120E] shadow-md font-extrabold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span>الأذكار اليومية</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTabMode('hisn')}
              className={`min-h-[44px] px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTabMode === 'hisn'
                  ? 'bg-gradient-to-l from-[#10B981] to-[#059669] text-[#03120E] shadow-md font-extrabold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span>حصن المسلم</span>
            </button>
          </div>
        </div>
      </div>

      {activeTabMode === 'hisn' ? (
        <HisnAlMuslimSection />
      ) : (
        <div className="theme-keep-light space-y-5">
          {/* Unified Sleek Mihrab Console: Category Filter + Daily Progress + Sheikh Audio Player */}
          <div
            style={{
              background: 'linear-gradient(155deg, #0D201A 0%, #07130F 100%)',
              border: '1px solid rgba(212, 175, 55, 0.3)',
            }}
            className="rounded-[24px] p-4 sm:p-5 shadow-[0_14px_38px_rgba(0,0,0,0.4)] space-y-4"
          >
            {/* Row 1: 3-Column Segmented Categories (Zero clipping on mobile) */}
            <div className="grid grid-cols-3 gap-1.5 bg-[#040D0A] p-1.5 rounded-2xl border border-[#D4AF37]/20">
              {[
                { key: 'morning' as const, label: 'أذكار الصباح' },
                { key: 'evening' as const, label: 'أذكار المساء' },
                { key: 'all' as const, label: 'جميع الأذكار' },
              ].map((tab) => {
                const isActive = activeCategory === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveCategory(tab.key)}
                    className={`min-h-[42px] px-2 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 whitespace-nowrap truncate cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-l from-[#F3D06B] to-[#D4AF37] text-[#060B09] shadow-sm font-extrabold'
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Row 2: Daily Progress Strip */}
            <div className="space-y-2 px-0.5">
              <div className="flex flex-wrap items-center justify-between gap-2 text-right">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm text-slate-300">
                  <span className="font-bold text-white">الإنجاز اليومي</span>
                  <span aria-hidden="true" className="text-[#D4AF37]/50">
                    ·
                  </span>
                  <span className="tabular-nums">
                    اكتمل <strong className="text-[#F3D06B] font-bold">{completedItemsCount}</strong> من{' '}
                    <strong className="text-white font-bold">{filteredAdhkar.length}</strong>
                  </span>
                  <span aria-hidden="true" className="text-[#D4AF37]/50">
                    ·
                  </span>
                  <span className="tabular-nums text-slate-400">
                    {completedRepsCount} / {totalRepsTarget} تسبيحة
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  {completedRepsCount > 0 && (
                    <button
                      type="button"
                      onClick={handleResetCategory}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      تصفير القسم
                    </button>
                  )}
                  <span
                    className={`text-sm font-extrabold tabular-nums ${
                      overallProgressPercent === 100 ? 'text-[#10B981]' : 'text-[#F3D06B]'
                    }`}
                  >
                    {overallProgressPercent}%
                  </span>
                </div>
              </div>

              <div
                className="w-full h-2 rounded-full bg-[#040D0A] border border-[#D4AF37]/15 overflow-hidden"
                role="progressbar"
                aria-valuenow={overallProgressPercent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="نسبة إنجاز الأذكار اليومية"
              >
                <div
                  className={`h-full rounded-full transition-all duration-300 ease-out ${
                    overallProgressPercent === 100
                      ? 'bg-[#10B981]'
                      : 'bg-gradient-to-l from-[#10B981] via-[#34D399] to-[#F3D06B]'
                  }`}
                  style={{ width: `${overallProgressPercent}%` }}
                />
              </div>
            </div>

            {/* Row 3: Real Sheikh Audio Console (Short Clips per Dhikr OR Full Wird) */}
            <div className="pt-3 border-t border-[#D4AF37]/15 space-y-3">
              {/* Compact 2-Mode Audio Switcher */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-[#040D0A] border border-[#D4AF37]/20">
                  <button
                    type="button"
                    onClick={() => setAudioMode('short')}
                    className={`min-h-[34px] px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      audioMode === 'short'
                        ? 'bg-[#10B981] text-[#03120E] font-extrabold'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    مقاطع قصيرة (بصوت المشايخ)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAudioMode('full')}
                    className={`min-h-[34px] px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      audioMode === 'full'
                        ? 'bg-[#10B981] text-[#03120E] font-extrabold'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    الوِرد الكامل
                  </button>
                </div>

                {playingSheikhName && (playerState === 'playing' || playerState === 'loading') && activeAudioType === 'adhkar' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#10B981]/15 border border-[#10B981]/45 text-[11px] font-bold text-[#10B981]">
                    <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                    <span>يُتلى الآن: {playingSheikhName}</span>
                  </span>
                )}
              </div>

              {audioMode === 'short' ? (
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#040D0A] border border-[#D4AF37]/30 flex items-center justify-center shrink-0">
                        <Mic className="w-4 h-4 text-[#F3D06B]" />
                      </div>
                      <select
                        value={selectedShortSheikh}
                        onChange={(e) =>
                          handleShortSheikhChange(e.target.value as ShortAdhkarSheikhId)
                        }
                        aria-label="اختيار الشيخ للمقاطع القصيرة"
                        className="flex-1 min-w-0 min-h-[44px] bg-[#040D0A] border border-[#D4AF37]/30 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-100 font-semibold focus:outline-none focus:border-[#F3D06B] text-right cursor-pointer"
                      >
                        {SHORT_ADHKAR_SHEIKHS.map((sh) => (
                          <option key={sh.id} value={sh.id}>
                            {sh.nameAr}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={handleToggleSequentialShortAudio}
                      style={
                        isSequentialShortPlaying &&
                        (playerState === 'playing' || playerState === 'loading')
                          ? undefined
                          : {
                              background:
                                'linear-gradient(135deg, #F3D06B 0%, #D4AF37 55%, #B89124 100%)',
                            }
                      }
                      className={`min-h-[44px] flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm transition-all duration-200 shrink-0 whitespace-nowrap cursor-pointer active:scale-[0.98] ${
                        isSequentialShortPlaying &&
                        (playerState === 'playing' || playerState === 'loading')
                          ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-md ring-2 ring-rose-400/35'
                          : 'text-[#060B09] shadow-[0_6px_18px_rgba(212,175,55,0.22)] hover:brightness-105'
                      }`}
                    >
                      {isSequentialShortPlaying &&
                      (playerState === 'playing' || playerState === 'loading') ? (
                        <>
                          <Square className="w-3.5 h-3.5 fill-current shrink-0" />
                          <span>إيقاف المقاطع</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current shrink-0" />
                          <span>تشغيل المقاطع القصيرة</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="text-[11px] text-slate-300 text-right leading-relaxed px-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                    <span className="text-[#F3D06B] font-bold">
                      {currentShortSheikhInfo.nameAr}
                    </span>
                    <span aria-hidden="true" className="text-[#D4AF37]/50">
                      ·
                    </span>
                    <span className="text-slate-400">
                      {selectedShortSheikh === 'rotate'
                        ? currentShortSheikhInfo.subtitleAr
                        : `متاح بصوته في ${matchingSheikhCardsCount} من ${filteredAdhkar.length} ذكر (تظهر في المقدمة)`}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#040D0A] border border-[#D4AF37]/30 flex items-center justify-center shrink-0">
                        <Mic className="w-4 h-4 text-[#F3D06B]" />
                      </div>
                      <select
                        value={selectedReciter}
                        onChange={(e) => handleReciterChange(e.target.value)}
                        aria-label="اختيار القارئ للأذكار الكاملة"
                        className="flex-1 min-w-0 min-h-[44px] bg-[#040D0A] border border-[#D4AF37]/30 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-100 font-semibold focus:outline-none focus:border-[#F3D06B] text-right cursor-pointer"
                      >
                        {Object.values(ADHKAR_SOURCES)
                          .filter((src) => src.id !== 'speech_synth')
                          .map((src) => (
                            <option key={src.id} value={src.id}>
                              {src.nameAr}
                            </option>
                          ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={handleToggleFullAdhkarAudio}
                      style={
                        !currentlyPlayingDhikrId &&
                        (playerState === 'playing' || playerState === 'loading') &&
                        activeAudioType === 'adhkar'
                          ? undefined
                          : {
                              background:
                                'linear-gradient(135deg, #F3D06B 0%, #D4AF37 55%, #B89124 100%)',
                            }
                      }
                      className={`min-h-[44px] flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm transition-all duration-200 shrink-0 whitespace-nowrap cursor-pointer active:scale-[0.98] ${
                        !currentlyPlayingDhikrId &&
                        (playerState === 'playing' || playerState === 'loading') &&
                        activeAudioType === 'adhkar'
                          ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-md ring-2 ring-rose-400/35'
                          : 'text-[#060B09] shadow-[0_6px_18px_rgba(212,175,55,0.22)] hover:brightness-105'
                      }`}
                    >
                      {!currentlyPlayingDhikrId &&
                      (playerState === 'playing' || playerState === 'loading') &&
                      activeAudioType === 'adhkar' ? (
                        <>
                          <Square className="w-3.5 h-3.5 fill-current shrink-0" />
                          <span>إيقاف التلاوة</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current shrink-0" />
                          <span>تشغيل الوِرد الكامل</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="text-[11px] text-slate-400 text-right truncate px-0.5">
                    القارئ المختار · <span className="text-[#F3D06B]">{currentReciterInfo.nameAr}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Adhkar Cards Grid with SVG Circular Progress Ring & Tap-to-Count */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAdhkar.map((item, idx) => {
              const currentCount = counts[item.id] || 0;
              const isCompleted = currentCount >= item.count;
              const remaining = Math.max(0, item.count - currentCount);
              const progressRatio = item.count > 0 ? Math.min(1, currentCount / item.count) : 1;
              const isThisDhikrPlaying =
                currentlyPlayingDhikrId === item.id &&
                (playerState === 'playing' || playerState === 'loading') &&
                activeAudioType === 'adhkar';
              const cardClipPreview = resolveShortDhikrClip(item.id, selectedShortSheikh, idx);

              const radius = 23;
              const circumference = 2 * Math.PI * radius;
              const dashOffset = circumference * (1 - progressRatio);

              return (
                <div
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  aria-disabled={isCompleted}
                  aria-label={`${item.text} - ${currentCount} من ${item.count}`}
                  onClick={() => {
                    if (!isCompleted) {
                      handleIncrement(item.id, item.count);
                    }
                  }}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && !isCompleted) {
                      e.preventDefault();
                      handleIncrement(item.id, item.count);
                    }
                  }}
                  style={{
                    background: isCompleted
                      ? 'linear-gradient(155deg, #0C2B20 0%, #061812 100%)'
                      : 'linear-gradient(155deg, #10241D 0%, #081410 100%)',
                    border: isCompleted
                      ? '1px solid rgba(16, 185, 129, 0.55)'
                      : '1px solid rgba(212, 175, 55, 0.3)',
                  }}
                  className={`group relative overflow-hidden rounded-[22px] p-5 sm:p-6 transition-all duration-200 flex flex-col justify-between text-right select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F3D06B] ${
                    isCompleted
                      ? 'shadow-[0_10px_28px_rgba(16,185,129,0.12)] cursor-default'
                      : 'shadow-[0_12px_32px_rgba(0,0,0,0.35)] hover:border-[#D4AF37]/60 active:scale-[0.99] cursor-pointer'
                  }`}
                >
                  {/* Soft ambient corner glow */}
                  <div
                    className={`pointer-events-none absolute -top-8 -left-8 w-28 h-28 rounded-full blur-2xl ${
                      isCompleted ? 'bg-[#10B981]/15' : 'bg-[#D4AF37]/10'
                    }`}
                    aria-hidden="true"
                  />

                  <div className="relative z-10 flex flex-col">
                    {/* Card Header: Unboxed Index + Category & Audio + Circular SVG Ring */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 pt-1">
                        <span className="tabular-nums font-extrabold text-[#F3D06B]">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <span aria-hidden="true" className="text-[#D4AF37]/50">
                          ·
                        </span>
                        <span>{getCategoryLabel(item.category)}</span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlayIndividualDhikr(item);
                          }}
                          className={`min-h-[40px] px-3 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 border whitespace-nowrap cursor-pointer ${
                            isThisDhikrPlaying
                              ? 'bg-[#10B981]/20 border-[#10B981] text-[#10B981]'
                              : 'bg-[#040D0A] hover:bg-[#091D16] border-[#D4AF37]/30 text-[#F3D06B]'
                          }`}
                          title={
                            cardClipPreview
                              ? `استماع بصوت ${cardClipPreview.sheikhNameAr}`
                              : 'استماع لهذا الذكر'
                          }
                        >
                          {isThisDhikrPlaying ? (
                            <Square className="w-3.5 h-3.5 fill-current shrink-0" />
                          ) : (
                            <Volume2 className="w-3.5 h-3.5 shrink-0" />
                          )}
                          <span>{isThisDhikrPlaying ? 'إيقاف' : 'استماع'}</span>
                        </button>

                        {/* Circular Progress Ring per Dhikr */}
                        <div
                          className="relative w-[54px] h-[54px] flex items-center justify-center shrink-0"
                          title={`التقدم: ${currentCount} من ${item.count}`}
                        >
                          <svg
                            className="w-full h-full -rotate-90"
                            viewBox="0 0 54 54"
                            aria-hidden="true"
                          >
                            <circle
                              cx="27"
                              cy="27"
                              r={radius}
                              fill="none"
                              stroke={isCompleted ? 'rgba(16,185,129,0.2)' : 'rgba(212,175,55,0.16)'}
                              strokeWidth="4"
                            />
                            <circle
                              cx="27"
                              cy="27"
                              r={radius}
                              fill="none"
                              stroke={isCompleted ? '#10B981' : '#F3D06B'}
                              strokeWidth="4"
                              strokeLinecap="round"
                              strokeDasharray={circumference}
                              strokeDashoffset={dashOffset}
                              className="transition-all duration-300 ease-out"
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
                            {isCompleted ? (
                              <Check className="w-5 h-5 text-[#10B981] stroke-[2.75]" />
                            ) : (
                              <>
                                <span className="text-xs font-extrabold text-white tabular-nums">
                                  {currentCount}
                                </span>
                                <span className="text-[10px] text-slate-400 tabular-nums">
                                  /{item.count}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Dhikr Arabic Text */}
                    <p className="mt-4 text-xl md:text-2xl font-bold text-white font-amiri leading-[1.95] text-right">
                      {item.text}
                    </p>

                    {/* Real Sheikh Short Clip Label & Virtue Footnote */}
                    {(cardClipPreview || item.virtue) && (
                      <div className="mt-4 pt-3 border-t border-[#D4AF37]/15 space-y-1.5">
                        {item.virtue && (
                          <p className="text-xs text-slate-300/90 leading-relaxed">
                            {item.virtue}
                          </p>
                        )}
                        {cardClipPreview && (() => {
                          const isExactSelectedSheikh =
                            selectedShortSheikh === 'rotate' ||
                            hasExactShortClipForSheikh(item.id, selectedShortSheikh);
                          return (
                            <p
                              className={`text-[11px] font-semibold flex items-center gap-1.5 ${
                                isExactSelectedSheikh ? 'text-[#10B981]/95' : 'text-amber-300/85'
                              }`}
                            >
                              <Mic className="w-3 h-3 shrink-0" />
                              <span>
                                {isThisDhikrPlaying && playingSheikhName
                                  ? `يُتلى الآن بصوت ${playingSheikhName}`
                                  : isExactSelectedSheikh
                                  ? `مقطع قصير بصوت ${cardClipPreview.sheikhNameAr}`
                                  : `متاح بصوت بديل: ${cardClipPreview.sheikhNameAr}`}
                              </span>
                            </p>
                          );
                        })()}
                      </div>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div className="relative z-10 flex items-center justify-between gap-3 mt-5 pt-4 border-t border-[#D4AF37]/15">
                    <div className="text-xs font-semibold tabular-nums">
                      {isCompleted ? (
                        <span className="inline-flex items-center gap-1.5 text-[#10B981] font-bold">
                          <CheckCircle className="w-4 h-4 shrink-0" />
                          <span>تم بحمد الله</span>
                        </span>
                      ) : (
                        <span className="text-slate-300">
                          المتبقي: <strong className="text-[#F3D06B]">{remaining}</strong> · اضغط للعدّ
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReset(item.id);
                        }}
                        title="إعادة التعيين"
                        aria-label="إعادة تعيين العداد"
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-[#040D0A] border border-[#D4AF37]/25 text-slate-300 hover:text-white hover:border-[#D4AF37]/60 transition-colors cursor-pointer"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isCompleted) {
                            handleIncrement(item.id, item.count);
                          }
                        }}
                        disabled={isCompleted}
                        style={
                          isCompleted
                            ? undefined
                            : {
                                background:
                                  'linear-gradient(135deg, #F3D06B 0%, #D4AF37 55%, #B89124 100%)',
                              }
                        }
                        className={`min-h-[44px] px-5 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm transition-all duration-200 whitespace-nowrap ${
                          isCompleted
                            ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/40 cursor-not-allowed'
                            : 'text-[#060B09] shadow-[0_6px_18px_rgba(212,175,55,0.22)] hover:brightness-105 active:scale-95 cursor-pointer'
                        }`}
                      >
                        {isCompleted ? 'مكتمل' : 'تسبيح (+1)'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sleek Interactive Tasbih & Friday Salawat Wird Banner */}
          <div
            style={{
              background: 'linear-gradient(145deg, #0D221B 0%, #06130F 100%)',
              border: '1px solid rgba(212, 175, 55, 0.4)',
            }}
            className="rounded-[24px] p-5 md:p-6 shadow-[0_14px_38px_rgba(0,0,0,0.4)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
          >
            <div className="space-y-1 text-right">
              <div className="flex items-center gap-2 text-xs font-bold text-[#F3D06B]">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>
                  {isJumuahActive
                    ? 'مسبحة وِرد الصلاة على النبي ﷺ الخاصة بيوم الجمعة'
                    : 'المسبحة الشرقية الواقعية وخاتم التسبيح الإلكتروني'}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold font-amiri text-white">
                وِرد الصلاة على النبي ﷺ (الإبراهيمية والمختصرة) — هدف ١٠٠ أو ١٠٠٠
              </h3>
              <p className="text-xs text-slate-300">
                إنجازك اليوم:{' '}
                <strong className="text-[#F3D06B] font-mono tabular-nums">
                  {salawatSummary.count} / {salawatSummary.target}
                </strong>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto shrink-0">
              <button
                type="button"
                onClick={() => {
                  setTasbihInitialPurpose('jumuah_salawat');
                  setIsTasbihModalOpen(true);
                }}
                style={{
                  background: 'linear-gradient(135deg, #F3D06B 0%, #D4AF37 55%, #B89124 100%)',
                }}
                className="min-h-[44px] flex-1 md:flex-initial px-5 py-2.5 rounded-xl text-[#060B09] font-extrabold text-xs sm:text-sm hover:brightness-105 active:scale-95 transition-all shadow-md whitespace-nowrap cursor-pointer"
              >
                فتح مسبحة وِرد الجمعة ﷺ
              </button>
              <button
                type="button"
                onClick={() => {
                  setTasbihInitialPurpose('post_prayer');
                  setIsTasbihModalOpen(true);
                }}
                className="min-h-[44px] flex-1 md:flex-initial px-4 py-2.5 rounded-xl bg-[#040D0A] border border-[#D4AF37]/35 hover:border-[#F3D06B] text-[#F3D06B] font-bold text-xs transition-all whitespace-nowrap cursor-pointer"
              >
                أذكار ما بعد الصلاة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
