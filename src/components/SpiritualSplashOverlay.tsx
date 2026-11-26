import React, { useCallback, useEffect, useRef, useState } from 'react';

interface SplashAyah {
  globalNumber: number;
  surahNameAr: string;
  ayahNumberAr: string;
  textAr: string;
}

const SPLASH_AYAH_STORAGE_KEY = 'mihrab_splash_ayah_idx_v1';
const FALLBACK_DURATION_MS = 7500;
const STALLED_AUDIO_TIMEOUT_MS = 22000;

const SPLASH_AYAHS: SplashAyah[] = [
  {
    globalNumber: 159,
    surahNameAr: 'البقرة',
    ayahNumberAr: '١٥٢',
    textAr: 'فَاذْكُرُونِي أَذْكُرْكُمْ وَاشْكُرُوا لِي وَلَا تَكْفُرُونِ',
  },
  {
    globalNumber: 1735,
    surahNameAr: 'الرعد',
    ayahNumberAr: '٢٨',
    textAr: 'الَّذِينَ آمَنُوا وَتَطْمَئِنُّ قُلُوبُهُم بِذِكْرِ اللَّهِ ۗ أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ',
  },
  {
    globalNumber: 2150,
    surahNameAr: 'الكهف',
    ayahNumberAr: '١٠',
    textAr: 'إِذْ أَوَى الْفِتْيَةُ إِلَى الْكَهْفِ فَقَالُوا رَبَّنَا آتِنَا مِن لَّدُنكَ رَحْمَةً وَهَيِّئْ لَنَا مِنْ أَمْرِنَا رَشَدًا',
  },
  {
    globalNumber: 301,
    surahNameAr: 'آل عمران',
    ayahNumberAr: '٨',
    textAr: 'رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا وَهَبْ لَنَا مِن لَّدُنكَ رَحْمَةً ۚ إِنَّكَ أَنتَ الْوَهَّابُ',
  },
  {
    globalNumber: 193,
    surahNameAr: 'البقرة',
    ayahNumberAr: '١٨٦',
    textAr: 'وَإِذَا سَأَلَكَ عِبَادِي عَنِّي فَإِنِّي قَرِيبٌ ۖ أُجِيبُ دَعْوَةَ الدَّاعِ إِذَا دَعَانِ ۖ فَلْيَسْتَجِيبُوا لِي وَلْيُؤْمِنُوا بِي لَعَلَّهُمْ يَرْشُدُونَ',
  },
  {
    globalNumber: 2929,
    surahNameAr: 'الفرقان',
    ayahNumberAr: '٧٤',
    textAr: 'وَالَّذِينَ يَقُولُونَ رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ وَاجْعَلْنَا لِلْمُتَّقِينَ إِمَامًا',
  },
  {
    globalNumber: 6095,
    surahNameAr: 'الشرح',
    ayahNumberAr: '٥',
    textAr: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا',
  },
];

function selectNextSplashAyah(): SplashAyah {
  if (typeof window === 'undefined') {
    return SPLASH_AYAHS[0];
  }
  try {
    const raw = localStorage.getItem(SPLASH_AYAH_STORAGE_KEY);
    const prevIdx = raw !== null ? Number(raw) : -1;
    const nextIdx =
      Number.isInteger(prevIdx) && prevIdx >= 0
        ? (prevIdx + 1) % SPLASH_AYAHS.length
        : 0;
    localStorage.setItem(SPLASH_AYAH_STORAGE_KEY, String(nextIdx));
    return SPLASH_AYAHS[nextIdx] || SPLASH_AYAHS[0];
  } catch {
    return SPLASH_AYAHS[0];
  }
}

interface SpiritualSplashOverlayProps {
  isOpen: boolean;
  onEnterCommute: () => void;
  onEnterHome: () => void;
}

