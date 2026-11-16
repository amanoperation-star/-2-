import React, { useState } from 'react';
import { Volume2, Square, X, Check, BookOpen, Share2 } from 'lucide-react';
import { adhanPlayer, getDuaSource } from '../utils/audioAdhan';
import { UserSettings } from '../types';

interface DuaModalProps {
  isOpen: boolean;
  onClose: () => void;
  prayerNameAr: string;
  settings: UserSettings;
}

export const DuaModal: React.FC<DuaModalProps> = ({ isOpen, onClose, prayerNameAr, settings }) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  React.useEffect(() => {
    const unsub = adhanPlayer.subscribe({
      onStateChange: (state, type) => {
        setIsPlaying(state === 'playing' && type === 'dua');
      },
    });
    return () => unsub();
  }, []);

  if (!isOpen) return null;

  const duaSource = getDuaSource(settings.duaAudioReciter);
  const duaText =
    'اللَّهُمَّ رَبَّ هَذِهِ الدَّعْوَةِ التَّامَّةِ، وَالصَّلَاةِ القَائِمَةِ، آتِ مُحَمَّدًا الوَسِيلَةَ وَالفَضِيلَةَ، وَابْعَثْهُ مَقَامًا مَحْمُودًا الَّذِي وَعَدْتَهُ، [إِنَّكَ لَا تُخْلِفُ المِيعَادَ]';

  const handleToggleAudio = () => {
    if (isPlaying) {
      adhanPlayer.stop();
    } else {
      adhanPlayer.playDua(duaSource.id);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(duaText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-gradient-to-br from-[#0a192f] via-[#091528] to-[#040e1b] border border-emerald-500/50 rounded-3xl p-6 md:p-8 shadow-2xl text-center space-y-5">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 rounded-xl bg-slate-800/80 text-slate-300 hover:bg-slate-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Badge & Title */}
        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
          <BookOpen className="w-3.5 h-3.5" />
          <span>سنة نبوية مؤكدة بعد أذان {prayerNameAr}</span>
        </div>

        <h3 className="text-2xl font-bold text-white font-amiri tracking-wide">
          دعاء ما بعد الأذان
        </h3>
        <p className="text-xs text-amber-300/90 font-medium">{duaSource.nameAr}</p>

        {/* Dua Box */}
        <div className="bg-[#051122]/90 border border-emerald-900/60 rounded-2xl p-6 shadow-inner space-y-3">
          <p className="text-xl md:text-2xl font-bold text-amber-200 font-amiri leading-relaxed text-center">
            «{duaText}»
          </p>
          <p className="text-xs text-slate-400">
            صحيح البخاري • قال رسول الله ﷺ: «مَن قالَ حِينَ يَسْمَعُ النِّدَاءَ... حَلَّتْ له شَفَاعَتي يَومَ القِيَامَةِ»
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={handleToggleAudio}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all shadow-lg ${
              isPlaying
                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-950/50 ring-2 ring-rose-400/50'
                : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-black hover:from-emerald-400 hover:to-teal-500 shadow-emerald-950/50'
            }`}
          >
            {isPlaying ? (
              <>
                <Square className="w-4 h-4 fill-current" />
                <span>إيقاف الدعاء</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4" />
                <span>سماع الدعاء الآن</span>
              </>
            )}
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            <span>{copied ? 'تم النسخ' : 'نسخ الدعاء'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
