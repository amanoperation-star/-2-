export interface SaharDuaItem {
  id: string;
  title: string;
  badge?: string;
  text: string;
  source: string;
  benefit?: string;
  count?: number;
}

export interface IstighfarItem {
  id: string;
  title: string;
  text: string;
  transliteration?: string;
  source: string;
  targetCount: number;
}

export const DIVINE_DESCENT_HADITH = {
  text: '«يَنْزِلُ رَبُّنَا تَبَارَكَ وَتَعَالَى كُلَّ لَيْلَةٍ إِلَى السَّمَاءِ الدُّنْيَا حِينَ يَبْقَى ثُلُثُ اللَّيْلِ الآخِرُ، يَقُولُ: مَنْ يَدْعُونِي فَأَسْتَجِيبَ لَهُ، مَنْ يَسْأَلُنِي فَأُعْطِيَهُ، مَنْ يَسْتَغْفِرُنِي فَأَغْفِرَ لَهُ»',
  source: 'صحيح البخاري ومسلم (متفق عليه عن أبي هريرة رضي الله عنه)',
  virtue: 'ساعة الإجابة والنزول الإلهي التي لا يرد فيها داعٍ بإذن الله',
};

export type QiyamReciterId = 'qatami' | 'alafasy';

export interface QiyamReciterInfo {
  id: QiyamReciterId;
  nameAr: string;
  shortNameAr: string;
  everyayahFolder: string;
}

export const QIYAM_RECITERS: Record<QiyamReciterId, QiyamReciterInfo> = {
  qatami: {
    id: 'qatami',
    nameAr: 'الشيخ ناصر القطامي',
    shortNameAr: 'ناصر القطامي',
    everyayahFolder: 'Nasser_Alqatami_128kbps',
  },
  alafasy: {
    id: 'alafasy',
    nameAr: 'الشيخ مشاري راشد العفاسي',
    shortNameAr: 'مشاري العفاسي',
    everyayahFolder: 'Alafasy_128kbps',
  },
};

export interface QiyamNightVerse {
  id: string;
  verse: string;
  surah: string;
  verseCodes: string[];
  reflection: string;
}

export const QIYAM_NIGHT_VERSES: QiyamNightVerse[] = [
  {
    id: 'sajdah_16',
    verse: '﴿ تَتَجَافَىٰ جُنُوبُهُمْ عَنِ الْمَضَاجِعِ يَدْعُونَ رَبَّهُمْ خَوْفًا وَطَمَعًا وَمِمَّا رَزَقْنَاهُمْ يُنفِقُونَ ﴾',
    surah: 'سورة السجدة • الآية ١٦',
    verseCodes: ['032016'],
    reflection: 'أهل القيام الذين هجروا المضاجع شوقاً إلى رحمة الله ورضوانه.',
  },
  {
    id: 'dhariyat_17_18',
    verse: '﴿ كَانُوا قَلِيلًا مِّنَ اللَّيْلِ مَا يَهْجَعُونَ ۝ وَبِالْأَسْحَارِ هُمْ يَسْتَغْفِرُونَ ﴾',
    surah: 'سورة الذاريات • الآيتان ١٧ - ١٨',
    verseCodes: ['051017', '051018'],
    reflection: 'إحياء معظم الليل بالصلاة والتهجد وختمه بالاستغفار بالأسحار.',
  },
  {
    id: 'zumar_9',
    verse: '﴿ أَمَّنْ هُوَ قَانِتٌ آنَاءَ اللَّيْلِ سَاجِدًا وَقَائِمًا يَحْذَرُ الْآخِرَةَ وَيَرْجُو رَحْمَةَ رَبِّهِ ۗ قُلْ هَلْ يَسْتَوِي الَّذِينَ يَعْلَمُونَ وَالَّذِينَ لَا يَعْلَمُونَ ﴾',
    surah: 'سورة الزمر • الآية ٩',
    verseCodes: ['039009'],
    reflection: 'شرف القانتين الساجدين القائمين آناء الليل خوفاً ورجاءً.',
  },
  {
    id: 'furqan_64',
    verse: '﴿ وَالَّذِينَ يَبِيتُونَ لِرَبِّهِمْ سُجَّدًا وَقِيَامًا ﴾',
    surah: 'سورة الفرقان • الآية ٦٤',
    verseCodes: ['025064'],
    reflection: 'من أخص صفات عباد الرحمن المداومة على السجود والقيام في جوف الليل.',
  },
  {
    id: 'al_imran_17',
    verse: '﴿ الصَّابِرِينَ وَالصَّادِقِينَ وَالْقَانِتِينَ وَالْمُنْفِقِينَ وَالْمُسْتَغْفِرِينَ بِالْأَسْحَارِ ﴾',
    surah: 'سورة آل عمران • الآية ١٧',
    verseCodes: ['003017'],
    reflection: 'الاستغفار بالأسحار تاج خصال المتقين وأهل السعادة.',
  },
  {
    id: 'isra_79',
    verse: '﴿ وَمِنَ اللَّيْلِ فَتَهَجَّدْ بِهِ نَافِلَةً لَّكَ عَسَىٰ أَن يَبْعَثَكَ رَبُّكَ مَقَامًا مَّحْمُودًا ﴾',
    surah: 'سورة الإسراء • الآية ٧٩',
    verseCodes: ['017079'],
    reflection: 'صلاة التهجد في جوف الليل رفعة في الدرجات وقرب من المولى.',
  },
];

