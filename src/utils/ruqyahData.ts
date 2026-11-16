export interface RuqyahReciter {
  id: string;
  nameAr: string;
  everyayahFolder: string;
  mp3quranBase: string;
}

export interface RuqyahDuaSheikh {
  id: 'ghamdi' | 'jibreel' | 'durayhim';
  nameAr: string;
  subtitleAr: string;
}

export interface RuqyahDuaTrackStep {
  urls: string[];
}

export type RuqyahContinuousTrackId =
  | 'fatiha'
  | 'kursi'
  | 'baqarah_end'
  | 'shifa_verses'
  | 'muawwidhat';

export interface RuqyahItem {
  id: string;
  category: 'quran' | 'sunnah';
  title: string;
  arabicText: string;
  source: string;
  virtue: string;
  recommendedCount: number;
  /** Single uninterrupted continuous MP3 track per reciter */
  continuousTrackId?: RuqyahContinuousTrackId;
  /** Verse keys in SSSAAA format as online fallback */
  verseCodes?: string[];
  /** Sequential Sheikh audio steps for Sunnah Duas (supports multiple tracks per item) */
  duaTracksBySheikh?: Record<RuqyahDuaSheikh['id'], RuqyahDuaTrackStep[]>;
}

export const RUQYAH_RECITERS: RuqyahReciter[] = [
  {
    id: 'alafasy',
    nameAr: 'الشيخ مشاري راشد العفاسي',
    everyayahFolder: 'Alafasy_128kbps',
    mp3quranBase: 'https://server8.mp3quran.net/afs',
  },
  {
    id: 'muaiqly',
    nameAr: 'الشيخ ماهر المعيقلي',
    everyayahFolder: 'MaherAlMuaiqly128kbps',
    mp3quranBase: 'https://server12.mp3quran.net/maher',
  },
  {
    id: 'dosari',
    nameAr: 'الشيخ ياسر الدوسري',
    everyayahFolder: 'Yasser_Ad-Dussary_128kbps',
    mp3quranBase: 'https://server11.mp3quran.net/yasser',
  },
  {
    id: 'minshawi',
    nameAr: 'الشيخ محمد صديق المنشاوي',
    everyayahFolder: 'Minshawy_Murattal_128kbps',
    mp3quranBase: 'https://server10.mp3quran.net/minsh',
  },
  {
    id: 'abdulbasit',
    nameAr: 'الشيخ عبد الباسط عبد الصمد',
    everyayahFolder: 'Abdul_Basit_Murattal_192kbps',
    mp3quranBase: 'https://server7.mp3quran.net/basit',
  },
];

export const RUQYAH_DUA_SHEIKHS: RuqyahDuaSheikh[] = [
  {
    id: 'ghamdi',
    nameAr: 'الشيخ سعد الغامدي',
    subtitleAr: 'قراءة خاشعة من سلسلة أدعية وأذكار حصن المسلم',
  },
  {
    id: 'jibreel',
    nameAr: 'الشيخ محمد جبريل',
    subtitleAr: 'أدعية الرقية الشرعية الشاملة بصوت مؤثر',
  },
  {
    id: 'durayhim',
    nameAr: 'الشيخ حمد الدريهم (حصن المسلم)',
    subtitleAr: 'نطق فصيح واضح مطابق لنص الدعاء النبوي',
  },
];

