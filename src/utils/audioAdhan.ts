// Audio player for Real MP3 Adhan, Fajr special tone, Dua After Adhan, and Pre-Adhan chime
import { resolvePlayableAudioUrl } from './offlineAudioManager';
import {
  SHORT_DHIKR_AUDIO_MAP,
  ShortAdhkarSheikhId,
  resolveShortDhikrClip,
} from './shortAdhkarAudio';

export interface AdhanAudioSource {
  id: string;
  nameAr: string;
  nameEn: string;
  khushuTagAr?: string;
  approxSizeMb?: number;
  isFajrSpecial?: boolean;
  urls: string[]; // List of URLs to try in order (local, cdn, fallback mirrors)
}

export const ADHAN_SOURCES: Record<string, AdhanAudioSource> = {
  makkah: {
    id: 'makkah',
    nameAr: 'أذان مكة المكرمة (الشيخ علي ملا - الحرم المكي)',
    nameEn: 'Makkah Al-Mukarramah - Sheikh Ali Mullah',
    khushuTagAr: 'المقام الحجازي العريق · هيبة الحرم المكي',
    approxSizeMb: 0.7,
    urls: [
      '/audio/adhan-makkah.mp3',
      'https://media.assabile.com/assabile/adhan_3435370/54944191e2e2.mp3',
    ],
  },
  madinah: {
    id: 'madinah',
    nameAr: 'أذان المدينة المنورة (المسجد النبوي الشريف)',
    nameEn: 'Madinah Al-Munawwarah - Prophet Mosque',
    khushuTagAr: 'سكينة المسجد النبوي · نبرة مدنية هادئة',
    approxSizeMb: 0.4,
    urls: [
      '/audio/adhan-madinah.mp3',
      'https://media.assabile.com/assabile/adhan_3435370/b30ca9a3e115.mp3',
    ],
  },
  islam_sobhi: {
    id: 'islam_sobhi',
    nameAr: 'أذان الشيخ إسلام صبحي (نبرة خاشعة مؤثرة)',
    nameEn: 'Sheikh Islam Sobhi (Reverent)',
    khushuTagAr: 'نبرة عذبة خاشعة تلامس القلوب',
    approxSizeMb: 3.4,
    urls: [
      '/audio/adhan-islam-sobhi.mp3',
      'https://raw.githubusercontent.com/mohsalvi/adhan-audio/main/general/islam-sobhi-01.mp3',
      'https://archive.org/download/A.S.I.S/Adhan_Sheikh-Islam-Sobhi.mp3',
    ],
  },
  mansour_salmi: {
    id: 'mansour_salmi',
    nameAr: 'أذان الشيخ منصور السالمي (صوت شجي خاشع)',
    nameEn: 'Sheikh Mansour Al-Salmi (Emotional)',
    khushuTagAr: 'أداء شجيّ رقيق يبعث الرقّة والخشوع',
    approxSizeMb: 1.6,
    urls: [
      '/audio/adhan-mansour-salmi.mp3',
    ],
  },
  ahmad_nufais: {
    id: 'ahmad_nufais',
    nameAr: 'أذان الشيخ أحمد النفيس (خشوع وهدوء آسر)',
    nameEn: 'Sheikh Ahmad Al-Nufais',
    khushuTagAr: 'تؤدة وخشوع عميق ونقاء صوتي هادئ',
    approxSizeMb: 3.3,
    urls: [
      '/audio/adhan-ahmad-nufais.mp3',
      'https://raw.githubusercontent.com/mohsalvi/adhan-audio/main/general/ahmad-al-nafees-01.mp3',
      'https://raw.githubusercontent.com/DBChoco/Muezzin/master/ressources/audio/Adhan%20-%20Ahmed%20Al-Nufais.mp3',
    ],
  },
  toubar: {
    id: 'toubar',
    nameAr: 'أذان الشيخ نصر الدين طوبار (مقام روحاني خاشع)',
    nameEn: 'Sheikh Nasreddine Toubar',
    khushuTagAr: 'أداء روحاني مهيب يوقظ القلب للذكر',
    approxSizeMb: 4.0,
    urls: [
      '/audio/adhan-toubar.mp3',
      'https://raw.githubusercontent.com/Kiwifu/adhan-mp3/main/Nasreddine_Toubar_(%D9%86%D8%B5%D8%B1_%D8%A7%D9%84%D8%AF%D9%8A%D9%86_%D8%B7%D9%88%D8%A8%D8%A7%D8%B1).mp3',
    ],
  },
  husary: {
    id: 'husary',
    nameAr: 'أذان الشيخ محمود خليل الحصري (خشوع ورصانة مصرية)',
    nameEn: 'Sheikh Mahmoud Khalil Al-Husary',
    khushuTagAr: 'رصانة وتجويد متقن على طريقة كبار القرّاء',
    approxSizeMb: 0.3,
    urls: [
      '/audio/adhan-husary.mp3',
      'https://media.assabile.com/assabile/adhan_3435370/cdb24a4bd658.mp3',
      'https://raw.githubusercontent.com/Kiwifu/adhan-mp3/main/Mahmoud_Khalil_Al_Hussary_-_Cairo_(%D9%85%D8%AD%D9%85%D9%88%D8%AF_%D8%AE%D9%84%D9%8A%D9%84_%D8%A7%D9%84%D8%AD%D8%B5%D8%B1%D9%8A_-_%D8%A7%D9%84%D9%82%D8%A7%D9%87%D8%B1%D8%A9).mp3',
    ],
  },
  zahrani: {
    id: 'zahrani',
    nameAr: 'أذان الشيخ منصور الزهراني (صوت شجي خاشع)',
    nameEn: 'Sheikh Mansour Al-Zahrani',
    khushuTagAr: 'نبرة حزينة هادئة ومؤثرة في النفوس',
    approxSizeMb: 0.7,
    urls: [
      '/audio/adhan-zahrani.mp3',
      'https://raw.githubusercontent.com/Kiwifu/adhan-mp3/main/Mansur_Al_Zahrane_-_HQ_(%D9%85%D9%86%D8%B5%D9%88%D8%B1_%D8%A7%D9%84%D8%B2%D9%87%D8%B1%D8%A7%D9%86%D9%8A).mp3',
      'https://raw.githubusercontent.com/mohsalvi/adhan-audio/main/general/mansour-al-zahrani-01.mp3',
    ],
  },
  kazabri: {
    id: 'kazabri',
    nameAr: 'أذان الشيخ عمر القزابري (نبرة مغربية خاشعة)',
    nameEn: 'Sheikh Omar Al-Kazabri',
    khushuTagAr: 'خشوع مغربي أصيل بصوت جهوري نديّ',
    approxSizeMb: 1.8,
    urls: [
      '/audio/adhan-kazabri.mp3',
      'https://raw.githubusercontent.com/Kiwifu/adhan-mp3/main/Omar_Al_Kazabri_(%D8%B9%D9%85%D8%B1_%D8%A7%D9%84%D9%82%D8%B2%D8%A7%D8%A8%D8%B1%D9%8A).mp3',
    ],
  },
  utaybi: {
    id: 'utaybi',
    nameAr: 'أذان الشيخ سلمان العتيبي (صوت هادئ مطمئن)',
    nameEn: 'Sheikh Salman Al-Utaybi',
    khushuTagAr: 'نبرة هادئة شجية تبعث الطمأنينة',
    approxSizeMb: 3.6,
    urls: [
      '/audio/adhan-utaybi.mp3',
      'https://raw.githubusercontent.com/mohsalvi/adhan-audio/main/general/salman-al-utaybi-01.mp3',
    ],
  },
  yamani: {
    id: 'yamani',
    nameAr: 'أذان الشيخ وديع اليمني (نبرة رقيقة خاشعة)',
    nameEn: 'Sheikh Wadi Al-Yamani',
    khushuTagAr: 'صوت دافئ خاشع بأداء سلس هادئ',
    approxSizeMb: 3.1,
    urls: [
      '/audio/adhan-yamani.mp3',
      'https://raw.githubusercontent.com/Kiwifu/adhan-mp3/main/Wadi_Al_Yamani_(%D9%88%D8%AF%D9%8A%D8%B9_%D8%A7%D9%84%D9%8A%D9%85%D9%86%D9%8A).mp3',
    ],
  },
  naqshabandi: {
    id: 'naqshabandi',
    nameAr: 'أذان الشيخ سيد النقشبندي (مقام خشوع روحاني)',
    nameEn: 'Sheikh Sayed Al-Naqshabandi',
    khushuTagAr: 'خشوع كلاسيكي مهيب من روائع التراث',
    approxSizeMb: 2.1,
    urls: [
      '/audio/adhan-naqshabandi.mp3',
      'https://raw.githubusercontent.com/Kiwifu/adhan-mp3/main/Sheikh_Al_Naqshbandi_(%D8%A7%D9%84%D8%B4%D9%8A%D8%AE_%D8%A7%D9%84%D9%86%D9%82%D8%B4%D8%A8%D9%86%D8%AF%D9%89).mp3',
    ],
  },
  abdulbasit: {
    id: 'abdulbasit',
    nameAr: 'أذان الشيخ عبد الباسط عبد الصمد (مقام الصبا الخاشع)',
    nameEn: 'Sheikh Abdulbasit Abdulsamad',
    khushuTagAr: 'مقام الصبا الحزين الخاشع',
    approxSizeMb: 4.3,
    urls: [
      '/audio/adhan-abdulbasit.mp3',
      'https://media.assabile.com/assabile/adhan_3435370/566852c1d145.mp3',
    ],
  },
  mishary: {
    id: 'mishary',
    nameAr: 'أذان الشيخ مشاري راشد العفاسي',
    nameEn: 'Sheikh Mishary Rashid Alafasy',
    khushuTagAr: 'نقاء صوتي وخشوع متزن',
    approxSizeMb: 1.0,
    urls: [
      '/audio/adhan-mishary.mp3',
      'https://media.assabile.com/assabile/adhan_3435370/b45e93f1efb3.mp3',
    ],
  },
  dosari: {
    id: 'dosari',
    nameAr: 'أذان الشيخ ياسر الدوسري',
    nameEn: 'Sheikh Yasser Al-Dosari',
    khushuTagAr: 'أداء مؤثر بقوة وخشوع الحرم',
    approxSizeMb: 1.4,
    urls: [
      '/audio/adhan-dosari.mp3',
      'https://media.assabile.com/assabile/adhan_3435370/f5370aa1a7e2.mp3',
    ],
  },
  nasir: {
    id: 'nasir',
    nameAr: 'أذان الشيخ ناصر القطامي',
    nameEn: 'Sheikh Nasser Al-Qatami',
    khushuTagAr: 'نبرة شجية مألوفة للخشوع',
    approxSizeMb: 2.1,
    urls: [
      '/audio/adhan-nasir.mp3',
      'https://media.assabile.com/assabile/adhan_3435370/6f509ec934a4.mp3',
    ],
  },
  minshawi: {
    id: 'minshawi',
    nameAr: 'أذان الشيخ محمد صديق المنشاوي',
    nameEn: 'Sheikh Mohamed Siddiq El-Minshawi',
    khushuTagAr: 'الصوت الباكي الخاشع الخالد',
    approxSizeMb: 3.8,
    urls: [
      '/audio/adhan-minshawi.mp3',
      'https://media.assabile.com/assabile/adhan_3435370/a2b25725149e.mp3',
    ],
  },
  egypt: {
    id: 'egypt',
    nameAr: 'أذان مصر (الشيخ محمد رفعت - أذان الإذاعة المصرية)',
    nameEn: 'Egypt - Sheikh Mohamed Rifat',
    khushuTagAr: 'الأذان التراثي الخاشع الخالد',
    approxSizeMb: 0.4,
    urls: [
      '/audio/adhan-egypt.mp3',
      'https://media.assabile.com/assabile/adhan_3435370/d8a3a72860e8.mp3',
    ],
  },
};

