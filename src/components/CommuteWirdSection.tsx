import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookOpen,
  Check,
  Eye,
  EyeOff,
  List,
  Minus,
  Moon,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Sun,
  TrainFront,
  X,
} from 'lucide-react';

type TripMode = 'go' | 'return';

interface SurahMeta {
  number: number;
  nameAr: string;
  ayahCount: number;
  revelationType: 'مكية' | 'مدنية';
  juzStart: number;
  juzEnd: number;
}

interface AyahItem {
  numberInSurah: number;
  text: string;
}

interface CommuteCardItem {
  id: string;
  category: string;
  titleAr: string;
  textAr: string;
  benefitAr: string;
  surahNumber?: number;
  hasanatPerFlip: number;
}

interface IntentionInsight {
  id: string;
  titleAr: string;
  messageAr: string;
  actionAr: string;
}

interface SilentCharityItem {
  id: string;
  titleAr: string;
  subAr: string;
  hasanat: number;
}

interface TreasureDhikr {
  id: string;
  textAr: string;
  virtueAr: string;
  hasanatPerTap: number;
}

const STORAGE_KEY = 'al_mawaqeet_commute_wird_state_v1';
const BOOKMARK_STORAGE_KEY = 'al_mawaqeet_commute_bookmark_v1';
const SURAH_CACHE_PREFIX = 'al_mawaqeet_surah_cache_v1_';

const TO_ARABIC_MAP: Record<string, string> = {
  '0': '٠',
  '1': '١',
  '2': '٢',
  '3': '٣',
  '4': '٤',
  '5': '٥',
  '6': '٦',
  '7': '٧',
  '8': '٨',
  '9': '٩',
};

function toAr(value: number | string): string {
  return String(value).replace(/\d/g, (d) => TO_ARABIC_MAP[d] ?? d);
}

function normalizeSearchInput(raw: string): string {
  return raw
    .trim()
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .toLowerCase();
}

function vibrateDevice(pattern: number | number[]) {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(pattern);
    }
  } catch {
    // Ignore vibration errors on unsupported browsers
  }
}

const SURAH_CATALOG: SurahMeta[] = [
  { number: 1, nameAr: 'الفاتحة', ayahCount: 7, revelationType: 'مكية', juzStart: 1, juzEnd: 1 },
  { number: 2, nameAr: 'البقرة', ayahCount: 286, revelationType: 'مدنية', juzStart: 1, juzEnd: 3 },
  { number: 3, nameAr: 'آل عمران', ayahCount: 200, revelationType: 'مدنية', juzStart: 3, juzEnd: 4 },
  { number: 4, nameAr: 'النساء', ayahCount: 176, revelationType: 'مدنية', juzStart: 4, juzEnd: 6 },
  { number: 5, nameAr: 'المائدة', ayahCount: 120, revelationType: 'مدنية', juzStart: 6, juzEnd: 7 },
  { number: 6, nameAr: 'الأنعام', ayahCount: 165, revelationType: 'مكية', juzStart: 7, juzEnd: 8 },
  { number: 7, nameAr: 'الأعراف', ayahCount: 206, revelationType: 'مكية', juzStart: 8, juzEnd: 9 },
  { number: 8, nameAr: 'الأنفال', ayahCount: 75, revelationType: 'مدنية', juzStart: 9, juzEnd: 10 },
  { number: 9, nameAr: 'التوبة', ayahCount: 129, revelationType: 'مدنية', juzStart: 10, juzEnd: 11 },
  { number: 10, nameAr: 'يونس', ayahCount: 109, revelationType: 'مكية', juzStart: 11, juzEnd: 11 },
  { number: 11, nameAr: 'هود', ayahCount: 123, revelationType: 'مكية', juzStart: 11, juzEnd: 12 },
  { number: 12, nameAr: 'يوسف', ayahCount: 111, revelationType: 'مكية', juzStart: 12, juzEnd: 13 },
  { number: 13, nameAr: 'الرعد', ayahCount: 43, revelationType: 'مدنية', juzStart: 13, juzEnd: 13 },
  { number: 14, nameAr: 'إبراهيم', ayahCount: 52, revelationType: 'مكية', juzStart: 13, juzEnd: 13 },
  { number: 15, nameAr: 'الحجر', ayahCount: 99, revelationType: 'مكية', juzStart: 14, juzEnd: 14 },
  { number: 16, nameAr: 'النحل', ayahCount: 128, revelationType: 'مكية', juzStart: 14, juzEnd: 14 },
  { number: 17, nameAr: 'الإسراء', ayahCount: 111, revelationType: 'مكية', juzStart: 15, juzEnd: 15 },
  { number: 18, nameAr: 'الكهف', ayahCount: 110, revelationType: 'مكية', juzStart: 15, juzEnd: 16 },
  { number: 19, nameAr: 'مريم', ayahCount: 98, revelationType: 'مكية', juzStart: 16, juzEnd: 16 },
  { number: 20, nameAr: 'طه', ayahCount: 135, revelationType: 'مكية', juzStart: 16, juzEnd: 16 },
  { number: 21, nameAr: 'الأنبياء', ayahCount: 112, revelationType: 'مكية', juzStart: 17, juzEnd: 17 },
  { number: 22, nameAr: 'الحج', ayahCount: 78, revelationType: 'مدنية', juzStart: 17, juzEnd: 17 },
  { number: 23, nameAr: 'المؤمنون', ayahCount: 118, revelationType: 'مكية', juzStart: 18, juzEnd: 18 },
  { number: 24, nameAr: 'النور', ayahCount: 64, revelationType: 'مدنية', juzStart: 18, juzEnd: 18 },
  { number: 25, nameAr: 'الفرقان', ayahCount: 77, revelationType: 'مكية', juzStart: 18, juzEnd: 19 },
  { number: 26, nameAr: 'الشعراء', ayahCount: 227, revelationType: 'مكية', juzStart: 19, juzEnd: 19 },
  { number: 27, nameAr: 'النمل', ayahCount: 93, revelationType: 'مكية', juzStart: 19, juzEnd: 20 },
  { number: 28, nameAr: 'القصص', ayahCount: 88, revelationType: 'مكية', juzStart: 20, juzEnd: 20 },
  { number: 29, nameAr: 'العنكبوت', ayahCount: 69, revelationType: 'مكية', juzStart: 20, juzEnd: 21 },
  { number: 30, nameAr: 'الروم', ayahCount: 60, revelationType: 'مكية', juzStart: 21, juzEnd: 21 },
  { number: 31, nameAr: 'لقمان', ayahCount: 34, revelationType: 'مكية', juzStart: 21, juzEnd: 21 },
  { number: 32, nameAr: 'السجدة', ayahCount: 30, revelationType: 'مكية', juzStart: 21, juzEnd: 21 },
  { number: 33, nameAr: 'الأحزاب', ayahCount: 73, revelationType: 'مدنية', juzStart: 21, juzEnd: 22 },
  { number: 34, nameAr: 'سبأ', ayahCount: 54, revelationType: 'مكية', juzStart: 22, juzEnd: 22 },
  { number: 35, nameAr: 'فاطر', ayahCount: 45, revelationType: 'مكية', juzStart: 22, juzEnd: 22 },
  { number: 36, nameAr: 'يس', ayahCount: 83, revelationType: 'مكية', juzStart: 22, juzEnd: 23 },
  { number: 37, nameAr: 'الصافات', ayahCount: 182, revelationType: 'مكية', juzStart: 23, juzEnd: 23 },
  { number: 38, nameAr: 'ص', ayahCount: 88, revelationType: 'مكية', juzStart: 23, juzEnd: 23 },
  { number: 39, nameAr: 'الزمر', ayahCount: 75, revelationType: 'مكية', juzStart: 23, juzEnd: 24 },
  { number: 40, nameAr: 'غافر', ayahCount: 85, revelationType: 'مكية', juzStart: 24, juzEnd: 24 },
  { number: 41, nameAr: 'فصلت', ayahCount: 54, revelationType: 'مكية', juzStart: 24, juzEnd: 25 },
  { number: 42, nameAr: 'الشورى', ayahCount: 53, revelationType: 'مكية', juzStart: 25, juzEnd: 25 },
  { number: 43, nameAr: 'الزخرف', ayahCount: 89, revelationType: 'مكية', juzStart: 25, juzEnd: 25 },
  { number: 44, nameAr: 'الدخان', ayahCount: 59, revelationType: 'مكية', juzStart: 25, juzEnd: 25 },
  { number: 45, nameAr: 'الجاثية', ayahCount: 37, revelationType: 'مكية', juzStart: 25, juzEnd: 25 },
  { number: 46, nameAr: 'الأحقاف', ayahCount: 35, revelationType: 'مكية', juzStart: 26, juzEnd: 26 },
  { number: 47, nameAr: 'محمد', ayahCount: 38, revelationType: 'مدنية', juzStart: 26, juzEnd: 26 },
  { number: 48, nameAr: 'الفتح', ayahCount: 29, revelationType: 'مدنية', juzStart: 26, juzEnd: 26 },
  { number: 49, nameAr: 'الحجرات', ayahCount: 18, revelationType: 'مدنية', juzStart: 26, juzEnd: 26 },
  { number: 50, nameAr: 'ق', ayahCount: 45, revelationType: 'مكية', juzStart: 26, juzEnd: 26 },
  { number: 51, nameAr: 'الذاريات', ayahCount: 60, revelationType: 'مكية', juzStart: 26, juzEnd: 27 },
  { number: 52, nameAr: 'الطور', ayahCount: 49, revelationType: 'مكية', juzStart: 27, juzEnd: 27 },
  { number: 53, nameAr: 'النجم', ayahCount: 62, revelationType: 'مكية', juzStart: 27, juzEnd: 27 },
  { number: 54, nameAr: 'القمر', ayahCount: 55, revelationType: 'مكية', juzStart: 27, juzEnd: 27 },
  { number: 55, nameAr: 'الرحمن', ayahCount: 78, revelationType: 'مدنية', juzStart: 27, juzEnd: 27 },
  { number: 56, nameAr: 'الواقعة', ayahCount: 96, revelationType: 'مكية', juzStart: 27, juzEnd: 27 },
  { number: 57, nameAr: 'الحديد', ayahCount: 29, revelationType: 'مدنية', juzStart: 27, juzEnd: 27 },
  { number: 58, nameAr: 'المجادلة', ayahCount: 22, revelationType: 'مدنية', juzStart: 28, juzEnd: 28 },
  { number: 59, nameAr: 'الحشر', ayahCount: 24, revelationType: 'مدنية', juzStart: 28, juzEnd: 28 },
  { number: 60, nameAr: 'الممتحنة', ayahCount: 13, revelationType: 'مدنية', juzStart: 28, juzEnd: 28 },
  { number: 61, nameAr: 'الصف', ayahCount: 14, revelationType: 'مدنية', juzStart: 28, juzEnd: 28 },
  { number: 62, nameAr: 'الجمعة', ayahCount: 11, revelationType: 'مدنية', juzStart: 28, juzEnd: 28 },
  { number: 63, nameAr: 'المنافقون', ayahCount: 11, revelationType: 'مدنية', juzStart: 28, juzEnd: 28 },
  { number: 64, nameAr: 'التغابن', ayahCount: 18, revelationType: 'مدنية', juzStart: 28, juzEnd: 28 },
  { number: 65, nameAr: 'الطلاق', ayahCount: 12, revelationType: 'مدنية', juzStart: 28, juzEnd: 28 },
  { number: 66, nameAr: 'التحريم', ayahCount: 12, revelationType: 'مدنية', juzStart: 28, juzEnd: 28 },
  { number: 67, nameAr: 'الملك', ayahCount: 30, revelationType: 'مكية', juzStart: 29, juzEnd: 29 },
  { number: 68, nameAr: 'القلم', ayahCount: 52, revelationType: 'مكية', juzStart: 29, juzEnd: 29 },
  { number: 69, nameAr: 'الحاقة', ayahCount: 52, revelationType: 'مكية', juzStart: 29, juzEnd: 29 },
  { number: 70, nameAr: 'المعارج', ayahCount: 44, revelationType: 'مكية', juzStart: 29, juzEnd: 29 },
  { number: 71, nameAr: 'نوح', ayahCount: 28, revelationType: 'مكية', juzStart: 29, juzEnd: 29 },
  { number: 72, nameAr: 'الجن', ayahCount: 28, revelationType: 'مكية', juzStart: 29, juzEnd: 29 },
  { number: 73, nameAr: 'المزمل', ayahCount: 20, revelationType: 'مكية', juzStart: 29, juzEnd: 29 },
  { number: 74, nameAr: 'المدثر', ayahCount: 56, revelationType: 'مكية', juzStart: 29, juzEnd: 29 },
  { number: 75, nameAr: 'القيامة', ayahCount: 40, revelationType: 'مكية', juzStart: 29, juzEnd: 29 },
  { number: 76, nameAr: 'الإنسان', ayahCount: 31, revelationType: 'مدنية', juzStart: 29, juzEnd: 29 },
  { number: 77, nameAr: 'المرسلات', ayahCount: 50, revelationType: 'مكية', juzStart: 29, juzEnd: 29 },
  { number: 78, nameAr: 'النبأ', ayahCount: 40, revelationType: 'مكية', juzStart: 30, juzEnd: 30 },
  { number: 79, nameAr: 'النازعات', ayahCount: 46, revelationType: 'مكية', juzStart: 30, juzEnd: 30 },
  { number: 80, nameAr: 'عبس', ayahCount: 42, revelationType: 'مكية', juzStart: 30, juzEnd: 30 },
  { number: 81, nameAr: 'التكوير', ayahCount: 29, revelationType: 'مكية', juzStart: 30, juzEnd: 30 },
  { number: 82, nameAr: 'الانفطار', ayahCount: 19, revelationType: 'مكية', juzStart: 30, juzEnd: 30 },
  { number: 83, nameAr: 'المطففين', ayahCount: 36, revelationType: 'مكية', juzStart: 30, juzEnd: 30 },
  { number: 84, nameAr: 'الانشقاق', ayahCount: 25, revelationType: 'مكية', juzStart: 30, juzEnd: 30 },
  { number: 85, nameAr: 'البروج', ayahCount: 22, revelationType: 'مكية', juzStart: 30, juzEnd: 30 },
  { number: 86, nameAr: 'الطارق', ayahCount: 17, revelationType: 'مكية', juzStart: 30, juzEnd: 30 },
  { number: 87, nameAr: 'الأعلى', ayahCount: 19, revelationType: 'مكية', juzStart: 30, juzEnd: 30 },
  { number: 88, nameAr: 'الغاشية', ayahCount: 26, revelationType: 'مكية', juzStart: 30, juzEnd: 30 },
  { number: 89, nameAr: 'الفجر', ayahCount: 30, revelationType: 'مكية', juzStart: 30, juzEnd: 30 },
  { number: 90, nameAr: 'البلد', ayahCount: 20, revelationType: 'مكية', juzStart: 30, juzEnd: 30 },
  { number: 91, nameAr: 'الشمس', ayahCount: 15, revelationType: 'مكية', juzStart: 30, juzEnd: 30 },
  { number: 92, nameAr: 'الليل', ayahCount: 21, revelationType: 'مكية', juzStart: 30, juzEnd: 30 },
  { number: 93, nameAr: 'الضحى', ayahCount: 11, revelationType: 'مكية', juzStart: 30, juzEnd: 30 },
  { number: 94, nameAr: 'الشرح', ayahCount: 8, revelationType: 'مكية', juzStart: 30, juzEnd: 30 },
  { number: 95, nameAr: 'التين', ayahCount: 8, revelationType: 'مكية', juzStart: 30, juzEnd: 30 },
  { number: 96, nameAr: 'العلق', ayahCount: 19, revelationType: 'مكية', juzStart: 30, juzEnd: 30 },
  { number: 97, nameAr: 'القدر', ayahCount: 5, revelationType: 'مكية', juzStart: 30, juzEnd: 30 },
  { number: 98, nameAr: 'البينة', ayahCount: 8, revelationType: 'مدنية', juzStart: 30, juzEnd: 30 },
  { number: 99, nameAr: 'الزلزلة', ayahCount: 8, revelationType: 'مدنية', juzStart: 30, juzEnd: 30 },
  { number: 100, nameAr: 'العاديات', ayahCount: 11, revelationType: 'مكية', juzStart: 30, juzEnd: 30 },
  { number: 101, nameAr: 'القارعة', ayahCount: 11, revelationType: 'مكية', juzStart: 30, juzEnd: 30 },
  { number: 102, nameAr: 'التكاثر', ayahCount: 8, revelationType: 'مكية', juzStart: 30, juzEnd: 30 },
  { number: 103, nameAr: 'العصر', ayahCount: 3, revelationType: 'مكية', juzStart: 30, juzEnd: 30 },
  { number: 104, nameAr: 'الهمزة', ayahCount: 9, revelationType: 'مكية', juzStart: 30, juzEnd: 30 },
  { number: 105, nameAr: 'الفيل', ayahCount: 5, revelationType: 'مكية', juzStart: 30, juzEnd: 30 },
  { number: 106, nameAr: 'قريش', ayahCount: 4, revelationType: 'مكية', juzStart: 30, juzEnd: 30 },
  { number: 107, nameAr: 'الماعون', ayahCount: 7, revelationType: 'مكية', juzStart: 30, juzEnd: 30 },
  { number: 108, nameAr: 'الكوثر', ayahCount: 3, revelationType: 'مكية', juzStart: 30, juzEnd: 30 },
  { number: 109, nameAr: 'الكافرون', ayahCount: 6, revelationType: 'مكية', juzStart: 30, juzEnd: 30 },
  { number: 110, nameAr: 'النصر', ayahCount: 3, revelationType: 'مدنية', juzStart: 30, juzEnd: 30 },
  { number: 111, nameAr: 'المسد', ayahCount: 5, revelationType: 'مكية', juzStart: 30, juzEnd: 30 },
  { number: 112, nameAr: 'الإخلاص', ayahCount: 4, revelationType: 'مكية', juzStart: 30, juzEnd: 30 },
  { number: 113, nameAr: 'الفلق', ayahCount: 5, revelationType: 'مكية', juzStart: 30, juzEnd: 30 },
  { number: 114, nameAr: 'الناس', ayahCount: 6, revelationType: 'مكية', juzStart: 30, juzEnd: 30 },
];

