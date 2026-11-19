import { toArabicDigits } from './khatmaData';

export interface SurahCatalogEntry {
  number: number;
  nameAr: string;
  ayahCount: number;
  revelationType: 'مكية' | 'مدنية';
}

export interface HifzAyah {
  numberInSurah: number;
  globalNumber: number;
  text: string;
  juz: number;
  page: number;
}

export interface HifzReciter {
  id: string;
  nameAr: string;
  everyayahFolder: string;
}

export type HifzTasmiMode = 'read' | 'gradual' | 'blind';

export type HifzMasteryLevel = 0 | 1 | 2 | 3 | 4 | 5;

export interface HifzSegment {
  id: string;
  surahNumber: number;
  surahNameAr: string;
  startAyah: number;
  endAyah: number;
  masteryLevel: HifzMasteryLevel;
  reviewCount: number;
  lastReviewedDate: string; // YYYY-MM-DD
  nextReviewDate: string; // YYYY-MM-DD
  lastScorePercent: number;
  createdAt: string;
}

export interface HifzState {
  segments: HifzSegment[];
  activeReciterId: string;
  repeatPerAyah: 1 | 3 | 5 | 7 | 10;
  fontSize: number;
  reminderEnabled: boolean;
  reminderTime: string; // HH:mm
  lastRemindedDate: string;
  dailyReviewLog: Record<string, number>; // dateKey -> ayahs/sessions reviewed
}

export const HIFZ_STORAGE_KEY = 'al_mawaqeet_hifz_companion_v1';
export const HIFZ_SURAH_CACHE_PREFIX = 'al_mawaqeet_surah_cache_v1_';

// Spaced repetition intervals in days per mastery level (0..5)
export const HIFZ_SPACED_INTERVALS_DAYS: Record<HifzMasteryLevel, number> = {
  0: 1,
  1: 2,
  2: 4,
  3: 7,
  4: 14,
  5: 30,
};

export const HIFZ_RECITERS: HifzReciter[] = [
  { id: 'husary_muallim', nameAr: 'الشيخ محمود خليل الحصري (المعلم)', everyayahFolder: 'Husary_Muallim_128kbps' },
  { id: 'husary', nameAr: 'الشيخ محمود خليل الحصري (مرتل)', everyayahFolder: 'Husary_128kbps' },
  { id: 'alafasy', nameAr: 'الشيخ مشاري راشد العفاسي', everyayahFolder: 'Alafasy_128kbps' },
  { id: 'minshawi', nameAr: 'الشيخ محمد صديق المنشاوي', everyayahFolder: 'Minshawy_Murattal_128kbps' },
  { id: 'muaiqly', nameAr: 'الشيخ ماهر المعيقلي', everyayahFolder: 'MaherAlMuaiqly128kbps' },
  { id: 'abdulbasit', nameAr: 'الشيخ عبد الباسط عبد الصمد', everyayahFolder: 'Abdul_Basit_Murattal_192kbps' },
];

