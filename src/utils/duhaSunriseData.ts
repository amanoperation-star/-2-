import { DAILY_PRAYER_SURAHS, DailyPrayerSurah } from './dailyPrayerSurahsData';
import { toArabicDigits } from './khatmaData';

export const DUHA_TRACKER_STORAGE_KEY = 'mihrab_duha_tracker_v1';
export const DUHA_UPDATED_EVENT = 'mihrab-duha-updated';

export type DuhaPhase =
  | 'before_sunrise'
  | 'prohibition_sunrise'
  | 'ishraq_window'
  | 'duha_morning'
  | 'duha_peak'
  | 'prohibition_zawal'
  | 'after_duha';

export interface DuhaScheduleSnapshot {
  sunriseStr: string;
  ishraqStartStr: string;
  bestDuhaStr: string;
  duhaEndStr: string;
  dhuhrStr: string;
  sunriseMin: number;
  ishraqStartMin: number;
  bestDuhaMin: number;
  duhaEndMin: number;
  dhuhrMin: number;
  phase: DuhaPhase;
  statusLabelAr: string;
  statusDetailAr: string;
  nextMilestoneLabelAr: string;
  nextMilestoneTimeStr: string;
  remainingMinutes: number;
  remainingFormattedAr: string;
  isDuhaActive: boolean;
  isProhibitionWindow: boolean;
  progressPercent: number;
}

export interface DuhaTrackerState {
  todayDate: string; // YYYY-MM-DD
  todayRakats: number; // 0 | 2 | 4 | 6 | 8 | 10 | 12
  historyByDate: Record<string, number>;
  morningChecklist: {
    fajrDone: boolean;
    ishraqDhikrDone: boolean;
  };
}

export interface DuhaHadithItem {
  id: string;
  titleAr: string;
  hadithText: string;
  source: string;
  benefitAr: string;
}

export interface SunriseAdhkarItem {
  id: string;
  titleAr: string;
  text: string;
  noteAr: string;
}

export const DUHA_RAKAT_OPTIONS = [2, 4, 6, 8, 10, 12] as const;

export const DUHA_SUNRISE_HADITHS: DuhaHadithItem[] = [
  {
    id: 'ishraq_hajj_umrah',
    titleAr: 'فضل جلسة الفجر حتى الإشراق',
    hadithText:
      '«مَن صلَّى الغداةَ في جماعةٍ ثم قعد يذكرُ اللهَ حتى تطلعَ الشمسُ ثم صلَّى ركعتين كانت له كأجرِ حجَّةٍ وعمرةٍ، قال رسولُ اللهِ ﷺ: تامَّةٍ تامَّةٍ تامَّةٍ»',
    source: 'رواه الترمذي وحسّنه الألباني',
    benefitAr: 'تبدأ نافذة الإشراق بعد الشروق بنحو ١٥ دقيقة بارتفاع الشمس قيد رمح.',
  },
  {
    id: 'charity_360_joints',
    titleAr: 'صدقة عن كل مفصل في جسدك (٣٦٠ مفصلاً)',
    hadithText:
      '«يُصبحُ على كلِّ سُلامى من أحدِكم صدقةٌ؛ فكلُّ تسبيحةٍ صدقةٌ، وكلُّ تحميدةٍ صدقةٌ، وكلُّ تهليلةٍ صدقةٌ، وكلُّ تكبيرةٍ صدقةٌ... ويُجزِئُ من ذلك ركعتان يركعُهما من الضُّحى»',
    source: 'رواه مسلم',
    benefitAr: 'أقل صلاة الضحى ركعتان، وتُجزئ صدقة شكر يومية عن جميع مفاصل الجسد.',
  },
  {
    id: 'awwabin_peak',
    titleAr: 'صلاة الأوّابين وأفضل وقت للضحى',
    hadithText:
      '«صلاةُ الأوَّابينَ حين تَرمَضُ الفِصالُ»',
    source: 'رواه مسلم',
    benefitAr: 'أفضل أوقات الضحى حين يشتد حر الضحى في منتصف المسافة تقريباً قبل الظهر.',
  },
  {
    id: 'four_rakats_suffice',
    titleAr: 'أربع ركعات تكفيك همّ يومك',
    hadithText:
      '«قال الله عز وجل: يا ابنَ آدمَ اركع لي أربعَ ركعاتٍ من أولِ النهارِ أكفِك آخرَه»',
    source: 'رواه الترمذي وأحمد وصححه الألباني',
    benefitAr: 'وعدٌ رباني بالكفاية والتوفيق والحفظ لمن حافظ على أربع ركعات الضحى.',
  },
];

