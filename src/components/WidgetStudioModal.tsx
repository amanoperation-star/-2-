import React, { useEffect, useState } from 'react';
import {
  X,
  Smartphone,
  Lock,
  Home,
  Check,
  Copy,
  Download,
  ExternalLink,
  Wifi,
  BatteryCharging,
  Camera,
  Flashlight,
  Clock,
  Compass,
  BookOpen,
  Calendar,
  Monitor,
  Sparkles,
  ShieldPlus,
  RefreshCw,
} from 'lucide-react';
import { CityLocation, PrayerName, PrayerTimeData, UserSettings } from '../types';
import {
  WIDGET_MOSQUE_BACKGROUNDS,
  WIDGET_SIZES,
  WIDGET_TASBIH_PHRASES,
  WIDGET_THEMES,
  WidgetFontScale,
  WidgetStudioConfig,
  buildWidgetBridgeCopySnippet,
  buildWidgetBridgePayload,
  loadWidgetConfig,
  loadWidgetTasbihState,
  saveWidgetConfig,
} from '../utils/widgetStudioData';
import { PrayerWidgetPreview } from './PrayerWidgetPreview';
import { toArabicDigits, getDailyWirdSchedule, loadKhatmaState } from '../utils/khatmaData';
import {
  RAWATIB_TOTAL_TARGET,
  countCompletedRawatibRakats,
  loadSunnahRawatibState,
} from '../utils/sunnahRawatibData';
import {
  getNativeAndroidWidgetStatus,
  isNativeAndroidApp,
  requestPinNativeAndroidWidget,
  syncNativeAndroidWidgetData,
} from '../utils/nativeAndroidBridge';

interface WidgetStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  prayerTimes: PrayerTimeData;
  currentLocation: CityLocation;
  settings: UserSettings;
  config?: WidgetStudioConfig;
  onUpdateConfig?: (partial: Partial<WidgetStudioConfig>) => void;
  onLaunchStandaloneWidget: (config: WidgetStudioConfig) => void;
  onNavigateShortcut: (
    target: 'times' | 'adhkar' | 'qibla' | 'quran' | 'companion' | 'standby' | 'istikhara'
  ) => void;
}

