import React, { useEffect, useState } from 'react';
import { Bell, BellRing, Check, ChevronDown, ChevronUp, ShieldCheck, Smartphone } from 'lucide-react';
import { CityLocation, PrayerName, PrayerTimeData } from '../types';
import { backgroundService } from '../utils/backgroundService';
import {
  NotificationMosqueTheme,
  getNativeNotificationPermission,
  isNativeAndroidApp,
  requestNativeNotificationPermission,
  sendNativeTestPrayerNotification,
} from '../utils/nativeAndroidBridge';

interface NotificationShadeSettingsCardProps {
  stickyEnabled: boolean;
  adhanBannerEnabled: boolean;
  mosqueTheme: NotificationMosqueTheme;
  onChangeStickyEnabled: (val: boolean) => void;
  onChangeAdhanBannerEnabled: (val: boolean) => void;
  onChangeMosqueTheme: (val: NotificationMosqueTheme) => void;
  currentLocation: CityLocation;
  prayerTimes?: PrayerTimeData;
}

const MOSQUE_OPTIONS: Array<{
  id: NotificationMosqueTheme;
  titleAr: string;
  subtitleAr: string;
  imageUrl: string;
  fallbackGradient: string;
}> = [
  {
    id: 'auto',
    titleAr: 'تبديل تلقائي بين الثلاثة',
    subtitleAr: 'المسجد النبوي · الكعبة · الأزهر حسب الصلاة',
    imageUrl: '/assets/mosques/nabawi.jpg',
    fallbackGradient: 'linear-gradient(135deg, #064e3b 0%, #022c22 60%, #050807 100%)',
  },
  {
    id: 'nabawi',
    titleAr: 'المسجد النبوي الشريف',
    subtitleAr: 'القبة الخضراء ومآذن المدينة المنورة',
    imageUrl: '/assets/mosques/nabawi.jpg',
    fallbackGradient: 'linear-gradient(135deg, #065f46 0%, #022c22 100%)',
  },
  {
    id: 'kaaba',
    titleAr: 'الكعبة المشرفة',
    subtitleAr: 'المسجد الحرام بمكة المكرمة',
    imageUrl: '/assets/mosques/kaaba.jpg',
    fallbackGradient: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
  },
  {
    id: 'azhar',
    titleAr: 'الجامع الأزهر الشريف',
    subtitleAr: 'المآذن المملوكية وصحن الجامع بالقاهرة',
    imageUrl: '/assets/mosques/azhar.jpg',
    fallbackGradient: 'linear-gradient(135deg, #78350f 0%, #0f172a 100%)',
  },
];

