import { PrayerTimeData } from '../types';

export type FamilyMemberRole = 'parent' | 'youth' | 'child';
export type FamilyPrayerKey = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
export type FamilyPrayerStatus = 'none' | 'solo' | 'jamaah';

export interface FamilyMember {
  id: string;
  name: string;
  role: FamilyMemberRole;
  avatarSymbol: string;
  createdAt: string;
}

export interface FamilyDayLog {
  prayers: Record<FamilyPrayerKey, FamilyPrayerStatus>;
  adhkarDone: boolean;
  quranPages: number;
}

export interface WeeklyCovenantItem {
  id: string;
  titleAr: string;
  subtitleAr: string;
  points: number;
}

export interface FamilyHomeState {
  customFamilyTitle: string;
  members: FamilyMember[];
  logsByDate: Record<string, Record<string, FamilyDayLog>>;
  weeklyCovenantByWeek: Record<string, string[]>;
  jamaahAlertEnabled: boolean;
  jamaahAlertMinutesBefore: 5 | 10 | 15;
}

export interface KidGuideStep {
  stepNumber: number;
  titleAr: string;
  instructionAr: string;
  phraseAr?: string;
  tipAr: string;
}

export const FAMILY_PRAYER_ORDER: FamilyPrayerKey[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

export const FAMILY_PRAYER_LABELS: Record<FamilyPrayerKey, string> = {
  fajr: 'الفجر',
  dhuhr: 'الظهر',
  asr: 'العصر',
  maghrib: 'المغرب',
  isha: 'العشاء',
};

export const FAMILY_ROLE_LABELS: Record<FamilyMemberRole, string> = {
  parent: 'والد / والدة',
  youth: 'شاب / فتاة',
  child: 'طفل (غرس الصلاة)',
};

export const FAMILY_AVATAR_OPTIONS: string[] = ['🕌', '🌙', '⭐', '📖', '🌿', '🤍'];

export const FAMILY_WEEKLY_COVENANT_ITEMS: WeeklyCovenantItem[] = [
  {
    id: 'kahf_friday',
    titleAr: 'قراءة سورة الكهف يوم الجمعة',
    subtitleAr: 'نورٌ للبيت ما بين الجمعتين بالتلاوة أو الاستماع معاً',
    points: 5,
  },
  {
    id: 'duha_prayer',
    titleAr: 'المحافظة على ركعتَي الضحى',
    subtitleAr: 'صدقة عن كل مفصل في الجسد ولو مرة أو مرتين بالأسبوع',
    points: 4,
  },
  {
    id: 'quran_halaqa',
    titleAr: 'حَلْقة بيت قصيرة (٣ آيات وتفسير ميسّر)',
    subtitleAr: 'جلوس الأسرة ١٠ دقائق مع كتاب الله بعد العصر أو المغرب',
    points: 5,
  },
  {
    id: 'friday_dua_hour',
    titleAr: 'ساعة الدعاء المشترك عصر الجمعة',
    subtitleAr: 'تذكير الأبناء بالدعاء لأنفسهم ولوالديهم والمسلمين قبل المغرب',
    points: 4,
  },
  {
    id: 'kid_wudu_practice',
    titleAr: 'مراجعة إتقان الوضوء والخشوع مع الصغار',
    subtitleAr: 'تطبيق عملي لطيف لخطوات الوضوء وآداب الصلاة في المنزل',
    points: 4,
  },
];

export const KID_WUDU_STEPS: KidGuideStep[] = [
  {
    stepNumber: 1,
    titleAr: 'النية والتسمية',
    instructionAr: 'أنوي بقلبي الوضوء لأقف نظيفاً طاهراً بين يدي الله، ثم أقول بصوت لطيف:',
    phraseAr: 'بِسْمِ اللَّهِ',
    tipAr: 'الوضوء يغسل الذنوب ويجعل وجهك منيراً.',
  },
  {
    stepNumber: 2,
    titleAr: 'غسل الكفين ثلاثاً',
    instructionAr: 'أغسل كفّيّ بالماء ثلاث مرات مع تخليل الماء بين الأصابع بلطف دون إسراف.',
    tipAr: 'نقتصد في الماء كما كان النبي ﷺ يتوضأ بماء قليل.',
  },
  {
    stepNumber: 3,
    titleAr: 'المضمضة ثلاثاً',
    instructionAr: 'آخذ قليلاً من الماء في فمي وأحركه جيداً ثم أخرجه ثلاث مرات لينظف فمي لذكر الله.',
    tipAr: 'استخدم يدك اليمنى عند أخذ الماء.',
  },
  {
    stepNumber: 4,
    titleAr: 'الاستنشاق والاستنثار ثلاثاً',
    instructionAr: 'أدخل قليلاً من الماء في أنفي برفق باليد اليمنى، ثم أخرجه باليد اليسرى ثلاث مرات.',
    tipAr: 'لا تبالغ في سحب الماء بقوة حتى لا يؤذيك.',
  },
  {
    stepNumber: 5,
    titleAr: 'غسل الوجه ثلاثاً',
    instructionAr: 'أغسل وجهي كاملاً من منبت الشعر أعلى الجبهة إلى أسفل الذقن، ومن الأذن إلى الأذن ثلاث مرات.',
    tipAr: 'تأكد من وصول الماء إلى جانبي الأنف والجبهة.',
  },
  {
    stepNumber: 6,
    titleAr: 'غسل اليدين إلى المرفقين ثلاثاً',
    instructionAr: 'أغسل يدي اليمنى من أطراف الأصابع إلى ما بعد المرفق (الكوع) ثلاث مرات، ثم اليسرى مثلها ثلاثاً.',
    tipAr: 'ابدأ دائماً باليد اليمنى.',
  },
  {
    stepNumber: 7,
    titleAr: 'مسح الرأس والأذنين مرة واحدة',
    instructionAr: 'أبلّل يديّ بالماء ثم أمسح بهما رأسي من الأمام إلى الخلف ثم أرجع، وبنفس البلل أمسح داخل الأذنين وخلفهما مرة واحدة.',
    tipAr: 'مسح الرأس والأذنين يكون برفق ومرة واحدة فقط.',
  },
  {
    stepNumber: 8,
    titleAr: 'غسل الرجلين إلى الكعبين ثلاثاً',
    instructionAr: 'أغسل رجلي اليمنى مع الكعبين (العظمين البارزين) وأخلل بين الأصابع ثلاث مرات، ثم اليسرى ثلاث مرات.',
    tipAr: 'تأكد من وصول الماء للعقب (مؤخرة القدم).',
  },
  {
    stepNumber: 9,
    titleAr: 'دعاء ختام الوضوء',
    instructionAr: 'بعد الفراغ من الوضوء أستقبل القبلة وأقول:',
    phraseAr: 'أَشْهَدُ أَنْ لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ، اللَّهُمَّ اجْعَلْنِي مِنَ التَّوَّابِينَ وَاجْعَلْنِي مِنَ الْمُتَطَهِّرِينَ',
    tipAr: 'تُفتح لقائل هذا الدعاء أبواب الجنة الثمانية!',
  },
];

export const KID_SALAH_STEPS: KidGuideStep[] = [
  {
    stepNumber: 1,
    titleAr: 'الوقوف بخشوع واستقبال القبلة',
    instructionAr: 'أقف في مكان طاهر نظيف باتجاه القبلة بوقار وسكينة، وأنوي في قلبي الصلاة التي سأؤديها.',
    tipAr: 'أنظر إلى موضع سجودي وأبتعد عن الالتفات.',
  },
  {
    stepNumber: 2,
    titleAr: 'تكبيرة الإحرام',
    instructionAr: 'أرفع يديّ حذو منكبيّ وأقول بهدوء وتعظيم لله:',
    phraseAr: 'اللَّهُ أَكْبَرُ',
    tipAr: 'أضع يدي اليمنى فوق اليسرى على صدري بخشوع.',
  },
  {
    stepNumber: 3,
    titleAr: 'دعاء الاستفتاح وسورة الفاتحة',
    instructionAr: 'أستفتح بهدوء ثم أقرأ سورة الفاتحة آيةً آية بترتيل، وبعدها سورة قصيرة في الركعتين الأوليين.',
    phraseAr: 'سُبْحَانَكَ اللَّهُمَّ وَبِحَمْدِكَ، وَتَبَارَكَ اسْمُكَ، وَتَعَالَى جَدُّكَ، وَلَا إِلَٰهَ غَيْرُكَ',
    tipAr: 'الفاتحة مناجاة بينك وبين الله، اقرأها ببطء.',
  },
  {
    stepNumber: 4,
    titleAr: 'الركوع والطمأنينة',
    instructionAr: 'أكبّر وأنحني حتى يستوي ظهري وأضع يديّ على ركبتيّ، وأقول ثلاث مرات باطمئنان:',
    phraseAr: 'سُبْحَانَ رَبِّيَ الْعَظِيمِ',
    tipAr: 'لا تستعجل في الركوع؛ خذ لحظة سكون تام.',
  },
  {
    stepNumber: 5,
    titleAr: 'الاعتدال من الركوع',
    instructionAr: 'أرفع رأسي حتى أقف معتدلاً تماماً وأقول:',
    phraseAr: 'سَمِعَ اللَّهُ لِمَنْ حَمِدَهُ — رَبَّنَا وَلَكَ الْحَمْدُ',
    tipAr: 'انتظر حتى يطمئن جسمك واقفاً قبل السجود.',
  },
  {
    stepNumber: 6,
    titleAr: 'السجود والدعاء',
    instructionAr: 'أكبّر وأسجد على الأعضاء السبعة (الجبهة مع الأنف، الكفّين، الركبتين، وأطراف القدمين) وأقول ثلاث مرات:',
    phraseAr: 'سُبْحَانَ رَبِّيَ الْأَعْلَى',
    tipAr: 'أقرب ما يكون العبد من ربه وهو ساجد، فادعُ الله بما تحب.',
  },
  {
    stepNumber: 7,
    titleAr: 'الجلوس بين السجدتين والتشهد',
    instructionAr: 'أرفع من السجود وأجلس مطمئناً قائلاً «رَبِّ اغْفِرْ لِي» ثم أسجد ثانية. وفي الركعة الثانية والأخيرة أقرأ التشهد:',
    phraseAr: 'التَّحِيَّاتُ لِلَّهِ وَالصَّلَوَاتُ وَالطَّيِّبَاتُ، السَّلَامُ عَلَيْكَ أَيُّهَا النَّبِيُّ وَرَحْمَةُ اللَّهِ وَبَرَكَاتُهُ...',
    tipAr: 'في التشهد الأخير نصلّي على النبي ﷺ بالصلاة الإبراهيمية.',
  },
  {
    stepNumber: 8,
    titleAr: 'التسليم وختام الصلاة',
    instructionAr: 'ألتفت يميناً قائلاً «السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ» ثم يساراً بمثلها، ثم أستغفر الله ثلاثاً وأسبّح.',
    phraseAr: 'أَسْتَغْفِرُ اللَّهَ (٣ مرات) — اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ',
    tipAr: 'بارك الله فيك! حافظ على صلاتك لتنال محبة الله.',
  },
];

const STORAGE_KEY = 'mihrab_family_home_state_v1';

export function getTodayFamilyDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getWeekKey(date: Date = new Date()): string {
  // Week starting Saturday (Islamic weekend rhythm)
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = copy.getDay(); // 0=Sun..6=Sat
  const diffToSat = (day + 1) % 7;
  copy.setDate(copy.getDate() - diffToSat);
  return getTodayFamilyDateKey(copy);
}

export function createEmptyFamilyDayLog(): FamilyDayLog {
  return {
    prayers: {
      fajr: 'none',
      dhuhr: 'none',
      asr: 'none',
      maghrib: 'none',
      isha: 'none',
    },
    adhkarDone: false,
    quranPages: 0,
  };
}

function createDefaultFamilyState(): FamilyHomeState {
  return {
    customFamilyTitle: 'بيتنا المسلم',
    members: [
      {
        id: 'member_father',
        name: 'الأب',
        role: 'parent',
        avatarSymbol: '🕌',
        createdAt: getTodayFamilyDateKey(),
      },
      {
        id: 'member_mother',
        name: 'الأم',
        role: 'parent',
        avatarSymbol: '🌙',
        createdAt: getTodayFamilyDateKey(),
      },
      {
        id: 'member_child_1',
        name: 'عمر (الابن)',
        role: 'child',
        avatarSymbol: '⭐',
        createdAt: getTodayFamilyDateKey(),
      },
    ],
    logsByDate: {},
    weeklyCovenantByWeek: {},
    jamaahAlertEnabled: true,
    jamaahAlertMinutesBefore: 10,
  };
}

export function loadFamilyHomeState(): FamilyHomeState {
  if (typeof window === 'undefined') return createDefaultFamilyState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultFamilyState();
    const parsed = JSON.parse(raw) as Partial<FamilyHomeState>;
    const defaults = createDefaultFamilyState();
    return {
      customFamilyTitle:
        typeof parsed.customFamilyTitle === 'string' && parsed.customFamilyTitle.trim()
          ? parsed.customFamilyTitle.trim()
          : defaults.customFamilyTitle,
      members: Array.isArray(parsed.members) && parsed.members.length > 0 ? parsed.members : defaults.members,
      logsByDate: parsed.logsByDate && typeof parsed.logsByDate === 'object' ? parsed.logsByDate : {},
      weeklyCovenantByWeek:
        parsed.weeklyCovenantByWeek && typeof parsed.weeklyCovenantByWeek === 'object'
          ? parsed.weeklyCovenantByWeek
          : {},
      jamaahAlertEnabled:
        typeof parsed.jamaahAlertEnabled === 'boolean' ? parsed.jamaahAlertEnabled : true,
      jamaahAlertMinutesBefore:
        parsed.jamaahAlertMinutesBefore === 5 ||
        parsed.jamaahAlertMinutesBefore === 10 ||
        parsed.jamaahAlertMinutesBefore === 15
          ? parsed.jamaahAlertMinutesBefore
          : 10,
    };
  } catch {
    return createDefaultFamilyState();
  }
}