// Full 114 Surah catalog for instant offline browsing/filtering
const RAW_SURAHS: [number, string, number, 'مكية' | 'مدنية'][] = [
  [1, 'الفاتحة', 7, 'مكية'],
  [2, 'البقرة', 286, 'مدنية'],
  [3, 'آل عمران', 200, 'مدنية'],
  [4, 'النساء', 176, 'مدنية'],
  [5, 'المائدة', 120, 'مدنية'],
  [6, 'الأنعام', 165, 'مكية'],
  [7, 'الأعراف', 206, 'مكية'],
  [8, 'الأنفال', 75, 'مدنية'],
  [9, 'التوبة', 129, 'مدنية'],
  [10, 'يونس', 109, 'مكية'],
  [11, 'هود', 123, 'مكية'],
  [12, 'يوسف', 111, 'مكية'],
  [13, 'الرعد', 43, 'مدنية'],
  [14, 'إبراهيم', 52, 'مكية'],
  [15, 'الحجر', 99, 'مكية'],
  [16, 'النحل', 128, 'مكية'],
  [17, 'الإسراء', 111, 'مكية'],
  [18, 'الكهف', 110, 'مكية'],
  [19, 'مريم', 98, 'مكية'],
  [20, 'طه', 135, 'مكية'],
  [21, 'الأنبياء', 112, 'مكية'],
  [22, 'الحج', 78, 'مدنية'],
  [23, 'المؤمنون', 118, 'مكية'],
  [24, 'النور', 64, 'مدنية'],
  [25, 'الفرقان', 77, 'مكية'],
  [26, 'الشعراء', 227, 'مكية'],
  [27, 'النمل', 93, 'مكية'],
  [28, 'القصص', 88, 'مكية'],
  [29, 'العنكبوت', 69, 'مكية'],
  [30, 'الروم', 60, 'مكية'],
  [31, 'لقمان', 34, 'مكية'],
  [32, 'السجدة', 30, 'مكية'],
  [33, 'الأحزاب', 73, 'مدنية'],
  [34, 'سبأ', 54, 'مكية'],
  [35, 'فاطر', 45, 'مكية'],
  [36, 'يس', 83, 'مكية'],
  [37, 'الصافات', 182, 'مكية'],
  [38, 'ص', 88, 'مكية'],
  [39, 'الزمر', 75, 'مكية'],
  [40, 'غافر', 85, 'مكية'],
  [41, 'فصلت', 54, 'مكية'],
  [42, 'الشورى', 53, 'مكية'],
  [43, 'الزخرف', 89, 'مكية'],
  [44, 'الدخان', 59, 'مكية'],
  [45, 'الجاثية', 37, 'مكية'],
  [46, 'الأحقاف', 35, 'مكية'],
  [47, 'محمد', 38, 'مدنية'],
  [48, 'الفتح', 29, 'مدنية'],
  [49, 'الحجرات', 18, 'مدنية'],
  [50, 'ق', 45, 'مكية'],
  [51, 'الذاريات', 60, 'مكية'],
  [52, 'الطور', 49, 'مكية'],
  [53, 'النجم', 62, 'مكية'],
  [54, 'القمر', 55, 'مكية'],
  [55, 'الرحمن', 78, 'مدنية'],
  [56, 'الواقعة', 96, 'مكية'],
  [57, 'الحديد', 29, 'مدنية'],
  [58, 'المجادلة', 22, 'مدنية'],
  [59, 'الحشر', 24, 'مدنية'],
  [60, 'الممتحنة', 13, 'مدنية'],
  [61, 'الصف', 14, 'مدنية'],
  [62, 'الجمعة', 11, 'مدنية'],
  [63, 'المنافقون', 11, 'مدنية'],
  [64, 'التغابن', 18, 'مدنية'],
  [65, 'الطلاق', 12, 'مدنية'],
  [66, 'التحريم', 12, 'مدنية'],
  [67, 'الملك', 30, 'مكية'],
  [68, 'القلم', 52, 'مكية'],
  [69, 'الحاقة', 52, 'مكية'],
  [70, 'المعارج', 44, 'مكية'],
  [71, 'نوح', 28, 'مكية'],
  [72, 'الجن', 28, 'مكية'],
  [73, 'المزمل', 20, 'مكية'],
  [74, 'المدثر', 56, 'مكية'],
  [75, 'القيامة', 40, 'مكية'],
  [76, 'الإنسان', 31, 'مدنية'],
  [77, 'المرسلات', 50, 'مكية'],
  [78, 'النبأ', 40, 'مكية'],
  [79, 'النازعات', 46, 'مكية'],
  [80, 'عبس', 42, 'مكية'],
  [81, 'التكوير', 29, 'مكية'],
  [82, 'الانفطار', 19, 'مكية'],
  [83, 'المطففين', 36, 'مكية'],
  [84, 'الانشقاق', 25, 'مكية'],
  [85, 'البروج', 22, 'مكية'],
  [86, 'الطارق', 17, 'مكية'],
  [87, 'الأعلى', 19, 'مكية'],
  [88, 'الغاشية', 26, 'مكية'],
  [89, 'الفجر', 30, 'مكية'],
  [90, 'البلد', 20, 'مكية'],
  [91, 'الشمس', 15, 'مكية'],
  [92, 'الليل', 21, 'مكية'],
  [93, 'الضحى', 11, 'مكية'],
  [94, 'الشرح', 8, 'مكية'],
  [95, 'التين', 8, 'مكية'],
  [96, 'العلق', 19, 'مكية'],
  [97, 'القدر', 5, 'مكية'],
  [98, 'البينة', 8, 'مدنية'],
  [99, 'الزلزلة', 8, 'مدنية'],
  [100, 'العاديات', 11, 'مكية'],
  [101, 'القارعة', 11, 'مكية'],
  [102, 'التكاثر', 8, 'مكية'],
  [103, 'العصر', 3, 'مكية'],
  [104, 'الهمزة', 9, 'مكية'],
  [105, 'الفيل', 5, 'مكية'],
  [106, 'قريش', 4, 'مكية'],
  [107, 'الماعون', 7, 'مكية'],
  [108, 'الكوثر', 3, 'مكية'],
  [109, 'الكافرون', 6, 'مكية'],
  [110, 'النصر', 3, 'مدنية'],
  [111, 'المسد', 5, 'مكية'],
  [112, 'الإخلاص', 4, 'مكية'],
  [113, 'الفلق', 5, 'مكية'],
  [114, 'الناس', 6, 'مكية'],
];

