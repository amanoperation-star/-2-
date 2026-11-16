export type SunnahWeekDayKey = 'sat' | 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri';

export interface SunnahDayMeta {
  key: SunnahWeekDayKey;
  labelAr: string;
  jsDay: number; // 0 = Sunday ... 6 = Saturday
}

export const SUNNAH_WEEK_DAYS: SunnahDayMeta[] = [
  { key: 'sat', labelAr: 'السبت', jsDay: 6 },
  { key: 'sun', labelAr: 'الأحد', jsDay: 0 },
  { key: 'mon', labelAr: 'الاثنين', jsDay: 1 },
  { key: 'tue', labelAr: 'الثلاثاء', jsDay: 2 },
  { key: 'wed', labelAr: 'الأربعاء', jsDay: 3 },
  { key: 'thu', labelAr: 'الخميس', jsDay: 4 },
  { key: 'fri', labelAr: 'الجمعة', jsDay: 5 },
];

export interface ForgottenSunnahItem {
  id: string;
  title: string;
  icon: string;
  practicalGuideLine1: string;
  practicalGuideLine2: string;
  hadithText: string;
  hadithSource: string;
}

export const FORGOTTEN_SUNNAH_LIBRARY: ForgottenSunnahItem[] = [
  {
    id: 'ishraq_duha',
    title: 'جلسة الإشراق حتى الضحى',
    icon: '🌅',
    practicalGuideLine1: 'امكث في مصلاك بعد صلاة الفجر في ذكرٍ وقراءة قرآن أو استغفار حتى تطلع الشمس وترتفع قيد رمح (نحو ١٥ دقيقة).',
    practicalGuideLine2: 'ثم صلِّ ركعتين خفيفتين بنية الإشراق والضحى لتنال أجر حجةٍ وعمرةٍ تامة كما أخبر النبي ﷺ.',
    hadithText:
      '«مَنْ صَلَّى الْغَدَاةَ فِي جَمَاعَةٍ ثُمَّ قَعَدَ يَذْكُرُ اللَّهَ حَتَّى تَطْلُعَ الشَّمْسُ ثُمَّ صَلَّى رَكْعَتَيْنِ كَانَتْ لَهُ كَأَجْرِ حَجَّةٍ وَعُمْرَةٍ تَامَّةٍ تَامَّةٍ تَامَّةٍ»',
    hadithSource: 'رواه الترمذي (٥٨٦) عن أنس بن مالك رضي الله عنه وحسّنه الألباني',
  },
  {
    id: 'wudu_two_rakats',
    title: 'سُنة الوضوء ركعتين',
    icon: '💧',
    practicalGuideLine1: 'توضأ وأحسن إسباغ الوضوء، ثم بادر فور الفراغ بصلاة ركعتين خفيفتين قبل أن تنشغل بأمر الدنيا.',
    practicalGuideLine2: 'استحضر فيهما الإقبال بالقلب والوجه على الله دون حديث نفسٍ ليكتب الله لك بهما الفوز بالجنة.',
    hadithText:
      '«مَا مِنْ مُسْلِمٍ يَتَوَضَّأُ فَيُحْسِنُ وُضُوءَهُ، ثُمَّ يَقُومُ فَيُصَلِّي رَكْعَتَيْنِ، مُقْبِلٌ عَلَيْهِمَا بِقَلْبِهِ وَوَجْهِهِ، إِلَّا وَجَبَتْ لَهُ الْجَنَّةُ»',
    hadithSource: 'رواه مسلم (٢٣٤) عن عقبة بن عامر رضي الله عنه',
  },
  {
    id: 'night_turning_adhkar',
    title: 'أذكار التقلّب ليلاً',
    icon: '🌙',
    practicalGuideLine1: 'إذا استيقظت أو تقلّبت من جنبٍ إلى جنبٍ أثناء نومك ليلاً فلا ترجع للنوم غافلاً، بل لهِج لسانك بذكر الله.',
    practicalGuideLine2: 'قل بخشوع: «لا إلهَ إلَّا اللهُ الواحدُ القهَّارُ، ربُّ السَّمواتِ والأرضِ وما بينَهما العزيزُ الغفَّارُ».',
    hadithText:
      '«كَانَ رَسُولُ اللَّهِ ﷺ إِذَا تَضَوَّرَ مِنَ اللَّيْلِ قَالَ: لَا إِلَهَ إِلَّا اللَّهُ الْوَاحِدُ الْقَهَّارُ، رَبُّ السَّمَاوَاتِ وَالْأَرْضِ وَمَا بَيْنَهُمَا الْعَزِيزُ الْغَفَّارُ»',
    hadithSource: 'رواه النسائي في عمل اليوم والليلة وصحّحه الألباني في صحيح الجامع (٤٧٢٣)',
  },
  {
    id: 'repeat_adhan_dua',
    title: 'ترديد الأذان والدعاء بعده',
    icon: '🕌',
    practicalGuideLine1: 'أنصت للمؤذن وردّد خلفه مثل ما يقول، وعند الحيعلتين قل: «لا حول ولا قوة إلا بالله» بيقينٍ وتوكل.',
    practicalGuideLine2: 'ثم صلِّ على النبي ﷺ واسأل الله له الوسيلة والفضيلة، وادعُ لنفسك؛ فالدعاء بين الأذان والإقامة لا يُرد.',
    hadithText:
      '«إِذَا سَمِعْتُمُ الْمُؤَذِّنَ فَقُولُوا مِثْلَ مَا يَقُولُ، ثُمَّ صَلُّوا عَلَيَّ فَإِنَّهُ مَنْ صَلَّى عَلَيَّ صَلَاةً صَلَّى اللَّهُ عَلَيْهِ بِهَا عَشْرًا، ثُمَّ سَلُوا اللَّهَ لِيَ الْوَسِيلَةَ»',
    hadithSource: 'رواه مسلم (٣٨٤) عن عبد الله بن عمرو رضي الله عنهما',
  },
  {
    id: 'salam_and_musafaha',
    title: 'التبسّط في السلام والمصافحة',
    icon: '🤝',
    practicalGuideLine1: 'بادر بإفشاء السلام كاملاً «السلام عليكم ورحمة الله وبركاته» على من تعرف ومن لا تعرف بابتسامة وطلاقة وجه.',
    practicalGuideLine2: 'وصافح إخوانك عند اللقاء بحرارةٍ دون سحب اليد أولاً؛ فإن الذنوب تتساقط قبل أن يتفرقا.',
    hadithText:
      '«أَلَا أَدُلُّكُمْ عَلَى شَيْءٍ إِذَا فَعَلْتُمُوهُ تَحَابَبْتُمْ؟ أَفْشُوا السَّلَامَ بَيْنَكُمْ» وقوله ﷺ: «مَا مِنْ مُسْلِمَيْنِ يَلْتَقِيَانِ فَيَتَصَافَحَانِ إِلَّا غُفِرَ لَهُمَا قَبْلَ أَنْ يَفْتَرِقَا»',
    hadithSource: 'رواه مسلم (٥٤)، وأبو داود (٥٢١٢) والترمذي (٢٧٢٧)',
  },
  {
    id: 'siwak_every_prayer',
    title: 'سُنة السواك عند كل صلاة',
    icon: '🪥',
    practicalGuideLine1: 'اجعل السواك رفيقك الدائم في جيبك أو حقيبتك، واستخدمه عند كل وضوء وقبل تكبيرة الإحرام لكل صلاة.',
    practicalGuideLine2: 'واحرص عليه أيضاً عند تلاوة القرآن وعند دخول البيت والاستيقاظ من النوم، فهو مطهرةٌ للفم ومرضاةٌ للرب.',
    hadithText:
      '«لَوْلَا أَنْ أَشُقَّ عَلَى أُمَّتِي لَأَمَرْتُهُمْ بِالسِّوَاكِ عِنْدَ كُلِّ صَلَاةٍ» وقوله ﷺ: «السِّوَاكُ مَطْهَرَةٌ لِلْفَمِ، مَرْضَاةٌ لِلرَّبِّ»',
    hadithSource: 'متفق عليه: البخاري (٨٨٧) ومسلم (٢٥٢)، والنسائي (٥)',
  },
  {
    id: 'witr_before_sleep',
    title: 'الوتر قبل النوم',
    icon: '✨',
    practicalGuideLine1: 'اختم صلاتك قبل أن تضع رأسك على الوسادة بركعةٍ أو ثلاث ركعاتٍ وتراً تدعو فيها الله بما في قلبك.',
    practicalGuideLine2: 'فمن خاف ألا يقوم من آخر الليل فليوتر أوله؛ لتُكتب من القائمين وتحفظ صلة الختام مع الله كل ليلة.',
    hadithText:
      'عن أبي هريرة رضي الله عنه قال: «أَوْصَانِي خَلِيلِي ﷺ بِثَلَاثٍ: صِيَامِ ثَلَاثَةِ أَيَّامٍ مِنْ كُلِّ شَهْرٍ، وَرَكْعَتَيِ الضُّحَى، وَأَنْ أُوتِرَ قَبْلَ أَنْ أَنَامَ»',
    hadithSource: 'متفق عليه: البخاري (١١٧٨) ومسلم (٧٢١)',
  },
];