export const QURAN_SAHAR_VERSES = QIYAM_NIGHT_VERSES.map((item) => ({
  verse: item.verse,
  surah: item.surah,
}));

const LAST_THIRD_NIGHT_ROTATION_KEY = 'last_third_qiyam_rotation_v1';

export function buildQiyamVerseAudioUrls(
  verse: QiyamNightVerse,
  reciterId: QiyamReciterId
): string[] {
  const reciter = QIYAM_RECITERS[reciterId] || QIYAM_RECITERS.qatami;
  return verse.verseCodes.map(
    (code) => `https://everyayah.com/data/${reciter.everyayahFolder}/${code}.mp3`
  );
}

export function pickNextQiyamVerse(currentVerseId?: string): QiyamNightVerse {
  if (!currentVerseId) return QIYAM_NIGHT_VERSES[0];
  const idx = QIYAM_NIGHT_VERSES.findIndex((item) => item.id === currentVerseId);
  if (idx === -1) return QIYAM_NIGHT_VERSES[0];
  return QIYAM_NIGHT_VERSES[(idx + 1) % QIYAM_NIGHT_VERSES.length];
}

export function pickTonightQiyamSelection(nightCycleKey: string): {
  reciterId: QiyamReciterId;
  verse: QiyamNightVerse;
} {
  const defaultResult = {
    reciterId: 'qatami' as QiyamReciterId,
    verse: QIYAM_NIGHT_VERSES[0],
  };

  if (typeof window === 'undefined') {
    return defaultResult;
  }

  try {
    const raw = localStorage.getItem(LAST_THIRD_NIGHT_ROTATION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as {
        nightCycleKey?: string;
        reciterId?: string;
        verseId?: string;
      };
      const matchedVerse = QIYAM_NIGHT_VERSES.find((v) => v.id === parsed.verseId);
      const validReciter: QiyamReciterId =
        parsed.reciterId === 'alafasy' ? 'alafasy' : 'qatami';

      if (parsed.nightCycleKey === nightCycleKey && matchedVerse) {
        return { reciterId: validReciter, verse: matchedVerse };
      }

      const nextReciter: QiyamReciterId = validReciter === 'qatami' ? 'alafasy' : 'qatami';
      const nextVerse = pickNextQiyamVerse(parsed.verseId);
      localStorage.setItem(
        LAST_THIRD_NIGHT_ROTATION_KEY,
        JSON.stringify({
          nightCycleKey,
          reciterId: nextReciter,
          verseId: nextVerse.id,
        })
      );
      return { reciterId: nextReciter, verse: nextVerse };
    }

    localStorage.setItem(
      LAST_THIRD_NIGHT_ROTATION_KEY,
      JSON.stringify({
        nightCycleKey,
        reciterId: defaultResult.reciterId,
        verseId: defaultResult.verse.id,
      })
    );
  } catch {
    // ignore storage errors
  }

  return defaultResult;
}

