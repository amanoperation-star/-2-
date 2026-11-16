import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  RotateCcw,
  CheckCircle2,
  Volume2,
  VolumeX,
  Sparkles,
  Check,
  ChevronLeft,
  Award,
} from 'lucide-react';
import {
  JumuahSalawatProgress,
  getTodayKey,
  loadJumuahSalawatProgress,
  saveJumuahSalawatProgress,
} from '../utils/jumuahData';

interface PostPrayerStage {
  id: string;
  shortTitle: string;
  text: string;
  targetCount: number;
  virtue: string;
  isAyatAlKursi?: boolean;
}

const POST_PRAYER_STAGES: PostPrayerStage[] = [
  {
    id: 'istighfar',
    shortTitle: 'أستغفر الله',
    text: 'أَسْتَغْفِرُ اللَّهَ',
    targetCount: 3,
    virtue: 'كان رسول الله ﷺ إذا انصرف من صلاته استغفر ثلاثاً.',
  },
  {
    id: 'salam',
    shortTitle: 'اللهم أنت السلام',
    text: 'اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ، تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ',
    targetCount: 1,
    virtue: 'يُقال مباشرة بعد الاستغفار عقب التسليم من الصلاة.',
  },
  {
    id: 'subhanallah',
    shortTitle: 'التسبيح (٣٣)',
    text: 'سُبْحَانَ اللَّهِ',
    targetCount: 33,
    virtue: 'الجزء الأول من مُعقّبات الصلاة المسنونة (صحيح مسلم).',
  },
  {
    id: 'alhamdulillah',
    shortTitle: 'التحميد (٣٣)',
    text: 'الْحَمْدُ لِلَّهِ',
    targetCount: 33,
    virtue: 'الجزء الثاني من مُعقّبات الصلاة المسنونة (صحيح مسلم).',
  },
  {
    id: 'allahuakbar',
    shortTitle: 'التكبير (٣٣)',
    text: 'اللَّهُ أَكْبَرُ',
    targetCount: 33,
    virtue: 'الجزء الثالث من مُعقّبات الصلاة المسنونة (صحيح مسلم).',
  },
  {
    id: 'tahlil_100',
    shortTitle: 'ختام المائة',
    text: 'لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ',
    targetCount: 1,
    virtue: '«غُفرت خطاياه وإن كانت مثل زبد البحر» — صحيح مسلم.',
  },
  {
    id: 'ayat_kursi',
    shortTitle: 'آية الكرسي',
    text: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَنْ ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ',
    targetCount: 1,
    virtue: 'من قرأها دبر كل صلاة مكتوبة لم يمنعه من دخول الجنة إلا أن يموت.',
    isAyatAlKursi: true,
  },
];

type TasbihMode = 'eastern' | 'ring';
type TasbihPurpose = 'post_prayer' | 'jumuah_salawat';
type BeadMaterial = 'emerald' | 'amber' | 'oud';
type RingColorway = 'titanium' | 'neon_emerald' | 'modern_gold';

const SALAWAT_FORMULAS: Record<
  'short' | 'ibrahimi',
  { label: string; text: string; virtue: string }
> = {
  short: {
    label: 'الصيغة المباركة',
    text: 'اللَّهُمَّ صَلِّ وَسَلِّمْ وَبَارِكْ عَلَى نَبِيِّنَا مُحَمَّدٍ',
    virtue: '«أكثروا عليّ من الصلاة يوم الجمعة وليلة الجمعة، فمن صلّى عليّ صلاةً صلّى الله عليه عشراً»',
  },
  ibrahimi: {
    label: 'الصلاة الإبراهيمية',
    text: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ كَمَا صَلَّيْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ إِنَّكَ حَمِيدٌ مَجِيدٌ، اللَّهُمَّ بَارِكْ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ كَمَا بَارَكْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ إِنَّكَ حَمِيدٌ مَجِيدٌ',
    virtue: 'أكمل صيغ الصلاة على النبي ﷺ التي علّمها لأصحابه رضوان الله عليهم.',
  },
};

interface PostPrayerTasbihModalProps {
  isOpen: boolean;
  onClose: () => void;
  prayerNameAr: string;
  isSimulated?: boolean;
  isJumuahMode?: boolean;
  initialPurpose?: TasbihPurpose;
  onSalawatProgressChange?: (count: number, target: 100 | 1000) => void;
}

const BEAD_STYLES: Record<
  BeadMaterial,
  {
    label: string;
    gradient: string;
    rim: string;
    cordColor: string;
    tasselColor: string;
    highlight: string;
  }
> = {
  emerald: {
    label: 'زمرد ملكي',
    gradient: 'radial-gradient(circle at 32% 28%, #6ee7b7 0%, #059669 38%, #064e3b 78%, #022c22 100%)',
    rim: 'border-emerald-300/50',
    cordColor: '#e5b869',
    tasselColor: '#10b981',
    highlight: 'rgba(110, 231, 183, 0.55)',
  },
  amber: {
    label: 'عنبر كهرماني',
    gradient: 'radial-gradient(circle at 32% 28%, #fef08a 0%, #f59e0b 40%, #b45309 78%, #451a03 100%)',
    rim: 'border-amber-200/60',
    cordColor: '#fbbf24',
    tasselColor: '#d97706',
    highlight: 'rgba(253, 224, 71, 0.6)',
  },
  oud: {
    label: 'عود عتيق',
    gradient: 'radial-gradient(circle at 32% 28%, #d6a472 0%, #78350f 42%, #451a03 80%, #1c0a00 100%)',
    rim: 'border-amber-600/55',
    cordColor: '#d6a472',
    tasselColor: '#92400e',
    highlight: 'rgba(214, 164, 114, 0.45)',
  },
};

