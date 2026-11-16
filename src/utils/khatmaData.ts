export type KhatmaPlanDays = 30 | 60;
export type KhatmaPrayerKey = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export interface KhatmaState {
  plan: KhatmaPlanDays;
  basePagesRead: number; // 0..604 pages accumulated before today
  todayDate: string; // YYYY-MM-DD
  completedToday: Record<KhatmaPrayerKey, boolean>;
}

export interface PrayerWirdInfo {
  prayerKey: KhatmaPrayerKey;
  startPage: number;
  endPage: number;
  surahLabel: string;
  ayahRangeLabel: string;
  pagesLabel: string;
  summary: string;
  isCompleted: boolean;
}

export const KHATMA_STORAGE_KEY = 'khatma_companion_v1';
export const TOTAL_MUSHAF_PAGES = 604;

export const KHATMA_PRAYER_ORDER: KhatmaPrayerKey[] = [
  'fajr',
  'dhuhr',
  'asr',
  'maghrib',
  'isha',
];

const JUZ_NAMES_AR: string[] = [
  'الجزء الأول',
  'الجزء الثاني',
  'الجزء الثالث',
  'الجزء الرابع',
  'الجزء الخامس',
  'الجزء السادس',
  'الجزء السابع',
  'الجزء الثامن',
  'الجزء التاسع',
  'الجزء العاشر',
  'الجزء الحادي عشر',
  'الجزء الثاني عشر',
  'الجزء الثالث عشر',
  'الجزء الرابع عشر',
  'الجزء الخامس عشر',
  'الجزء السادس عشر',
  'الجزء السابع عشر',
  'الجزء الثامن عشر',
  'الجزء التاسع عشر',
  'الجزء العشرون',
  'الجزء الحادي والعشرون',
  'الجزء الثاني والعشرون',
  'الجزء الثالث والعشرون',
  'الجزء الرابع والعشرون',
  'الجزء الخامس والعشرون',
  'الجزء السادس والعشرون',
  'الجزء السابع والعشرون',
  'الجزء الثامن والعشرون',
  'الجزء التاسع والعشرون',
  'الجزء الثلاثون',
];

const JUZ_START_PAGES: number[] = [
  1, 22, 42, 62, 82, 102, 122, 142, 162, 182,
  202, 222, 242, 262, 282, 302, 322, 342, 362, 382,
  402, 422, 442, 462, 482, 502, 522, 542, 562, 582,
];

interface MushafSurahEntry {
  nameAr: string;
  startPage: number;
  endPage: number;
  totalAyahs: number;
}