export const SUNRISE_DUHA_ADHKAR: SunriseAdhkarItem[] = [
  {
    id: 'asbahna_mulk',
    titleAr: 'استفتاح الصباح',
    text: 'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ، رَبِّ أَسْأَلُكَ خَيْرَ مَا فِي هَٰذَا الْيَوْمِ وَخَيْرَ مَا بَعْدَهُ.',
    noteAr: 'يُقال مرة واحدة كل صباح',
  },
  {
    id: 'sayyid_istighfar',
    titleAr: 'سيد الاستغفار',
    text: 'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَٰهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَىٰ عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ.',
    noteAr: 'مَن قالها موقناً بها صباحاً ومات من يومه دخل الجنة',
  },
  {
    id: 'subhanallah_3_times',
    titleAr: 'الذكر المضاعف حتى الإشراق',
    text: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ: عَدَدَ خَلْقِهِ، وَرِضَا نَفْسِهِ، وَزِنَةَ عَرْشِهِ، وَمِدَادَ كَلِمَاتِهِ.',
    noteAr: 'ثلاث مرات صباحاً بعد الفجر أو عند الشروق',
  },
  {
    id: 'dua_duha_rizq',
    titleAr: 'دعاء طلب العلم والرزق الطيب',
    text: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا، وَرِزْقًا طَيِّبًا، وَعَمَلًا مُتَقَبَّلًا.',
    noteAr: 'كان النبي ﷺ يدعو به بعد صلاة الفجر وفي الصباح',
  },
];

export function parseTimeHHMMToMinutes(timeStr: string | undefined, fallbackMin: number): number {
  if (!timeStr) return fallbackMin;
  const parts = timeStr.trim().split(':');
  if (parts.length < 2) return fallbackMin;
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  if (!Number.isFinite(h) || !Number.isFinite(m) || h < 0 || h > 23 || m < 0 || m > 59) {
    return fallbackMin;
  }
  return h * 60 + m;
}