export function saveFamilyHomeState(state: FamilyHomeState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage quota errors
  }
}

export function getMemberDayLog(
  state: FamilyHomeState,
  memberId: string,
  dateKey: string = getTodayFamilyDateKey()
): FamilyDayLog {
  const dayMap = state.logsByDate[dateKey];
  const raw = dayMap?.[memberId];
  if (!raw) return createEmptyFamilyDayLog();
  return {
    prayers: {
      fajr: raw.prayers?.fajr || 'none',
      dhuhr: raw.prayers?.dhuhr || 'none',
      asr: raw.prayers?.asr || 'none',
      maghrib: raw.prayers?.maghrib || 'none',
      isha: raw.prayers?.isha || 'none',
    },
    adhkarDone: Boolean(raw.adhkarDone),
    quranPages: typeof raw.quranPages === 'number' && raw.quranPages >= 0 ? raw.quranPages : 0,
  };
}

export function getMemberDayStats(
  state: FamilyHomeState,
  memberId: string,
  dateKey: string = getTodayFamilyDateKey()
): {
  completedCount: number;
  jamaahCount: number;
  stars: number;
  allFiveDone: boolean;
} {
  const log = getMemberDayLog(state, memberId, dateKey);
  let completedCount = 0;
  let jamaahCount = 0;
  let stars = 0;
  for (const pk of FAMILY_PRAYER_ORDER) {
    const st = log.prayers[pk];
    if (st === 'jamaah') {
      completedCount++;
      jamaahCount++;
      stars += 2;
    } else if (st === 'solo') {
      completedCount++;
      stars += 1;
    }
  }
  if (log.adhkarDone) stars += 1;
  if (log.quranPages > 0) stars += 1;
  return {
    completedCount,
    jamaahCount,
    stars,
    allFiveDone: completedCount === 5,
  };
}

