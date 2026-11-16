export interface FastingPreferences {
  whiteDaysEnabled: boolean;
  monThuEnabled: boolean;
  ashuraArafahEnabled: boolean;
  showFastingStatsInRecord: boolean;
}

export interface FastingInfo {
  isFastingIntent: boolean;
  occasionTitle: string;
  reminderMessage: string | null;
  isUpcomingSeason: boolean;
  isMaghribNear: boolean;
  suhoorTimeStr: string;
}

export const FASTING_PREFS_STORAGE_KEYS = {
  whiteDays: 'fasting_pref_white_days',
  monThu: 'fasting_pref_mon_thu',
  ashuraArafah: 'fasting_pref_ashura_arafah',
  showInStats: 'fasting_pref_show_in_stats',
};

export function loadFastingPreferences(): FastingPreferences {
  if (typeof window === 'undefined') {
    return {
      whiteDaysEnabled: true,
      monThuEnabled: true,
      ashuraArafahEnabled: true,
      showFastingStatsInRecord: true,
    };
  }
  const readBool = (key: string, fallback: boolean) => {
    const val = localStorage.getItem(key);
    return val === null ? fallback : val === 'true';
  };
  return {
    whiteDaysEnabled: readBool(FASTING_PREFS_STORAGE_KEYS.whiteDays, true),
    monThuEnabled: readBool(FASTING_PREFS_STORAGE_KEYS.monThu, true),
    ashuraArafahEnabled: readBool(FASTING_PREFS_STORAGE_KEYS.ashuraArafah, true),
    showFastingStatsInRecord: readBool(FASTING_PREFS_STORAGE_KEYS.showInStats, true),
  };
}

export function saveFastingPreferences(prefs: Partial<FastingPreferences>): void {
  if (typeof window === 'undefined') return;
  try {
    if (typeof prefs.whiteDaysEnabled === 'boolean') {
      localStorage.setItem(FASTING_PREFS_STORAGE_KEYS.whiteDays, String(prefs.whiteDaysEnabled));
    }
    if (typeof prefs.monThuEnabled === 'boolean') {
      localStorage.setItem(FASTING_PREFS_STORAGE_KEYS.monThu, String(prefs.monThuEnabled));
    }
    if (typeof prefs.ashuraArafahEnabled === 'boolean') {
      localStorage.setItem(FASTING_PREFS_STORAGE_KEYS.ashuraArafah, String(prefs.ashuraArafahEnabled));
    }
    if (typeof prefs.showFastingStatsInRecord === 'boolean') {
      localStorage.setItem(FASTING_PREFS_STORAGE_KEYS.showInStats, String(prefs.showFastingStatsInRecord));
    }
    window.dispatchEvent(new Event('fasting_intent_changed'));
  } catch {
    // ignore storage quota errors
  }
}

export function getTodayDateKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function loadFastingIntent(dateKey: string = getTodayDateKey()): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(`fasting_intent_${dateKey}`) === 'true';
  } catch {
    return false;
  }
}

export function saveFastingIntent(intent: boolean, dateKey: string = getTodayDateKey()): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`fasting_intent_${dateKey}`, String(intent));
    window.dispatchEvent(new Event('fasting_intent_changed'));
  } catch {
    // ignore
  }
}

export function countCompletedFastingDays(): number {
  if (typeof window === 'undefined') return 0;
  try {
    let count = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('fasting_intent_') && localStorage.getItem(k) === 'true') {
        count += 1;
      }
    }
    return count;
  } catch {
    return 0;
  }
}