// Dedicated Full-Length Fajr Adhan Sources (أذان صلاة الفجر المستقل الكامل)
export const FAJR_ADHAN_SOURCES: Record<string, AdhanAudioSource> = {
  fajr_makkah: {
    id: 'fajr_makkah',
    nameAr: 'أذان فجر الحرم المكي كامل (الصلاة خير من النوم)',
    nameEn: 'Fajr Adhan Makkah Al-Haram (Full)',
    khushuTagAr: 'الحرم المكي · الصلاة خير من النوم',
    approxSizeMb: 4.1,
    isFajrSpecial: true,
    urls: [
      '/audio/adhan-fajr-makkah.mp3',
      '/audio/adhan-fajr.mp3',
      'https://media.assabile.com/assabile/adhan_3435370/518b4e081437.mp3',
    ],
  },
  fajr_madinah: {
    id: 'fajr_madinah',
    nameAr: 'أذان فجر المسجد النبوي بالمدينة المنورة كامل (الصلاة خير من النوم)',
    nameEn: 'Fajr Adhan Madinah Prophet Mosque (Full)',
    khushuTagAr: 'المسجد النبوي · الصلاة خير من النوم',
    approxSizeMb: 0.6,
    isFajrSpecial: true,
    urls: [
      '/audio/adhan-fajr-madinah.mp3',
      'https://media.assabile.com/assabile/adhan_3435370/efc564e3b1d2.mp3',
    ],
  },
  fajr_toubar: {
    id: 'fajr_toubar',
    nameAr: 'أذان الفجر الخاشع بصوت الشيخ نصر الدين طوبار (الصلاة خير من النوم)',
    nameEn: 'Fajr Adhan Sheikh Nasreddine Toubar (Full)',
    khushuTagAr: 'نداء سحري روحاني خاشع · ٤ دقائق',
    approxSizeMb: 4.4,
    isFajrSpecial: true,
    urls: [
      '/audio/adhan-fajr-toubar.mp3',
      'https://raw.githubusercontent.com/Kiwifu/adhan-mp3/main/Fajr_Adhan_by_Nasreddine_Toubar_(%D8%A7%D8%B0%D8%A7%D9%86_%D8%A7%D9%84%D9%81%D8%AC%D8%B1_%D8%A8%D8%B5%D9%88%D8%AA_%D9%86%D8%B5%D8%B1_%D8%A7%D9%84%D8%AF%D9%8A%D9%86_%D8%B7%D9%88%D8%A8%D8%A7%D8%B1).mp3',
    ],
  },
  fajr_zahrani: {
    id: 'fajr_zahrani',
    nameAr: 'أذان الفجر الشجي بصوت الشيخ منصور الزهراني (الصلاة خير من النوم)',
    nameEn: 'Fajr Adhan Sheikh Mansour Al-Zahrani (Full)',
    khushuTagAr: 'نبرة فجر شجية مؤثرة توقظ القلوب',
    approxSizeMb: 1.0,
    isFajrSpecial: true,
    urls: [
      '/audio/adhan-fajr-zahrani.mp3',
      'https://raw.githubusercontent.com/mohsalvi/adhan-audio/main/fajr/mansour-al-zahrani-fajr-01.mp3',
    ],
  },
  fajr_abdulbasit: {
    id: 'fajr_abdulbasit',
    nameAr: 'أذان الفجر كامل بصوت الشيخ عبد الباسط عبد الصمد',
    nameEn: 'Fajr Adhan Sheikh Abdulbasit Abdulsamad (Full)',
    khushuTagAr: 'مقام الصبا الفجري الخاشع',
    approxSizeMb: 1.4,
    isFajrSpecial: true,
    urls: [
      '/audio/adhan-fajr-abdulbasit.mp3',
      'https://media.assabile.com/assabile/adhan_3435370/1125f640d83b.mp3',
    ],
  },
  fajr_dosari: {
    id: 'fajr_dosari',
    nameAr: 'أذان بصوت الشيخ ياسر الدوسري (التسجيل المعتمد)',
    nameEn: 'Adhan Sheikh Yasser Al-Dosari',
    khushuTagAr: 'نبرة خاشعة مهيبة للفجر',
    approxSizeMb: 1.4,
    isFajrSpecial: true,
    urls: [
      '/audio/adhan-fajr-dosari.mp3',
      '/audio/adhan-dosari.mp3',
      'https://media.assabile.com/assabile/adhan_3435370/f5370aa1a7e2.mp3',
    ],
  },
  fajr_mishary: {
    id: 'fajr_mishary',
    nameAr: 'أذان الفجر كامل بصوت الشيخ مشاري راشد العفاسي',
    nameEn: 'Fajr Adhan Sheikh Mishary Alafasy (Full)',
    khushuTagAr: 'أذان الفجر بالكويت · نبرة هادئة',
    approxSizeMb: 2.3,
    isFajrSpecial: true,
    urls: [
      '/audio/adhan-fajr-mishary.mp3',
      'https://media.assabile.com/assabile/adhan_3435370/b91e1c5095cd.mp3',
    ],
  },
};

export function getAdhanSource(reciterId: string = 'makkah', prayerKey?: string): AdhanAudioSource {
  if (prayerKey === 'fajr' || reciterId.startsWith('fajr_')) {
    if (FAJR_ADHAN_SOURCES[reciterId]) return FAJR_ADHAN_SOURCES[reciterId];
    const mappedFajrId = `fajr_${reciterId}`;
    if (FAJR_ADHAN_SOURCES[mappedFajrId]) return FAJR_ADHAN_SOURCES[mappedFajrId];
    return ADHAN_SOURCES[reciterId] || FAJR_ADHAN_SOURCES.fajr_makkah;
  }
  return ADHAN_SOURCES[reciterId] || FAJR_ADHAN_SOURCES[reciterId] || ADHAN_SOURCES.makkah;
}

// Dua After Adhan Audio Sources (100% genuine, distinct verified Sheikh recordings)
export const DUA_SOURCES: Record<string, AdhanAudioSource> = {
  shaarawy: {
    id: 'shaarawy',
    nameAr: 'دعاء ما بعد الأذان بصوت الشيخ محمد متولي الشعراوي (كامل)',
    nameEn: 'Sheikh Mohamed Metwally El-Shaarawy (Dua After Adhan)',
    urls: [
      '/audio/dua-shaarawy.mp3',
      'https://archive.org/download/Islamic_Tape-258_uP_bY_mUSLEm/sharawy_doaa_24.mp3',
      'https://archive.org/download/sharawy_doaa_24/sharawy_doaa_24.mp3',
    ],
  },
  alafasy_dua: {
    id: 'alafasy_dua',
    nameAr: 'دعاء ما بعد الأذان بصوت الشيخ مشاري راشد العفاسي',
    nameEn: 'Sheikh Mishary Rashid Alafasy (Dua After Adhan)',
    urls: [
      '/audio/dua-alafasy.mp3',
    ],
  },
  ghamdi_dua: {
    id: 'ghamdi_dua',
    nameAr: 'أذكار ودعاء سماع الأذان بصوت الشيخ سعد الغامدي',
    nameEn: 'Sheikh Saad Al-Ghamdi (Adhan Adhkar & Dua)',
    urls: [
      '/audio/dua-ghamdi.mp3',
      'https://archive.org/download/ad3ya-ghamedi_up-by-ayoub-islam/Adkr67.mp3',
    ],
  },
  durayhim_dua: {
    id: 'durayhim_dua',
    nameAr: 'دعاء ما بعد الأذان بصوت الشيخ حمد الدريهم (اللهم رب هذه الدعوة التامة)',
    nameEn: 'Sheikh Hamad Al-Durayhim (Dua After Adhan)',
    urls: [
      '/audio/dua-durayhim.mp3',
      'https://archive.org/download/2_20250602_20250602_1135/adkar_be3d_adan/4.mp3',
      'https://www.hisnmuslim.com/audio/ar/25.mp3',
      'https://ar.assabile.com/media/dua/025.mp3',
    ],
  },
  sharif: {
    id: 'sharif',
    nameAr: 'دعاء الأذان الشريف (اللهم رب هذه الدعوة التامة — تسجيل واضح)',
    nameEn: 'Dua Al-Adhan Sharif (Clear Recitation)',
    urls: [
      '/audio/dua-after-adhan.mp3',
      'https://archive.org/download/daily_duaas/7_upon_hearing_the_adhan.mp3',
    ],
  },
};

