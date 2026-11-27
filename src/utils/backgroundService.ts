// Service for Screen Wake Lock API and Browser Web Notifications
import {
  isNativeAndroidApp,
  sendNativePreAdhanNotification,
  sendNativeSalawatNotification,
  setNativeKeepAwake,
} from './nativeAndroidBridge';

class BackgroundService {
  private wakeLockSentinel: any = null;
  private isWakeLockActive: boolean = false;
  private desiredWakeLock: boolean = false;
  private notifiedPrayers: Set<string> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          if (this.isWakeLockActive) {
            this.isWakeLockActive = false;
            this.emitWakeLockChange();
          }
        } else if (document.visibilityState === 'visible' && this.desiredWakeLock) {
          void this.requestWakeLock();
        }
      });
    }
  }

  private emitWakeLockChange(): void {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(
      new CustomEvent('wake_lock_state_changed', {
        detail: { active: this.isWakeLockActive },
      })
    );
  }

  // Request Screen Wake Lock (keeps display active on smart TV or mobile)
  public async requestWakeLock(): Promise<boolean> {
    this.desiredWakeLock = true;
    const nativeApplied = await setNativeKeepAwake(true);
    try {
      if ('wakeLock' in navigator && (navigator as any).wakeLock) {
        this.wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
        this.isWakeLockActive = document.visibilityState === 'visible';
        this.wakeLockSentinel.addEventListener('release', () => {
          this.isWakeLockActive = false;
          this.emitWakeLockChange();
        });
        this.emitWakeLockChange();
        return this.isWakeLockActive;
      }
    } catch (err) {
      console.warn('Wake Lock request fallback:', err);
    }

    // Fallback when Wake Lock API is restricted by browser/iframe policy or handled natively
    this.isWakeLockActive =
      nativeApplied ||
      (typeof document !== 'undefined' ? document.visibilityState === 'visible' : true);
    this.emitWakeLockChange();
    return this.isWakeLockActive;
  }

  // Release wake lock
  public async releaseWakeLock(): Promise<void> {
    this.desiredWakeLock = false;
    await setNativeKeepAwake(false);
    try {
      if (this.wakeLockSentinel) {
        await this.wakeLockSentinel.release();
        this.wakeLockSentinel = null;
      }
    } catch (err) {
      console.warn('Wake Lock release error:', err);
    } finally {
      this.isWakeLockActive = false;
      this.emitWakeLockChange();
    }
  }

  public getIsWakeLockActive(): boolean {
    return this.isWakeLockActive;
  }

  // Request Web Notification permission
  public async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  public getNotificationPermission(): NotificationPermission | 'unsupported' {
    if (!('Notification' in window)) return 'unsupported';
    return Notification.permission;
  }

  public getMosqueNotificationAsset(
    theme: 'auto' | 'nabawi' | 'kaaba' | 'azhar' = 'auto',
    prayerKey: string = 'dhuhr'
  ): { imageUrl: string; titleAr: string } {
    if (theme === 'kaaba') {
      return { imageUrl: '/assets/mosques/kaaba.jpg', titleAr: 'الكعبة المشرفة · المسجد الحرام' };
    }
    if (theme === 'nabawi') {
      return { imageUrl: '/assets/mosques/nabawi.jpg', titleAr: 'المسجد النبوي الشريف' };
    }
    if (theme === 'azhar') {
      return { imageUrl: '/assets/mosques/azhar.jpg', titleAr: 'الجامع الأزهر الشريف' };
    }
    if (prayerKey === 'dhuhr' || prayerKey === 'sunrise') {
      return { imageUrl: '/assets/mosques/azhar.jpg', titleAr: 'الجامع الأزهر الشريف' };
    }
    if (prayerKey === 'asr' || prayerKey === 'isha') {
      return { imageUrl: '/assets/mosques/nabawi.jpg', titleAr: 'المسجد النبوي الشريف' };
    }
    return { imageUrl: '/assets/mosques/kaaba.jpg', titleAr: 'الكعبة المشرفة · المسجد الحرام' };
  }

  // Send Prayer notification with bundled mosque artwork and sound trigger
  public sendPrayerNotification(
    prayerNameAr: string,
    cityName: string,
    mosqueTheme: 'auto' | 'nabawi' | 'kaaba' | 'azhar' = 'auto',
    prayerKey: string = 'dhuhr',
    forceTest: boolean = false
  ): void {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    const todayStr = new Date().toDateString();
    const notificationKey = `${todayStr}-${prayerNameAr}`;

    if (!forceTest && this.notifiedPrayers.has(notificationKey)) {
      return; // Already notified today
    }

    if (!forceTest) {
      this.notifiedPrayers.add(notificationKey);
    }

    const mosque = this.getMosqueNotificationAsset(mosqueTheme, prayerKey);
    const title = forceTest
      ? `معاينة إشعار الصلاة: ${prayerNameAr}`
      : prayerNameAr.startsWith('حان') ||
          prayerNameAr.startsWith('اقتراب') ||
          prayerNameAr.startsWith('قد قامت') ||
          prayerNameAr.startsWith('تنبيه') ||
          prayerNameAr.startsWith('تذكير') ||
          prayerNameAr.startsWith('موعد')
        ? prayerNameAr
        : `حان الآن موعد أذان ${prayerNameAr}`;
    const tag = forceTest ? `adhan-test-${Date.now()}` : `adhan-${prayerKey}-${prayerNameAr}`;
    const options: NotificationOptions & { image?: string; renotify?: boolean } = {
      body: `${cityName} · ${mosque.titleAr}`,
      icon: mosque.imageUrl,
      image: mosque.imageUrl,
      badge: '/pwa-192x192.png',
      tag,
      renotify: true,
      dir: 'rtl',
      lang: 'ar',
      requireInteraction: true,
    };

    try {
      if ('serviceWorker' in navigator) {
        void navigator.serviceWorker
          .getRegistration()
          .then((reg) => {
            if (reg && typeof reg.showNotification === 'function') {
              return reg.showNotification(title, options);
            }
            new Notification(title, options);
            return undefined;
          })
          .catch(() => {
            try {
              new Notification(title, options);
            } catch {
              // ignore browser notification restriction
            }
          });
        return;
      }

      new Notification(title, options);
    } catch (err) {
      console.warn('Failed to display Notification:', err);
    }
  }

  // Send Interactive Post-Prayer Check-in Notification via Service Worker (with quick actions)
  public async sendPostPrayerCheckinNotification(params: {
    prayerKey: string;
    prayerNameAr: string;
    dateKey: string;
    isTest?: boolean;
  }): Promise<boolean> {
    if (
      typeof window === 'undefined' ||
      !('Notification' in window) ||
      Notification.permission !== 'granted'
    ) {
      return false;
    }

    const title = `🕌 تقبّل الله صلاة ${params.prayerNameAr} — هل أتممت وردك؟`;
    const body = 'اختر إجراءً سريعاً لتثبيت صلاتك وأذكارك اليومية في سجل الاستقامة';
    const tag = params.isTest
      ? `post-prayer-test-${Date.now()}`
      : `post-prayer-${params.dateKey}-${params.prayerKey}`;

    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg && typeof reg.showNotification === 'function') {
          await reg.showNotification(title, {
            body,
            icon: '/pwa-192x192.png',
            badge: '/pwa-192x192.png',
            tag,
            dir: 'rtl',
            lang: 'ar',
            requireInteraction: true,
            data: {
              prayerKey: params.prayerKey,
              prayerNameAr: params.prayerNameAr,
              dateKey: params.dateKey,
            },
            actions: [
              {
                action: 'complete_all',
                title: '✅ أتممت الصلاة والأذكار',
              },
              {
                action: 'open_details',
                title: '📋 تسجيل التفاصيل / الوِرد',
              },
            ],
          } as NotificationOptions & {
            actions: Array<{ action: string; title: string }>;
          });
          return true;
        }
      }

      new Notification(title, {
        body,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag,
        dir: 'rtl',
        lang: 'ar',
      });
      return true;
    } catch (err) {
      console.warn('Failed to display interactive post-prayer notification:', err);
      return false;
    }
  }

  // Send Salawat upon the Prophet (ﷺ) notification across Native Android, PWA SW, and Desktop browsers
  public async sendSalawatNotification(
    sheikhNameAr: string,
    formulaAr: string,
    options?: { isTest?: boolean; requestPermissionOnTest?: boolean }
  ): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    if (isNativeAndroidApp()) {
      return await sendNativeSalawatNotification(sheikhNameAr, formulaAr);
    }

    if (!('Notification' in window)) {
      return false;
    }

    if (options?.requestPermissionOnTest && Notification.permission === 'default') {
      await this.requestNotificationPermission();
    }

    if (Notification.permission !== 'granted') {
      return false;
    }

    const title = 'ﷺ صلِّ على سيدنا محمد';
    const body = `${sheikhNameAr} · ${formulaAr}`;
    const tag = options?.isTest ? `mihrab-salawat-test-${Date.now()}` : 'mihrab-salawat-reminder';

    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg && typeof reg.showNotification === 'function') {
          await reg.showNotification(title, {
            body,
            icon: '/pwa-192x192.png',
            badge: '/pwa-192x192.png',
            tag,
            renotify: true,
            dir: 'rtl',
            lang: 'ar',
            data: { route: 'times', type: 'salawat' },
          } as NotificationOptions & { renotify?: boolean });
          return true;
        }
      }

      new Notification(title, {
        body,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag,
        renotify: true,
        dir: 'rtl',
        lang: 'ar',
      } as NotificationOptions & { renotify?: boolean });
      return true;
    } catch {
      return false;
    }
  }

  // Send Pre-Adhan preparation notification across Native Android, PWA SW, and Desktop browsers
  public async sendPreAdhanNotification(params: {
    prayerKey: string;
    prayerNameAr: string;
    reminderMinutes: number;
    cityNameAr: string;
    sheikhNameAr?: string;
    mosqueTheme?: 'auto' | 'nabawi' | 'kaaba' | 'azhar';
    isMeetingMode?: boolean;
    isTest?: boolean;
    requestPermissionOnTest?: boolean;
  }): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    const sheikhLabel = params.isMeetingMode
      ? 'وضع الاجتماع الصامت'
      : params.sheikhNameAr || '';

    if (isNativeAndroidApp()) {
      return await sendNativePreAdhanNotification({
        prayerNameAr: params.prayerNameAr,
        reminderMinutes: params.reminderMinutes,
        cityNameAr: params.cityNameAr,
        sheikhNameAr: sheikhLabel,
      });
    }

    if (!('Notification' in window)) {
      return false;
    }

    if (params.requestPermissionOnTest && Notification.permission === 'default') {
      await this.requestNotificationPermission();
    }

    if (Notification.permission !== 'granted') {
      return false;
    }

    const mosque = this.getMosqueNotificationAsset(params.mosqueTheme || 'auto', params.prayerKey);
    const title = `اقتراب أذان ${params.prayerNameAr} (باقي ${params.reminderMinutes} د)`;
    const body = `${params.cityNameAr} • ${params.isMeetingMode ? 'وضع الاجتماع الصامت' : 'استعد للوضوء والصلاة'}${
      params.sheikhNameAr && !params.isMeetingMode ? ` • ${params.sheikhNameAr}` : ''
    }`;
    const tag = params.isTest
      ? `mihrab-pre-adhan-test-${Date.now()}`
      : `mihrab-pre-adhan-${params.prayerKey}`;

    const notifOptions: NotificationOptions & { image?: string; renotify?: boolean } = {
      body,
      icon: mosque.imageUrl,
      image: mosque.imageUrl,
      badge: '/pwa-192x192.png',
      tag,
      renotify: true,
      dir: 'rtl',
      lang: 'ar',
      requireInteraction: true,
      data: { route: 'times', type: 'pre_adhan', prayerKey: params.prayerKey },
    };

    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg && typeof reg.showNotification === 'function') {
          await reg.showNotification(title, notifOptions);
          return true;
        }
      }

      new Notification(title, notifOptions);
      return true;
    } catch {
      return false;
    }
  }
}

export const backgroundService = new BackgroundService();