export function evaluateFastingCalculator(
  fajrTimeStr?: string,
  maghribTimeStr?: string,
  currentTime: Date = new Date(),
  overridePrefs?: Partial<FastingPreferences>
): FastingInfo {
  const dateKey = getTodayDateKey();
  const isFastingIntent = loadFastingIntent(dateKey);
  const prefs = { ...loadFastingPreferences(), ...overridePrefs };

  // Compute Hijri day & month via Intl
  let hijriDay = 15;
  let hijriMonth = 6;
  let hijriMonthName = 'جمادى الآخرة';
  try {
    const arFormatter = new Intl.DateTimeFormat('ar-EG-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'long',
    });
    const arParts = arFormatter.formatToParts(currentTime);
    const monthNamePart = arParts.find((p) => p.type === 'month');
    if (monthNamePart) hijriMonthName = monthNamePart.value;

    const enFormatter = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'numeric',
    });
    const enParts = enFormatter.formatToParts(currentTime);
    const dayPart = enParts.find((p) => p.type === 'day');
    const monthPart = enParts.find((p) => p.type === 'month');
    if (dayPart) hijriDay = parseInt(dayPart.value, 10) || 15;
    if (monthPart) hijriMonth = parseInt(monthPart.value, 10) || 6;
  } catch {
    hijriDay = 15;
  }

  const jsDayOfWeek = currentTime.getDay(); // 0: Sun, 1: Mon, ..., 4: Thu
  const isMonday = jsDayOfWeek === 1;
  const isThursday = jsDayOfWeek === 4;
  const isSundayEvening = jsDayOfWeek === 0 && currentTime.getHours() >= 16;
  const isWednesdayEvening = jsDayOfWeek === 3 && currentTime.getHours() >= 16;

  const isWhiteDay = [13, 14, 15].includes(hijriDay);
  const isWhiteDayUpcoming = hijriDay === 12 && currentTime.getHours() >= 16;

  // Annual blessed fasting days
  const isArafah = hijriMonth === 12 && hijriDay === 9;
  const isArafahUpcoming = hijriMonth === 12 && hijriDay === 8 && currentTime.getHours() >= 16;
  const isTasuaAshura = hijriMonth === 1 && (hijriDay === 9 || hijriDay === 10);
  const isTasuaUpcoming = hijriMonth === 1 && hijriDay === 8 && currentTime.getHours() >= 16;
  const isShawwalSeason = hijriMonth === 10 && hijriDay >= 2 && hijriDay <= 29;

  let occasionTitle = 'صيام التطوع المبارك';
  let reminderMessage: string | null = null;
  let isUpcomingSeason = false;

  if (prefs.ashuraArafahEnabled && isArafah) {
    occasionTitle = 'صيام يوم عرفة (٩ ذو الحجة)';
    reminderMessage = '🌙 اليوم يوم عرفة المبارك — يكفر السنة الماضية والباقية، هل تنوي الصيام؟';
    isUpcomingSeason = true;
  } else if (prefs.ashuraArafahEnabled && isArafahUpcoming) {
    occasionTitle = 'غداً يوم عرفة';
    reminderMessage = '🌙 غداً يوم عرفة (٩ ذو الحجة) — هل تنوي صيامه؟';
    isUpcomingSeason = true;
  } else if (prefs.ashuraArafahEnabled && isTasuaAshura) {
    occasionTitle = hijriDay === 9 ? 'صيام يوم تاسوعاء (٩ محرم)' : 'صيام يوم عاشوراء (١٠ محرم)';
    reminderMessage = `🌙 اليوم ${hijriDay === 9 ? 'تاسوعاء' : 'عاشوراء'} المبارك — هل تنوي الصيام؟`;
    isUpcomingSeason = true;
  } else if (prefs.ashuraArafahEnabled && isTasuaUpcoming) {
    occasionTitle = 'تاسوعاء وعاشوراء غداً';
    reminderMessage = '🌙 غداً تاسوعاء ويليه عاشوراء من شهر الله المحرم — هل تنوي الصيام؟';
    isUpcomingSeason = true;
  } else if (prefs.whiteDaysEnabled && isWhiteDay) {
    occasionTitle = `صيام الأيام البيض (${hijriDay} ${hijriMonthName})`;
    reminderMessage = `🌙 اليوم من الأيام البيض المباركة (${hijriDay} من الشهر الهجري) — هل تنوي الصيام؟`;
    isUpcomingSeason = true;
  } else if (prefs.whiteDaysEnabled && isWhiteDayUpcoming) {
    occasionTitle = 'الأيام البيض تبدأ غداً';
    reminderMessage = '🌙 غداً تبدأ الأيام البيض (١٣ من الشهر الهجري) — هل تنوي صيامها؟';
    isUpcomingSeason = true;
  } else if (prefs.monThuEnabled && (isMonday || isThursday)) {
    occasionTitle = isMonday ? 'صيام يوم الإثنين' : 'صيام يوم الخميس';
    reminderMessage = `🌙 اليوم ${isMonday ? 'الإثنين' : 'الخميس'} يوم تُرفع فيه الأعمال — هل تنوي الصيام؟`;
    isUpcomingSeason = true;
  } else if (prefs.monThuEnabled && (isSundayEvening || isWednesdayEvening)) {
    const nextDayName = isSundayEvening ? 'الإثنين' : 'الخميس';
    occasionTitle = `صيام غدٍ (${nextDayName})`;
    reminderMessage = `🌙 غداً يوم ${nextDayName} (سنة الصيام) — هل تنوي الصيام؟`;
    isUpcomingSeason = true;
  } else if (prefs.ashuraArafahEnabled && isShawwalSeason) {
    occasionTitle = 'صيام ست من شوال';
    reminderMessage = '🌙 أيام شوال المباركة — اغتنم صيام الست من شوال لتحظى بأجر صيام الدهر';
    isUpcomingSeason = true;
  }

  // Compute Suhoor / Imsak (10 minutes before Fajr)
  let suhoorTimeStr = '04:15 ص';
  if (fajrTimeStr && fajrTimeStr.includes(':')) {
    const [h, m] = fajrTimeStr.split(':').map(Number);
    const totalMins = (h * 60 + m - 10 + 24 * 60) % (24 * 60);
    const sh = Math.floor(totalMins / 60);
    const sm = totalMins % 60;
    const h12 = sh % 12 === 0 ? 12 : sh % 12;
    const ampm = sh >= 12 ? 'م' : 'ص';
    suhoorTimeStr = `${h12.toString().padStart(2, '0')}:${sm.toString().padStart(2, '0')} ${ampm}`;
  }

  // Check if Maghrib is near (within last 30 minutes)
  let isMaghribNear = false;
  if (maghribTimeStr && maghribTimeStr.includes(':')) {
    const [mh, mm] = maghribTimeStr.split(':').map(Number);
    const maghribMins = mh * 60 + mm;
    const nowMins = currentTime.getHours() * 60 + currentTime.getMinutes();
    const diff = maghribMins - nowMins;
    if (diff >= 0 && diff <= 30) {
      isMaghribNear = true;
    }
  }

  return {
    isFastingIntent,
    occasionTitle,
    reminderMessage,
    isUpcomingSeason,
    isMaghribNear,
    suhoorTimeStr,
  };
}