export const SAHAR_DUAS: SaharDuaItem[] = [
  {
    id: 'tahajjud_prophet_praise',
    title: 'دعاء النبي ﷺ عند القيام من الليل',
    badge: 'استفتاح التهجد',
    text: 'اللَّهُمَّ لَكَ الحَمْدُ أَنْتَ قَيِّمُ السَّمَوَاتِ وَالأَرْضِ وَمَنْ فِيهِنَّ، وَلَكَ الحَمْدُ لَكَ مُلْكُ السَّمَوَاتِ وَالأَرْضِ وَمَنْ فِيهِنَّ، وَلَكَ الحَمْدُ أَنْتَ نُورُ السَّمَوَاتِ وَالأَرْضِ وَمَنْ فِيهِنَّ، وَلَكَ الحَمْدُ أَنْتَ الحَقُّ، وَوَعْدُكَ الحَقُّ، وَلِقَاؤُكَ حَقٌّ، وَقَوْلُكَ حَقٌّ، وَالجَنَّةُ حَقٌّ، وَالنَّارُ حَقٌّ، وَالنَّبِيُّونَ حَقٌّ، وَمُحَمَّدٌ حَقٌّ، وَالسَّاعَةُ حَقٌّ، اللَّهُمَّ لَكَ أَسْلَمْتُ، وَبِكَ آمَنْتُ، وَعَلَيْكَ تَوَكَّلْتُ، وَإِلَيْكَ أَنَبْتُ، وَبِكَ خَاصَمْتُ، وَإِلَيْكَ حَاكَمْتُ، فَاغْفِرْ لِي مَا قَدَّمْتُ وَمَا أَخَّرْتُ، وَمَا أَسْرَرْتُ وَمَا أَعْلَنْتُ، أَنْتَ المُقَدِّمُ وَأَنْتَ المُؤَخِّرُ، لاَ إِلَهَ إِلَّا أَنْتَ',
    source: 'صحيح البخاري (١١٢٠) ومسلم (٧٦٩) عن ابن عباس رضي الله عنهما',
    benefit: 'أعظم أدعية الثناء والافتقار لله تعالى عند القيام للتهجد',
  },
  {
    id: 'qunut_witr',
    title: 'دعاء قنوت الوتر المأثور',
    badge: 'قنوت الوتر',
    text: 'اللَّهُمَّ اهْدِنِي فِيمَنْ هَدَيْتَ، وَعَافِنِي فِيمَنْ عَافَيْتَ، وَتَوَلَّنِي فِيمَنْ تَوَلَّيْتَ، وَبَارِكْ لِي فِيمَا أَعْطَيْتَ، وَقِنِي شَرَّ مَا قَضَيْتَ، فَإِنَّكَ تَقْضِي وَلاَ يُقْضَى عَلَيْكَ، وَإِنَّهُ لاَ يَذِلُّ مَنْ وَالَيْتَ، وَلاَ يَعِزُّ مَنْ عَادَيْتَ، تَبَارَكْتَ رَبَّنَا وَتَعَالَيْتَ',
    source: 'سنن أبي داود والترمذي عن الحسن بن علي رضي الله عنهما',
    benefit: 'يُدعى به في الركعة الأخيرة من صلاة الوتر ختاماً لقيام الليل',
  },
  {
    id: 'witr_closing_tasbih',
    title: 'دعاء ختام الوتر والتسبيح بعده',
    badge: 'عقب الوتر',
    text: 'سُبْحَانَ الْمَلِكِ الْقُدُّوسِ (ثلاث مرات، ويمدّ صوته في الثالثة: رَبِّ الْمَلَائِكَةِ وَالرُّوحِ) • اللَّهُمَّ إِنِّي أَعُوذُ بِرِضَاكَ مِنْ سَخَطِكَ، وَبِمُعَافَاتِكَ مِنْ عُقُوبَتِكَ، وَأَعُوذُ بِكَ مِنْكَ لاَ أُحْصِي ثَنَاءً عَلَيْكَ أَنْتَ كَمَا أَثْنَيْتَ عَلَى نَفْسِكَ',
    source: 'سنن أبي داود والنسائي ومسلم',
    benefit: 'سنة نبوية ثابتة بعد السلام من صلاة الوتر في آخر الليل',
  },
  {
    id: 'night_waking_taar',
    title: 'دعاء التعارّ والاستيقاظ ليلاً',
    badge: 'أدعية الليل',
    text: 'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ، الْحَمْدُ لِلَّهِ، وَسُبْحَانَ اللَّهِ، وَلَا إِلَهَ إِلَّا اللَّهُ، وَاللَّهُ أَكْبَرُ، وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ • ثم يقول: اللَّهُمَّ اغْفِرْ لِي (أو يدعو بما شاء)',
    source: 'صحيح البخاري (١١٥٤) عن عبادة بن الصامت رضي الله عنه',
    benefit: 'من قاله حين يتعارّ من الليل ثم دعا استُجيب له، فإن توضأ وصلى قُبلت صلاته',
  },
];