export function getDuaSource(duaId: string = 'shaarawy'): AdhanAudioSource {
  return (duaId && DUA_SOURCES[duaId]) ? DUA_SOURCES[duaId] : DUA_SOURCES.shaarawy;
}

// Adhkar Morning & Evening Sheikh Audio Sources
export const ADHKAR_SOURCES: Record<string, AdhanAudioSource> = {
  alafasy_adhkar: {
    id: 'alafasy_adhkar',
    nameAr: 'الشيخ مشاري راشد العفاسي (أذكار الصباح والمساء)',
    nameEn: 'Sheikh Mishary Rashid Alafasy',
    urls: [
      '/audio/adhkar-masaa-alafasy.mp3',
      '/audio/adhkar-sabah-alafasy.mp3',
      'https://archive.org/download/adkar-Morning-Evening/athkar_04.mp3',
      'https://archive.org/download/adkar-Morning-Evening/athkar_03.mp3',
    ],
  },
  abbad_adhkar: {
    id: 'abbad_adhkar',
    nameAr: 'الشيخ فارس عباد (صوت شجي مؤثر)',
    nameEn: 'Sheikh Fares Abbad',
    urls: [
      '/audio/adhkar-masaa-abbad.mp3',
      '/audio/adhkar-sabah-abbad.mp3',
      'https://archive.org/download/adkar-Morning-Evening/athkar_06.mp3',
      'https://archive.org/download/adkar-Morning-Evening/athkar_05.mp3',
    ],
  },
  jibreel_adhkar: {
    id: 'jibreel_adhkar',
    nameAr: 'الشيخ محمد جبريل (أذكار الصباح والمساء)',
    nameEn: 'Sheikh Mohamed Jibreel',
    urls: [
      'https://archive.org/download/adkar-Morning-Evening/athkar_08.mp3',
      'https://archive.org/download/adkar-Morning-Evening/athkar_07.mp3',
    ],
  },
  qatami_adhkar: {
    id: 'qatami_adhkar',
    nameAr: 'الشيخ ناصر القطامي (نبرة شجية هادئة)',
    nameEn: 'Sheikh Nasser Al-Qatami',
    urls: [
      '/audio/adhkar-qatami.mp3',
      'https://archive.org/download/adkar-Morning-Evening/athkar_02.mp3',
    ],
  },
  muaiqly_adhkar: {
    id: 'muaiqly_adhkar',
    nameAr: 'الشيخ ماهر المعيقلي (إمام الحرم المكي)',
    nameEn: 'Sheikh Maher Al-Muaiqly',
    urls: [
      'https://archive.org/download/adkar-Morning-Evening/athkar_25.mp3',
    ],
  },
  ghamdi_adhkar: {
    id: 'ghamdi_adhkar',
    nameAr: 'الشيخ سعد الغامدي (نبرة خاشعة هادئة)',
    nameEn: 'Sheikh Saad Al-Ghamdi',
    urls: [
      'https://archive.org/download/20250607_20250607_1005/%D8%A3%D8%B0%D9%83%D8%A7%D8%B1%20%D8%A7%D9%84%D8%B5%D8%A8%D8%A7%D8%AD%20%D9%84%D9%84%D8%B4%D9%8A%D8%AE%20%D8%B3%D8%B9%D8%AF%20%D8%A7%D9%84%D8%BA%D8%A7%D9%85%D8%AF%D9%8A.mp3',
      'https://archive.org/download/ad3iya-ghamidi/ad3iya-ghamidi.mp3',
    ],
  },
  idris_abkar_adhkar: {
    id: 'idris_abkar_adhkar',
    nameAr: 'الشيخ إدريس أبكر (أذكار الصباح خاشعة)',
    nameEn: 'Sheikh Idris Abkar',
    urls: [
      'https://archive.org/download/adkar-Morning-Evening/athkar_27.mp3',
    ],
  },
  otaibi_adhkar: {
    id: 'otaibi_adhkar',
    nameAr: 'الشيخ سلمان العتيبي (أذكار الصباح والمساء)',
    nameEn: 'Sheikh Salman Al-Otaibi',
    urls: [
      'https://archive.org/download/adkar-Morning-Evening/athkar_21.mp3',
      'https://archive.org/download/adkar-Morning-Evening/athkar_22.mp3',
    ],
  },
  speech_synth: {
    id: 'speech_synth',
    nameAr: 'النطق الصوتي العربي الفصيح (الذكي المباشر)',
    nameEn: 'Smart Speech Synthesis',
    urls: [],
  },
};

export interface SalawatVoiceProfile {
  id: 'mishary' | 'dosari' | 'muaiqly' | 'naqshabandi' | 'naqshabandi_radio';
  nameAr: string;
  styleAr: string;
  formulaAr: string;
  urls: string[];
  pitch: number;
  rate: number;
  chimeNotes: [number, number];
  voiceIndexHint: number;
  preferredLocaleKeywords: string[];
}

export const SALAWAT_SHEIKH_VOICES: SalawatVoiceProfile[] = [
  {
    id: 'mishary',
    nameAr: 'الشيخ مشاري راشد العفاسي',
    styleAr: 'تلاوة حقيقية لآية الصلاة على النبي ﷺ',
    formulaAr: '﴿إِنَّ اللَّهَ وَمَلَائِكَتَهُ يُصَلُّونَ عَلَى النَّبِيِّ ۚ يَا أَيُّهَا الَّذِينَ آمَنُوا صَلُّوا عَلَيْهِ وَسَلِّمُوا تَسْلِيمًا﴾',
    urls: [
      '/audio/salawat-mishary.mp3',
      'https://everyayah.com/data/Alafasy_128kbps/033056.mp3',
    ],
    pitch: 0.94,
    rate: 0.83,
    chimeNotes: [523.25, 659.25],
    voiceIndexHint: 0,
    preferredLocaleKeywords: ['kw', 'sa', 'majed', 'tarik', 'male'],
  },
  {
    id: 'dosari',
    nameAr: 'الشيخ ياسر الدوسري',
    styleAr: 'تلاوة حقيقية خاشعة لآية الصلاة على النبي ﷺ',
    formulaAr: '﴿إِنَّ اللَّهَ وَمَلَائِكَتَهُ يُصَلُّونَ عَلَى النَّبِيِّ ۚ يَا أَيُّهَا الَّذِينَ آمَنُوا صَلُّوا عَلَيْهِ وَسَلِّمُوا تَسْلِيمًا﴾',
    urls: [
      '/audio/salawat-dosari.mp3',
      'https://everyayah.com/data/Yasser_Ad-Dussary_128kbps/033056.mp3',
    ],
    pitch: 0.88,
    rate: 0.81,
    chimeNotes: [440.0, 554.37],
    voiceIndexHint: 1,
    preferredLocaleKeywords: ['sa', 'ae', 'tarik', 'hamed'],
  },
  {
    id: 'muaiqly',
    nameAr: 'الشيخ ماهر المعيقلي',
    styleAr: 'تلاوة حقيقية ندية لآية الصلاة على النبي ﷺ',
    formulaAr: '﴿إِنَّ اللَّهَ وَمَلَائِكَتَهُ يُصَلُّونَ عَلَى النَّبِيِّ ۚ يَا أَيُّهَا الَّذِينَ آمَنُوا صَلُّوا عَلَيْهِ وَسَلِّمُوا تَسْلِيمًا﴾',
    urls: [
      '/audio/salawat-muaiqly.mp3',
      'https://everyayah.com/data/MaherAlMuaiqly128kbps/033056.mp3',
    ],
    pitch: 0.92,
    rate: 0.82,
    chimeNotes: [493.88, 659.25],
    voiceIndexHint: 2,
    preferredLocaleKeywords: ['sa', 'naayf', 'hamed', 'arabic'],
  },
  {
    id: 'naqshabandi',
    nameAr: 'الشيخ سيد النقشبندي',
    styleAr: 'ابتهال الصلاة على الحبيب ﷺ (المقطع كامل ٦:٤٩)',
    formulaAr: 'الصَّلَاةُ وَالسَّلَامُ عَلَيْكَ يَا حَبِيبِي يَا رَسُولَ اللَّهِ ﷺ (ابتهال الصلاة على الحبيب — المقطع الكامل)',
    urls: [
      '/audio/salawat-naqshabandi.mp3',
      'https://archive.org/download/Sama3almelouk_yahoo_20160525/%D8%A7%D9%84%D8%B5%D9%84%D8%A7%D8%A9%20%D8%B9%D9%84%D9%89%20%D8%A7%D9%84%D8%AD%D8%A8%D9%8A%D8%A8.mp3',
    ],
    pitch: 0.9,
    rate: 0.82,
    chimeNotes: [392.0, 523.25],
    voiceIndexHint: 3,
    preferredLocaleKeywords: ['eg', 'egypt', 'arabic'],
  },
  {
    id: 'naqshabandi_radio',
    nameAr: 'الشيخ سيد النقشبندي (صيغة إذاعة القرآن)',
    styleAr: 'اللهم صلِّ على سيدنا محمد وعلى آله وصحبه وسلم',
    formulaAr: 'اللَّهُمَّ صَلِّ عَلَى سَيِّدِنَا مُحَمَّدٍ وَعَلَى آلِهِ وَصَحْبِهِ وَسَلِّمْ (بصوت الشيخ النقشبندي — إذاعة القرآن الكريم)',
    urls: [
      '/audio/salawat-naqshabandi-radio.mp3',
      'https://archive.org/download/K.I.S.S1/%D8%A7%D9%84%D9%84%D9%87%D9%85%20%D8%B5%D9%84%D9%8A%20%D9%88%D8%B3%D9%84%D9%85%20%D8%B9%D9%84%D9%89%20%D9%86%D8%A8%D9%8A%D9%86%D8%A7%20%D9%85%D8%AD%D9%85%D8%AF100%D9%85%D8%B1%D9%87%20%D9%85%D9%83%D8%B1%D8%B1%D9%87%20%20%20%D8%A8%D8%B5%D9%88%D8%AA%20%D8%A7%D9%84%D9%86%D9%82%D8%B4%D8%A8%D9%86%D8%AF%D9%8A.mp3',
    ],
    pitch: 0.9,
    rate: 0.82,
    chimeNotes: [392.0, 523.25],
    voiceIndexHint: 4,
    preferredLocaleKeywords: ['eg', 'egypt', 'arabic'],
  },
];

