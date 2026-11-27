import { Capacitor, registerPlugin } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { KeepAwake } from '@capacitor-community/keep-awake';

export type NativeShortcutRoute = 'times' | 'adhkar' | 'qibla' | 'wird';
export type NotificationMosqueTheme = 'auto' | 'nabawi' | 'kaaba' | 'azhar';

export interface NativeBackgroundReliabilityStatus {
  notificationsGranted: boolean;
  exactAlarmsGranted: boolean;
  fullScreenIntentGranted: boolean;
  batteryOptimizationIgnored: boolean;
  overlayGranted: boolean;
  sdkInt: number;
}

export interface NativeLaunchAction {
  route: string | null;
  adhanPrayerKey: string | null;
  adhanPrayerName: string | null;
  periodicReminderId: string | null;
}

interface WidgetBridgePluginInterface {
  syncWidgetData(options: { payload: string }): Promise<{
    synced: boolean;
    activeCount: number;
    notificationsGranted?: boolean;
  }>;
  getNotificationPermissionStatus(): Promise<{ granted: boolean; requiresPrompt: boolean }>;
  requestNotificationPermission(): Promise<{ granted: boolean }>;
  showTestPrayerNotification(options: { mosqueTheme?: NotificationMosqueTheme }): Promise<{
    shown: boolean;
    granted: boolean;
  }>;
  showSalawatNotificationNow(options: { sheikhNameAr?: string; formulaAr?: string }): Promise<{
    shown: boolean;
    granted: boolean;
  }>;
  showPreAdhanNotificationNow(options: {
    prayerNameAr?: string;
    reminderMinutes?: number;
    cityNameAr?: string;
    sheikhNameAr?: string;
  }): Promise<{
    shown: boolean;
    granted: boolean;
  }>;
  getBackgroundReliabilityStatus(): Promise<NativeBackgroundReliabilityStatus>;
  requestExactAlarmPermission(): Promise<{ opened: boolean; granted: boolean }>;
  requestFullScreenIntentPermission(): Promise<{ opened: boolean; granted: boolean }>;
  requestIgnoreBatteryOptimizations(): Promise<{ opened: boolean; ignored: boolean }>;
  requestOverlayPermission(): Promise<{ opened: boolean; granted: boolean }>;
  openAppDetailsSettings(): Promise<{ opened: boolean }>;
  testBackgroundAlarmNow(options: { type: 'adhan' | 'salawat' | 'periodic' }): Promise<{
    triggered: boolean;
  }>;
  requestPinWidget(options: {
    size: 'small' | 'medium' | 'large' | 'lock_pill' | 'arch';
  }): Promise<{
    supported: boolean;
    requested: boolean;
  }>;
  getNativeInteractiveState(): Promise<NativeWidgetInteractiveState>;
  getWidgetStatus(): Promise<{
    isSupported: boolean;
    pinSupported: boolean;
    activeCount: number;
  }>;
  consumeLaunchShortcut(): Promise<{ route: string | null }>;
  consumeLaunchAction(): Promise<NativeLaunchAction>;
}

export interface NativeWidgetInteractiveState {
  tasbihDateKey: string;
  tasbihCount: number;
  tasbihUpdatedAtMs: number;
  quietOverrideSet: boolean;
  quietOverrideActive: boolean;
  quietUpdatedAtMs: number;
}

const WidgetBridge = registerPlugin<WidgetBridgePluginInterface>('WidgetBridge');

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

export async function syncNativeAndroidWidgetData(
  payload: unknown
): Promise<{ synced: boolean; activeCount: number; notificationsGranted?: boolean }> {
  if (!isNativeAndroidApp()) {
    return { synced: false, activeCount: 0 };
  }
  try {
    return await WidgetBridge.syncWidgetData({ payload: JSON.stringify(payload) });
  } catch {
    return { synced: false, activeCount: 0 };
  }
}

export async function getNativeNotificationPermission(): Promise<{
  granted: boolean;
  requiresPrompt: boolean;
}> {
  if (!isNativeAndroidApp()) {
    return { granted: false, requiresPrompt: false };
  }
  try {
    return await WidgetBridge.getNotificationPermissionStatus();
  } catch {
    return { granted: false, requiresPrompt: false };
  }
}

export async function requestNativeNotificationPermission(): Promise<{ granted: boolean }> {
  if (!isNativeAndroidApp()) {
    return { granted: false };
  }
  try {
    return await WidgetBridge.requestNotificationPermission();
  } catch {
    return { granted: false };
  }
}

export async function sendNativeTestPrayerNotification(
  mosqueTheme: NotificationMosqueTheme = 'auto'
): Promise<{ shown: boolean; granted: boolean }> {
  if (!isNativeAndroidApp()) {
    return { shown: false, granted: false };
  }
  try {
    return await WidgetBridge.showTestPrayerNotification({ mosqueTheme });
  } catch {
    return { shown: false, granted: false };
  }
}

export async function sendNativeSalawatNotification(
  sheikhNameAr: string,
  formulaAr: string
): Promise<boolean> {
  if (!isNativeAndroidApp()) {
    return false;
  }
  try {
    const res = await WidgetBridge.showSalawatNotificationNow({ sheikhNameAr, formulaAr });
    return Boolean(res?.shown);
  } catch {
    return false;
  }
}

