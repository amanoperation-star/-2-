export type ShortAdhkarSheikhId =
  | 'rotate'
  | 'durayhim'
  | 'ghamdi'
  | 'alafasy'
  | 'dosari'
  | 'muaiqly';

export interface ShortAdhkarSheikhProfile {
  id: ShortAdhkarSheikhId;
  nameAr: string;
  subtitleAr: string;
}

export const SHORT_ADHKAR_SHEIKHS: ShortAdhkarSheikhProfile[] = [
  {
    id: 'rotate',
    nameAr: 'تبديل تلقائي بين الشيوخ (مقاطع قصيرة)',
    subtitleAr: 'ينوّع تلقائياً بين الشيوخ الحقيقيين في كل ذكر',
  },
  {
    id: 'durayhim',
    nameAr: 'الشيخ حمد الدريهم (مقاطع أذكار قصيرة)',
    subtitleAr: 'نطق واضح وخاشع لجميع الأذكار النبوية والقرآنية',
  },
  {
    id: 'ghamdi',
    nameAr: 'الشيخ سعد الغامدي (أدعية وأذكار قصيرة)',
    subtitleAr: 'سيد الاستغفار وكفارة المجلس وآيات التحصين والأدعية المأثورة',
  },
  {
    id: 'alafasy',
    nameAr: 'الشيخ مشاري راشد العفاسي',
    subtitleAr: 'تلاوة قصيرة لآية الكرسي والمعوذات والفاتحة والأدعية القرآنية',
  },
  {
    id: 'dosari',
    nameAr: 'الشيخ ياسر الدوسري',
    subtitleAr: 'تلاوة ندية لآية الكرسي والمعوذات وخواتيم البقرة والأدعية القرآنية',
  },
  {
    id: 'muaiqly',
    nameAr: 'الشيخ ماهر المعيقلي',
    subtitleAr: 'تلاوة الحرم المكي لآيات التحصين والفاتحة والأدعية القرآنية',
  },
];

export interface ShortDhikrClipChoice {
  sheikhId: Exclude<ShortAdhkarSheikhId, 'rotate'>;
  sheikhNameAr: string;
  urls: string[];
}

const SHEIKH_NAMES: Record<Exclude<ShortAdhkarSheikhId, 'rotate'>, string> = {
  durayhim: 'الشيخ حمد الدريهم',
  ghamdi: 'الشيخ سعد الغامدي',
  alafasy: 'الشيخ مشاري راشد العفاسي',
  dosari: 'الشيخ ياسر الدوسري',
  muaiqly: 'الشيخ ماهر المعيقلي',
};

const ghamdiArchive = (filename: string) =>
  `https://archive.org/download/ad3ya-ghamedi_up-by-ayoub-islam/${filename}`;

const durayhimClip = (
  hisnId: number,
  localPath?: string
): ShortDhikrClipChoice => {
  const padded = String(hisnId).padStart(3, '0');
  const urls: string[] = [];
  if (localPath) urls.push(localPath);
  urls.push(
    `https://ar.assabile.com/media/dua/${padded}.mp3`,
    `https://www.hisnmuslim.com/audio/ar/${hisnId}.mp3`
  );
  return {
    sheikhId: 'durayhim',
    sheikhNameAr: SHEIKH_NAMES.durayhim,
    urls,
  };
};

const ghamdiClip = (
  filename: string,
  localPath?: string
): ShortDhikrClipChoice => {
  const urls: string[] = [];
  if (localPath) urls.push(localPath);
  urls.push(ghamdiArchive(filename));
  return {
    sheikhId: 'ghamdi',
    sheikhNameAr: SHEIKH_NAMES.ghamdi,
    urls,
  };
};

const quranContinuousClips = (
  trackId: 'kursi' | 'muawwidhat' | 'baqarah_end' | 'fatiha'
): ShortDhikrClipChoice[] => [
  {
    sheikhId: 'alafasy',
    sheikhNameAr: SHEIKH_NAMES.alafasy,
    urls: [`/audio/ruqyah/continuous/alafasy/${trackId}.mp3`],
  },
  {
    sheikhId: 'dosari',
    sheikhNameAr: SHEIKH_NAMES.dosari,
    urls: [`/audio/ruqyah/continuous/dosari/${trackId}.mp3`],
  },
  {
    sheikhId: 'muaiqly',
    sheikhNameAr: SHEIKH_NAMES.muaiqly,
    urls: [`/audio/ruqyah/continuous/muaiqly/${trackId}.mp3`],
  },
];

