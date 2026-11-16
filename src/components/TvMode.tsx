import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Clock,
  MapPin,
  Calendar,
  Volume2,
  Square,
  ShieldCheck,
  CheckCircle2,
  Smartphone,
  Users,
  AlertCircle,
  Timer,
} from 'lucide-react';
import { PrayerTimeData, CityLocation, UserSettings, PrayerName } from '../types';
import { adhanPlayer, AudioPlayerState } from '../utils/audioAdhan';
import { backgroundService } from '../utils/backgroundService';

interface TvModeProps {
  isOpen: boolean;
  onClose: () => void;
  prayerTimes: PrayerTimeData;
  currentLocation: CityLocation;
  settings: UserSettings;
}

export const TvMode: React.FC<TvModeProps> = ({
  isOpen,
  onClose,
  prayerTimes,
  currentLocation,
  settings,
}) => {
  const [time, setTime] = useState<Date>(new Date());
  const [playerState, setPlayerState] = useState<AudioPlayerState>('idle');
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [iqamaRemaining, setIqamaRemaining] = useState<string | null>(null);
  const [activePrayerLabel, setActivePrayerLabel] = useState<string>('الظهر');

  // Request wake lock when TV mode is opened
  useEffect(() => {
    if (isOpen) {
      backgroundService.requestWakeLock();
    }
  }, [isOpen]);

  useEffect(() => {
    setIsUnlocked(adhanPlayer.getIsUnlocked());
    const unsub = adhanPlayer.subscribe({
      onStateChange: (st) => setPlayerState(st),
      onUnlocked: () => setIsUnlocked(true),
    });
    return () => unsub();
  }, []);

  const checkIqamaRef = useRef<(now: Date) => void>(() => {});

  // Update clock & Iqama counter only while TV mode is open
  useEffect(() => {
    if (!isOpen) return;
    const now = new Date();
    setTime(now);
    checkIqamaRef.current(now);

    const timer = setInterval(() => {
      const tick = new Date();
      setTime(tick);
      checkIqamaRef.current(tick);
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  const timeToMinutes = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  const checkIqama = (now: Date) => {
    const currentMinutes = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;

    const list: { key: PrayerName; time: number; nameAr: string }[] = [
      { key: 'fajr', time: timeToMinutes(prayerTimes.fajr), nameAr: 'الفجر' },
      { key: 'dhuhr', time: timeToMinutes(prayerTimes.dhuhr), nameAr: 'الظهر' },
      { key: 'asr', time: timeToMinutes(prayerTimes.asr), nameAr: 'العصر' },
      { key: 'maghrib', time: timeToMinutes(prayerTimes.maghrib), nameAr: 'المغرب' },
      { key: 'isha', time: timeToMinutes(prayerTimes.isha), nameAr: 'العشاء' },
    ];

    // Find the latest prayer that has already passed within its Iqama window
    let inIqama = false;
    for (const p of list) {
      const iqamaDuration = (settings.iqamaMinutes as any)?.[p.key] || 20;
      const diff = currentMinutes - p.time;
      if (diff >= 0 && diff <= iqamaDuration) {
        inIqama = true;
        setActivePrayerLabel(p.nameAr);
        const remMinutes = iqamaDuration - diff;
        const m = Math.floor(remMinutes);
        const s = Math.floor((remMinutes - m) * 60);
        setIqamaRemaining(`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
        break;
      }
    }

    if (!inIqama) {
      setIqamaRemaining((prev) => (prev === null ? prev : null));
    }
  };
  checkIqamaRef.current = checkIqama;

  if (!isOpen) return null;

  const handleToggleAdhan = () => {
    if (playerState === 'playing') {
      adhanPlayer.stop();
    } else {
      adhanPlayer.playAdhan(settings.adhanReciter);
    }
  };

  const handleUnlockAudio = async () => {
    await adhanPlayer.unlockAudio();
    adhanPlayer.playChime();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#020617] text-white flex flex-col justify-between p-6 md:p-12 select-none overflow-hidden font-sans">
      {/* Background Islamic Ambient Lighting */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-teal-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Header Bar */}
      <div className="relative z-10 flex items-center justify-between border-b border-slate-800/80 pb-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-3xl shadow-xl shadow-emerald-950/60 font-bold">
            ☪
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-3xl font-extrabold text-white font-amiri tracking-wide">
                شاشة المسجد الذكية
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black">
                PRO TV
              </span>
            </div>
            <p className="text-slate-400 text-sm flex items-center gap-1.5 mt-1">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>{currentLocation.nameAr} ({currentLocation.countryAr})</span>
            </p>
          </div>
        </div>

        {/* Center/Right Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleUnlockAudio}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-colors ${
              isUnlocked
                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                : 'bg-slate-900 border-slate-700 text-amber-300'
            }`}
          >
            {isUnlocked ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <ShieldCheck className="w-4 h-4 text-amber-400" />}
            <span>{isUnlocked ? 'الصوت مفعّل' : 'تفعيل إذن الصوت'}</span>
          </button>

          <button
            onClick={handleToggleAdhan}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg ${
              playerState === 'playing' ? 'bg-rose-600 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {playerState === 'playing' ? <Square className="w-4 h-4 fill-current" /> : <Volume2 className="w-4 h-4" />}
            <span>{playerState === 'playing' ? 'إيقاف' : 'تجربة الأذان'}</span>
          </button>

          <button
            onClick={onClose}
            className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Central Giant Mosque Display Area */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto space-y-6 text-center">
        {/* Giant Time Clock */}
        <div className="text-7xl sm:text-8xl md:text-9xl font-black text-white font-mono tracking-widest drop-shadow-[0_10px_35px_rgba(16,185,129,0.3)]">
          {time.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
        </div>

        <p className="text-xl sm:text-2xl text-emerald-300 font-amiri font-bold flex items-center justify-center gap-3">
          <span>{prayerTimes.dateString}</span>
          <span className="text-amber-400 font-extrabold">• {prayerTimes.hijriDate}</span>
        </p>

        {/* Live Iqama Counter (if active) */}
        {iqamaRemaining ? (
          <div className="animate-pulse bg-gradient-to-r from-amber-950 via-amber-900 to-amber-950 border-2 border-amber-500 px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-4">
            <Timer className="w-8 h-8 text-amber-400 animate-spin" />
            <div className="text-right">
              <span className="text-xs text-amber-200 font-bold block">
                الوقت المتبقي لإقامة صلاة {activePrayerLabel}:
              </span>
              <div className="text-4xl font-black text-amber-300 font-mono">
                {iqamaRemaining}
              </div>
            </div>
          </div>
        ) : null}

        {/* Mosque Community Alerts Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl w-full pt-2">
          <div className="bg-[#0b172a]/80 border border-amber-500/40 p-4 rounded-2xl flex items-center justify-center gap-3 text-amber-300 shadow-lg">
            <Smartphone className="w-6 h-6 shrink-0 animate-bounce" />
            <span className="text-base font-extrabold font-amiri">
              يرجى إغلاق الهاتف المحمول أو وضعه على الصامت 📴
            </span>
          </div>

          <div className="bg-[#0b172a]/80 border border-emerald-500/40 p-4 rounded-2xl flex items-center justify-center gap-3 text-emerald-300 shadow-lg">
            <Users className="w-6 h-6 shrink-0" />
            <span className="text-base font-extrabold font-amiri">
              استووا واعتدلوا، وتراصوا وسوّوا صفوفكم 🕌
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Giant Prayer Times Bar */}
      <div className="relative z-10 grid grid-cols-3 sm:grid-cols-6 gap-3 md:gap-5">
        <div className="bg-[#091528]/90 border border-slate-800 rounded-3xl p-4 md:p-5 text-center flex flex-col justify-center shadow-lg">
          <span className="text-slate-400 text-sm font-bold">الفجر</span>
          <span className="text-3xl md:text-4xl font-extrabold text-sky-400 font-mono mt-1">{prayerTimes.fajr}</span>
        </div>
        <div className="bg-[#091528]/90 border border-slate-800 rounded-3xl p-4 md:p-5 text-center flex flex-col justify-center shadow-lg">
          <span className="text-slate-400 text-sm font-bold">الشروق</span>
          <span className="text-3xl md:text-4xl font-extrabold text-amber-400 font-mono mt-1">{prayerTimes.sunrise}</span>
        </div>
        <div className="bg-[#091528]/90 border border-slate-800 rounded-3xl p-4 md:p-5 text-center flex flex-col justify-center shadow-lg">
          <span className="text-slate-400 text-sm font-bold">الظهر</span>
          <span className="text-3xl md:text-4xl font-extrabold text-yellow-400 font-mono mt-1">{prayerTimes.dhuhr}</span>
        </div>
        <div className="bg-[#091528]/90 border border-slate-800 rounded-3xl p-4 md:p-5 text-center flex flex-col justify-center shadow-lg">
          <span className="text-slate-400 text-sm font-bold">العصر</span>
          <span className="text-3xl md:text-4xl font-extrabold text-orange-400 font-mono mt-1">{prayerTimes.asr}</span>
        </div>
        <div className="bg-[#091528]/90 border border-slate-800 rounded-3xl p-4 md:p-5 text-center flex flex-col justify-center shadow-lg">
          <span className="text-slate-400 text-sm font-bold">المغرب</span>
          <span className="text-3xl md:text-4xl font-extrabold text-rose-400 font-mono mt-1">{prayerTimes.maghrib}</span>
        </div>
        <div className="bg-[#091528]/90 border border-slate-800 rounded-3xl p-4 md:p-5 text-center flex flex-col justify-center shadow-lg">
          <span className="text-slate-400 text-sm font-bold">العشاء</span>
          <span className="text-3xl md:text-4xl font-extrabold text-indigo-400 font-mono mt-1">{prayerTimes.isha}</span>
        </div>
      </div>
    </div>
  );
};
