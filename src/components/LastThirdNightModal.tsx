import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Check,
  RotateCcw,
  Copy,
  CheckCheck,
  Volume2,
  VolumeX,
  BellRing,
  Play,
  Pause,
  RefreshCw,
  ArrowLeft,
  ChevronDown,
} from 'lucide-react';
import { LastThirdNightTheme, NightThirdsInfo, UserSettings } from '../types';
import {
  SAHAR_DUAS,
  ISTIGHFAR_FORMULAS,
  DEFAULT_TAHAJJUD_RAKATS,
  POST_WITR_ADHKAR,
  TahajjudRakatPlan,
  QiyamStreakState,
  QIYAM_NIGHT_VERSES,
  QIYAM_RECITERS,
  QiyamReciterId,
  buildQiyamVerseAudioUrlSets,
  getLocalDateKey,
  loadQiyamStreakState,
  pickNextQiyamVerse,
  saveQiyamStreakState,
  getWeekSaturdayToFridayStreakView,
  toggleQiyamStreakDate,
} from '../utils/lastThirdNightData';
import { QIYAM_MUSHAF_SURAHS, QiyamMushafSurah } from '../utils/qiyamMushafData';
import { calculateNightThirds } from '../utils/prayerCalculator';
import { adhanPlayer } from '../utils/audioAdhan';
import { toArabicDigits } from '../utils/khatmaData';

interface LastThirdNightModalProps {
  isOpen: boolean;
  onClose: () => void;
  nightInfo: NightThirdsInfo;
  settings: UserSettings;
  onUpdateSettings?: (newSettings: Partial<UserSettings>) => void;
  onNavigateToAdhkar?: () => void;
}

