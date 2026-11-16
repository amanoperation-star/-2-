export interface JumuahSunnahItem {
  id: string;
  title: string;
  detail: string;
  hadithNote?: string;
}

export interface JumuahDuaItem {
  id: string;
  category: 'quran' | 'sunnah';
  title: string;
  text: string;
  source: string;
}

export interface KahfSharePreset {
  ayahNumber: number;
  title: string;
  reflection: string;
}

export const JUMUAH_SUNAN: JumuahSunnahItem[] = [
  {
    id: 'ghusl',
    title: 'الغُسل يوم الجمعة',
    detail: 'سنة مؤكدة وفضل عظيم في طهارة الجسد والتهيؤ للصلاة.',
  },
  {
    id: 'perfume',
    title: 'التطيّب',
    detail: 'مسّ الطيب وإصلاح الهيئة قبل التوجه إلى المسجد.',
  },
  {
    id: 'siwak',
    title: 'السواك',
    detail: 'تطييب الفم بالسواك تأسياً بهدي النبي ﷺ.',
  },
  {
    id: 'best_clothes',
    title: 'لبس أحسن الثياب',
    detail: 'ارتداء أنظف وأجمل الثياب تجمّلاً ليوم العيد الأسبوعي.',
  },
  {
    id: 'early_mosque',
    title: 'التبكير إلى المسجد والإنصات للخطبة',
    detail: 'المشي بسكينة والدنو من الإمام والإنصات دون لغو.',
    hadithNote:
      'قال رسول الله ﷺ: «مَنِ اغْتَسَلَ يَوْمَ الْجُمُعَةِ غُسْلَ الْجَنَابَةِ ثُمَّ رَاحَ فِي السَّاعَةِ الْأُولَى فَكَأَنَّمَا قَرَّبَ بَدَنَةً، وَمَنْ رَاحَ فِي السَّاعَةِ الثَّانِيَةِ فَكَأَنَّمَا قَرَّبَ بَقَرَةً، وَمَنْ رَاحَ فِي السَّاعَةِ الثَّالِثَةِ فَكَأَنَّمَا قَرَّبَ كَبْشًا أَقْرَنَ، وَمَنْ رَاحَ فِي السَّاعَةِ الرَّابِعَةِ فَكَأَنَّمَا قَرَّبَ دَجَاجَةً، وَمَنْ رَاحَ فِي السَّاعَةِ الْخَامِسَةِ فَكَأَنَّمَا قَرَّبَ بَيْضَةً» (متفق عليه).',
  },
];

export const KAHF_FEATURED_SHARE_PRESETS: KahfSharePreset[] = [
  {
    ayahNumber: 10,
    title: 'دعاء الفتية بالرحمة والرشد',
    reflection: 'أجمع دعاء عند الملمات وطلب الهداية والثبات',
  },
  {
    ayahNumber: 39,
    title: 'ما شاء الله لا قوة إلا بالله',
    reflection: 'شكر النعم وتفويض القوة والتوفيق لله وحده',
  },
  {
    ayahNumber: 46,
    title: 'الباقيات الصالحات',
    reflection: 'ما يبقى أثره وثوابه عند الله خيرٌ من زينة الدنيا',
  },
  {
    ayahNumber: 82,
    title: 'لطف القدر وتدبير الحكيم',
    reflection: 'كم من منحةٍ خفية طواها الله في ظاهر الابتلاء',
  },
  {
    ayahNumber: 107,
    title: 'بشرى المؤمنين بجنات الفردوس',
    reflection: 'جزاء الإيمان والعمل الصالح نزلاً خالداً لا يزول',
  },
  {
    ayahNumber: 110,
    title: 'إخلاص العمل لوجه الله',
    reflection: 'ختام السورة بمفتاح القبول: العمل الصالح والإخلاص',
  },
];

