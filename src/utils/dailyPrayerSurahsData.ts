export interface DailyPrayerSurahAyah {
  numberInSurah: number;
  text: string;
}

export interface DailyPrayerSurah {
  surahNumber: number;
  title: string;
  revelationType: 'مكية' | 'مدنية';
  ayahsCount: number;
  gharibWord: string;
  gharibMeaning: string;
  ayahs: DailyPrayerSurahAyah[];
}

export interface DailyPrayerWirdGroup {
  prayerKey: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
  prayerNameAr: string;
  surahs: DailyPrayerSurah[];
}

export const DAILY_PRAYER_SURAHS: DailyPrayerWirdGroup[] = [
  {
    "prayerKey": "fajr",
    "prayerNameAr": "صلاة الفجر",
    "surahs": [
      {
        "surahNumber": 93,
        "title": "سورة الضحى",
        "revelationType": "مكية",
        "ayahsCount": 11,
        "gharibWord": "«عَائِلًا فَأَغْنَىٰ»",
        "gharibMeaning": "أي: فقيراً مُعدَماً فأغناك الله وقنّعك برزقه",
        "ayahs": [
          {
            "numberInSurah": 1,
            "text": "وَٱلضُّحَىٰ"
          },
          {
            "numberInSurah": 2,
            "text": "وَٱلَّيْلِ إِذَا سَجَىٰ"
          },
          {
            "numberInSurah": 3,
            "text": "مَا وَدَّعَكَ رَبُّكَ وَمَا قَلَىٰ"
          },
          {
            "numberInSurah": 4,
            "text": "وَلَلْءَاخِرَةُ خَيْرٌۭ لَّكَ مِنَ ٱلْأُولَىٰ"
          },
          {
            "numberInSurah": 5,
            "text": "وَلَسَوْفَ يُعْطِيكَ رَبُّكَ فَتَرْضَىٰٓ"
          },
          {
            "numberInSurah": 6,
            "text": "أَلَمْ يَجِدْكَ يَتِيمًۭا فَـَٔاوَىٰ"
          },
          {
            "numberInSurah": 7,
            "text": "وَوَجَدَكَ ضَآلًّۭا فَهَدَىٰ"
          },
          {
            "numberInSurah": 8,
            "text": "وَوَجَدَكَ عَآئِلًۭا فَأَغْنَىٰ"
          },
          {
            "numberInSurah": 9,
            "text": "فَأَمَّا ٱلْيَتِيمَ فَلَا تَقْهَرْ"
          },
          {
            "numberInSurah": 10,
            "text": "وَأَمَّا ٱلسَّآئِلَ فَلَا تَنْهَرْ"
          },
          {
            "numberInSurah": 11,
            "text": "وَأَمَّا بِنِعْمَةِ رَبِّكَ فَحَدِّثْ"
          }
        ]
      },
      {
        "surahNumber": 91,
        "title": "سورة الشمس",
        "revelationType": "مكية",
        "ayahsCount": 15,
        "gharibWord": "«فَأَلْهَمَهَا»",
        "gharibMeaning": "أي: عرّف النفس وبيّن لها طريق الفجور والتقوى",
        "ayahs": [
          {
            "numberInSurah": 1,
            "text": "وَٱلشَّمْسِ وَضُحَىٰهَا"
          },
          {
            "numberInSurah": 2,
            "text": "وَٱلْقَمَرِ إِذَا تَلَىٰهَا"
          },
          {
            "numberInSurah": 3,
            "text": "وَٱلنَّهَارِ إِذَا جَلَّىٰهَا"
          },
          {
            "numberInSurah": 4,
            "text": "وَٱلَّيْلِ إِذَا يَغْشَىٰهَا"
          },
          {
            "numberInSurah": 5,
            "text": "وَٱلسَّمَآءِ وَمَا بَنَىٰهَا"
          },
          {
            "numberInSurah": 6,
            "text": "وَٱلْأَرْضِ وَمَا طَحَىٰهَا"
          },
          {
            "numberInSurah": 7,
            "text": "وَنَفْسٍۢ وَمَا سَوَّىٰهَا"
          },
          {
            "numberInSurah": 8,
            "text": "فَأَلْهَمَهَا فُجُورَهَا وَتَقْوَىٰهَا"
          },
          {
            "numberInSurah": 9,
            "text": "قَدْ أَفْلَحَ مَن زَكَّىٰهَا"
          },
          {
            "numberInSurah": 10,
            "text": "وَقَدْ خَابَ مَن دَسَّىٰهَا"
          },
          {
            "numberInSurah": 11,
            "text": "كَذَّبَتْ ثَمُودُ بِطَغْوَىٰهَآ"
          },
          {
            "numberInSurah": 12,
            "text": "إِذِ ٱنۢبَعَثَ أَشْقَىٰهَا"
          },
          {
            "numberInSurah": 13,
            "text": "فَقَالَ لَهُمْ رَسُولُ ٱللَّهِ نَاقَةَ ٱللَّهِ وَسُقْيَٰهَا"
          },
          {
            "numberInSurah": 14,
            "text": "فَكَذَّبُوهُ فَعَقَرُوهَا فَدَمْدَمَ عَلَيْهِمْ رَبُّهُم بِذَنۢبِهِمْ فَسَوَّىٰهَا"
          },
          {
            "numberInSurah": 15,
            "text": "وَلَا يَخَافُ عُقْبَٰهَا"
          }
        ]
      }
    ]
  },
  {
    "prayerKey": "dhuhr",
    "prayerNameAr": "صلاة الظهر",
    "surahs": [
      {
        "surahNumber": 94,
        "title": "سورة الشرح",
        "revelationType": "مكية",
        "ayahsCount": 8,
        "gharibWord": "«أَنقَضَ ظَهْرَكَ»",
        "gharibMeaning": "أي: أثقل ظهرك وأتعبه حمله",
        "ayahs": [
          {
            "numberInSurah": 1,
            "text": "أَلَمْ نَشْرَحْ لَكَ صَدْرَكَ"
          },
          {
            "numberInSurah": 2,
            "text": "وَوَضَعْنَا عَنكَ وِزْرَكَ"
          },
          {
            "numberInSurah": 3,
            "text": "ٱلَّذِىٓ أَنقَضَ ظَهْرَكَ"
          },
          {
            "numberInSurah": 4,
            "text": "وَرَفَعْنَا لَكَ ذِكْرَكَ"
          },
          {
            "numberInSurah": 5,
            "text": "فَإِنَّ مَعَ ٱلْعُسْرِ يُسْرًا"
          },
          {
            "numberInSurah": 6,
            "text": "إِنَّ مَعَ ٱلْعُسْرِ يُسْرًۭا"
          },
          {
            "numberInSurah": 7,
            "text": "فَإِذَا فَرَغْتَ فَٱنصَبْ"
          },
          {
            "numberInSurah": 8,
            "text": "وَإِلَىٰ رَبِّكَ فَٱرْغَب"
          }
        ]
      },
      {
        "surahNumber": 95,
        "title": "سورة التين",
        "revelationType": "مكية",
        "ayahsCount": 8,
        "gharibWord": "«غَيْرُ مَمْنُونٍ»",
        "gharibMeaning": "أي: غير مقطوع ولا منقوص",
        "ayahs": [
          {
            "numberInSurah": 1,
            "text": "وَٱلتِّينِ وَٱلزَّيْتُونِ"
          },
          {
            "numberInSurah": 2,
            "text": "وَطُورِ سِينِينَ"
          },
          {
            "numberInSurah": 3,
            "text": "وَهَٰذَا ٱلْبَلَدِ ٱلْأَمِينِ"
          },
          {
            "numberInSurah": 4,
            "text": "لَقَدْ خَلَقْنَا ٱلْإِنسَٰنَ فِىٓ أَحْسَنِ تَقْوِيمٍۢ"
          },
          {
            "numberInSurah": 5,
            "text": "ثُمَّ رَدَدْنَٰهُ أَسْفَلَ سَٰفِلِينَ"
          },
          {
            "numberInSurah": 6,
            "text": "إِلَّا ٱلَّذِينَ ءَامَنُوا۟ وَعَمِلُوا۟ ٱلصَّٰلِحَٰتِ فَلَهُمْ أَجْرٌ غَيْرُ مَمْنُونٍۢ"
          },
          {
            "numberInSurah": 7,
            "text": "فَمَا يُكَذِّبُكَ بَعْدُ بِٱلدِّينِ"
          },
          {
            "numberInSurah": 8,
            "text": "أَلَيْسَ ٱللَّهُ بِأَحْكَمِ ٱلْحَٰكِمِينَ"
          }
        ]
      }
    ]
  },
  {
    "prayerKey": "asr",
    "prayerNameAr": "صلاة العصر",
    "surahs": [
      {
        "surahNumber": 103,
        "title": "سورة العصر",
        "revelationType": "مكية",
        "ayahsCount": 3,
        "gharibWord": "«لَفِي خُسْرٍ»",
        "gharibMeaning": "أي: في نقصان وهلاك وتضييع لرأس مال العمر",
        "ayahs": [
          {
            "numberInSurah": 1,
            "text": "وَٱلْعَصْرِ"
          },
          {
            "numberInSurah": 2,
            "text": "إِنَّ ٱلْإِنسَٰنَ لَفِى خُسْرٍ"
          },
          {
            "numberInSurah": 3,
            "text": "إِلَّا ٱلَّذِينَ ءَامَنُوا۟ وَعَمِلُوا۟ ٱلصَّٰلِحَٰتِ وَتَوَاصَوْا۟ بِٱلْحَقِّ وَتَوَاصَوْا۟ بِٱلصَّبْرِ"
          }
        ]
      },
      {
        "surahNumber": 104,
        "title": "سورة الهمزة",
        "revelationType": "مكية",
        "ayahsCount": 9,
        "gharibWord": "«هُمَزَةٍ لُّمَزَةٍ»",
        "gharibMeaning": "أي: طعّان في أعراض الناس بالقول والإشارة",
        "ayahs": [
          {
            "numberInSurah": 1,
            "text": "وَيْلٌۭ لِّكُلِّ هُمَزَةٍۢ لُّمَزَةٍ"
          },
          {
            "numberInSurah": 2,
            "text": "ٱلَّذِى جَمَعَ مَالًۭا وَعَدَّدَهُۥ"
          },
          {
            "numberInSurah": 3,
            "text": "يَحْسَبُ أَنَّ مَالَهُۥٓ أَخْلَدَهُۥ"
          },
          {
            "numberInSurah": 4,
            "text": "كَلَّا ۖ لَيُنۢبَذَنَّ فِى ٱلْحُطَمَةِ"
          },
          {
            "numberInSurah": 5,
            "text": "وَمَآ أَدْرَىٰكَ مَا ٱلْحُطَمَةُ"
          },
          {
            "numberInSurah": 6,
            "text": "نَارُ ٱللَّهِ ٱلْمُوقَدَةُ"
          },
          {
            "numberInSurah": 7,
            "text": "ٱلَّتِى تَطَّلِعُ عَلَى ٱلْأَفْـِٔدَةِ"
          },
          {
            "numberInSurah": 8,
            "text": "إِنَّهَا عَلَيْهِم مُّؤْصَدَةٌۭ"
          },
          {
            "numberInSurah": 9,
            "text": "فِى عَمَدٍۢ مُّمَدَّدَةٍۭ"
          }
        ]
      }
    ]
  },
  {
    "prayerKey": "maghrib",
    "prayerNameAr": "صلاة المغرب",
    "surahs": [
      {
        "surahNumber": 100,
        "title": "سورة العاديات",
        "revelationType": "مكية",
        "ayahsCount": 11,
        "gharibWord": "«ضَبْحًا»",
        "gharibMeaning": "أي: صوت أنفاس الخيل المسرعة عند شدة الجري",
        "ayahs": [
          {
            "numberInSurah": 1,
            "text": "وَٱلْعَٰدِيَٰتِ ضَبْحًۭا"
          },
          {
            "numberInSurah": 2,
            "text": "فَٱلْمُورِيَٰتِ قَدْحًۭا"
          },
          {
            "numberInSurah": 3,
            "text": "فَٱلْمُغِيرَٰتِ صُبْحًۭا"
          },
          {
            "numberInSurah": 4,
            "text": "فَأَثَرْنَ بِهِۦ نَقْعًۭا"
          },
          {
            "numberInSurah": 5,
            "text": "فَوَسَطْنَ بِهِۦ جَمْعًا"
          },
          {
            "numberInSurah": 6,
            "text": "إِنَّ ٱلْإِنسَٰنَ لِرَبِّهِۦ لَكَنُودٌۭ"
          },
          {
            "numberInSurah": 7,
            "text": "وَإِنَّهُۥ عَلَىٰ ذَٰلِكَ لَشَهِيدٌۭ"
          },
          {
            "numberInSurah": 8,
            "text": "وَإِنَّهُۥ لِحُبِّ ٱلْخَيْرِ لَشَدِيدٌ"
          },
          {
            "numberInSurah": 9,
            "text": "۞ أَفَلَا يَعْلَمُ إِذَا بُعْثِرَ مَا فِى ٱلْقُبُورِ"
          },
          {
            "numberInSurah": 10,
            "text": "وَحُصِّلَ مَا فِى ٱلصُّدُورِ"
          },
          {
            "numberInSurah": 11,
            "text": "إِنَّ رَبَّهُم بِهِمْ يَوْمَئِذٍۢ لَّخَبِيرٌۢ"
          }
        ]
      },
      {
        "surahNumber": 101,
        "title": "سورة القارعة",
        "revelationType": "مكية",
        "ayahsCount": 11,
        "gharibWord": "«كَالْفَرَاشِ الْمَبْثُوثِ»",
        "gharibMeaning": "أي: كالفراش المتفرق المنتشر في كل جهة",
        "ayahs": [
          {
            "numberInSurah": 1,
            "text": "ٱلْقَارِعَةُ"
          },
          {
            "numberInSurah": 2,
            "text": "مَا ٱلْقَارِعَةُ"
          },
          {
            "numberInSurah": 3,
            "text": "وَمَآ أَدْرَىٰكَ مَا ٱلْقَارِعَةُ"
          },
          {
            "numberInSurah": 4,
            "text": "يَوْمَ يَكُونُ ٱلنَّاسُ كَٱلْفَرَاشِ ٱلْمَبْثُوثِ"
          },
          {
            "numberInSurah": 5,
            "text": "وَتَكُونُ ٱلْجِبَالُ كَٱلْعِهْنِ ٱلْمَنفُوشِ"
          },
          {
            "numberInSurah": 6,
            "text": "فَأَمَّا مَن ثَقُلَتْ مَوَٰزِينُهُۥ"
          },
          {
            "numberInSurah": 7,
            "text": "فَهُوَ فِى عِيشَةٍۢ رَّاضِيَةٍۢ"
          },
          {
            "numberInSurah": 8,
            "text": "وَأَمَّا مَنْ خَفَّتْ مَوَٰزِينُهُۥ"
          },
          {
            "numberInSurah": 9,
            "text": "فَأُمُّهُۥ هَاوِيَةٌۭ"
          },
          {
            "numberInSurah": 10,
            "text": "وَمَآ أَدْرَىٰكَ مَا هِيَهْ"
          },
          {
            "numberInSurah": 11,
            "text": "نَارٌ حَامِيَةٌۢ"
          }
        ]
      }
    ]
  },
  {
    "prayerKey": "isha",
    "prayerNameAr": "صلاة العشاء",
    "surahs": [
      {
        "surahNumber": 99,
        "title": "سورة الزلزلة",
        "revelationType": "مدنية",
        "ayahsCount": 8,
        "gharibWord": "«أَثْقَالَهَا»",
        "gharibMeaning": "أي: ما في جوف الأرض من الكنوز والأموات",
        "ayahs": [
          {
            "numberInSurah": 1,
            "text": "إِذَا زُلْزِلَتِ ٱلْأَرْضُ زِلْزَالَهَا"
          },
          {
            "numberInSurah": 2,
            "text": "وَأَخْرَجَتِ ٱلْأَرْضُ أَثْقَالَهَا"
          },
          {
            "numberInSurah": 3,
            "text": "وَقَالَ ٱلْإِنسَٰنُ مَا لَهَا"
          },
          {
            "numberInSurah": 4,
            "text": "يَوْمَئِذٍۢ تُحَدِّثُ أَخْبَارَهَا"
          },
          {
            "numberInSurah": 5,
            "text": "بِأَنَّ رَبَّكَ أَوْحَىٰ لَهَا"
          },
          {
            "numberInSurah": 6,
            "text": "يَوْمَئِذٍۢ يَصْدُرُ ٱلنَّاسُ أَشْتَاتًۭا لِّيُرَوْا۟ أَعْمَٰلَهُمْ"
          },
          {
            "numberInSurah": 7,
            "text": "فَمَن يَعْمَلْ مِثْقَالَ ذَرَّةٍ خَيْرًۭا يَرَهُۥ"
          },
          {
            "numberInSurah": 8,
            "text": "وَمَن يَعْمَلْ مِثْقَالَ ذَرَّةٍۢ شَرًّۭا يَرَهُۥ"
          }
        ]
      },
      {
        "surahNumber": 102,
        "title": "سورة التكاثر",
        "revelationType": "مكية",
        "ayahsCount": 8,
        "gharibWord": "«زُرْتُمُ الْمَقَابِرَ»",
        "gharibMeaning": "أي: أدرككم الموت فدفنتم في القبور",
        "ayahs": [
          {
            "numberInSurah": 1,
            "text": "أَلْهَىٰكُمُ ٱلتَّكَاثُرُ"
          },
          {
            "numberInSurah": 2,
            "text": "حَتَّىٰ زُرْتُمُ ٱلْمَقَابِرَ"
          },
          {
            "numberInSurah": 3,
            "text": "كَلَّا سَوْفَ تَعْلَمُونَ"
          },
          {
            "numberInSurah": 4,
            "text": "ثُمَّ كَلَّا سَوْفَ تَعْلَمُونَ"
          },
          {
            "numberInSurah": 5,
            "text": "كَلَّا لَوْ تَعْلَمُونَ عِلْمَ ٱلْيَقِينِ"
          },
          {
            "numberInSurah": 6,
            "text": "لَتَرَوُنَّ ٱلْجَحِيمَ"
          },
          {
            "numberInSurah": 7,
            "text": "ثُمَّ لَتَرَوُنَّهَا عَيْنَ ٱلْيَقِينِ"
          },
          {
            "numberInSurah": 8,
            "text": "ثُمَّ لَتُسْـَٔلُنَّ يَوْمَئِذٍ عَنِ ٱلنَّعِيمِ"
          }
        ]
      }
    ]
  }
];