const everyAyahVerseClips = (
  verseCode: string,
  localPrefix?: 'yunus' | 'hasanah'
): ShortDhikrClipChoice[] => [
  {
    sheikhId: 'alafasy',
    sheikhNameAr: SHEIKH_NAMES.alafasy,
    urls: [
      ...(localPrefix ? [`/audio/adhkar/short/alafasy-${localPrefix}.mp3`] : []),
      `https://everyayah.com/data/Alafasy_128kbps/${verseCode}.mp3`,
    ],
  },
  {
    sheikhId: 'dosari',
    sheikhNameAr: SHEIKH_NAMES.dosari,
    urls: [
      ...(localPrefix ? [`/audio/adhkar/short/dosari-${localPrefix}.mp3`] : []),
      `https://everyayah.com/data/Yasser_Ad-Dussary_128kbps/${verseCode}.mp3`,
    ],
  },
  {
    sheikhId: 'muaiqly',
    sheikhNameAr: SHEIKH_NAMES.muaiqly,
    urls: [
      ...(localPrefix ? [`/audio/adhkar/short/muaiqly-${localPrefix}.mp3`] : []),
      `https://everyayah.com/data/MaherAlMuaiqly128kbps/${verseCode}.mp3`,
    ],
  },
  {
    sheikhId: 'ghamdi',
    sheikhNameAr: SHEIKH_NAMES.ghamdi,
    urls: [
      ...(localPrefix ? [`/audio/adhkar/short/ghamdi-${localPrefix}.mp3`] : []),
      `https://everyayah.com/data/Ghamadi_40kbps/${verseCode}.mp3`,
    ],
  },
];