const MUSHAF_SURAHS: MushafSurahEntry[] = [
  { nameAr: 'الفاتحة', startPage: 1, endPage: 1, totalAyahs: 7 },
  { nameAr: 'البقرة', startPage: 2, endPage: 49, totalAyahs: 286 },
  { nameAr: 'آل عمران', startPage: 50, endPage: 76, totalAyahs: 200 },
  { nameAr: 'النساء', startPage: 77, endPage: 106, totalAyahs: 176 },
  { nameAr: 'المائدة', startPage: 106, endPage: 127, totalAyahs: 120 },
  { nameAr: 'الأنعام', startPage: 128, endPage: 150, totalAyahs: 165 },
  { nameAr: 'الأعراف', startPage: 151, endPage: 176, totalAyahs: 206 },
  { nameAr: 'الأنفال', startPage: 177, endPage: 186, totalAyahs: 75 },
  { nameAr: 'التوبة', startPage: 187, endPage: 207, totalAyahs: 129 },
  { nameAr: 'يونس', startPage: 208, endPage: 221, totalAyahs: 109 },
  { nameAr: 'هود', startPage: 221, endPage: 235, totalAyahs: 123 },
  { nameAr: 'يوسف', startPage: 235, endPage: 248, totalAyahs: 111 },
  { nameAr: 'الرعد', startPage: 249, endPage: 255, totalAyahs: 43 },
  { nameAr: 'إبراهيم', startPage: 255, endPage: 261, totalAyahs: 52 },
  { nameAr: 'الحجر', startPage: 262, endPage: 267, totalAyahs: 99 },
  { nameAr: 'النحل', startPage: 267, endPage: 281, totalAyahs: 128 },
  { nameAr: 'الإسراء', startPage: 282, endPage: 293, totalAyahs: 111 },
  { nameAr: 'الكهف', startPage: 293, endPage: 304, totalAyahs: 110 },
  { nameAr: 'مريم', startPage: 305, endPage: 312, totalAyahs: 98 },
  { nameAr: 'طه', startPage: 312, endPage: 321, totalAyahs: 135 },
  { nameAr: 'الأنبياء', startPage: 322, endPage: 331, totalAyahs: 112 },
  { nameAr: 'الحج', startPage: 332, endPage: 341, totalAyahs: 78 },
  { nameAr: 'المؤمنون', startPage: 342, endPage: 349, totalAyahs: 118 },
  { nameAr: 'النور', startPage: 350, endPage: 359, totalAyahs: 64 },
  { nameAr: 'الفرقان', startPage: 359, endPage: 366, totalAyahs: 77 },
  { nameAr: 'الشعراء', startPage: 367, endPage: 376, totalAyahs: 227 },
  { nameAr: 'النمل', startPage: 377, endPage: 385, totalAyahs: 93 },
  { nameAr: 'القصص', startPage: 385, endPage: 396, totalAyahs: 88 },
  { nameAr: 'العنكبوت', startPage: 396, endPage: 404, totalAyahs: 69 },
  { nameAr: 'الروم', startPage: 404, endPage: 410, totalAyahs: 60 },
  { nameAr: 'لقمان', startPage: 411, endPage: 414, totalAyahs: 34 },
  { nameAr: 'السجدة', startPage: 415, endPage: 417, totalAyahs: 30 },
  { nameAr: 'الأحزاب', startPage: 418, endPage: 427, totalAyahs: 73 },
  { nameAr: 'سبأ', startPage: 428, endPage: 434, totalAyahs: 54 },
  { nameAr: 'فاطر', startPage: 434, endPage: 440, totalAyahs: 45 },
  { nameAr: 'يس', startPage: 440, endPage: 445, totalAyahs: 83 },
  { nameAr: 'الصافات', startPage: 446, endPage: 452, totalAyahs: 182 },
  { nameAr: 'ص', startPage: 453, endPage: 458, totalAyahs: 88 },
  { nameAr: 'الزمر', startPage: 458, endPage: 467, totalAyahs: 75 },
  { nameAr: 'غافر', startPage: 467, endPage: 476, totalAyahs: 85 },
  { nameAr: 'فصلت', startPage: 477, endPage: 482, totalAyahs: 54 },
  { nameAr: 'الشورى', startPage: 483, endPage: 489, totalAyahs: 53 },
  { nameAr: 'الزخرف', startPage: 489, endPage: 495, totalAyahs: 89 },
  { nameAr: 'الدخان', startPage: 496, endPage: 498, totalAyahs: 59 },
  { nameAr: 'الجاثية', startPage: 499, endPage: 502, totalAyahs: 37 },
  { nameAr: 'الأحقاف', startPage: 502, endPage: 506, totalAyahs: 35 },
  { nameAr: 'محمد', startPage: 507, endPage: 510, totalAyahs: 38 },
  { nameAr: 'الفتح', startPage: 511, endPage: 515, totalAyahs: 29 },
  { nameAr: 'الحجرات', startPage: 515, endPage: 517, totalAyahs: 18 },
  { nameAr: 'ق', startPage: 518, endPage: 520, totalAyahs: 45 },
  { nameAr: 'الذاريات', startPage: 520, endPage: 523, totalAyahs: 60 },
  { nameAr: 'الطور', startPage: 523, endPage: 525, totalAyahs: 49 },
  { nameAr: 'النجم', startPage: 526, endPage: 528, totalAyahs: 62 },
  { nameAr: 'القمر', startPage: 528, endPage: 531, totalAyahs: 55 },
  { nameAr: 'الرحمن', startPage: 531, endPage: 534, totalAyahs: 78 },
  { nameAr: 'الواقعة', startPage: 534, endPage: 537, totalAyahs: 96 },
  { nameAr: 'الحديد', startPage: 537, endPage: 541, totalAyahs: 29 },
  { nameAr: 'المجادلة', startPage: 542, endPage: 545, totalAyahs: 22 },
  { nameAr: 'الحشر', startPage: 545, endPage: 548, totalAyahs: 24 },
  { nameAr: 'الممتحنة', startPage: 549, endPage: 551, totalAyahs: 13 },
  { nameAr: 'الصف', startPage: 551, endPage: 552, totalAyahs: 14 },
  { nameAr: 'الجمعة', startPage: 553, endPage: 554, totalAyahs: 11 },
  { nameAr: 'المنافقون', startPage: 554, endPage: 555, totalAyahs: 11 },
  { nameAr: 'التغابن', startPage: 556, endPage: 557, totalAyahs: 18 },
  { nameAr: 'الطلاق', startPage: 558, endPage: 559, totalAyahs: 12 },
  { nameAr: 'التحريم', startPage: 560, endPage: 561, totalAyahs: 12 },
  { nameAr: 'الملك', startPage: 562, endPage: 564, totalAyahs: 30 },
  { nameAr: 'القلم', startPage: 564, endPage: 566, totalAyahs: 52 },
  { nameAr: 'الحاقة', startPage: 566, endPage: 568, totalAyahs: 52 },
  { nameAr: 'المعارج', startPage: 568, endPage: 570, totalAyahs: 44 },
  { nameAr: 'نوح', startPage: 570, endPage: 571, totalAyahs: 28 },
  { nameAr: 'الجن', startPage: 572, endPage: 573, totalAyahs: 28 },
  { nameAr: 'المزمل', startPage: 574, endPage: 575, totalAyahs: 20 },
  { nameAr: 'المدثر', startPage: 575, endPage: 577, totalAyahs: 56 },
  { nameAr: 'القيامة', startPage: 577, endPage: 578, totalAyahs: 40 },
  { nameAr: 'الإنسان', startPage: 578, endPage: 580, totalAyahs: 31 },
  { nameAr: 'المرسلات', startPage: 580, endPage: 581, totalAyahs: 50 },
  { nameAr: 'النبأ', startPage: 582, endPage: 583, totalAyahs: 40 },
  { nameAr: 'النازعات', startPage: 583, endPage: 584, totalAyahs: 46 },
  { nameAr: 'عبس', startPage: 585, endPage: 585, totalAyahs: 42 },
  { nameAr: 'التكوير', startPage: 586, endPage: 586, totalAyahs: 29 },
  { nameAr: 'الانفطار', startPage: 587, endPage: 587, totalAyahs: 19 },
  { nameAr: 'المطففين', startPage: 587, endPage: 589, totalAyahs: 36 },
  { nameAr: 'الانشقاق', startPage: 589, endPage: 589, totalAyahs: 25 },
  { nameAr: 'البروج', startPage: 590, endPage: 590, totalAyahs: 22 },
  { nameAr: 'الطارق', startPage: 591, endPage: 591, totalAyahs: 17 },
  { nameAr: 'الأعلى', startPage: 591, endPage: 592, totalAyahs: 19 },
  { nameAr: 'الغاشية', startPage: 592, endPage: 592, totalAyahs: 26 },
  { nameAr: 'الفجر', startPage: 593, endPage: 594, totalAyahs: 30 },
  { nameAr: 'البلد', startPage: 594, endPage: 594, totalAyahs: 20 },
  { nameAr: 'الشمس', startPage: 595, endPage: 595, totalAyahs: 15 },
  { nameAr: 'الليل', startPage: 595, endPage: 596, totalAyahs: 21 },
  { nameAr: 'الضحى', startPage: 596, endPage: 596, totalAyahs: 11 },
  { nameAr: 'الشرح', startPage: 596, endPage: 596, totalAyahs: 8 },
  { nameAr: 'التين', startPage: 597, endPage: 597, totalAyahs: 8 },
  { nameAr: 'العلق', startPage: 597, endPage: 597, totalAyahs: 19 },
  { nameAr: 'القدر', startPage: 598, endPage: 598, totalAyahs: 5 },
  { nameAr: 'البينة', startPage: 598, endPage: 599, totalAyahs: 8 },
  { nameAr: 'الزلزلة', startPage: 599, endPage: 599, totalAyahs: 8 },
  { nameAr: 'العاديات', startPage: 599, endPage: 600, totalAyahs: 11 },
  { nameAr: 'القارعة', startPage: 600, endPage: 600, totalAyahs: 11 },
  { nameAr: 'التكاثر', startPage: 600, endPage: 600, totalAyahs: 8 },
  { nameAr: 'العصر', startPage: 601, endPage: 601, totalAyahs: 3 },
  { nameAr: 'الهمزة', startPage: 601, endPage: 601, totalAyahs: 9 },
  { nameAr: 'الفيل', startPage: 601, endPage: 601, totalAyahs: 5 },
  { nameAr: 'قريش', startPage: 602, endPage: 602, totalAyahs: 4 },
  { nameAr: 'الماعون', startPage: 602, endPage: 602, totalAyahs: 7 },
  { nameAr: 'الكوثر', startPage: 602, endPage: 602, totalAyahs: 3 },
  { nameAr: 'الكافرون', startPage: 603, endPage: 603, totalAyahs: 6 },
  { nameAr: 'النصر', startPage: 603, endPage: 603, totalAyahs: 3 },
  { nameAr: 'المسد', startPage: 603, endPage: 603, totalAyahs: 5 },
  { nameAr: 'الإخلاص', startPage: 604, endPage: 604, totalAyahs: 4 },
  { nameAr: 'الفلق', startPage: 604, endPage: 604, totalAyahs: 5 },
  { nameAr: 'الناس', startPage: 604, endPage: 604, totalAyahs: 6 },
];