export interface PreAdhanVoiceProfile {
  id: 'mishary' | 'dosari' | 'muaiqly' | 'minshawi' | 'abdulbasit' | 'qatami';
  nameAr: string;
  styleAr: string;
  verseAr: string;
  urls: string[];
}

export const PRE_ADHAN_SHEIKH_VOICES: PreAdhanVoiceProfile[] = [
  {
    id: 'mishary',
    nameAr: 'الشيخ مشاري راشد العفاسي',
    styleAr: 'تلاوة خاشعة للاستعداد للصلاة (البقرة: ٢٣٨)',
    verseAr: '﴿حَافِظُوا عَلَى الصَّلَوَاتِ وَالصَّلَاةِ الْوُسْطَىٰ وَقُومُوا لِلَّهِ قَانِتِينَ﴾',
    urls: [
      '/audio/prayer-alert-mishary.mp3',
      'https://everyayah.com/data/Alafasy_128kbps/002238.mp3',
    ],
  },
  {
    id: 'dosari',
    nameAr: 'الشيخ ياسر الدوسري',
    styleAr: 'نبرة ندية مؤثرة للاستعداد للصلاة (البقرة: ٢٣٨)',
    verseAr: '﴿حَافِظُوا عَلَى الصَّلَوَاتِ وَالصَّلَاةِ الْوُسْطَىٰ وَقُومُوا لِلَّهِ قَانِتِينَ﴾',
    urls: [
      '/audio/prayer-alert-dosari.mp3',
      'https://everyayah.com/data/Yasser_Ad-Dussary_128kbps/002238.mp3',
    ],
  },
  {
    id: 'muaiqly',
    nameAr: 'الشيخ ماهر المعيقلي',
    styleAr: 'تلاوة الحرم المكي الهادئة (البقرة: ٢٣٨)',
    verseAr: '﴿حَافِظُوا عَلَى الصَّلَوَاتِ وَالصَّلَاةِ الْوُسْطَىٰ وَقُومُوا لِلَّهِ قَانِتِينَ﴾',
    urls: [
      '/audio/prayer-alert-muaiqly.mp3',
      'https://everyayah.com/data/MaherAlMuaiqly128kbps/002238.mp3',
    ],
  },
  {
    id: 'minshawi',
    nameAr: 'الشيخ محمد صديق المنشاوي',
    styleAr: 'تلاوة خاشعة مهيبة (البقرة: ٢٣٨)',
    verseAr: '﴿حَافِظُوا عَلَى الصَّلَوَاتِ وَالصَّلَاةِ الْوُسْطَىٰ وَقُومُوا لِلَّهِ قَانِتِينَ﴾',
    urls: [
      '/audio/prayer-alert-minshawi.mp3',
      'https://everyayah.com/data/Minshawy_Murattal_128kbps/002238.mp3',
    ],
  },
  {
    id: 'abdulbasit',
    nameAr: 'الشيخ عبد الباسط عبد الصمد',
    styleAr: 'نبرة ذهبية أصيلة (البقرة: ٢٣٨)',
    verseAr: '﴿حَافِظُوا عَلَى الصَّلَوَاتِ وَالصَّلَاةِ الْوُسْطَىٰ وَقُومُوا لِلَّهِ قَانِتِينَ﴾',
    urls: [
      '/audio/prayer-alert-abdulbasit.mp3',
      'https://everyayah.com/data/Abdul_Basit_Murattal_192kbps/002238.mp3',
    ],
  },
  {
    id: 'qatami',
    nameAr: 'الشيخ ناصر القطامي',
    styleAr: 'صوت شجي هادئ للوضوء والصلاة (البقرة: ٢٣٨)',
    verseAr: '﴿حَافِظُوا عَلَى الصَّلَوَاتِ وَالصَّلَاةِ الْوُسْطَىٰ وَقُومُوا لِلَّهِ قَانِتِينَ﴾',
    urls: [
      '/audio/prayer-alert-qatami.mp3',
      'https://everyayah.com/data/Nasser_Alqatami_128kbps/002238.mp3',
    ],
  },
];

export interface IqamaVoiceProfile {
  id: 'basnawi' | 'hadrawi' | 'majed_abbas' | 'madinah_haram' | 'faisal_labban' | 'makkah_classic';
  nameAr: string;
  styleAr: string;
  urls: string[];
}

export const IQAMA_SHEIKH_VOICES: IqamaVoiceProfile[] = [
  {
    id: 'basnawi',
    nameAr: 'الشيخ أحمد بصنوي (الحرم المكي)',
    styleAr: 'إقامة صلاة الفجر من المسجد الحرام بمكة المكرمة',
    urls: [
      '/audio/iqama-basnawi.mp3',
      'https://archive.org/download/IqamaMakkahFajr3111434SheikhAhmadBasnawi/Iqama%20-%20Makkah%20Fajr%20%5B3-11-1434%5D%20Sheikh%20Ahmad%20Basnawi.mp3',
    ],
  },
  {
    id: 'hadrawi',
    nameAr: 'الشيخ فاروق حضراوي (الحرم المكي)',
    styleAr: 'نداء الإقامة الخاشع من الحرم المكي الشريف',
    urls: [
      '/audio/iqama-hadrawi.mp3',
      'https://archive.org/download/IqamaMakkahIsha1111434SheikhFaroukHadrawi/Iqama%20-%20Makkah%20Isha%20%5B1-11-1434%5D%20Sheikh%20Farouk%20Hadrawi.mp3',
    ],
  },
  {
    id: 'majed_abbas',
    nameAr: 'الشيخ ماجد العباس (الحرم المكي)',
    styleAr: 'إقامة ندية مهيبة من المسجد الحرام',
    urls: [
      '/audio/iqama-majed-abbas.mp3',
      'https://archive.org/download/IqamaMakkahIsha3111434SheikhMajedAbbas/Iqama%20-%20Makkah%20Isha%20%5B3-11-1434%5D%20Sheikh%20Majed%20Abbas.mp3',
    ],
  },
  {
    id: 'madinah_haram',
    nameAr: 'إقامة المسجد النبوي الشريف (المدينة المنورة)',
    styleAr: 'تسجيل خاشع مؤثر من الحرم النبوي الشريف',
    urls: [
      '/audio/iqama-madinah.m4a',
      'https://archive.org/download/1420_20220701/' +
        encodeURIComponent('اجمل صوت في اقامة الصلاة سوف تسمعه ما شاء الله المسجد النبوي عام 1420 هجري.m4a'),
    ],
  },
  {
    id: 'faisal_labban',
    nameAr: 'الشيخ فيصل اللبان',
    styleAr: 'إقامة واضحة بنبرة روحانية هادئة',
    urls: [
      '/audio/iqama-faisal-labban.mp3',
      'https://archive.org/download/1981439i./fl.mp3',
    ],
  },
  {
    id: 'makkah_classic',
    nameAr: 'إقامة الحرمين المأثورة (التسجيل الكلاسيكي)',
    styleAr: 'صيغة الإقامة الكاملة بصوت واضح ومباشر',
    urls: [
      '/audio/iqama-classic.mp3',
      'https://archive.org/download/iqamah_athan/iqamah.mp3',
    ],
  },
];

export type AudioPlayerState = 'idle' | 'loading' | 'playing' | 'paused' | 'error';
export type ActiveAudioType = 'none' | 'adhan' | 'dua' | 'adhkar' | 'pre_adhan_reminder' | 'salawat' | 'iqama';

export interface AudioPlayerListener {
  onStateChange?: (state: AudioPlayerState, audioType: ActiveAudioType) => void;
  onProgress?: (currentTime: number, duration: number, percentage: number) => void;
  onError?: (errorMessage: string, isFatal: boolean) => void;
  onUnlocked?: () => void;
  onAdhanEnded?: (prayerKey?: string) => void;
  onDuaEnded?: () => void;
  onAdhkarEnded?: () => void;
}