export const ISTIGHFAR_FORMULAS: IstighfarItem[] = [
  {
    id: 'sayyid_al_istighfar_repeat',
    title: 'سيد الاستغفار',
    text: 'اللَّهُمَّ أَنْتَ رَبِّي لاَ إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ لَكَ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لاَ يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ',
    source: 'صحيح البخاري — من قالها موقناً بها فمات من ليلته دخل الجنة',
    targetCount: 33,
  },
  {
    id: 'istighfar_hayy_qayyum',
    title: 'الاستغفار العظيم',
    text: 'أَسْتَغْفِرُ اللَّهَ الْعَظِيمَ الَّذِي لَا إِلَهَ إِلَّا هُوَ الْحَيَّ الْقَيُّومَ وَأَتُوبُ إِلَيْهِ',
    source: 'سنن أبي داود والترمذي — غُفرت ذنوبه وإن كان فرّ من الزحف',
    targetCount: 100,
  },
  {
    id: 'istighfar_short',
    title: 'استغفار الأسحار',
    text: 'أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ',
    source: 'صحيح البخاري — كان النبي ﷺ يستغفر الله ويتوب إليه في اليوم أكثر من سبعين مرة',
    targetCount: 100,
  },
  {
    id: 'dua_yunus',
    title: 'دعاء يونس ﷺ',
    text: 'لَا إِلَهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ',
    source: 'سنن الترمذي — ما دعا بها مسلم في شيء قط إلا استجاب الله له',
    targetCount: 100,
  },
  {
    id: 'rabbi_zalamtu_nafsi',
    title: 'ظلمت نفسي',
    text: 'رَبِّ إِنِّي ظَلَمْتُ نَفْسِي فَاغْفِرْ لِي إِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ',
    source: 'صحيح البخاري (٨٣٤) ومسلم — علّمه النبي ﷺ لأبي بكر الصديق رضي الله عنه',
    targetCount: 100,
  },
  {
    id: 'allahumma_innaka_afuww',
    title: 'العفو والمغفرة',
    text: 'اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي',
    source: 'سنن الترمذي وابن ماجه — وصية النبي ﷺ لأم المؤمنين عائشة رضي الله عنها',
    targetCount: 100,
  },
];

export interface TahajjudRakatPlan {
  id: string;
  name: string;
  desc: string;
  rakat: number;
  isCompleted: boolean;
}

export const DEFAULT_TAHAJJUD_RAKATS: TahajjudRakatPlan[] = [
  {
    id: 'opening',
    name: 'ركعتا الاستفتاح الخفيفتان',
    desc: 'سنة نبوية قبل البدء بالقيام الطويل لتنشيط النفس',
    rakat: 2,
    isCompleted: false,
  },
  {
    id: 'qiyam_1',
    name: 'الركعتان الأولى والثانية',
    desc: 'القراءة بتأنٍّ وتدبر وإطالة الركوع والسجود',
    rakat: 2,
    isCompleted: false,
  },
  {
    id: 'qiyam_2',
    name: 'الركعتان الثالثة والرابعة',
    desc: 'الدعاء في السجود بما يفتح الله به عليك',
    rakat: 2,
    isCompleted: false,
  },
  {
    id: 'qiyam_3',
    name: 'الركعتان الخامسة والسادسة',
    desc: 'استحضار الخشوع والانكسار بين يدي الله',
    rakat: 2,
    isCompleted: false,
  },
  {
    id: 'shaf_witr',
    name: 'صلاة الوتر (٣ ركعات)',
    desc: 'ختام صلاة الليل مع دعاء القنوت في الركعة الأخيرة',
    rakat: 3,
    isCompleted: false,
  },
];

export const POST_WITR_ADHKAR = {
  qunutTitle: 'دعاء القنوت في الوتر',
  qunutText:
    'اللَّهُمَّ اهْدِنِي فِيمَنْ هَدَيْتَ، وَعَافِنِي فِيمَنْ عَافَيْتَ، وَتَوَلَّنِي فِيمَنْ تَوَلَّيْتَ، وَبَارِكْ لِي فِيمَا أَعْطَيْتَ، وَقِنِي شَرَّ مَا قَضَيْتَ، فَإِنَّكَ تَقْضِي وَلاَ يُقْضَى عَلَيْكَ، وَإِنَّهُ لاَ يَذِلُّ مَنْ وَالَيْتَ، وَلاَ يَعِزُّ مَنْ عَادَيْتَ، تَبَارَكْتَ رَبَّنَا وَتَعَالَيْتَ',
  qunutSource: 'سنن أبي داود والترمذي عن الحسن بن علي رضي الله عنهما',
  tasbihTitle: 'سُبْحَانَ الْمَلِكِ الْقُدُّوسِ',
  tasbihSubtitle: 'يُقال ثلاث مرات بعد السلام من الوتر، ويمدّ صوته في الثالثة: «رَبِّ الْمَلَائِكَةِ وَالرُّوحِ»',
  tasbihSource: 'سنن أبي داود والنسائي (كان النبي ﷺ إذا سلّم من الوتر قالها ثلاثاً)',
  tasbihTarget: 3,
};

