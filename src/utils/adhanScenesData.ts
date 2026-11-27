import makkahHaramImg from '../assets/images/adhan_makkah_haram_1795705254443.jpg';
import madinahNabawiImg from '../assets/images/adhan_madinah_nabawi_1795705254283.jpg';
import aqsaQudsImg from '../assets/images/adhan_aqsa_quds_1795705255663.jpg';
import azharCairoImg from '../assets/images/adhan_azhar_cairo_1795705255105.jpg';
import zayedIstanbulImg from '../assets/images/adhan_zayed_istanbul_1795705255830.jpg';
import husseinCairoImg from '../assets/images/mosque_hussein_cairo_1795814383755.jpg';
import qatarDohaImg from '../assets/images/mosque_qatar_doha_1795814384029.jpg';
import { PrayerName } from '../types';

export type AdhanMosqueSceneId =
  | 'makkah_haram'
  | 'madinah_nabawi'
  | 'aqsa_quds'
  | 'azhar_cairo'
  | 'zayed_istanbul';

export type HeroMosqueSceneId =
  | 'kaaba'
  | 'madinah'
  | 'azhar'
  | 'hussein'
  | 'uae'
  | 'qatar';

export interface HeroMosqueBackdrop {
  id: HeroMosqueSceneId;
  imageUrl: string;
  cameraClass: AdhanCameraPreset;
  cssFallback: string;
}

export const HERO_MOSQUE_BACKDROPS: HeroMosqueBackdrop[] = [
  {
    id: 'kaaba',
    imageUrl: makkahHaramImg,
    cameraClass: 'adhan-pan-zoom',
    cssFallback: 'radial-gradient(circle at 50% 45%, #0a3628 0%, #04120D 90%)',
  },
  {
    id: 'madinah',
    imageUrl: madinahNabawiImg,
    cameraClass: 'adhan-pan-left',
    cssFallback: 'radial-gradient(circle at 50% 45%, #0a3b2c 0%, #04120D 90%)',
  },
  {
    id: 'azhar',
    imageUrl: azharCairoImg,
    cameraClass: 'adhan-drift-arc',
    cssFallback: 'radial-gradient(circle at 50% 45%, #1c2c20 0%, #04120D 90%)',
  },
  {
    id: 'hussein',
    imageUrl: husseinCairoImg,
    cameraClass: 'adhan-pan-right',
    cssFallback: 'radial-gradient(circle at 50% 45%, #182722 0%, #04120D 90%)',
  },
  {
    id: 'uae',
    imageUrl: zayedIstanbulImg,
    cameraClass: 'adhan-rise-glow',
    cssFallback: 'radial-gradient(circle at 50% 45%, #0c2c26 0%, #04120D 90%)',
  },
  {
    id: 'qatar',
    imageUrl: qatarDohaImg,
    cameraClass: 'adhan-pan-zoom',
    cssFallback: 'radial-gradient(circle at 50% 45%, #122620 0%, #04120D 90%)',
  },
];

export type AdhanMotionStyle = 'hybrid' | 'video' | 'cinematic';

export type AdhanCameraPreset =
  | 'adhan-pan-zoom'
  | 'adhan-pan-left'
  | 'adhan-pan-right'
  | 'adhan-drift-arc'
  | 'adhan-rise-glow';

export interface AdhanMosqueScene {
  id: AdhanMosqueSceneId;
  nameAr: string;
  shortNameAr: string;
  locationAr: string;
  period: 'day' | 'night' | 'both';
  imageUrl: string;
  videoUrl: string;
  cameraClass: AdhanCameraPreset;
  auraGradient: string;
  cssFallback: string;
}

