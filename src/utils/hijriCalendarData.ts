import { CalculationMethodId, CityLocation, PrayerTimeData } from '../types';
import { calculatePrayerTimes } from './prayerCalculator';

export interface HijriDateParts {
  day: number;
  month: number;
  year: number;
  monthNameAr: string;
}

export interface HijriCalendarDay {
  dateKey: string;
  gregorianDate: Date;
  gregorianDay: number;
  gregorianMonthNameAr: string;
  weekdayIndex: number; // 0 = Sun, ..., 6 = Sat
  weekdayAr: string;
  hijriDay: number;
  hijriMonth: number;
  hijriYear: number;
  hijriMonthNameAr: string;
  isToday: boolean;
  isFriday: boolean;
  isWhiteDay: boolean;
  isMonOrThu: boolean;
  occasionLabel: string | null;
  prayerTimes: PrayerTimeData;
}

export interface UpcomingIslamicEvent {
  id: string;
  titleAr: string;
  hijriDateLabel: string;
  daysRemaining: number;
  isToday: boolean;
  category: 'ramadan' | 'eid' | 'fasting' | 'new_year';
}

const HIJRI_MONTH_NAMES_AR: Record<number, string> = {
  1: 'محرم',
  2: 'صفر',
  3: 'ربيع الأول',
  4: 'ربيع الآخر',
  5: 'جمادى الأولى',
  6: 'جمادى الآخرة',
  7: 'رجب',
  8: 'شعبان',
  9: 'رمضان',
  10: 'شوال',
  11: 'ذو القعدة',
  12: 'ذو الحجة',
};

const WEEKDAY_NAMES_AR = [
  'الأحد',
  'الإثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
  'الجمعة',
  'السبت',
];

export function getHijriParts(date: Date, adjustmentDays: number = 0): HijriDateParts {
  const adjusted = new Date(date);
  if (adjustmentDays !== 0) {
    adjusted.setDate(adjusted.getDate() + adjustmentDays);
  }

  let day = 1;
  let month = 1;
  let year = 1448;
  let monthNameAr = HIJRI_MONTH_NAMES_AR[1];

  try {
    const enFmt = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
    });
    const parts = enFmt.formatToParts(adjusted);
    day = parseInt(parts.find((p) => p.type === 'day')?.value || '1', 10) || 1;
    month = parseInt(parts.find((p) => p.type === 'month')?.value || '1', 10) || 1;
    year = parseInt(parts.find((p) => p.type === 'year')?.value || '1448', 10) || 1448;

    const arFmt = new Intl.DateTimeFormat('ar-EG-u-ca-islamic-umalqura', {
      month: 'long',
    });
    monthNameAr = arFmt.format(adjusted) || HIJRI_MONTH_NAMES_AR[month] || 'محرم';
  } catch {
    monthNameAr = HIJRI_MONTH_NAMES_AR[month];
  }

  return { day, month, year, monthNameAr };
}

export function getIslamicOccasionLabel(hijriMonth: number, hijriDay: number): string | null {
  if (hijriMonth === 1 && hijriDay === 1) return 'رأس السنة الهجرية';
  if (hijriMonth === 1 && hijriDay === 9) return 'يوم تاسوعاء';
  if (hijriMonth === 1 && hijriDay === 10) return 'يوم عاشوراء';
  if (hijriMonth === 7 && hijriDay === 1) return 'غرة رجب';
  if (hijriMonth === 8 && hijriDay === 15) return 'النصف من شعبان';
  if (hijriMonth === 9 && hijriDay === 1) return 'أول أيام رمضان';
  if (hijriMonth === 9 && hijriDay === 27) return 'ليلة القدر (المتحراة ٢٧)';
  if (hijriMonth === 10 && hijriDay === 1) return 'عيد الفطر المبارك';
  if (hijriMonth === 12 && hijriDay >= 1 && hijriDay <= 8) return 'عشر ذي الحجة';
  if (hijriMonth === 12 && hijriDay === 9) return 'يوم عرفة المبارك';
  if (hijriMonth === 12 && hijriDay === 10) return 'عيد الأضحى المبارك';
  if (hijriMonth === 12 && hijriDay >= 11 && hijriDay <= 13) return 'أيام التشريق';
  if (hijriDay === 13 || hijriDay === 14 || hijriDay === 15) return 'الأيام البيض';
  return null;
}

