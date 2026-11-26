// Service for Screen Wake Lock API and Browser Web Notifications
import { setNativeKeepAwake } from './nativeAndroidBridge';

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

    try {
      new Notification(
        forceTest ? `معاينة إشعار الصلاة: ${prayerNameAr}` : `حان الآن موعد أذان ${prayerNameAr}`,
        {
          body: `${cityName} · ${mosque.titleAr}`,
          icon: mosque.imageUrl,
          image: mosque.imageUrl,
          badge: '/pwa-192x192.png',
          tag: forceTest ? `adhan-test-${Date.now()}` : `adhan-${prayerNameAr}`,
          dir: 'rtl',
          lang: 'ar',
          requireInteraction: true,
        } as NotificationOptions & { image?: string }
      );
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
}

export const backgroundService = new BackgroundService();
