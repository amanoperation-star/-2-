
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Volume2,
  VolumeX,
  FastForward,
  Clock,
  MapPin,
  Sparkles,
  Share2,
  Check,
  RotateCcw,
  BookOpen,
  Volume1,
  Compass,
} from 'lucide-react';
import { CityLocation, UserSettings, PrayerName } from '../types';
import { adhanPlayer, getAdhanSource, getDuaSource, AudioPlayerState, ActiveAudioType } from '../utils/audioAdhan';
import { LIVE_BACKGROUNDS } from '../utils/backgroundsData';

interface FullScreenAdhanModalProps {
  isOpen: boolean;
  onClose: () => void;
  prayerKey: PrayerName;
  prayerNameAr: string;
  currentLocation: CityLocation;
  settings: UserSettings;
}

// Canonical sequences of Islamic Adhan phrases with relative timing milestones
const ADHAN_PHRASES = [
  { text: 'اللَّهُ أَكْبَرُ، اللَّهُ أَكْبَرُ', sub: 'نداء العظمة والوحدانية' },
  { text: 'أَشْهَدُ أَنْ لَا إِلَٰهَ إِلَّا اللَّهُ', sub: 'شهادة التوحيد والإخلاص' },
  { text: 'أَشْهَدُ أَنَّ مُحَمَّدًا رَسُولُ اللَّهِ', sub: 'شهادة الرسالة والنبوة' },
  { text: 'حَيَّ عَلَى الصَّلَاةِ', sub: 'الدعوة إلى الفريضة العظيمة' },
  { text: 'حَيَّ عَلَى الْفَلَاحِ', sub: 'الدعوة إلى الفوز والنجاة' },
  { text: 'الصَّلَاةُ خَيْرٌ مِنَ النَّوْمِ', sub: 'نداء الفجر الخاص والسكينة', isFajrOnly: true },
  { text: 'اللَّهُ أَكْبَرُ، اللَّهُ أَكْبَرُ', sub: 'تكبير الختام والتعظيم' },
  { text: 'لَا إِلَٰهَ إِلَّا اللَّهُ', sub: 'كلمة الإخلاص والتقوى' },
];

