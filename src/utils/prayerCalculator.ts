import {
  Coordinates,
  CalculationMethod,
  PrayerTimes,
  CalculationParameters,
  Madhab,
} from 'adhan';
import { CityLocation, CalculationMethodId, PrayerTimeData, CalculationMethod as CalcMethodType, NightThirdsInfo } from '../types';

export const CITIES: CityLocation[] = [
  { id: 'cairo', name: 'Cairo', nameAr: 'القاهرة', country: 'Egypt', countryAr: 'مصر', lat: 30.0444, lng: 31.2357, timezone: 'Africa/Cairo' },
  { id: 'alexandria', name: 'Alexandria', nameAr: 'الإسكندرية', country: 'Egypt', countryAr: 'مصر', lat: 31.2001, lng: 29.9187, timezone: 'Africa/Cairo' },
  { id: 'giza', name: 'Giza', nameAr: 'الجيزة', country: 'Egypt', countryAr: 'مصر', lat: 30.0131, lng: 31.2089, timezone: 'Africa/Cairo' },
  { id: 'mansoura', name: 'Mansoura', nameAr: 'المنصورة', country: 'Egypt', countryAr: 'مصر', lat: 31.0409, lng: 31.3785, timezone: 'Africa/Cairo' },
  { id: 'tanta', name: 'Tanta', nameAr: 'طنطا', country: 'Egypt', countryAr: 'مصر', lat: 30.7865, lng: 31.0004, timezone: 'Africa/Cairo' },
  { id: 'asyut', name: 'Asyut', nameAr: 'أسيوط', country: 'Egypt', countryAr: 'مصر', lat: 27.1809, lng: 31.1837, timezone: 'Africa/Cairo' },
  { id: 'makkah', name: 'Makkah', nameAr: 'مكة المكرمة', country: 'Saudi Arabia', countryAr: 'المملكة العربية السعودية', lat: 21.3891, lng: 39.8579, timezone: 'Asia/Riyadh' },
  { id: 'madinah', name: 'Medina', nameAr: 'المدينة المنورة', country: 'Saudi Arabia', countryAr: 'المملكة العربية السعودية', lat: 24.5247, lng: 39.5692, timezone: 'Asia/Riyadh' },
  { id: 'riyadh', name: 'Riyadh', nameAr: 'الرياض', country: 'Saudi Arabia', countryAr: 'المملكة العربية السعودية', lat: 24.7136, lng: 46.6753, timezone: 'Asia/Riyadh' },
  { id: 'jeddah', name: 'Jeddah', nameAr: 'جدة', country: 'Saudi Arabia', countryAr: 'المملكة العربية السعودية', lat: 21.5433, lng: 39.1728, timezone: 'Asia/Riyadh' },
  { id: 'jerusalem', name: 'Jerusalem', nameAr: 'القدس الشريف', country: 'Palestine', countryAr: 'فلسطين', lat: 31.7683, lng: 35.2137, timezone: 'Asia/Jerusalem' },
  { id: 'gaza', name: 'Gaza', nameAr: 'غزة', country: 'Palestine', countryAr: 'فلسطين', lat: 31.5017, lng: 34.4668, timezone: 'Asia/Gaza' },
  { id: 'dubai', name: 'Dubai', nameAr: 'دبي', country: 'UAE', countryAr: 'الإمارات', lat: 25.2048, lng: 55.2708, timezone: 'Asia/Dubai' },
  { id: 'abudhabi', name: 'Abu Dhabi', nameAr: 'أبو ظبي', country: 'UAE', countryAr: 'الإمارات', lat: 24.4539, lng: 54.3773, timezone: 'Asia/Dubai' },
  { id: 'doha', name: 'Doha', nameAr: 'الدوحة', country: 'Qatar', countryAr: 'قطر', lat: 25.2854, lng: 51.5310, timezone: 'Asia/Qatar' },
  { id: 'kuwait', name: 'Kuwait City', nameAr: 'مدينة الكويت', country: 'Kuwait', countryAr: 'الكويت', lat: 29.3759, lng: 47.9774, timezone: 'Asia/Kuwait' },
  { id: 'amman', name: 'Amman', nameAr: 'عمان', country: 'Jordan', countryAr: 'الأردن', lat: 31.9454, lng: 35.9284, timezone: 'Asia/Amman' },
  { id: 'baghdad', name: 'Baghdad', nameAr: 'بغداد', country: 'Iraq', countryAr: 'العراق', lat: 33.3152, lng: 44.3661, timezone: 'Asia/Baghdad' },
  { id: 'damascus', name: 'Damascus', nameAr: 'دمشق', country: 'Syria', countryAr: 'سوريا', lat: 33.5138, lng: 36.2765, timezone: 'Asia/Damascus' },
  { id: 'beirut', name: 'Beirut', nameAr: 'بيروت', country: 'Lebanon', countryAr: 'لبنان', lat: 33.8938, lng: 35.5018, timezone: 'Asia/Beirut' },
  { id: 'casablanca', name: 'Casablanca', nameAr: 'الدار البيضاء', country: 'Morocco', countryAr: 'المغرب', lat: 33.5731, lng: -7.5898, timezone: 'Africa/Casablanca' },
  { id: 'algiers', name: 'Algiers', nameAr: 'الجزائر', country: 'Algeria', countryAr: 'الجزائر', lat: 36.7538, lng: 3.0588, timezone: 'Africa/Algiers' },
  { id: 'tunis', name: 'Tunis', nameAr: 'تونس', country: 'Tunisia', countryAr: 'تونس', lat: 36.8065, lng: 10.1815, timezone: 'Africa/Tunis' },
  { id: 'istanbul', name: 'Istanbul', nameAr: 'إسطنبول', country: 'Turkey', countryAr: 'تركيا', lat: 41.0082, lng: 28.9784, timezone: 'Europe/Istanbul' },
  { id: 'london', name: 'London', nameAr: 'لندن', country: 'United Kingdom', countryAr: 'المملكة المتحدة', lat: 51.5074, lng: -0.1278, timezone: 'Europe/London' },
  { id: 'paris', name: 'Paris', nameAr: 'باريس', country: 'France', countryAr: 'فرنسا', lat: 48.8566, lng: 2.3522, timezone: 'Europe/Paris' },
  { id: 'newyork', name: 'New York', nameAr: 'نيويورك', country: 'USA', countryAr: 'الولايات المتحدة', lat: 40.7128, lng: -74.0060, timezone: 'America/New_York' },
  { id: 'jakarta', name: 'Jakarta', nameAr: 'جاكرتا', country: 'Indonesia', countryAr: 'إندونيسيا', lat: -6.2088, lng: 106.8456, timezone: 'Asia/Jakarta' },
  { id: 'kuala_lumpur', name: 'Kuala Lumpur', nameAr: 'كوالالمبور', country: 'Malaysia', countryAr: 'ماليزيا', lat: 3.1390, lng: 101.6869, timezone: 'Asia/Kuala_Lumpur' },
];