export const SpiritualSplashOverlay: React.FC<SpiritualSplashOverlayProps> = ({
  isOpen,
  onEnterCommute,
  onEnterHome,
}) => {
  const [ayah] = useState<SplashAyah>(() => selectNextSplashAyah());
  const [phase, setPhase] = useState<'reciting' | 'choices'>('reciting');
  const [progress, setProgress] = useState<number>(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const liveAudioActiveRef = useRef<boolean>(false);
  const completedRef = useRef<boolean>(false);
  const fallbackTimerRef = useRef<number | null>(null);
  const safetyTimerRef = useRef<number | null>(null);

  const stopAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      audio.pause();
      audio.currentTime = 0;
    } catch {
      // ignore media reset issues
    }
  }, []);

  const clearTimers = useCallback(() => {
    if (fallbackTimerRef.current !== null) {
      window.clearInterval(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
    if (safetyTimerRef.current !== null) {
      window.clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = null;
    }
  }, []);

  const revealChoices = useCallback(
    (pauseAudioNow: boolean) => {
      if (completedRef.current) return;
      completedRef.current = true;
      clearTimers();
      if (pauseAudioNow) {
        stopAudio();
      }
      setProgress(100);
      setPhase('choices');
    },
    [clearTimers, stopAudio]
  );

  useEffect(() => {
    if (!isOpen) {
      clearTimers();
      stopAudio();
      return;
    }

    completedRef.current = false;
    liveAudioActiveRef.current = false;
    setPhase('reciting');
    setProgress(0);

    const startedAt = Date.now();
    const audio = audioRef.current;

    const tryAutoplay = () => {
      if (!audio || completedRef.current) return;
      const playPromise = audio.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {
          // Autoplay blocked by browser; fallback progress timer runs smoothly
        });
      }
    };

    tryAutoplay();

    // Smooth fallback progress timer if audio hasn't started or is blocked
    fallbackTimerRef.current = window.setInterval(() => {
      if (completedRef.current) return;
      if (liveAudioActiveRef.current) return;
      const elapsed = Date.now() - startedAt;
      const pct = Math.min(100, (elapsed / FALLBACK_DURATION_MS) * 100);
      setProgress(pct);
      if (pct >= 100) {
        revealChoices(true);
      }
    }, 60);

    // Hard safety cap so splash never hangs indefinitely on slow network streams
    safetyTimerRef.current = window.setTimeout(() => {
      revealChoices(true);
    }, STALLED_AUDIO_TIMEOUT_MS);

    // Silent one-time gesture recovery if browser blocked initial autoplay before user tapped
    const handleSilentGesture = (event: Event) => {
      if (completedRef.current || liveAudioActiveRef.current) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest('[data-splash-skip="true"]')) return;
      tryAutoplay();
    };

    window.addEventListener('pointerdown', handleSilentGesture, { passive: true });
    window.addEventListener('keydown', handleSilentGesture, { passive: true });

    return () => {
      clearTimers();
      stopAudio();
      window.removeEventListener('pointerdown', handleSilentGesture);
      window.removeEventListener('keydown', handleSilentGesture);
    };
  }, [isOpen, clearTimers, stopAudio, revealChoices]);

  if (!isOpen) return null;

  const audioUrl = `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${ayah.globalNumber}.mp3`;

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-[90] flex flex-col justify-between overflow-hidden bg-[#04130E] text-white select-none theme-keep-light last-third-isolated"
      style={{ fontFamily: "'Cairo', sans-serif" }}
      role="dialog"
      aria-modal="true"
      aria-label="شاشة البداية الروحانية لتطبيق محراب"
    >
      {/* Hidden Direct Autoplay Quranic Recitation Element */}
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="auto"
        playsInline
        onPlaying={() => {
          liveAudioActiveRef.current = true;
        }}
        onTimeUpdate={(e) => {
          if (completedRef.current) return;
          const el = e.currentTarget;
          if (Number.isFinite(el.duration) && el.duration > 0) {
            liveAudioActiveRef.current = true;
            const pct = Math.min(100, Math.max(0, (el.currentTime / el.duration) * 100));
            setProgress(pct);
          }
        }}
        onEnded={() => {
          revealChoices(false);
        }}
        onError={() => {
          liveAudioActiveRef.current = false;
        }}
      />

      {/* Ambient Royal Emerald & Gold Sanctuary Glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 55% at 50% 34%, rgba(52, 211, 153, 0.13) 0%, rgba(212, 175, 55, 0.09) 38%, rgba(4, 19, 14, 0) 75%)',
        }}
      />

      {/* Subtle Sacred Geometry Lattice */}
      <svg
        className="pointer-events-none absolute inset-0 w-full h-full opacity-[0.045]"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <pattern
            id="mihrab-splash-lattice"
            width="88"
            height="88"
            patternUnits="userSpaceOnUse"
          >
            <rect
              x="24"
              y="24"
              width="40"
              height="40"
              fill="none"
              stroke="#D4AF37"
              strokeWidth="1"
            />
            <rect
              x="24"
              y="24"
              width="40"
              height="40"
              fill="none"
              stroke="#D4AF37"
              strokeWidth="1"
              transform="rotate(45 44 44)"
            />
            <circle cx="44" cy="44" r="7" fill="none" stroke="#34D399" strokeWidth="0.9" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#mihrab-splash-lattice)" />
      </svg>

      {/* Delicate Royal Gold Inner Sanctuary Border */}
      <div className="pointer-events-none fixed inset-3 sm:inset-5 rounded-3xl border border-[#D4AF37]/20" />

      {/* Top Zone: Only "Show Options" Skip Action */}
      <header className="relative z-10 w-full max-w-2xl mx-auto px-5 sm:px-8 pt-6 sm:pt-8 flex items-center justify-end min-h-[72px]">
        {phase === 'reciting' && (
          <button
            type="button"
            data-splash-skip="true"
            onClick={() => revealChoices(true)}
            className="min-h-[44px] px-4 py-2 rounded-xl border border-[#D4AF37]/45 bg-[#071E17]/85 hover:border-[#F3D078] hover:bg-[#0A2B20] text-[#F3D078] text-xs sm:text-sm font-bold transition-all active:scale-[0.98]"
          >
            إظهار الخيارات ›
          </button>
        )}
      </header>

      {/* Center Zone: Glowing Mihrab Arch + Open Mushaf + Title + Rotating Ayah Card */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-5 sm:px-8 max-w-xl w-full mx-auto text-center">
        {/* Glowing Golden Mihrab Arch & Open Mushaf Emblem */}
        <div
          className="relative flex items-center justify-center mb-3"
          style={{ filter: 'drop-shadow(0 0 24px rgba(212, 175, 55, 0.34))' }}
          aria-hidden="true"
        >
          <svg
            width="124"
            height="136"
            viewBox="0 0 124 136"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="splashGoldGrad" x1="16" y1="8" x2="108" y2="128" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#F3D078" />
                <stop offset="50%" stopColor="#D4AF37" />
                <stop offset="100%" stopColor="#A68222" />
              </linearGradient>
              <radialGradient id="splashEmeraldAura" cx="50%" cy="46%" r="50%">
                <stop offset="0%" stopColor="#34D399" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#04130E" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Inner Emerald Mihrab Glow */}
            <path
              d="M22 122 V62 C22 36 42 18 62 10 C82 18 102 36 102 62 V122 Z"
              fill="url(#splashEmeraldAura)"
            />

            {/* Outer Pointed Mihrab Arch */}
            <path
              d="M16 124 V60 C16 32 39 14 62 4 C85 14 108 32 108 60 V124"
              stroke="url(#splashGoldGrad)"
              strokeWidth="2.2"
              strokeLinecap="round"
            />

            {/* Inner Pointed Mihrab Arch */}
            <path
              d="M25 124 V62 C25 38 44 22 62 14 C80 22 99 38 99 62 V124"
              stroke="#F3D078"
              strokeOpacity="0.55"
              strokeWidth="1.2"
              strokeLinecap="round"
            />

            {/* Apex Emerald Star Accent */}
            <polygon points="62,22 66,28 62,34 58,28" fill="#34D399" fillOpacity="0.9" />

            {/* Open Mushaf Pages */}
            <path
              d="M62 66 C53 60 40 59 31 63 V103 C40 99 53 100 62 106 C71 100 84 99 93 103 V63 C84 59 71 60 62 66 Z"
              fill="#072219"
              stroke="url(#splashGoldGrad)"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            {/* Center Spine */}
            <path d="M62 66 V106" stroke="#F3D078" strokeWidth="1.6" />
            {/* Left & Right Page Script Lines */}
            <path
              d="M38 72 C44 70 50 70 56 73 M38 80 C44 78 50 78 56 81 M38 88 C44 86 50 86 56 89 M38 96 C44 94 50 94 56 97"
              stroke="#D4AF37"
              strokeOpacity="0.72"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
            <path
              d="M86 72 C80 70 74 70 68 73 M86 80 C80 78 74 78 68 81 M86 88 C80 86 74 86 68 89 M86 96 C80 94 74 94 68 97"
              stroke="#D4AF37"
              strokeOpacity="0.72"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
            {/* Mushaf Cradle Base */}
            <path
              d="M44 114 L62 108 L80 114"
              stroke="url(#splashGoldGrad)"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* App Title */}
        <h1 className="font-amiri text-4xl sm:text-5xl font-bold text-[#F3D078] tracking-wide leading-tight drop-shadow-[0_2px_16px_rgba(212,175,55,0.28)]">
          مِحْرَاب
        </h1>

        {/* Ornamental Divider */}
        <div className="mt-2.5 flex items-center justify-center gap-3 w-44">
          <span className="h-px flex-1 bg-gradient-to-l from-[#D4AF37]/70 to-transparent" />
          <span className="w-2 h-2 rotate-45 bg-[#34D399]" />
          <span className="h-px flex-1 bg-gradient-to-r from-[#D4AF37]/70 to-transparent" />
        </div>

        {/* Renewed Quranic Ayah Card */}
        <section
          aria-label="الآية القرآنية الاستهلالية"
          className="w-full mt-5 rounded-3xl border border-[#D4AF37]/45 bg-gradient-to-b from-[#072119]/95 via-[#051812]/95 to-[#04130E]/95 p-5 sm:p-7 shadow-[0_20px_52px_rgba(0,0,0,0.62),0_0_30px_rgba(52,211,153,0.08)]"
        >
          <p className="text-xs font-bold text-[#34D399] tracking-wide">
            ۞ تِلاوةُ البِداية ۞
          </p>

          <blockquote className="font-amiri text-xl sm:text-2xl leading-[2.05] text-white mt-3 mb-4">
            ﴿ {ayah.textAr} ﴾
          </blockquote>

          <p className="text-xs sm:text-sm font-semibold text-[#F3D078]/90">
            سورة {ayah.surahNameAr} · الآية {ayah.ayahNumberAr} · القارئ: الشيخ مشاري العفاسي
          </p>
        </section>
      </main>

      {/* Bottom Zone: Synced Progress Bar during Recitation, OR Two-Button Entry Gate */}
      <footer className="relative z-10 w-full max-w-xl mx-auto px-5 sm:px-8 pb-7 sm:pb-9 min-h-[132px] flex flex-col justify-end">
        {phase === 'reciting' ? (
          <div className="w-full space-y-2.5">
            <div
              className="w-full h-1.5 rounded-full bg-[#09241B] border border-[#D4AF37]/25 overflow-hidden"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progress)}
              aria-label="تقدم تلاوة الآية"
            >
              <div
                className="h-full rounded-full bg-gradient-to-l from-[#34D399] via-[#D4AF37] to-[#F3D078] transition-[width] duration-150 ease-linear"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="w-full rounded-3xl border border-[#D4AF37]/50 bg-[#071E17]/95 p-4 sm:p-5 shadow-[0_18px_48px_rgba(0,0,0,0.7)] space-y-3">
            <p className="text-xs font-bold text-[#F3D078] text-center">
              اختر وجهتك للدخول إلى التطبيق
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  clearTimers();
                  stopAudio();
                  onEnterCommute();
                }}
                className="min-h-[52px] px-5 py-3 rounded-2xl border border-[#34D399]/60 bg-gradient-to-r from-[#0A3829] to-[#07261C] hover:border-[#34D399] hover:from-[#0C4432] hover:to-[#083024] text-white font-bold text-base flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(52,211,153,0.16)] transition-all active:scale-[0.98]"
              >
                <span aria-hidden="true">🚇</span>
                <span>وِرد الطريق</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  clearTimers();
                  stopAudio();
                  onEnterHome();
                }}
                className="min-h-[52px] px-5 py-3 rounded-2xl bg-gradient-to-r from-[#D4AF37] via-[#F3D078] to-[#D4AF37] text-[#04130E] font-black text-base flex items-center justify-center gap-2 shadow-[0_10px_28px_rgba(212,175,55,0.3)] hover:brightness-105 transition-all active:scale-[0.98]"
              >
                <span aria-hidden="true">🕌</span>
                <span>الشاشة الرئيسية</span>
              </button>
            </div>
          </div>
        )}
      </footer>
    </div>
  );
};