export const FullScreenAdhanModal: React.FC<FullScreenAdhanModalProps> = ({
  isOpen,
  onClose,
  prayerKey,
  prayerNameAr,
  currentLocation,
  settings,
}) => {
  const [stage, setStage] = useState<'adhan' | 'dua'>('adhan');
  const [playerState, setPlayerState] = useState<AudioPlayerState>('idle');
  const [activeAudioType, setActiveAudioType] = useState<ActiveAudioType>('none');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');
  const [audioProgress, setAudioProgress] = useState<number>(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState<number>(0);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [autoCloseCountdown, setAutoCloseCountdown] = useState<number | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [waveOffset, setWaveOffset] = useState<number>(0);
  const autoCloseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const duaText =
    'اللَّهُمَّ رَبَّ هَذِهِ الدَّعْوَةِ التَّامَّةِ، وَالصَّلَاةِ الْقَائِمَةِ، آتِ مُحَمَّدًا الْوَسِيلَةَ وَالْفَضِيلَةَ، وَابْعَثْهُ مَقَامًا مَحْمُودًا الَّذِي وَعَدْتَهُ، [إِنَّكَ لَا تُخْلِفُ الْمِيعَادَ]';

  const isDaytime = prayerKey === 'dhuhr' || prayerKey === 'asr' || prayerKey === 'sunrise';

  // Real cinematic mosque images matching Ken Burns motion
  const mosqueBackground = useMemo(() => {
    // Select curated high-res authentic mosques: Kaaba, Prophet's Mosque, Al-Aqsa, Al-Azhar
    if (prayerKey === 'fajr') {
      return {
        name: 'المسجد النبوي الشريف • الروضة المباركة',
        location: 'المدينة المنورة',
        url: 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=2600&q=95',
      };
    }
    if (prayerKey === 'dhuhr' || prayerKey === 'sunrise') {
      return {
        name: 'الكعبة المشرفة والمسجد الحرام',
        location: 'مكة المكرمة',
        url: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=2600&q=95',
      };
    }
    if (prayerKey === 'asr') {
      return {
        name: 'الجامع الأزهر الشريف ومآذن القاهرة',
        location: 'مصر، القاهرة المعز',
        url: 'https://images.unsplash.com/photo-1564769625905-50e93615e769?auto=format&fit=crop&w=2600&q=95',
      };
    }
    if (prayerKey === 'maghrib') {
      return {
        name: 'المسجد الأقصى المبارك وقبة الصخرة',
        location: 'القدس الشريف',
        url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=2600&q=95',
      };
    }
    // isha & default
    return {
      name: 'الحرم المكي الشريف بأنواره الزاهرة',
      location: 'مكة المكرمة',
      url: 'https://images.unsplash.com/photo-1565552645632-d725f8bfc19a?auto=format&fit=crop&w=2600&q=95',
    };
  }, [prayerKey]);

  // Current live synchronized adhan phrase based on progression
  const currentPhrase = useMemo(() => {
    const isFajr = prayerKey === 'fajr';
    const applicablePhrases = isFajr
      ? ADHAN_PHRASES
      : ADHAN_PHRASES.filter((p) => !p.isFajrOnly);

    if (audioProgress <= 0 || audioProgress >= 98) {
      return applicablePhrases[0];
    }

    const index = Math.min(
      applicablePhrases.length - 1,
      Math.floor((audioProgress / 100) * applicablePhrases.length)
    );
    return applicablePhrases[index];
  }, [audioProgress, prayerKey]);

  // Clock (only while open)
  useEffect(() => {
    if (!isOpen) return;
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(
        now.toLocaleTimeString('ar-EG', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Silk wave dynamic continuous animation (only while open)
  useEffect(() => {
    if (!isOpen) return;
    let animId: number;
    let offset = 0;
    const animateWave = () => {
      offset += playerState === 'playing' ? 0.05 : 0.01;
      setWaveOffset(offset);
      animId = requestAnimationFrame(animateWave);
    };
    animId = requestAnimationFrame(animateWave);
    return () => cancelAnimationFrame(animId);
  }, [isOpen, playerState]);

  // Subscribe to adhan player events
  useEffect(() => {
    if (!isOpen) {
      if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
      setAutoCloseCountdown(null);
      return;
    }

    setStage('adhan');
    setIsMuted(adhanPlayer.isMuted());
    setAutoCloseCountdown(null);

    const activeSettings = settingsRef.current;
    const isFajr = prayerKey === 'fajr';
    const reciterToPlay = isFajr
      ? activeSettings.fajrAdhanReciter || 'fajr_makkah'
      : activeSettings.adhanReciter || 'makkah';
    const boost = isFajr && activeSettings.fajrBoostVolume;

    adhanPlayer.playAdhan(reciterToPlay, prayerKey, boost);

    const unsubscribe = adhanPlayer.subscribe({
      onStateChange: (state, type) => {
        setPlayerState(state);
        setActiveAudioType(type);
        if (type === 'dua') {
          setStage('dua');
        }
      },
      onProgress: (cur, dur, pct) => {
        setAudioCurrentTime(cur);
        setAudioDuration(dur);
        setAudioProgress(pct);
      },
      onAdhanEnded: () => {
        setStage('dua');
        const latestSettings = settingsRef.current;
        if (latestSettings.autoDuaAfterAdhan) {
          adhanPlayer.playDua(getDuaSource(latestSettings.duaAudioReciter).id);
        }
      },
      onDuaEnded: () => {
        triggerAutoClose();
      },
    });

    return () => {
      unsubscribe();
      if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
    };
  }, [isOpen, prayerKey]);

  const triggerAutoClose = () => {
    let secondsLeft = 5;
    setAutoCloseCountdown(secondsLeft);

    const countdownInterval = setInterval(() => {
      secondsLeft -= 1;
      if (secondsLeft > 0) {
        setAutoCloseCountdown(secondsLeft);
      } else {
        clearInterval(countdownInterval);
        handleClose();
      }
    }, 1000);

    autoCloseTimerRef.current = countdownInterval as unknown as NodeJS.Timeout;
  };

  const handleSkipToDua = () => {
    if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
    setAutoCloseCountdown(null);
    setStage('dua');
    adhanPlayer.skipToDua(getDuaSource(settings.duaAudioReciter).id);
  };

  const handleToggleMute = () => {
    const nextMuted = adhanPlayer.toggleMute();
    setIsMuted(nextMuted);
  };

  const handleReplay = () => {
    if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
    setAutoCloseCountdown(null);
    if (stage === 'adhan') {
      const isFajr = prayerKey === 'fajr';
      const reciterToPlay = isFajr
        ? settings.fajrAdhanReciter || 'fajr_makkah'
        : settings.adhanReciter || 'makkah';
      adhanPlayer.playAdhan(reciterToPlay, prayerKey, isFajr && settings.fajrBoostVolume);
    } else {
      adhanPlayer.playDua(getDuaSource(settings.duaAudioReciter).id);
    }
  };

  const handleCopyDua = () => {
    navigator.clipboard.writeText(duaText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleClose = () => {
    if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
    adhanPlayer.stop();
    onClose();
  };

  if (!isOpen) return null;

  const layoutMode =
    settings.adhanModalLayout ||
    (typeof window !== 'undefined' ? localStorage.getItem('adhan_modal_layout') : 'editorial-horizon') ||
    'editorial-horizon';

  const reciterInfo =
    stage === 'adhan'
      ? getAdhanSource(prayerKey === 'fajr' ? settings.fajrAdhanReciter : settings.adhanReciter, prayerKey)
      : getDuaSource(settings.duaAudioReciter);

  // Build silk sinusoidal curves for the Silk Audio Wave (Gold #e5b869 and Emerald)
  const isPlaying = playerState === 'playing';
  const amp = isPlaying ? 18 : 6;
  const generateSilkPath = (phaseOffset: number, freq: number) => {
    const points: string[] = [];
    const width = 1000;
    const height = 70;
    const midY = height / 2;
    for (let x = 0; x <= width; x += 20) {
      const y = midY + Math.sin(x * freq + waveOffset + phaseOffset) * amp * Math.sin((x / width) * Math.PI);
      points.push(`${x},${y.toFixed(1)}`);
    }
    return `M ${points[0]} L ${points.slice(1).join(' ')}`;
  };

  // COMMON HEADER BAR
  const renderHeaderBar = () => (
    <header className="relative z-20 w-full px-6 py-5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-black/40 backdrop-blur-md border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-xl">
          <Compass className="w-5 h-5 text-amber-300 animate-pulse" />
        </div>
        <div className="text-right">
          <span className="text-[11px] font-bold text-amber-300/90 tracking-wide block uppercase">
            {mosqueBackground.name}
          </span>
          <span className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span>{currentLocation.nameAr} • {mosqueBackground.location}</span>
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 text-emerald-300 font-mono text-sm shadow-xl">
          <Clock className="w-4 h-4 text-emerald-400" />
          <span>{currentTimeStr}</span>
        </div>

        <button
          onClick={handleClose}
          className="p-3 rounded-2xl bg-black/50 hover:bg-rose-950/80 backdrop-blur-md text-slate-200 hover:text-rose-200 border border-white/15 hover:border-rose-500/40 transition-all shadow-2xl hover:scale-105 active:scale-95"
          title="إغلاق والعودة"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </header>
  );

  // COMMON CONTROLS FOOTER
  const renderControlsFooter = () => (
    <div className="w-full pt-4 mt-2 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="w-full sm:w-64 space-y-1">
        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>{Math.floor(audioProgress)}%</span>
          <span>{stage === 'adhan' ? 'تقدم الأذان' : 'مدة الدعاء'}</span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-[#e5b869] to-amber-500 transition-all duration-200"
            style={{ width: `${Math.min(100, Math.max(0, audioProgress))}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-2.5 flex-wrap justify-end">
        {stage === 'adhan' && (
          <button
            onClick={handleSkipToDua}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-950/50 hover:scale-105 transition-all"
            title="الانتقال لدعاء ما بعد الأذان"
          >
            <FastForward className="w-4 h-4 fill-current" />
            <span>دعاء ما بعد الأذان</span>
          </button>
        )}

        <button
          onClick={handleToggleMute}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl border text-xs sm:text-sm font-semibold transition-all ${
            isMuted
              ? 'bg-rose-950/70 border-rose-600 text-rose-300'
              : 'bg-slate-900/80 hover:bg-slate-800 border-slate-700 text-slate-300'
          }`}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          <span>{isMuted ? 'مكتوم' : 'كتم'}</span>
        </button>

        <button
          onClick={handleReplay}
          className="p-2.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-300 transition-all"
          title="إعادة التشغيل"
        >
          <RotateCcw className="w-4 h-4 text-amber-400" />
        </button>

        {stage === 'dua' && (
          <button
            onClick={handleCopyDua}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-600/70 text-emerald-300 text-xs sm:text-sm font-semibold transition-all"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            <span>{copied ? 'تم النسخ' : 'نسخ'}</span>
          </button>
        )}

        <button
          onClick={handleClose}
          className="px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs sm:text-sm font-bold transition-all"
        >
          إغلاق
        </button>
      </div>
    </div>
  );

  // COMMON SILK AUDIO WAVE SVG
  const renderSilkWave = () => (
    <div className="absolute -top-7 left-0 right-0 w-full overflow-hidden pointer-events-none h-14">
      <svg viewBox="0 0 1000 70" preserveAspectRatio="none" className="w-full h-full opacity-90">
        <defs>
          <linearGradient id="silkGoldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.1" />
            <stop offset="35%" stopColor="#e5b869" stopOpacity="0.95" />
            <stop offset="70%" stopColor="#f59e0b" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="silkEmeraldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#e5b869" stopOpacity="0.1" />
            <stop offset="50%" stopColor="#10b981" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#059669" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        <path
          d={generateSilkPath(0, 0.008)}
          fill="none"
          stroke="url(#silkGoldGrad)"
          strokeWidth="3.2"
          strokeLinecap="round"
          className="drop-shadow-[0_0_12px_rgba(229,184,105,0.7)]"
        />
        <path
          d={generateSilkPath(1.8, 0.012)}
          fill="none"
          stroke="url(#silkEmeraldGrad)"
          strokeWidth="2"
          strokeLinecap="round"
          className="drop-shadow-[0_0_10px_rgba(16,185,129,0.5)] opacity-75"
        />
      </svg>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none bg-slate-950 text-slate-100 flex flex-col font-sans animate-in fade-in duration-500">
      
      {/* =========================================================================
          LAYOUT 1: EDITORIAL HORIZON (الأفق الإشراقي - الافتراضي)
          ========================================================================= */}
      {layoutMode === 'editorial-horizon' && (
        <>
          <div className="relative w-full h-[62vh] sm:h-[65vh] overflow-hidden">
            <div
              className="absolute inset-0 bg-cover bg-center transition-all duration-1000 animate-ken-burns scale-105"
              style={{ backgroundImage: `url('${mosqueBackground.url}')` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#020814] via-transparent to-black/60" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/30" />
            {renderHeaderBar()}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none text-center opacity-30 select-none">
              <span className="font-amiri text-6xl sm:text-8xl md:text-9xl font-bold text-amber-200/20 tracking-widest drop-shadow-2xl">
                {stage === 'adhan' ? 'حَيَّ عَلَى الصَّلَاةِ' : 'اللَّهُ نُورُ السَّمَاوَاتِ'}
              </span>
            </div>
          </div>

          <div className="relative z-30 flex-1 w-full bg-gradient-to-t from-[#020713] via-[#040e21]/95 to-[#05142e]/90 backdrop-blur-2xl border-t border-amber-500/25 flex flex-col justify-between p-5 sm:p-8 shadow-[0_-25px_60px_rgba(0,0,0,0.85)]">
            {renderSilkWave()}

            {stage === 'adhan' && (
              <div className="w-full flex-1 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="w-full md:w-auto text-right space-y-1.5 flex flex-col items-start shrink-0">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/35 text-amber-300 text-xs font-bold shadow-inner">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>الأفق الإشراقي • نداء الحق</span>
                  </div>
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white font-amiri tracking-wide drop-shadow-[0_4px_25px_rgba(229,184,105,0.35)]">
                    أذان صلاة {prayerNameAr}
                  </h1>
                  <p className="text-slate-300 text-xs sm:text-sm font-medium flex items-center gap-2">
                    <span>بصوت:</span>
                    <strong className="text-emerald-400 font-bold text-sm sm:text-base">{reciterInfo.nameAr}</strong>
                  </p>
                </div>

                <div className="w-full md:flex-1 max-w-xl flex flex-col items-center md:items-end text-center md:text-right bg-white/[0.03] border border-amber-500/20 rounded-3xl p-4 sm:p-6 shadow-2xl backdrop-blur-md relative overflow-hidden">
                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest mb-1 block">
                    {currentPhrase.sub}
                  </span>
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#e5b869] font-amiri leading-relaxed tracking-wide drop-shadow-[0_2px_15px_rgba(229,184,105,0.4)]">
                    «{currentPhrase.text}»
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-slate-400 font-mono">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-slate-300">جاري البث الحي للأذان الشريف</span>
                  </div>
                </div>
              </div>
            )}

            {stage === 'dua' && (
              <div className="w-full flex-1 flex flex-col justify-center items-center text-center space-y-4 animate-in fade-in duration-500 max-w-4xl mx-auto">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/35 text-amber-300 text-xs font-bold">
                  <BookOpen className="w-4 h-4 text-amber-400" />
                  <span>دعاء ما بعد الأذان • سنة نبوية مؤكدة</span>
                </div>
                <p className="text-xl sm:text-2xl md:text-3xl font-black text-amber-200 font-amiri leading-relaxed tracking-wide drop-shadow-[0_4px_20px_rgba(229,184,105,0.3)]">
                  «{duaText}»
                </p>
                <div className="text-xs text-slate-400 flex items-center justify-between gap-4 w-full max-w-xl px-4 pt-1 border-t border-slate-800">
                  <span>صحيح البخاري عن جابر بن عبد الله رضي الله عنه</span>
                  <span className="text-emerald-400 font-semibold">«حَلَّتْ لَهُ شَفَاعَتِي يَوْمَ الْقِيَامَةِ»</span>
                </div>
              </div>
            )}

            {renderControlsFooter()}
          </div>
        </>
      )}

      {/* =========================================================================
          LAYOUT 2: ARCHITECTURAL SANCTUARY (البوابة المعمارية)
          ========================================================================= */}
      {layoutMode === 'architectural-sanctuary' && (
        <div className="relative flex-1 w-full flex flex-col justify-between overflow-hidden bg-slate-950">
          <div className="absolute inset-0 bg-cover bg-center filter blur-xl opacity-30 scale-110" style={{ backgroundImage: `url('${mosqueBackground.url}')` }} />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-950/90 to-slate-900/95" />
          
          {renderHeaderBar()}

          <div className="relative z-20 flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row items-center gap-8">
            {/* Left Column: Architectural Arch Frame (قوس محراب إسلامي فاخر) */}
            <div className="w-full lg:w-1/2 h-[45vh] lg:h-[70vh] relative rounded-t-[160px] rounded-b-3xl border-4 border-amber-500/60 shadow-[0_0_60px_rgba(245,158,11,0.25)] overflow-hidden group">
              <div
                className="absolute inset-0 bg-cover bg-center animate-ken-burns scale-105"
                style={{ backgroundImage: `url('${mosqueBackground.url}')` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/30" />
              <div className="absolute bottom-6 right-6 left-6 text-right bg-slate-950/70 backdrop-blur-md p-4 rounded-2xl border border-amber-500/30">
                <span className="text-xs text-amber-300 font-bold block">{mosqueBackground.name}</span>
                <span className="text-[11px] text-slate-300">{mosqueBackground.location}</span>
              </div>
            </div>

            {/* Right Column: Details, Live Lyrics & Controls */}
            <div className="w-full lg:w-1/2 flex flex-col justify-between space-y-6 bg-slate-900/80 backdrop-blur-2xl border border-amber-500/35 rounded-3xl p-6 lg:p-8 shadow-2xl">
              <div className="space-y-4 text-right">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/40">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>البوابة المعمارية • صلاة {prayerNameAr}</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-amiri">
                  أذان صلاة {prayerNameAr}
                </h1>
                <p className="text-slate-300 text-sm">
                  بصوت القارئ: <strong className="text-emerald-400 font-bold">{reciterInfo.nameAr}</strong>
                </p>

                {stage === 'adhan' && (
                  <div className="bg-slate-950/70 border border-amber-500/30 p-5 rounded-2xl space-y-2 relative overflow-hidden">
                    <span className="text-[10px] text-emerald-400 uppercase font-bold tracking-widest block">
                      {currentPhrase.sub}
                    </span>
                    <div className="text-2xl sm:text-3xl font-black text-[#e5b869] font-amiri leading-relaxed">
                      «{currentPhrase.text}»
                    </div>
                  </div>
                )}

                {stage === 'dua' && (
                  <div className="bg-slate-950/70 border border-amber-500/30 p-5 rounded-2xl space-y-2">
                    <span className="text-[10px] text-amber-400 uppercase font-bold tracking-widest block">
                      دعاء ما بعد الأذان
                    </span>
                    <p className="text-lg sm:text-xl font-bold text-amber-200 font-amiri leading-relaxed">
                      «{duaText}»
                    </p>
                  </div>
                )}
              </div>

              <div className="relative py-2">
                {renderSilkWave()}
              </div>

              {renderControlsFooter()}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          LAYOUT 3: AMBIENT AURA (الضوء النوراني الحر)
          ========================================================================= */}
      {layoutMode === 'ambient-aura' && (
        <div className="relative flex-1 w-full flex flex-col justify-between overflow-hidden bg-slate-950">
          <div
            className="absolute inset-0 bg-cover bg-center filter brightness-75 scale-105 animate-ken-burns"
            style={{ backgroundImage: `url('${mosqueBackground.url}')` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/85 to-slate-950/60" />
          
          {/* Central Glowing Light Aura */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-amber-500/15 rounded-full blur-[140px] pointer-events-none animate-pulse" />

          {renderHeaderBar()}

          <div className="relative z-20 flex-1 max-w-4xl w-full mx-auto px-6 flex flex-col justify-center items-center text-center space-y-8 my-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-amber-500/40 text-amber-300 text-xs font-bold shadow-2xl">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>الضوء النوراني الحر • {mosqueBackground.name}</span>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl sm:text-6xl font-black text-white font-amiri drop-shadow-[0_4px_30px_rgba(229,184,105,0.5)]">
                أذان صلاة {prayerNameAr}
              </h1>
              <p className="text-slate-200 text-sm sm:text-base font-medium">
                بصوت: <strong className="text-emerald-400 font-bold">{reciterInfo.nameAr}</strong>
              </p>
            </div>

            {stage === 'adhan' && (
              <div className="space-y-3 max-w-2xl py-4">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest block">
                  {currentPhrase.sub}
                </span>
                <div className="text-3xl sm:text-5xl font-black text-[#e5b869] font-amiri leading-relaxed drop-shadow-[0_4px_25px_rgba(229,184,105,0.6)]">
                  «{currentPhrase.text}»
                </div>
              </div>
            )}

            {stage === 'dua' && (
              <div className="space-y-3 max-w-3xl py-4">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block">
                  دعاء ما بعد الأذان الشريف
                </span>
                <p className="text-2xl sm:text-3xl font-black text-amber-200 font-amiri leading-relaxed drop-shadow-[0_4px_25px_rgba(229,184,105,0.5)]">
                  «{duaText}»
                </p>
              </div>
            )}
          </div>

          <div className="relative z-20 bg-slate-950/80 backdrop-blur-2xl border-t border-amber-500/30 p-6">
            {renderSilkWave()}
            {renderControlsFooter()}
          </div>
        </div>
      )}

    </div>
  );
};

