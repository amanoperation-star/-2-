import { LiveBackground } from '../types';

export const LIVE_BACKGROUNDS: LiveBackground[] = [
  // --- خلفيات المساجد بالنهار (Daytime Mosques) ---
  {
    id: 'makkah_day',
    title: 'المسجد الحرام والكعبة المشرفة (نهاري مشرق)',
    subtitle: 'رحاب الكعبة المشرفة في وضح النهار وسماء مكة الزرقاء المشرقة.',
    type: 'image',
    period: 'day',
    imageUrl: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=2400&q=90',
    cssFallback: 'radial-gradient(circle at 50% 30%, #0284c7 0%, #0369a1 40%, #0f172a 90%)',
  },
  {
    id: 'madinah_day',
    title: 'المسجد النبوي الشريف والمظلات (نهاري مشرق)',
    subtitle: 'المظلات البيضاء العملاقة وساحات الحرم النبوي الشريف تحت شمس الصباح البهية.',
    type: 'image',
    period: 'day',
    imageUrl: 'https://images.unsplash.com/photo-1542816417-0983c9c9ad53?auto=format&fit=crop&w=2400&q=90',
    cssFallback: 'radial-gradient(circle at 50% 30%, #0891b2 0%, #0e7490 40%, #0f172a 90%)',
  },
  {
    id: 'sheikh_zayed_day',
    title: 'جامع الشيخ زايد بالرخام الأبيض (نهاري مشرق)',
    subtitle: 'أقواس وقباب المسجد بالرخام الأبيض الناصع تحت أشعة الشمس الذهبية.',
    type: 'image',
    period: 'day',
    imageUrl: 'https://images.unsplash.com/photo-1512632570417-a6032a715797?auto=format&fit=crop&w=2400&q=90',
    cssFallback: 'radial-gradient(circle at 50% 40%, #0284c7 0%, #0369a1 40%, #0f172a 90%)',
  },
  {
    id: 'blue_mosque_day',
    title: 'جامع ومآذن إسطنبول التاريخية (نهاري مشرق)',
    subtitle: 'المآذن والقباب العثمانية العريقة تحت سماء زرقاء صافية.',
    type: 'image',
    period: 'day',
    imageUrl: 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?auto=format&fit=crop&w=2400&q=90',
    cssFallback: 'radial-gradient(circle at 50% 30%, #1d4ed8 0%, #1e40af 40%, #0f172a 90%)',
  },
  {
    id: 'sultan_hassan_day',
    title: 'مسجد السلطان حسن والمآذن المملوكية (نهاري مشرق)',
    subtitle: 'إشراقة الشمس على مآذن وأحجار القاهرة التاريخية.',
    type: 'image',
    period: 'day',
    imageUrl: 'https://images.unsplash.com/photo-1564769625905-50e93615e769?auto=format&fit=crop&w=2400&q=90',
    cssFallback: 'radial-gradient(circle at 50% 30%, #ca8a04 0%, #854d0e 40%, #0f172a 90%)',
  },

  // --- خلفيات المساجد بالليل (Nighttime Mosques) ---
  {
    id: 'makkah_night',
    title: 'المسجد الحرام والكعبة المشرفة (ليلي مهيب)',
    subtitle: 'أنوار الحرم المكي الشريف الليلية الساحرة وأضواء الكعبة المشرفة في عتمة الليل.',
    type: 'image',
    period: 'night',
    imageUrl: 'https://images.unsplash.com/photo-1565552645632-d725f8bfc19a?auto=format&fit=crop&w=2400&q=90',
    cssFallback: 'radial-gradient(circle at 50% 30%, #064e3b 0%, #022c22 45%, #020617 90%)',
  },
  {
    id: 'madinah_night',
    title: 'المسجد النبوي والقبة الخضراء (ليلي هادئ)',
    subtitle: 'إضاءة المسجد النبوي الشريف الليلية والمآذن الشامخة في سماء المدينة المنورة.',
    type: 'image',
    period: 'night',
    imageUrl: 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=2400&q=90',
    cssFallback: 'radial-gradient(circle at 60% 40%, #1e1b4b 0%, #0f172a 50%, #020617 95%)',
  },
  {
    id: 'aqsa_dome_night',
    title: 'المسجد الأقصى وقبة الصخرة المشرفة (ليلي ذهبي)',
    subtitle: 'القبة الذهبية البهية للمسجد الأقصى المبارك متلألئة في ليل القدس الشريف.',
    type: 'image',
    period: 'night',
    imageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=2400&q=90',
    cssFallback: 'radial-gradient(circle at 50% 40%, #134e4a 0%, #064e3b 40%, #020617 90%)',
  },
  {
    id: 'crescent_night',
    title: 'هلال الشهر المبارك والمآذن الذهبية (ليلي)',
    subtitle: 'مشهد ليلي هادئ للمسجد ومآذنه تحت هلال الشهر المبارك ونجوم السماء.',
    type: 'image',
    period: 'night',
    imageUrl: 'https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&w=2400&q=90',
    cssFallback: 'radial-gradient(circle at 50% 20%, #312e81 0%, #0f172a 60%, #020617 100%)',
  },

  // --- خلفيات متحركة (Live Videos) ---
  {
    id: 'makkah_live',
    title: 'فيديو متحرك (Live) - المسجد الحرام وسماء مكة',
    subtitle: 'مشهد حي متحرك للغيوم وأضواء الحرم المكي الشريف.',
    type: 'video',
    period: 'both',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-clouds-and-blue-sky-2408-large.mp4',
    imageUrl: 'https://images.unsplash.com/photo-1542816417-0983c9c9ad53?auto=format&fit=crop&w=1920&q=80',
    cssFallback: 'radial-gradient(circle at 50% 30%, #064e3b 0%, #022c22 45%, #020617 90%)',
  },
  {
    id: 'madinah_live',
    title: 'فيديو متحرك (Live) - سماء وغروب المدينة المنورة',
    subtitle: 'مشهد متحرك لغروب الشمس فوق قبة ومآذن المسجد النبوي.',
    type: 'video',
    period: 'both',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-time-lapse-of-clouds-at-sunset-sunset-1090-large.mp4',
    imageUrl: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=1920&q=80',
    cssFallback: 'radial-gradient(circle at 60% 40%, #1e1b4b 0%, #0f172a 50%, #020617 95%)',
  },
];