export const JUMUAH_GOLDEN_HOUR_DUAS: JumuahDuaItem[] = [
  {
    id: 'dua_jawami_1',
    category: 'sunnah',
    title: 'دعاء جوامع الخير كله',
    text: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنَ الْخَيْرِ كُلِّهِ عَاجِلِهِ وَآجِلِهِ، مَا عَلِمْتُ مِنْهُ وَمَا لَمْ أَعْلَمْ، وَأَعُوذُ بِكَ مِنَ الشَّرِّ كُلِّهِ عَاجِلِهِ وَآجِلِهِ، مَا عَلِمْتُ مِنْهُ وَمَا لَمْ أَعْلَمْ، اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ خَيْرِ مَا سَأَلَكَ عَبْدُكَ وَنَبِيُّكَ، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا عَاذَ بِهِ عَبْدُكَ وَنَبِيُّكَ، اللَّهُمَّ إِنِّي أَسْأَلُكَ الْجَنَّةَ وَمَا قَرَّبَ إِلَيْهَا مِنْ قَوْلٍ أَوْ عَمَلٍ، وَأَعُوذُ بِكَ مِنَ النَّارِ وَمَا قَرَّبَ إِلَيْهَا مِنْ قَوْلٍ أَوْ عَمَلٍ، وَأَسْأَلُكَ أَنْ تَجْعَلَ كُلَّ قَضَاءٍ قَضَيْتَهُ لِي خَيْرًا.',
    source: 'رواه ابن ماجه وصححه الألباني',
  },
  {
    id: 'dua_hasana_2',
    category: 'quran',
    title: 'سؤال حسنة الدنيا والآخرة',
    text: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ.',
    source: 'سورة البقرة – الآية ٢٠١ (كان أكثر دعاء النبي ﷺ)',
  },
  {
    id: 'dua_ism_aazam_3',
    category: 'sunnah',
    title: 'الدعاء باسم الله الأعظم',
    text: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ بِأَنَّ لَكَ الْحَمْدَ لَا إِلَهَ إِلَّا أَنْتَ الْمَنَّانُ، بَدِيعُ السَّمَاوَاتِ وَالْأَرْضِ، يَا ذَا الْجَلَالِ وَالْإِكْرَامِ، يَا حَيُّ يَا قَيُّومُ، أَسْأَلُكَ الْجَنَّةَ وَأَعُوذُ بِكَ مِنَ النَّارِ، وَأَنْ تَقْضِيَ حَوَائِجِي وَتَغْفِرَ ذُنُوبِي وَتَشْرَحَ صَدْرِي.',
    source: 'رواه أبو داود والنسائي بإسناد صحيح',
  },
  {
    id: 'dua_islah_din_4',
    category: 'sunnah',
    title: 'صلاح الدين والدنيا والآخرة',
    text: 'اللَّهُمَّ أَصْلِحْ لِي دِينِي الَّذِي هُوَ عِصْمَةُ أَمْرِي، وَأَصْلِحْ لِي دُنْيَايَ الَّتِي فِيهَا مَعَاشِي، وَأَصْلِحْ لِي آخِرَتِي الَّتِي فِيهَا مَعَادِي، وَاجْعَلِ الْحَيَاةَ زِيَادَةً لِي فِي كُلِّ خَيْرٍ، وَاجْعَلِ الْمَوْتَ رَاحَةً لِي مِنْ كُلِّ شَرٍّ.',
    source: 'رواه مسلم',
  },
  {
    id: 'dua_maghfirah_rizq_5',
    category: 'sunnah',
    title: 'المغفرة والرحمة والهدى والرزق',
    text: 'اللَّهُمَّ اغْفِرْ لِي، وَارْحَمْنِي، وَاهْدِنِي، وَعَافِنِي، وَارْزُقْنِي، وَاجْبُرْنِي، وَارْفَعْنِي.',
    source: 'رواه مسلم وأصحاب السنن',
  },
  {
    id: 'dua_family_6',
    category: 'quran',
    title: 'الدعاء للأهل والذرية والوالدين',
    text: 'رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ وَاجْعَلْنَا لِلْمُتَّقِينَ إِمَامًا، رَبِّ اغْفِرْ لِي وَلِوَالِدَيَّ وَلِمَنْ دَخَلَ بَيْتِيَ مُؤْمِنًا وَلِلْمُؤْمِنِينَ وَالْمُؤْمِنَاتِ.',
    source: 'سورة الفرقان (٧٤) وسورة نوح (٢٨)',
  },
  {
    id: 'dua_faraj_7',
    category: 'sunnah',
    title: 'دعاء الكرب وتفريج الهموم',
    text: 'اللَّهُمَّ رَحْمَتَكَ أَرْجُو فَلَا تَكِلْنِي إِلَى نَفْسِي طَرْفَةَ عَيْنٍ، وَأَصْلِحْ لِي شَأْنِي كُلَّهُ، لَا إِلَهَ إِلَّا أَنْتَ.',
    source: 'رواه أبو داود وحسنه الألباني',
  },
  {
    id: 'dua_kahf_8',
    category: 'quran',
    title: 'دعاء أصحاب الكهف بالرحمة والرشد',
    text: 'رَبَّنَا آتِنَا مِن لَّدُنكَ رَحْمَةً وَهَيِّئْ لَنَا مِنْ أَمْرِنَا رَشَدًا.',
    source: 'سورة الكهف – الآية ١٠',
  },
];