export const CALCULATION_METHODS_LIST: CalcMethodType[] = [
  { id: 'egypt', name: 'Egyptian General Authority of Survey', nameAr: 'الهيئة المصرية العامة للمساحة' },
  { id: 'umm_alqura', name: 'Umm al-Qura - Makkah', nameAr: 'أم القرى - مكة المكرمة' },
  { id: 'mwl', name: 'Muslim World League', nameAr: 'رابطة العالم الإسلامي' },
  { id: 'isna', name: 'Islamic Society of North America (ISNA)', nameAr: 'الجمعية الإسلامية لشمال أمريكا (ISNA)' },
  { id: 'turkey', name: 'Presidency of Religious Affairs (Diyanet)', nameAr: 'رئاسة الشؤون الدينية التركية (Diyanet)' },
  { id: 'karachi', name: 'University of Islamic Sciences, Karachi', nameAr: 'جامعة العلوم الإسلامية بكراتشي' },
  { id: 'dubai', name: 'UAE / Dubai', nameAr: 'دبي والإمارات' },
  { id: 'qatar', name: 'Qatar', nameAr: 'قطر' },
  { id: 'kuwait', name: 'Kuwait', nameAr: 'الكويت' },
];

function getCalculationParams(methodId: CalculationMethodId): CalculationParameters {
  switch (methodId) {
    case 'egypt':
      return CalculationMethod.Egyptian();
    case 'umm_alqura':
      return CalculationMethod.UmmAlQura();
    case 'mwl':
      return CalculationMethod.MuslimWorldLeague();
    case 'isna':
      return CalculationMethod.NorthAmerica();
    case 'turkey':
      // Diyanet uses 18 deg Fajr and 17 deg Isha
      return CalculationMethod.Other();
    case 'karachi':
      return CalculationMethod.Karachi();
    case 'dubai':
      return CalculationMethod.Dubai();
    case 'qatar':
      return CalculationMethod.Qatar();
    case 'kuwait':
      return CalculationMethod.Kuwait();
    default:
      return CalculationMethod.Egyptian();
  }
}