export const ADHAN_MOSQUE_SCENES: AdhanMosqueScene[] = [
  {
    id: 'makkah_haram',
    nameAr: 'المسجد الحرام والكعبة المشرفة',
    shortNameAr: 'المسجد الحرام',
    locationAr: 'مكة المكرمة',
    period: 'both',
    imageUrl: makkahHaramImg,
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-clouds-and-blue-sky-2408-large.mp4',
    cameraClass: 'adhan-pan-zoom',
    auraGradient: 'radial-gradient(ellipse at 50% 30%, rgba(212, 175, 55, 0.24) 0%, rgba(52, 211, 153, 0.12) 45%, transparent 75%)',
    cssFallback: 'radial-gradient(circle at 50% 35%, #064e3b 0%, #022c22 45%, #020814 92%)',
  },
  {
    id: 'madinah_nabawi',
    nameAr: 'المسجد النبوي الشريف والقبة الخضراء',
    shortNameAr: 'المسجد النبوي',
    locationAr: 'المدينة المنورة',
    period: 'both',
    imageUrl: madinahNabawiImg,
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-time-lapse-of-clouds-at-sunset-sunset-1090-large.mp4',
    cameraClass: 'adhan-pan-left',
    auraGradient: 'radial-gradient(ellipse at 55% 35%, rgba(52, 211, 153, 0.25) 0%, rgba(243, 208, 120, 0.14) 48%, transparent 78%)',
    cssFallback: 'radial-gradient(circle at 50% 40%, #065f46 0%, #064e3b 45%, #020814 92%)',
  },
  {
    id: 'aqsa_quds',
    nameAr: 'المسجد الأقصى المبارك وقبة الصخرة',
    shortNameAr: 'المسجد الأقصى',
    locationAr: 'القدس الشريف',
    period: 'both',
    imageUrl: aqsaQudsImg,
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-time-lapse-of-clouds-at-sunset-sunset-1090-large.mp4',
    cameraClass: 'adhan-pan-right',
    auraGradient: 'radial-gradient(ellipse at 52% 32%, rgba(245, 158, 11, 0.26) 0%, rgba(212, 175, 55, 0.14) 48%, transparent 78%)',
    cssFallback: 'radial-gradient(circle at 50% 35%, #78350f 0%, #451a03 45%, #020814 92%)',
  },
  {
    id: 'azhar_cairo',
    nameAr: 'الجامع الأزهر ومساجد القاهرة التاريخية',
    shortNameAr: 'الجامع الأزهر',
    locationAr: 'القاهرة، مصر',
    period: 'day',
    imageUrl: azharCairoImg,
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-clouds-and-blue-sky-2408-large.mp4',
    cameraClass: 'adhan-drift-arc',
    auraGradient: 'radial-gradient(ellipse at 48% 28%, rgba(229, 184, 105, 0.25) 0%, rgba(16, 185, 129, 0.10) 50%, transparent 78%)',
    cssFallback: 'radial-gradient(circle at 50% 30%, #854d0e 0%, #422006 45%, #020814 92%)',
  },
  {
    id: 'zayed_istanbul',
    nameAr: 'جامع الشيخ زايد والمآذن التاريخية',
    shortNameAr: 'جامع الشيخ زايد',
    locationAr: 'أبوظبي · إسطنبول',
    period: 'night',
    imageUrl: zayedIstanbulImg,
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-clouds-and-blue-sky-2408-large.mp4',
    cameraClass: 'adhan-rise-glow',
    auraGradient: 'radial-gradient(ellipse at 50% 38%, rgba(52, 211, 153, 0.28) 0%, rgba(212, 175, 55, 0.12) 48%, transparent 78%)',
    cssFallback: 'radial-gradient(circle at 50% 35%, #0f172a 0%, #042f2e 45%, #020617 95%)',
  },
];

export const DEFAULT_ENABLED_ADHAN_MOSQUES: AdhanMosqueSceneId[] = ADHAN_MOSQUE_SCENES.map((s) => s.id);

const PRAYER_LEAD_MOSQUE: Record<PrayerName, AdhanMosqueSceneId> = {
  fajr: 'madinah_nabawi',
  sunrise: 'madinah_nabawi',
  dhuhr: 'makkah_haram',
  asr: 'azhar_cairo',
  maghrib: 'aqsa_quds',
  isha: 'zayed_istanbul',
};

export function getOrderedAdhanScenes(
  prayerKey: PrayerName,
  enabledIds?: string[]
): AdhanMosqueScene[] {
  const validSet = new Set(
    (enabledIds && enabledIds.length > 0 ? enabledIds : DEFAULT_ENABLED_ADHAN_MOSQUES).filter((id) =>
      ADHAN_MOSQUE_SCENES.some((s) => s.id === id)
    )
  );
  const filtered =
    validSet.size > 0
      ? ADHAN_MOSQUE_SCENES.filter((scene) => validSet.has(scene.id))
      : ADHAN_MOSQUE_SCENES;

  const preferredLeadId = PRAYER_LEAD_MOSQUE[prayerKey] || 'makkah_haram';
  const leadIdx = filtered.findIndex((s) => s.id === preferredLeadId);
  if (leadIdx <= 0) {
    return filtered;
  }
  return [...filtered.slice(leadIdx), ...filtered.slice(0, leadIdx)];
}