// Embedded offline fallback Surahs for underground Metro / zero-signal tunnels
const OFFLINE_FALLBACK_SURAHS: Record<number, { isExcerpt?: boolean; ayahs: AyahItem[] }> = {
  1: {
    ayahs: [
      { numberInSurah: 1, text: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ' },
      { numberInSurah: 2, text: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ' },
      { numberInSurah: 3, text: 'الرَّحْمَٰنِ الرَّحِيمِ' },
      { numberInSurah: 4, text: 'مَالِكِ يَوْمِ الدِّينِ' },
      { numberInSurah: 5, text: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ' },
      { numberInSurah: 6, text: 'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ' },
      { numberInSurah: 7, text: 'صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ' },
    ],
  },
  18: {
    isExcerpt: true,
    ayahs: [
      { numberInSurah: 1, text: 'الْحَمْدُ لِلَّهِ الَّذِي أَنزَلَ عَلَىٰ عَبْدِهِ الْكِتَابَ وَلَمْ يَجْعَل لَّهُ عِوَجَا ۜ' },
      { numberInSurah: 2, text: 'قَيِّمًا لِّيُنذِرَ بَأْسًا شَدِيدًا مِّن لَّدُنْهُ وَيُبَشِّرَ الْمُؤْمِنِينَ الَّذِينَ يَعْمَلُونَ الصَّالِحَاتِ أَنَّ لَهُمْ أَجْرًا حَسَنًا' },
      { numberInSurah: 3, text: 'مَّاكِثِينَ فِيهِ أَبَدًا' },
      { numberInSurah: 4, text: 'وَيُنذِرَ الَّذِينَ قَالُوا اتَّخَذَ اللَّهُ وَلَدًا' },
      { numberInSurah: 5, text: 'مَّا لَهُم بِهِ مِنْ عِلْمٍ وَلَا لِآبَائِهِمْ ۚ كَبُرَتْ كَلِمَةً تَخْرُجُ مِنْ أَفْوَاهِهِمْ ۚ إِن يَقُولُونَ إِلَّا كَذِبًا' },
      { numberInSurah: 6, text: 'فَلَعَلَّكَ بَاخِعٌ نَّفْسَكَ عَلَىٰ آثَارِهِمْ إِن لَّمْ يُؤْمِنُوا بِهَٰذَا الْحَدِيثِ أَسَفًا' },
      { numberInSurah: 7, text: 'إِنَّا جَعَلْنَا مَا عَلَى الْأَرْضِ زِينَةً لَّهَا لِنَبْلُوَهُمْ أَيُّهُمْ أَحْسَنُ عَمَلًا' },
      { numberInSurah: 8, text: 'وَإِنَّا لَجَاعِلُونَ مَا عَلَيْهَا صَعِيدًا جُرُزًا' },
      { numberInSurah: 9, text: 'أَمْ حَسِبْتَ أَنَّ أَصْحَابَ الْكَهْفِ وَالرَّقِيمِ كَانُوا مِنْ آيَاتِنَا عَجَبًا' },
      { numberInSurah: 10, text: 'إِذْ أَوَى الْفِتْيَةُ إِلَى الْكَهْفِ فَقَالُوا رَبَّنَا آتِنَا مِن لَّدُنكَ رَحْمَةً وَهَيِّئْ لَنَا مِنْ أَمْرِنَا رَشَدًا' },
      { numberInSurah: 107, text: 'إِنَّ الَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ كَانَتْ لَهُمْ جَنَّاتُ الْفِرْدَوْسِ نُزُلًا' },
      { numberInSurah: 108, text: 'خَالِدِينَ فِيهَا لَا يَبْغُونَ عَنْهَا حِوَلًا' },
      { numberInSurah: 109, text: 'قُل لَّوْ كَانَ الْبَحْرُ مِدَادًا لِّكَلِمَاتِ رَبِّي لَنَفِدَ الْبَحْرُ قَبْلَ أَن تَنفَدَ كَلِمَاتُ رَبِّي وَلَوْ جِئْنَا بِمِثْلِهِ مَدَدًا' },
      { numberInSurah: 110, text: 'قُلْ إِنَّمَا أَنَا بَشَرٌ مِّثْلُكُمْ يُوحَىٰ إِلَيَّ أَنَّمَا إِلَٰهُكُمْ إِلَٰهٌ وَاحِدٌ ۖ فَمَن كَانَ يَرْجُو لِقَاءَ رَبِّهِ فَلْيَعْمَلْ عَمَلًا صَالِحًا وَلَا يُشْرِكْ بِعِبَادَةِ رَبِّهِ أَحَدًا' },
    ],
  },
  67: {
    ayahs: [
      { numberInSurah: 1, text: 'تَبَارَكَ الَّذِي بِيَدِهِ الْمُلْكُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ' },
      { numberInSurah: 2, text: 'الَّذِي خَلَقَ الْمَوْتَ وَالْحَيَاةَ لِيَبْلُوَكُمْ أَيُّكُمْ أَحْسَنُ عَمَلًا ۚ وَهُوَ الْعَزِيزُ الْغَفُورُ' },
      { numberInSurah: 3, text: 'الَّذِي خَلَقَ سَبْعَ سَمَاوَاتٍ طِبَاقًا ۖ مَّا تَرَىٰ فِي خَلْقِ الرَّحْمَٰنِ مِن تَفَاوُتٍ ۖ فَارْجِعِ الْبَصَرَ هَلْ تَرَىٰ مِن فُطُورٍ' },
      { numberInSurah: 4, text: 'ثُمَّ ارْجِعِ الْبَصَرَ كَرَّتَيْنِ يَنقَلِبْ إِلَيْكَ الْبَصَرُ خَاسِئًا وَهُوَ حَسِيرٌ' },
      { numberInSurah: 5, text: 'وَلَقَدْ زَيَّنَّا السَّمَاءَ الدُّنْيَا بِمَصَابِيحَ وَجَعَلْنَاهَا رُجُومًا لِّلشَّيَاطِينِ ۖ وَأَعْتَدْنَا لَهُمْ عَذَابَ السَّعِيرِ' },
      { numberInSurah: 6, text: 'وَلِلَّذِينَ كَفَرُوا بِرَبِّهِمْ عَذَابُ جَهَنَّمَ ۖ وَبِئْسَ الْمَصِيرُ' },
      { numberInSurah: 7, text: 'إِذَا أُلْقُوا فِيهَا سَمِعُوا لَهَا شَهِيقًا وَهِيَ تَفُورُ' },
      { numberInSurah: 8, text: 'تَكَادُ تَمَيَّزُ مِنَ الْغَيْظِ ۖ كُلَّمَا أُلْقِيَ فِيهَا فَوْجٌ سَأَلَهُمْ خَزَنَتُهَا أَلَمْ يَأْتِكُمْ نَذِيرٌ' },
      { numberInSurah: 9, text: 'قَالُوا بَلَىٰ قَدْ جَاءَنَا نَذِيرٌ فَكَذَّبْنَا وَقُلْنَا مَا نَزَّلَ اللَّهُ مِن شَيْءٍ إِنْ أَنتُمْ إِلَّا فِي ضَلَالٍ كَبِيرٍ' },
      { numberInSurah: 10, text: 'وَقَالُوا لَوْ كُنَّا نَسْمَعُ أَوْ نَعْقِلُ مَا كُنَّا فِي أَصْحَابِ السَّعِيرِ' },
      { numberInSurah: 11, text: 'فَاعْتَرَفُوا بِذَنبِهِمْ فَسُحْقًا لِّأَصْحَابِ السَّعِيرِ' },
      { numberInSurah: 12, text: 'إِنَّ الَّذِينَ يَخْشَوْنَ رَبَّهُم بِالْغَيْبِ لَهُم مَّغْفِرَةٌ وَأَجْرٌ كَبِيرٌ' },
      { numberInSurah: 13, text: 'وَأَسِرُّوا قَوْلَكُمْ أَوِ اجْهَرُوا بِهِ ۖ إِنَّهُ عَلِيمٌ بِذَاتِ الصُّدُورِ' },
      { numberInSurah: 14, text: 'أَلَا يَعْلَمُ مَنْ خَلَقَ وَهُوَ اللَّطِيفُ الْخَبِيرُ' },
      { numberInSurah: 15, text: 'هُوَ الَّذِي جَعَلَ لَكُمُ الْأَرْضَ ذَلُولًا فَامْشُوا فِي مَنَاكِبِهَا وَكُلُوا مِن رِّزْقِهِ ۖ وَإِلَيْهِ النُّشُورُ' },
      { numberInSurah: 16, text: 'أَأَمِنتُم مَّن فِي السَّمَاءِ أَن يَخْسِفَ بِكُمُ الْأَرْضَ فَإِذَا هِيَ تَمُورُ' },
      { numberInSurah: 17, text: 'أَمْ أَمِنتُم مَّن فِي السَّمَاءِ أَن يُرْسِلَ عَلَيْكُمْ حَاصِبًا ۖ فَسَتَعْلَمُونَ كَيْفَ نَذِيرِ' },
      { numberInSurah: 18, text: 'وَلَقَدْ كَذَّبَ الَّذِينَ مِن قَبْلِهِمْ فَكَيْفَ كَانَ نَكِيرِ' },
      { numberInSurah: 19, text: 'أَوَلَمْ يَرَوْا إِلَى الطَّيْرِ فَوْقَهُمْ صَافَّاتٍ وَيَقْبِضْنَ ۚ مَا يُمْسِكُهُنَّ إِلَّا الرَّحْمَٰنُ ۚ إِنَّهُ بِكُلِّ شَيْءٍ بَصِيرٌ' },
      { numberInSurah: 20, text: 'أَمَّنْ هَٰذَا الَّذِي هُوَ جُندٌ لَّكُمْ يَنصُرُكُم مِّن دُونِ الرَّحْمَٰنِ ۚ إِنِ الْكَافِرُونَ إِلَّا فِي غُرُورٍ' },
      { numberInSurah: 21, text: 'أَمَّنْ هَٰذَا الَّذِي يَرْزُقُكُمْ إِنْ أَمْسَكَ رِزْقَهُ ۚ بَل لَّجُّوا فِي عُتُوٍّ وَنُفُورٍ' },
      { numberInSurah: 22, text: 'أَفَمَن يَمْشِي مُكِبًّا عَلَىٰ وَجْهِهِ أَهْدَىٰ أَمَّن يَمْشِي سَوِيًّا عَلَىٰ صِرَاطٍ مُّسْتَقِيمٍ' },
      { numberInSurah: 23, text: 'قُلْ هُوَ الَّذِي أَنشَأَكُمْ وَجَعَلَ لَكُمُ السَّمْعَ وَالْأَبْصَارَ وَالْأَفْئِدَةَ ۖ قَلِيلًا مَّا تَشْكُرُونَ' },
      { numberInSurah: 24, text: 'قُلْ هُوَ الَّذِي ذَرَأَكُمْ فِي الْأَرْضِ وَإِلَيْهِ تُحْشَرُونَ' },
      { numberInSurah: 25, text: 'وَيَقُولُونَ مَتَىٰ هَٰذَا الْوَعْدُ إِن كُنتُمْ صَادِقِينَ' },
      { numberInSurah: 26, text: 'قُلْ إِنَّمَا الْعِلْمُ عِندَ اللَّهِ وَإِنَّمَا أَنَا نَذِيرٌ مُّبِينٌ' },
      { numberInSurah: 27, text: 'فَلَمَّا رَأَوْهُ زُلْفَةً سِيئَتْ وُجُوهُ الَّذِينَ كَفَرُوا وَقِيلَ هَٰذَا الَّذِي كُنتُم بِهِ تَدَّعُونَ' },
      { numberInSurah: 28, text: 'قُلْ أَرَأَيْتُمْ إِنْ أَهْلَكَنِيَ اللَّهُ وَمَن مَّعِيَ أَوْ رَحِمَنَا فَمَن يُجِيرُ الْكَافِرِينَ مِنْ عَذَابٍ أَلِيمٍ' },
      { numberInSurah: 29, text: 'قُلْ هُوَ الرَّحْمَٰنُ آمَنَّا بِهِ وَعَلَيْهِ تَوَكَّلْنَا ۖ فَسَتَعْلَمُونَ مَنْ هُوَ فِي ضَلَالٍ مُّبِينٍ' },
      { numberInSurah: 30, text: 'قُلْ أَرَأَيْتُمْ إِنْ أَصْبَحَ مَاؤُكُمْ غَوْرًا فَمَن يَأْتِيكُم بِمَاءٍ مَّعِينٍ' },
    ],
  },
  103: {
    ayahs: [
      { numberInSurah: 1, text: 'وَالْعَصْرِ' },
      { numberInSurah: 2, text: 'إِنَّ الْإِنسَانَ لَفِي خُسْرٍ' },
      { numberInSurah: 3, text: 'إِلَّا الَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ وَتَوَاصَوْا بِالْحَقِّ وَتَوَاصَوْا بِالصَّبْرِ' },
    ],
  },
  112: {
    ayahs: [
      { numberInSurah: 1, text: 'قُلْ هُوَ اللَّهُ أَحَدٌ' },
      { numberInSurah: 2, text: 'اللَّهُ الصَّمَدُ' },
      { numberInSurah: 3, text: 'لَمْ يَلِدْ وَلَمْ يُولَدْ' },
      { numberInSurah: 4, text: 'وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ' },
    ],
  },
  113: {
    ayahs: [
      { numberInSurah: 1, text: 'قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ' },
      { numberInSurah: 2, text: 'مِن شَرِّ مَا خَلَقَ' },
      { numberInSurah: 3, text: 'وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ' },
      { numberInSurah: 4, text: 'وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ' },
      { numberInSurah: 5, text: 'وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ' },
    ],
  },
  114: {
    ayahs: [
      { numberInSurah: 1, text: 'قُلْ أَعُوذُ بِرَبِّ النَّاسِ' },
      { numberInSurah: 2, text: 'مَلِكِ النَّاسِ' },
      { numberInSurah: 3, text: 'إِلَٰهِ النَّاسِ' },
      { numberInSurah: 4, text: 'مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ' },
      { numberInSurah: 5, text: 'الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ' },
      { numberInSurah: 6, text: 'مِنَ الْجِنَّةِ وَالنَّاسِ' },
    ],
  },
};

const INTENTION_INSIGHTS: IntentionInsight[] = [
  {
    id: 'jabr',
    titleAr: 'نية جبر الخواطر وإدخال السرور',
    messageAr: 'انْوِ اليوم أن تكون سبباً في تيسير أمرٍ لمسلم، أو كلمةً طيبة تُذهب همّ زميل أو عابر طريق؛ فأحب الأعمال إلى الله سرورٌ تُدخله على قلب مسلم.',
    actionAr: 'ابتسامة صادقة + مساعدة أو دعوة بظهر الغيب لأحد الركاب',
  },
  {
    id: 'tawakkul',
    titleAr: 'التوكّل واليقين بأن الرزق مقسوم',
    messageAr: 'سَعْيك في المواصلات عبادة، أما الرزق والتوفيق فمكتوبان عند الرزاق ذي القوة المتين؛ امشِ في مناكبها بقلبٍ مطمئنٍ لا يقلق.',
    actionAr: 'ردّد بقلبك: حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ عند كل محطة',
  },
  {
    id: 'ghayd',
    titleAr: 'كظم الغيظ والعفو في الزحام',
    messageAr: 'ضيق الزحام وتأخر القطارات اختبارٌ عملي للحلم؛ فمن كظم غيظه وهو قادر على أن يُنفذه دعاه الله على رؤوس الخلائق يوم القيامة.',
    actionAr: 'استعذ بالله عند أي ضيق أو تدافع، وقابل الإساءة بالصمت الكريم',
  },
  {
    id: 'ihsan',
    titleAr: 'إتقان العمل لله وطلب البركة',
    messageAr: 'تحويل ساعات الدراسة أو الوظيفة إلى عبادة يكون باستحضار نية نفع الناس وإغناء النفس بالحلال وإتقان الصنعة.',
    actionAr: 'ابدأ مهامك بـ «باسم الله توكلت على الله» بنية الإحسان',
  },
  {
    id: 'ghadd',
    titleAr: 'حفظ القلب والبصر والسمع في الطريق',
    messageAr: 'غضّ البصر في الطريق يورث نوراً وحلاوة إيمان يجدها العبد في قلبه طوال يومه، ويصون صفاء الروح قبل الوصول.',
    actionAr: 'اجعل بصرك في مصحفك أو موضع قدمك واستبدل التصفح بالذكر',
  },
];

const GO_TRIP_CARDS: CommuteCardItem[] = [
  {
    id: 'go-dua-launch',
    category: 'دعاء الانطلاق وطلب الرزق',
    titleAr: 'دعاء الخروج والتوكل على الله',
    textAr: 'بِسْمِ اللَّهِ، تَوَكَّلْتُ عَلَى اللَّهِ، وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ. اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا، وَرِزْقًا طَيِّبًا، وَعَمَلًا مُتَقَبَّلًا.',
    benefitAr: 'يُقال عند الخروج: هُديت وكُفيت ووُقيت، وتنحّى عنك الشيطان.',
    hasanatPerFlip: 30,
  },
  {
    id: 'go-sabah-afiyah',
    category: 'أذكار الصباح',
    titleAr: 'أصبحنا على فطرة الإسلام',
    textAr: 'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ. رَبِّ أَسْأَلُكَ خَيْرَ مَا فِي هَذَا الْيَوْمِ وَخَيْرَ مَا بَعْدَهُ.',
    benefitAr: 'استفتاح اليوم بالملك والحمد والتسليم الكامل لله تعالى.',
    hasanatPerFlip: 40,
  },
  {
    id: 'go-kahf-open',
    category: 'نور سورة الكهف',
    titleAr: 'دعاء الفتية بالهداية والرشاد',
    textAr: 'إِذْ أَوَى الْفِتْيَةُ إِلَى الْكَهْفِ فَقَالُوا رَبَّنَا آتِنَا مِن لَّدُنكَ رَحْمَةً وَهَيِّئْ لَنَا مِنْ أَمْرِنَا رَشَدًا ﴿١٠﴾',
    benefitAr: 'اضغط على الآية لفتح سورة الكهف كاملة في المصحف.',
    surahNumber: 18,
    hasanatPerFlip: 120,
  },
  {
    id: 'go-hasbi',
    category: 'حصن الصباح',
    titleAr: 'كفاية الهموم والمطالب',
    textAr: 'حَسْبِيَ اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ ۖ عَلَيْهِ تَوَكَّلْتُ ۖ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ.',
    benefitAr: 'من قالها حين يصبح سبعاً كفاه الله ما أهمّه من أمر الدنيا والآخرة.',
    hasanatPerFlip: 50,
  },
  {
    id: 'go-mulk-rizq',
    category: 'تلاوة السعي',
    titleAr: 'آية المشي في مناكب الأرض',
    textAr: 'هُوَ الَّذِي جَعَلَ لَكُمُ الْأَرْضَ ذَلُولًا فَامْشُوا فِي مَنَاكِبِهَا وَكُلُوا مِن رِّزْقِهِ ۖ وَإِلَيْهِ النُّشُورُ ﴿١٥﴾',
    benefitAr: 'اضغط لقراءة سورة الملك وتذكّر أن السعي من أمر الله والرزق من فضله.',
    surahNumber: 67,
    hasanatPerFlip: 100,
  },
];

const RETURN_TRIP_CARDS: CommuteCardItem[] = [
  {
    id: 'ret-sayyid',
    category: 'أذكار المساء',
    titleAr: 'سيد الاستغفار وختام اليوم',
    textAr: 'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ.',
    benefitAr: 'من قالها موقناً بها في المساء فمات من ليلته دخل الجنة.',
    hasanatPerFlip: 70,
  },
  {
    id: 'ret-mulk-open',
    category: 'سورة الملك المنجية',
    titleAr: 'تبارك الذي بيده الملك',
    textAr: 'تَبَارَكَ الَّذِي بِيَدِهِ الْمُلْكُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ ﴿١﴾ الَّذِي خَلَقَ الْمَوْتَ وَالْحَيَاةَ لِيَبْلُوَكُمْ أَيُّكُمْ أَحْسَنُ عَمَلًا ۚ وَهُوَ الْعَزِيزُ الْغَفُورُ ﴿٢﴾',
    benefitAr: 'سورة الملك المانعة من عذاب القبر — اضغط لقراءتها كاملة (٣٠ آية) حتى بدون نت.',
    surahNumber: 67,
    hasanatPerFlip: 150,
  },
  {
    id: 'ret-masa-peace',
    category: 'أذكار المساء',
    titleAr: 'أمسينا وأمسى الملك لله',
    textAr: 'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ. اللَّهُمَّ إِنِّي أَسْأَلُكَ خَيْرَ هَذِهِ اللَّيْلَةِ فَتْحَهَا وَنَصْرَهَا وَنُورَهَا وَبَرَكَتَهَا وَهُدَاهَا.',
    benefitAr: 'تجديد العهد والسكينة في طريق العودة للأهل والبيت.',
    hasanatPerFlip: 40,
  },
  {
    id: 'ret-bismillah',
    category: 'الحفظ والسكينة',
    titleAr: 'التحصين في العودة',
    textAr: 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ.',
    benefitAr: 'من قالها ثلاثاً لم يضره شيء بإذن الله حتى يصبح.',
    hasanatPerFlip: 50,
  },
  {
    id: 'ret-ikhlas',
    category: 'ثلث القرآن',
    titleAr: 'سورة الإخلاص',
    textAr: 'قُلْ هُوَ اللَّهُ أَحَدٌ ﴿١﴾ اللَّهُ الصَّمَدُ ﴿٢﴾ لَمْ يَلِدْ وَلَمْ يُولَدْ ﴿٣﴾ وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ ﴿٤﴾',
    benefitAr: 'تعدل ثلث القرآن — اضغط لفتحها أو التنقل بين المعوذات في المصحف.',
    surahNumber: 112,
    hasanatPerFlip: 100,
  },
];

const SILENT_CHARITIES: SilentCharityItem[] = [
  {
    id: 'seat',
    titleAr: 'آثرتُ غيري بمقعدي',
    subAr: 'صدقةُ رفقٍ بكبيرِ سنٍّ أو متعب',
    hasanat: 100,
  },
  {
    id: 'gaze',
    titleAr: 'حفظتُ بصري لله',
    subAr: 'عفافُ نفسٍ ونورٌ في القلب',
    hasanat: 80,
  },
  {
    id: 'smile',
    titleAr: 'تبسّمتُ في وجه مسلم',
    subAr: 'تبسّمك في وجه أخيك لك صدقة',
    hasanat: 50,
  },
  {
    id: 'dua',
    titleAr: 'دعوتُ للركاب بالفرج',
    subAr: 'ولك بمثلٍ بدعوة الملك الموكّل',
    hasanat: 90,
  },
];

const TREASURE_ADHKAR: TreasureDhikr[] = [
  {
    id: 'subhan-wabihamdih',
    textAr: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ',
    virtueAr: 'تُحطّ الخطايا وإن كانت مثل زبد البحر (١٠٠ مرة في اليوم)',
    hasanatPerTap: 100,
  },
  {
    id: 'salawat',
    textAr: 'اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّدٍ',
    virtueAr: 'من صلّى عليّ صلاةً صلّى الله عليه بها عشراً',
    hasanatPerTap: 100,
  },
  {
    id: 'baqiyat',
    textAr: 'سُبْحَانَ اللَّهِ، وَالْحَمْدُ لِلَّهِ، وَلَا إِلَهَ إِلَّا اللَّهُ، وَاللَّهُ أَكْبَرُ',
    virtueAr: 'الباقيات الصالحات أحبّ إلى الله مما طلعت عليه الشمس',
    hasanatPerTap: 40,
  },
  {
    id: 'mudaaf',
    textAr: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، عَدَدَ خَلْقِهِ، وَرِضَا نَفْسِهِ، وَزِنَةَ عَرْشِهِ، وَمِدَادَ كَلِمَاتِهِ',
    virtueAr: 'الذكر المضاعف الثقيل في الميزان يعدل ساعات من الذكر',
    hasanatPerTap: 200,
  },
  {
    id: 'hawqalah',
    textAr: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ',
    virtueAr: 'كنزٌ من كنوز الجنة ووقود الصبر في الطريق',
    hasanatPerTap: 50,
  },
];

interface PersistedCommuteState {
  tripMode: TripMode;
  stationsLeft: number;
  cardIndex: number;
  intentionIndex: number;
  treasureIndex: number;
  treasureCount: number;
  totalAdhkarTaps: number;
  hasanat: number;
  checkedCharities: string[];
  surahBookmarksCount: number;
}

const DEFAULT_COMMUTE_STATE: PersistedCommuteState = {
  tripMode: 'go',
  stationsLeft: 6,
  cardIndex: 0,
  intentionIndex: 0,
  treasureIndex: 0,
  treasureCount: 0,
  totalAdhkarTaps: 0,
  hasanat: 0,
  checkedCharities: [],
  surahBookmarksCount: 0,
};

function loadInitialCommuteState(): PersistedCommuteState {
  if (typeof window === 'undefined') return DEFAULT_COMMUTE_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_COMMUTE_STATE;
    const parsed = JSON.parse(raw) as Partial<PersistedCommuteState>;
    return {
      tripMode: parsed.tripMode === 'return' ? 'return' : 'go',
      stationsLeft: typeof parsed.stationsLeft === 'number' && parsed.stationsLeft >= 0 ? parsed.stationsLeft : 6,
      cardIndex: typeof parsed.cardIndex === 'number' ? parsed.cardIndex : 0,
      intentionIndex: typeof parsed.intentionIndex === 'number' ? parsed.intentionIndex : 0,
      treasureIndex: typeof parsed.treasureIndex === 'number' ? parsed.treasureIndex : 0,
      treasureCount: typeof parsed.treasureCount === 'number' ? parsed.treasureCount : 0,
      totalAdhkarTaps: typeof parsed.totalAdhkarTaps === 'number' ? parsed.totalAdhkarTaps : 0,
      hasanat: typeof parsed.hasanat === 'number' ? parsed.hasanat : 0,
      checkedCharities: Array.isArray(parsed.checkedCharities) ? parsed.checkedCharities : [],
      surahBookmarksCount: typeof parsed.surahBookmarksCount === 'number' ? parsed.surahBookmarksCount : 0,
    };
  } catch {
    return DEFAULT_COMMUTE_STATE;
  }
}

interface CommuteBookmark {
  surahNumber: number;
  surahNameAr: string;
  savedAt: string;
}

function loadBookmark(): CommuteBookmark | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(BOOKMARK_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CommuteBookmark;
  } catch {
    return null;
  }
}

export const CommuteWirdSection: React.FC = () => {
  const [state, setState] = useState<PersistedCommuteState>(loadInitialCommuteState);
  const [privacyShield, setPrivacyShield] = useState(false);
  const [tapPulse, setTapPulse] = useState(false);
  const [stationArrivalAlert, setStationArrivalAlert] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [bookmark, setBookmark] = useState<CommuteBookmark | null>(loadBookmark);
  const [bookmarkToast, setBookmarkToast] = useState<string | null>(null);

  // Full-Screen Mushaf Modal state
  const [isMushafOpen, setIsMushafOpen] = useState(false);
  const [mushafView, setMushafView] = useState<'index' | 'reader'>('index');
  const [surahSearch, setSurahSearch] = useState('');
  const [selectedJuz, setSelectedJuz] = useState<number>(0); // 0 = All 114
  const [activeSurahNumber, setActiveSurahNumber] = useState<number>(() => bookmark?.surahNumber || 67);
  const [surahAyahs, setSurahAyahs] = useState<AyahItem[]>([]);
  const [surahSourceNote, setSurahSourceNote] = useState<string | null>(null);
  const [isSurahLoading, setIsSurahLoading] = useState(false);
  const [surahError, setSurahError] = useState<string | null>(null);
  const [mushafFontSize, setMushafFontSize] = useState<number>(26);
  const [autoScrollActive, setAutoScrollActive] = useState(false);

  const readerScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore storage quota issues
    }
  }, [state]);

  const cards = state.tripMode === 'go' ? GO_TRIP_CARDS : RETURN_TRIP_CARDS;
  const safeCardIndex = ((state.cardIndex % cards.length) + cards.length) % cards.length;
  const currentCard = cards[safeCardIndex];
  const currentIntention = INTENTION_INSIGHTS[state.intentionIndex % INTENTION_INSIGHTS.length];
  const currentTreasure = TREASURE_ADHKAR[state.treasureIndex % TREASURE_ADHKAR.length];

  const activeSurahMeta = useMemo(
    () => SURAH_CATALOG.find((s) => s.number === activeSurahNumber) || SURAH_CATALOG[0],
    [activeSurahNumber]
  );

  const filteredSurahs = useMemo(() => {
    const query = normalizeSearchInput(surahSearch);
    return SURAH_CATALOG.filter((s) => {
      const matchesJuz =
        selectedJuz === 0 || (selectedJuz >= s.juzStart && selectedJuz <= s.juzEnd);
      if (!matchesJuz) return false;
      if (!query) return true;
      const normName = normalizeSearchInput(s.nameAr);
      return normName.includes(query) || String(s.number).includes(query);
    });
  }, [surahSearch, selectedJuz]);

  const loadSurahContent = useCallback(async (surahNum: number) => {
    setActiveSurahNumber(surahNum);
    setMushafView('reader');
    setAutoScrollActive(false);
    setSurahError(null);
    setSurahSourceNote(null);

    if (readerScrollRef.current) {
      readerScrollRef.current.scrollTop = 0;
    }

    // 1. Check localStorage cache first (instant offline metro tunnel support)
    try {
      const cached = window.localStorage.getItem(`${SURAH_CACHE_PREFIX}${surahNum}`);
      if (cached) {
        const parsed = JSON.parse(cached) as { ayahs?: AyahItem[] } | AyahItem[];
        const ayahsList = Array.isArray(parsed) ? parsed : parsed?.ayahs;
        if (Array.isArray(ayahsList) && ayahsList.length > 0) {
          setSurahAyahs(ayahsList);
          setSurahSourceNote('محفوظة محلياً • تعمل بدون إنترنت');
          return;
        }
      }
    } catch {
      // ignore invalid cache
    }

    // 2. Check embedded offline fallback first if offline, or fetch online with fallback
    const offlineFallback = OFFLINE_FALLBACK_SURAHS[surahNum];
    if (typeof navigator !== 'undefined' && !navigator.onLine && offlineFallback) {
      setSurahAyahs(offlineFallback.ayahs);
      setSurahSourceNote(
        offlineFallback.isExcerpt
          ? 'نسخة النفق السريعة بدون نت (الآيات الافتتاحية والخواتيم)'
          : 'نسخة كاملة مدمجة • تعمل بدون إنترنت'
      );
      return;
    }

    setIsSurahLoading(true);
    try {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 7000);
      const res = await fetch(`https://api.alquran.cloud/v1/surah/${surahNum}/quran-uthmani`, {
        signal: controller.signal,
      });
      window.clearTimeout(timeoutId);
      if (!res.ok) throw new Error('network');
      const data = await res.json();
      const ayahs: AyahItem[] = (data?.data?.ayahs || []).map(
        (a: { numberInSurah: number; text: string }, idx: number) => {
          let cleanText = a.text || '';
          // Strip leading Basmalah on verse 1 for surahs other than Al-Fatiha (1) & At-Tawbah (9)
          if (idx === 0 && surahNum !== 1 && surahNum !== 9) {
            cleanText = cleanText
              .replace(/^بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ\s*/u, '')
              .replace(/^بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ\s*/u, '')
              .trim();
          }
          return {
            numberInSurah: a.numberInSurah,
            text: cleanText,
          };
        }
      );

      if (ayahs.length > 0) {
        setSurahAyahs(ayahs);
        try {
          window.localStorage.setItem(`${SURAH_CACHE_PREFIX}${surahNum}`, JSON.stringify({ ayahs }));
        } catch {
          // ignore cache write failure
        }
        setSurahSourceNote('تم الحفظ تلقائياً لقراءتها لاحقاً في النفق بدون نت');
        setIsSurahLoading(false);
        return;
      }
      throw new Error('empty');
    } catch {
      if (offlineFallback) {
        setSurahAyahs(offlineFallback.ayahs);
        setSurahSourceNote(
          offlineFallback.isExcerpt
            ? 'وضع بدون نت: عرض الآيات المدمجة (الافتتاحية والخواتيم)'
            : 'وضع بدون نت: السورة كاملة مدمجة جاهزة للقراءة'
        );
      } else {
        setSurahAyahs([]);
        setSurahError(
          'تعذّر تحميل هذه السورة لضعف الشبكة داخل النفق. يمكنك قراءة السور المحفوظة أو سورة الملك، الكهف، الفاتحة، والمعوذات المدمجة فوراً بدون نت.'
        );
      }
      setIsSurahLoading(false);
    }
  }, []);

  // Auto-scroll effect inside Mushaf Reader
  useEffect(() => {
    if (!isMushafOpen || mushafView !== 'reader' || !autoScrollActive) return;
    const interval = window.setInterval(() => {
      const container = readerScrollRef.current;
      if (!container) return;
      container.scrollTop += 1.25;
      if (container.scrollTop + container.clientHeight >= container.scrollHeight - 4) {
        setAutoScrollActive(false);
      }
    }, 36);
    return () => window.clearInterval(interval);
  }, [isMushafOpen, mushafView, autoScrollActive]);

  const handleSwitchTripMode = (mode: TripMode) => {
    vibrateDevice(15);
    setState((prev) => ({
      ...prev,
      tripMode: mode,
      cardIndex: 0,
    }));
  };

  const handleAddStation = () => {
    vibrateDevice(12);
    setStationArrivalAlert(false);
    setState((prev) => ({
      ...prev,
      stationsLeft: Math.min(45, prev.stationsLeft + 1),
    }));
  };

  const handlePassStation = () => {
    setState((prev) => {
      if (prev.stationsLeft <= 0) {
        vibrateDevice([35, 50, 70]);
        setStationArrivalAlert(true);
        setIsSummaryOpen(true);
        return prev;
      }
      const nextStations = prev.stationsLeft - 1;
      const reachedEnd = nextStations === 0;
      vibrateDevice(reachedEnd ? [40, 60, 80] : 25);
      if (reachedEnd) {
        setStationArrivalAlert(true);
        window.setTimeout(() => setIsSummaryOpen(true), 320);
      }
      return {
        ...prev,
        stationsLeft: nextStations,
        cardIndex: (prev.cardIndex + 1) % cards.length,
        hasanat: prev.hasanat + currentCard.hasanatPerFlip,
      };
    });
  };

  const handleCycleCard = (delta: number) => {
    vibrateDevice(12);
    setState((prev) => ({
      ...prev,
      cardIndex: (((prev.cardIndex + delta) % cards.length) + cards.length) % cards.length,
      hasanat: prev.hasanat + 10,
    }));
  };

  const handleCycleIntention = () => {
    vibrateDevice(12);
    setState((prev) => ({
      ...prev,
      intentionIndex: (prev.intentionIndex + 1) % INTENTION_INSIGHTS.length,
    }));
  };

  const handleToggleCharity = (item: SilentCharityItem) => {
    vibrateDevice(20);
    setState((prev) => {
      const exists = prev.checkedCharities.includes(item.id);
      const nextList = exists
        ? prev.checkedCharities.filter((id) => id !== item.id)
        : [...prev.checkedCharities, item.id];
      return {
        ...prev,
        checkedCharities: nextList,
        hasanat: Math.max(0, prev.hasanat + (exists ? -item.hasanat : item.hasanat)),
      };
    });
  };

  const handleTapTreasurePad = () => {
    vibrateDevice(15);
    setTapPulse(true);
    window.setTimeout(() => setTapPulse(false), 180);
    setState((prev) => ({
      ...prev,
      treasureCount: prev.treasureCount + 1,
      totalAdhkarTaps: prev.totalAdhkarTaps + 1,
      hasanat: prev.hasanat + currentTreasure.hasanatPerTap,
    }));
  };

  const handleCycleTreasure = () => {
    vibrateDevice(14);
    setState((prev) => ({
      ...prev,
      treasureIndex: (prev.treasureIndex + 1) % TREASURE_ADHKAR.length,
      treasureCount: 0,
    }));
  };

  const handleOpenMushaf = (view: 'index' | 'reader', surahNum?: number) => {
    vibrateDevice(15);
    setIsMushafOpen(true);
    if (view === 'reader') {
      void loadSurahContent(surahNum ?? activeSurahNumber);
    } else {
      setMushafView('index');
      setAutoScrollActive(false);
    }
  };

  const handleSaveBookmark = () => {
    vibrateDevice([20, 40, 20]);
    const newBookmark: CommuteBookmark = {
      surahNumber: activeSurahMeta.number,
      surahNameAr: activeSurahMeta.nameAr,
      savedAt: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    };
    setBookmark(newBookmark);
    try {
      window.localStorage.setItem(BOOKMARK_STORAGE_KEY, JSON.stringify(newBookmark));
    } catch {
      // ignore storage errors
    }
    setState((prev) => ({
      ...prev,
      hasanat: prev.hasanat + 150,
      surahBookmarksCount: prev.surahBookmarksCount + 1,
    }));
    setBookmarkToast(`تم حفظ وقوفك عند سورة ${activeSurahMeta.nameAr} (+${toAr(150)} حسنة)`);
    window.setTimeout(() => setBookmarkToast(null), 3200);
  };

  const handleStartNewTrip = () => {
    vibrateDevice(20);
    setStationArrivalAlert(false);
    setIsSummaryOpen(false);
    setState((prev) => ({
      ...prev,
      stationsLeft: 6,
      cardIndex: 0,
      treasureCount: 0,
      totalAdhkarTaps: 0,
      hasanat: 0,
      checkedCharities: [],
      surahBookmarksCount: 0,
    }));
  };

  return (
    <section
      dir="rtl"
      className="theme-keep-light max-w-md mx-auto w-full rounded-[28px] bg-[#04130E] border border-[#D4AF37]/35 shadow-[0_20px_60px_rgba(0,0,0,0.65)] overflow-hidden text-slate-100"
    >
      {/* Subtle Royal Geometric Top Glow */}
      <div className="bg-[radial-gradient(circle_at_50%_0%,rgba(212,175,55,0.16),transparent_65%)] p-3.5 sm:p-4 space-y-3.5">
        {/* 1. Top Header + Mode Badge + Instant Hasanat Bar */}
        <header className="rounded-2xl bg-[#071E17] border border-[#D4AF37]/35 p-3.5 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-[#0C2A21] border border-[#D4AF37]/40 flex items-center justify-center text-[#F3D078] shrink-0">
                  <TrainFront className="w-4 h-4" />
                </span>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-[#F3D078] leading-tight">
                    🚇 وِرد الطريق
                  </h2>
                  <p className="text-[11px] font-bold text-[#34D399]">
                    بيد واحدة • بدون نت
                  </p>
                </div>
              </div>
            </div>

            {/* Instant Hasanat Pill */}
            <div className="rounded-xl bg-[#0C2A21] border border-[#D4AF37]/45 px-3 py-1.5 text-left shrink-0">
              <p className="text-[10px] font-bold text-[#D4AF37]/85 leading-none mb-0.5">
                حسنات الرحلة
              </p>
              <p className="text-sm sm:text-base font-black text-[#F3D078] tabular-nums leading-none">
                +{toAr(state.hasanat.toLocaleString('en-US'))}
              </p>
            </div>
          </div>

          {/* Quick Go / Return Trip Switcher */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleSwitchTripMode('go')}
              className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                state.tripMode === 'go'
                  ? 'royal-gold-foil shadow-[0_6px_18px_rgba(212,175,55,0.28)]'
                  : 'bg-[#0C2A21] border border-[#D4AF37]/25 text-slate-300 hover:text-[#F3D078]'
              }`}
            >
              <Sun className="w-4 h-4 shrink-0" />
              <span>🌅 الذهاب</span>
            </button>
            <button
              type="button"
              onClick={() => handleSwitchTripMode('return')}
              className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                state.tripMode === 'return'
                  ? 'royal-gold-foil shadow-[0_6px_18px_rgba(212,175,55,0.28)]'
                  : 'bg-[#0C2A21] border border-[#D4AF37]/25 text-slate-300 hover:text-[#F3D078]'
              }`}
            >
              <Moon className="w-4 h-4 shrink-0" />
              <span>🌆 العودة</span>
            </button>
          </div>

          {/* Interactive Station Countdown */}
          <div className="rounded-xl bg-[#04130E] border border-[#D4AF37]/30 p-2.5 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-slate-300">
                {state.stationsLeft === 0 ? (
                  <span className="text-[#34D399] font-black">✓ وصلتَ محطة الوصول</span>
                ) : (
                  <>
                    باقي{' '}
                    <span className="text-base font-black text-[#F3D078] tabular-nums">
                      {toAr(state.stationsLeft)}
                    </span>{' '}
                    {state.stationsLeft === 1 ? 'محطة' : 'محطات'}
                  </>
                )}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {state.tripMode === 'go'
                  ? 'أذكار الصباح • دعاء الانطلاق • الكهف'
                  : 'أذكار المساء • سيد الاستغفار • الملك'}
              </p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleAddStation}
                aria-label="زيادة محطة"
                className="w-11 h-11 rounded-xl bg-[#0C2A21] border border-[#D4AF37]/35 text-[#F3D078] hover:border-[#F3D078] flex items-center justify-center active:scale-95 transition-transform"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handlePassStation}
                className="min-h-[44px] px-3.5 rounded-xl bg-[#0A3628] border border-[#34D399]/55 text-[#34D399] hover:bg-[#0d4634] font-black text-xs flex items-center gap-1 active:scale-95 transition-all whitespace-nowrap"
              >
                <span>مرّت محطة ✓</span>
              </button>
            </div>
          </div>

          {stationArrivalAlert && (
            <div className="rounded-xl bg-[#0A3628] border border-[#34D399]/60 px-3 py-2 flex items-center justify-between gap-2 animate-fade-in">
              <p className="text-xs font-bold text-[#34D399]">
                وصلتَ بحفظ الله! اعرض حصيلة رحلتك ودعاء الوصول.
              </p>
              <button
                type="button"
                onClick={() => setIsSummaryOpen(true)}
                className="px-2.5 py-1 rounded-lg bg-[#34D399] text-[#04130E] text-[11px] font-black shrink-0"
              >
                عرض
              </button>
            </div>
          )}
        </header>

        {/* 2. Section: «🧭 بصيرة اليوم» (Morning Intention Guidance) */}
        <article className="rounded-2xl bg-[#071E17] border border-[#D4AF37]/35 p-3.5 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">🧭</span>
              <h3 className="text-xs font-black text-[#F3D078]">بصيرة اليوم</h3>
            </div>
            <button
              type="button"
              onClick={handleCycleIntention}
              className="min-h-[36px] px-2.5 py-1 rounded-lg bg-[#0C2A21] border border-[#D4AF37]/35 text-[11px] font-bold text-[#F3D078] hover:border-[#F3D078] flex items-center gap-1 active:scale-95 transition-all"
            >
              <RefreshCw className="w-3 h-3" />
              <span>↻ معنى آخر</span>
            </button>
          </div>

          <div className="rounded-xl bg-[#0C2A21] border border-[#D4AF37]/25 p-3 space-y-1.5">
            <h4 className="text-sm font-black text-white">{currentIntention.titleAr}</h4>
            <p className="text-xs text-slate-300 leading-relaxed">{currentIntention.messageAr}</p>
            <p className="text-[11px] font-bold text-[#34D399] pt-1 border-t border-[#D4AF37]/15">
              الخطوة العملية: {currentIntention.actionAr}
            </p>
          </div>
        </article>

        {/* 3. Reading / Dhikr Cards + Privacy Shield + Full 114-Surah Mushaf Launcher */}
        <article className="rounded-2xl bg-[#071E17] border border-[#D4AF37]/40 p-3.5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-[#0C2A21] border border-[#D4AF37]/30 text-[11px] font-bold text-[#F3D078]">
              {currentCard.category} · {toAr(safeCardIndex + 1)}/{toAr(cards.length)}
            </span>

            <button
              type="button"
              onClick={() => {
                vibrateDevice(12);
                setPrivacyShield((prev) => !prev);
              }}
              className={`min-h-[38px] px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1.5 border transition-all ${
                privacyShield
                  ? 'bg-[#0A3628] border-[#34D399]/65 text-[#34D399]'
                  : 'bg-[#0C2A21] border-[#D4AF37]/30 text-slate-300 hover:text-[#F3D078]'
              }`}
            >
              {privacyShield ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>{privacyShield ? 'إلغاء التعتيم' : '👁️ تعتيم للخصوصية'}</span>
            </button>
          </div>

          {/* Central Verse / Dhikr Card Body */}
          <div className="relative rounded-2xl bg-[#0C2A21] border border-[#D4AF37]/30 p-4 min-h-[175px] flex flex-col justify-between">
            <div
              onClick={() => {
                if (privacyShield) {
                  setPrivacyShield(false);
                  return;
                }
                if (currentCard.surahNumber) {
                  handleOpenMushaf('reader', currentCard.surahNumber);
                }
              }}
              className={`space-y-2.5 transition-all duration-200 ${
                privacyShield ? 'blur-[6px] opacity-25 select-none' : ''
              } ${currentCard.surahNumber && !privacyShield ? 'cursor-pointer' : ''}`}
            >
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-black text-[#D4AF37]">{currentCard.titleAr}</h4>
                {currentCard.surahNumber && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#0A3628] text-[#34D399] border border-[#34D399]/40">
                    افتح السورة ←
                  </span>
                )}
              </div>

              <p className="font-amiri text-xl sm:text-2xl text-white leading-[1.9] text-right">
                {currentCard.textAr}
              </p>

              <p className="text-[11px] text-slate-300 leading-relaxed pt-2 border-t border-[#D4AF37]/20">
                {currentCard.benefitAr}
              </p>
            </div>

            {privacyShield && (
              <button
                type="button"
                onClick={() => setPrivacyShield(false)}
                className="absolute inset-0 rounded-2xl bg-[#04130E]/75 backdrop-blur-sm flex flex-col items-center justify-center gap-1.5 text-center p-4"
              >
                <Eye className="w-6 h-6 text-[#34D399]" />
                <span className="text-xs font-black text-[#F3D078]">
                  تم تفعيل ستر الخصوصية في المترو
                </span>
                <span className="text-[11px] text-slate-300">اضغط هنا لإظهار النص</span>
              </button>
            )}
          </div>

          {/* Large Thumb Navigation Controls */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleCycleCard(-1)}
              className="min-h-[48px] rounded-xl bg-[#0C2A21] border border-[#D4AF37]/35 text-slate-100 hover:border-[#F3D078] hover:text-[#F3D078] text-sm font-black flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            >
              <ArrowRight className="w-4 h-4" />
              <span>‹ السابق</span>
            </button>
            <button
              type="button"
              onClick={() => handleCycleCard(1)}
              className="min-h-[48px] rounded-xl bg-[#0C2A21] border border-[#D4AF37]/35 text-slate-100 hover:border-[#F3D078] hover:text-[#F3D078] text-sm font-black flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            >
              <span>التالي ›</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Full 114-Surah Mushaf Launch Bar */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleOpenMushaf('reader', bookmark?.surahNumber || (state.tripMode === 'go' ? 18 : 67))}
              className="min-h-[48px] px-3 rounded-xl royal-gold-foil font-black text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-transform shadow-md"
            >
              <BookOpen className="w-4 h-4 shrink-0" />
              <span>📖 المصحف</span>
            </button>
            <button
              type="button"
              onClick={() => handleOpenMushaf('index')}
              className="min-h-[48px] px-3 rounded-xl bg-[#0C2A21] border border-[#D4AF37]/45 text-[#F3D078] hover:bg-[#11372c] font-black text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            >
              <List className="w-4 h-4 shrink-0" />
              <span>📑 فهرس ١١٤ سورة</span>
            </button>
          </div>

          {bookmark && (
            <button
              type="button"
              onClick={() => handleOpenMushaf('reader', bookmark.surahNumber)}
              className="w-full rounded-xl bg-[#04130E] border border-[#34D399]/35 px-3 py-2 flex items-center justify-between text-[11px] hover:border-[#34D399]/70 transition-colors"
            >
              <span className="text-[#34D399] font-bold flex items-center gap-1.5">
                <Bookmark className="w-3.5 h-3.5" />
                <span>آخر وقوف: سورة {bookmark.surahNameAr}</span>
              </span>
              <span className="text-slate-400">متابعة ←</span>
            </button>
          )}
        </article>

        {/* 4. Section: «🤝 صدقات الطريق الصامتة» */}
        <article className="rounded-2xl bg-[#071E17] border border-[#D4AF37]/35 p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-[#F3D078]">🤝 صدقات الطريق الصامتة</h3>
            <span className="text-[11px] font-bold text-[#34D399] tabular-nums">
              {toAr(state.checkedCharities.length)}/{toAr(SILENT_CHARITIES.length)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {SILENT_CHARITIES.map((item) => {
              const checked = state.checkedCharities.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleToggleCharity(item)}
                  className={`min-h-[68px] p-2.5 rounded-xl border text-right flex flex-col justify-between transition-all active:scale-[0.98] ${
                    checked
                      ? 'bg-[#0A3628] border-[#34D399] text-[#34D399] shadow-[0_0_16px_rgba(52,211,153,0.18)]'
                      : 'bg-[#0C2A21] border-[#D4AF37]/25 text-slate-200 hover:border-[#D4AF37]/55'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1.5">
                    <span className="text-xs font-black leading-snug">{item.titleAr}</span>
                    <span
                      className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                        checked ? 'bg-[#34D399] text-[#04130E]' : 'bg-[#04130E] border border-[#D4AF37]/35'
                      }`}
                    >
                      {checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] leading-tight mt-1 ${
                      checked ? 'text-[#34D399]/90' : 'text-slate-400'
                    }`}
                  >
                    {item.subAr}
                  </span>
                </button>
              );
            })}
          </div>
        </article>

        {/* 5. Giant Lower-Screen Thumb Zone «💎 كنوز الحسنات المضاعفة» */}
        <article className="rounded-2xl bg-[#071E17] border-2 border-[#D4AF37]/45 p-3.5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#F3D078]" />
              <h3 className="text-xs font-black text-[#F3D078]">💎 كنوز الحسنات المضاعفة</h3>
            </div>
            <span className="text-[11px] font-bold text-[#34D399] tabular-nums">
              +{toAr(currentTreasure.hasanatPerTap)} / ضغطة
            </span>
          </div>

          {/* Eyes-Free Giant Thumb Tap Pad */}
          <button
            type="button"
            onClick={handleTapTreasurePad}
            className={`w-full min-h-[188px] rounded-2xl border-2 p-4 flex flex-col items-center justify-center text-center gap-2.5 transition-all select-none active:scale-[0.98] ${
              tapPulse
                ? 'bg-[#0A3628] border-[#34D399] shadow-[0_0_32px_rgba(52,211,153,0.3)]'
                : 'bg-gradient-to-b from-[#0C2A21] to-[#04130E] border-[#D4AF37]/50 shadow-[inset_0_1px_0_rgba(243,208,120,0.2)] hover:border-[#F3D078]'
            }`}
          >
            <span className="px-3 py-0.5 rounded-full bg-[#04130E]/80 border border-[#D4AF37]/30 text-[10px] font-bold text-[#D4AF37]">
              منطقة الإبهام • اضغط في أي مكان دون النظر
            </span>

            <p className="font-amiri text-2xl sm:text-[26px] font-bold text-white leading-relaxed">
              {currentTreasure.textAr}
            </p>

            <p className="text-[11px] text-[#34D399] font-semibold max-w-xs leading-relaxed">
              {currentTreasure.virtueAr}
            </p>

            <div className="mt-1 px-5 py-1.5 rounded-full bg-[#04130E] border border-[#D4AF37]/45 flex items-center gap-2">
              <span className="text-[11px] text-slate-300 font-bold">العداد:</span>
              <span className="text-xl font-black text-[#F3D078] tabular-nums">
                {toAr(state.treasureCount)}
              </span>
            </div>
          </button>

          {/* Bottom Action Row */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleCycleTreasure}
              className="min-h-[48px] px-3 rounded-xl bg-[#0C2A21] border border-[#D4AF37]/35 text-[#F3D078] hover:border-[#F3D078] font-black text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5 shrink-0" />
              <span>💎 كنز حسنات آخر ↻</span>
            </button>

            <button
              type="button"
              onClick={() => {
                vibrateDevice(15);
                setIsSummaryOpen(true);
              }}
              className="min-h-[48px] px-3 rounded-xl bg-[#0A3628] border border-[#34D399]/60 text-[#34D399] hover:bg-[#0d4634] font-black text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            >
              <span>🔔 حصيلة الرحلة</span>
            </button>
          </div>
        </article>
      </div>

      {/* FULL-SCREEN IMMERSIVE 114-SURAH MUSHAF MODAL */}
      {isMushafOpen && (
        <div
          dir="rtl"
          className="theme-keep-light fixed inset-0 z-50 bg-[#04130E] text-slate-100 flex flex-col"
        >
          {/* Sticky Mushaf Header */}
          <header className="bg-[#071E17] border-b border-[#D4AF37]/35 px-3 sm:px-5 py-3 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <button
                type="button"
                onClick={() => {
                  setAutoScrollActive(false);
                  setIsMushafOpen(false);
                }}
                aria-label="إغلاق المصحف"
                className="w-11 h-11 rounded-xl bg-[#0C2A21] border border-[#D4AF37]/35 text-[#F3D078] flex items-center justify-center shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-black text-[#F3D078] truncate">
                  {mushafView === 'index'
                    ? 'فهرس المصحف الشريف (١١٤ سورة)'
                    : `سورة ${activeSurahMeta.nameAr}`}
                </h3>
                <p className="text-[11px] text-[#34D399] truncate">
                  {mushafView === 'index'
                    ? 'تصفح حسب السورة أو الجزء • يعمل بالذاكرة المحلية في النفق'
                    : `${activeSurahMeta.revelationType} • ${toAr(activeSurahMeta.ayahCount)} آية • الجزء ${toAr(activeSurahMeta.juzStart)}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {mushafView === 'reader' ? (
                <button
                  type="button"
                  onClick={() => {
                    setAutoScrollActive(false);
                    setMushafView('index');
                  }}
                  className="min-h-[40px] px-3 rounded-xl bg-[#0C2A21] border border-[#D4AF37]/40 text-[#F3D078] text-xs font-black flex items-center gap-1"
                >
                  <List className="w-3.5 h-3.5" />
                  <span>الفهرس</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void loadSurahContent(activeSurahNumber)}
                  className="min-h-[40px] px-3 rounded-xl royal-gold-foil text-xs font-black"
                >
                  متابعة القراءة
                </button>
              )}
            </div>
          </header>

          {/* View 1: Complete 114-Surah Index + Search + Juz 1-30 Filter */}
          {mushafView === 'index' && (
            <div className="flex-1 overflow-y-auto p-3 sm:p-5 max-w-2xl mx-auto w-full space-y-3.5">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-[#D4AF37] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={surahSearch}
                  onChange={(e) => setSurahSearch(e.target.value)}
                  placeholder="ابحث باسم السورة أو رقمها (١ - ١١٤)..."
                  className="w-full min-h-[46px] pr-10 pl-10 rounded-xl bg-[#071E17] border border-[#D4AF37]/40 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-[#F3D078]"
                />
                {surahSearch && (
                  <button
                    type="button"
                    onClick={() => setSurahSearch('')}
                    aria-label="مسح البحث"
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Juz 1–30 Filter Strip */}
              <div className="space-y-1.5">
                <p className="text-[11px] font-bold text-[#D4AF37]">تصفية حسب الجزء (١ - ٣٠):</p>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  <button
                    type="button"
                    onClick={() => setSelectedJuz(0)}
                    className={`min-h-[38px] px-3 rounded-xl text-xs font-black whitespace-nowrap shrink-0 transition-all ${
                      selectedJuz === 0
                        ? 'royal-gold-foil'
                        : 'bg-[#071E17] border border-[#D4AF37]/30 text-slate-300'
                    }`}
                  >
                    الكل (١١٤)
                  </button>
                  {Array.from({ length: 30 }, (_, idx) => idx + 1).map((juz) => (
                    <button
                      key={juz}
                      type="button"
                      onClick={() => setSelectedJuz(juz)}
                      className={`min-h-[38px] px-3 rounded-xl text-xs font-bold tabular-nums whitespace-nowrap shrink-0 transition-all ${
                        selectedJuz === juz
                          ? 'royal-gold-foil font-black'
                          : 'bg-[#071E17] border border-[#D4AF37]/25 text-slate-300 hover:border-[#D4AF37]/60'
                      }`}
                    >
                      ج {toAr(juz)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Offline-Ready Picks */}
              <div className="rounded-xl bg-[#071E17] border border-[#34D399]/35 p-2.5 flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold text-[#34D399] ml-1">
                  متوفرة فوراً بدون نت:
                </span>
                {[18, 67, 1, 112, 113, 114].map((num) => {
                  const meta = SURAH_CATALOG.find((s) => s.number === num)!;
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => void loadSurahContent(num)}
                      className="min-h-[34px] px-2.5 rounded-lg bg-[#0A3628] border border-[#34D399]/40 text-[#34D399] text-[11px] font-bold hover:brightness-110"
                    >
                      {meta.nameAr}
                    </button>
                  );
                })}
              </div>

              {/* 114-Surah Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filteredSurahs.map((surah) => {
                  const isActive = surah.number === activeSurahNumber;
                  return (
                    <button
                      key={surah.number}
                      type="button"
                      onClick={() => void loadSurahContent(surah.number)}
                      className={`min-h-[60px] p-3 rounded-xl border text-right flex items-center justify-between gap-2 transition-all active:scale-[0.99] ${
                        isActive
                          ? 'bg-[#0C2A21] border-[#F3D078] shadow-[0_0_14px_rgba(212,175,55,0.2)]'
                          : 'bg-[#071E17] border-[#D4AF37]/25 hover:border-[#D4AF37]/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-9 h-9 rounded-lg bg-[#04130E] border border-[#D4AF37]/40 text-xs font-black text-[#F3D078] tabular-nums flex items-center justify-center shrink-0">
                          {toAr(surah.number)}
                        </span>
                        <div>
                          <p className="font-amiri text-lg font-bold text-white leading-tight">
                            سورة {surah.nameAr}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {surah.revelationType} · {toAr(surah.ayahCount)} آية
                          </p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-[#04130E] border border-[#D4AF37]/20 text-[10px] font-bold text-[#D4AF37] tabular-nums shrink-0">
                        ج {toAr(surah.juzStart)}
                      </span>
                    </button>
                  );
                })}
              </div>

              {filteredSurahs.length === 0 && (
                <div className="rounded-xl bg-[#071E17] border border-[#D4AF37]/25 p-6 text-center text-xs text-slate-300">
                  لم يتم العثور على سورة مطابقة للبحث.
                </div>
              )}
            </div>
          )}

          {/* View 2: Immersive Large Mushaf Reader */}
          {mushafView === 'reader' && (
            <>
              {/* Reader Controls Bar */}
              <div className="bg-[#071E17]/95 border-b border-[#D4AF37]/25 px-3 sm:px-5 py-2 flex flex-wrap items-center justify-between gap-2 shrink-0">
                {/* Font Size + Auto Scroll */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setMushafFontSize((s) => Math.max(18, s - 2))}
                    className="min-h-[38px] px-2.5 rounded-lg bg-[#0C2A21] border border-[#D4AF37]/30 text-xs font-black text-[#F3D078]"
                    title="تصغير الخط"
                  >
                    <span className="inline-flex items-center gap-0.5">
                      ع<Minus className="w-3 h-3" />
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMushafFontSize((s) => Math.min(42, s + 2))}
                    className="min-h-[38px] px-2.5 rounded-lg bg-[#0C2A21] border border-[#D4AF37]/30 text-xs font-black text-[#F3D078]"
                    title="تكبير الخط"
                  >
                    <span className="inline-flex items-center gap-0.5">
                      ع<Plus className="w-3 h-3" />
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAutoScrollActive((v) => !v)}
                    className={`min-h-[38px] px-2.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-all ${
                      autoScrollActive
                        ? 'bg-[#0A3628] border-[#34D399] text-[#34D399]'
                        : 'bg-[#0C2A21] border-[#D4AF37]/30 text-slate-200 hover:text-[#F3D078]'
                    }`}
                  >
                    {autoScrollActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>📜 تمرير تلقائي</span>
                  </button>
                </div>

                {/* Bookmark Button */}
                <button
                  type="button"
                  onClick={handleSaveBookmark}
                  className="min-h-[38px] px-3 rounded-lg royal-gold-foil text-xs font-black flex items-center gap-1.5 active:scale-95 transition-transform"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>🔖 حفظ الوقوف</span>
                </button>
              </div>

              {bookmarkToast && (
                <div className="bg-[#0A3628] border-b border-[#34D399]/50 px-4 py-2 text-center text-xs font-bold text-[#34D399]">
                  {bookmarkToast}
                </div>
              )}

              {/* Scrollable Reading Surface */}
              <div ref={readerScrollRef} className="flex-1 overflow-y-auto p-3 sm:p-6">
                <div className="max-w-2xl mx-auto rounded-3xl bg-[#071E17] border-2 border-[#D4AF37]/45 p-4 sm:p-7 shadow-[0_12px_40px_rgba(0,0,0,0.5)] space-y-5">
                  {/* Ornate Surah Banner */}
                  <div className="rounded-2xl bg-[#0C2A21] border border-[#D4AF37]/40 p-3.5 text-center space-y-1">
                    <h4 className="font-amiri text-2xl sm:text-3xl font-bold text-[#F3D078]">
                      ۞ سورة {activeSurahMeta.nameAr} ۞
                    </h4>
                    <p className="text-[11px] text-slate-300">
                      {activeSurahMeta.revelationType} · {toAr(activeSurahMeta.ayahCount)} آية · الجزء{' '}
                      {toAr(activeSurahMeta.juzStart)}
                    </p>
                    {surahSourceNote && (
                      <p className="text-[10px] font-bold text-[#34D399]">{surahSourceNote}</p>
                    )}
                  </div>

                  {/* Basmalah (All except Al-Fatiha 1 & At-Tawbah 9) */}
                  {activeSurahMeta.number !== 1 && activeSurahMeta.number !== 9 && (
                    <p className="font-amiri text-center text-2xl sm:text-3xl text-[#F3D078] pt-1">
                      بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                    </p>
                  )}

                  {isSurahLoading ? (
                    <div className="py-16 text-center space-y-2">
                      <RefreshCw className="w-7 h-7 text-[#F3D078] animate-spin mx-auto" />
                      <p className="text-xs text-slate-300">جاري تحميل الآيات برواية حفص...</p>
                    </div>
                  ) : surahError ? (
                    <div className="rounded-2xl bg-[#04130E] border border-[#D4AF37]/30 p-5 text-center space-y-3">
                      <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">{surahError}</p>
                      <div className="flex flex-wrap justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => void loadSurahContent(67)}
                          className="px-3 py-2 rounded-xl bg-[#0A3628] border border-[#34D399]/50 text-[#34D399] text-xs font-bold"
                        >
                          سورة الملك (كاملة بدون نت)
                        </button>
                        <button
                          type="button"
                          onClick={() => void loadSurahContent(18)}
                          className="px-3 py-2 rounded-xl bg-[#0C2A21] border border-[#D4AF37]/40 text-[#F3D078] text-xs font-bold"
                        >
                          سورة الكهف (بدون نت)
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="font-amiri text-white text-right leading-[2.25] tracking-normal"
                      style={{ fontSize: `${mushafFontSize}px` }}
                    >
                      {surahAyahs.map((ayah) => (
                        <React.Fragment key={ayah.numberInSurah}>
                          <span>{ayah.text}</span>{' '}
                          <span className="inline-flex items-center justify-center text-[#F3D078] font-bold mx-1 text-[0.82em] tabular-nums">
                            ﴿{toAr(ayah.numberInSurah)}﴾
                          </span>{' '}
                        </React.Fragment>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Sticky Reader Bottom Prev/Next Surah Navigation */}
              <footer className="bg-[#071E17] border-t border-[#D4AF37]/35 px-3 sm:px-5 py-2.5 shrink-0">
                <div className="max-w-2xl mx-auto grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    disabled={activeSurahNumber <= 1}
                    onClick={() => void loadSurahContent(Math.max(1, activeSurahNumber - 1))}
                    className="min-h-[46px] rounded-xl bg-[#0C2A21] border border-[#D4AF37]/35 text-[#F3D078] text-xs font-black flex items-center justify-center gap-1.5 disabled:opacity-40"
                  >
                    <ArrowRight className="w-4 h-4" />
                    <span>‹ السابقة</span>
                  </button>
                  <button
                    type="button"
                    disabled={activeSurahNumber >= 114}
                    onClick={() => void loadSurahContent(Math.min(114, activeSurahNumber + 1))}
                    className="min-h-[46px] rounded-xl bg-[#0C2A21] border border-[#D4AF37]/35 text-[#F3D078] text-xs font-black flex items-center justify-center gap-1.5 disabled:opacity-40"
                  >
                    <span>التالية ›</span>
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                </div>
              </footer>
            </>
          )}
        </div>
      )}

      {/* TRIP ARRIVAL SUMMARY MODAL (حصيلة الرحلة) */}
      {isSummaryOpen && (
        <div
          dir="rtl"
          className="theme-keep-light fixed inset-0 z-50 bg-[#04130E]/90 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div className="w-full max-w-md rounded-3xl bg-[#071E17] border-2 border-[#D4AF37]/55 shadow-[0_24px_64px_rgba(0,0,0,0.75)] p-5 space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[11px] font-bold text-[#34D399]">
                  {state.stationsLeft === 0 ? '✓ تم الوصول بحفظ الله' : 'تقرير الرحلة الحالي'}
                </p>
                <h3 className="text-lg font-black text-[#F3D078]">
                  🔔 حصيلة رحلة {state.tripMode === 'go' ? 'الذهاب' : 'العودة'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSummaryOpen(false)}
                aria-label="إغلاق"
                className="w-10 h-10 rounded-xl bg-[#0C2A21] border border-[#D4AF37]/35 text-slate-300 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-[#0C2A21] border border-[#D4AF37]/30 p-3 text-center">
                <p className="text-[10px] text-slate-400 font-bold mb-1">إجمالي الأذكار</p>
                <p className="text-lg font-black text-white tabular-nums">
                  {toAr(state.totalAdhkarTaps)}
                </p>
              </div>
              <div className="rounded-xl bg-[#0C2A21] border border-[#D4AF37]/30 p-3 text-center">
                <p className="text-[10px] text-slate-400 font-bold mb-1">صدقات صامتة</p>
                <p className="text-lg font-black text-[#34D399] tabular-nums">
                  {toAr(state.checkedCharities.length)}/{toAr(SILENT_CHARITIES.length)}
                </p>
              </div>
              <div className="rounded-xl bg-[#0C2A21] border border-[#D4AF37]/45 p-3 text-center">
                <p className="text-[10px] text-[#D4AF37] font-bold mb-1">الحسنات المقدّرة</p>
                <p className="text-lg font-black text-[#F3D078] tabular-nums">
                  +{toAr(state.hasanat)}
                </p>
              </div>
            </div>

            {/* Contextual Arrival Dua */}
            <div className="rounded-2xl bg-[#0C2A21] border border-[#34D399]/40 p-3.5 space-y-1.5">
              <p className="text-[11px] font-black text-[#34D399]">
                {state.tripMode === 'go'
                  ? 'دعاء الوصول للعمل أو الجامعة:'
                  : 'دعاء دخول البيت والأهل:'}
              </p>
              <p className="font-amiri text-lg text-white leading-relaxed">
                {state.tripMode === 'go'
                  ? '«رَبِّ أَدْخِلْنِي مُدْخَلَ صِدْقٍ وَأَخْرِجْنِي مُخْرَجَ صِدْقٍ وَاجْعَل لِّي مِن لَّدُنكَ سُلْطَانًا نَّصِيرًا. اللَّهُمَّ بَارِكْ لِي فِي وَقْتِي وَعَمَلِي وَافْتَحْ لِي أَبْوَابَ رَحْمَتِكَ.»'
                  : '«بِسْمِ اللَّهِ وَلَجْنَا، وَبِسْمِ اللَّهِ خَرَجْنَا، وَعَلَى اللَّهِ رَبِّنَا تَوَكَّلْنَا. اللَّهُمَّ إِنِّي أَسْأَلُكَ خَيْرَ الْمَوْلِجِ وَخَيْرَ الْمَخْرَجِ.»'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsSummaryOpen(false)}
                className="min-h-[46px] rounded-xl bg-[#0C2A21] border border-[#D4AF37]/35 text-slate-200 font-bold text-xs"
              >
                متابعة الرحلة
              </button>
              <button
                type="button"
                onClick={handleStartNewTrip}
                className="min-h-[46px] rounded-xl royal-gold-foil font-black text-xs"
              >
                بدء رحلة جديدة ↻
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
