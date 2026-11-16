import { UserSettings } from '../types';
import {
  ALL_RUQYAH_CONTINUOUS_FILES,
  ALL_RUQYAH_DUA_LOCAL_FILES,
  RUQYAH_CONTINUOUS_TRACK_IDS,
} from './ruqyahData';

export const OFFLINE_AUDIO_CACHE_NAME = 'almawaqeet-offline-audio-v1';

export const CORE_LOCAL_AUDIO_FILES: string[] = [
  // Adhans
  '/audio/adhan-makkah.mp3',
  '/audio/adhan-madinah.mp3',
  '/audio/adhan-egypt.mp3',
  '/audio/adhan-abdulbasit.mp3',
  '/audio/adhan-mishary.mp3',
  '/audio/adhan-dosari.mp3',
  '/audio/adhan-nasir.mp3',
  '/audio/adhan-minshawi.mp3',
  // Fajr Adhans
  '/audio/adhan-fajr-makkah.mp3',
  '/audio/adhan-fajr.mp3',
  '/audio/adhan-fajr-madinah.mp3',
  '/audio/adhan-fajr-abdulbasit.mp3',
  '/audio/adhan-fajr-dosari.mp3',
  '/audio/adhan-fajr-mishary.mp3',
  // Duas After Adhan
  '/audio/dua-shaarawy.mp3',
  '/audio/dua-alafasy.mp3',
  '/audio/dua-ghamdi.mp3',
  '/audio/dua-durayhim.mp3',
  '/audio/dua-after-adhan.mp3',
  // Adhkar (Full Wird + Individual Short Sheikh Clips)
  '/audio/adhkar-sabah-alafasy.mp3',
  '/audio/adhkar-masaa-alafasy.mp3',
  '/audio/adhkar-sabah-abbad.mp3',
  '/audio/adhkar-masaa-abbad.mp3',
  '/audio/adhkar-qatami.mp3',
  '/audio/adhkar-sabah.mp3',
  '/audio/adhkar-masaa.mp3',
  '/audio/adhkar/short/durayhim-75.mp3',
  '/audio/adhkar/short/durayhim-76.mp3',
  '/audio/adhkar/short/durayhim-77.mp3',
  '/audio/adhkar/short/durayhim-78.mp3',
  '/audio/adhkar/short/durayhim-79.mp3',
  '/audio/adhkar/short/durayhim-83.mp3',
  '/audio/adhkar/short/durayhim-87.mp3',
  '/audio/adhkar/short/durayhim-88.mp3',
  '/audio/adhkar/short/durayhim-91.mp3',
  '/audio/adhkar/short/durayhim-92.mp3',
  '/audio/adhkar/short/durayhim-94.mp3',
  '/audio/adhkar/short/durayhim-96.mp3',
  '/audio/adhkar/short/durayhim-97.mp3',
  '/audio/adhkar/short/durayhim-98.mp3',
  '/audio/adhkar/short/ghamdi-sayyid.mp3',
  '/audio/adhkar/short/ghamdi-kursi.mp3',
  '/audio/adhkar/short/ghamdi-muawwidhat.mp3',
  '/audio/adhkar/short/ghamdi-kaffarah.mp3',
  '/audio/adhkar/short/alafasy-yunus.mp3',
  '/audio/adhkar/short/dosari-yunus.mp3',
  '/audio/adhkar/short/muaiqly-yunus.mp3',
  '/audio/adhkar/short/ghamdi-yunus.mp3',
  '/audio/adhkar/short/alafasy-hasanah.mp3',
  '/audio/adhkar/short/dosari-hasanah.mp3',
  '/audio/adhkar/short/muaiqly-hasanah.mp3',
  '/audio/adhkar/short/ghamdi-hasanah.mp3',
  '/audio/adhkar/short/durayhim-123.mp3',
  '/audio/adhkar/short/durayhim-254.mp3',
  // Salawat
  '/audio/salawat-mishary.mp3',
  '/audio/salawat-dosari.mp3',
  '/audio/salawat-muaiqly.mp3',
  '/audio/salawat-naqshabandi.mp3',
  '/audio/salawat-naqshabandi-radio.mp3',
  // Pre-Adhan Alerts
  '/audio/prayer-alert-mishary.mp3',
  '/audio/prayer-alert-dosari.mp3',
  '/audio/prayer-alert-muaiqly.mp3',
  '/audio/prayer-alert-minshawi.mp3',
  '/audio/prayer-alert-abdulbasit.mp3',
  '/audio/prayer-alert-qatami.mp3',
  // Iqama
  '/audio/iqama-basnawi.mp3',
  '/audio/iqama-hadrawi.mp3',
  '/audio/iqama-majed-abbas.mp3',
  '/audio/iqama-madinah.m4a',
  '/audio/iqama-faisal-labban.mp3',
  '/audio/iqama-classic.mp3',
];

