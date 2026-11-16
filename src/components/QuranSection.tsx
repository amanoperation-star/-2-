import React, { useState } from 'react';
import { BookOpen, Search, Sparkles } from 'lucide-react';
import { NAMES_OF_ALLAH } from '../utils/islamicData';

export const QuranSection: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredNames = NAMES_OF_ALLAH.filter(
    item =>
      item.name.includes(searchTerm) ||
      item.transliteration.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.meaning.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Ayat al-Kursi Featured Card */}
      <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 border border-emerald-700/40 rounded-3xl p-6 md:p-8 shadow-xl text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold">
          <Sparkles className="w-4 h-4" />
          <span>آية الكرسي العظيمة</span>
        </div>

        <p className="text-xl md:text-3xl font-bold text-white font-amiri leading-relaxed">
          اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَُّهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَن ذَا الَّذِي يَشْفَعُ عِندَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِّنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَلْأَرْضَ ۖ وَلَا يَؤُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ
        </p>

        <p className="text-xs text-slate-400">سورة البقرة - الآية 255 (من قرأها دبر كل صلاة لم يمنعه من دخول الجنة إلا أن يموت)</p>
      </div>

      {/* 99 Names of Allah */}
      <div className="bg-slate-900/80 border border-emerald-900/40 rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-2xl font-bold text-white font-amiri">أسماء الله الحسنى</h3>
            <p className="text-xs text-slate-400">لله تسعة وتسعين اسمًا، مائة إلا واحدا، من أحصاها دخل الجنة</p>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute right-3 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="ابحث عن اسم من أسماء الله..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-9 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNames.map(item => (
            <div
              key={item.number}
              className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 hover:border-emerald-600/50 transition-all space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="w-7 h-7 rounded-full bg-emerald-950 text-emerald-400 text-xs font-bold flex items-center justify-center border border-emerald-800">
                  {item.number}
                </span>
                <span className="text-xs text-slate-400 font-mono">{item.transliteration}</span>
              </div>

              <h4 className="text-2xl font-extrabold text-emerald-400 font-amiri text-right">
                {item.name}
              </h4>

              <p className="text-sm font-semibold text-slate-200">{item.meaning}</p>
              <p className="text-xs text-slate-400 leading-relaxed">{item.explanation}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