export async function sendNativePreAdhanNotification(params: {
  prayerNameAr: string;
  reminderMinutes: number;
  cityNameAr: string;
  sheikhNameAr?: string;
}): Promise<boolean> {
  if (!isNativeAndroidApp()) {
    return false;
  }
  try {
    const res = await WidgetBridge.showPreAdhanNotificationNow(params);
    return Boolean(res?.shown);
  } catch {
    return false;
  }
}

export async function requestPinNativeAndroidWidget(
  size: 'lock_pill' | 'small' | 'medium' | 'large' | 'arch'
): Promise<{ supported: boolean; requested: boolean }> {
  if (!isNativeAndroidApp()) {
    return { supported: false, requested: false };
  }
  try {
    return await WidgetBridge.requestPinWidget({ size });
  } catch {
    return { supported: false, requested: false };
  }
}

export async function getNativeWidgetInteractiveState(): Promise<NativeWidgetInteractiveState | null> {
  if (!isNativeAndroidApp()) {
    return null;
  }
  try {
    return await WidgetBridge.getNativeInteractiveState();
  } catch {
    return null;
  }
}

export async function getNativeAndroidWidgetStatus(): Promise<{
  isSupported: boolean;
  pinSupported: boolean;
  activeCount: number;
}> {
  if (!isNativeAndroidApp()) {
    return { isSupported: false, pinSupported: false, activeCount: 0 };
  }
  try {
    return await WidgetBridge.getWidgetStatus();
  } catch {
    return { isSupported: false, pinSupported: false, activeCount: 0 };
  }
}

export async function consumeNativeShortcutRoute(): Promise<NativeShortcutRoute | null> {
  if (!isNativeAndroidApp()) return null;
  try {
    const res = await WidgetBridge.consumeLaunchShortcut();
    const r = res?.route;
    if (r === 'times' || r === 'adhkar' || r === 'qibla' || r === 'wird') {
      return r;
    }
    return null;
  } catch {
    return null;
  }
}

export async function consumeNativeLaunchAction(): Promise<NativeLaunchAction | null> {
  if (!isNativeAndroidApp()) return null;
  try {
    return await WidgetBridge.consumeLaunchAction();
  } catch {
    return null;
  }
}

export async function getNativeBackgroundReliabilityStatus(): Promise<NativeBackgroundReliabilityStatus> {
  if (!isNativeAndroidApp()) {
    return {
      notificationsGranted: false,
      exactAlarmsGranted: false,
      fullScreenIntentGranted: false,
      batteryOptimizationIgnored: false,
      overlayGranted: false,
      sdkInt: 0,
    };
  }
  try {
    return await WidgetBridge.getBackgroundReliabilityStatus();
  } catch {
    return {
      notificationsGranted: false,
      exactAlarmsGranted: false,
      fullScreenIntentGranted: false,
      batteryOptimizationIgnored: false,
      overlayGranted: false,
      sdkInt: 0,
    };
  }
}

export async function requestNativeExactAlarmPermission(): Promise<{
  opened: boolean;
  granted: boolean;
}> {
  if (!isNativeAndroidApp()) return { opened: false, granted: false };
  try {
    return await WidgetBridge.requestExactAlarmPermission();
  } catch {
    return { opened: false, granted: false };
  }
}

export async function requestNativeFullScreenIntentPermission(): Promise<{
  opened: boolean;
  granted: boolean;
}> {
  if (!isNativeAndroidApp()) return { opened: false, granted: false };
  try {
    return await WidgetBridge.requestFullScreenIntentPermission();
  } catch {
    return { opened: false, granted: false };
  }
}

export async function requestNativeIgnoreBatteryOptimizations(): Promise<{
  opened: boolean;
  ignored: boolean;
}> {
  if (!isNativeAndroidApp()) return { opened: false, ignored: false };
  try {
    return await WidgetBridge.requestIgnoreBatteryOptimizations();
  } catch {
    return { opened: false, ignored: false };
  }
}

export async function requestNativeOverlayPermission(): Promise<{
  opened: boolean;
  granted: boolean;
}> {
  if (!isNativeAndroidApp()) return { opened: false, granted: false };
  try {
    return await WidgetBridge.requestOverlayPermission();
  } catch {
    return { opened: false, granted: false };
  }
}

export async function openNativeAppInfoSettings(): Promise<{ opened: boolean }> {
  if (!isNativeAndroidApp()) return { opened: false };
  try {
    return await WidgetBridge.openAppDetailsSettings();
  } catch {
    return { opened: false };
  }
}

export async function testNativeBackgroundAlarm(
  type: 'adhan' | 'salawat' | 'periodic'
): Promise<{ triggered: boolean }> {
  if (!isNativeAndroidApp()) return { triggered: false };
  try {
    return await WidgetBridge.testBackgroundAlarmNow({ type });
  } catch {
    return { triggered: false };
  }
}

export function subscribeNativeResume(onResume: () => void): () => void {
  if (!isNativeAndroidApp()) return () => {};
  let removed = false;
  let listenerHandle: { remove: () => Promise<void> } | null = null;

  void CapacitorApp.addListener('appStateChange', ({ isActive }) => {
    if (isActive) {
      onResume();
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