const ToggleSwitch: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  inactiveBg?: string;
}> = ({ checked, onChange, label, inactiveBg = '#08100E' }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={() => onChange(!checked)}
    style={!checked ? { backgroundColor: inactiveBg } : undefined}
    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F3D06B] ${
      checked ? 'bg-[#10B981] border-[#10B981]' : 'border-[#D4AF37]/35'
    }`}
  >
    <span
      className={`pointer-events-none absolute top-0.5 start-0.5 inline-block h-4.5 w-4.5 rounded-full bg-white shadow transition-transform duration-200 ${
        checked ? 'rtl:-translate-x-5 ltr:translate-x-5' : 'translate-x-0'
      }`}
    />
  </button>
);

export const LastThirdNightModal: React.FC<LastThirdNightModalProps> = ({
  isOpen,
  onClose,
  nightInfo,
  settings,
  onUpdateSettings,
  onNavigateToAdhkar,
}) => {
  // 2 Themes ONLY: 'celestial' (🌙 السماء الساهرة) & 'dimmed' (✨ المحراب الخافت)
  const normalizeModalTheme = (t?: LastThirdNightTheme): 'celestial' | 'dimmed' =>
    t === 'dimmed' ? 'dimmed' : 'celestial';

  const [activeTheme, setActiveTheme] = useState<'celestial' | 'dimmed'>(() =>
    normalizeModalTheme(settings.lastThirdNightTheme)
  );
  const [activeSection, setActiveSection] = useState<'rakats' | 'tasbih' | 'duas'>('rakats');

  // Qiyam Streak State (persisted in localStorage, collapsed by default)
  const [qiyamStreak, setQiyamStreak] = useState<QiyamStreakState>(() => loadQiyamStreakState());
  const [isStreakOpen, setIsStreakOpen] = useState<boolean>(false);

  // Shari'ah Night Calculator inputs
  const [calcMaghrib, setCalcMaghrib] = useState<string>(nightInfo.maghribTimeStr || '18:00');
  const [calcFajr, setCalcFajr] = useState<string>(nightInfo.fajrTimeStr || '05:00');

  // Mini Qiyam Mushaf State
  const [selectedSurahId, setSelectedSurahId] = useState<QiyamMushafSurah['id']>('mulk');
  const [mushafFontSize, setMushafFontSize] = useState<number>(() => {
    if (typeof window === 'undefined') return 22;
    const saved = Number(localStorage.getItem('qiyam_mushaf_font_size'));
    return !Number.isNaN(saved) && saved >= 18 && saved <= 36 ? saved : 22;
  });

  // Post-Witr 3-Tap Tasbih ("سبحان الملك القدوس")
  const [witrTasbihCount, setWitrTasbihCount] = useState<number>(0);
  const [copiedQunut, setCopiedQunut] = useState<boolean>(false);

  // Interactive Tahajjud 5-Stage Tracker State (11 rakats total)
  const [rakatList, setRakatList] = useState<TahajjudRakatPlan[]>(() => {
    try {
      const saved = localStorage.getItem('adhan_tahajjud_rakats_today');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.date === new Date().toDateString() && Array.isArray(parsed.list)) {
          return DEFAULT_TAHAJJUD_RAKATS.map((def) => {
            const match = parsed.list.find((item: TahajjudRakatPlan) => item.id === def.id);
            return match ? { ...def, isCompleted: Boolean(match.isCompleted) } : def;
          });
        }
      }
    } catch {
      // fallback
    }
    return DEFAULT_TAHAJJUD_RAKATS;
  });

  // Istighfar Tasbih State
  const [selectedFormulaIndex, setSelectedFormulaIndex] = useState(0);
  const [istighfarCount, setIstighfarCount] = useState(0);
  const [istighfarTarget, setIstighfarTarget] = useState<33 | 100 | 1000>(100);

  // Copied state for Duas
  const [copiedDuaId, setCopiedDuaId] = useState<string | null>(null);

  // Wake Lock state
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  // Quiet Sahar sound chime toggle
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Qiyam verses audio player state inside sanctuary
  const [qiyamVerseIdx, setQiyamVerseIdx] = useState<number>(0);
  const [qiyamReciterId, setQiyamReciterId] = useState<QiyamReciterId>('qatami');
  const [qiyamStatus, setQiyamStatus] = useState<'idle' | 'loading' | 'playing' | 'paused'>('idle');

  const activeSanctuaryVerse = QIYAM_NIGHT_VERSES[qiyamVerseIdx] || QIYAM_NIGHT_VERSES[0];

  const handlePlaySanctuaryQiyamVerse = async (
    verseIndex: number = qiyamVerseIdx,
    reciter: QiyamReciterId = qiyamReciterId
  ) => {
    const verse = QIYAM_NIGHT_VERSES[verseIndex] || QIYAM_NIGHT_VERSES[0];
    setQiyamVerseIdx(verseIndex);
    setQiyamReciterId(reciter);
    setQiyamStatus('loading');
    void adhanPlayer.unlockAudio();
    const res = await adhanPlayer.playQiyamRecitation(
      buildQiyamVerseAudioUrlSets(verse, reciter),
      settings.volume ?? 0.85,
      () => {
        setQiyamStatus('idle');
      },
      verse.verse
    );
    if (res === 'playing') {
      setQiyamStatus('playing');
    } else if (res === 'blocked') {
      setQiyamStatus('paused');
    } else {
      setQiyamStatus('idle');
    }
  };

  useEffect(() => {
    const unsub = adhanPlayer.subscribe({
      onStateChange: (state, activeType) => {
        if (activeType === 'qiyam_verse') {
          if (state === 'playing') setQiyamStatus('playing');
          else if (state === 'loading') setQiyamStatus('loading');
          else if (state === 'paused') setQiyamStatus('paused');
          else setQiyamStatus('idle');
        } else if (activeType === 'none') {
          setQiyamStatus('idle');
        }
      },
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (isOpen) {
      setActiveTheme(normalizeModalTheme(settings.lastThirdNightTheme));
      setCalcMaghrib(nightInfo.maghribTimeStr || '18:00');
      setCalcFajr(nightInfo.fajrTimeStr || '05:00');
    }
  }, [isOpen, settings.lastThirdNightTheme, nightInfo.maghribTimeStr, nightInfo.fajrTimeStr]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('qiyam_mushaf_font_size', String(mushafFontSize));
  }, [mushafFontSize]);

  useEffect(() => {
    saveQiyamStreakState(qiyamStreak);
  }, [qiyamStreak]);

  const handleSelectTheme = (theme: 'celestial' | 'dimmed') => {
    setActiveTheme(theme);
    if (onUpdateSettings) {
      onUpdateSettings({ lastThirdNightTheme: theme });
    }
  };

  useEffect(() => {
    try {
      localStorage.setItem(
        'adhan_tahajjud_rakats_today',
        JSON.stringify({
          date: new Date().toDateString(),
          list: rakatList,
        })
      );
    } catch {
      // ignore
    }
  }, [rakatList]);

  useEffect(() => {
    if (isOpen && 'wakeLock' in navigator) {
      navigator.wakeLock
        .request('screen')
        .then((sentinel) => {
          wakeLockRef.current = sentinel;
        })
        .catch(() => {
          // ignore wakeLock rejection
        });
    }

    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const currentFormula = ISTIGHFAR_FORMULAS[selectedFormulaIndex] || ISTIGHFAR_FORMULAS[0];

  const handleIncrementIstighfar = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(25);
    }
    if (soundEnabled) {
      adhanPlayer.playChime();
    }
    setIstighfarCount((prev) => prev + 1);
  };

  const handleResetIstighfar = () => {
    setIstighfarCount(0);
  };

  const todayDateKey = getLocalDateKey();
  const weekDaysStreak = getWeekSaturdayToFridayStreakView(qiyamStreak);
  const completedWeekCount = weekDaysStreak.filter((d) => d.isCompleted).length;

  const handleToggleStreakDate = (dateKey: string) => {
    if ('vibrate' in navigator) navigator.vibrate(25);
    if (soundEnabled) adhanPlayer.playChime();
    setQiyamStreak((prev) => toggleQiyamStreakDate(prev, dateKey));
  };

  const handleRecordTonightQiyam = () => {
    setQiyamStreak((prev) => {
      if (prev.lastRecordedDate === todayDateKey || prev.completedDates.includes(todayDateKey)) return prev;
      return {
        streakCount: prev.streakCount + 1,
        lastRecordedDate: todayDateKey,
        completedDates: [...prev.completedDates, todayDateKey],
      };
    });
  };

  const handleToggleRakat = (id: string) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(35);
    }
    if (soundEnabled) {
      adhanPlayer.playChime();
    }
    const targetItem = rakatList.find((item) => item.id === id);
    const willBeCompleted = targetItem ? !targetItem.isCompleted : false;

    setRakatList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isCompleted: !item.isCompleted } : item))
    );

    if (id === 'shaf_witr' && willBeCompleted) {
      handleRecordTonightQiyam();
    }
  };

  const handleResetRakats = () => {
    setRakatList((prev) => prev.map((item) => ({ ...item, isCompleted: false })));
    setWitrTasbihCount(0);
  };

  const handleTapWitrTasbih = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(25);
    }
    if (soundEnabled) {
      adhanPlayer.playChime();
    }
    setWitrTasbihCount((prev) => (prev >= POST_WITR_ADHKAR.tasbihTarget ? 0 : prev + 1));
  };

  const handleCopyQunut = () => {
    navigator.clipboard
      .writeText(
        `${POST_WITR_ADHKAR.qunutTitle}\n\n${POST_WITR_ADHKAR.qunutText}\n\nالمصدر: ${POST_WITR_ADHKAR.qunutSource}`
      )
      .then(() => {
        setCopiedQunut(true);
        window.setTimeout(() => setCopiedQunut(false), 2500);
      });
  };

  const handleCopyDua = (dua: (typeof SAHAR_DUAS)[0]) => {
    const textToCopy = `${dua.title}\n\n${dua.text}\n\nالمصدر: ${dua.source}`;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopiedDuaId(dua.id);
      window.setTimeout(() => setCopiedDuaId(null), 2500);
    });
  };

  const completedStagesCount = rakatList.filter((r) => r.isCompleted).length;
  const completedRakatsCount = rakatList
    .filter((r) => r.isCompleted)
    .reduce((sum, r) => sum + r.rakat, 0);
  const totalRakatsTarget = rakatList.reduce((sum, r) => sum + r.rakat, 0);
  const isWitrCompleted = Boolean(rakatList.find((r) => r.id === 'shaf_witr')?.isCompleted);

  // Shari'ah Night Calculator live output
  const calculatedNight = calculateNightThirds(calcMaghrib, calcFajr);
  const totalNightHours = Math.floor(calculatedNight.totalNightMinutes / 60);
  const totalNightRemMins = calculatedNight.totalNightMinutes % 60;
  const oneThirdHours = Math.floor(calculatedNight.lastThirdMinutes / 60);
  const oneThirdRemMins = calculatedNight.lastThirdMinutes % 60;

  // Ordered Mini Mushaf Surahs
  const orderedMushafSurahs: QiyamMushafSurah[] = [
    QIYAM_MUSHAF_SURAHS.find((s) => s.id === 'mulk'),
    QIYAM_MUSHAF_SURAHS.find((s) => s.id === 'muzzammil'),
    QIYAM_MUSHAF_SURAHS.find((s) => s.id === 'muawwidhat'),
    QIYAM_MUSHAF_SURAHS.find((s) => s.id === 'sajdah'),
    QIYAM_MUSHAF_SURAHS.find((s) => s.id === 'ala'),
  ].filter((s): s is QiyamMushafSurah => Boolean(s));

  const currentMushafSurah =
    orderedMushafSurahs.find((s) => s.id === selectedSurahId) || orderedMushafSurahs[0];

  // Auto-entry & Sahar alerts state
  const autoOpenEnabled = settings.lastThirdAutoOpen ?? false;
  const witrEnabled = settings.witrReminderEnabled ?? true;
  const suhoorEnabled = settings.suhoorReminderEnabled ?? false;

  // Istighfar Percentage
  const istighfarPercent =
    istighfarTarget > 0 ? Math.min(100, Math.round((istighfarCount / istighfarTarget) * 100)) : 0;

  // Exact Theme Tokens from Spec
  const isDimmed = activeTheme === 'dimmed';
  const modalBg = isDimmed ? '#0B1512' : '#060B09';
  const cardBg = isDimmed ? '#152520' : '#111C18';
  const innerBg = isDimmed ? '#0E1B17' : '#08100E';
  const borderColor = 'rgba(212, 175, 55, 0.35)';
  const goldGradient = 'linear-gradient(135deg, #F3D06B 0%, #D4AF37 55%, #B89124 100%)';

  const getMuawwidhatSectionLabel = (ayahIdx: number, ayahNumInSurah: number): string | null => {
    if (selectedSurahId !== 'muawwidhat' || ayahNumInSurah !== 1) return null;
    if (ayahIdx === 0) return 'سورة الإخلاص';
    if (ayahIdx === 4) return 'سورة الفلق';
    if (ayahIdx === 9) return 'سورة الناس';
    return null;
  };

  return (
    <div className="last-third-isolated theme-keep-light fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md">
      <div
        style={{ backgroundColor: modalBg, borderColor }}
        className="relative w-full max-w-4xl max-h-[94vh] rounded-[28px] border flex flex-col text-right font-sans overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.8)] transition-colors duration-300"
      >
        {/* Ambient Royal Glow (Top-Left Corner) */}
        <div
          className="pointer-events-none absolute -top-20 -left-20 w-72 h-72 rounded-full bg-[#D4AF37]/10 blur-3xl"
          aria-hidden="true"
        />

        {/* ========================================================= */}
        {/* HEADER                                                    */}
        {/* ========================================================= */}
        <div
          style={{ borderColor: 'rgba(212, 175, 55, 0.22)' }}
          className="relative shrink-0 z-20 px-4 sm:px-6 pt-4 pb-3.5 border-b space-y-3"
        >
          {/* Row 1: Streak Capsule (Far Right) + Sound & Close Circular Buttons (Far Left) */}
          <div className="flex items-center justify-between gap-2">
            {/* Collapsible 7-Day Streak Pill */}
            <button
              type="button"
              onClick={() => setIsStreakOpen((prev) => !prev)}
              aria-expanded={isStreakOpen}
              style={{ backgroundColor: cardBg }}
              className="min-h-[38px] px-3.5 py-1.5 rounded-full border border-[#D4AF37]/45 text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer hover:border-[#F3D06B]"
              title="عرض سجل مواظبة الأيام السبعة"
            >
              <span aria-hidden="true">🔥</span>
              <span className="text-[#F3D06B]">
                مواظبة {toArabicDigits(qiyamStreak.streakCount)} ليالٍ متتالية
              </span>
              <ChevronDown
                className={`w-4 h-4 text-[#F3D06B] transition-transform duration-200 shrink-0 ${
                  isStreakOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Quiet Sound & Close Circular Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setSoundEnabled((s) => !s)}
                style={{ backgroundColor: cardBg }}
                className={`w-9 h-9 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
                  soundEnabled
                    ? 'border-[#10B981]/50 text-[#10B981] hover:border-[#10B981]'
                    : 'border-white/15 text-slate-400 hover:text-white'
                }`}
                title={soundEnabled ? 'كتم الصوت الهادئ للسحر' : 'تفعيل الصوت الهادئ للسحر'}
                aria-label={soundEnabled ? 'كتم الصوت الهادئ للسحر' : 'تفعيل الصوت الهادئ للسحر'}
              >
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-[#10B981]" />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-400" />
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                style={{ backgroundColor: cardBg }}
                className="w-9 h-9 rounded-full border border-white/15 text-slate-200 hover:text-white hover:border-[#F3D06B]/60 flex items-center justify-center transition-colors cursor-pointer"
                title="إغلاق"
                aria-label="إغلاق شاشة خلوة السحر والتهجد"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Collapsible 7-Day Horizontal Strip (Hidden by default) */}
          {isStreakOpen && (
            <div
              style={{ backgroundColor: cardBg, borderColor }}
              className="rounded-2xl border p-3.5 sm:p-4 space-y-3"
            >
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-bold text-white">سجل مواظبة الأيام السبعة</span>
                <span className="font-bold text-[#10B981] tabular-nums">
                  {toArabicDigits(completedWeekCount)} / ٧ أيام
                </span>
              </div>

              <div className="grid grid-cols-7 gap-1.5">
                {weekDaysStreak.map((day) => (
                  <button
                    key={day.key}
                    type="button"
                    onClick={() => handleToggleStreakDate(day.key)}
                    aria-pressed={day.isCompleted}
                    style={
                      !day.isCompleted
                        ? { backgroundColor: innerBg }
                        : undefined
                    }
                    className={`min-h-[62px] flex flex-col items-center justify-between py-2 px-1 rounded-xl border transition-all cursor-pointer active:scale-95 ${
                      day.isCompleted
                        ? 'bg-[#10B981]/20 border-[#10B981] text-white'
                        : day.isToday
                        ? 'border-[#D4AF37] text-[#F3D06B]'
                        : 'border-[#D4AF37]/25 text-slate-300 hover:border-[#D4AF37]/60'
                    }`}
                  >
                    <span
                      className={`text-[10px] sm:text-xs font-bold whitespace-nowrap ${
                        !day.isCompleted && day.isToday ? 'text-[#F3D06B]' : ''
                      }`}
                    >
                      {day.dayName}
                    </span>
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center border transition-colors ${
                        day.isCompleted
                          ? 'bg-[#10B981] border-[#10B981] text-[#060B09]'
                          : day.isToday
                          ? 'bg-transparent border-[#D4AF37]/60 text-transparent'
                          : 'bg-transparent border-slate-600 text-transparent'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Row 2: 2-Theme Segmented Toggle Pill */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div
              style={{ backgroundColor: cardBg, borderColor }}
              className="inline-flex items-center gap-1 p-1 rounded-xl border"
            >
              <button
                type="button"
                onClick={() => handleSelectTheme('celestial')}
                className={`min-h-[34px] px-3 py-1 rounded-lg text-xs transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTheme === 'celestial'
                    ? 'bg-[#10B981] text-[#060B09] font-extrabold shadow-sm'
                    : 'text-slate-300 font-semibold hover:text-white'
                }`}
              >
                <span aria-hidden="true">🌙</span>
                <span>السماء الساهرة</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectTheme('dimmed')}
                className={`min-h-[34px] px-3 py-1 rounded-lg text-xs transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTheme === 'dimmed'
                    ? 'bg-[#10B981] text-[#060B09] font-extrabold shadow-sm'
                    : 'text-slate-300 font-semibold hover:text-white'
                }`}
              >
                <span aria-hidden="true">✨</span>
                <span>المحراب الخافت</span>
              </button>
            </div>

            <span className="text-xs font-amiri text-[#F3D06B]/90 hidden sm:inline">
              خلوة السحر والتهجد • ساعة النزول الإلهي
            </span>
          </div>

          {/* Row 3: Compact Fajr Countdown Strip */}
          <div
            style={{ backgroundColor: innerBg, borderColor }}
            className="rounded-2xl border px-4 py-2.5 flex items-center justify-between gap-3"
          >
            {/* Right Side */}
            <div className="space-y-0.5 text-right min-w-0">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse shrink-0" />
                <span className="text-xs sm:text-sm font-bold text-white">
                  المتبقي حتى أذان الفجر
                </span>
              </div>
              <div className="text-[11px] sm:text-xs text-slate-400 tabular-nums">
                بداية الثلث: <span className="text-slate-200 font-semibold">{nightInfo.astronomicalLastThirdStr}</span>
                {' • '}
                الفجر: <span className="text-slate-200 font-semibold">{nightInfo.fajrTimeStr}</span>
              </div>
            </div>

            {/* Left Side: Live Countdown */}
            <div
              dir="ltr"
              className="text-lg sm:text-xl font-extrabold text-[#10B981] tabular-nums tracking-wider shrink-0"
            >
              {nightInfo.formattedRemainingToFajr}
            </div>
          </div>

          {/* Row 4: 3-Tab Navigation Bar */}
          <div
            style={{ backgroundColor: cardBg, borderColor }}
            className="grid grid-cols-3 gap-1.5 p-1.5 rounded-2xl border"
          >
            {[
              {
                id: 'rakats' as const,
                icon: '🕌',
                label: 'متابعة القيام والحاسبة',
                shortLabel: 'القيام والحاسبة',
              },
              {
                id: 'tasbih' as const,
                icon: '📿',
                label: 'مسبحة الاستغفار',
                shortLabel: 'الاستغفار',
              },
              {
                id: 'duas' as const,
                icon: '🤲',
                label: 'أدعية السحر والقنوت',
                shortLabel: 'أدعية السحر',
              },
            ].map((tab) => {
              const isSelected = activeSection === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveSection(tab.id)}
                  style={isSelected ? { background: goldGradient } : undefined}
                  className={`min-h-[42px] px-1.5 sm:px-3 py-2 rounded-xl text-[11px] sm:text-sm transition-all whitespace-nowrap flex items-center justify-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'text-[#060B09] font-extrabold shadow-sm'
                      : 'text-slate-300 font-bold hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span aria-hidden="true">{tab.icon}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.shortLabel}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ========================================================= */}
        {/* SCROLLABLE BODY                                           */}
        {/* ========================================================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 relative z-10 scrollbar-none">
          {/* ======================================================= */}
          {/* TAB 1: 🕌 متابعة القيام والحاسبة                        */}
          {/* ======================================================= */}
          {activeSection === 'rakats' && (
            <div className="space-y-5">
              {/* Card 1: 🧮 حاسبة الليل الشرعي */}
              <section
                style={{ backgroundColor: cardBg, borderColor }}
                className="rounded-2xl border p-4 sm:p-5 space-y-4"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <span aria-hidden="true">🧮</span>
                    <span>حاسبة الليل الشرعي</span>
                  </h3>

                  <div className="flex items-center gap-2">
                    {(calcMaghrib !== nightInfo.maghribTimeStr || calcFajr !== nightInfo.fajrTimeStr) && (
                      <button
                        type="button"
                        onClick={() => {
                          setCalcMaghrib(nightInfo.maghribTimeStr || '18:00');
                          setCalcFajr(nightInfo.fajrTimeStr || '05:00');
                        }}
                        className="text-xs font-semibold text-[#F3D06B] hover:underline cursor-pointer"
                      >
                        استعادة
                      </button>
                    )}

                    <span
                      style={{ backgroundColor: innerBg }}
                      className="px-3 py-1 rounded-full border border-[#D4AF37]/35 text-xs font-bold text-[#F3D06B] tabular-nums"
                    >
                      مدة الليل: {toArabicDigits(totalNightHours)} س {toArabicDigits(totalNightRemMins)} د
                    </span>
                  </div>
                </div>

                {/* 2 Time Inputs Side by Side */}
                <div className="grid grid-cols-2 gap-3">
                  <label
                    style={{ backgroundColor: innerBg }}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 rounded-xl border border-[#D4AF37]/25 px-3.5 py-2.5"
                  >
                    <span className="text-xs font-bold text-slate-300">أذان المغرب</span>
                    <input
                      type="time"
                      value={calcMaghrib}
                      onChange={(e) => setCalcMaghrib(e.target.value)}
                      className="bg-transparent text-sm font-bold text-[#F3D06B] tabular-nums focus:outline-none"
                    />
                  </label>

                  <label
                    style={{ backgroundColor: innerBg }}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 rounded-xl border border-[#D4AF37]/25 px-3.5 py-2.5"
                  >
                    <span className="text-xs font-bold text-slate-300">أذان الفجر</span>
                    <input
                      type="time"
                      value={calcFajr}
                      onChange={(e) => setCalcFajr(e.target.value)}
                      className="bg-transparent text-sm font-bold text-[#10B981] tabular-nums focus:outline-none"
                    />
                  </label>
                </div>

                {/* 3 Result Sub-Cards */}
                <div className="grid grid-cols-3 gap-2.5">
                  <div
                    style={{ backgroundColor: innerBg }}
                    className="rounded-xl border border-[#D4AF37]/20 p-3 text-center space-y-1"
                  >
                    <div className="text-[11px] text-slate-400">منتصف الليل</div>
                    <div className="text-sm sm:text-base font-extrabold text-white tabular-nums">
                      {calculatedNight.midnightTimeStr}
                    </div>
                  </div>

                  <div className="rounded-xl bg-[#10B981]/12 border border-[#10B981] p-3 text-center space-y-1">
                    <div className="text-[11px] font-bold text-[#10B981]">بداية الثلث الأخير</div>
                    <div className="text-sm sm:text-base font-extrabold text-[#F3D06B] tabular-nums">
                      {calculatedNight.astronomicalLastThirdStr}
                    </div>
                  </div>

                  <div
                    style={{ backgroundColor: innerBg }}
                    className="rounded-xl border border-[#D4AF37]/20 p-3 text-center space-y-1"
                  >
                    <div className="text-[11px] text-slate-400">مقدار الثلث</div>
                    <div className="text-sm sm:text-base font-extrabold text-white tabular-nums">
                      {toArabicDigits(oneThirdHours)} س {toArabicDigits(oneThirdRemMins)} د
                    </div>
                  </div>
                </div>
              </section>

              {/* Card 2: ❖ متابعة ركعات قيام الليل */}
              <section
                style={{ backgroundColor: cardBg, borderColor }}
                className="rounded-2xl border p-4 sm:p-5 space-y-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                      <span className="text-[#F3D06B]">❖</span>
                      <span>متابعة ركعات قيام الليل</span>
                    </h3>

                    <div className="flex items-center gap-2">
                      {completedStagesCount > 0 && (
                        <button
                          type="button"
                          onClick={handleResetRakats}
                          style={{ backgroundColor: innerBg }}
                          className="min-h-[30px] px-2.5 py-1 rounded-full border border-[#D4AF37]/25 text-[11px] font-bold text-slate-300 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>إعادة</span>
                        </button>
                      )}
                      <span className="px-3 py-1 rounded-full bg-[#10B981]/15 border border-[#10B981]/45 text-[#10B981] text-xs font-bold tabular-nums">
                        {toArabicDigits(completedStagesCount)} من ٥
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    «كانت صلاة النبي ﷺ بالليل إحدى عشرة ركعة يُوتر منها بواحدة»{' '}
                    <span className="font-bold text-[#F3D06B] tabular-nums">
                      ({completedRakatsCount} / {totalRakatsTarget} ركعة)
                    </span>
                  </p>
                </div>

                {/* 5 Interactive Stage Cards */}
                <div className="space-y-2.5">
                  {rakatList.map((item) => (
                    <div
                      key={item.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleToggleRakat(item.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleToggleRakat(item.id);
                        }
                      }}
                      style={!item.isCompleted ? { backgroundColor: innerBg } : undefined}
                      className={`p-3.5 sm:p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                        item.isCompleted
                          ? 'bg-[#10B981]/12 border-[#10B981]/60 text-white'
                          : 'border-[#D4AF37]/25 hover:border-[#D4AF37]/55'
                      }`}
                    >
                      <div className="space-y-1 text-right flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm sm:text-base text-white">
                            {item.name}
                          </span>
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#F3D06B] tabular-nums">
                            {item.rakat} ركعات
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">{item.desc}</p>
                      </div>

                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                          item.isCompleted
                            ? 'bg-[#10B981] border-[#10B981] text-[#060B09]'
                            : 'bg-transparent border-slate-500 text-transparent'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Automatic Post-Witr Qunut & Tasbih Card */}
                {isWitrCompleted && (
                  <div
                    style={{ backgroundColor: innerBg }}
                    className="p-4 sm:p-5 rounded-xl border border-[#D4AF37]/45 space-y-3.5"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap border-b border-[#D4AF37]/20 pb-2.5">
                      <span className="font-bold text-sm sm:text-base font-amiri text-[#F3D06B]">
                        أذكار ما بعد الوتر ودعاء القنوت
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyQunut}
                        style={{ backgroundColor: cardBg }}
                        className="px-3 py-1.5 rounded-lg border border-[#D4AF37]/30 text-xs font-bold text-slate-200 hover:text-white flex items-center gap-1.5 cursor-pointer"
                      >
                        {copiedQunut ? (
                          <>
                            <CheckCheck className="w-3.5 h-3.5 text-[#10B981]" />
                            <span className="text-[#10B981]">تم النسخ</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>نسخ القنوت</span>
                          </>
                        )}
                      </button>
                    </div>

                    <p className="font-amiri text-base leading-loose text-amber-50">
                      «{POST_WITR_ADHKAR.qunutText}»
                    </p>

                    <div
                      style={{ backgroundColor: cardBg }}
                      className="p-3.5 rounded-xl border border-[#D4AF37]/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-0.5 text-right">
                        <div className="font-amiri text-base font-bold text-white">
                          «{POST_WITR_ADHKAR.tasbihTitle}»
                        </div>
                        <p className="text-xs text-slate-300">{POST_WITR_ADHKAR.tasbihSubtitle}</p>
                      </div>

                      <button
                        type="button"
                        onClick={handleTapWitrTasbih}
                        style={
                          witrTasbihCount >= POST_WITR_ADHKAR.tasbihTarget
                            ? undefined
                            : { background: goldGradient }
                        }
                        className={`min-h-[40px] px-4 py-2 rounded-xl font-extrabold text-sm tabular-nums flex items-center justify-center gap-1.5 cursor-pointer transition-all shrink-0 ${
                          witrTasbihCount >= POST_WITR_ADHKAR.tasbihTarget
                            ? 'bg-[#10B981] text-[#060B09]'
                            : 'text-[#060B09]'
                        }`}
                      >
                        <span>{toArabicDigits(witrTasbihCount)} / ٣</span>
                        {witrTasbihCount >= POST_WITR_ADHKAR.tasbihTarget && (
                          <Check className="w-4 h-4 stroke-[3]" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </section>

              {/* Card 2.5: 🎧 تلاوة آيات القيام والتهجد (القطامي والعفاسي) */}
              <section
                style={{ backgroundColor: cardBg, borderColor }}
                className="rounded-2xl border p-4 sm:p-5 space-y-3.5"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-[#10B981]" />
                    <span>تلاوة آيات القيام والتهجد</span>
                  </h3>
                  <span className="text-xs font-bold text-[#F3D06B]">
                    {QIYAM_RECITERS[qiyamReciterId].nameAr}
                  </span>
                </div>

                <div
                  style={{ backgroundColor: innerBg }}
                  className="rounded-xl border border-[#D4AF37]/25 p-3.5 space-y-2"
                >
                  <p className="font-amiri text-base sm:text-lg leading-loose text-[#F3D06B]">
                    {activeSanctuaryVerse.verse}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-300">
                    <span className="font-bold text-[#10B981]">{activeSanctuaryVerse.surah}</span>
                    <span aria-hidden="true">·</span>
                    <span>{activeSanctuaryVerse.reflection}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (qiyamStatus === 'playing') {
                        adhanPlayer.pauseQiyamRecitation();
                      } else if (qiyamStatus === 'paused') {
                        void adhanPlayer.resumeQiyamRecitation().then((r) => {
                          if (r !== 'playing') {
                            void handlePlaySanctuaryQiyamVerse(qiyamVerseIdx, qiyamReciterId);
                          }
                        });
                      } else {
                        void handlePlaySanctuaryQiyamVerse(qiyamVerseIdx, qiyamReciterId);
                      }
                    }}
                    className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                      qiyamStatus === 'playing'
                        ? 'bg-[#10B981] text-[#060B09]'
                        : 'bg-[#0D2C24] border border-[#D4AF37]/50 text-[#F3D06B] hover:border-[#F3D06B]'
                    }`}
                  >
                    {qiyamStatus === 'playing' ? (
                      <>
                        <Pause className="w-4 h-4 shrink-0" />
                        <span>إيقاف التلاوة</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-current shrink-0" />
                        <span>{qiyamStatus === 'loading' ? 'جاري التشغيل...' : 'استماع للآية'}</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const nextReciter: QiyamReciterId =
                        qiyamReciterId === 'qatami' ? 'alafasy' : 'qatami';
                      void handlePlaySanctuaryQiyamVerse(qiyamVerseIdx, nextReciter);
                    }}
                    style={{ backgroundColor: innerBg }}
                    className="min-h-[42px] px-3.5 py-2 rounded-xl border border-[#D4AF37]/30 hover:border-[#F3D06B] text-[#F3D06B] text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {qiyamReciterId === 'qatami' ? 'التبديل للعفاسي' : 'التبديل للقطامي'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const nextIdx = (qiyamVerseIdx + 1) % QIYAM_NIGHT_VERSES.length;
                      void handlePlaySanctuaryQiyamVerse(nextIdx, qiyamReciterId);
                    }}
                    style={{ backgroundColor: innerBg }}
                    className="min-h-[42px] px-3.5 py-2 rounded-xl border border-[#D4AF37]/30 hover:border-[#F3D06B] text-slate-200 hover:text-[#F3D06B] text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      الآية التالية ({toArabicDigits(qiyamVerseIdx + 1)}/{toArabicDigits(QIYAM_NIGHT_VERSES.length)})
                    </span>
                  </button>
                </div>
              </section>

              {/* Card 3: 📖 المصحف المصغّر للقيام */}
              <section
                style={{ backgroundColor: cardBg, borderColor }}
                className="rounded-2xl border p-4 sm:p-5 space-y-4"
              >
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="space-y-0.5">
                    <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                      <span aria-hidden="true">📖</span>
                      <span>المصحف المصغّر للقيام</span>
                    </h3>
                    <p className="text-xs text-slate-300">{currentMushafSurah.virtue}</p>
                  </div>

                  {/* Font size controls (أ+ / أ-) */}
                  <div
                    style={{ backgroundColor: innerBg }}
                    className="flex items-center gap-1 p-1 rounded-xl border border-[#D4AF37]/25 shrink-0"
                  >
                    <button
                      type="button"
                      onClick={() => setMushafFontSize((s) => Math.max(18, s - 2))}
                      style={{ backgroundColor: cardBg }}
                      className="min-w-[36px] min-h-[34px] px-2.5 rounded-lg text-xs font-bold text-slate-200 hover:text-[#F3D06B] transition-colors cursor-pointer"
                      title="تصغير الخط"
                    >
                      أ-
                    </button>
                    <span className="px-2 text-xs font-bold tabular-nums text-[#F3D06B]">
                      {toArabicDigits(mushafFontSize)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setMushafFontSize((s) => Math.min(36, s + 2))}
                      style={{ backgroundColor: cardBg }}
                      className="min-w-[36px] min-h-[34px] px-2.5 rounded-lg text-xs font-bold text-slate-200 hover:text-[#F3D06B] transition-colors cursor-pointer"
                      title="تكبير الخط"
                    >
                      أ+
                    </button>
                  </div>
                </div>

                {/* Surah Dropdown Selector */}
                <div className="relative">
                  <select
                    value={selectedSurahId}
                    onChange={(e) => setSelectedSurahId(e.target.value as QiyamMushafSurah['id'])}
                    style={{ backgroundColor: innerBg }}
                    aria-label="اختر السورة للقراءة في القيام"
                    className="w-full appearance-none rounded-xl border border-[#D4AF37]/35 px-4 py-3 pl-10 text-sm font-bold text-[#F3D06B] focus:outline-none focus:border-[#F3D06B] cursor-pointer"
                  >
                    {orderedMushafSurahs.map((surah) => (
                      <option key={surah.id} value={surah.id} className="bg-[#08100E] text-white">
                        {surah.title}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#F3D06B]" />
                </div>

                {/* Verses Reading Area */}
                <div
                  style={{ backgroundColor: innerBg }}
                  className="rounded-xl border border-[#D4AF37]/25 p-4 sm:p-6 max-h-[340px] overflow-y-auto space-y-4"
                >
                  <div className="text-center font-amiri text-xl text-[#F3D06B] pb-2 border-b border-[#D4AF37]/15">
                    بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                  </div>

                  <div
                    className="font-amiri text-right text-amber-50/95 leading-[2.3]"
                    style={{ fontSize: `${mushafFontSize}px` }}
                  >
                    {currentMushafSurah.ayahs.map((ayah, idx) => {
                      const subSurahHeading = getMuawwidhatSectionLabel(idx, ayah.numberInSurah);
                      return (
                        <React.Fragment key={`${currentMushafSurah.id}-${idx}-${ayah.numberInSurah}`}>
                          {subSurahHeading && (
                            <div className="text-center text-sm font-sans font-bold text-[#10B981] my-3 py-1 border-y border-[#D4AF37]/20">
                              {subSurahHeading}
                            </div>
                          )}
                          <span>{ayah.text}</span>{' '}
                          <span className="inline-flex items-center gap-1 text-[#F3D06B] mx-1 text-[0.8em] select-none">
                            {ayah.sajda && (
                              <span className="text-[11px] font-sans font-bold text-[#10B981] mx-0.5">
                                ۩ سجدة
                              </span>
                            )}
                            <span>﴿{toArabicDigits(ayah.numberInSurah)}﴾</span>
                          </span>{' '}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              </section>

              {/* Card 4: ⏰ تخصيص الدخول التلقائي ومنبّهات السحر */}
              <section
                style={{ backgroundColor: cardBg, borderColor }}
                className="rounded-2xl border p-4 sm:p-5 space-y-4"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <span aria-hidden="true">⏰</span>
                    <span>تخصيص الدخول التلقائي ومنبّهات السحر</span>
                  </h3>

                  <button
                    type="button"
                    onClick={() => adhanPlayer.playGentleFadeInAlarm()}
                    style={{ backgroundColor: innerBg }}
                    className="min-h-[34px] px-3 py-1.5 rounded-xl border border-[#D4AF37]/30 text-[#F3D06B] text-xs font-bold flex items-center gap-1.5 hover:border-[#F3D06B] transition-colors cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>تجربة المنبّه</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {/* Toggle 1: Auto Entry */}
                  <div
                    style={{ backgroundColor: innerBg }}
                    className="flex items-center justify-between gap-4 p-3.5 rounded-xl border border-[#D4AF37]/20"
                  >
                    <div className="space-y-0.5 text-right">
                      <div className="text-sm font-bold text-white">
                        الدخول التلقائي لوضع الخلوة
                      </div>
                      <p className="text-xs text-slate-400">
                        تفتح شاشة السحر تلقائياً مع دخول وقت الثلث الأخير من الليل
                      </p>
                    </div>
                    <ToggleSwitch
                      checked={autoOpenEnabled}
                      inactiveBg={cardBg}
                      onChange={(checked) =>
                        onUpdateSettings?.({
                          lastThirdAutoOpen: checked,
                          lastThirdNightEnabled: true,
                        })
                      }
                      label="الدخول التلقائي لوضع الخلوة"
                    />
                  </div>

                  {/* Toggle 2: Witr Alarm (30 mins before Fajr) */}
                  <div
                    style={{ backgroundColor: innerBg }}
                    className="flex items-center justify-between gap-4 p-3.5 rounded-xl border border-[#D4AF37]/20"
                  >
                    <div className="space-y-0.5 text-right">
                      <div className="text-sm font-bold text-white flex items-center gap-1.5">
                        <BellRing className="w-3.5 h-3.5 text-[#F3D06B]" />
                        <span>منبّه صلاة الوتر</span>
                      </div>
                      <p className="text-xs text-slate-400">
                        تذكير هادئ بأداء الوتر قبل أذان الفجر بـ ٣٠ دقيقة
                      </p>
                    </div>
                    <ToggleSwitch
                      checked={witrEnabled}
                      inactiveBg={cardBg}
                      onChange={(checked) =>
                        onUpdateSettings?.({
                          witrReminderEnabled: checked,
                          witrReminderMinutes: 30,
                        })
                      }
                      label="منبّه صلاة الوتر"
                    />
                  </div>

                  {/* Toggle 3: Suhoor & Istighfar Alarm (45 mins before Fajr) */}
                  <div
                    style={{ backgroundColor: innerBg }}
                    className="flex items-center justify-between gap-4 p-3.5 rounded-xl border border-[#D4AF37]/20"
                  >
                    <div className="space-y-0.5 text-right">
                      <div className="text-sm font-bold text-white">
                        منبّه السحور والاستغفار
                      </div>
                      <p className="text-xs text-slate-400">
                        تنبيه للسحور والاستغفار بالأسحار قبل أذان الفجر بـ ٤٥ دقيقة
                      </p>
                    </div>
                    <ToggleSwitch
                      checked={suhoorEnabled}
                      inactiveBg={cardBg}
                      onChange={(checked) =>
                        onUpdateSettings?.({
                          suhoorReminderEnabled: checked,
                          suhoorReminderMinutes: 45,
                        })
                      }
                      label="منبّه السحور والاستغفار"
                    />
                  </div>
                </div>

                {onNavigateToAdhkar && (
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onNavigateToAdhkar();
                      }}
                      className="text-xs font-bold text-[#10B981] hover:underline cursor-pointer"
                    >
                      الانتقال إلى قسم الأذكار ←
                    </button>
                  </div>
                )}
              </section>
            </div>
          )}

          {/* ======================================================= */}
          {/* TAB 2: 📿 مسبحة الاستغفار                                */}
          {/* ======================================================= */}
          {activeSection === 'tasbih' && (
            <div
              style={{ backgroundColor: cardBg, borderColor }}
              className="rounded-2xl border p-4 sm:p-6 space-y-5"
            >
              {/* Header + Target Badge */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <span aria-hidden="true">📿</span>
                  <span>اختر صيغة الاستغفار</span>
                </h3>
                <span className="px-3 py-1 rounded-full bg-[#10B981]/15 border border-[#10B981]/45 text-[#10B981] text-xs font-bold tabular-nums">
                  الهدف: {toArabicDigits(istighfarTarget)} مرة
                </span>
              </div>

              {/* 2-Column Grid of 6 Authentic Formulas */}
              <div className="grid grid-cols-2 gap-2.5">
                {ISTIGHFAR_FORMULAS.map((formula, idx) => {
                  const isSelected = selectedFormulaIndex === idx;
                  return (
                    <button
                      key={formula.id}
                      type="button"
                      onClick={() => {
                        setSelectedFormulaIndex(idx);
                        setIstighfarCount(0);
                      }}
                      style={!isSelected ? { backgroundColor: innerBg } : undefined}
                      className={`min-h-[48px] px-3 py-2.5 rounded-xl border text-right transition-all flex items-center justify-between gap-2 cursor-pointer ${
                        isSelected
                          ? 'bg-[#10B981]/15 border-[#10B981] text-white font-bold shadow-sm'
                          : 'border-[#D4AF37]/25 text-slate-300 hover:border-[#D4AF37]/55 hover:text-white'
                      }`}
                    >
                      <span className="text-xs sm:text-sm font-bold">{formula.title}</span>
                      {isSelected && <Check className="w-4 h-4 text-[#10B981] shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Gold-bordered Selected Formula Box */}
              <div
                style={{ backgroundColor: innerBg }}
                className="rounded-2xl border border-[#D4AF37]/45 p-4 sm:p-5 text-center space-y-2.5"
              >
                <p className="text-xl sm:text-2xl font-bold font-amiri text-[#F3D06B] leading-loose">
                  «{currentFormula.text}»
                </p>
                <p className="text-xs text-slate-300 leading-relaxed">{currentFormula.source}</p>
              </div>

              {/* Centered Interactive Tasbih Circle */}
              <div className="flex flex-col items-center justify-center py-2 space-y-5">
                <button
                  type="button"
                  onClick={handleIncrementIstighfar}
                  style={{ backgroundColor: innerBg }}
                  className="w-40 h-40 rounded-full border-4 border-[#D4AF37] shadow-[0_0_30px_rgba(212,175,55,0.2)] flex flex-col items-center justify-center gap-1 transition-transform duration-150 active:scale-95 cursor-pointer hover:border-[#F3D06B]"
                >
                  <span className="text-[11px] font-bold text-slate-300">اضغط للاستغفار</span>
                  <span className="text-5xl font-extrabold tabular-nums text-white leading-none">
                    {istighfarCount}
                  </span>
                  <span className="text-xs font-bold tabular-nums text-[#10B981]">
                    {istighfarPercent}% من الهدف
                  </span>
                </button>

                {/* Quick Target Buttons (٣٣, ١٠٠, ١٠٠٠) + Calm Red Reset */}
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <div
                    style={{ backgroundColor: innerBg }}
                    className="flex items-center gap-1.5 p-1 rounded-xl border border-[#D4AF37]/25"
                  >
                    {([
                      { val: 33 as const, label: '٣٣' },
                      { val: 100 as const, label: '١٠٠' },
                      { val: 1000 as const, label: '١٠٠٠' },
                    ]).map((t) => (
                      <button
                        key={t.val}
                        type="button"
                        onClick={() => setIstighfarTarget(t.val)}
                        style={istighfarTarget === t.val ? { background: goldGradient } : undefined}
                        className={`min-h-[36px] px-3.5 py-1 rounded-lg text-xs transition-all cursor-pointer ${
                          istighfarTarget === t.val
                            ? 'text-[#060B09] font-extrabold'
                            : 'text-slate-300 font-bold hover:text-white'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleResetIstighfar}
                    className="min-h-[38px] px-4 py-1.5 rounded-xl bg-red-500/10 border border-red-400/35 text-xs font-bold text-red-300 hover:bg-red-500/20 hover:text-red-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>تصفير</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* TAB 3: 🤲 أدعية السحر والقنوت                             */}
          {/* ======================================================= */}
          {activeSection === 'duas' && (
            <div className="space-y-4">
              {/* Section Header */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <span aria-hidden="true">🤲</span>
                  <span>أدعية السحر وقيام الليل والقنوت</span>
                </h3>
                <span className="px-3 py-1 rounded-full bg-[#10B981]/15 border border-[#10B981]/45 text-[#10B981] text-xs font-bold">
                  مأثورات صحيحة
                </span>
              </div>

              {/* 4 Authentic Prayer Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {SAHAR_DUAS.map((dua) => {
                  const isCopied = copiedDuaId === dua.id;
                  return (
                    <div
                      key={dua.id}
                      style={{ backgroundColor: cardBg, borderColor }}
                      className="p-5 rounded-2xl border flex flex-col justify-between gap-4 transition-all hover:border-[#F3D06B]/60"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2 border-b border-[#D4AF37]/15 pb-3">
                          <div className="space-y-1.5 text-right">
                            <h4 className="font-bold text-base text-[#F3D06B]">{dua.title}</h4>
                            {dua.badge && (
                              <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#10B981]/15 border border-[#10B981]/40 text-[#10B981] text-[11px] font-bold">
                                {dua.badge}
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleCopyDua(dua)}
                            style={{ backgroundColor: innerBg }}
                            className="min-h-[34px] flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#D4AF37]/25 text-xs font-semibold text-slate-300 hover:text-white shrink-0 cursor-pointer transition-colors"
                            title="نسخ الدعاء"
                          >
                            {isCopied ? (
                              <>
                                <CheckCheck className="w-3.5 h-3.5 text-[#10B981]" />
                                <span className="text-[#10B981]">تم النسخ</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>نسخ</span>
                              </>
                            )}
                          </button>
                        </div>

                        <p className="text-lg font-amiri leading-[2] text-white text-right">
                          «{dua.text}»
                        </p>
                      </div>

                      <div className="pt-3 border-t border-[#D4AF37]/15 text-xs space-y-1">
                        <div className="text-slate-400">المصدر: {dua.source}</div>
                        {dua.benefit && (
                          <div className="text-[#10B981] font-medium">{dua.benefit}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* FOOTER                                                    */}
        {/* ========================================================= */}
        <div
          style={{ backgroundColor: innerBg, borderColor: 'rgba(212, 175, 55, 0.25)' }}
          className="relative shrink-0 z-20 px-4 sm:px-6 py-3 border-t flex flex-col items-center justify-center gap-1 text-center"
        >
          <span className="font-amiri text-sm sm:text-base text-[#F3D06B]">
            ﴿تَتَجَافَىٰ جُنُوبُهُمْ عَنِ الْمَضَاجِعِ يَدْعُونَ رَبَّهُمْ خَوْفًا وَطَمَعًا﴾
          </span>
          <span className="text-xs sm:text-sm font-bold text-[#10B981] tabular-nums" dir="ltr">
            {nightInfo.astronomicalLastThirdStr} ← {nightInfo.fajrTimeStr}
          </span>
        </div>
      </div>
    </div>
  );
};