function formatPrayerTime(date: Date, timezone: string): string {
  try {
    return date.toLocaleTimeString('en-GB', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  }
}

export function calculatePrayerTimes(
  date: Date,
  lat: number,
  lng: number,
  timezone: string,
  methodId: CalculationMethodId = 'egypt',
  asrMethod: 'standard' | 'hanafi' = 'standard'
): PrayerTimeData {
  const coordinates = new Coordinates(lat, lng);
  const params = getCalculationParams(methodId);

  if (asrMethod === 'hanafi') {
    params.madhab = Madhab.Hanafi;
  } else {
    params.madhab = Madhab.Shafi;
  }

  const prayerTimes = new PrayerTimes(coordinates, date, params);

  const dateString = date.toLocaleDateString('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: timezone,
  });

  // Accurate Islamic Hijri formatter
  let hijriDate = '';
  try {
    const hijriFormatter = new Intl.DateTimeFormat('ar-EG-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: timezone,
    });
    hijriDate = hijriFormatter.format(date);
  } catch {
    hijriDate = 'التاريخ الهجري المبارك';
  }

  return {
    fajr: formatPrayerTime(prayerTimes.fajr, timezone),
    sunrise: formatPrayerTime(prayerTimes.sunrise, timezone),
    dhuhr: formatPrayerTime(prayerTimes.dhuhr, timezone),
    asr: formatPrayerTime(prayerTimes.asr, timezone),
    maghrib: formatPrayerTime(prayerTimes.maghrib, timezone),
    isha: formatPrayerTime(prayerTimes.isha, timezone),
    dateString,
    hijriDate,
  };
}

// Qibla direction calculation from given lat/lng to Kaaba (21.3891 N, 39.8579 E)
export function calculateQiblaDirection(lat: number, lng: number): number {
  const kaabaLat = 21.3891;
  const kaabaLng = 39.8579;

  const phi1 = (lat * Math.PI) / 180;
  const phi2 = (kaabaLat * Math.PI) / 180;
  const deltaLambda = ((kaabaLng - lng) * Math.PI) / 180;

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);

  let qibla = (Math.atan2(y, x) * 180) / Math.PI;
  return (qibla + 360) % 360;
}

/**
 * Calculates the Islamic division of the night between Maghrib and next Fajr
 * Total night duration = Next Fajr time - Maghrib time (spans across midnight)
 * Islamic Midnight = Maghrib + (Total Night / 2)
 * Last Third of the Night begins at: Next Fajr - (Total Night / 3)
 */