export function toArabicDigits(value: number | string): string {
  const digits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return String(value).replace(/\d/g, (d) => digits[Number(d)]);
}

export function getTodayKhatmaDateKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function createEmptyCompletedToday(): Record<KhatmaPrayerKey, boolean> {
  return {
    fajr: false,
    dhuhr: false,
    asr: false,
    maghrib: false,
    isha: false,
  };
}

export function loadKhatmaState(): KhatmaState {
  const today = getTodayKhatmaDateKey();
  const fallback: KhatmaState = {
    plan: 30,
    basePagesRead: 0,
    todayDate: today,
    completedToday: createEmptyCompletedToday(),
  };

  if (typeof window === 'undefined') return fallback;

  try {
    const raw = localStorage.getItem(KHATMA_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<KhatmaState>;
    const plan: KhatmaPlanDays = parsed.plan === 60 ? 60 : 30;
    const basePagesRead = Math.max(0, Math.min(TOTAL_MUSHAF_PAGES, Number(parsed.basePagesRead) || 0));
    const prevCompleted = parsed.completedToday || createEmptyCompletedToday();

    if (parsed.todayDate === today) {
      return {
        plan,
        basePagesRead,
        todayDate: today,
        completedToday: {
          fajr: Boolean(prevCompleted.fajr),
          dhuhr: Boolean(prevCompleted.dhuhr),
          asr: Boolean(prevCompleted.asr),
          maghrib: Boolean(prevCompleted.maghrib),
          isha: Boolean(prevCompleted.isha),
        },
      };
    }

    // Roll over completed prayers from the previous day into basePagesRead
    const pagesPerPrayer = plan === 60 ? 2 : 4;
    const prevCount = KHATMA_PRAYER_ORDER.filter((k) => Boolean(prevCompleted[k])).length;
    const rolledBase = Math.min(TOTAL_MUSHAF_PAGES, basePagesRead + prevCount * pagesPerPrayer);

    return {
      plan,
      basePagesRead: rolledBase,
      todayDate: today,
      completedToday: createEmptyCompletedToday(),
    };
  } catch {
    return fallback;
  }
}

export function saveKhatmaState(state: KhatmaState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KHATMA_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota issues
  }
}