function format12Ar(time24: string): string {
  const [hRaw, mRaw] = time24.split(':').map(Number);
  const h = Number.isFinite(hRaw) ? hRaw : 0;
  const m = Number.isFinite(mRaw) ? mRaw : 0;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const suffix = h >= 12 ? 'م' : 'ص';
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${suffix}`;
}

export const NotificationShadeSettingsCard: React.FC<NotificationShadeSettingsCardProps> = ({
  stickyEnabled,
  adhanBannerEnabled,
  mosqueTheme,
  onChangeStickyEnabled,
  onChangeAdhanBannerEnabled,
  onChangeMosqueTheme,
  currentLocation,
  prayerTimes,
}) => {
  const [now, setNow] = useState<Date>(() => new Date());
  const [previewExpanded, setPreviewExpanded] = useState<boolean>(true);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [isAndroidApk] = useState<boolean>(() => isNativeAndroidApp());
  const [nativePermissionGranted, setNativePermissionGranted] = useState<boolean>(true);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [isSendingTest, setIsSendingTest] = useState<boolean>(false);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!isAndroidApk) return;
    void getNativeNotificationPermission().then((res) => {
      setNativePermissionGranted(res.granted);
    });
  }, [isAndroidApk]);

  // Compute upcoming prayer & live countdown
  const times = prayerTimes || {
    fajr: '04:55',
    sunrise: '06:22',
    dhuhr: '11:55',
    asr: '15:05',
    maghrib: '17:25',
    isha: '18:45',
    dateString: '',
    hijriDate: '',
  };
  const order: PrayerName[] = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
  const namesAr: Record<PrayerName, string> = {
    fajr: 'الفجر',
    sunrise: 'الشروق',
    dhuhr: now.getDay() === 5 ? 'الجمعة' : 'الظهر',
    asr: 'العصر',
    maghrib: 'المغرب',
    isha: 'العشاء',
  };

  const nowSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  let nextIndex = 0;
  let remainingSec = 0;
  let foundToday = false;

  for (let i = 0; i < order.length; i++) {
    const [hh, mm] = times[order[i]].split(':').map(Number);
    const targetSec = (hh || 0) * 3600 + (mm || 0) * 60;
    if (targetSec > nowSeconds) {
      nextIndex = i;
      remainingSec = targetSec - nowSeconds;
      foundToday = true;
      break;
    }
  }

  if (!foundToday) {
    nextIndex = 0;
    const [fh, fm] = times.fajr.split(':').map(Number);
    remainingSec = 24 * 3600 - nowSeconds + ((fh || 5) * 3600 + (fm || 0) * 60);
  }

  const nextKey = order[nextIndex];
  const followingKey = order[(nextIndex + 1) % order.length];
  const hrs = Math.floor(remainingSec / 3600);
  const mins = Math.floor((remainingSec % 3600) / 60);
  const secs = remainingSec % 60;
  const countdownStr =
    hrs > 0
      ? `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
      : `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  const activeMosque = backgroundService.getMosqueNotificationAsset(mosqueTheme, nextKey);

  const handleGrantAndroidPermission = async () => {
    setFeedbackMsg(null);
    if (isAndroidApk) {
      const res = await requestNativeNotificationPermission();
      setNativePermissionGranted(res.granted);
      setFeedbackMsg(
        res.granted
          ? 'تم تفعيل إذن الإشعارات بنجاح؛ اسحب الشاشة من الأعلى لمشاهدة شريط العد التنازلي.'
          : 'يرجى السماح بإذن الإشعارات من إعدادات التطبيق في الهاتف ليظهر الشريط العلوي.'
      );
      return;
    }

    const granted = await backgroundService.requestNotificationPermission();
    setFeedbackMsg(
      granted
        ? 'تم تفعيل إذن إشعارات المتصفح بنجاح.'
        : 'تم حظر الإشعارات في المتصفح؛ يمكنك تفعيلها من إعدادات الموقع.'
    );
  };

  const handleSendTestNotification = async () => {
    setFeedbackMsg(null);
    setIsSendingTest(true);
    try {
      if (isAndroidApk) {
        const status = await getNativeNotificationPermission();
        if (!status.granted) {
          const req = await requestNativeNotificationPermission();
          setNativePermissionGranted(req.granted);
          if (!req.granted) {
            setFeedbackMsg('يرجى السماح بإذن الإشعارات أولاً لعرض الإشعار في الشريط العلوي.');
            return;
          }
        }
        const res = await sendNativeTestPrayerNotification(mosqueTheme);
        setFeedbackMsg(
          res.shown
            ? 'تم إرسال الإشعار وتحديث الشريط العلوي الآن — اسحب شاشة الموبايل من الأعلى للمعاينة.'
            : 'تعذر عرض الإشعار؛ تأكد من تفعيل الإشعارات للتطبيق.'
        );
        return;
      }

      const ok = await backgroundService.requestNotificationPermission();
      if (!ok) {
        setFeedbackMsg('إشعارات المتصفح غير مسموحة حالياً — يمكنك تفعيلها من أيقونة القفل في المتصفح.');
        return;
      }
      backgroundService.sendPrayerNotification(
        namesAr[nextKey],
        currentLocation.nameAr,
        mosqueTheme,
        nextKey,
        true
      );
      setFeedbackMsg('تم إرسال إشعار معاينة للمتصفح بنجاح.');
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div
      className="p-5 rounded-3xl bg-gradient-to-br from-[#062d24] via-[#041d18] to-[#02100d] border-2 border-[#e5b869]/45 space-y-5 shadow-xl text-right"
      dir="rtl"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap pb-3 border-b border-[#e5b869]/20">
        <div className="text-xs text-slate-300">
          <span>يظهر عند سحب الشاشة من الأعلى</span>
          <span aria-hidden="true"> · </span>
          <span className="text-[#fbbf24] font-semibold">صور مدمجة بدون نت</span>
        </div>
        <div className="flex items-center gap-2 text-[#fbbf24]">
          <h4 className="text-base sm:text-lg font-bold font-amiri">
            إشعار شريط الموبايل العلوي والعد التنازلي
          </h4>
          <BellRing className="w-5 h-5" />
        </div>
      </div>

      {/* Live Notification Shade Pull-Down Preview */}
      <div className="rounded-2xl bg-[#020c09] border border-[#e5b869]/30 p-3.5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setPreviewExpanded((prev) => !prev)}
            className="min-h-[44px] px-3 py-1.5 rounded-xl bg-[#041d18] border border-[#e5b869]/30 text-xs font-bold text-[#fbbf24] flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            {previewExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            <span>{previewExpanded ? 'الوضع المضغوط' : 'توسيع المعاينة'}</span>
          </button>
          <div className="text-xs text-slate-300 font-medium">
            معاينة شكل الإشعار عند سحب شاشة الهاتف من الأعلى
          </div>
        </div>

        {/* Simulated Notification Card */}
        <div className="rounded-2xl bg-[#0b1b16] border border-[#d4af37]/50 overflow-hidden shadow-lg">
          {previewExpanded ? (
            <div className="p-2.5 space-y-2.5">
              <div
                className="relative h-28 sm:h-32 rounded-xl overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #064e3b 0%, #022c22 100%)',
                }}
              >
                {!failedImages[activeMosque.imageUrl] && (
                  <img
                    src={activeMosque.imageUrl}
                    alt={activeMosque.titleAr}
                    referrerPolicy="no-referrer"
                    onError={() =>
                      setFailedImages((prev) => ({ ...prev, [activeMosque.imageUrl]: true }))
                    }
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
                <div className="absolute bottom-2 inset-x-3 flex items-center justify-between gap-2 text-xs">
                  <span className="font-bold text-[#f3ca63] truncate">{activeMosque.titleAr}</span>
                  <span className="text-slate-200 truncate">
                    {currentLocation.nameAr}
                    {times.hijriDate ? ` · ${times.hijriDate}` : ''}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 px-1">
                <div className="min-w-0 text-right">
                  <div className="text-sm font-bold text-white truncate">
                    الصلاة القادمة: {namesAr[nextKey]} — {format12Ar(times[nextKey])}
                  </div>
                  <div className="text-[11px] text-slate-300 truncate mt-0.5">
                    تليها: {namesAr[followingKey]} {format12Ar(times[followingKey])}
                  </div>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-[#d4af37]/20 border border-[#d4af37]/60 text-[#f3ca63] font-mono font-bold text-sm tabular-nums shrink-0">
                  {countdownStr}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-2.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div
                  className="w-14 h-11 rounded-lg overflow-hidden shrink-0 border border-[#d4af37]/40"
                  style={{
                    background: 'linear-gradient(135deg, #064e3b 0%, #022c22 100%)',
                  }}
                >
                  {!failedImages[activeMosque.imageUrl] && (
                    <img
                      src={activeMosque.imageUrl}
                      alt={activeMosque.titleAr}
                      referrerPolicy="no-referrer"
                      onError={() =>
                        setFailedImages((prev) => ({ ...prev, [activeMosque.imageUrl]: true }))
                      }
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0 text-right">
                  <div className="text-xs font-bold text-white truncate">
                    الصلاة القادمة: {namesAr[nextKey]}
                  </div>
                  <div className="text-[11px] text-slate-300 truncate">
                    {format12Ar(times[nextKey])} · {currentLocation.nameAr}
                  </div>
                </div>
              </div>
              <div className="px-2.5 py-1 rounded-lg bg-[#d4af37]/20 border border-[#d4af37]/60 text-[#f3ca63] font-mono font-bold text-xs tabular-nums shrink-0">
                {countdownStr}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toggles */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4 p-3.5 rounded-2xl bg-[#041814] border border-[#e5b869]/25">
          <button
            type="button"
            role="switch"
            aria-checked={stickyEnabled}
            onClick={() => onChangeStickyEnabled(!stickyEnabled)}
            className={`min-h-[44px] min-w-[68px] px-3 rounded-xl text-xs font-bold border transition-colors whitespace-nowrap shrink-0 ${
              stickyEnabled
                ? 'bg-emerald-950 border-emerald-400 text-emerald-300'
                : 'bg-slate-900 border-slate-700 text-slate-400'
            }`}
          >
            {stickyEnabled ? 'مفعّل' : 'معطّل'}
          </button>
          <div className="space-y-0.5 text-right flex-1">
            <div className="text-xs sm:text-sm font-bold text-white">
              إشعار دائم في الشريط العلوي بالعد التنازلي
            </div>
            <div className="text-[11px] text-slate-400">
              يظهر فور سحب شاشة الموبايل من الأعلى مع المتبقي على الصلاة وموعد الأذان
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 p-3.5 rounded-2xl bg-[#041814] border border-[#e5b869]/25">
          <button
            type="button"
            role="switch"
            aria-checked={adhanBannerEnabled}
            onClick={() => onChangeAdhanBannerEnabled(!adhanBannerEnabled)}
            className={`min-h-[44px] min-w-[68px] px-3 rounded-xl text-xs font-bold border transition-colors whitespace-nowrap shrink-0 ${
              adhanBannerEnabled
                ? 'bg-emerald-950 border-emerald-400 text-emerald-300'
                : 'bg-slate-900 border-slate-700 text-slate-400'
            }`}
          >
            {adhanBannerEnabled ? 'مفعّل' : 'معطّل'}
          </button>
          <div className="space-y-0.5 text-right flex-1">
            <div className="text-xs sm:text-sm font-bold text-white">
              إشعار بارز بصورة المسجد عند دخول وقت الأذان
            </div>
            <div className="text-[11px] text-slate-400">
              يُنبهك عند حلول موعد الصلاة بصورة المسجد المختارة حتى مع إغلاق التطبيق
            </div>
          </div>
        </div>
      </div>

      {/* Mosque Image Selector (Nabawi, Kaaba, Al-Azhar, Auto) */}
      <div className="space-y-2.5">
        <div className="text-xs sm:text-sm font-bold text-[#fbbf24]">
          صورة المسجد المعروضة داخل الإشعار
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {MOSQUE_OPTIONS.map((opt) => {
            const isSelected = mosqueTheme === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChangeMosqueTheme(opt.id)}
                className={`group relative min-h-[84px] rounded-2xl border overflow-hidden text-right transition-all ${
                  isSelected
                    ? 'border-[#fbbf24] ring-2 ring-[#e5b869]/45 shadow-[0_0_20px_rgba(251,191,36,0.2)]'
                    : 'border-[#e5b869]/25 hover:border-[#e5b869]/60'
                }`}
                style={{ background: opt.fallbackGradient }}
              >
                {!failedImages[opt.imageUrl] && (
                  <img
                    src={opt.imageUrl}
                    alt={opt.titleAr}
                    referrerPolicy="no-referrer"
                    onError={() =>
                      setFailedImages((prev) => ({ ...prev, [opt.imageUrl]: true }))
                    }
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-black/25" />
                <div className="relative z-10 h-full p-3 flex items-end justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-bold text-white truncate">
                      {opt.titleAr}
                    </div>
                    <div className="text-[10px] text-slate-200/90 truncate mt-0.5">
                      {opt.subtitleAr}
                    </div>
                  </div>
                  <span
                    className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'bg-[#fbbf24] border-[#fbbf24] text-slate-950'
                        : 'bg-black/40 border-white/40 text-transparent'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Action Row: Test Notification + Android Permission */}
      <div className="flex flex-wrap items-center gap-2.5 pt-1">
        <button
          type="button"
          disabled={isSendingTest}
          onClick={() => void handleSendTestNotification()}
          className="min-h-[44px] px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#fbbf24] to-[#d4af37] text-slate-950 font-black text-xs flex items-center gap-2 hover:brightness-105 transition-all shadow disabled:opacity-60 whitespace-nowrap"
        >
          <Bell className="w-4 h-4" />
          <span>{isSendingTest ? 'جاري الإرسال...' : 'إرسال إشعار ومعاينة الآن'}</span>
        </button>

        {(!isAndroidApk || !nativePermissionGranted) && (
          <button
            type="button"
            onClick={() => void handleGrantAndroidPermission()}
            className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#041814] border border-[#10B981]/50 text-emerald-300 hover:bg-emerald-950/60 font-bold text-xs flex items-center gap-2 transition-colors whitespace-nowrap"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>
              {isAndroidApk ? 'تفعيل إذن إشعارات الأندرويد' : 'منح إذن إشعارات المتصفح'}
            </span>
          </button>
        )}

        {isAndroidApk && nativePermissionGranted && (
          <span className="text-xs text-emerald-300 font-semibold flex items-center gap-1.5">
            <Smartphone className="w-4 h-4" />
            <span>إذن إشعارات الهاتف مفعّل</span>
          </span>
        )}
      </div>

      {feedbackMsg && (
        <div className="p-3 rounded-xl bg-[#041814] border border-[#10B981]/45 text-xs text-emerald-200 leading-relaxed">
          {feedbackMsg}
        </div>
      )}
    </div>
  );
};