export function minutesToHHMM(totalMinutes: number): string {
  const normalized = ((Math.round(totalMinutes) % 1440) + 1440) % 1440;
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function formatTime12Ar(time24: string): string {
  const [hRaw, mRaw] = time24.split(':').map(Number);
  if (!Number.isFinite(hRaw) || !Number.isFinite(mRaw)) return time24;
  const period = hRaw >= 12 ? 'م' : 'ص';
  const h12 = hRaw % 12 || 12;
  return `${toArabicDigits(h12)}:${toArabicDigits(String(mRaw).padStart(2, '0'))} ${period}`;
}

export function formatDurationAr(totalMinutes: number): string {
  const safe = Math.max(0, Math.round(totalMinutes));
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  if (h === 0) {
    return `${toArabicDigits(m)} د`;
  }
  if (m === 0) {
    return `${toArabicDigits(h)} س`;
  }
  return `${toArabicDigits(h)} س ${toArabicDigits(m)} د`;
}

export function calculateDuhaSchedule(
  sunriseTimeStr: string | undefined,
  dhuhrTimeStr: string | undefined,
  now: Date = new Date()
): DuhaScheduleSnapshot {
  const sunriseMin = parseTimeHHMMToMinutes(sunriseTimeStr, 6 * 60 + 15);
  const rawDhuhrMin = parseTimeHHMMToMinutes(dhuhrTimeStr, 12 * 60 + 5);
  const dhuhrMin = rawDhuhrMin > sunriseMin + 60 ? rawDhuhrMin : sunriseMin + 330;

  // Classic fiqh boundaries:
  // 1) Ishraq / Duha opens ~15 mins after sunrise (spear-height elevation)
  // 2) Best Duha ("حين ترمض الفصال") at mid-morning (~50% between sunrise & dhuhr)
  // 3) Duha ends 10 mins before Dhuhr (prohibition window before Zawal)
  const ishraqStartMin = sunriseMin + 15;
  const duhaEndMin = Math.max(ishraqStartMin + 15, dhuhrMin - 10);
  const bestDuhaMin = Math.max(
    ishraqStartMin + 20,
    Math.min(duhaEndMin - 15, sunriseMin + Math.round((dhuhrMin - sunriseMin) * 0.5))
  );

  const sunriseStr = minutesToHHMM(sunriseMin);
  const ishraqStartStr = minutesToHHMM(ishraqStartMin);
  const bestDuhaStr = minutesToHHMM(bestDuhaMin);
  const duhaEndStr = minutesToHHMM(duhaEndMin);
  const dhuhrStr = minutesToHHMM(dhuhrMin);

  const nowMin = now.getHours() * 60 + now.getMinutes();
  const ishraqWindowCutoff = Math.min(bestDuhaMin, ishraqStartMin + 45);

  let phase: DuhaPhase;
  let statusLabelAr: string;
  let statusDetailAr: string;
  let nextMilestoneLabelAr: string;
  let nextMilestoneTimeStr: string;
  let remainingMinutes: number;

  if (nowMin < sunriseMin) {
    phase = 'before_sunrise';
    statusLabelAr = 'قبل شروق الشمس';
    statusDetailAr = 'اغتنم جلسة الذكر وتلاوة القرآن بعد الفجر حتى الشروق';
    nextMilestoneLabelAr = 'موعد الشروق';
    nextMilestoneTimeStr = formatTime12Ar(sunriseStr);
    remainingMinutes = sunriseMin - nowMin;
  } else if (nowMin < ishraqStartMin) {
    phase = 'prohibition_sunrise';
    statusLabelAr = 'وقت النهي عند الشروق';
    statusDetailAr = 'تنتهي مدة النهي وتُفتح صلاة الإشراق خلال دقائق';
    nextMilestoneLabelAr = 'بداية الإشراق';
    nextMilestoneTimeStr = formatTime12Ar(ishraqStartStr);
    remainingMinutes = ishraqStartMin - nowMin;
  } else if (nowMin < ishraqWindowCutoff) {
    phase = 'ishraq_window';
    statusLabelAr = 'نافذة صلاة الإشراق متاحة الآن';
    statusDetailAr = 'وقت ركعتي الإشراق بأجر حجة وعمرة تامة لمن ذكر الله بعد الفجر';
    nextMilestoneLabelAr = 'أفضل وقت للضحى';
    nextMilestoneTimeStr = formatTime12Ar(bestDuhaStr);
    remainingMinutes = bestDuhaMin - nowMin;
  } else if (nowMin < bestDuhaMin) {
    phase = 'duha_morning';
    statusLabelAr = 'وقت صلاة الضحى متاح الآن';
    statusDetailAr = 'يمكنك أداء الضحى الآن من ركعتين حتى ١٢ ركعة';
    nextMilestoneLabelAr = 'أفضل وقت للضحى';
    nextMilestoneTimeStr = formatTime12Ar(bestDuhaStr);
    remainingMinutes = bestDuhaMin - nowMin;
  } else if (nowMin < duhaEndMin) {
    phase = 'duha_peak';
    statusLabelAr = 'أفضل وقت لصلاة الضحى الآن';
    statusDetailAr = 'صلاة الأوابين حين ترمض الفصال — بادر بها قبل الزوال';
    nextMilestoneLabelAr = 'نهاية وقت الضحى';
    nextMilestoneTimeStr = formatTime12Ar(duhaEndStr);
    remainingMinutes = duhaEndMin - nowMin;
  } else if (nowMin < dhuhrMin) {
    phase = 'prohibition_zawal';
    statusLabelAr = 'وقت الكراهة قبيل الزوال';
    statusDetailAr = 'انتهى وقت الضحى ويُستحب التهيؤ لصلاة الظهر';
    nextMilestoneLabelAr = 'أذان الظهر';
    nextMilestoneTimeStr = formatTime12Ar(dhuhrStr);
    remainingMinutes = dhuhrMin - nowMin;
  } else {
    phase = 'after_duha';
    statusLabelAr = 'انتهى وقت الضحى لليوم';
    statusDetailAr = 'يتجدد موعد الشروق والإشراق في صباح الغد بإذن الله';
    nextMilestoneLabelAr = 'شروق الغد';
    nextMilestoneTimeStr = formatTime12Ar(sunriseStr);
    remainingMinutes = 1440 - nowMin + sunriseMin;
  }

  const isDuhaActive =
    phase === 'ishraq_window' || phase === 'duha_morning' || phase === 'duha_peak';
  const isProhibitionWindow =
    phase === 'prohibition_sunrise' || phase === 'prohibition_zawal';

  const windowSpan = Math.max(1, duhaEndMin - ishraqStartMin);
  let progressPercent = 0;
  if (nowMin >= duhaEndMin) {
    progressPercent = 100;
  } else if (nowMin > ishraqStartMin) {
    progressPercent = Math.min(100, Math.max(0, Math.round(((nowMin - ishraqStartMin) / windowSpan) * 100)));
  }

  return {
    sunriseStr,
    ishraqStartStr,
    bestDuhaStr,
    duhaEndStr,
    dhuhrStr,
    sunriseMin,
    ishraqStartMin,
    bestDuhaMin,
    duhaEndMin,
    dhuhrMin,
    phase,
    statusLabelAr,
    statusDetailAr,
    nextMilestoneLabelAr,
    nextMilestoneTimeStr,
    remainingMinutes,
    remainingFormattedAr: formatDurationAr(remainingMinutes),
    isDuhaActive,
    isProhibitionWindow,
    progressPercent,
  };
}

export function getDuhaTodayDateKey(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function loadDuhaTrackerState(now: Date = new Date()): DuhaTrackerState {
  const today = getDuhaTodayDateKey(now);
  const fallback: DuhaTrackerState = {
    todayDate: today,
    todayRakats: 0,
    historyByDate: {},
    morningChecklist: {
      fajrDone: false,
      ishraqDhikrDone: false,
    },
  };

  if (typeof window === 'undefined') return fallback;

  try {
    const raw = localStorage.getItem(DUHA_TRACKER_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<DuhaTrackerState>;
    const historyByDate: Record<string, number> = {};
    if (parsed.historyByDate && typeof parsed.historyByDate === 'object') {
      Object.entries(parsed.historyByDate).forEach(([dateKey, count]) => {
        const val = Math.max(0, Math.min(12, Number(count) || 0));
        if (val > 0) {
          historyByDate[dateKey] = val;
        }
      });
    }

    if (parsed.todayDate === today) {
      const rakats = Math.max(0, Math.min(12, Number(parsed.todayRakats) || 0));
      return {
        todayDate: today,
        todayRakats: rakats,
        historyByDate,
        morningChecklist: {
          fajrDone: Boolean(parsed.morningChecklist?.fajrDone),
          ishraqDhikrDone: Boolean(parsed.morningChecklist?.ishraqDhikrDone),
        },
      };
    }

    return {
      todayDate: today,
      todayRakats: historyByDate[today] || 0,
      historyByDate,
      morningChecklist: {
        fajrDone: false,
        ishraqDhikrDone: false,
      },
    };
  } catch {
    return fallback;
  }
}

export function saveDuhaTrackerState(state: DuhaTrackerState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(DUHA_TRACKER_STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent(DUHA_UPDATED_EVENT, { detail: state }));
  } catch {
    // ignore quota issues
  }
}

export function setDuhaRakats(state: DuhaTrackerState, rakats: number): DuhaTrackerState {
  const clamped = Math.max(0, Math.min(12, Math.round(rakats / 2) * 2));
  const nextHistory = { ...state.historyByDate };
  if (clamped > 0) {
    nextHistory[state.todayDate] = clamped;
  } else {
    delete nextHistory[state.todayDate];
  }

  // Prune to recent 60 entries to keep storage tidy
  const sortedKeys = Object.keys(nextHistory).sort();
  if (sortedKeys.length > 60) {
    for (const k of sortedKeys.slice(0, sortedKeys.length - 60)) {
      delete nextHistory[k];
    }
  }

  return {
    ...state,
    todayRakats: clamped,
    historyByDate: nextHistory,
  };
}

export function stepDuhaRakats(state: DuhaTrackerState, delta: 2 | -2): DuhaTrackerState {
  return setDuhaRakats(state, state.todayRakats + delta);
}

const ARABIC_SHORT_DAYS = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

export function getDuhaStats(
  state: DuhaTrackerState,
  now: Date = new Date()
): {
  streakDays: number;
  last7Days: { dateKey: string; dayLabelAr: string; rakats: number; isToday: boolean }[];
  totalDaysCompleted: number;
  totalRakatsAllTime: number;
} {
  const last7Days: { dateKey: string; dayLabelAr: string; rakats: number; isToday: boolean }[] = [];
  for (let offset = 6; offset >= 0; offset--) {
    const d = new Date(now);
    d.setDate(d.getDate() - offset);
    const key = getDuhaTodayDateKey(d);
    const rakats = key === state.todayDate ? state.todayRakats : state.historyByDate[key] || 0;
    last7Days.push({
      dateKey: key,
      dayLabelAr: ARABIC_SHORT_DAYS[d.getDay()] || '',
      rakats,
      isToday: offset === 0,
    });
  }

  let streakDays = 0;
  const cursor = new Date(now);
  const todayCount = state.todayRakats;
  if (todayCount >= 2) {
    streakDays += 1;
  }
  cursor.setDate(cursor.getDate() - 1);
  while (true) {
    const key = getDuhaTodayDateKey(cursor);
    if ((state.historyByDate[key] || 0) >= 2) {
      streakDays += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  const mergedHistory = { ...state.historyByDate };
  if (state.todayRakats > 0) {
    mergedHistory[state.todayDate] = state.todayRakats;
  } else {
    delete mergedHistory[state.todayDate];
  }

  const values = Object.values(mergedHistory);
  const totalDaysCompleted = values.filter((v) => v >= 2).length;
  const totalRakatsAllTime = values.reduce((sum, v) => sum + v, 0);

  return {
    streakDays,
    last7Days,
    totalDaysCompleted,
    totalRakatsAllTime,
  };
}

export function getDuhaRankLabelAr(rakats: number): string {
  if (rakats === 0) return 'لم تُصلَّ اليوم بعد';
  if (rakats === 2) return 'أقل الضحى (تُجزئ صدقة عن ٣٦٠ مفصلاً)';
  if (rakats === 4) return 'أربع ركعات (وعد الكفاية لآخر النهار)';
  if (rakats <= 8) return 'صلاة الأوابين الوسطى (بارك الله لك)';
  return 'أتمّ صلاة الضحى وأكملها (١٠–١٢ ركعة)';
}

export function getDuhaRecommendedSurahs(): DailyPrayerSurah[] {
  const fajrGroup = DAILY_PRAYER_SURAHS.find((g) => g.prayerKey === 'fajr');
  if (!fajrGroup) return [];
  const duha = fajrGroup.surahs.find((s) => s.surahNumber === 93);
  const shams = fajrGroup.surahs.find((s) => s.surahNumber === 91);
  return [shams, duha].filter((item): item is DailyPrayerSurah => Boolean(item));
}