export function getJuzNameForPage(page: number): string {
  const clamped = Math.max(1, Math.min(TOTAL_MUSHAF_PAGES, page));
  let juzIdx = 0;
  for (let i = 0; i < JUZ_START_PAGES.length; i++) {
    if (clamped >= JUZ_START_PAGES[i]) {
      juzIdx = i;
    }
  }
  return JUZ_NAMES_AR[juzIdx] || JUZ_NAMES_AR[0];
}

function estimateAyahOnPage(surah: MushafSurahEntry, page: number, isEnd: boolean): number {
  const span = Math.max(1, surah.endPage - surah.startPage + 1);
  if (span === 1) {
    return isEnd ? surah.totalAyahs : 1;
  }
  const offset = Math.max(0, Math.min(span - 1, page - surah.startPage));
  if (isEnd) {
    if (page >= surah.endPage) return surah.totalAyahs;
    return Math.max(1, Math.round(((offset + 1) / span) * surah.totalAyahs));
  }
  if (page <= surah.startPage) return 1;
  return Math.max(1, Math.min(surah.totalAyahs, Math.round((offset / span) * surah.totalAyahs) + 1));
}

function describePageRange(startPage: number, endPage: number): {
  surahLabel: string;
  ayahRangeLabel: string;
  pagesLabel: string;
  summary: string;
} {
  const clampedStart = Math.max(1, Math.min(TOTAL_MUSHAF_PAGES, startPage));
  const clampedEnd = Math.max(clampedStart, Math.min(TOTAL_MUSHAF_PAGES, endPage));

  const pagesLabel =
    clampedStart === clampedEnd
      ? `ص ${toArabicDigits(clampedStart)}`
      : `ص ${toArabicDigits(clampedStart)}–${toArabicDigits(clampedEnd)}`;

  // Exact classical Madinah Mushaf Day-1 opening precision
  if (clampedStart === 1 && clampedEnd === 4) {
    return {
      surahLabel: 'الفاتحة والبقرة',
      ayahRangeLabel: '١–٢٤',
      pagesLabel,
      summary: `الفاتحة والبقرة ١–٢٤ | ${pagesLabel}`,
    };
  }
  if (clampedStart === 1 && clampedEnd === 2) {
    return {
      surahLabel: 'الفاتحة والبقرة',
      ayahRangeLabel: '١–٥',
      pagesLabel,
      summary: `الفاتحة والبقرة ١–٥ | ${pagesLabel}`,
    };
  }

  const matchingSurahs = MUSHAF_SURAHS.filter(
    (s) => s.endPage >= clampedStart && s.startPage <= clampedEnd
  );

  if (matchingSurahs.length === 0) {
    return {
      surahLabel: 'القرآن الكريم',
      ayahRangeLabel: '',
      pagesLabel,
      summary: pagesLabel,
    };
  }

  const first = matchingSurahs[0];
  const last = matchingSurahs[matchingSurahs.length - 1];

  if (matchingSurahs.length === 1) {
    const startAyah = estimateAyahOnPage(first, clampedStart, false);
    const endAyah = estimateAyahOnPage(first, clampedEnd, true);
    const ayahRangeLabel = `${toArabicDigits(startAyah)}–${toArabicDigits(endAyah)}`;
    return {
      surahLabel: first.nameAr,
      ayahRangeLabel,
      pagesLabel,
      summary: `${first.nameAr} ${ayahRangeLabel} | ${pagesLabel}`,
    };
  }

  if (matchingSurahs.length === 2) {
    const endAyah = estimateAyahOnPage(last, clampedEnd, true);
    const ayahRangeLabel = `١–${toArabicDigits(endAyah)}`;
    const surahLabel = `${first.nameAr} و${last.nameAr}`;
    return {
      surahLabel,
      ayahRangeLabel,
      pagesLabel,
      summary: `${surahLabel} ${ayahRangeLabel} | ${pagesLabel}`,
    };
  }

  const surahLabel = `من ${first.nameAr} إلى ${last.nameAr}`;
  return {
    surahLabel,
    ayahRangeLabel: '',
    pagesLabel,
    summary: `${surahLabel} | ${pagesLabel}`,
  };
}