export const RUQYAH_ITEMS: RuqyahItem[] = [
  {
    id: 'fatiha',
    category: 'quran',
    title: 'سورة الفاتحة (أمّ القرآن والشفاء)',
    arabicText:
      'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ۝ الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ ۝ الرَّحْمَٰنِ الرَّحِيمِ ۝ مَالِكِ يَوْمِ الدِّينِ ۝ إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ ۝ اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ ۝ صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ',
    source: 'سورة الفاتحة · ١-٧',
    virtue: 'أعظم سورة في القرآن الكريم، وسماها النبي ﷺ بالرقية والشفاء.',
    recommendedCount: 3,
    continuousTrackId: 'fatiha',
    verseCodes: ['001001', '001002', '001003', '001004', '001005', '001006', '001007'],
  },
  {
    id: 'kursi',
    category: 'quran',
    title: 'آية الكرسي (أعظم آية في كتاب الله)',
    arabicText:
      'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَّهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَن ذَا الَّذِي يَشْفَعُ عِندَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِّنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ',
    source: 'سورة البقرة · ٢٥٥',
    virtue: 'من قرأها لم يزل عليه من الله حافظ ولا يقربه شيطان حتى يصبح أو يمسي.',
    recommendedCount: 1,
    continuousTrackId: 'kursi',
    verseCodes: ['002255'],
  },
  {
    id: 'baqarah_end',
    category: 'quran',
    title: 'خواتيم سورة البقرة',
    arabicText:
      'آمَنَ الرَّسُولُ بِمَا أُنزِلَ إِلَيْهِ مِن رَّبِّهِ وَالْمُؤْمِنُونَ ۚ كُلٌّ آمَنَ بِاللَّهِ وَمَلَائِكَتِهِ وَكُتُبِهِ وَرُسُلِهِ لَا نُفَرِّقُ بَيْنَ أَحَدٍ مِّن رُّسُلِهِ ۚ وَقَالُوا سَمِعْنَا وَأَطَعْنَا ۖ غُفْرَانَكَ رَبَّنَا وَإِلَيْكَ الْمَصِيرُ ۝ لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا ۚ لَهَا مَا كَسَبَتْ وَعَلَيْهَا مَا اكْتَسَبَتْ ۗ رَبَّنَا لَا تُؤَاخِذْنَا إِن نَّسِينَا أَوْ أَخْطَأْنَا ۚ رَبَّنَا وَلَا تَحْمِلْ عَلَيْنَا إِصْرًا كَمَا حَمَلْتَهُ عَلَى الَّذِينَ مِن قَبْلِنَا ۚ رَبَّنَا وَلَا تُحَمِّلْنَا مَا لَا طَاقَةَ لَنَا بِهِ ۖ وَاعْفُ عَنَّا وَاغْفِرْ لَنَا وَارْحَمْنَا ۚ أَنتَ مَوْلَانَا فَانصُرْنَا عَلَى الْقَوْمِ الْكَافِرِينَ',
    source: 'سورة البقرة · ٢٨٥-٢٨٦',
    virtue: 'من قرأ الآيتين من آخر سورة البقرة في ليلة كفتاه من كل شر وآفة.',
    recommendedCount: 1,
    continuousTrackId: 'baqarah_end',
    verseCodes: ['002285', '002286'],
  },
  {
    id: 'shifa_verses',
    category: 'quran',
    title: 'آيات الشفاء والرحمة والسكينة',
    arabicText:
      'وَنُنَزِّلُ مِنَ الْقُرْآنِ مَا هُوَ شِفَاءٌ وَرَحْمَةٌ لِّلْمُؤْمِنِينَ ۙ وَلَا يَزِيدُ الظَّالِمِينَ إِلَّا خَسَارًا ۝ وَإِذَا مَرِضْتُ فَهُوَ يَشْفِينِ ۝ قُلْ هُوَ لِلَّذِينَ آمَنُوا هُدًى وَشِفَاءٌ',
    source: 'الإسراء ٨٢ · الشعراء ٨٠ · فصلت ٤٤',
    virtue: 'آيات مباركة يُستشفى بها بتدبر ويقين في شفاء الله القريب.',
    recommendedCount: 3,
    continuousTrackId: 'shifa_verses',
    verseCodes: ['017082', '026080', '041044'],
  },
  {
    id: 'muawwidhat',
    category: 'quran',
    title: 'المعوذات الثلاث (الإخلاص والفلق والناس)',
    arabicText:
      'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ\nقُلْ هُوَ اللَّهُ أَحَدٌ ۝ اللَّهُ الصَّمَدُ ۝ لَمْ يَلِدْ وَلَمْ يُولَدْ ۝ وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ\n\nبِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ\nقُلْ أَعُوذُ بِرَبِّ الْفَلَقِ ۝ مِن شَرِّ مَا خَلَقَ ۝ وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ ۝ وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ ۝ وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ\n\nبِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ\nقُلْ أَعُوذُ بِرَبِّ النَّاسِ ۝ مَلِكِ النَّاسِ ۝ إِلَٰهِ النَّاسِ ۝ مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ ۝ الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ ۝ مِنَ الْجِنَّةِ وَالنَّاسِ',
    source: 'الإخلاص · الفلق · الناس',
    virtue: 'من قرأها ثلاث مرات حين يصبح وحين يمسي كفته من كل شيء.',
    recommendedCount: 3,
    continuousTrackId: 'muawwidhat',
    verseCodes: [
      '112001', '112002', '112003', '112004',
      '113001', '113002', '113003', '113004', '113005',
      '114001', '114002', '114003', '114004', '114005', '114006',
    ],
  },
  {
    id: 'sunnah_shafi',
    category: 'sunnah',
    title: 'دعاء الشفاء التام (لا شفاء إلا شفاؤك)',
    arabicText:
      'اللَّهُمَّ رَبَّ النَّاسِ، أَذْهِبِ الْبَأْسَ، اشْفِ وَأَنْتَ الشَّافِي، لَا شِفَاءَ إِلَّا شِفَاؤُكَ، شِفَاءً لَا يُغَادِرُ سَقَمًا.',
    source: 'متفق عليه (البخاري ومسلم)',
    virtue: 'كان النبي ﷺ يعوّذ به بعض أهله، يمسح بيده اليمنى ويقول هذا الدعاء.',
    recommendedCount: 3,
    duaTracksBySheikh: {
      ghamdi: [
        {
          urls: [
            '/audio/ruqyah/duas/ghamdi-ruqyah-patient.mp3',
            '/audio/ruqyah/duas/shafi-dua.mp3',
            'https://archive.org/download/ad3ya-ghamedi_up-by-ayoub-islam/Adkr40.mp3',
          ],
        },
      ],
      jibreel: [
        {
          urls: [
            '/audio/ruqyah/duas/jibreel-ruqyah-dua.mp3',
            '/audio/ruqyah/duas/shafi-dua.mp3',
            'https://archive.org/download/ruqyah-cd-by-sheikh-muhammad-jibril/Roqia%20doaa.mp3',
          ],
        },
      ],
      durayhim: [
        {
          urls: [
            '/audio/ruqyah/duas/shafi-dua.mp3',
            '/audio/ruqyah/duas/hisn-148.mp3',
            'https://www.hisnmuslim.com/audio/ar/148.mp3',
          ],
        },
      ],
    },
  },
  {
    id: 'sunnah_jibreel',
    category: 'sunnah',
    title: 'رقية جبريل عليه السلام للنبي ﷺ',
    arabicText:
      'بِسْمِ اللَّهِ أَرْقِيكَ، مِنْ كُلِّ شَيْءٍ يُؤْذِيكَ، مِنْ شَرِّ كُلِّ نَفْسٍ أَوْ عَيْنِ حَاسِدٍ، اللَّهُ يَشْفِيكَ، بِسْمِ اللَّهِ أَرْقِيكَ.',
    source: 'رواه مسلم',
    virtue: 'رقية عظيمة من جوامع الرقى النبوية للتحصين من العين والحسد وكل أذى.',
    recommendedCount: 3,
    duaTracksBySheikh: {
      ghamdi: [
        {
          urls: [
            '/audio/ruqyah/duas/ghamdi-visit-patient.mp3',
            '/audio/ruqyah/duas/ghamdi-ruqyah-patient.mp3',
            'https://archive.org/download/ad3ya-ghamedi_up-by-ayoub-islam/Adkr25.mp3',
          ],
        },
      ],
      jibreel: [
        {
          urls: [
            '/audio/ruqyah/duas/jibreel-ruqyah-dua.mp3',
            '/audio/ruqyah/duas/ghamdi-visit-patient.mp3',
            'https://archive.org/download/ruqyah-cd-by-sheikh-muhammad-jibril/Roqia%20doaa.mp3',
          ],
        },
      ],
      durayhim: [
        {
          urls: [
            '/audio/ruqyah/duas/hisn-148.mp3',
            '/audio/ruqyah/duas/hisn-147.mp3',
            'https://www.hisnmuslim.com/audio/ar/148.mp3',
          ],
        },
      ],
    },
  },
  {
    id: 'sunnah_pain',
    category: 'sunnah',
    title: 'رقية موضع الألم في الجسد',
    arabicText:
      'بِسْمِ اللَّهِ (ثلاثاً)، أَعُوذُ بِاللَّهِ وَقُدْرَتِهِ مِنْ شَرِّ مَا أَجِدُ وَأُحَاذِرُ (سبع مرات).',
    source: 'رواه مسلم',
    virtue: 'ضع يدك على الذي تألّم من جسدك وقل بسم الله ثلاثاً، ثم هذا الدعاء سبع مرات.',
    recommendedCount: 7,
    duaTracksBySheikh: {
      ghamdi: [
        {
          urls: [
            '/audio/ruqyah/duas/ghamdi-pain.mp3',
            '/audio/ruqyah/duas/hisn-243.mp3',
            'https://archive.org/download/ad3ya-ghamedi_up-by-ayoub-islam/Adkr17.mp3',
          ],
        },
      ],
      jibreel: [
        {
          urls: [
            '/audio/ruqyah/duas/jibreel-ruqyah-dua.mp3',
            '/audio/ruqyah/duas/ghamdi-pain.mp3',
          ],
        },
      ],
      durayhim: [
        {
          urls: [
            '/audio/ruqyah/duas/hisn-243.mp3',
            '/audio/ruqyah/duas/ghamdi-pain.mp3',
            'https://www.hisnmuslim.com/audio/ar/243.mp3',
          ],
        },
      ],
    },
  },
  {
    id: 'sunnah_protection',
    category: 'sunnah',
    title: 'التحصين التام بكلمات الله التامات',
    arabicText:
      'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّةِ مِنْ كُلِّ شَيْطَانٍ وَهَامَّةٍ، وَمِنْ كُلِّ عَيْنٍ لَامَّةٍ.\n\nبِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ.',
    source: 'البخاري · أبو داود والترمذي',
    virtue: 'من قال بسم الله الذي لا يضر... ثلاث مرات لم يصبه فجأة بلاء ولم يضره شيء.',
    recommendedCount: 3,
    duaTracksBySheikh: {
      ghamdi: [
        {
          urls: [
            '/audio/ruqyah/duas/ghamdi-evil-eye.mp3',
            '/audio/ruqyah/duas/hisn-146.mp3',
            'https://archive.org/download/ad3ya-ghamedi_up-by-ayoub-islam/Adkr34.mp3',
          ],
        },
        {
          urls: [
            '/audio/ruqyah/duas/hisn-86.mp3',
            '/audio/ruqyah/duas/ghamdi-distress.mp3',
            'https://www.hisnmuslim.com/audio/ar/86.mp3',
          ],
        },
      ],
      jibreel: [
        {
          urls: [
            '/audio/ruqyah/duas/hisn-146.mp3',
            '/audio/ruqyah/duas/jibreel-ruqyah-dua.mp3',
          ],
        },
        {
          urls: [
            '/audio/ruqyah/duas/hisn-86.mp3',
          ],
        },
      ],
      durayhim: [
        {
          urls: [
            '/audio/ruqyah/duas/hisn-146.mp3',
            'https://www.hisnmuslim.com/audio/ar/146.mp3',
          ],
        },
        {
          urls: [
            '/audio/ruqyah/duas/hisn-86.mp3',
            'https://www.hisnmuslim.com/audio/ar/86.mp3',
          ],
        },
      ],
    },
  },
];