export const WidgetStudioModal: React.FC<WidgetStudioModalProps> = ({
  isOpen,
  onClose,
  prayerTimes,
  currentLocation,
  settings,
  config: controlledConfig,
  onUpdateConfig,
  onLaunchStandaloneWidget,
  onNavigateShortcut,
}) => {
  const [internalConfig, setInternalConfig] = useState<WidgetStudioConfig>(() =>
    loadWidgetConfig()
  );
  const config = controlledConfig ?? internalConfig;

  const [now, setNow] = useState<Date>(() => new Date());
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);
  const [copiedBridgeCode, setCopiedBridgeCode] = useState<boolean>(false);
  const [nativePinStatus, setNativePinStatus] = useState<{
    isAndroid: boolean;
    pinSupported: boolean;
    activeCount: number;
    feedback: string | null;
  }>({
    isAndroid: false,
    pinSupported: false,
    activeCount: 0,
    feedback: null,
  });

  useEffect(() => {
    if (!controlledConfig) {
      saveWidgetConfig(internalConfig);
    }
  }, [controlledConfig, internalConfig]);

  useEffect(() => {
    if (!isOpen) return;
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 1000);

    const isAndroid = isNativeAndroidApp();
    if (isAndroid) {
      void getNativeAndroidWidgetStatus().then((status) => {
        setNativePinStatus((prev) => ({
          ...prev,
          isAndroid: true,
          pinSupported: status.pinSupported,
          activeCount: status.activeCount,
        }));
      });
    }

    return () => window.clearInterval(id);
  }, [isOpen]);

  if (!isOpen) return null;

  const updateConfig = (partial: Partial<WidgetStudioConfig>) => {
    if (onUpdateConfig) {
      onUpdateConfig(partial);
    } else {
      setInternalConfig((prev) => ({ ...prev, ...partial }));
    }
  };

  const phoneHours = now.getHours() % 12 === 0 ? 12 : now.getHours() % 12;
  const phoneTimeStr = `${String(phoneHours).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const phoneDateStr = now.toLocaleDateString('ar-EG', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const buildWidgetShareUrl = (): string => {
    if (typeof window === 'undefined') return '';
    const params = new URLSearchParams({
      widget: 'true',
      size: config.size,
      theme: config.theme,
      sec: config.showLiveSeconds ? '1' : '0',
      hijri: config.showHijriDate ? '1' : '0',
      wird: config.showSunnahWird ? '1' : '0',
      fasting: config.showFastingAlert ? '1' : '0',
      insp: config.showDailyInspiration ? '1' : '0',
      duha: config.showDuhaSunrise ? '1' : '0',
      quiet: config.showQuietAndLastThird ? '1' : '0',
      actions: config.showQuickActions ? '1' : '0',
      rings: config.showDayProgressRings ? '1' : '0',
      bg: config.mosqueBackgroundId,
      bgop: String(config.mosqueBgOpacity),
      fscale: config.fontScale,
      rate: config.refreshInterval,
    });
    return `${window.location.origin}/?${params.toString()}`;
  };

  const handleCopyWidgetUrl = async () => {
    const url = buildWidgetShareUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(true);
      window.setTimeout(() => setCopiedUrl(false), 2400);
    } catch {
      setCopiedUrl(false);
    }
  };

  const handlePinNativeAndroidWidget = async () => {
    const payload = buildWidgetBridgePayload({
      prayerTimes,
      currentLocation,
      settings,
      widgetConfig: config,
      now,
    });
    await syncNativeAndroidWidgetData(payload);
    const pinSize =
      config.size === 'medium' || config.size === 'spiritual_card'
        ? 'arch'
        : config.size === 'lock_pill'
          ? 'small'
          : 'large';
    const res = await requestPinNativeAndroidWidget(pinSize);
    const updatedStatus = await getNativeAndroidWidgetStatus();
    setNativePinStatus({
      isAndroid: true,
      pinSupported: updatedStatus.pinSupported,
      activeCount: updatedStatus.activeCount,
      feedback: res.requested
        ? 'تم إرسال طلب إضافة البطاقة المقوّسة لشاشة الهاتف، اضغط «إضافة تلقائياً / Add» من نافذة النظام لإتمام التثبيت.'
        : 'اضغط مطولاً على مساحة فارغة في شاشة الهاتف ← الأدوات (Widgets) ← ابحث عن «مواقيت الصلاة - محراب» واختر «البطاقة المقوّسة الكاملة (4×4)».',
    });
  };

  const handleCopyWidgetBridgeData = async () => {
    const payload = buildWidgetBridgePayload({
      prayerTimes,
      currentLocation,
      settings,
      widgetConfig: config,
      now,
    });
    const snippet = buildWidgetBridgeCopySnippet(payload, buildWidgetShareUrl());
    try {
      await navigator.clipboard.writeText(snippet);
      setCopiedBridgeCode(true);
      window.setTimeout(() => setCopiedBridgeCode(false), 2600);
    } catch {
      setCopiedBridgeCode(false);
    }
  };

  const handleExportPng = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = config.size === 'lock_pill' ? 320 : config.size === 'medium' ? 540 : 920;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isParchment = config.theme === 'parchment';
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    if (config.theme === 'oled') {
      grad.addColorStop(0, '#050807');
      grad.addColorStop(1, '#020403');
    } else if (config.theme === 'glass') {
      grad.addColorStop(0, '#0b2b23');
      grad.addColorStop(1, '#051914');
    } else if (isParchment) {
      grad.addColorStop(0, '#FCF7E8');
      grad.addColorStop(1, '#F3E5C2');
    } else if (config.theme === 'royal_gold') {
      grad.addColorStop(0, '#2B1F09');
      grad.addColorStop(1, '#0D0903');
    } else {
      grad.addColorStop(0, '#111C18');
      grad.addColorStop(1, '#071410');
    }

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = isParchment
      ? '#C49A3A'
      : config.theme === 'royal_gold'
        ? '#F6D884'
        : '#D4AF37';
    ctx.lineWidth = 6;
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

    const order: PrayerName[] = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
    const namesAr: Record<PrayerName, string> = {
      fajr: 'الفجر',
      sunrise: 'الشروق',
      dhuhr: now.getDay() === 5 ? 'الجمعة' : 'الظهر',
      asr: 'العصر',
      maghrib: 'المغرب',
      isha: 'العشاء',
    };
    const nowSecs = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    let nextKey: PrayerName = 'fajr';
    for (const k of order) {
      const [hh, mm] = prayerTimes[k].split(':').map(Number);
      if ((hh || 0) * 3600 + (mm || 0) * 60 > nowSecs) {
        nextKey = k;
        break;
      }
    }

    ctx.direction = 'rtl';
    ctx.textAlign = 'center';
    ctx.fillStyle = isParchment ? '#9A6B11' : config.theme === 'royal_gold' ? '#F6D884' : '#D4AF37';
    ctx.font = 'bold 34px Cairo, Amiri, sans-serif';
    ctx.fillText(`مواقيت الصلاة · ${currentLocation.nameAr}`, canvas.width / 2, 86);

    ctx.fillStyle = isParchment ? '#0F3D2E' : '#FFFFFF';
    ctx.font = 'bold 64px Amiri, Cairo, sans-serif';
    ctx.fillText(
      `الصلاة القادمة: ${namesAr[nextKey]} (${prayerTimes[nextKey]})`,
      canvas.width / 2,
      195
    );

    if (config.showHijriDate && canvas.height >= 500) {
      ctx.fillStyle = isParchment ? '#0D7A56' : '#10B981';
      ctx.font = 'bold 32px Amiri, Cairo, sans-serif';
      ctx.fillText(prayerTimes.hijriDate, canvas.width / 2, 270);
    }

    if (config.size === 'large') {
      const dailyKeys: PrayerName[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
      let yPos = 390;
      ctx.font = 'bold 36px Cairo, sans-serif';
      dailyKeys.forEach((k) => {
        ctx.fillStyle =
          k === nextKey
            ? isParchment
              ? '#9A6B11'
              : '#D4AF37'
            : isParchment
              ? '#0F3D2E'
              : '#E2E8F0';
        ctx.fillText(`${namesAr[k]}  —  ${prayerTimes[k]}`, canvas.width / 2, yPos);
        yPos += 74;
      });
    } else if (config.size === 'spiritual_card') {
      const tasbih = loadWidgetTasbihState(now);
      const phrase = WIDGET_TASBIH_PHRASES[tasbih.phraseIndex] || WIDGET_TASBIH_PHRASES[0];
      ctx.fillStyle = isParchment ? '#0F3D2E' : '#FFF7E2';
      ctx.font = 'bold 48px Amiri, Cairo, sans-serif';
      ctx.fillText(`${phrase}`, canvas.width / 2, 410);
      ctx.fillStyle = isParchment ? '#0D7A56' : '#10B981';
      ctx.font = 'bold 54px Cairo, sans-serif';
      ctx.fillText(`السبحة اليومية: ${toArabicDigits(tasbih.count)} تسبيحة`, canvas.width / 2, 510);
    }

    if (config.showSunnahWird && canvas.height >= 500) {
      const rawatib = countCompletedRawatibRakats(loadSunnahRawatibState());
      const wird = getDailyWirdSchedule(loadKhatmaState());
      ctx.fillStyle = isParchment ? '#9A6B11' : '#F3CA63';
      ctx.font = 'bold 28px Cairo, sans-serif';
      ctx.fillText(
        `السنن الرواتب: ${toArabicDigits(rawatib)}/${toArabicDigits(RAWATIB_TOTAL_TARGET)} ركعة · الوِرد اليومي: ${toArabicDigits(wird.dailyPercent)}%`,
        canvas.width / 2,
        canvas.height - 64
      );
    }

    const link = document.createElement('a');
    link.download = `al-mawaqeet-widget-${config.size}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md overflow-y-auto"
      dir="rtl"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="theme-keep-light relative w-full max-w-5xl rounded-3xl bg-[#111C18] border-2 border-[#D4AF37]/65 shadow-[0_24px_70px_rgba(0,0,0,0.85),0_0_40px_rgba(212,175,55,0.16)] overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 bg-[#09120F] border-b border-[#D4AF37]/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#111C18] border border-[#D4AF37]/55 flex items-center justify-center text-[#F3CA63] shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold font-amiri text-[#F3CA63]">
                استوديو معاينة وتخصيص الودجات
              </h2>
              <p className="text-xs text-slate-300">
                متزامن لحظياً مع إعداداتك · معاينة حية على شاشة القفل والشاشة الرئيسية للهاتف
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق استوديو الودجات"
            className="w-10 h-10 rounded-xl bg-[#111C18] border border-[#D4AF37]/40 hover:border-[#F3CA63] text-slate-200 hover:text-[#F3CA63] flex items-center justify-center transition-all shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Grid: Controls (Right) + Interactive Phone Simulator (Left) */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* RIGHT COLUMN: Customization Controls (7 cols) */}
            <div className="lg:col-span-7 space-y-5">
              {/* 1. Theme Picker (5 Themes) */}
              <div className="rounded-2xl bg-[#09120F] border border-[#D4AF37]/30 p-4 space-y-3">
                <h3 className="text-sm font-bold text-[#F3CA63] flex items-center gap-2">
                  <span>١. مظهر وثيم الودجت (٥ ثيمات)</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {WIDGET_THEMES.map((t) => {
                    const active = config.theme === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => updateConfig({ theme: t.id })}
                        className={`p-3 rounded-2xl border text-right transition-all space-y-2 ${
                          active
                            ? 'bg-[#08241C] border-[#10B981] shadow-[0_0_16px_rgba(16,185,129,0.2)]'
                            : 'bg-[#111C18] border-[#D4AF37]/25 hover:border-[#D4AF37]/60'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className={`w-6 h-6 rounded-lg border ${t.swatchClass}`} />
                          {active && <Check className="w-4 h-4 text-[#10B981] stroke-[3]" />}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white">{t.nameAr}</div>
                          <div className="text-[10px] text-slate-400 leading-relaxed mt-0.5">
                            {t.descAr}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Size Selector (4 Sizes) */}
              <div className="rounded-2xl bg-[#09120F] border border-[#D4AF37]/30 p-4 space-y-3">
                <h3 className="text-sm font-bold text-[#F3CA63]">
                  ٢. حجم الودجت وتخطيطه (٤ أحجام)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {WIDGET_SIZES.map((s) => {
                    const active = config.size === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => updateConfig({ size: s.id })}
                        className={`p-3 rounded-2xl border text-right transition-all space-y-1.5 ${
                          active
                            ? 'bg-[#08241C] border-[#10B981] shadow-[0_0_16px_rgba(16,185,129,0.2)]'
                            : 'bg-[#111C18] border-[#D4AF37]/25 hover:border-[#D4AF37]/60'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#050C0A] border border-[#D4AF37]/30 text-[#F3CA63] truncate">
                            {s.badgeAr}
                          </span>
                          {active && <Check className="w-4 h-4 text-[#10B981] stroke-[3] shrink-0" />}
                        </div>
                        <div className="text-xs font-bold text-white pt-0.5">{s.nameAr}</div>
                        <div className="text-[10px] text-slate-400 leading-relaxed">{s.descAr}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2.5 Mosque Background, Opacity & Font Scale */}
              <div className="rounded-2xl bg-[#09120F] border border-[#D4AF37]/30 p-4 space-y-3.5">
                <h3 className="text-sm font-bold text-[#F3CA63]">
                  ٣. خلفية المسجد والشفافية وحجم الخط
                </h3>

                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-slate-300">خلفية مسجد إسلامية هادئة:</div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {WIDGET_MOSQUE_BACKGROUNDS.map((bg) => {
                      const active = config.mosqueBackgroundId === bg.id;
                      return (
                        <button
                          key={bg.id}
                          type="button"
                          onClick={() => updateConfig({ mosqueBackgroundId: bg.id })}
                          className={`rounded-xl border p-2 text-center transition-all flex flex-col items-center gap-1.5 ${
                            active
                              ? 'bg-[#08241C] border-[#10B981] text-emerald-300 shadow-[0_0_14px_rgba(16,185,129,0.18)]'
                              : 'bg-[#111C18] border-[#D4AF37]/25 text-slate-300 hover:border-[#D4AF37]/60'
                          }`}
                        >
                          {bg.imageUrl ? (
                            <img
                              src={bg.imageUrl}
                              alt={bg.titleAr}
                              className="w-full h-9 rounded-lg object-cover border border-white/10"
                            />
                          ) : (
                            <div className="w-full h-9 rounded-lg bg-[#050C0A] border border-dashed border-[#D4AF37]/35 flex items-center justify-center text-[10px] text-slate-400">
                              لون صافي
                            </div>
                          )}
                          <span className="text-[10px] font-bold truncate max-w-full">{bg.titleAr}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {config.mosqueBackgroundId !== 'none' && (
                  <div className="p-3 rounded-xl bg-[#111C18] border border-[#D4AF37]/20 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-200">وضوح وشفافية صورة المسجد</span>
                      <span className="text-[#F3CA63] tabular-nums">
                        {toArabicDigits(config.mosqueBgOpacity)}٪
                      </span>
                    </div>
                    <input
                      type="range"
                      min={15}
                      max={80}
                      step={5}
                      value={config.mosqueBgOpacity}
                      onChange={(e) =>
                        updateConfig({ mosqueBgOpacity: Number(e.target.value) })
                      }
                      className="w-full accent-[#10B981] cursor-pointer"
                    />
                  </div>
                )}

                <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-200">حجم الخط داخل الودجت:</span>
                  <div className="grid grid-cols-3 gap-1.5 bg-[#111C18] p-1 rounded-xl border border-[#D4AF37]/25">
                    {(
                      [
                        { id: 'sm', label: 'صغير' },
                        { id: 'md', label: 'متوسط' },
                        { id: 'lg', label: 'كبير' },
                      ] as Array<{ id: WidgetFontScale; label: string }>
                    ).map((fs) => (
                      <button
                        key={fs.id}
                        type="button"
                        onClick={() => updateConfig({ fontScale: fs.id })}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                          config.fontScale === fs.id
                            ? 'bg-[#D4AF37] text-slate-950 shadow'
                            : 'text-slate-300 hover:text-[#F3CA63]'
                        }`}
                      >
                        {fs.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 4. Quick Display Toggles & Refresh Rate */}
              <div className="rounded-2xl bg-[#09120F] border border-[#D4AF37]/30 p-4 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-[#F3CA63]">
                    ٤. البيانات المعروضة وتكرار التحديث
                  </h3>
                  <button
                    type="button"
                    onClick={() => updateConfig({ autoSync: !config.autoSync })}
                    className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1.5 transition-all ${
                      config.autoSync
                        ? 'bg-[#08241C] border-[#10B981]/60 text-emerald-300'
                        : 'bg-[#111C18] border-slate-700 text-slate-400'
                    }`}
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>{config.autoSync ? 'المزامنة التلقائية مفعّلة' : 'المزامنة متوقفة'}</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {[
                    {
                      key: 'showLiveSeconds' as const,
                      label: 'إظهار الثواني الحية في العدّاد التنازلي',
                      sub: 'عرض الساعات والدقائق والثواني (HH:MM:SS)',
                    },
                    {
                      key: 'showHijriDate' as const,
                      label: 'إظهار التاريخ الهجري داخل الودجت',
                      sub: 'عرض اليوم والشهر الهجري بجانب المواقيت',
                    },
                    {
                      key: 'showSunnahWird' as const,
                      label: 'إظهار مؤشر إنجاز السنن الرواتب والوِرد اليومي',
                      sub: 'متابعة ركعات السنن ونسبة ورد الختمة من الشاشة',
                    },
                    {
                      key: 'showDayProgressRings' as const,
                      label: 'إظهار شريط تقدم اليوم وحلقات الإنجاز الدائرية',
                      sub: 'مؤشر اليوم من الفجر إلى العشاء وحلقات السنن والوِرد',
                    },
                    {
                      key: 'showDuhaSunrise' as const,
                      label: 'إظهار أوقات الشروق وصلاة الضحى ونهايتها',
                      sub: 'عرض الشروق والإشراق ونهاية وقت الضحى وحالته',
                    },
                    {
                      key: 'showQuietAndLastThird' as const,
                      label: 'إظهار مؤشر وضع السكون والثلث الأخير من الليل',
                      sub: 'متابعة حالة السكون الليلي وموعد الثلث الأخير مباشرة',
                    },
                    {
                      key: 'showDailyInspiration' as const,
                      label: 'إظهار آية أو حديث متجدد وذكر قصير',
                      sub: 'مقتطف إيماني متجدد داخل الودجت مع زر تبديل فوري',
                    },
                    {
                      key: 'showQuickActions' as const,
                      label: 'إظهار أزرار السبحة والأذكار والقبلة والسكون التفاعلية',
                      sub: 'أزرار تسبيح حيّ وانتقال سريع للأذكار والقبلة ووضع السكون',
                    },
                    {
                      key: 'showFastingAlert' as const,
                      label: 'إظهار تنبيه صيام التطوع والأيام البيض',
                      sub: 'يظهر تلقائياً عند اقتراب الإثنين والخميس أو الأيام البيض',
                    },
                  ].map((item) => {
                    const checked = config[item.key];
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => updateConfig({ [item.key]: !checked })}
                        className="w-full flex items-center justify-between gap-3 p-3 rounded-xl bg-[#111C18] border border-[#D4AF37]/20 hover:border-[#D4AF37]/50 transition-all text-right"
                      >
                        <div>
                          <div className="text-xs sm:text-sm font-bold text-white">
                            {item.label}
                          </div>
                          <div className="text-[11px] text-slate-400">{item.sub}</div>
                        </div>
                        <div
                          className={`w-11 h-6 rounded-full p-0.5 transition-colors shrink-0 ${
                            checked ? 'bg-[#10B981]' : 'bg-slate-700'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                              checked ? '-translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Refresh Interval Selector */}
                <div className="pt-2 border-t border-[#D4AF37]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[#F3CA63]">تكرار التحديث التلقائي:</span>
                  <div className="grid grid-cols-2 gap-1.5 bg-[#111C18] p-1 rounded-xl border border-[#D4AF37]/25">
                    <button
                      type="button"
                      onClick={() => updateConfig({ refreshInterval: '1s' })}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap ${
                        config.refreshInterval === '1s'
                          ? 'bg-[#10B981] text-slate-950 shadow'
                          : 'text-slate-300 hover:text-[#F3CA63]'
                      }`}
                    >
                      تحديث حيّ كل ثانية
                    </button>
                    <button
                      type="button"
                      onClick={() => updateConfig({ refreshInterval: '1m' })}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap ${
                        config.refreshInterval === '1m'
                          ? 'bg-[#D4AF37] text-slate-950 shadow'
                          : 'text-slate-300 hover:text-[#F3CA63]'
                      }`}
                    >
                      كل دقيقة لتوفير البطارية
                    </button>
                  </div>
                </div>
              </div>

              {/* 4. Launch Standalone Widget / Native Android Pin & Export */}
              <div className="rounded-2xl bg-[#09120F] border border-[#10B981]/35 p-4 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-emerald-300">
                    ٥. إضافة الويدجت على شاشة الهاتف والتصدير
                  </h3>
                  {nativePinStatus.isAndroid && nativePinStatus.activeCount > 0 && (
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-[#08241C] border border-[#10B981]/50 text-emerald-300">
                      مُثبّت حالياً: {toArabicDigits(nativePinStatus.activeCount)} ويدجت
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {nativePinStatus.isAndroid && (
                    <button
                      type="button"
                      onClick={() => void handlePinNativeAndroidWidget()}
                      className="min-h-[42px] px-4 py-2 rounded-xl bg-gradient-to-r from-[#10B981] to-[#059669] text-slate-950 font-black text-xs flex items-center gap-1.5 hover:brightness-105 transition-all shadow"
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>
                        {nativePinStatus.pinSupported
                          ? config.size === 'medium' || config.size === 'spiritual_card'
                            ? 'تثبيت البطاقة المقوّسة على شاشة الهاتف'
                            : 'تثبيت هذا المقاس على شاشة الموبايل'
                          : 'إضافة ويدجت الشاشة الرئيسية'}
                      </span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onLaunchStandaloneWidget(config)}
                    className="min-h-[42px] px-4 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8962E] text-slate-950 font-black text-xs flex items-center gap-1.5 hover:brightness-105 transition-all shadow"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>تشغيل كودجت حي مستقل الآن</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyWidgetUrl}
                    className="min-h-[42px] px-3.5 py-2 rounded-xl bg-[#111C18] border border-[#D4AF37]/45 hover:border-[#F3CA63] text-[#F3CA63] font-bold text-xs flex items-center gap-1.5 transition-all"
                  >
                    {copiedUrl ? (
                      <>
                        <Check className="w-4 h-4 text-[#10B981]" />
                        <span className="text-[#10B981]">تم نسخ الرابط ✓</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>نسخ رابط الودجت الحي</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleExportPng}
                    className="min-h-[42px] px-3.5 py-2 rounded-xl bg-[#08241C] border border-[#10B981]/45 hover:border-[#10B981] text-emerald-300 font-bold text-xs flex items-center gap-1.5 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>تصدير صورة PNG</span>
                  </button>
                </div>

                {nativePinStatus.feedback && (
                  <div className="p-2.5 rounded-xl bg-[#08241C] border border-[#10B981]/45 text-[11px] text-emerald-200 leading-relaxed">
                    {nativePinStatus.feedback}
                  </div>
                )}
              </div>
            </div>

            {/* LEFT COLUMN: Interactive Phone Simulator (5 cols) */}
            <div className="lg:col-span-5 flex flex-col items-center space-y-3">
              {/* Surface Switcher */}
              <div className="flex items-center gap-1.5 bg-[#09120F] p-1 rounded-2xl border border-[#D4AF37]/35 w-full max-w-[330px]">
                <button
                  type="button"
                  onClick={() => updateConfig({ previewSurface: 'lock' })}
                  className={`flex-1 min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    config.previewSurface === 'lock'
                      ? 'bg-gradient-to-r from-[#D4AF37] to-[#B8962E] text-slate-950 shadow'
                      : 'text-slate-300 hover:text-[#F3CA63]'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>شاشة القفل</span>
                </button>
                <button
                  type="button"
                  onClick={() => updateConfig({ previewSurface: 'home' })}
                  className={`flex-1 min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    config.previewSurface === 'home'
                      ? 'bg-[#10B981] text-slate-950 shadow'
                      : 'text-slate-300 hover:text-emerald-300'
                  }`}
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>الشاشة الرئيسية</span>
                </button>
              </div>

              {/* Smartphone Frame */}
              <div className="relative w-full max-w-[330px] rounded-[42px] p-2.5 bg-gradient-to-b from-[#2b3833] via-[#121c18] to-[#080d0b] border-2 border-[#D4AF37]/50 shadow-[0_22px_60px_rgba(0,0,0,0.85)]">
                <div
                  className="relative rounded-[34px] overflow-hidden min-h-[540px] flex flex-col justify-between p-4"
                  style={{
                    background:
                      config.previewSurface === 'lock'
                        ? 'radial-gradient(circle at 50% 15%, rgba(16,185,129,0.28), transparent 55%), radial-gradient(circle at 80% 85%, rgba(212,175,55,0.22), transparent 55%), linear-gradient(180deg, #061c16 0%, #092c23 48%, #04100d 100%)'
                        : 'radial-gradient(circle at 20% 20%, rgba(212,175,55,0.22), transparent 50%), radial-gradient(circle at 80% 75%, rgba(16,185,129,0.25), transparent 55%), linear-gradient(160deg, #07221b 0%, #0d3329 52%, #051310 100%)',
                  }}
                >
                  {/* Subtle Islamic Star Overlay inside phone wallpaper */}
                  <div
                    className="absolute inset-0 opacity-15 pointer-events-none"
                    style={{
                      backgroundImage:
                        'radial-gradient(circle at 25% 30%, #D4AF37 1px, transparent 1px), radial-gradient(circle at 75% 70%, #10B981 1px, transparent 1px)',
                      backgroundSize: '28px 28px',
                    }}
                  />

                  {/* Status Bar + Dynamic Island */}
                  <div className="relative z-10 flex items-center justify-between text-[10px] text-white/90 px-1">
                    <span className="font-mono font-bold tabular-nums">{phoneTimeStr}</span>
                    <div className="w-20 h-4 rounded-full bg-black/90 border border-white/10" />
                    <div className="flex items-center gap-1.5">
                      <Wifi className="w-3 h-3" />
                      <BatteryCharging className="w-3.5 h-3.5 text-emerald-300" />
                    </div>
                  </div>

                  {/* Screen Content */}
                  {config.previewSurface === 'lock' ? (
                    <div className="relative z-10 flex-1 flex flex-col justify-between py-4">
                      <div className="space-y-4">
                        <div className="text-center space-y-0.5 pt-2">
                          <div className="text-[11px] text-amber-100/90 font-medium">
                            {phoneDateStr}
                          </div>
                          <div className="text-5xl font-mono font-black tracking-tight text-white tabular-nums drop-shadow">
                            {phoneTimeStr}
                          </div>
                          {config.showHijriDate && (
                            <div className="text-[11px] font-amiri text-[#F3CA63]">
                              {prayerTimes.hijriDate}
                            </div>
                          )}
                        </div>

                        <div className="pt-1">
                          <PrayerWidgetPreview
                            config={config}
                            prayerTimes={prayerTimes}
                            currentLocation={currentLocation}
                            settings={settings}
                            compactScale={true}
                            onNavigateShortcut={(target) => {
                              onClose();
                              onNavigateShortcut(target);
                            }}
                          />
                        </div>
                      </div>

                      <div className="space-y-3 pt-4">
                        <div className="flex items-center justify-between px-4">
                          <div className="w-9 h-9 rounded-full bg-black/45 backdrop-blur-md border border-white/15 flex items-center justify-center text-white/80">
                            <Flashlight className="w-4 h-4" />
                          </div>
                          <div className="text-[10px] text-white/60">معاينة شاشة القفل</div>
                          <div className="w-9 h-9 rounded-full bg-black/45 backdrop-blur-md border border-white/15 flex items-center justify-center text-white/80">
                            <Camera className="w-4 h-4" />
                          </div>
                        </div>
                        <div className="w-24 h-1 rounded-full bg-white/40 mx-auto" />
                      </div>
                    </div>
                  ) : (
                    <div className="relative z-10 flex-1 flex flex-col justify-between py-3">
                      <div className="space-y-4">
                        <PrayerWidgetPreview
                          config={config}
                          prayerTimes={prayerTimes}
                          currentLocation={currentLocation}
                          settings={settings}
                          compactScale={true}
                          onNavigateShortcut={(target) => {
                            onClose();
                            onNavigateShortcut(target);
                          }}
                        />

                        <div className="space-y-2">
                          <div className="text-[10px] text-white/75 font-bold px-1">
                            اختصارات التطبيق (اضغط للفتح مباشرة)
                          </div>
                          <div className="grid grid-cols-4 gap-2.5">
                            {[
                              {
                                label: 'المواقيت',
                                target: 'times' as const,
                                icon: <Clock className="w-4 h-4 text-[#F3CA63]" />,
                              },
                              {
                                label: 'الرقية',
                                target: 'companion' as const,
                                icon: <ShieldPlus className="w-4 h-4 text-[#10B981]" />,
                              },
                              {
                                label: 'الأذكار',
                                target: 'adhkar' as const,
                                icon: <BookOpen className="w-4 h-4 text-teal-300" />,
                              },
                              {
                                label: 'القبلة',
                                target: 'qibla' as const,
                                icon: <Compass className="w-4 h-4 text-emerald-300" />,
                              },
                              {
                                label: 'المصحف',
                                target: 'quran' as const,
                                icon: <Sparkles className="w-4 h-4 text-[#F3CA63]" />,
                              },
                              {
                                label: 'المنضدة',
                                target: 'standby' as const,
                                icon: <Monitor className="w-4 h-4 text-[#F3CA63]" />,
                              },
                              {
                                label: 'الاستخارة',
                                target: 'istikhara' as const,
                                icon: <span className="text-sm leading-none">🤲</span>,
                              },
                              {
                                label: 'التقويم',
                                target: 'companion' as const,
                                icon: <Calendar className="w-4 h-4 text-emerald-300" />,
                              },
                            ].map((sc) => (
                              <button
                                key={sc.label}
                                type="button"
                                onClick={() => {
                                  onClose();
                                  onNavigateShortcut(sc.target);
                                }}
                                className="flex flex-col items-center gap-1 group"
                              >
                                <div className="w-11 h-11 rounded-2xl bg-[#111C18]/90 border border-[#D4AF37]/45 group-hover:border-[#10B981] flex items-center justify-center shadow transition-all group-hover:scale-105">
                                  {sc.icon}
                                </div>
                                <span className="text-[9px] text-slate-200 font-bold truncate max-w-full">
                                  {sc.label}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="pt-3">
                        <div className="w-24 h-1 rounded-full bg-white/40 mx-auto" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section: Widget Data Bridge Copy Button + 3-Step iOS & Android Installation Guide */}
          <div className="rounded-2xl bg-[#09120F] border border-[#D4AF37]/35 p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#D4AF37]/20">
              <div>
                <h3 className="text-sm font-bold font-amiri text-[#F3CA63]">
                  جسر بيانات الودجت والتثبيت على الشاشة الرئيسية (iOS & Android)
                </h3>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  تُحفظ البيانات لحظياً في <code className="text-[#10B981]">localStorage</code> مع إطلاق الحدث{' '}
                  <code className="text-[#F3CA63]">mihrabWidgetSync</code> لربطها مباشرة بـ WidgetKit و AppWidget.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCopyWidgetBridgeData}
                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#111C18] border-2 border-[#D4AF37]/70 hover:border-[#F3CA63] text-[#F3CA63] font-bold text-xs flex items-center justify-center gap-2 transition-all shrink-0 shadow-[0_0_18px_rgba(212,175,55,0.16)]"
              >
                {copiedBridgeCode ? (
                  <>
                    <Check className="w-4 h-4 text-[#10B981]" />
                    <span className="text-[#10B981]">تم نسخ كود وبيانات الودجت ✓</span>
                  </>
                ) : (
                  <span>📋 نسخ كود وبيانات الودجت</span>
                )}
              </button>
            </div>

            {/* 3-Step Mini Guide for iOS & Android */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-[#111C18] border border-[#D4AF37]/25 space-y-1.5">
                <div className="text-xs font-bold text-[#F3CA63]">
                  ١. ويدجات شاشة الموبايل (APK أندرويد)
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  اضغط زر التثبيت أعلاه أو اضغط مطوّلاً على شاشة الهاتف ←{' '}
                  <strong>الأدوات (Widgets)</strong> ← <strong>مواقيت الصلاة - محراب</strong> ← اختر{' '}
                  <strong>البطاقة المقوّسة الكاملة (4×4)</strong> أو أحد المقاسات (2×1 · 2×2 · 4×2).
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#111C18] border border-[#D4AF37]/25 space-y-1.5">
                <div className="text-xs font-bold text-emerald-300">
                  ٢. التفاعل المباشر من الشاشة الرئيسية
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  في البطاقة المقوّسة يمكنك التسبيح (<strong>سبحة</strong>)، وتفعيل{' '}
                  <strong>السكون</strong>، وتبديل الآية/الحكمة مباشرة دون فتح التطبيق، مع انتقال فوري لـ{' '}
                  <strong>الأذكار</strong> و<strong>القبلة</strong>.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#111C18] border border-[#D4AF37]/25 space-y-1.5">
                <div className="text-xs font-bold text-[#F3CA63]">
                  ٣. المزامنة والتحديث التلقائي
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  تُحدَّث المدينة والتاريخ الهجري وخلفية المسجد والمؤشرات تلقائياً بمجرد تغيير الإعدادات، مع عدّ تنازلي حي وانتقال تلقائي عند كل صلاة.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