const RING_STYLES: Record<
  RingColorway,
  {
    label: string;
    chassis: string;
    innerBezel: string;
    oledText: string;
    strokeColor: string;
    buttonBg: string;
    glow: string;
  }
> = {
  titanium: {
    label: 'تيتانيوم داكن',
    chassis: 'linear-gradient(145deg, #475569 0%, #1e293b 45%, #0f172a 100%)',
    innerBezel: 'border-slate-400/40',
    oledText: 'text-sky-300',
    strokeColor: '#38bdf8',
    buttonBg: 'radial-gradient(circle at 35% 30%, #334155 0%, #0f172a 100%)',
    glow: 'shadow-[0_20px_50px_rgba(56,189,248,0.18)]',
  },
  neon_emerald: {
    label: 'زمردي نيون',
    chassis: 'linear-gradient(145deg, #0f766e 0%, #064e3b 45%, #022c22 100%)',
    innerBezel: 'border-emerald-400/50',
    oledText: 'text-emerald-300',
    strokeColor: '#34d399',
    buttonBg: 'radial-gradient(circle at 35% 30%, #065f46 0%, #021d15 100%)',
    glow: 'shadow-[0_20px_50px_rgba(52,211,153,0.24)]',
  },
  modern_gold: {
    label: 'ذهبي عصري',
    chassis: 'linear-gradient(145deg, #fde68a 0%, #d97706 48%, #78350f 100%)',
    innerBezel: 'border-amber-200/60',
    oledText: 'text-[#fbbf24]',
    strokeColor: '#fbbf24',
    buttonBg: 'radial-gradient(circle at 35% 30%, #451a03 0%, #1a0b02 100%)',
    glow: 'shadow-[0_20px_50px_rgba(251,191,36,0.26)]',
  },
};