export const ALL_RUQYAH_DUA_LOCAL_FILES: string[] = [
  '/audio/ruqyah/duas/ghamdi-ruqyah-patient.mp3',
  '/audio/ruqyah/duas/ghamdi-visit-patient.mp3',
  '/audio/ruqyah/duas/ghamdi-pain.mp3',
  '/audio/ruqyah/duas/ghamdi-evil-eye.mp3',
  '/audio/ruqyah/duas/ghamdi-distress.mp3',
  '/audio/ruqyah/duas/jibreel-ruqyah-dua.mp3',
  '/audio/ruqyah/duas/shafi-dua.mp3',
  '/audio/ruqyah/duas/hisn-86.mp3',
  '/audio/ruqyah/duas/hisn-146.mp3',
  '/audio/ruqyah/duas/hisn-147.mp3',
  '/audio/ruqyah/duas/hisn-148.mp3',
  '/audio/ruqyah/duas/hisn-243.mp3',
];

export const RUQYAH_CONTINUOUS_TRACK_IDS: RuqyahContinuousTrackId[] = [
  'fatiha',
  'kursi',
  'baqarah_end',
  'shifa_verses',
  'muawwidhat',
];

export const ALL_RUQYAH_CONTINUOUS_FILES: string[] = RUQYAH_RECITERS.flatMap((r) =>
  RUQYAH_CONTINUOUS_TRACK_IDS.map((trackId) => `/audio/ruqyah/continuous/${r.id}/${trackId}.mp3`)
);

export function buildContinuousRuqyahUrls(
  reciter: RuqyahReciter,
  trackId: RuqyahContinuousTrackId
): string[] {
  const urls = [`/audio/ruqyah/continuous/${reciter.id}/${trackId}.mp3`];
  if (trackId === 'fatiha') {
    urls.push(`${reciter.mp3quranBase}/001.mp3`);
  }
  return urls;
}

export const ALL_RUQYAH_VERSE_CODES: string[] = Array.from(
  new Set(RUQYAH_ITEMS.flatMap((it) => it.verseCodes || []))
);

export function buildVerseAudioUrls(
  _reciterId: string,
  everyayahFolder: string,
  verseCode: string
): string[] {
  return [
    `https://everyayah.com/data/${everyayahFolder}/${verseCode}.mp3`,
  ];
}

export function buildVerseAudioUrl(reciterFolder: string, verseCode: string): string {
  return `https://everyayah.com/data/${reciterFolder}/${verseCode}.mp3`;
}