// Helper to determine if a prayer key belongs to daytime or nighttime
export function isDaytimePrayer(prayerKey: string): boolean {
  return prayerKey === 'dhuhr' || prayerKey === 'asr' || prayerKey === 'sunrise';
}

// Helper to determine current real-world daytime based on prayer times
export function isCurrentTimeDay(prayerTimes?: { sunrise: string; maghrib: string }): boolean {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  if (prayerTimes && prayerTimes.sunrise && prayerTimes.maghrib) {
    const [sH, sM] = prayerTimes.sunrise.split(':').map(Number);
    const [mH, mM] = prayerTimes.maghrib.split(':').map(Number);
    const sunriseMin = sH * 60 + sM;
    const maghribMin = mH * 60 + mM;
    return currentMinutes >= sunriseMin && currentMinutes < maghribMin;
  }

  // Fallback: roughly 6:00 AM to 6:00 PM
  return currentMinutes >= 6 * 60 && currentMinutes < 18 * 60;
}

// Smart Background Resolver
export function getSmartBackground(
  activeId: string,
  autoDayNight: boolean,
  isDaytime: boolean
): LiveBackground {
  if (autoDayNight || activeId === 'auto_day_night') {
    if (isDaytime) {
      return LIVE_BACKGROUNDS.find((b) => b.id === 'makkah_day') || LIVE_BACKGROUNDS[0];
    } else {
      return LIVE_BACKGROUNDS.find((b) => b.id === 'makkah_night') || LIVE_BACKGROUNDS[5];
    }
  }

  return (
    LIVE_BACKGROUNDS.find((b) => b.id === activeId) ||
    (isDaytime ? LIVE_BACKGROUNDS[0] : LIVE_BACKGROUNDS[5])
  );
}