export function getRecentDateKeys(days: number = 7, fromDate: Date = new Date()): string[] {
  const keys: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
    d.setDate(d.getDate() - i);
    keys.push(getTodayFamilyDateKey(d));
  }
  return keys;
}

export function getMemberStreakDays(
  state: FamilyHomeState,
  member: FamilyMember,
  today: Date = new Date()
): number {
  const minTarget = member.role === 'child' ? 3 : 5;
  let streak = 0;
  for (let i = 0; i < 60; i++) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    d.setDate(d.getDate() - i);
    const dk = getTodayFamilyDateKey(d);
    const stats = getMemberDayStats(state, member.id, dk);
    if (stats.completedCount >= minTarget) {
      streak++;
    } else if (i === 0) {
      // Today not finished yet doesn't break yesterday's active streak
      continue;
    } else {
      break;
    }
  }
  return streak;
}

export function getMemberEarnedBadges(
  state: FamilyHomeState,
  member: FamilyMember,
  today: Date = new Date()
): string[] {
  const last7Keys = getRecentDateKeys(7, today);
  let fajrCount = 0;
  let jamaahCount = 0;
  let adhkarDays = 0;
  for (const dk of last7Keys) {
    const log = getMemberDayLog(state, member.id, dk);
    if (log.prayers.fajr !== 'none') fajrCount++;
    for (const pk of FAMILY_PRAYER_ORDER) {
      if (log.prayers[pk] === 'jamaah') jamaahCount++;
    }
    if (log.adhkarDone) adhkarDays++;
  }
  const todayStats = getMemberDayStats(state, member.id, getTodayFamilyDateKey(today));
  const badges: string[] = [];
  if (todayStats.allFiveDone) badges.push('مُتمّ الصلوات الخمس');
  if (fajrCount >= 3) badges.push('فارس الفجر');
  if (jamaahCount >= 5) badges.push('نجم الجماعة');
  if (adhkarDays >= 3) badges.push('رفيق الأذكار');
  return badges;
}