export const QURAN_SURAH_CATALOG: SurahCatalogEntry[] = RAW_SURAHS.map(
  ([number, nameAr, ayahCount, revelationType]) => ({
    number,
    nameAr,
    ayahCount,
    revelationType,
  })
);

export const HIFZ_QUICK_PRESETS: { labelAr: string; surahNumber: number; startAyah: number; endAyah: number }[] = [
  { labelAr: 'سورة الملك (١–١٥)', surahNumber: 67, startAyah: 1, endAyah: 15 },
  { labelAr: 'سورة يس (١–٢٠)', surahNumber: 36, startAyah: 1, endAyah: 20 },
  { labelAr: 'سورة الكهف (١–١٠)', surahNumber: 18, startAyah: 1, endAyah: 10 },
  { labelAr: 'سورة النبأ (كاملة)', surahNumber: 78, startAyah: 1, endAyah: 40 },
  { labelAr: 'سورة الرحمن (١–٢٨)', surahNumber: 55, startAyah: 1, endAyah: 28 },
  { labelAr: 'سورة الأعلى (كاملة)', surahNumber: 87, startAyah: 1, endAyah: 19 },
];

export function getTodayHifzDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDaysToDateKey(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  dt.setDate(dt.getDate() + days);
  return getTodayHifzDateKey(dt);
}

export function createDefaultHifzState(): HifzState {
  return {
    segments: [],
    activeReciterId: 'husary_muallim',
    repeatPerAyah: 3,
    fontSize: 26,
    reminderEnabled: false,
    reminderTime: '18:30',
    lastRemindedDate: '',
    dailyReviewLog: {},
  };
}

export function loadHifzState(): HifzState {
  const fallback = createDefaultHifzState();
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(HIFZ_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<HifzState>;
    const validRepeats = [1, 3, 5, 7, 10];
    return {
      segments: Array.isArray(parsed.segments) ? parsed.segments : [],
      activeReciterId:
        typeof parsed.activeReciterId === 'string' &&
        HIFZ_RECITERS.some((r) => r.id === parsed.activeReciterId)
          ? parsed.activeReciterId
          : 'husary_muallim',
      repeatPerAyah: validRepeats.includes(Number(parsed.repeatPerAyah))
        ? (Number(parsed.repeatPerAyah) as HifzState['repeatPerAyah'])
        : 3,
      fontSize:
        typeof parsed.fontSize === 'number' && parsed.fontSize >= 20 && parsed.fontSize <= 40
          ? parsed.fontSize
          : 26,
      reminderEnabled: Boolean(parsed.reminderEnabled),
      reminderTime:
        typeof parsed.reminderTime === 'string' && /^\d{2}:\d{2}$/.test(parsed.reminderTime)
          ? parsed.reminderTime
          : '18:30',
      lastRemindedDate: typeof parsed.lastRemindedDate === 'string' ? parsed.lastRemindedDate : '',
      dailyReviewLog:
        parsed.dailyReviewLog && typeof parsed.dailyReviewLog === 'object' ? parsed.dailyReviewLog : {},
    };
  } catch {
    return fallback;
  }
}

export function saveHifzState(state: HifzState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(HIFZ_STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new Event('hifz_state_changed'));
  } catch {
    // ignore storage quota errors
  }
}

export function buildAyahAudioUrls(
  reciter: HifzReciter,
  surahNumber: number,
  ayahNumber: number
): string[] {
  const s = String(surahNumber).padStart(3, '0');
  const a = String(ayahNumber).padStart(3, '0');
  const code = `${s}${a}`;
  return [
    `https://everyayah.com/data/${reciter.everyayahFolder}/${code}.mp3`,
    `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${code}.mp3`,
  ];
}