export interface QiyamStreakState {
  streakCount: number;
  lastRecordedDate: string; // YYYY-MM-DD local date key
  completedDates: string[]; // list of YYYY-MM-DD local date keys
}

export const getLocalDateKey = (date: Date = new Date()): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const buildSeededPastSixDates = (): string[] => {
  const keys: string[] = [];
  const today = new Date();
  for (let offset = 6; offset >= 1; offset--) {
    const d = new Date(today);
    d.setDate(today.getDate() - offset);
    keys.push(getLocalDateKey(d));
  }
  return keys;
};

export const loadQiyamStreakState = (): QiyamStreakState => {
  if (typeof window === 'undefined') {
    return {
      streakCount: 7,
      lastRecordedDate: '',
      completedDates: buildSeededPastSixDates(),
    };
  }
  try {
    const raw = localStorage.getItem('qiyam_streak_data');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed.streakCount === 'number' && Array.isArray(parsed.completedDates)) {
        return {
          streakCount: Math.max(0, parsed.streakCount),
          lastRecordedDate: typeof parsed.lastRecordedDate === 'string' ? parsed.lastRecordedDate : '',
          completedDates: parsed.completedDates.filter((item: unknown) => typeof item === 'string'),
        };
      }
    }
  } catch {
    // ignore storage errors
  }
  return {
    streakCount: 7,
    lastRecordedDate: '',
    completedDates: buildSeededPastSixDates(),
  };
};

export const saveQiyamStreakState = (state: QiyamStreakState): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('qiyam_streak_data', JSON.stringify(state));
  } catch {
    // ignore storage errors
  }
};

const ARABIC_WEEKDAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const ARABIC_SHORT_WEEKDAYS = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

const toArabicNum = (n: number): string =>
  String(n).replace(/\d/g, (digit) => '٠١٢٣٤٥٦٧٨٩'[parseInt(digit, 10)]);

export interface StreakDayItem {
  key: string;
  label: string;
  dayName: string;
  shortDayName: string;
  dateNumber: string;
  formattedDate: string;
  isToday: boolean;
  isCompleted: boolean;
}

export const getRecentSevenDaysStreakView = (state: QiyamStreakState): StreakDayItem[] => {
  const today = new Date();
  const todayKey = getLocalDateKey(today);
  const completedSet = new Set(state.completedDates);

  const days: StreakDayItem[] = [];
  for (let offset = 6; offset >= 0; offset--) {
    const d = new Date(today);
    d.setDate(today.getDate() - offset);
    const key = getLocalDateKey(d);
    const isToday = key === todayKey;
    const dayName = ARABIC_WEEKDAYS[d.getDay()];
    const shortDayName = ARABIC_SHORT_WEEKDAYS[d.getDay()];
    const dateNumber = toArabicNum(d.getDate());

    days.push({
      key,
      label: isToday ? 'الليلة' : dayName,
      dayName,
      shortDayName,
      dateNumber,
      formattedDate: `${dayName} ${dateNumber}`,
      isToday,
      isCompleted: completedSet.has(key),
    });
  }
  return days;
};

export const getWeekSaturdayToFridayStreakView = (state: QiyamStreakState): StreakDayItem[] => {
  const recent = getRecentSevenDaysStreakView(state);
  // Arabic week order: Saturday (6), Sunday (0), Monday (1), Tuesday (2), Wednesday (3), Thursday (4), Friday (5)
  const satToFriOrder = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
  return satToFriOrder
    .map((name) => recent.find((d) => d.dayName === name))
    .filter((d): d is StreakDayItem => Boolean(d));
};

export const toggleQiyamStreakDate = (
  state: QiyamStreakState,
  dateKey: string,
  todayKey: string = getLocalDateKey()
): QiyamStreakState => {
  const exists = state.completedDates.includes(dateKey);
  if (exists) {
    const nextCompleted = state.completedDates.filter((d) => d !== dateKey);
    const nextCount = nextCompleted.length === 0 ? 0 : Math.max(0, state.streakCount - 1);
    return {
      streakCount: nextCount,
      lastRecordedDate: dateKey === todayKey ? '' : state.lastRecordedDate,
      completedDates: nextCompleted,
    };
  }

  const nextCompleted = [...state.completedDates, dateKey];
  return {
    streakCount: state.streakCount + 1,
    lastRecordedDate: dateKey === todayKey ? todayKey : state.lastRecordedDate,
    completedDates: nextCompleted,
  };
};