class AdhanPlayerManager {
  private audio: HTMLAudioElement | null = null;
  private audioCtx: AudioContext | null = null;
  private isUnlocked: boolean = false;
  private isMutedState: boolean = false;
  private state: AudioPlayerState = 'idle';
  private activeType: ActiveAudioType = 'none';
  private currentReciter: string = 'makkah';
  private currentPrayerKey: string = 'dhuhr';
  private currentUrlIndex: number = 0;
  private currentReciterUrls: string[] = [];
  private listeners: Set<AudioPlayerListener> = new Set();
  private duration: number = 0;
  private currentTime: number = 0;
  private lastError: string | null = null;
  private autoDuaEnabled: boolean = true;
  private duaReciter: string = 'sharif';
  private salawatRotationIndex: number = 0;
  private salawatTimeoutId: number | null = null;
  private salawatAudio: HTMLAudioElement | null = null;
  private salawatBlobCache: Map<string, string> = new Map();
  private salawatPlayNonce: number = 0;
  private preAdhanRotationIndex: number = 0;
  private preAdhanAudio: HTMLAudioElement | null = null;
  private preAdhanPlayNonce: number = 0;
  private iqamaRotationIndex: number = 0;
  private iqamaAudio: HTMLAudioElement | null = null;
  private iqamaPlayNonce: number = 0;
  private shortDhikrRotationIndex: number = 0;
  private fallbackDhikrText: string | null = null;
  private audioPlayNonce: number = 0;
  private skipNextAutoCache: boolean = false;
  private autoDuaTimeoutId: number | null = null;
  private suppressNextAutoDua: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initAudioElement();
      this.initSalawatAudioElement();
      this.initPreAdhanAudioElement();
      this.initIqamaAudioElement();
      if ('speechSynthesis' in window) {
        window.speechSynthesis.getVoices();
      }
    }
  }

  private initIqamaAudioElement() {
    if (this.iqamaAudio) {
      this.iqamaAudio.pause();
      this.iqamaAudio.src = '';
    }
    this.iqamaAudio = new Audio();
    this.iqamaAudio.preload = 'auto';

    this.iqamaAudio.addEventListener('play', () => {
      if (this.activeType === 'iqama') {
        this.setState('playing', 'iqama');
      }
    });

    this.iqamaAudio.addEventListener('ended', () => {
      if (this.activeType === 'iqama') {
        this.setState('idle', 'none');
      }
    });

    this.iqamaAudio.addEventListener('error', () => {
      if (this.activeType === 'iqama') {
        this.setState('idle', 'none');
      }
    });
  }

  private initPreAdhanAudioElement() {
    if (this.preAdhanAudio) {
      this.preAdhanAudio.pause();
      this.preAdhanAudio.src = '';
    }
    this.preAdhanAudio = new Audio();
    this.preAdhanAudio.preload = 'auto';

    this.preAdhanAudio.addEventListener('play', () => {
      if (this.activeType === 'pre_adhan_reminder') {
        this.setState('playing', 'pre_adhan_reminder');
      }
    });

    this.preAdhanAudio.addEventListener('ended', () => {
      if (this.activeType === 'pre_adhan_reminder') {
        this.setState('idle', 'none');
      }
    });

    this.preAdhanAudio.addEventListener('error', () => {
      if (this.activeType === 'pre_adhan_reminder') {
        this.setState('idle', 'none');
      }
    });
  }

  private initSalawatAudioElement() {
    if (this.salawatAudio) {
      this.salawatAudio.pause();
      this.salawatAudio.src = '';
    }
    this.salawatAudio = new Audio();
    this.salawatAudio.preload = 'auto';

    this.salawatAudio.addEventListener('play', () => {
      if (this.activeType === 'salawat') {
        this.setState('playing', 'salawat');
      }
    });

    this.salawatAudio.addEventListener('ended', () => {
      if (this.activeType === 'salawat') {
        this.setState('idle', 'none');
      }
    });

    this.salawatAudio.addEventListener('error', () => {
      if (this.activeType === 'salawat') {
        this.setState('idle', 'none');
      }
    });
  }

  public setAutoDua(enabled: boolean, reciter: string = 'shaarawy') {
    this.autoDuaEnabled = enabled;
    this.duaReciter = getDuaSource(reciter).id;
  }

  private initAudioElement() {
    if (this.audio) {
      this.audio.pause();
      this.audio.src = '';
    }
    this.audio = new Audio();
    this.audio.preload = 'auto';

    this.audio.addEventListener('timeupdate', () => {
      if (!this.audio) return;
      this.currentTime = this.audio.currentTime;
      this.duration = this.audio.duration || 0;
      const percentage = this.duration > 0 ? (this.currentTime / this.duration) * 100 : 0;
      this.notifyProgress(this.currentTime, this.duration, percentage);
    });

    this.audio.addEventListener('play', () => {
      this.setState('playing', this.activeType);
    });

    this.audio.addEventListener('pause', () => {
      if (this.state !== 'loading' && this.state !== 'error') {
        this.setState('paused', this.activeType);
      }
    });

    this.audio.addEventListener('ended', () => {
      const finishedType = this.activeType;
      const finishedPrayerKey = this.currentPrayerKey;
      this.setState('idle', 'none');
      this.notifyProgress(0, 0, 0);

      if (finishedType === 'adhan') {
        const shouldAutoPlayDua = this.autoDuaEnabled && !this.suppressNextAutoDua;
        this.suppressNextAutoDua = false;
        this.listeners.forEach((l) => l.onAdhanEnded?.(finishedPrayerKey));
        // Automatically play Dua After Adhan only if enabled, not suppressed, and no listener already started Dua
        if (shouldAutoPlayDua && this.activeType !== 'dua') {
          if (this.autoDuaTimeoutId !== null) {
            window.clearTimeout(this.autoDuaTimeoutId);
          }
          this.autoDuaTimeoutId = window.setTimeout(() => {
            this.autoDuaTimeoutId = null;
            if (this.activeType === 'none' || this.state === 'idle') {
              void this.playDua(this.duaReciter);
            }
          }, 1000);
        }
      } else if (finishedType === 'dua') {
        this.listeners.forEach((l) => l.onDuaEnded?.());
      } else if (finishedType === 'adhkar') {
        this.listeners.forEach((l) => l.onAdhkarEnded?.());
      }
    });

    this.audio.addEventListener('error', (e) => {
      console.warn('Audio playback error on URL:', this.audio?.src, e);
      this.handleUrlFailure();
    });
  }

  public subscribe(listener: AudioPlayerListener): () => void {
    this.listeners.add(listener);
    if (listener.onStateChange) listener.onStateChange(this.state, this.activeType);
    if (listener.onProgress) {
      const pct = this.duration > 0 ? (this.currentTime / this.duration) * 100 : 0;
      listener.onProgress(this.currentTime, this.duration, pct);
    }
    return () => {
      this.listeners.delete(listener);
    };
  }

  private setState(newState: AudioPlayerState, audioType: ActiveAudioType = this.activeType) {
    this.state = newState;
    this.activeType = audioType;
    this.listeners.forEach((l) => l.onStateChange?.(newState, audioType));
  }

  private notifyProgress(currentTime: number, duration: number, percentage: number) {
    this.listeners.forEach((l) => l.onProgress?.(currentTime, duration, percentage));
  }

  private notifyError(message: string, isFatal: boolean) {
    this.lastError = message;
    this.listeners.forEach((l) => l.onError?.(message, isFatal));
  }

  // Pre-unlock audio permission for autoplay/adhan without browser blocking
  public async unlockAudio(): Promise<boolean> {
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        if (!this.audioCtx) {
          this.audioCtx = new AudioContextClass();
        }
        if (this.audioCtx.state === 'suspended') {
          await this.audioCtx.resume();
        }
        const buffer = this.audioCtx.createBuffer(1, 1, 22050);
        const source = this.audioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(this.audioCtx.destination);
        source.start(0);
      }

      if (!this.audio) {
        this.initAudioElement();
      }
      if (this.audio) {
        const silentMp3 =
          'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
        this.audio.src = silentMp3;
        this.audio.load();
        const playPromise = this.audio.play();
        if (playPromise !== undefined) {
          await playPromise;
          this.audio.pause();
          this.audio.currentTime = 0;
        }
      }

      this.isUnlocked = true;
      this.listeners.forEach((l) => l.onUnlocked?.());
      return true;
    } catch (err: unknown) {
      console.warn('Audio unlock warning:', err);
      this.isUnlocked = true;
      this.listeners.forEach((l) => l.onUnlocked?.());
      return true;
    }
  }

  public getIsUnlocked(): boolean {
    return this.isUnlocked;
  }

  public getState(): AudioPlayerState {
    return this.state;
  }

  public getActiveType(): ActiveAudioType {
    return this.activeType;
  }

  public getLastError(): string | null {
    return this.lastError;
  }

  // Play real MP3 Adhan with automatic fallback
  public async playAdhan(
    reciterId: string = 'makkah',
    prayerKey: string = 'dhuhr',
    boostVolume: boolean = false,
    options?: { skipAutoCache?: boolean; disableAutoDua?: boolean }
  ): Promise<void> {
    if (this.autoDuaTimeoutId !== null) {
      window.clearTimeout(this.autoDuaTimeoutId);
      this.autoDuaTimeoutId = null;
    }
    const source = getAdhanSource(reciterId, prayerKey);
    this.audioPlayNonce++;
    this.activeType = 'adhan';
    this.currentPrayerKey = prayerKey;
    this.currentReciter = source.id;
    this.currentReciterUrls = [...source.urls];
    this.currentUrlIndex = 0;
    this.lastError = null;
    this.skipNextAutoCache = Boolean(options?.skipAutoCache);
    this.suppressNextAutoDua = Boolean(options?.disableAutoDua);

    if (!this.audio) {
      this.initAudioElement();
    }
    if (this.audio) {
      this.audio.volume = boostVolume ? 1.0 : 0.9;
    }

    await this.tryPlayCurrentUrl();
  }

  // Play Dua After Adhan
  public async playDua(duaId: string = 'shaarawy'): Promise<void> {
    if (this.autoDuaTimeoutId !== null) {
      window.clearTimeout(this.autoDuaTimeoutId);
      this.autoDuaTimeoutId = null;
    }
    const source = getDuaSource(duaId);
    this.audioPlayNonce++;
    this.activeType = 'dua';
    this.currentReciter = source.id;
    this.currentReciterUrls = [...source.urls];
    this.currentUrlIndex = 0;
    this.lastError = null;
    this.skipNextAutoCache = false;
    this.suppressNextAutoDua = false;

    if (!this.audio) {
      this.initAudioElement();
    }
    if (this.audio) {
      this.audio.volume = 0.9;
    }

    await this.tryPlayCurrentUrl();
  }

  // Play Adhkar Morning / Evening Audio Recitation (Real Sheikh MP3 with offline cache & speech fallback)
  public async playAdhkar(
    reciterId: string = 'alafasy_adhkar',
    sampleText?: string,
    period: 'morning' | 'evening' | 'general' = 'general'
  ): Promise<void> {
    const source = ADHKAR_SOURCES[reciterId] || ADHKAR_SOURCES.alafasy_adhkar;
    this.audioPlayNonce++;
    this.activeType = 'adhkar';
    this.currentReciter = source.id;
    this.lastError = null;

    if (source.id === 'speech_synth' || source.urls.length === 0) {
      const adhkarText =
        period === 'evening'
          ? sampleText ||
            'أذكار المساء: أمسينا وأمسى الملك لله، والحمد لله، لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير. اللهم إني أسألك خير ما في هذه الليلة وخير ما بعدها'
          : sampleText ||
            'أذكار الصباح: أصبحنا وأصبح الملك لله، والحمد لله، لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير. اللهم إني أسألك خير ما في هذا اليوم وخير ما بعده';
      this.speakTextWithSpeechSynthesis(adhkarText, 'adhkar');
      return;
    }

    const orderedUrls = [...source.urls].sort((a, b) => {
      if (period === 'morning') {
        const aScore = a.includes('sabah') || a.includes('03') || a.includes('05') || a.includes('07') ? 0 : 1;
        const bScore = b.includes('sabah') || b.includes('03') || b.includes('05') || b.includes('07') ? 0 : 1;
        return aScore - bScore;
      }
      if (period === 'evening') {
        const aScore = a.includes('masaa') || a.includes('04') || a.includes('06') || a.includes('08') ? 0 : 1;
        const bScore = b.includes('masaa') || b.includes('04') || b.includes('06') || b.includes('08') ? 0 : 1;
        return aScore - bScore;
      }
      return 0;
    });

    this.currentReciterUrls = orderedUrls;
    this.currentUrlIndex = 0;

    if (!this.audio) {
      this.initAudioElement();
    }
    if (this.audio) {
      this.audio.volume = 0.92;
    }

    await this.tryPlayCurrentUrl();
  }

  // Play Individual Short Dhikr MP3 by Real Sheikh (with multi-sheikh/mirror fallback)
  public async playShortDhikrClip(
    dhikrId: string,
    preferredSheikhId: ShortAdhkarSheikhId = 'rotate',
    fallbackText?: string
  ): Promise<{ sheikhNameAr: string }> {
    const rotationIdx = this.shortDhikrRotationIndex++;
    const primaryChoice = resolveShortDhikrClip(dhikrId, preferredSheikhId, rotationIdx);
    const allChoices = SHORT_DHIKR_AUDIO_MAP[dhikrId] || [];

    this.audioPlayNonce++;
    this.activeType = 'adhkar';
    this.fallbackDhikrText = fallbackText || null;
    this.lastError = null;

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    if (!primaryChoice && allChoices.length === 0) {
      if (fallbackText) {
        this.speakTextWithSpeechSynthesis(fallbackText, 'adhkar');
      }
      return { sheikhNameAr: 'النطق العربي الفصيح' };
    }

    const orderedUrls: string[] = [];
    if (primaryChoice) {
      orderedUrls.push(...primaryChoice.urls);
    }
    for (const choice of allChoices) {
      if (choice !== primaryChoice) {
        for (const u of choice.urls) {
          if (!orderedUrls.includes(u)) orderedUrls.push(u);
        }
      }
    }

    this.currentReciter = primaryChoice?.sheikhNameAr || 'الشيخ حمد الدريهم';
    this.currentReciterUrls = orderedUrls;
    this.currentUrlIndex = 0;

    if (!this.audio) {
      this.initAudioElement();
    }
    if (this.audio) {
      this.audio.volume = 0.95;
    }

    void this.tryPlayCurrentUrl();
    return {
      sheikhNameAr: primaryChoice?.sheikhNameAr || 'الشيخ حمد الدريهم',
    };
  }

  // Speak arbitrary text with Speech Synthesis
  public speakTextWithSpeechSynthesis(text: string, category: ActiveAudioType = 'adhkar'): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      this.notifyError('تقنية النطق الصوتي غير متوفرة في المتصفح', true);
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ar-SA';
      utterance.rate = 0.85;
      utterance.pitch = 1.0;
      utterance.volume = this.isMutedState ? 0 : 1.0;

      const voices = window.speechSynthesis.getVoices();
      const arabicVoice = voices.find((v) => v.lang.startsWith('ar') || v.name.toLowerCase().includes('arabic'));
      if (arabicVoice) {
        utterance.voice = arabicVoice;
      }

      this.setState('playing', category);

      utterance.onend = () => {
        this.setState('idle', 'none');
      };

      utterance.onerror = (e) => {
        console.warn('Speech synthesis error:', e);
        this.setState('idle', 'none');
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis exception:', err);
      this.setState('idle', 'none');
    }
  }

  // Soft 2-note spiritual chime tailored per Sheikh voice before Salawat
  private playSalawatChime(notes: [number, number]): void {
    try {
      if (this.isMutedState) return;
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!this.audioCtx && AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
      if (!this.audioCtx) return;
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const ctx = this.audioCtx;
      const now = ctx.currentTime;
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.22);

        gain.gain.setValueAtTime(0.001, now + idx * 0.22);
        gain.gain.linearRampToValueAtTime(0.11, now + idx * 0.22 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.22 + 0.65);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.22);
        osc.stop(now + idx * 0.22 + 0.65);
      });
    } catch {
      // Ignore Web Audio failures gracefully
    }
  }

  // Pick a distinct Salawat voice profile (supporting 'rotate' across multiple Sheikhs)
  public selectSalawatVoice(voiceModeOrId: string = 'rotate'): SalawatVoiceProfile {
    if (voiceModeOrId === 'rotate') {
      const profile = SALAWAT_SHEIKH_VOICES[this.salawatRotationIndex % SALAWAT_SHEIKH_VOICES.length];
      this.salawatRotationIndex = (this.salawatRotationIndex + 1) % SALAWAT_SHEIKH_VOICES.length;
      return profile;
    }
    return (
      SALAWAT_SHEIKH_VOICES.find((v) => v.id === voiceModeOrId) || SALAWAT_SHEIKH_VOICES[0]
    );
  }

  // Speak Salawat upon the Prophet (ﷺ) via real Sheikh MP3 recordings with mirror fallback
  public playSalawat(
    voiceModeOrId: string = 'rotate',
    options?: { isAutoTrigger?: boolean }
  ): SalawatVoiceProfile | null {
    const isAuto = options?.isAutoTrigger ?? false;

    // Never interrupt an active full Adhan or Dua if triggered by the periodic timer
    if (
      isAuto &&
      this.state === 'playing' &&
      (this.activeType === 'adhan' || this.activeType === 'dua' || this.activeType === 'adhkar')
    ) {
      return null;
    }
    if (isAuto && this.isMutedState) {
      return null;
    }

    const profile = this.selectSalawatVoice(voiceModeOrId);
    const nonce = ++this.salawatPlayNonce;

    if (this.salawatTimeoutId !== null) {
      window.clearTimeout(this.salawatTimeoutId);
      this.salawatTimeoutId = null;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
        window.speechSynthesis.cancel();
      }
    }

    if (!this.salawatAudio) {
      this.initSalawatAudioElement();
    }

    void this.loadAndPlaySalawatAudio(profile, nonce, isAuto);
    return profile;
  }

  private async loadAndPlaySalawatAudio(
    profile: SalawatVoiceProfile,
    nonce: number,
    isAuto: boolean
  ): Promise<void> {
    if (!this.salawatAudio) return;

    this.activeType = 'salawat';
    this.setState('loading', 'salawat');

    for (const url of profile.urls) {
      if (nonce !== this.salawatPlayNonce || !this.salawatAudio) return;
      try {
        const resolvedUrl = await resolvePlayableAudioUrl(url);
        if (nonce !== this.salawatPlayNonce || !this.salawatAudio) return;
        this.salawatAudio.pause();
        this.salawatAudio.currentTime = 0;
        this.salawatAudio.src = resolvedUrl;
        this.salawatAudio.muted = this.isMutedState;
        this.salawatAudio.volume = this.isMutedState ? 0 : 1.0;
        await this.salawatAudio.play();
        if (nonce === this.salawatPlayNonce) {
          this.setState('playing', 'salawat');
          this.isUnlocked = true;
        }
        return;
      } catch (err) {
        console.warn(`Failed playing Salawat MP3 [${url}]:`, err);
      }
    }

    if (nonce !== this.salawatPlayNonce) return;
    this.speakSalawatWithWebSpeech(profile, isAuto);
  }

  private speakSalawatWithWebSpeech(profile: SalawatVoiceProfile, isAuto: boolean): void {
    this.playSalawatChime(profile.chimeNotes);

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (!isAuto) {
        this.notifyError('تقنية النطق الصوتي غير متوفرة في المتصفح', true);
      }
      this.setState('idle', 'none');
      return;
    }

    try {
      const voices = window.speechSynthesis.getVoices();
      const arabicVoices = voices.filter(
        (v) => v.lang.toLowerCase().startsWith('ar') || v.name.toLowerCase().includes('arabic')
      );

      if (arabicVoices.length === 0) {
        if (!isAuto) {
          this.notifyError(
            'لم يتم العثور على صوت عربي في المتصفح أو خدمة الصوت السحابية غير مفعلة حالياً.',
            false
          );
        }
        this.setState('idle', 'none');
        return;
      }

      const utterance = new SpeechSynthesisUtterance(profile.formulaAr);
      utterance.lang = 'ar-SA';
      utterance.rate = profile.rate;
      utterance.pitch = profile.pitch;
      utterance.volume = this.isMutedState ? 0 : 1.0;

      const keywordMatch = arabicVoices.find((v) =>
        profile.preferredLocaleKeywords.some(
          (kw) => v.lang.toLowerCase().includes(kw) || v.name.toLowerCase().includes(kw)
        )
      );
      const indexedVoice = arabicVoices[profile.voiceIndexHint % arabicVoices.length];
      utterance.voice = arabicVoices.length > 1 ? indexedVoice : keywordMatch || arabicVoices[0];

      this.setState('playing', 'salawat');

      utterance.onend = () => {
        if (this.activeType === 'salawat') {
          this.setState('idle', 'none');
        }
      };

      utterance.onerror = () => {
        if (this.activeType === 'salawat') {
          this.setState('idle', 'none');
        }
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Salawat speech fallback error:', err);
      this.setState('idle', 'none');
    }
  }

  public selectPreAdhanVoice(voiceModeOrId: string = 'rotate'): PreAdhanVoiceProfile {
    if (voiceModeOrId === 'rotate') {
      const profile =
        PRE_ADHAN_SHEIKH_VOICES[this.preAdhanRotationIndex % PRE_ADHAN_SHEIKH_VOICES.length];
      this.preAdhanRotationIndex =
        (this.preAdhanRotationIndex + 1) % PRE_ADHAN_SHEIKH_VOICES.length;
      return profile;
    }
    return (
      PRE_ADHAN_SHEIKH_VOICES.find((v) => v.id === voiceModeOrId) ||
      PRE_ADHAN_SHEIKH_VOICES[0]
    );
  }

  // Play real Sheikh recitation for pre-adhan prayer preparation alert with gentle chime fallback
  public playPreAdhanReminderSound(
    voiceModeOrId: string = 'rotate',
    options?: { isAutoTrigger?: boolean }
  ): PreAdhanVoiceProfile | null {
    const isAuto = options?.isAutoTrigger ?? false;

    if (
      isAuto &&
      this.state === 'playing' &&
      (this.activeType === 'adhan' || this.activeType === 'dua' || this.activeType === 'adhkar')
    ) {
      return null;
    }
    if (isAuto && this.isMutedState) {
      return null;
    }

    const profile = this.selectPreAdhanVoice(voiceModeOrId);
    const nonce = ++this.preAdhanPlayNonce;

    if (!this.preAdhanAudio) {
      this.initPreAdhanAudioElement();
    }

    void this.loadAndPlayPreAdhanAudio(profile, nonce);
    return profile;
  }

  private async loadAndPlayPreAdhanAudio(
    profile: PreAdhanVoiceProfile,
    nonce: number
  ): Promise<void> {
    if (!this.preAdhanAudio) return;

    // Pause any overlapping Salawat audio cleanly before playing prayer alert
    if (this.salawatAudio && !this.salawatAudio.paused) {
      this.salawatAudio.pause();
      this.salawatAudio.currentTime = 0;
    }

    this.activeType = 'pre_adhan_reminder';
    this.setState('loading', 'pre_adhan_reminder');

    for (const url of profile.urls) {
      if (nonce !== this.preAdhanPlayNonce || !this.preAdhanAudio) return;
      try {
        const resolvedUrl = await resolvePlayableAudioUrl(url);
        if (nonce !== this.preAdhanPlayNonce || !this.preAdhanAudio) return;
        this.preAdhanAudio.pause();
        this.preAdhanAudio.currentTime = 0;
        this.preAdhanAudio.src = resolvedUrl;
        this.preAdhanAudio.muted = this.isMutedState;
        this.preAdhanAudio.volume = this.isMutedState ? 0 : 1.0;
        await this.preAdhanAudio.play();
        if (nonce === this.preAdhanPlayNonce) {
          this.setState('playing', 'pre_adhan_reminder');
          this.isUnlocked = true;
        }
        return;
      } catch (err) {
        console.warn(`Failed playing pre-Adhan Sheikh MP3 [${url}]:`, err);
      }
    }

    if (nonce !== this.preAdhanPlayNonce) return;
    this.playPreAdhanChimeFallback();
  }

  public selectIqamaVoice(voiceModeOrId: string = 'rotate'): IqamaVoiceProfile {
    if (voiceModeOrId === 'rotate') {
      const profile =
        IQAMA_SHEIKH_VOICES[this.iqamaRotationIndex % IQAMA_SHEIKH_VOICES.length];
      this.iqamaRotationIndex =
        (this.iqamaRotationIndex + 1) % IQAMA_SHEIKH_VOICES.length;
      return profile;
    }
    return (
      IQAMA_SHEIKH_VOICES.find((v) => v.id === voiceModeOrId) ||
      IQAMA_SHEIKH_VOICES[0]
    );
  }

  // Play real Sheikh Iqama audio recording with mirror & speech fallbacks
  public playIqamaSound(
    voiceModeOrId: string = 'rotate',
    options?: { isAutoTrigger?: boolean }
  ): IqamaVoiceProfile | null {
    const isAuto = options?.isAutoTrigger ?? false;

    if (
      isAuto &&
      this.state === 'playing' &&
      (this.activeType === 'adhan' || this.activeType === 'dua' || this.activeType === 'adhkar')
    ) {
      return null;
    }
    if (isAuto && this.isMutedState) {
      return null;
    }

    const profile = this.selectIqamaVoice(voiceModeOrId);
    const nonce = ++this.iqamaPlayNonce;

    if (!this.iqamaAudio) {
      this.initIqamaAudioElement();
    }

    void this.loadAndPlayIqamaAudio(profile, nonce, isAuto);
    return profile;
  }

  private async loadAndPlayIqamaAudio(
    profile: IqamaVoiceProfile,
    nonce: number,
    isAuto: boolean
  ): Promise<void> {
    if (!this.iqamaAudio) return;

    if (this.salawatAudio && !this.salawatAudio.paused) {
      this.salawatAudio.pause();
      this.salawatAudio.currentTime = 0;
    }
    if (this.preAdhanAudio && !this.preAdhanAudio.paused) {
      this.preAdhanAudio.pause();
      this.preAdhanAudio.currentTime = 0;
    }

    this.activeType = 'iqama';
    this.setState('loading', 'iqama');

    for (const url of profile.urls) {
      if (nonce !== this.iqamaPlayNonce || !this.iqamaAudio) return;
      try {
        const resolvedUrl = await resolvePlayableAudioUrl(url);
        if (nonce !== this.iqamaPlayNonce || !this.iqamaAudio) return;
        this.iqamaAudio.pause();
        this.iqamaAudio.currentTime = 0;
        this.iqamaAudio.src = resolvedUrl;
        this.iqamaAudio.muted = this.isMutedState;
        this.iqamaAudio.volume = this.isMutedState ? 0 : 1.0;
        await this.iqamaAudio.play();
        if (nonce === this.iqamaPlayNonce) {
          this.setState('playing', 'iqama');
          this.isUnlocked = true;
        }
        return;
      } catch (err) {
        console.warn(`Failed playing Iqama Sheikh recording [${url}]:`, err);
      }
    }

    if (nonce !== this.iqamaPlayNonce) return;
    if (!isAuto) {
      this.notifyError(
        `تعذّر تشغيل ملف الإقامة لـ (${profile.nameAr}). تم تفعيل النطق الصوتي العربي الفصيح كبديل فوري.`,
        false
      );
    }
    this.speakTextWithSpeechSynthesis(
      'اللَّهُ أَكْبَرُ اللَّهُ أَكْبَرُ، أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا اللَّهُ، أَشْهَدُ أَنَّ مُحَمَّدًا رَسُولُ اللَّهِ، حَيَّ عَلَى الصَّلَاةِ، حَيَّ عَلَى الْفَلَاحِ، قَدْ قَامَتِ الصَّلَاةُ قَدْ قَامَتِ الصَّلَاةُ، اللَّهُ أَكْبَرُ اللَّهُ أَكْبَرُ، لَا إِلَهَ إِلَّا اللَّهُ',
      'iqama'
    );
  }

  private playPreAdhanChimeFallback(): void {
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!this.audioCtx && AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
      if (!this.audioCtx) {
        this.setState('idle', 'none');
        return;
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const ctx = this.audioCtx;
      const now = ctx.currentTime;

      const bellFrequencies = [349.23, 440.0, 523.25];
      bellFrequencies.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.4);

        gain.gain.setValueAtTime(0.001, now + idx * 0.4);
        gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.4 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.4 + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.4);
        osc.stop(now + idx * 0.4 + 1.2);
      });
      this.setState('idle', 'none');
    } catch (e) {
      console.warn('Pre-adhan reminder audio error:', e);
      this.setState('idle', 'none');
    }
  }

  public playPeriodicChime(volumeMultiplier = 0.5): void {
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!this.audioCtx && AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
      if (!this.audioCtx) return;
      if (this.audioCtx.state === 'suspended') {
        void this.audioCtx.resume().catch(() => {});
      }

      const ctx = this.audioCtx;
      const now = ctx.currentTime;
      const safeVol = Math.max(0.05, Math.min(0.35, volumeMultiplier * 0.22));
      const notes = [523.25, 659.25];

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startAt = now + idx * 0.16;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startAt);

        gain.gain.setValueAtTime(0.001, startAt);
        gain.gain.linearRampToValueAtTime(safeVol, startAt + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, startAt + 0.65);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startAt);
        osc.stop(startAt + 0.68);
      });
    } catch {
      // ignore audio autoplay restriction
    }
  }

  private async tryPlayCurrentUrl() {
    const nonce = this.audioPlayNonce;
    if (!this.audio || this.currentUrlIndex >= this.currentReciterUrls.length) {
      this.fallbackToSynthesizer();
      return;
    }

    const rawUrl = this.currentReciterUrls[this.currentUrlIndex];
    this.setState('loading', this.activeType);

    try {
      const targetUrl = await resolvePlayableAudioUrl(rawUrl, {
        skipAutoCache: this.skipNextAutoCache,
      });
      if (!this.audio || nonce !== this.audioPlayNonce) return;
      this.audio.pause();
      this.audio.src = targetUrl;
      this.audio.load();

      const playPromise = this.audio.play();
      if (playPromise !== undefined) {
        await playPromise;
        if (nonce !== this.audioPlayNonce) return;
        this.setState('playing', this.activeType);
        this.isUnlocked = true;
      }
    } catch (err: unknown) {
      if (nonce !== this.audioPlayNonce) return;
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.warn(`Failed loading audio url [${rawUrl}]:`, errorMsg);
      this.handleUrlFailure(errorMsg);
    }
  }

  private handleUrlFailure(reason?: string) {
    this.currentUrlIndex++;
    if (this.currentUrlIndex < this.currentReciterUrls.length) {
      const nextUrl = this.currentReciterUrls[this.currentUrlIndex];
      const audioLabel = this.getActiveAudioLabel();
      this.notifyError(
        `تعذر تشغيل الرابط لـ (${audioLabel}). جاري التبديل للمرآة الاحتياطية تلقائياً...`,
        false
      );
      setTimeout(() => {
        this.tryPlayCurrentUrl();
      }, 300);
    } else {
      const audioLabel = this.getActiveAudioLabel();
      
      if (this.activeType === 'dua') {
        this.notifyError(
          `تعذّر تحميل ملف MP3 لدعاء الأذان. تم تفعيل النطق الصوتي العربي المباشر كبديل موثوق.`,
          false
        );
        this.speakDuaWithSpeechSynthesis();
      } else if (this.activeType === 'adhkar') {
        this.notifyError(
          `تعذّر تحميل الملف الصوتي لـ (${audioLabel}). تم تفعيل النطق الصوتي العربي المباشر كبديل موثوق.`,
          false
        );
        this.speakTextWithSpeechSynthesis(
          this.fallbackDhikrText ||
            'أَسْتَغْفِرُ اللهَ، أَسْتَغْفِرُ اللهَ، أَسْتَغْفِرُ اللهَ، اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ تَبَارَكْتَ يَا ذَا الجَلَالِ وَالإِكْرَامِ',
          'adhkar'
        );
      } else {
        this.notifyError(
          `تعذّر الاتصال بخوادم MP3 لـ (${audioLabel}). تم تشغيل الصوت النغمي المدمج كبديل فوري.`,
          true
        );
        this.fallbackToSynthesizer();
      }
    }
  }

  private getActiveAudioLabel(): string {
    if (this.activeType === 'dua') return getDuaSource(this.currentReciter).nameAr;
    if (this.activeType === 'adhkar') return 'أذكار الصباح والمساء';
    return (
      FAJR_ADHAN_SOURCES[this.currentReciter]?.nameAr ||
      ADHAN_SOURCES[this.currentReciter]?.nameAr ||
      'الأذان'
    );
  }

  // Web Speech API fallback for Arabic Dua
  public speakDuaWithSpeechSynthesis(): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      this.notifyError('تقنية النطق الصوتي غير متوفرة في المتصفح', true);
      this.listeners.forEach((l) => l.onDuaEnded?.());
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const duaText =
        'اللَّهُمَّ رَبَّ هَذِهِ الدَّعْوَةِ التَّامَّةِ، وَالصَّلَاةِ الْقَائِمَةِ، آتِ مُحَمَّدًا الْوَسِيلَةَ وَالْفَضِيلَةَ، وَابْعَثْهُ مَقَامًا مَحْمُودًا الَّذِي وَعَدْتَهُ';
      const utterance = new SpeechSynthesisUtterance(duaText);
      utterance.lang = 'ar-SA';
      utterance.rate = 0.85; // calm, spiritual pace
      utterance.pitch = 0.95;
      utterance.volume = this.isMutedState ? 0 : 1.0;

      const voices = window.speechSynthesis.getVoices();
      const arabicVoice = voices.find((v) => v.lang.startsWith('ar') || v.name.toLowerCase().includes('arabic'));
      if (arabicVoice) {
        utterance.voice = arabicVoice;
      }

      this.setState('playing', 'dua');

      utterance.onend = () => {
        this.setState('idle', 'none');
        this.listeners.forEach((l) => l.onDuaEnded?.());
      };

      utterance.onerror = (e) => {
        console.warn('Speech synthesis error:', e);
        this.setState('idle', 'none');
        this.listeners.forEach((l) => l.onDuaEnded?.());
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis exception:', err);
      this.setState('idle', 'none');
      this.listeners.forEach((l) => l.onDuaEnded?.());
    }
  }

  // Skip directly from Adhan to Dua
  public skipToDua(duaId: string = 'shaarawy'): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
    if (this.audioCtx && this.audioCtx.state === 'running') {
      this.audioCtx.suspend();
    }
    this.playDua(duaId);
  }

  // Toggle Mute / Unmute
  public toggleMute(): boolean {
    this.isMutedState = !this.isMutedState;
    if (this.audio) {
      this.audio.muted = this.isMutedState;
    }
    if (this.salawatAudio) {
      this.salawatAudio.muted = this.isMutedState;
    }
    if (this.preAdhanAudio) {
      this.preAdhanAudio.muted = this.isMutedState;
    }
    if (this.iqamaAudio) {
      this.iqamaAudio.muted = this.isMutedState;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && this.isMutedState) {
      window.speechSynthesis.cancel();
    }
    return this.isMutedState;
  }

  public isMuted(): boolean {
    return this.isMutedState;
  }

  private fallbackToSynthesizer() {
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!this.audioCtx && AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      if (!this.audioCtx) {
        this.setState('error', 'none');
        return;
      }

      this.setState('playing', this.activeType);
      const ctx = this.audioCtx;
      const now = ctx.currentTime;
      const notes = [293.66, 329.63, 369.99, 392.0, 440.0, 493.88, 554.37, 587.33];
      const sequence = [
        { note: 4, duration: 1.2 },
        { note: 4, duration: 0.6 },
        { note: 3, duration: 0.6 },
        { note: 2, duration: 1.5 },
        { note: 0, duration: 2.2 },
        { note: 2, duration: 0.8 },
        { note: 4, duration: 0.8 },
        { note: 5, duration: 1.2 },
        { note: 4, duration: 2.0 },
        { note: 3, duration: 0.8 },
        { note: 2, duration: 0.8 },
        { note: 1, duration: 0.8 },
        { note: 0, duration: 3.0 },
      ];

      let t = now;
      sequence.forEach((item) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(notes[item.note], t);
        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.3, t + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, t + item.duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + item.duration);
        t += item.duration + 0.1;
      });

      const totalDuration = (t - now) * 1000;
      setTimeout(() => {
        const finishedType = this.activeType;
        const finishedPrayerKey = this.currentPrayerKey;
        this.setState('idle', 'none');
        if (finishedType === 'adhan') {
          const shouldAutoPlayDua = this.autoDuaEnabled && !this.suppressNextAutoDua;
          this.suppressNextAutoDua = false;
          this.listeners.forEach((l) => l.onAdhanEnded?.(finishedPrayerKey));
          if (shouldAutoPlayDua && this.activeType !== 'dua') {
            if (this.autoDuaTimeoutId !== null) {
              window.clearTimeout(this.autoDuaTimeoutId);
            }
            this.autoDuaTimeoutId = window.setTimeout(() => {
              this.autoDuaTimeoutId = null;
              if (this.activeType === 'none' || this.state === 'idle') {
                void this.playDua(this.duaReciter);
              }
            }, 1000);
          }
        }
      }, totalDuration);
    } catch (e) {
      console.error('Synthesizer failed:', e);
      this.setState('error', 'none');
    }
  }

  public stop(): void {
    this.audioPlayNonce++;
    this.salawatPlayNonce++;
    this.preAdhanPlayNonce++;
    this.iqamaPlayNonce++;
    this.suppressNextAutoDua = false;
    if (this.autoDuaTimeoutId !== null) {
      window.clearTimeout(this.autoDuaTimeoutId);
      this.autoDuaTimeoutId = null;
    }
    if (this.salawatTimeoutId !== null) {
      window.clearTimeout(this.salawatTimeoutId);
      this.salawatTimeoutId = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
    if (this.salawatAudio) {
      this.salawatAudio.pause();
      this.salawatAudio.currentTime = 0;
    }
    if (this.preAdhanAudio) {
      this.preAdhanAudio.pause();
      this.preAdhanAudio.currentTime = 0;
    }
    if (this.iqamaAudio) {
      this.iqamaAudio.pause();
      this.iqamaAudio.currentTime = 0;
    }
    if (this.audioCtx && this.audioCtx.state === 'running') {
      this.audioCtx.suspend();
    }
    this.setState('idle', 'none');
    this.notifyProgress(0, 0, 0);
  }

  public togglePlayPause(reciterId?: string, prayerKey: string = 'dhuhr'): void {
    if (this.state === 'playing') {
      this.stop();
    } else {
      this.playAdhan(reciterId || this.currentReciter, prayerKey);
    }
  }

  public playChime(): void {
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!this.audioCtx && AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
      if (!this.audioCtx) return;
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      const ctx = this.audioCtx;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.exponentialRampToValueAtTime(1046.5, now + 0.4);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.5);
    } catch {
      // Ignore
    }
  }

  public playGentleFadeInAlarm(): void {
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!this.audioCtx && AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
      if (!this.audioCtx) return;
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      const ctx = this.audioCtx;
      const now = ctx.currentTime;
      const notes = [392.0, 440.0, 523.25, 659.25];
      notes.forEach((freq, idx) => {
        const startAt = now + idx * 0.9;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startAt);
        const peak = 0.03 + idx * 0.045;
        gain.gain.setValueAtTime(0.001, startAt);
        gain.gain.linearRampToValueAtTime(peak, startAt + 0.55);
        gain.gain.exponentialRampToValueAtTime(0.001, startAt + 1.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startAt);
        osc.stop(startAt + 1.35);
      });
    } catch {
      // Ignore
    }
  }
}

export const adhanPlayer = new AdhanPlayerManager();