export interface MasteredSunnahRecord {
  id: string;
  title: string;
  icon: string;
  weekKey: string;
  daysCount: number;
  masteredAt: string;
}

export interface SunnahRadarState {
  weekKey: string;
  selectedSunnahId: string;
  weeklyProgress: Record<string, Record<string, SunnahWeekDayKey[]>>;
  masteredSunnahs: MasteredSunnahRecord[];
}

export const SUNNAH_RADAR_STORAGE_KEY = 'mihrab_sunnah_radar_v1';
export const SUNNAH_MASTERY_THRESHOLD = 5;

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function formatDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/**
 * Computes the Saturday start key (YYYY-MM-DD) for the week containing `date`.
 * Week starts on Saturday (jsDay === 6) and ends on Friday (jsDay === 5).
 */
export function getCurrentSunnahWeekKey(date: Date = new Date()): string {
  const local = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const jsDay = local.getDay(); // 0=Sun..6=Sat
  const offsetFromSaturday = (jsDay + 1) % 7; // Sat->0, Sun->1, ..., Fri->6
  local.setDate(local.getDate() - offsetFromSaturday);
  return formatDateKey(local);
}

/**
 * Returns today's SunnahWeekDayKey and Arabic label based on device calendar.
 */
export function getTodaySunnahDayMeta(date: Date = new Date()): SunnahDayMeta {
  const jsDay = date.getDay();
  return SUNNAH_WEEK_DAYS.find((d) => d.jsDay === jsDay) || SUNNAH_WEEK_DAYS[0];
}