export const PostPrayerTasbihModal: React.FC<PostPrayerTasbihModalProps> = ({
  isOpen,
  onClose,
  prayerNameAr,
  isSimulated = false,
  isJumuahMode = false,
  initialPurpose = 'post_prayer',
  onSalawatProgressChange,
}) => {
  const [purpose, setPurpose] = useState<TasbihPurpose>(initialPurpose);
  const [salawatState, setSalawatState] = useState<JumuahSalawatProgress>(() =>
    loadJumuahSalawatProgress()
  );
  const [stageIndex, setStageIndex] = useState<number>(0);
  const [stepCount, setStepCount] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isCompletedAll, setIsCompletedAll] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const onSalawatProgressChangeRef = useRef(onSalawatProgressChange);
  onSalawatProgressChangeRef.current = onSalawatProgressChange;

  useEffect(() => {
    if (isOpen) {
      setPurpose(initialPurpose);
    }
  }, [isOpen, initialPurpose]);

  useEffect(() => {
    saveJumuahSalawatProgress(salawatState);
    onSalawatProgressChangeRef.current?.(salawatState.count, salawatState.target);
  }, [salawatState]);

  const [tasbihMode, setTasbihMode] = useState<TasbihMode>(() => {
    if (typeof window === 'undefined') return 'eastern';
    return (localStorage.getItem('tasbih_style_preference') as TasbihMode) === 'ring'
      ? 'ring'
      : 'eastern';
  });

  const [beadMaterial, setBeadMaterial] = useState<BeadMaterial>(() => {
    if (typeof window === 'undefined') return 'emerald';
    const saved = localStorage.getItem('tasbih_bead_material');
    return saved === 'amber' || saved === 'oud' || saved === 'emerald' ? saved : 'emerald';
  });

  const [ringColorway, setRingColorway] = useState<RingColorway>(() => {
    if (typeof window === 'undefined') return 'neon_emerald';
    const saved = localStorage.getItem('tasbih_ring_colorway');
    return saved === 'titanium' || saved === 'modern_gold' || saved === 'neon_emerald'
      ? saved
      : 'neon_emerald';
  });

  // Eastern Misbaha pull-down drag physics
  const [dragOffsetY, setDragOffsetY] = useState<number>(0);
  const [beadPulseId, setBeadPulseId] = useState<number>(0);
  const dragStartYRef = useRef<number | null>(null);
  const triggeredDuringDragRef = useRef<boolean>(false);

  const audioCtxRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback((): AudioContext | null => {
    if (typeof window === 'undefined') return null;
    try {
      if (!audioCtxRef.current) {
        const Ctx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (Ctx) {
          audioCtxRef.current = new Ctx();
        }
      }
      if (audioCtxRef.current?.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      return audioCtxRef.current;
    } catch {
      return null;
    }
  }, []);

  // Synthesize realistic gemstone/bead clack sound via Web Audio API
  const playGemstoneBeadSound = useCallback(() => {
    if (!soundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;

      // Primary stone impact overtone
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(1680, now);
      osc1.frequency.exponentialRampToValueAtTime(980, now + 0.045);
      gain1.gain.setValueAtTime(0.24, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.055);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.06);

      // Secondary crystalline resonance
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(2850, now);
      osc2.frequency.exponentialRampToValueAtTime(2100, now + 0.035);
      gain2.gain.setValueAtTime(0.14, now);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now);
      osc2.stop(now + 0.045);
    } catch {
      // Audio unavailable
    }
  }, [soundEnabled, getAudioContext]);

  // Synthesize crisp tactile micro-switch mechanical click for the electronic ring
  const playMechanicalClickSound = useCallback(() => {
    if (!soundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(920, now);
      osc.frequency.exponentialRampToValueAtTime(240, now + 0.022);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.026);

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2200, now);
      filter.Q.setValueAtTime(1.8, now);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.03);
    } catch {
      // Audio unavailable
    }
  }, [soundEnabled, getAudioContext]);

  const playCompletionChime = useCallback(() => {
    if (!soundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.09);
        gain.gain.setValueAtTime(0.001, now + idx * 0.09);
        gain.gain.linearRampToValueAtTime(0.14, now + idx * 0.09 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.55);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.09);
        osc.stop(now + idx * 0.09 + 0.6);
      });
    } catch {
      // Audio unavailable
    }
  }, [soundEnabled, getAudioContext]);

  const handleSwitchMode = (mode: TasbihMode) => {
    setTasbihMode(mode);
    try {
      localStorage.setItem('tasbih_style_preference', mode);
    } catch {
      // ignore
    }
  };

  const handleSelectBeadMaterial = (mat: BeadMaterial) => {
    setBeadMaterial(mat);
    try {
      localStorage.setItem('tasbih_bead_material', mat);
    } catch {
      // ignore
    }
  };

  const handleSelectRingColorway = (cw: RingColorway) => {
    setRingColorway(cw);
    try {
      localStorage.setItem('tasbih_ring_colorway', cw);
    } catch {
      // ignore
    }
  };

  const handleAdvanceTasbih = useCallback(
    (sourceMode?: TasbihMode) => {
      if (purpose === 'jumuah_salawat') {
        const activeSoundMode = sourceMode || tasbihMode;
        if (activeSoundMode === 'eastern') {
          playGemstoneBeadSound();
        } else {
          playMechanicalClickSound();
        }
        setBeadPulseId((p) => p + 1);

        setSalawatState((prev) => {
          const nextCount = prev.count + 1;
          if (nextCount === prev.target) {
            playCompletionChime();
          }
          return {
            ...prev,
            dateKey: getTodayKey(),
            count: nextCount,
          };
        });
        return;
      }

      if (isCompletedAll) return;

      const activeSoundMode = sourceMode || tasbihMode;
      if (activeSoundMode === 'eastern') {
        playGemstoneBeadSound();
      } else {
        playMechanicalClickSound();
      }
      setBeadPulseId((p) => p + 1);

      const currentStage = POST_PRAYER_STAGES[stageIndex];
      const nextStep = stepCount + 1;
      setTotalCount((prev) => prev + 1);

      if (nextStep >= currentStage.targetCount) {
        if (stageIndex >= POST_PRAYER_STAGES.length - 1) {
          setStepCount(currentStage.targetCount);
          setIsCompletedAll(true);
          playCompletionChime();
        } else {
          setStageIndex((prev) => prev + 1);
          setStepCount(0);
          playCompletionChime();
        }
      } else {
        setStepCount(nextStep);
      }
    },
    [
      purpose,
      isCompletedAll,
      tasbihMode,
      stageIndex,
      stepCount,
      playGemstoneBeadSound,
      playMechanicalClickSound,
      playCompletionChime,
    ]
  );

  const handleResetCurrentStep = () => {
    playMechanicalClickSound();
    if (purpose === 'jumuah_salawat') {
      setSalawatState((prev) => ({
        ...prev,
        dateKey: getTodayKey(),
        count: 0,
      }));
    } else {
      setStepCount(0);
    }
  };

  const handleRestartSequence = () => {
    setStageIndex(0);
    setStepCount(0);
    setTotalCount(0);
    setIsCompletedAll(false);
  };

  // Drag handlers for Eastern Misbaha
  const handleBeadPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragStartYRef.current = e.clientY;
    triggeredDuringDragRef.current = false;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleBeadPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartYRef.current === null) return;
    const deltaY = Math.max(0, Math.min(44, e.clientY - dragStartYRef.current));
    setDragOffsetY(deltaY);
    if (deltaY >= 24 && !triggeredDuringDragRef.current) {
      triggeredDuringDragRef.current = true;
      handleAdvanceTasbih('eastern');
    }
  };

  const handleBeadPointerUp = () => {
    if (dragStartYRef.current !== null && !triggeredDuringDragRef.current) {
      // Regular click/tap without long drag
      handleAdvanceTasbih('eastern');
    }
    dragStartYRef.current = null;
    triggeredDuringDragRef.current = false;
    setDragOffsetY(0);
  };

  // Keyboard Space/Enter shortcut while modal open
  useEffect(() => {
    if (!isOpen || isCompletedAll) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, isCompletedAll, onClose]);

  if (!isOpen) return null;

  const currentStage = POST_PRAYER_STAGES[stageIndex];
  const isSalawatPurpose = purpose === 'jumuah_salawat';
  const activeStepDisplay = isSalawatPurpose ? salawatState.count : stepCount;
  const activeTargetDisplay = isSalawatPurpose ? salawatState.target : currentStage.targetCount;
  const stagePercent = Math.min(
    100,
    Math.round((activeStepDisplay / activeTargetDisplay) * 100)
  );
  const ringRadius = 74;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringStrokeDashoffset =
    ringCircumference - (stagePercent / 100) * ringCircumference;

  const activeBeadStyle = BEAD_STYLES[beadMaterial];
  const activeRingStyle = RING_STYLES[ringColorway];
  const activeSalawatFormula = SALAWAT_FORMULAS[salawatState.formula];
  const isSalawatGoalReached = salawatState.count >= salawatState.target;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/88 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#041b16]/98 border-2 border-[#e5b869]/55 rounded-3xl shadow-[0_0_70px_rgba(229,184,105,0.25)] overflow-hidden my-auto text-right font-sans">
        {/* Inner Double Gold Hairline Frame */}
        <div className="absolute inset-1.5 rounded-[20px] border border-[#e5b869]/20 pointer-events-none z-20" />

        {/* Subtle Geometric Pattern */}
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.04] pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <pattern id="tasbih-geo-pattern" width="72" height="72" patternUnits="userSpaceOnUse">
              <rect x="20" y="20" width="32" height="32" fill="none" stroke="#e5b869" strokeWidth="1" />
              <rect
                x="20"
                y="20"
                width="32"
                height="32"
                fill="none"
                stroke="#e5b869"
                strokeWidth="1"
                transform="rotate(45 36 36)"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#tasbih-geo-pattern)" />
        </svg>

        {/* Header */}
        <div className="relative z-10 px-5 sm:px-6 pt-5 pb-4 border-b border-[#e5b869]/25 bg-gradient-to-b from-[#07382d] via-[#04241d] to-[#031813]">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2 text-xs text-emerald-300 font-bold">
                <span>
                  {isSalawatPurpose
                    ? isJumuahMode
                      ? 'سنن يوم الجمعة المباركة'
                      : 'وِرد الذكر اليومي'
                    : `عقب صلاة ${prayerNameAr}`}
                </span>
                <span className="text-[#e5b869]/50" aria-hidden="true">·</span>
                <span className="text-[#e5b869]">
                  {isSalawatPurpose
                    ? 'وِرد الصلاة على النبي ﷺ'
                    : isSimulated
                    ? 'معاينة مرور ١٠ دقائق بعد الأذان'
                    : 'مرور ١٠ دقائق على الأذان'}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold font-amiri text-[#fbbf24] tracking-wide">
                {isSalawatPurpose
                  ? 'مسبحة وِرد الصلاة على النبي ﷺ'
                  : 'أذكار ما بعد الصلاة — حصن المسلم'}
              </h2>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setSoundEnabled((prev) => !prev)}
                title={soundEnabled ? 'كتم صوت التسبيح' : 'تفعيل صوت التسبيح'}
                className="w-9 h-9 rounded-xl bg-[#041d17] border border-[#e5b869]/35 hover:border-[#fbbf24] text-[#fbbf24] flex items-center justify-center transition-colors"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
              </button>
              <button
                type="button"
                onClick={onClose}
                aria-label="إغلاق نافذة المسبحة"
                className="w-9 h-9 rounded-xl bg-[#041d17] border border-[#e5b869]/35 hover:border-[#fbbf24] text-[#fbbf24] flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Purpose Switcher: Jumuah Salawat Wird vs Post-Prayer Adhkar */}
          <div className="mt-3.5 flex flex-wrap items-center gap-1.5 bg-[#031410]/90 p-1 rounded-xl border border-[#e5b869]/30 w-fit">
            <button
              type="button"
              onClick={() => setPurpose('jumuah_salawat')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                isSalawatPurpose
                  ? 'bg-gradient-to-r from-[#fbbf24] via-[#e5b869] to-emerald-400 text-slate-950 shadow'
                  : 'text-slate-300 hover:text-[#fbbf24]'
              }`}
            >
              <Award className="w-3.5 h-3.5 shrink-0" />
              <span>وِرد الصلاة على النبي ﷺ {isJumuahMode ? '(الجمعة)' : ''}</span>
            </button>
            <button
              type="button"
              onClick={() => setPurpose('post_prayer')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                !isSalawatPurpose
                  ? 'bg-gradient-to-r from-[#fbbf24] via-[#e5b869] to-emerald-400 text-slate-950 shadow'
                  : 'text-slate-300 hover:text-[#fbbf24]'
              }`}
            >
              أذكار ما بعد الصلاة (٧ مراحل)
            </button>
          </div>

          {/* 7-Stage Progress Stepper (when in post_prayer mode) */}
          {!isSalawatPurpose && (
            <div className="mt-3.5 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {POST_PRAYER_STAGES.map((stage, idx) => {
                const isDone = isCompletedAll || idx < stageIndex;
                const isCurrent = !isCompletedAll && idx === stageIndex;
                return (
                  <button
                    key={stage.id}
                    type="button"
                    onClick={() => {
                      setIsCompletedAll(false);
                      setStageIndex(idx);
                      setStepCount(0);
                    }}
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all whitespace-nowrap shrink-0 flex items-center gap-1 ${
                      isCurrent
                        ? 'bg-[#fbbf24]/20 border-[#fbbf24] text-[#fbbf24]'
                        : isDone
                        ? 'bg-emerald-950/90 border-emerald-500/60 text-emerald-300'
                        : 'bg-[#031511]/80 border-[#e5b869]/20 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="font-mono tabular-nums">{idx + 1}.</span>
                    <span>{stage.shortTitle}</span>
                    {isDone && <Check className="w-3 h-3 text-emerald-400" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="relative z-10 p-5 sm:p-6 space-y-5 max-h-[78vh] overflow-y-auto">
          {!isSalawatPurpose && isCompletedAll ? (
            /* Completion Card */
            <div className="relative rounded-t-[96px] rounded-b-3xl border-2 border-[#fbbf24]/75 bg-gradient-to-b from-[#073a30]/95 via-[#05261f]/95 to-[#03130f]/95 p-8 sm:p-10 text-center space-y-5 shadow-[0_0_50px_rgba(251,191,36,0.22)]">
              <div className="absolute inset-2 rounded-t-[88px] rounded-b-2xl border border-[#e5b869]/30 pointer-events-none" />

              <div className="relative z-10 flex flex-col items-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#fbbf24]/15 border-2 border-[#fbbf24] flex items-center justify-center shadow-[0_0_28px_rgba(251,191,36,0.45)]">
                  <CheckCircle2 className="w-9 h-9 text-[#fbbf24]" />
                </div>

                <span className="text-xs font-bold text-emerald-300 tracking-wide">
                  أتممت أذكار ما بعد صلاة {prayerNameAr} كاملة بحمد الله
                </span>

                <h3 className="text-3xl sm:text-4xl font-bold font-amiri text-[#fbbf24] leading-snug">
                  تقبّل الله طاعتك وكتب أجرك
                </h3>

                <p className="text-sm text-slate-200 max-w-md leading-relaxed">
                  «من سبّح الله في دبر كل صلاة ثلاثاً وثلاثين، وحمد الله ثلاثاً وثلاثين، وكبّر الله ثلاثاً وثلاثين... وختم المائة بالتوحيد، غُفرت خطاياه وإن كانت مثل زبد البحر».
                </p>

                <div className="bg-[#031511]/90 border border-[#e5b869]/35 rounded-2xl px-6 py-3">
                  <span className="text-xs text-slate-400 block">إجمالي التسبيحات والأذكار في هذه الجلسة</span>
                  <span className="text-2xl font-black font-mono text-[#fbbf24] tabular-nums">
                    {totalCount}
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleRestartSequence}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#041d17] border border-[#e5b869]/45 text-xs font-bold text-[#fbbf24] hover:border-[#fbbf24] transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>إعادة الأذكار من البداية</span>
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-7 py-2.5 rounded-xl bg-gradient-to-r from-[#fbbf24] via-[#e5b869] to-emerald-400 text-slate-950 font-black text-xs hover:brightness-105 transition-all"
                  >
                    إغلاق
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Active Dhikr / Jumuah Salawat Card */}
              {isSalawatPurpose ? (
                <div className="rounded-2xl bg-[#031713]/95 border border-[#fbbf24]/45 p-4 sm:p-5 space-y-3.5 shadow-inner">
                  {/* Formula Selector & Target Selector */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
                    <div className="flex items-center gap-1.5 bg-[#02100d] p-1 rounded-xl border border-[#e5b869]/30">
                      {(['short', 'ibrahimi'] as const).map((fKey) => (
                        <button
                          key={fKey}
                          type="button"
                          onClick={() =>
                            setSalawatState((prev) => ({
                              ...prev,
                              dateKey: getTodayKey(),
                              formula: fKey,
                            }))
                          }
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                            salawatState.formula === fKey
                              ? 'bg-[#fbbf24] text-slate-950 shadow'
                              : 'text-slate-300 hover:text-[#fbbf24]'
                          }`}
                        >
                          {SALAWAT_FORMULAS[fKey].label}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-1.5 bg-[#02100d] p-1 rounded-xl border border-[#e5b869]/30">
                      <span className="text-[11px] text-slate-400 px-2">الهدف اليومي:</span>
                      {([100, 1000] as const).map((goal) => (
                        <button
                          key={goal}
                          type="button"
                          onClick={() =>
                            setSalawatState((prev) => ({
                              ...prev,
                              dateKey: getTodayKey(),
                              target: goal,
                            }))
                          }
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono tabular-nums transition-all ${
                            salawatState.target === goal
                              ? 'bg-emerald-600 text-white shadow'
                              : 'text-slate-300 hover:text-[#fbbf24]'
                          }`}
                        >
                          {goal}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Salawat Text */}
                  <p
                    className={`font-amiri text-white text-center leading-[1.95] px-1 ${
                      salawatState.formula === 'ibrahimi'
                        ? 'text-lg sm:text-xl'
                        : 'text-2xl sm:text-3xl font-bold'
                    }`}
                  >
                    {activeSalawatFormula.text}
                  </p>

                  <p className="text-xs text-center text-[#e5b869]/90">
                    {activeSalawatFormula.virtue}
                  </p>

                  {/* Golden Achievement Bar */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-emerald-300">
                        {isSalawatGoalReached
                          ? 'ما شاء الله! أتممت هدفك اليومي في الصلاة على النبي ﷺ'
                          : 'عدّاد إنجاز وِرد الجمعة الذهبي'}
                      </span>
                      <span className="font-mono font-bold text-[#fbbf24] tabular-nums">
                        {salawatState.count} / {salawatState.target} ({stagePercent}%)
                      </span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-[#02100d] border border-[#e5b869]/30 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-l from-[#fef08a] via-[#fbbf24] to-emerald-400 transition-all duration-200"
                        style={{ width: `${Math.max(stagePercent, salawatState.count > 0 ? 3 : 0)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl bg-[#031713]/90 border border-[#e5b869]/35 p-4 sm:p-5 text-center space-y-2.5 shadow-inner">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-300">
                      المرحلة {stageIndex + 1} من {POST_PRAYER_STAGES.length}
                    </span>
                    <span className="font-mono font-bold text-[#fbbf24] tabular-nums">
                      {stepCount} / {currentStage.targetCount}
                    </span>
                  </div>

                  <p
                    className={`font-amiri text-white leading-[1.95] px-1 ${
                      currentStage.isAyatAlKursi
                        ? 'text-lg sm:text-xl'
                        : 'text-2xl sm:text-3xl font-bold'
                    }`}
                  >
                    {currentStage.text}
                  </p>

                  <p className="text-xs text-[#e5b869]/90">{currentStage.virtue}</p>

                  {currentStage.isAyatAlKursi && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => handleAdvanceTasbih()}
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#fbbf24] via-[#e5b869] to-emerald-400 text-slate-950 font-black text-xs sm:text-sm hover:brightness-105 transition-all shadow-lg"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>تأكيد قراءة آية الكرسي وإتمام الأذكار</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Dual Tasbih Switcher */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#031511]/90 p-2 rounded-2xl border border-[#e5b869]/30">
                <div className="flex items-center gap-1.5 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => handleSwitchMode('eastern')}
                    className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      tasbihMode === 'eastern'
                        ? 'bg-gradient-to-r from-[#fbbf24] via-[#e5b869] to-emerald-400 text-slate-950 shadow'
                        : 'text-slate-300 hover:text-[#fbbf24]'
                    }`}
                  >
                    المسبحة الشرقية الواقعية
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSwitchMode('ring')}
                    className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      tasbihMode === 'ring'
                        ? 'bg-gradient-to-r from-[#fbbf24] via-[#e5b869] to-emerald-400 text-slate-950 shadow'
                        : 'text-slate-300 hover:text-[#fbbf24]'
                    }`}
                  >
                    خاتم التسبيح الإلكتروني الشبابي
                  </button>
                </div>

                <div className="text-xs text-slate-300 px-2 flex items-center gap-2 shrink-0">
                  <span>{isSalawatPurpose ? 'الإنجاز اليومي:' : 'الإجمالي:'}</span>
                  <strong className="font-mono text-[#fbbf24] tabular-nums">
                    {isSalawatPurpose ? salawatState.count : totalCount}
                  </strong>
                </div>
              </div>

              {/* STYLE 1: Realistic Eastern Misbaha inside Golden Mihrab */}
              {tasbihMode === 'eastern' && (
                <div className="relative rounded-t-[96px] rounded-b-3xl border-2 border-[#e5b869]/60 bg-gradient-to-b from-[#062d24]/95 via-[#041d17]/95 to-[#03120f]/95 p-5 sm:p-6 pt-8 flex flex-col items-center space-y-4 shadow-[0_14px_40px_rgba(0,0,0,0.5)] overflow-hidden">
                  {/* Inner Double Gold Arch */}
                  <div className="absolute inset-2 rounded-t-[88px] rounded-b-2xl border border-[#e5b869]/25 pointer-events-none" />
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(251,191,36,0.12)_0%,transparent_60%)] pointer-events-none" />

                  {/* 3 Material Chips */}
                  <div className="relative z-10 flex items-center gap-2">
                    {(['emerald', 'amber', 'oud'] as BeadMaterial[]).map((mat) => (
                      <button
                        key={mat}
                        type="button"
                        onClick={() => handleSelectBeadMaterial(mat)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all whitespace-nowrap ${
                          beadMaterial === mat
                            ? 'bg-[#073f34] border-[#fbbf24] text-[#fbbf24] shadow'
                            : 'bg-[#031511] border-[#e5b869]/25 text-slate-300 hover:border-[#e5b869]/50'
                        }`}
                      >
                        {BEAD_STYLES[mat].label}
                      </button>
                    ))}
                  </div>

                  {/* Interactive Silk Cord + Draggable Gemstone Beads + Swaying Tassel */}
                  <div
                    onPointerDown={handleBeadPointerDown}
                    onPointerMove={handleBeadPointerMove}
                    onPointerUp={handleBeadPointerUp}
                    onPointerCancel={handleBeadPointerUp}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault();
                        handleAdvanceTasbih('eastern');
                      }
                    }}
                    aria-label="اسحب الخرزة للأسفل أو انقر للتسبيح"
                    className="relative z-10 w-full max-w-xs py-2 flex flex-col items-center cursor-grab active:cursor-grabbing select-none touch-none"
                  >
                    {/* Braided Silk Cord SVG */}
                    <svg
                      width="12"
                      height="24"
                      viewBox="0 0 12 24"
                      className="pointer-events-none"
                      aria-hidden="true"
                    >
                      <path
                        d="M6 0 C9 4, 3 8, 6 12 C9 16, 3 20, 6 24"
                        stroke={activeBeadStyle.cordColor}
                        strokeWidth="2.5"
                        fill="none"
                      />
                    </svg>

                    {/* Upper Waiting Beads */}
                    <div
                      key={beadPulseId}
                      style={{ transform: `translateY(${dragOffsetY}px)` }}
                      className="flex flex-col items-center gap-2 transition-transform duration-150 ease-out"
                    >
                      {[0, 1, 2].map((idx) => (
                        <div
                          key={idx}
                          className={`w-11 h-11 rounded-full border ${activeBeadStyle.rim} shadow-lg relative`}
                          style={{
                            background: activeBeadStyle.gradient,
                            boxShadow: `0 6px 14px rgba(0,0,0,0.55), inset 0 2px 4px ${activeBeadStyle.highlight}`,
                          }}
                        >
                          <div className="absolute top-2 right-2.5 w-2.5 h-2.5 rounded-full bg-white/40 blur-[1px]" />
                        </div>
                      ))}

                      {/* Golden Divider Bead (شاهد المسبحة) */}
                      <div className="w-6 h-3 rounded-full bg-gradient-to-r from-amber-700 via-[#fef08a] to-amber-700 border border-amber-200/70 shadow" />

                      {/* Active Focal Bead */}
                      <div
                        className={`w-14 h-14 rounded-full border-2 border-[#fbbf24] shadow-2xl relative flex items-center justify-center`}
                        style={{
                          background: activeBeadStyle.gradient,
                          boxShadow: `0 10px 24px rgba(0,0,0,0.65), 0 0 18px rgba(251,191,36,0.3), inset 0 3px 6px ${activeBeadStyle.highlight}`,
                        }}
                      >
                        <span className="font-mono font-black text-base text-white drop-shadow tabular-nums">
                          {activeStepDisplay}
                        </span>
                      </div>
                    </div>

                    {/* Braided Cord + Ornate Swaying Tassel (شرابة متأرجحة) */}
                    <div className="flex flex-col items-center mt-1 pointer-events-none">
                      <div className="w-[2px] h-4" style={{ backgroundColor: activeBeadStyle.cordColor }} />
                      <div className="animate-swing origin-top flex flex-col items-center">
                        {/* Gold Filigree Cap */}
                        <div className="w-6 h-4 rounded-t-full bg-gradient-to-b from-[#fef08a] via-[#e5b869] to-[#b45309] border border-amber-200/70 shadow" />
                        {/* Silk Tassel Strands */}
                        <svg width="26" height="36" viewBox="0 0 26 36" fill="none" aria-hidden="true">
                          <path d="M5 0 L2 34" stroke={activeBeadStyle.tasselColor} strokeWidth="2" strokeLinecap="round" />
                          <path d="M9 0 L7 35" stroke={activeBeadStyle.tasselColor} strokeWidth="2.2" strokeLinecap="round" />
                          <path d="M13 0 L13 36" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
                          <path d="M17 0 L19 35" stroke={activeBeadStyle.tasselColor} strokeWidth="2.2" strokeLinecap="round" />
                          <path d="M21 0 L24 34" stroke={activeBeadStyle.tasselColor} strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <p className="relative z-10 text-xs text-[#e5b869] font-medium">
                    اسحب الخرزة للأسفل أو انقر عليها للتسبيح
                  </p>
                </div>
              )}

              {/* STYLE 2: Modern Youth 3D Electronic Tasbih Ring */}
              {tasbihMode === 'ring' && (
                <div className="relative rounded-3xl border border-[#e5b869]/40 bg-gradient-to-b from-[#041d17]/95 via-[#031410]/95 to-[#020c0a]/95 p-5 sm:p-6 flex flex-col items-center space-y-5 shadow-xl">
                  {/* 3 Youth Colorways */}
                  <div className="flex items-center gap-2">
                    {(['titanium', 'neon_emerald', 'modern_gold'] as RingColorway[]).map((cw) => (
                      <button
                        key={cw}
                        type="button"
                        onClick={() => handleSelectRingColorway(cw)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all whitespace-nowrap ${
                          ringColorway === cw
                            ? 'bg-[#073f34] border-[#fbbf24] text-[#fbbf24] shadow'
                            : 'bg-[#031511] border-[#e5b869]/25 text-slate-300 hover:border-[#e5b869]/50'
                        }`}
                      >
                        {RING_STYLES[cw].label}
                      </button>
                    ))}
                  </div>

                  {/* 3D Metallic Ring Hardware + Side Reset */}
                  <div className="relative flex items-center justify-center py-2">
                    {/* Lower 3D Finger Band Silhouette */}
                    <div
                      className="absolute -bottom-5 w-36 h-14 rounded-b-full border-4 border-[#e5b869]/35 opacity-60 pointer-events-none"
                      style={{ background: activeRingStyle.chassis }}
                    />

                    {/* Side Tactile Reset Button */}
                    <button
                      type="button"
                      onClick={handleResetCurrentStep}
                      title="تصفير عدّاد المرحلة الحالية"
                      aria-label="تصفير العدّاد"
                      className="absolute -left-5 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-0.5 px-2 py-2.5 rounded-l-xl bg-slate-900 border border-[#e5b869]/45 text-[#e5b869] hover:text-[#fbbf24] hover:border-[#fbbf24] shadow-lg active:scale-95 transition-all"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span className="text-[9px] font-bold">تصفير</span>
                    </button>

                    {/* Metallic 3D Ring Bezel */}
                    <div
                      className={`relative w-52 h-52 rounded-full p-3 flex items-center justify-center border-2 ${activeRingStyle.innerBezel} ${activeRingStyle.glow}`}
                      style={{ background: activeRingStyle.chassis }}
                    >
                      {/* Circular Progress SVG Ring */}
                      <svg
                        className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none"
                        viewBox="0 0 180 180"
                        aria-hidden="true"
                      >
                        <circle
                          cx="90"
                          cy="90"
                          r={ringRadius}
                          fill="none"
                          stroke="rgba(255,255,255,0.1)"
                          strokeWidth="7"
                        />
                        <circle
                          cx="90"
                          cy="90"
                          r={ringRadius}
                          fill="none"
                          stroke={activeRingStyle.strokeColor}
                          strokeWidth="7"
                          strokeLinecap="round"
                          strokeDasharray={ringCircumference}
                          strokeDashoffset={ringStrokeDashoffset}
                          className="transition-all duration-200"
                        />
                      </svg>

                      {/* Inner Curved OLED Display + Central Press Button */}
                      <div className="relative z-10 w-36 h-36 rounded-full bg-gradient-to-b from-slate-950 via-[#040b0e] to-slate-950 border border-white/15 flex flex-col items-center justify-between py-3 px-2 shadow-[inset_0_4px_16px_rgba(0,0,0,0.9)]">
                        {/* Curved OLED Glass Reflection */}
                        <div className="absolute inset-x-4 top-1.5 h-5 rounded-full bg-gradient-to-b from-white/15 to-transparent pointer-events-none" />

                        <span className="text-[10px] font-bold text-slate-400 truncate max-w-[110px]">
                          {isSalawatPurpose ? 'الصلاة على النبي ﷺ' : currentStage.shortTitle}
                        </span>

                        <div className={`font-mono text-2xl font-black tabular-nums ${activeRingStyle.oledText}`}>
                          {String(activeStepDisplay).padStart(2, '0')}
                          <span className="text-[11px] text-slate-500 font-normal">/{activeTargetDisplay}</span>
                        </div>

                        {/* Central Press Button */}
                        <button
                          type="button"
                          onClick={() => handleAdvanceTasbih('ring')}
                          aria-label="زر التسبيح المركزي"
                          className="w-20 h-9 rounded-full border border-[#e5b869]/55 text-xs font-black text-white shadow-[0_4px_12px_rgba(0,0,0,0.7)] active:translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-1"
                          style={{ background: activeRingStyle.buttonBg }}
                        >
                          <Sparkles className="w-3 h-3 text-[#fbbf24]" />
                          <span>سبّح</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300">
                    اضغط الزر المركزي للتسبيح أو الزر الجانبي لإعادة التصفير
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Bottom Navigation Hint */}
        {!isSalawatPurpose && !isCompletedAll && (
          <div className="relative z-10 px-5 py-3 border-t border-[#e5b869]/20 bg-[#031511]/90 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={handleRestartSequence}
              className="text-slate-400 hover:text-[#fbbf24] flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إعادة السلسلة</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (stageIndex < POST_PRAYER_STAGES.length - 1) {
                  setStageIndex((prev) => prev + 1);
                  setStepCount(0);
                } else {
                  setIsCompletedAll(true);
                  playCompletionChime();
                }
              }}
              className="text-[#e5b869] hover:text-[#fbbf24] font-bold flex items-center gap-1 transition-colors"
            >
              <span>تخطي للمرحلة التالية</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        {isSalawatPurpose && (
          <div className="relative z-10 px-5 py-3 border-t border-[#e5b869]/20 bg-[#031511]/90 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={handleResetCurrentStep}
              className="text-slate-400 hover:text-[#fbbf24] flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>تصفير عدّاد اليوم</span>
            </button>

            <span className="text-[#e5b869] font-medium">
              يُحفظ العداد تلقائياً عند التبديل بين المسبحة والخاتم
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