export const SHORT_DHIKR_AUDIO_MAP: Record<string, ShortDhikrClipChoice[]> = {
  // =======================================================
  // Daily Adhkar Cards (DAILY_ADHIKAR)
  // =======================================================
  '1': [durayhimClip(91, '/audio/adhkar/short/durayhim-91.mp3')],
  '2': [durayhimClip(92, '/audio/adhkar/short/durayhim-92.mp3')],
  '3': [durayhimClip(96, '/audio/adhkar/short/durayhim-96.mp3')],
  '4': [
    ghamdiClip('Adkr39.mp3', '/audio/adhkar/short/ghamdi-sayyid.mp3'),
    durayhimClip(79, '/audio/adhkar/short/durayhim-79.mp3'),
  ],
  '5': [durayhimClip(87, '/audio/adhkar/short/durayhim-87.mp3')],
  '6': [durayhimClip(86, '/audio/ruqyah/duas/hisn-86.mp3')],
  '7': [durayhimClip(83, '/audio/adhkar/short/durayhim-83.mp3')],
  '8': [durayhimClip(97, '/audio/adhkar/short/durayhim-97.mp3')],
  '9': [durayhimClip(88, '/audio/adhkar/short/durayhim-88.mp3')],
  '10': [durayhimClip(94, '/audio/adhkar/short/durayhim-94.mp3')],
  '11': [durayhimClip(78, '/audio/adhkar/short/durayhim-78.mp3')],
  '12': [durayhimClip(98, '/audio/adhkar/short/durayhim-98.mp3')],
  '13': [
    ...quranContinuousClips('kursi'),
    ghamdiClip('Adkr80.mp3', '/audio/adhkar/short/ghamdi-kursi.mp3'),
    durayhimClip(75, '/audio/adhkar/short/durayhim-75.mp3'),
  ],
  '14': [
    ...quranContinuousClips('muawwidhat'),
    ghamdiClip('Adkr79.mp3', '/audio/adhkar/short/ghamdi-muawwidhat.mp3'),
    durayhimClip(76, '/audio/adhkar/short/durayhim-76.mp3'),
  ],
  '15': [ghamdiClip('Adkr38.mp3', '/audio/adhkar/short/ghamdi-kaffarah.mp3')],
  '16': [...quranContinuousClips('baqarah_end')],
  '17': [...quranContinuousClips('fatiha')],
  '18': [
    ...everyAyahVerseClips('021087', 'yunus'),
    durayhimClip(123, '/audio/adhkar/short/durayhim-123.mp3'),
  ],
  '19': [
    ...everyAyahVerseClips('002201', 'hasanah'),
    durayhimClip(254, '/audio/adhkar/short/durayhim-254.mp3'),
  ],

  // =======================================================
  // Hisn Al-Muslim Comprehensive Cards (HISN_AL_MUSLIM_ADHKAR)
  // =======================================================
  hisn_morning_1: [
    ...quranContinuousClips('kursi'),
    ghamdiClip('Adkr80.mp3', '/audio/adhkar/short/ghamdi-kursi.mp3'),
    durayhimClip(75, '/audio/adhkar/short/durayhim-75.mp3'),
  ],
  hisn_morning_2: [
    ...quranContinuousClips('muawwidhat'),
    ghamdiClip('Adkr79.mp3', '/audio/adhkar/short/ghamdi-muawwidhat.mp3'),
    durayhimClip(76, '/audio/adhkar/short/durayhim-76.mp3'),
  ],
  hisn_morning_3: [
    ghamdiClip('Adkr39.mp3', '/audio/adhkar/short/ghamdi-sayyid.mp3'),
    durayhimClip(79, '/audio/adhkar/short/durayhim-79.mp3'),
  ],
  hisn_morning_4: [durayhimClip(77, '/audio/adhkar/short/durayhim-77.mp3')],
  hisn_morning_5: [durayhimClip(86, '/audio/ruqyah/duas/hisn-86.mp3')],
  hisn_morning_6: [durayhimClip(87, '/audio/adhkar/short/durayhim-87.mp3')],
  hisn_morning_7: [durayhimClip(83, '/audio/adhkar/short/durayhim-83.mp3')],

  hisn_evening_1: [durayhimClip(77, '/audio/adhkar/short/durayhim-77.mp3')],
  hisn_evening_2: [durayhimClip(78, '/audio/adhkar/short/durayhim-78.mp3')],
  hisn_evening_3: [durayhimClip(97, '/audio/adhkar/short/durayhim-97.mp3')],
  hisn_evening_4: [durayhimClip(80)],
  hisn_evening_5: [durayhimClip(81)],
  hisn_evening_6: [durayhimClip(82)],

  hisn_after_1: [ghamdiClip('Adkr82.mp3'), durayhimClip(66)],
  hisn_after_2: [ghamdiClip('Adkr81.mp3'), durayhimClip(67)],
  hisn_after_3: [durayhimClip(69)],
  hisn_after_4: [durayhimClip(72)],
  hisn_after_5: [
    ...quranContinuousClips('kursi'),
    ghamdiClip('Adkr80.mp3', '/audio/adhkar/short/ghamdi-kursi.mp3'),
    durayhimClip(75, '/audio/adhkar/short/durayhim-75.mp3'),
  ],
  hisn_after_6: [durayhimClip(95)],

  hisn_travel_1: [ghamdiClip('Adkr44.mp3'), durayhimClip(204)],
  hisn_travel_2: [ghamdiClip('Adkr66.mp3'), durayhimClip(206)],
  hisn_travel_3: [ghamdiClip('Adkr18.mp3'), durayhimClip(208)],
  hisn_travel_4: [durayhimClip(202)],
  hisn_travel_5: [ghamdiClip('Adkr22.mp3'), durayhimClip(201)],
  hisn_travel_6: [ghamdiClip('Adkr51.mp3'), durayhimClip(212)],

  hisn_sleep_1: [ghamdiClip('Adkr84.mp3'), durayhimClip(105)],
  hisn_sleep_2: [ghamdiClip('Adkr13.mp3'), durayhimClip(109)],
  hisn_sleep_3: [durayhimClip(107)],
  hisn_sleep_4: [durayhimClip(108)],
  hisn_sleep_5: [ghamdiClip('Adkr12.mp3'), durayhimClip(1)],
  hisn_sleep_6: [ghamdiClip('Adkr49.mp3'), durayhimClip(115)],

  hisn_home_1: [ghamdiClip('Adkr02-.mp3'), durayhimClip(16)],
  hisn_home_2: [ghamdiClip('Adkr45.mp3'), durayhimClip(17)],
  hisn_home_3: [ghamdiClip('Adkr78.mp3'), durayhimClip(14)],
  hisn_home_4: [ghamdiClip('Adkr04.mp3'), durayhimClip(18)],
  hisn_home_5: [ghamdiClip('Adkr52.mp3'), durayhimClip(19)],
  hisn_home_6: [ghamdiClip('Adkr03.mp3'), durayhimClip(10)],

  hisn_distress_1: [ghamdiClip('Adkr42.mp3'), durayhimClip(120)],
  hisn_distress_2: [ghamdiClip('Adkr48.mp3'), durayhimClip(121)],
  hisn_distress_3: [
    ...everyAyahVerseClips('021087', 'yunus'),
    durayhimClip(123, '/audio/adhkar/short/durayhim-123.mp3'),
  ],
  hisn_distress_4: [
    ghamdiClip('Adkr17.mp3', '/audio/ruqyah/duas/ghamdi-pain.mp3'),
    durayhimClip(243, '/audio/ruqyah/duas/hisn-243.mp3'),
  ],
  hisn_distress_5: [
    ghamdiClip('Adkr25.mp3', '/audio/ruqyah/duas/ghamdi-visit-patient.mp3'),
    durayhimClip(148, '/audio/ruqyah/duas/hisn-148.mp3'),
  ],
  hisn_distress_6: [ghamdiClip('Adkr53.mp3'), durayhimClip(74)],

  hisn_food_1: [ghamdiClip('Adkr85.mp3'), durayhimClip(178)],
  hisn_food_2: [ghamdiClip('Adkr60.mp3'), durayhimClip(181)],
  hisn_food_3: [durayhimClip(6)],
  hisn_food_4: [ghamdiClip('Adkr65.mp3'), durayhimClip(171)],
  hisn_food_5: [ghamdiClip('Adkr23.mp3'), durayhimClip(167)],
  hisn_food_6: [ghamdiClip('Adkr24.mp3'), durayhimClip(169)],

  hisn_forgiveness_1: [durayhimClip(251)],
  hisn_forgiveness_2: [durayhimClip(94, '/audio/adhkar/short/durayhim-94.mp3')],
  hisn_forgiveness_3: [durayhimClip(96, '/audio/adhkar/short/durayhim-96.mp3')],
  hisn_forgiveness_4: [durayhimClip(252)],
  hisn_forgiveness_5: [
    ...everyAyahVerseClips('002201', 'hasanah'),
    durayhimClip(254, '/audio/adhkar/short/durayhim-254.mp3'),
  ],
  hisn_forgiveness_6: [durayhimClip(98, '/audio/adhkar/short/durayhim-98.mp3')],
};

export function hasExactShortClipForSheikh(
  dhikrId: string,
  sheikhId: ShortAdhkarSheikhId
): boolean {
  if (sheikhId === 'rotate') return (SHORT_DHIKR_AUDIO_MAP[dhikrId]?.length || 0) > 0;
  const candidates = SHORT_DHIKR_AUDIO_MAP[dhikrId];
  return Boolean(candidates?.some((c) => c.sheikhId === sheikhId));
}

export function resolveShortDhikrClip(
  dhikrId: string,
  preferredSheikhId: ShortAdhkarSheikhId = 'rotate',
  rotationCounter: number = 0
): ShortDhikrClipChoice | null {
  const candidates = SHORT_DHIKR_AUDIO_MAP[dhikrId];
  if (!candidates || candidates.length === 0) return null;

  if (preferredSheikhId !== 'rotate') {
    const exactMatch = candidates.find((c) => c.sheikhId === preferredSheikhId);
    if (exactMatch) return exactMatch;
  }

  return candidates[Math.abs(rotationCounter) % candidates.length];
}