/**
 * Deterministic weekly rotation index from weekKey (Saturday-start YYYY-MM-DD).
 */
export function getWeeklyDefaultSunnah(weekKey: string): ForgottenSunnahItem {
  const [y, m, d] = weekKey.split('-').map(Number);
  const utcDay = Date.UTC(y || 2026, (m || 1) - 1, d || 1) / (1000 * 60 * 60 * 24);
  const weekNumber = Math.max(0, Math.floor(utcDay / 7));
  const idx = weekNumber % FORGOTTEN_SUNNAH_LIBRARY.length;
  return FORGOTTEN_SUNNAH_LIBRARY[idx];
}

export function getSunnahById(id: string): ForgottenSunnahItem {
  return FORGOTTEN_SUNNAH_LIBRARY.find((s) => s.id === id) || FORGOTTEN_SUNNAH_LIBRARY[0];
}

export function loadSunnahRadarState(now: Date = new Date()): SunnahRadarState {
  const currentWeekKey = getCurrentSunnahWeekKey(now);
  const defaultSunnah = getWeeklyDefaultSunnah(currentWeekKey);

  if (typeof window === 'undefined') {
    return {
      weekKey: currentWeekKey,
      selectedSunnahId: defaultSunnah.id,
      weeklyProgress: {},
      masteredSunnahs: [],
    };
  }

  try {
    const raw = localStorage.getItem(SUNNAH_RADAR_STORAGE_KEY);
    if (!raw) {
      return {
        weekKey: currentWeekKey,
        selectedSunnahId: defaultSunnah.id,
        weeklyProgress: {},
        masteredSunnahs: [],
      };
    }

    const parsed = JSON.parse(raw) as Partial<SunnahRadarState>;
    const weeklyProgress =
      parsed.weeklyProgress && typeof parsed.weeklyProgress === 'object' ? parsed.weeklyProgress : {};
    const masteredSunnahs = Array.isArray(parsed.masteredSunnahs) ? parsed.masteredSunnahs : [];

    // If a new week started, automatically switch spotlight to the new week's Sunnah
    const isSameWeek = parsed.weekKey === currentWeekKey;
    const validSelected =
      isSameWeek &&
      parsed.selectedSunnahId &&
      FORGOTTEN_SUNNAH_LIBRARY.some((s) => s.id === parsed.selectedSunnahId)
        ? parsed.selectedSunnahId
        : defaultSunnah.id;

    return {
      weekKey: currentWeekKey,
      selectedSunnahId: validSelected,
      weeklyProgress,
      masteredSunnahs,
    };
  } catch {
    return {
      weekKey: currentWeekKey,
      selectedSunnahId: defaultSunnah.id,
      weeklyProgress: {},
      masteredSunnahs: [],
    };
  }
}