export function calculateNightThirds(
  maghribStr: string,
  fajrStr: string,
  now: Date = new Date(),
  mode: 'astronomical' | 'before_fajr' | 'custom' = 'astronomical',
  customTimeStr: string = '03:00',
  beforeFajrMinutes: number = 30
): NightThirdsInfo {
  const formatMinsToHHMM = (mins: number) => {
    const wrapped = ((Math.round(mins) % (24 * 60)) + 24 * 60) % (24 * 60);
    const h = Math.floor(wrapped / 60);
    const m = wrapped % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const [mH, mM] = (maghribStr || '18:00').split(':').map(Number);
  const [fH, fM] = (fajrStr || '05:00').split(':').map(Number);

  const maghribMins = mH * 60 + mM;
  let fajrMins = fH * 60 + fM;
  if (fajrMins <= maghribMins) {
    fajrMins += 24 * 60;
  }

  const totalNightMinutes = fajrMins - maghribMins;
  const oneThirdMinutes = Math.round(totalNightMinutes / 3);
  const astronomicalLastThirdMins = fajrMins - oneThirdMinutes;
  const midnightMins = maghribMins + Math.round(totalNightMinutes / 2);
  const firstThirdEndMins = maghribMins + oneThirdMinutes;

  let startMinsTotal = astronomicalLastThirdMins;

  if (mode === 'before_fajr') {
    startMinsTotal = fajrMins - Math.max(5, beforeFajrMinutes || 30);
  } else if (mode === 'custom' && customTimeStr) {
    const [cH, cM] = customTimeStr.split(':').map(Number);
    if (!isNaN(cH) && !isNaN(cM)) {
      let customMins = cH * 60 + cM;
      if (customMins < maghribMins) {
        customMins += 24 * 60;
      }
      startMinsTotal = customMins;
    }
  }

  const startTimeStr = formatMinsToHHMM(startMinsTotal);
  const astronomicalLastThirdStr = formatMinsToHHMM(astronomicalLastThirdMins);
  const midnightTimeStr = formatMinsToHHMM(midnightMins);
  const firstThirdEndStr = formatMinsToHHMM(firstThirdEndMins);

  const currentMinsOfDay = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  let currentNightMins = currentMinsOfDay;
  if (currentMinsOfDay < maghribMins && currentMinsOfDay <= fajrMins % (24 * 60)) {
    currentNightMins += 24 * 60;
  }

  const isNightTime = currentNightMins >= maghribMins && currentNightMins < fajrMins;
  const nightProgressPercent = isNightTime
    ? Math.min(100, Math.max(0, Math.round(((currentNightMins - maghribMins) / totalNightMinutes) * 1000) / 10))
    : 0;

  const isLastThirdNow = currentNightMins >= startMinsTotal && currentNightMins < fajrMins;

  let remainingSecondsToFajr = 0;
  if (currentNightMins < fajrMins) {
    remainingSecondsToFajr = Math.max(0, Math.floor((fajrMins - currentNightMins) * 60));
  } else {
    // Daytime before Maghrib: calculate countdown to next Fajr
    remainingSecondsToFajr = Math.max(0, Math.floor((fajrMins - currentNightMins) * 60));
  }

  const rH = Math.floor(remainingSecondsToFajr / 3600);
  const rM = Math.floor((remainingSecondsToFajr % 3600) / 60);
  const rS = remainingSecondsToFajr % 60;
  const formattedRemainingToFajr = `${rH.toString().padStart(2, '0')}:${rM.toString().padStart(2, '0')}:${rS.toString().padStart(2, '0')}`;

  return {
    isLastThirdNow,
    startTimeStr,
    astronomicalLastThirdStr,
    midnightTimeStr,
    firstThirdEndStr,
    maghribTimeStr: maghribStr,
    fajrTimeStr: fajrStr,
    remainingSecondsToFajr,
    totalNightMinutes,
    lastThirdMinutes: oneThirdMinutes,
    formattedRemainingToFajr,
    isNightTime,
    nightProgressPercent,
  };
}
