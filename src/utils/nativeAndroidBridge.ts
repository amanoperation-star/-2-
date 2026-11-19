import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { KeepAwake } from '@capacitor-community/keep-awake';

export function isNativeCapacitorApp(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

export function isNativeAndroidApp(): boolean {
  if (!isNativeCapacitorApp()) return false;
  try {
    return Capacitor.getPlatform() === 'android';
  } catch {
    return false;
  }
}

export function isLikelyAndroidTvDevice(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = (navigator.userAgent || '').toLowerCase();
  const tvKeywords = [
    'android tv',
    'googletv',
    'google tv',
    'aftb',
    'aftt',
    'aftm',
    'afts',
    'bravia',
    'mibox',
    'shield',
    'smarttv',
    'smart-tv',
    'tizen',
    'webos',
    'mitv',
    'tcl',
    'hisense',
  ];
  if (tvKeywords.some((k) => ua.includes(k))) return true;

  // Fallback heuristic: very wide screen without fine pointer or without touch
  const noTouchOrCoarse =
    window.matchMedia?.('(pointer: none)')?.matches ||
    (window.innerWidth >= 1280 &&
      typeof navigator !== 'undefined' &&
      (navigator.maxTouchPoints ?? 0) === 0);
  return Boolean(noTouchOrCoarse && isNativeAndroidApp());
}

export async function setNativeKeepAwake(enabled: boolean): Promise<boolean> {
  if (!isNativeCapacitorApp()) return false;
  try {
    if (enabled) {
      await KeepAwake.keepAwake();
    } else {
      await KeepAwake.allowSleep();
    }
    return true;
  } catch (err) {
    console.warn('Native KeepAwake call failed:', err);
    return false;
  }
}

export function subscribeNativeBackButton(onBackPress: () => boolean): () => void {
  if (!isNativeAndroidApp()) return () => {};
  let removed = false;
  let listenerHandle: { remove: () => Promise<void> } | null = null;

  void CapacitorApp.addListener('backButton', ({ canGoBack }) => {
    const handledByUi = onBackPress();
    if (handledByUi) return;
    if (canGoBack) {
      window.history.back();
    } else {
      void CapacitorApp.minimizeApp().catch(() => {
        void CapacitorApp.exitApp();
      });
    }
  }).then((handle) => {
    if (removed) {
      void handle.remove();
    } else {
      listenerHandle = handle;
    }
  });

  return () => {
    removed = true;
    if (listenerHandle) {
      void listenerHandle.remove();
    }
  };
}