export function saveSunnahRadarState(state: SunnahRadarState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SUNNAH_RADAR_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage quota failures
  }
}

export function toggleSunnahDayCompletion(
  state: SunnahRadarState,
  sunnahId: string,
  dayKey: SunnahWeekDayKey,
  forceValue?: boolean
): SunnahRadarState {
  const weekMap = state.weeklyProgress[state.weekKey] || {};
  const prevDays = Array.isArray(weekMap[sunnahId]) ? weekMap[sunnahId] : [];
  const exists = prevDays.includes(dayKey);
  const shouldEnable = forceValue !== undefined ? forceValue : !exists;

  if (shouldEnable === exists) {
    return state;
  }

  const nextDays: SunnahWeekDayKey[] = shouldEnable
    ? [...prevDays, dayKey]
    : prevDays.filter((d) => d !== dayKey);

  const nextWeeklyProgress: Record<string, Record<string, SunnahWeekDayKey[]>> = {
    ...state.weeklyProgress,
    [state.weekKey]: {
      ...weekMap,
      [sunnahId]: nextDays,
    },
  };

  // Automatically record or update in masteredSunnahs when >= 5 days are completed
  const sunnah = getSunnahById(sunnahId);
  let nextMastered = [...state.masteredSunnahs];
  const existingIdx = nextMastered.findIndex(
    (item) => item.id === sunnahId && item.weekKey === state.weekKey
  );

  if (nextDays.length >= SUNNAH_MASTERY_THRESHOLD) {
    const record: MasteredSunnahRecord = {
      id: sunnah.id,
      title: sunnah.title,
      icon: sunnah.icon,
      weekKey: state.weekKey,
      daysCount: nextDays.length,
      masteredAt:
        existingIdx >= 0 ? nextMastered[existingIdx].masteredAt : new Date().toISOString(),
    };
    if (existingIdx >= 0) {
      nextMastered[existingIdx] = record;
    } else {
      nextMastered = [record, ...nextMastered];
    }
  } else if (existingIdx >= 0) {
    // If user unchecked below 5 days in the active week, reflect accurately
    nextMastered.splice(existingIdx, 1);
  }

  return {
    ...state,
    weeklyProgress: nextWeeklyProgress,
    masteredSunnahs: nextMastered,
  };
}

export function cycleNextSunnah(state: SunnahRadarState): SunnahRadarState {
  const currentIndex = FORGOTTEN_SUNNAH_LIBRARY.findIndex(
    (item) => item.id === state.selectedSunnahId
  );
  const nextIndex =
    currentIndex >= 0 ? (currentIndex + 1) % FORGOTTEN_SUNNAH_LIBRARY.length : 0;
  return {
    ...state,
    selectedSunnahId: FORGOTTEN_SUNNAH_LIBRARY[nextIndex].id,
  };
}