export function getDailyWirdSchedule(state: KhatmaState): {
  pagesPerPrayer: number;
  dailyTargetPages: number;
  pagesCompletedToday: number;
  totalPagesCompleted: number;
  overallPercent: number;
  dailyPercent: number;
  currentJuzName: string;
  wirdByPrayer: Record<KhatmaPrayerKey, PrayerWirdInfo>;
} {
  const pagesPerPrayer = state.plan === 60 ? 2 : 4;
  const dailyTargetPages = pagesPerPrayer * 5; // 20 or 10

  const completedPrayersCount = KHATMA_PRAYER_ORDER.filter((k) => state.completedToday[k]).length;
  const remainingInMushaf = Math.max(0, TOTAL_MUSHAF_PAGES - state.basePagesRead);
  const effectiveDailyTarget = Math.min(dailyTargetPages, remainingInMushaf || dailyTargetPages);
  const pagesCompletedToday = Math.min(remainingInMushaf, completedPrayersCount * pagesPerPrayer);
  const totalPagesCompleted = Math.min(TOTAL_MUSHAF_PAGES, state.basePagesRead + pagesCompletedToday);

  const overallPercent = Math.min(100, Math.round((totalPagesCompleted / TOTAL_MUSHAF_PAGES) * 1000) / 10);
  const dailyPercent =
    effectiveDailyTarget > 0
      ? Math.min(100, Math.round((pagesCompletedToday / effectiveDailyTarget) * 100))
      : 100;

  const activePage = Math.min(TOTAL_MUSHAF_PAGES, Math.max(1, totalPagesCompleted + (totalPagesCompleted < TOTAL_MUSHAF_PAGES ? 1 : 0)));
  const currentJuzName = getJuzNameForPage(activePage);

  const dayStartPage = Math.min(TOTAL_MUSHAF_PAGES, state.basePagesRead + 1);
  const wirdByPrayer = {} as Record<KhatmaPrayerKey, PrayerWirdInfo>;

  KHATMA_PRAYER_ORDER.forEach((prayerKey, idx) => {
    const startPage = Math.min(TOTAL_MUSHAF_PAGES, dayStartPage + idx * pagesPerPrayer);
    const endPage = Math.min(TOTAL_MUSHAF_PAGES, startPage + pagesPerPrayer - 1);
    const desc = describePageRange(startPage, endPage);

    wirdByPrayer[prayerKey] = {
      prayerKey,
      startPage,
      endPage,
      surahLabel: desc.surahLabel,
      ayahRangeLabel: desc.ayahRangeLabel,
      pagesLabel: desc.pagesLabel,
      summary: desc.summary,
      isCompleted: Boolean(state.completedToday[prayerKey]),
    };
  });

  return {
    pagesPerPrayer,
    dailyTargetPages: effectiveDailyTarget,
    pagesCompletedToday,
    totalPagesCompleted,
    overallPercent,
    dailyPercent,
    currentJuzName,
    wirdByPrayer,
  };
}