export interface FamilyDailyAggregate {
  dateKey: string;
  labelAr: string;
  completedPrayers: number;
  maxPossiblePrayers: number;
  jamaahPrayers: number;
}

export interface FamilyWeeklySummary {
  todayCompletedPrayers: number;
  todayMaxPrayers: number;
  todayJamaahPrayers: number;
  weeklyStarsTotal: number;
  weeklyPrayersTotal: number;
  weeklyJamaahPercent: number;
  dailyBreakdown: FamilyDailyAggregate[];
  covenantDoneCount: number;
  covenantTotalCount: number;
  covenantPercent: number;
}

const ARABIC_SHORT_DAYS = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

export function getFamilyWeeklySummary(
  state: FamilyHomeState,
  today: Date = new Date()
): FamilyWeeklySummary {
  const todayKey = getTodayFamilyDateKey(today);
  const last7 = getRecentDateKeys(7, today);
  const memberCount = Math.max(1, state.members.length);

  let todayCompletedPrayers = 0;
  let todayJamaahPrayers = 0;
  let weeklyStarsTotal = 0;
  let weeklyPrayersTotal = 0;
  let weeklyJamaahTotal = 0;

  const dailyBreakdown: FamilyDailyAggregate[] = last7.map((dk) => {
    const [y, m, d] = dk.split('-').map(Number);
    const dt = new Date(y, (m || 1) - 1, d || 1);
    let dayPrayers = 0;
    let dayJamaah = 0;
    for (const mem of state.members) {
      const st = getMemberDayStats(state, mem.id, dk);
      dayPrayers += st.completedCount;
      dayJamaah += st.jamaahCount;
      weeklyStarsTotal += st.stars;
    }
    weeklyPrayersTotal += dayPrayers;
    weeklyJamaahTotal += dayJamaah;
    if (dk === todayKey) {
      todayCompletedPrayers = dayPrayers;
      todayJamaahPrayers = dayJamaah;
    }
    return {
      dateKey: dk,
      labelAr: ARABIC_SHORT_DAYS[dt.getDay()] || '',
      completedPrayers: dayPrayers,
      maxPossiblePrayers: memberCount * 5,
      jamaahPrayers: dayJamaah,
    };
  });

  const weekKey = getWeekKey(today);
  const covenantDone = state.weeklyCovenantByWeek[weekKey] || [];
  const covenantDoneCount = covenantDone.filter((id) =>
    FAMILY_WEEKLY_COVENANT_ITEMS.some((item) => item.id === id)
  ).length;
  const covenantTotalCount = FAMILY_WEEKLY_COVENANT_ITEMS.length;
  const covenantPercent = Math.round((covenantDoneCount / Math.max(1, covenantTotalCount)) * 100);

  return {
    todayCompletedPrayers,
    todayMaxPrayers: memberCount * 5,
    todayJamaahPrayers,
    weeklyStarsTotal,
    weeklyPrayersTotal,
    weeklyJamaahPercent:
      weeklyPrayersTotal > 0 ? Math.round((weeklyJamaahTotal / weeklyPrayersTotal) * 100) : 0,
    dailyBreakdown,
    covenantDoneCount,
    covenantTotalCount,
    covenantPercent,
  };
}