export function getAllLocalAppAudioUrls(): string[] {
  return Array.from(
    new Set([
      ...ALL_RUQYAH_CONTINUOUS_FILES,
      ...ALL_RUQYAH_DUA_LOCAL_FILES,
      ...CORE_LOCAL_AUDIO_FILES,
    ])
  );
}

export function getEssentialStartupAudioUrls(settings?: Partial<UserSettings>): string[] {
  const urls: string[] = [
    ...ALL_RUQYAH_DUA_LOCAL_FILES,
    // Primary Alafasy continuous Ruqyah Quran tracks
    ...RUQYAH_CONTINUOUS_TRACK_IDS.map((id) => `/audio/ruqyah/continuous/alafasy/${id}.mp3`),
    // Essential prayers & alerts
    '/audio/adhan-makkah.mp3',
    '/audio/adhan-fajr-makkah.mp3',
    '/audio/dua-shaarawy.mp3',
    '/audio/dua-after-adhan.mp3',
    '/audio/iqama-basnawi.mp3',
    '/audio/iqama-classic.mp3',
    '/audio/prayer-alert-mishary.mp3',
    '/audio/salawat-mishary.mp3',
  ];

  if (settings?.adhanReciter) {
    urls.push(`/audio/adhan-${settings.adhanReciter}.mp3`);
  }
  if (settings?.fajrAdhanReciter) {
    const clean = settings.fajrAdhanReciter.replace(/^fajr_/, '');
    urls.push(`/audio/adhan-fajr-${clean}.mp3`);
  }
  if (settings?.duaAudioReciter) {
    if (settings.duaAudioReciter === 'alafasy_dua') urls.push('/audio/dua-alafasy.mp3');
    if (settings.duaAudioReciter === 'ghamdi_dua') urls.push('/audio/dua-ghamdi.mp3');
    if (settings.duaAudioReciter === 'durayhim_dua') urls.push('/audio/dua-durayhim.mp3');
  }
  if (settings?.adhkarReciter) {
    if (settings.adhkarReciter === 'alafasy_adhkar') {
      urls.push('/audio/adhkar-sabah-alafasy.mp3', '/audio/adhkar-masaa-alafasy.mp3');
    } else if (settings.adhkarReciter === 'abbad_adhkar') {
      urls.push('/audio/adhkar-sabah-abbad.mp3', '/audio/adhkar-masaa-abbad.mp3');
    } else if (settings.adhkarReciter === 'qatami_adhkar') {
      urls.push('/audio/adhkar-qatami.mp3');
    } else {
      urls.push('/audio/adhkar-sabah-alafasy.mp3', '/audio/adhkar-masaa-alafasy.mp3');
    }
  }

  return Array.from(new Set(urls));
}

const blobUrlMemoryCache = new Map<string, string>();
let autoPrecacheStarted = false;