export async function fetchSurahAyahsWithCache(surahNumber: number): Promise<HifzAyah[]> {
  const cacheKey = `${HIFZ_SURAH_CACHE_PREFIX}${surahNumber}`;
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached) as HifzAyah[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore malformed cache
    }
  }

  const res = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/quran-uthmani`);
  if (!res.ok) {
    throw new Error('تعذر تحميل آيات السورة');
  }
  const payload = await res.json();
  if (!payload || payload.code !== 200 || !payload.data || !Array.isArray(payload.data.ayahs)) {
    throw new Error('استجابة غير مكتملة من خادم المصحف');
  }

  const ayahs: HifzAyah[] = payload.data.ayahs.map((item: any, idx: number) => {
    let text: string = String(item.text || '').trim();
    // Strip leading Bismillah prefix on ayah 1 for non-Fatiha/non-Tawbah surahs if bundled
    if (surahNumber !== 1 && surahNumber !== 9 && idx === 0) {
      const bismillahPrefix = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ ';
      const bismillahPrefixAlt = 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ';
      if (text.startsWith(bismillahPrefix)) {
        text = text.slice(bismillahPrefix.length).trim();
      } else if (text.startsWith(bismillahPrefixAlt)) {
        text = text.slice(bismillahPrefixAlt.length).trim();
      }
    }
    return {
      numberInSurah: Number(item.numberInSurah) || idx + 1,
      globalNumber: Number(item.number) || idx + 1,
      text,
      juz: Number(item.juz) || 1,
      page: Number(item.page) || 1,
    };
  });

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(cacheKey, JSON.stringify(ayahs));
    } catch {
      // ignore storage quota errors on very long surahs
    }
  }

  return ayahs;
}

export function getMasteryLabelAr(level: HifzMasteryLevel): string {
  if (level <= 1) return 'جديد';
  if (level <= 3) return 'قيد التثبيت';
  return 'متقن';
}

export function computeHifzStats(state: HifzState, now: Date = new Date()) {
  const todayKey = getTodayHifzDateKey(now);
  const dueSegments = state.segments.filter((seg) => seg.nextReviewDate <= todayKey);
  const totalMemorizedAyahs = state.segments.reduce(
    (acc, seg) => acc + Math.max(0, seg.endAyah - seg.startAyah + 1),
    0
  );
  const masteredCount = state.segments.filter((seg) => seg.masteryLevel >= 4).length;

  let streakDays = 0;
  const checkDate = new Date(now);
  if ((state.dailyReviewLog[getTodayHifzDateKey(checkDate)] || 0) === 0) {
    checkDate.setDate(checkDate.getDate() - 1);
  }
  while (streakDays < 365) {
    const key = getTodayHifzDateKey(checkDate);
    if ((state.dailyReviewLog[key] || 0) > 0) {
      streakDays += 1;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return {
    totalSegments: state.segments.length,
    totalMemorizedAyahs,
    dueCount: dueSegments.length,
    dueSegments,
    masteredCount,
    streakDays,
    todayReviewedCount: state.dailyReviewLog[todayKey] || 0,
  };
}

export function formatDueSummaryAr(nextReviewDate: string, now: Date = new Date()): string {
  const todayKey = getTodayHifzDateKey(now);
  if (nextReviewDate <= todayKey) return 'مستحق اليوم';
  const [ty, tm, td] = todayKey.split('-').map(Number);
  const [ny, nm, nd] = nextReviewDate.split('-').map(Number);
  const tDate = new Date(ty, (tm || 1) - 1, td || 1);
  const nDate = new Date(ny, (nm || 1) - 1, nd || 1);
  const diffDays = Math.round((nDate.getTime() - tDate.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 1) return 'غداً';
  return `بعد ${toArabicDigits(diffDays)} أيام`;
}

export function isHifzReminderDue(
  state: HifzState,
  now: Date = new Date()
): { dueCount: number; summaryLabel: string } | null {
  if (!state.reminderEnabled) return null;
  const stats = computeHifzStats(state, now);
  if (stats.dueCount === 0) return null;

  const todayKey = getTodayHifzDateKey(now);
  if (state.lastRemindedDate === todayKey) return null;
  if (stats.todayReviewedCount > 0) return null;

  const [hh, mm] = state.reminderTime.split(':').map(Number);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const targetMinutes = hh * 60 + mm;

  if (currentMinutes >= targetMinutes && currentMinutes <= targetMinutes + 180) {
    const first = stats.dueSegments[0];
    const summaryLabel =
      stats.dueCount === 1
        ? `مراجعة سورة ${first.surahNameAr} (${toArabicDigits(first.startAyah)}–${toArabicDigits(first.endAyah)})`
        : `${toArabicDigits(stats.dueCount)} مقاطع مستحقة للمراجعة اليوم`;
    return { dueCount: stats.dueCount, summaryLabel };
  }
  return null;
}