export function getNextHomeJamaahAlert(
  prayerTimes: PrayerTimeData,
  windowMinutes: number = 10,
  now: Date = new Date()
): {
  isWithinWindow: boolean;
  prayerKey: FamilyPrayerKey;
  prayerNameAr: string;
  prayerTimeStr: string;
  minutesUntil: number;
} {
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const isFriday = now.getDay() === 5;
  const ordered: Array<{ key: FamilyPrayerKey; label: string; timeStr: string }> = [
    { key: 'fajr', label: 'الفجر', timeStr: prayerTimes.fajr },
    { key: 'dhuhr', label: isFriday ? 'الجمعة' : 'الظهر', timeStr: prayerTimes.dhuhr },
    { key: 'asr', label: 'العصر', timeStr: prayerTimes.asr },
    { key: 'maghrib', label: 'المغرب', timeStr: prayerTimes.maghrib },
    { key: 'isha', label: 'العشاء', timeStr: prayerTimes.isha },
  ];

  for (const item of ordered) {
    const [h, m] = item.timeStr.split(':').map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) continue;
    const pMins = h * 60 + m;
    const diff = pMins - nowMinutes;
    if (diff >= 0) {
      return {
        isWithinWindow: diff <= windowMinutes,
        prayerKey: item.key,
        prayerNameAr: item.label,
        prayerTimeStr: item.timeStr,
        minutesUntil: diff,
      };
    }
  }

  // Next is tomorrow's Fajr
  const [fh, fm] = prayerTimes.fajr.split(':').map(Number);
  const tomorrowFajrMins = 24 * 60 + ((fh || 0) * 60 + (fm || 0));
  const diff = tomorrowFajrMins - nowMinutes;
  return {
    isWithinWindow: diff <= windowMinutes,
    prayerKey: 'fajr',
    prayerNameAr: 'الفجر',
    prayerTimeStr: prayerTimes.fajr,
    minutesUntil: diff,
  };
}