export async function cacheAudioUrl(url: string): Promise<boolean> {
  if (typeof window === 'undefined' || !('caches' in window)) return false;
  try {
    const cache = await caches.open(OFFLINE_AUDIO_CACHE_NAME);
    const existing = await cache.match(url);
    if (existing) return true;
    const response = await fetch(url, { mode: url.startsWith('http') ? 'cors' : 'same-origin' });
    if (response.ok) {
      await cache.put(url, response.clone());
      return true;
    }
    return false;
  } catch {
    // Fallback for opaque cross-origin responses if needed
    try {
      if (url.startsWith('http')) {
        const cache = await caches.open(OFFLINE_AUDIO_CACHE_NAME);
        const res = await fetch(url, { mode: 'no-cors' });
        await cache.put(url, res);
        return true;
      }
    } catch {
      // ignore offline or blocked network errors
    }
    return false;
  }
}

export async function resolveCachedBlobUrl(url: string): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  const mem = blobUrlMemoryCache.get(url);
  if (mem) return mem;

  if (!('caches' in window)) return null;
  try {
    const cache = await caches.open(OFFLINE_AUDIO_CACHE_NAME);
    const match = (await cache.match(url)) || (await caches.match(url));
    if (!match) return null;
    if (match.type === 'opaque') {
      // Opaque cached responses are served directly via Service Worker fetch interception
      return null;
    }
    const blob = await match.blob();
    if (!blob || blob.size === 0) return null;
    const objUrl = URL.createObjectURL(blob);
    blobUrlMemoryCache.set(url, objUrl);
    return objUrl;
  } catch {
    return null;
  }
}

export async function resolvePlayableAudioUrl(url: string): Promise<string> {
  if (typeof window === 'undefined') return url;
  const cachedBlob = await resolveCachedBlobUrl(url);
  if (cachedBlob) {
    return cachedBlob;
  }
  if (navigator.onLine) {
    // Warm cache asynchronously in background without delaying playback
    void cacheAudioUrl(url);
  }
  return url;
}

export async function getOfflineCacheStats(): Promise<{ cachedCount: number; totalCount: number }> {
  const all = getAllLocalAppAudioUrls();
  if (typeof window === 'undefined' || !('caches' in window)) {
    return { cachedCount: 0, totalCount: all.length };
  }
  try {
    const cache = await caches.open(OFFLINE_AUDIO_CACHE_NAME);
    let cachedCount = 0;
    const keys = await cache.keys();
    const keySet = new Set(keys.map((k) => new URL(k.url).pathname));
    for (const url of all) {
      if (keySet.has(url)) cachedCount++;
    }
    return { cachedCount, totalCount: all.length };
  } catch {
    return { cachedCount: 0, totalCount: all.length };
  }
}

export function precacheEssentialAudioOnce(settings?: Partial<UserSettings>): void {
  if (typeof window === 'undefined' || autoPrecacheStarted) return;
  if (!navigator.onLine || !('caches' in window)) return;
  autoPrecacheStarted = true;

  const startWork = async () => {
    const essential = getEssentialStartupAudioUrls(settings);
    const batchSize = 3;
    for (let i = 0; i < essential.length; i += batchSize) {
      if (!navigator.onLine) break;
      const batch = essential.slice(i, i + batchSize);
      await Promise.all(batch.map((u) => cacheAudioUrl(u)));
    }
    window.dispatchEvent(new CustomEvent('offline_audio_cache_updated'));
  };

  setTimeout(() => {
    void startWork();
  }, 1800);
}

export async function downloadAllAudioForOffline(
  onProgress?: (done: number, total: number) => void
): Promise<{ cachedCount: number; totalCount: number }> {
  const all = getAllLocalAppAudioUrls();
  if (typeof window === 'undefined' || !('caches' in window)) {
    return { cachedCount: 0, totalCount: all.length };
  }

  let done = 0;
  const batchSize = 4;
  for (let i = 0; i < all.length; i += batchSize) {
    const batch = all.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (u) => {
        await cacheAudioUrl(u);
        done++;
        onProgress?.(done, all.length);
      })
    );
  }

  window.dispatchEvent(new CustomEvent('offline_audio_cache_updated'));
  return getOfflineCacheStats();
}