export interface KahfReadingProgress {
  completedQuarters: {
    1: boolean;
    2: boolean;
    3: boolean;
    4: boolean;
  };
  lastAyah: number;
  activeQuarter: 1 | 2 | 3 | 4;
  dateKey: string;
}

export interface JumuahSalawatProgress {
  dateKey: string;
  count: number;
  target: 100 | 1000;
  formula: 'short' | 'ibrahimi';
}

export function getTodayKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const KAHF_STORAGE_KEY = 'jumuah_kahf_progress_v1';
const SALAWAT_STORAGE_KEY = 'jumuah_salawat_wird_v1';
const SUNAN_STORAGE_KEY = 'jumuah_sunan_checklist_v1';

export function loadKahfProgress(): KahfReadingProgress {
  const today = getTodayKey();
  const fallback: KahfReadingProgress = {
    completedQuarters: { 1: false, 2: false, 3: false, 4: false },
    lastAyah: 1,
    activeQuarter: 1,
    dateKey: today,
  };
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(KAHF_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<KahfReadingProgress>;
    return {
      completedQuarters: {
        1: Boolean(parsed.completedQuarters?.[1]),
        2: Boolean(parsed.completedQuarters?.[2]),
        3: Boolean(parsed.completedQuarters?.[3]),
        4: Boolean(parsed.completedQuarters?.[4]),
      },
      lastAyah:
        typeof parsed.lastAyah === 'number' && parsed.lastAyah >= 1 && parsed.lastAyah <= 110
          ? parsed.lastAyah
          : 1,
      activeQuarter:
        parsed.activeQuarter === 1 ||
        parsed.activeQuarter === 2 ||
        parsed.activeQuarter === 3 ||
        parsed.activeQuarter === 4
          ? parsed.activeQuarter
          : 1,
      dateKey: typeof parsed.dateKey === 'string' ? parsed.dateKey : today,
    };
  } catch {
    return fallback;
  }
}

export function saveKahfProgress(progress: KahfReadingProgress): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KAHF_STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // ignore storage quota error
  }
}

export function loadJumuahSalawatProgress(): JumuahSalawatProgress {
  const today = getTodayKey();
  const fallback: JumuahSalawatProgress = {
    dateKey: today,
    count: 0,
    target: 100,
    formula: 'short',
  };
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(SALAWAT_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<JumuahSalawatProgress>;
    const isSameDay = parsed.dateKey === today;
    return {
      dateKey: today,
      count: isSameDay && typeof parsed.count === 'number' && parsed.count >= 0 ? parsed.count : 0,
      target: parsed.target === 1000 ? 1000 : 100,
      formula: parsed.formula === 'ibrahimi' ? 'ibrahimi' : 'short',
    };
  } catch {
    return fallback;
  }
}

export function saveJumuahSalawatProgress(progress: JumuahSalawatProgress): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SALAWAT_STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // ignore
  }
}

export function loadJumuahSunanChecklist(): Record<string, boolean> {
  const today = getTodayKey();
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(SUNAN_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as { dateKey?: string; items?: Record<string, boolean> };
    if (parsed.dateKey !== today) return {};
    return parsed.items || {};
  } catch {
    return {};
  }
}

export function saveJumuahSunanChecklist(items: Record<string, boolean>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      SUNAN_STORAGE_KEY,
      JSON.stringify({ dateKey: getTodayKey(), items })
    );
  } catch {
    // ignore
  }
}