export function buildHijriMonthCalendar(
  monthOffset: number,
  location: CityLocation,
  calculationMethod: CalculationMethodId,
  asrMethod: 'standard' | 'hanafi',
  hijriAdjustment: number = 0
): {
  hijriMonth: number;
  hijriYear: number;
  hijriMonthNameAr: string;
  days: HijriCalendarDay[];
} {
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const todayHijri = getHijriParts(today, hijriAdjustment);

  // Target Hijri year & month
  const totalMonthsFromEpoch = todayHijri.year * 12 + (todayHijri.month - 1) + monthOffset;
  const targetYear = Math.floor(totalMonthsFromEpoch / 12);
  const targetMonth = (totalMonthsFromEpoch % 12) + 1;

  // Approximate Gregorian anchor date by adding ~29.53 days * monthOffset
  const anchor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  anchor.setDate(anchor.getDate() + Math.round(monthOffset * 29.53));

  // Walk to find the exact 1st day of target Hijri month/year
  let cursor = new Date(anchor);
  for (let step = 0; step < 90; step++) {
    const p = getHijriParts(cursor, hijriAdjustment);
    if (p.year === targetYear && p.month === targetMonth) {
      if (p.day === 1) break;
      cursor.setDate(cursor.getDate() - (p.day - 1));
    } else if (p.year * 12 + p.month < targetYear * 12 + targetMonth) {
      cursor.setDate(cursor.getDate() + 1);
    } else {
      cursor.setDate(cursor.getDate() - 1);
    }
  }

  // Refine back to day 1 just in case
  for (let guard = 0; guard < 10; guard++) {
    const prev = new Date(cursor);
    prev.setDate(prev.getDate() - 1);
    const prevParts = getHijriParts(prev, hijriAdjustment);
    if (prevParts.year === targetYear && prevParts.month === targetMonth) {
      cursor = prev;
    } else {
      break;
    }
  }

  const days: HijriCalendarDay[] = [];
  let resolvedMonthName = HIJRI_MONTH_NAMES_AR[targetMonth] || 'شهر هجري';

  for (let i = 0; i < 31; i++) {
    const d = new Date(cursor);
    d.setDate(cursor.getDate() + i);
    const p = getHijriParts(d, hijriAdjustment);
    if (p.month !== targetMonth || p.year !== targetYear) break;

    resolvedMonthName = p.monthNameAr || resolvedMonthName;
    const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const weekdayIndex = d.getDay();
    const gregorianMonthNameAr = d.toLocaleDateString('ar-EG', { month: 'short' });
    const prayerTimes = calculatePrayerTimes(
      d,
      location.lat,
      location.lng,
      location.timezone,
      calculationMethod,
      asrMethod
    );

    days.push({
      dateKey,
      gregorianDate: d,
      gregorianDay: d.getDate(),
      gregorianMonthNameAr,
      weekdayIndex,
      weekdayAr: WEEKDAY_NAMES_AR[weekdayIndex] || '',
      hijriDay: p.day,
      hijriMonth: p.month,
      hijriYear: p.year,
      hijriMonthNameAr: p.monthNameAr,
      isToday: dateKey === todayKey,
      isFriday: weekdayIndex === 5,
      isWhiteDay: p.day === 13 || p.day === 14 || p.day === 15,
      isMonOrThu: weekdayIndex === 1 || weekdayIndex === 4,
      occasionLabel: getIslamicOccasionLabel(p.month, p.day),
      prayerTimes,
    });
  }

  return {
    hijriMonth: targetMonth,
    hijriYear: targetYear,
    hijriMonthNameAr: resolvedMonthName,
    days,
  };
}

export function getUpcomingIslamicEvents(hijriAdjustment: number = 0): UpcomingIslamicEvent[] {
  const targets: {
    id: string;
    titleAr: string;
    month: number;
    day: number;
    hijriDateLabel: string;
    category: UpcomingIslamicEvent['category'];
  }[] = [
    { id: 'ramadan', titleAr: 'بداية شهر رمضان المبارك', month: 9, day: 1, hijriDateLabel: '١ رمضان', category: 'ramadan' },
    { id: 'eid_fitr', titleAr: 'عيد الفطر المبارك', month: 10, day: 1, hijriDateLabel: '١ شوال', category: 'eid' },
    { id: 'arafah', titleAr: 'يوم عرفة المبارك', month: 12, day: 9, hijriDateLabel: '٩ ذو الحجة', category: 'fasting' },
    { id: 'eid_adha', titleAr: 'عيد الأضحى المبارك', month: 12, day: 10, hijriDateLabel: '١٠ ذو الحجة', category: 'eid' },
    { id: 'new_year', titleAr: 'رأس السنة الهجرية', month: 1, day: 1, hijriDateLabel: '١ محرم', category: 'new_year' },
    { id: 'ashura', titleAr: 'يوم عاشوراء', month: 1, day: 10, hijriDateLabel: '١٠ محرم', category: 'fasting' },
  ];

  const today = new Date();
  const base = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const foundMap = new Map<string, number>();

  for (let offset = 0; offset <= 365; offset++) {
    const d = new Date(base);
    d.setDate(base.getDate() + offset);
    const p = getHijriParts(d, hijriAdjustment);
    for (const t of targets) {
      if (!foundMap.has(t.id) && p.month === t.month && p.day === t.day) {
        foundMap.set(t.id, offset);
      }
    }
    if (foundMap.size === targets.length) break;
  }

  return targets
    .map((t) => {
      const daysRemaining = foundMap.get(t.id) ?? 0;
      return {
        id: t.id,
        titleAr: t.titleAr,
        hijriDateLabel: t.hijriDateLabel,
        daysRemaining,
        isToday: daysRemaining === 0,
        category: t.category,
      };
    })
    .sort((a, b) => a.daysRemaining - b.daysRemaining);
}
