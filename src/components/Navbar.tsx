import React, { useState, useEffect } from 'react';
import {
  Clock,
  Compass,
  BookOpen,
  Sparkles,
  Settings,
  MapPin,
  Volume2,
  Square,
  ShieldCheck,
  CheckCircle2,
  Award,
  Image as ImageIcon,
  Shield,
  Check,
  RotateCcw,
  Timer,
  Calendar,
  TrainFront,
  Home,
  Palette,
} from 'lucide-react';
import { CityLocation, UserSettings } from '../types';
import { adhanPlayer, AudioPlayerState } from '../utils/audioAdhan';
import { WeatherWidget } from './WeatherWidget';
import { PWAInstallButton } from './PWAInstallButton';
import {
  KHATMA_PRAYER_ORDER,
  KhatmaPlanDays,
  KhatmaPrayerKey,
  KhatmaState,
  TOTAL_MUSHAF_PAGES,
  getDailyWirdSchedule,
} from '../utils/khatmaData';
import { getThemeDefinition, normalizeThemeId } from '../utils/themesData';

interface NavbarProps {
  activeTab: 'times' | 'tracker' | 'qibla' | 'adhkar' | 'quran' | 'ai' | 'companion' | 'commute' | 'family';
  setActiveTab: (tab: 'times' | 'tracker' | 'qibla' | 'adhkar' | 'quran' | 'ai' | 'companion' | 'commute' | 'family') => void;
  currentLocation: CityLocation;
  settings: UserSettings;
  onOpenSettings: () => void;
  onOpenIqamaTab?: () => void;
  onToggleTvMode?: () => void;
  onOpenBackgroundPicker: () => void;
  onCycleTheme: () => void;
  autoThemeStatusBadge?: string;
  onOpenSteadfastness?: () => void;
  onOpenStandbyMode?: () => void;
  onOpenIstikharaHajah?: () => void;
  onOpenWidgetsStudio?: () => void;
  khatmaState: KhatmaState;
  khatmaSchedule: ReturnType<typeof getDailyWirdSchedule>;
  onSwitchKhatmaPlan: (plan: KhatmaPlanDays) => void;
  onTogglePrayerWird: (prayerKey: KhatmaPrayerKey) => void;
  onStartNewKhatma: () => void;
  onOpenWirdModal: (prayerKey: KhatmaPrayerKey, prayerNameAr: string) => void;
}

const KHATMA_PRAYER_LABELS: Record<KhatmaPrayerKey, string> = {
  fajr: 'الفجر',
  dhuhr: 'الظهر',
  asr: 'العصر',
  maghrib: 'المغرب',
  isha: 'العشاء',
};

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentLocation,
  settings,
  onOpenSettings,
  onOpenIqamaTab,
  onToggleTvMode,
  onOpenBackgroundPicker,
  onCycleTheme,
  autoThemeStatusBadge,
  onOpenSteadfastness,
  onOpenStandbyMode,
  onOpenIstikharaHajah,
  onOpenWidgetsStudio,
  khatmaState,
  khatmaSchedule,
  onSwitchKhatmaPlan,
  onTogglePrayerWird,
  onStartNewKhatma,
  onOpenWirdModal,
}) => {
  const [playerState, setPlayerState] = useState<AudioPlayerState>('idle');
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const activeThemeDef = getThemeDefinition(normalizeThemeId(settings.theme));

  const isFriday = new Date().getDay() === 5;
  const getPrayerLabel = (key: KhatmaPrayerKey) =>
    key === 'dhuhr' && isFriday ? 'الجمعة' : KHATMA_PRAYER_LABELS[key];

  useEffect(() => {
    setIsUnlocked(adhanPlayer.getIsUnlocked());
    const unsub = adhanPlayer.subscribe({
      onStateChange: (st) => setPlayerState(st),
      onUnlocked: () => setIsUnlocked(true),
    });
    return () => unsub();
  }, []);

  const handleToggleAdhan = () => {
    if (playerState === 'playing' || playerState === 'loading') {
      adhanPlayer.stop();
    } else {
      adhanPlayer.playAdhan(settings.adhanReciter);
    }
  };

  const handleUnlockAudio = async () => {
    await adhanPlayer.unlockAudio();
    adhanPlayer.playChime();
  };

  const navigateToSection = (
    tab: 'times' | 'tracker' | 'qibla' | 'adhkar' | 'quran' | 'ai' | 'companion' | 'commute' | 'family'
  ) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderBrandEmblem = () => (
    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0A241C] to-[#04130E] flex items-center justify-center shadow-[0_0_16px_rgba(212,175,55,0.22)] border border-[#D4AF37]/60 shrink-0">
      <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="6" y="6" width="20" height="20" rx="1.5" stroke="#D4AF37" strokeWidth="1.2" strokeOpacity="0.45" />
        <rect
          x="6"
          y="6"
          width="20"
          height="20"
          rx="1.5"
          stroke="#D4AF37"
          strokeWidth="1.2"
          strokeOpacity="0.45"
          transform="rotate(45 16 16)"
        />
        <path
          d="M17.8 9.2C14.1 9.5 11.2 12.6 11.2 16.4C11.2 20.4 14.4 23.6 18.4 23.6C20.2 23.6 21.8 22.9 23.1 21.8C21.8 22.2 20.3 22.1 19 21.5C16.2 20.2 14.9 16.9 16.2 14C16.9 12.3 18.2 11 19.9 10.3C19.2 9.6 18.5 9.2 17.8 9.2Z"
          fill="#F3D078"
        />
        <polygon
          points="21.5,11.5 22.2,13.1 23.8,13.8 22.2,14.5 21.5,16.1 20.8,14.5 19.2,13.8 20.8,13.1"
          fill="#fef08a"
        />
      </svg>
    </div>
  );

  const mobileTileClass = (isActive: boolean) =>
    `min-h-[58px] px-2 py-2 rounded-xl border flex flex-col items-center justify-center gap-1 text-center transition-all active:scale-[0.98] ${
      isActive
        ? 'bg-[#0A241C] border-[#D4AF37] text-[#F3D078] shadow-[0_0_14px_rgba(212,175,55,0.22)] font-bold'
        : 'bg-[#0A241C]/75 border-[#D4AF37]/20 text-slate-200 hover:border-[#D4AF37]/50 hover:text-[#F3D078]'
    }`;

  return (
    <header
      dir="rtl"
      className="relative xl:sticky xl:top-0 z-40 bg-[#04130E]/95 backdrop-blur-xl border-b border-[#D4AF37]/35 px-3 lg:px-5 py-3 shadow-[0_6px_30px_rgba(0,0,0,0.45)] theme-keep-light"
      style={{ fontFamily: "'Cairo', sans-serif" }}
    >
      {/* =====================================================================
          MOBILE & TABLET ROYAL MIHRAB RTL LAYOUT (< xl)
          ===================================================================== */}
      <div className="xl:hidden max-w-3xl mx-auto flex flex-col gap-3" x-data="{ kaabaOpen: false, khatmaOpen: false }">
        {/* 1A. Top Identity Header: Logo + Title + Location + Settings */}
        <div className="flex items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={() => navigateToSection('times')}
            title="العودة إلى الصفحة الرئيسية (المواقيت)"
            className="flex items-center gap-2.5 text-right rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F3D078]/60 min-w-0"
          >
            {renderBrandEmblem()}
            <div className="leading-tight min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-[#F3D078] tracking-wide font-amiri truncate">
                مواقيت الصلاة
              </h1>
              <p className="text-xs text-slate-200 flex items-center gap-1 truncate">
                <MapPin className="w-3.5 h-3.5 text-[#34D399] shrink-0" />
                <span className="truncate">
                  {currentLocation.nameAr}، {currentLocation.countryAr}
                </span>
              </p>
            </div>
          </button>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => navigateToSection('times')}
              title="الصفحة الرئيسية"
              className="min-h-[44px] px-3 py-2 rounded-xl bg-[#071E17] border border-[#D4AF37]/45 text-[#F3D078] text-xs font-bold flex items-center gap-1 shadow-sm"
            >
              <span>🏠</span>
              <span>الرئيسية</span>
            </button>
            <button
              type="button"
              onClick={onOpenSettings}
              title="الإعدادات"
              aria-label="الإعدادات"
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#071E17] border border-[#D4AF37]/65 text-[#F3D078] text-xs font-bold shadow-[0_0_12px_rgba(212,175,55,0.22)] hover:bg-[#0A241C] transition-colors flex items-center gap-1.5 shrink-0"
            >
              <Settings className="w-4 h-4" />
              <span>الإعدادات</span>
            </button>
          </div>
        </div>

        {/* 1B. Full Weather Strip */}
        <WeatherWidget currentLocation={currentLocation} showFullStripOnMobile={true} />

        {/* 1C. Complete Tools Strip (Background, Audio, Display Mode, Duas, Achievements, Widgets, Theme) */}
        <div className="rounded-2xl bg-[#071E17] border border-[#D4AF37]/30 p-2">
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
            <button
              type="button"
              onClick={onOpenBackgroundPicker}
              title="تغيير خلفية المساجد"
              className="min-h-[42px] px-2 py-1.5 rounded-xl bg-[#0A241C] border border-[#D4AF37]/30 hover:border-[#F3D078] text-[#F3D078] text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <ImageIcon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">تغيير الخلفية</span>
            </button>

            <button
              type="button"
              onClick={handleToggleAdhan}
              title={playerState === 'playing' ? 'إيقاف صوت الأذان' : 'تشغيل صوت الأذان'}
              className={`min-h-[42px] px-2 py-1.5 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors ${
                playerState === 'playing'
                  ? 'bg-rose-900/70 border-rose-500/60 text-rose-100'
                  : 'bg-[#0A241C] border-[#34D399]/35 text-[#34D399] hover:border-[#34D399]'
              }`}
            >
              {playerState === 'playing' ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current shrink-0" />
                  <span className="truncate">إيقاف الصوت</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">الصوت</span>
                </>
              )}
            </button>

            {(onOpenStandbyMode || onToggleTvMode) && (
              <button
                type="button"
                onClick={onOpenStandbyMode ?? onToggleTvMode}
                title="وضع العرض الموحّد (وضع المنضدة وشاشة البيت والمصلى)"
                className="min-h-[42px] px-2 py-1.5 rounded-xl bg-[#0A241C] border border-[#D4AF37]/50 hover:border-[#F3D078] text-[#F3D078] text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span aria-hidden="true" className="leading-none">🖥️</span>
                <span className="truncate">وضع العرض</span>
              </button>
            )}

            {onOpenIstikharaHajah && (
              <button
                type="button"
                onClick={onOpenIstikharaHajah}
                title="الأدعية ومساعد صلاة الاستخارة والحاجة"
                className="min-h-[42px] px-2 py-1.5 rounded-xl bg-[#0A241C] border border-[#D4AF37]/35 hover:border-[#F3D078] text-[#F3D078] text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span aria-hidden="true" className="leading-none">🤲</span>
                <span className="truncate">الأدعية</span>
              </button>
            )}

            {onOpenSteadfastness && (
              <button
                type="button"
                onClick={onOpenSteadfastness}
                title="الإنجازات وسجل استقامة القلب"
                className="min-h-[42px] px-2 py-1.5 rounded-xl bg-[#0A241C] border border-[#D4AF37]/45 hover:border-[#F3D078] text-[#F3D078] text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Award className="w-3.5 h-3.5 text-[#34D399] shrink-0" />
                <span className="truncate">الإنجازات</span>
              </button>
            )}

            {onOpenWidgetsStudio && (
              <button
                type="button"
                onClick={onOpenWidgetsStudio}
                title="الودجات واختصارات الشاشة"
                className="min-h-[42px] px-2 py-1.5 rounded-xl bg-[#0A241C] border border-[#D4AF37]/30 hover:border-[#F3D078] text-slate-100 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span aria-hidden="true" className="leading-none">📱</span>
                <span className="truncate">الودجات</span>
              </button>
            )}

            <button
              type="button"
              onClick={onCycleTheme}
              title={`تبديل المظهر الحالي (${activeThemeDef.nameAr})`}
              className="min-h-[42px] px-2 py-1.5 rounded-xl bg-[#0A241C] border border-[#D4AF37]/25 hover:border-[#F3D078] text-slate-200 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Palette className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
              <span className="truncate">{activeThemeDef.nameAr}</span>
            </button>

            <button
              type="button"
              onClick={handleUnlockAudio}
              title="تفعيل إذن الصوت في المتصفح"
              className={`min-h-[42px] px-2 py-1.5 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors ${
                isUnlocked
                  ? 'bg-[#06291E] border-[#34D399]/50 text-[#34D399]'
                  : 'bg-[#0A241C] border-[#D4AF37]/25 text-slate-200'
              }`}
            >
              {isUnlocked ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">الصوت مفعّل</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-[#F3D078] shrink-0" />
                  <span className="truncate">تفعيل الصوت</span>
                </>
              )}
            </button>

            <div className="empty:hidden flex items-stretch justify-center [&>button]:w-full [&>button]:justify-center [&>button]:min-h-[42px]">
              <PWAInstallButton />
            </div>
          </div>
        </div>

        {/* 1.5. SIDE-BY-SIDE KAABA TRIGGER & MUSHAF KHATMA TRIGGER ROW */}
        {(() => {
          const [kaabaOpen, setKaabaOpen] = React.useState(false);
          const [khatmaOpen, setKhatmaOpen] = React.useState(false);

          return (
            <div className="space-y-2.5">
              {/* Row of 2 buttons side-by-side */}
              <div className="grid grid-cols-2 gap-2">
                {/* Kaaba Button */}
                <button
                  type="button"
                  onClick={() => setKaabaOpen(!kaabaOpen)}
                  className="rounded-2xl p-2.5 bg-gradient-to-br from-[#0D2920] via-[#071A14] to-[#0B241B] border border-[#F3D078]/40 shadow-[0_4px_16px_rgba(0,0,0,0.45)] flex flex-col justify-between text-right active:scale-[0.98] transition-all"
                >
                  <div className="flex items-center justify-between gap-1.5 w-full">
                    {/* Kaaba Sculpture Icon */}
                    <div className="w-9 h-9 shrink-0 rounded-xl bg-gradient-to-br from-[#1A1D1F] to-[#0A0B0C] border border-[#F3D078]/70 flex flex-col justify-between p-1 shadow-md">
                      <div className="w-full h-1 rounded-[1px] bg-gradient-to-l from-[#F8DF96] via-[#CFA632] to-[#997515] mt-0.5"></div>
                      <div className="flex items-end justify-end px-0.5 pb-0.5">
                        <span className="w-1.5 h-2 rounded-[1px] border border-[#F8DF96]/80 bg-[#CFA632]/25"></span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-[#10B981]/15 border border-[#34D399]/40 text-[#34D399] text-[9px] font-extrabold">
                      ١٠ أقسام
                    </span>
                  </div>
                  <div className="mt-2">
                    <div className="font-amiri text-sm font-bold text-[#F3D078] leading-tight">أقسام مِحراب</div>
                    <div className="flex items-center justify-between text-[10px] text-slate-300 mt-0.5">
                      <span className="truncate">{kaabaOpen ? 'مفتوح' : 'مقفول'}</span>
                      <span className="font-extrabold text-[#F3D078]">{kaabaOpen ? 'إغلاق ▴' : 'فتح ▾'}</span>
                    </div>
                  </div>
                </button>

                {/* Mushaf Khatma Button */}
                <button
                  type="button"
                  onClick={() => setKhatmaOpen(!khatmaOpen)}
                  className="rounded-2xl p-2.5 bg-gradient-to-br from-[#0D2920] via-[#071A14] to-[#0B241B] border border-[#F3D078]/40 shadow-[0_4px_16px_rgba(0,0,0,0.45)] flex flex-col justify-between text-right active:scale-[0.98] transition-all"
                >
                  <div className="flex items-center justify-between gap-1.5 w-full">
                    {/* Mushaf / Book Icon */}
                    <div className="w-9 h-9 shrink-0 rounded-xl bg-gradient-to-br from-[#1A1D1F] to-[#0A0B0C] border border-[#F3D078]/70 flex items-center justify-center text-base shadow-md">
                      📖
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-[#10B981]/15 border border-[#34D399]/40 text-[#34D399] text-[9px] font-extrabold">
                      {khatmaSchedule.currentJuzName}
                    </span>
                  </div>
                  <div className="mt-2">
                    <div className="font-amiri text-sm font-bold text-[#F3D078] leading-tight truncate">مُرافق الختمة</div>
                    <div className="flex items-center justify-between text-[10px] text-slate-300 mt-0.5">
                      <span className="tabular-nums">{khatmaSchedule.dailyPercent}%</span>
                      <span className="font-extrabold text-[#F3D078]">{khatmaOpen ? 'إغلاق ▴' : 'فتح ▾'}</span>
                    </div>
                  </div>
                </button>
              </div>

              {/* Kaaba Sections Drawer (Collapsible) */}
              {kaabaOpen && (
                <nav aria-label="أقسام التطبيق" className="grid grid-cols-1 gap-2 bg-[#04110C]/95 border border-[#D4AF37]/35 rounded-2xl p-3 animate-fadeIn">
                  {/* Box 1: الصلاة والأوقات */}
                  <div className="rounded-xl bg-[#071E17] border border-[#D4AF37]/30 p-2 space-y-1.5">
                    <h2 className="text-[11px] font-bold text-[#F3D078] px-1">الصلاة والأوقات</h2>
                    <div className="grid grid-cols-3 gap-1">
                      <button
                        type="button"
                        onClick={() => navigateToSection('times')}
                        className={mobileTileClass(activeTab === 'times')}
                      >
                        <Clock className="w-4 h-4 text-[#D4AF37] shrink-0" />
                        <span className="text-[10px] leading-tight">المواقيت</span>
                      </button>
                      {onOpenIqamaTab ? (
                        <button
                          type="button"
                          onClick={onOpenIqamaTab}
                          className={mobileTileClass(false)}
                        >
                          <Timer className="w-4 h-4 text-[#F3D078] shrink-0" />
                          <span className="text-[10px] leading-tight">الإقامة</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={onOpenSettings}
                          className={mobileTileClass(false)}
                        >
                          <Timer className="w-4 h-4 text-[#F3D078] shrink-0" />
                          <span className="text-[10px] leading-tight">الإقامة</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => navigateToSection('tracker')}
                        className={mobileTileClass(activeTab === 'tracker')}
                      >
                        <Award className="w-4 h-4 text-[#34D399] shrink-0" />
                        <span className="text-[10px] leading-tight">متتبع الصلوات</span>
                      </button>
                    </div>
                  </div>

                  {/* Box 2: العبادة والقرآن */}
                  <div className="rounded-xl bg-[#071E17] border border-[#D4AF37]/30 p-2 space-y-1.5">
                    <h2 className="text-[11px] font-bold text-[#F3D078] px-1">العبادة والقرآن</h2>
                    <div className="grid grid-cols-3 gap-1">
                      <button
                        type="button"
                        onClick={() => navigateToSection('qibla')}
                        className={mobileTileClass(activeTab === 'qibla')}
                      >
                        <Compass className="w-4 h-4 text-[#34D399] shrink-0" />
                        <span className="text-[10px] leading-tight">القبلة</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => navigateToSection('adhkar')}
                        className={mobileTileClass(activeTab === 'adhkar')}
                      >
                        <Shield className="w-4 h-4 text-[#F3D078] shrink-0" />
                        <span className="text-[10px] leading-tight">الأذكار وحصن المسلم</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => navigateToSection('quran')}
                        className={mobileTileClass(activeTab === 'quran')}
                      >
                        <span className="text-sm leading-none text-[#F3D078]" aria-hidden="true">۞</span>
                        <span className="text-[10px] leading-tight">خزائن النور</span>
                      </button>
                    </div>
                  </div>

                  {/* Box 3: الزاد والرحلة */}
                  <div className="rounded-xl bg-[#071E17] border border-[#D4AF37]/30 p-2 space-y-1.5">
                    <h2 className="text-[11px] font-bold text-[#F3D078] px-1">الزاد والرحلة</h2>
                    <div className="grid grid-cols-3 gap-1">
                      <button
                        type="button"
                        onClick={() => navigateToSection('ai')}
                        className={mobileTileClass(activeTab === 'ai')}
                      >
                        <Sparkles className="w-4 h-4 text-[#F3D078] shrink-0" />
                        <span className="text-[10px] leading-tight">المساعد الشرعي</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => navigateToSection('companion')}
                        className={mobileTileClass(activeTab === 'companion')}
                      >
                        <Calendar className="w-4 h-4 text-[#34D399] shrink-0" />
                        <span className="text-[10px] leading-tight">زاد المسلم · القضاء والحفظ</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => navigateToSection('commute')}
                        className={mobileTileClass(activeTab === 'commute')}
                      >
                        <TrainFront className="w-4 h-4 text-[#34D399] shrink-0" />
                        <span className="text-[10px] leading-tight">وِرد الطريق</span>
                      </button>
                    </div>
                  </div>

                  {/* Box 4: الأسرة والمنزل */}
                  <div className="rounded-xl bg-[#071E17] border border-[#D4AF37]/30 p-2 space-y-1.5">
                    <h2 className="text-[11px] font-bold text-[#F3D078] px-1">الأسرة والمنزل</h2>
                    <button
                      type="button"
                      onClick={() => navigateToSection('family')}
                      className={`w-full min-h-[48px] px-3 py-2 rounded-xl border flex items-center justify-between gap-2 text-right transition-all ${
                        activeTab === 'family'
                          ? 'bg-[#0A241C] border-[#D4AF37] text-[#F3D078] font-bold'
                          : 'bg-[#0A241C]/75 border-[#D4AF37]/20 text-slate-200 hover:border-[#D4AF37]/50'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-[#04130E] border border-[#D4AF37]/35 flex items-center justify-center shrink-0">
                          <Home className="w-3.5 h-3.5 text-[#F3D078]" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-[#F3D078]">البيت المسلم</div>
                          <div className="text-[10px] text-slate-300 truncate">نظام الأسرة وشاشة التلفاز وتحفيز الأطفال...</div>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-[#34D399] shrink-0">دخول ›</span>
                    </button>
                  </div>
                </nav>
              )}

              {/* Daily Khatma Companion Card (Collapsible) */}
              {khatmaOpen && (
                <section
                  aria-label="مُرافق الختمة اليومية"
                  className="rounded-2xl bg-[#071E17] border border-[#D4AF37]/45 p-3.5 space-y-3 shadow-[0_8px_24px_rgba(0,0,0,0.45)] animate-fadeIn"
                >
                  {/* Title Row + Juz Badge + Reset */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <BookOpen className="w-4 h-4 text-[#F3D078] shrink-0" />
                      <h2 className="font-bold text-[#F3D078] font-amiri text-base truncate">
                        مُرافق الختمة اليومية
                      </h2>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="px-2.5 py-0.5 rounded-lg bg-[#0A241C] border border-[#34D399]/40 text-[#34D399] text-[11px] font-bold">
                        {khatmaSchedule.currentJuzName}
                      </span>
                      {khatmaSchedule.totalPagesCompleted > 0 && (
                        <button
                          type="button"
                          onClick={onStartNewKhatma}
                          title="بدء ختمة جديدة من الجزء الأول"
                          className="p-1.5 rounded-lg bg-[#0A241C] border border-[#D4AF37]/30 text-[#D4AF37] hover:border-[#F3D078] transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Today & Total Progress Indicators */}
                  <div className="flex items-center justify-between gap-2 text-xs tabular-nums">
                    <span className="text-slate-200">
                      اليوم:{' '}
                      <strong className="text-[#F3D078] font-bold">
                        {khatmaSchedule.pagesCompletedToday}/{khatmaSchedule.dailyTargetPages} ص
                      </strong>
                    </span>
                    <span className="text-slate-300">
                      <strong className="text-[#34D399] font-bold">
                        {khatmaSchedule.totalPagesCompleted}/{TOTAL_MUSHAF_PAGES} ({khatmaSchedule.overallPercent}%)
                      </strong>
                    </span>
                  </div>

                  {/* Progress Bar + Daily Percentage */}
                  <div className="flex items-center gap-2.5">
                    <div className="flex-1 h-2.5 rounded-full bg-[#04130E] border border-[#D4AF37]/30 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-l from-[#F3D078] via-[#D4AF37] to-[#34D399] transition-all duration-300"
                        style={{
                          width: `${Math.max(
                            khatmaSchedule.dailyPercent,
                            khatmaSchedule.pagesCompletedToday > 0 ? 4 : 0
                          )}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs font-mono font-bold text-[#F3D078] tabular-nums shrink-0">
                      {khatmaSchedule.dailyPercent}%
                    </span>
                  </div>

                  {/* 5-Prayer Grid */}
                  <div className="grid grid-cols-5 gap-1.5">
                    {KHATMA_PRAYER_ORDER.map((prayerKey) => {
                      const wird = khatmaSchedule.wirdByPrayer[prayerKey];
                      const label = getPrayerLabel(prayerKey);
                      return (
                        <div
                          key={prayerKey}
                          className={`rounded-xl border overflow-hidden flex flex-col transition-all ${
                            wird.isCompleted
                              ? 'bg-[#082E22] border-[#34D399]/65 text-emerald-100'
                              : 'bg-[#0A241C] border-[#D4AF37]/25 text-slate-200'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => onOpenWirdModal(prayerKey, label)}
                            title={`قراءة وِرد ${label}: ${wird.summary}`}
                            className="min-h-[34px] px-1 py-1.5 text-[11px] font-bold hover:text-[#F3D078] truncate transition-colors"
                          >
                            {label}
                          </button>
                          <button
                            type="button"
                            onClick={() => onTogglePrayerWird(prayerKey)}
                            title={wird.isCompleted ? `تم إنجاز وِرد ${label}` : `تسجيل إنجاز وِرد ${label}`}
                            aria-label={wird.isCompleted ? `تم إنجاز وِرد ${label}` : `تسجيل إنجاز وِرد ${label}`}
                            className={`min-h-[28px] w-full border-t flex items-center justify-center transition-colors ${
                              wird.isCompleted
                                ? 'bg-[#34D399]/20 border-[#34D399]/40 text-[#34D399]'
                                : 'border-[#D4AF37]/20 text-slate-400 hover:text-[#F3D078]'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5 stroke-[2.75]" />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* 30 Days / 60 Days Plan Switcher */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => onSwitchKhatmaPlan(30)}
                      className={`min-h-[40px] px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                        khatmaState.plan === 30
                          ? 'bg-gradient-to-r from-[#D4AF37] via-[#F3D078] to-[#D4AF37] border-[#F3D078] text-[#04130E] shadow'
                          : 'bg-[#04130E] border-[#D4AF37]/30 text-slate-200 hover:border-[#F3D078]/60'
                      }`}
                    >
                      30 يوماً (4 صفحات)
                    </button>
                    <button
                      type="button"
                      onClick={() => onSwitchKhatmaPlan(60)}
                      className={`min-h-[40px] px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                        khatmaState.plan === 60
                          ? 'bg-gradient-to-r from-[#D4AF37] via-[#F3D078] to-[#D4AF37] border-[#F3D078] text-[#04130E] shadow'
                          : 'bg-[#04130E] border-[#D4AF37]/30 text-slate-200 hover:border-[#F3D078]/60'
                      }`}
                    >
                      60 يوماً (صفحتان)
                    </button>
                  </div>
                </section>
              )}
            </div>
          );
        })()}
      </div>

      {/* =====================================================================
          DESKTOP HORIZONTAL LAYOUT (>= xl)
          ===================================================================== */}
      <div className="hidden xl:block max-w-[1440px] mx-auto">
        <div className="flex flex-col gap-2.5">
          {/* Top Row: Brand/Location/Weather (Right) + Desktop Actions & Settings (Left) */}
          <div className="flex items-center justify-between w-full gap-2.5">
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => navigateToSection('times')}
                title="العودة إلى الصفحة الرئيسية (المواقيت)"
                className="flex items-center gap-3 text-right rounded-xl focus:outline-none focus:ring-2 focus:ring-[#fbbf24]/60 hover:opacity-95 transition-opacity"
              >
                {renderBrandEmblem()}
                <div className="leading-tight">
                  <h1 className="text-xl font-bold text-[#fbbf24] tracking-wide font-amiri whitespace-nowrap">
                    مواقيت الصلاة
                  </h1>
                  <p className="text-[11px] text-slate-300 flex items-center gap-1 whitespace-nowrap">
                    <MapPin className="w-3 h-3 text-[#e5b869] shrink-0" />
                    <span>{currentLocation.nameAr}، {currentLocation.countryAr}</span>
                  </p>
                </div>
              </button>

              <div className="shrink-0 ms-1">
                <WeatherWidget currentLocation={currentLocation} compact={true} />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-1.5">
              <button
                onClick={handleUnlockAudio}
                className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold border transition-all whitespace-nowrap shrink-0 ${
                  isUnlocked
                    ? 'bg-emerald-950/75 border-emerald-500/60 text-emerald-300'
                    : 'bg-[#05221c] border-[#e5b869]/30 text-[#fbbf24] hover:bg-[#072f27]'
                }`}
                title="تفعيل إذن الصوت في المتصفح"
              >
                {isUnlocked ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>الصوت مفعّل</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-[#fbbf24]" />
                    <span>تفعيل الصوت</span>
                  </>
                )}
              </button>

              <button
                onClick={handleToggleAdhan}
                title={playerState === 'playing' ? 'إيقاف الأذان' : 'سماع الأذان الحقيقي (MP3)'}
                className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl transition-all text-xs font-semibold border whitespace-nowrap shrink-0 ${
                  playerState === 'playing'
                    ? 'bg-rose-600 border-rose-500 text-white shadow-md shadow-rose-950/50'
                    : 'bg-[#05221c] border-emerald-600/40 text-emerald-300 hover:bg-[#072f27]'
                }`}
              >
                {playerState === 'playing' ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>إيقاف الأذان</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>سماع الأذان</span>
                  </>
                )}
              </button>

              <button
                onClick={onCycleTheme}
                onContextMenu={(e) => {
                  e.preventDefault();
                  onOpenBackgroundPicker();
                }}
                title={
                  autoThemeStatusBadge
                    ? `${autoThemeStatusBadge} — انقر للتبديل اليدوي للمظهر أو بالزر الأيمن لخلفيات المساجد`
                    : `التبديل السريع للمظهر (${activeThemeDef.nameAr}) — اضغط بالزر الأيمن لخلفيات المساجد`
                }
                className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-[#05221c] text-slate-200 hover:bg-[#072f27] transition-colors text-xs font-semibold border border-[#e5b869]/30 whitespace-nowrap shrink-0"
              >
                <ImageIcon className="w-3.5 h-3.5 text-[#fbbf24]" />
                <span>
                  خلفيات المساجد · {activeThemeDef.nameAr}
                  {autoThemeStatusBadge ? (autoThemeStatusBadge.startsWith('☀️') ? ' · ☀️' : ' · 🌙') : ''}
                </span>
              </button>

              {(onOpenStandbyMode || onToggleTvMode) && (
                <button
                  type="button"
                  onClick={onOpenStandbyMode ?? onToggleTvMode}
                  title="فتح نافذة العرض الموحّدة (وضع المنضدة الفردي وشاشة البيت / المصلى)"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#111C18] text-[#F3CA63] hover:bg-[#172822] transition-all border border-[#D4AF37]/55 text-xs font-bold whitespace-nowrap shrink-0 shadow-sm"
                >
                  <span className="leading-none">🖥️</span>
                  <span>وضع العرض</span>
                </button>
              )}

              {onOpenIstikharaHajah && (
                <button
                  type="button"
                  onClick={onOpenIstikharaHajah}
                  title="دليل صلاة الاستخارة والحاجة مع إبقاء الشاشة مضاءة"
                  className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-[#111C18] text-[#F3CA63] hover:bg-[#172822] transition-all border border-[#D4AF37]/45 text-xs font-bold whitespace-nowrap shrink-0"
                >
                  <span className="leading-none">🤲</span>
                  <span>الاستخارة والحاجة</span>
                </button>
              )}

              {onOpenWidgetsStudio && (
                <button
                  type="button"
                  onClick={onOpenWidgetsStudio}
                  title="استوديو الودجات واختصارات الشاشة الرئيسية وشاشة القفل"
                  className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-[#111C18] text-[#F3CA63] hover:bg-[#172822] transition-all border border-[#D4AF37]/45 text-xs font-bold whitespace-nowrap shrink-0"
                >
                  <span className="leading-none">📱</span>
                  <span>الودجات</span>
                </button>
              )}

              {onOpenSteadfastness && (
                <button
                  onClick={onOpenSteadfastness}
                  title="فتح سجل استقامة القلب وخريطة الالتزام الحرارية"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-[#0b3d32] to-[#05221c] text-[#fbbf24] hover:from-[#0f4f41] hover:to-[#072f27] transition-all border border-[#e5b869]/55 text-xs font-bold whitespace-nowrap shrink-0 shadow-sm"
                >
                  <Award className="w-3.5 h-3.5 text-[#fbbf24]" />
                  <span>سِجلّ الاستقامة</span>
                </button>
              )}

              <PWAInstallButton />

              <button
                type="button"
                onClick={onOpenSettings}
                title="الإعدادات والمدن"
                aria-label="الإعدادات"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-br from-[#0b3d32] to-[#05221c] text-[#fbbf24] hover:from-[#0f4f41] hover:to-[#072f27] transition-all border border-[#e5b869]/65 text-xs font-bold whitespace-nowrap shadow-[0_0_16px_rgba(229,184,105,0.32)] hover:shadow-[0_0_24px_rgba(251,191,36,0.48)] shrink-0"
              >
                <Settings className="w-4 h-4" />
                <span>الإعدادات</span>
              </button>
            </div>
          </div>

          {/* Center Zone: Desktop Navigation Links */}
          <nav className="flex items-center justify-center gap-1 bg-[#031612]/85 p-1 rounded-2xl border border-[#e5b869]/25 overflow-x-auto w-full scrollbar-none shadow-inner">
            <button
              onClick={() => navigateToSection('times')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap shrink-0 ${
                activeTab === 'times'
                  ? 'bg-gradient-to-r from-[#e5b869]/25 via-emerald-700/40 to-teal-800/45 text-[#fbbf24] border border-[#e5b869]/55 shadow-[0_0_14px_rgba(229,184,105,0.2)] font-bold'
                  : 'text-slate-300 hover:text-[#fbbf24] hover:bg-[#072a22]/60 border border-transparent'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-[#e5b869]" />
              <span>المواقيت</span>
            </button>

            {onOpenIqamaTab && (
              <button
                type="button"
                onClick={onOpenIqamaTab}
                title="تعديل أوقات الإقامة وأصوات الشيوخ الحقيقية"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap shrink-0 text-slate-200 hover:text-[#fbbf24] hover:bg-[#072a22]/60 border border-[#e5b869]/25 hover:border-[#e5b869]/55"
              >
                <Timer className="w-3.5 h-3.5 text-[#fbbf24]" />
                <span>الإقامة</span>
              </button>
            )}

            <button
              onClick={() => navigateToSection('tracker')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap shrink-0 ${
                activeTab === 'tracker'
                  ? 'bg-gradient-to-r from-[#e5b869]/25 via-emerald-700/40 to-teal-800/45 text-[#fbbf24] border border-[#e5b869]/55 shadow-[0_0_14px_rgba(229,184,105,0.2)] font-bold'
                  : 'text-slate-300 hover:text-[#fbbf24] hover:bg-[#072a22]/60 border border-transparent'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-[#fbbf24]" />
              <span>متتبع الصلوات</span>
            </button>

            <button
              onClick={() => navigateToSection('qibla')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap shrink-0 ${
                activeTab === 'qibla'
                  ? 'bg-gradient-to-r from-[#e5b869]/25 via-emerald-700/40 to-teal-800/45 text-[#fbbf24] border border-[#e5b869]/55 shadow-[0_0_14px_rgba(229,184,105,0.2)] font-bold'
                  : 'text-slate-300 hover:text-[#fbbf24] hover:bg-[#072a22]/60 border border-transparent'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-emerald-400" />
              <span>القبلة</span>
            </button>

            <button
              onClick={() => navigateToSection('adhkar')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap shrink-0 ${
                activeTab === 'adhkar'
                  ? 'bg-gradient-to-r from-[#e5b869]/25 via-emerald-700/40 to-teal-800/45 text-[#fbbf24] border border-[#e5b869]/55 shadow-[0_0_14px_rgba(229,184,105,0.2)] font-bold'
                  : 'text-slate-300 hover:text-[#fbbf24] hover:bg-[#072a22]/60 border border-transparent'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-[#fbbf24]" />
              <span>الأذكار وحصن المسلم</span>
            </button>

            <button
              onClick={() => navigateToSection('quran')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap shrink-0 ${
                activeTab === 'quran'
                  ? 'bg-gradient-to-r from-[#e5b869]/25 via-emerald-700/40 to-teal-800/45 text-[#fbbf24] border border-[#e5b869]/55 shadow-[0_0_14px_rgba(229,184,105,0.2)] font-bold'
                  : 'text-slate-300 hover:text-[#fbbf24] hover:bg-[#072a22]/60 border border-transparent'
              }`}
            >
              <span className="text-xs leading-none text-[#fbbf24]">۞</span>
              <span>خزائن النور</span>
            </button>

            <button
              onClick={() => navigateToSection('ai')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap shrink-0 ${
                activeTab === 'ai'
                  ? 'bg-gradient-to-r from-[#e5b869]/25 via-emerald-700/40 to-teal-800/45 text-[#fbbf24] border border-[#e5b869]/55 shadow-[0_0_14px_rgba(229,184,105,0.2)] font-bold'
                  : 'text-slate-300 hover:text-[#fbbf24] hover:bg-[#072a22]/60 border border-transparent'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#fbbf24]" />
              <span>المساعد الشرعي</span>
            </button>

            <button
              onClick={() => navigateToSection('companion')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap shrink-0 ${
                activeTab === 'companion'
                  ? 'bg-gradient-to-r from-[#e5b869]/25 via-emerald-700/40 to-teal-800/45 text-[#fbbf24] border border-[#e5b869]/55 shadow-[0_0_14px_rgba(229,184,105,0.2)] font-bold'
                  : 'text-slate-300 hover:text-[#fbbf24] hover:bg-[#072a22]/60 border border-transparent'
              }`}
              title="التقويم الهجري · رخصة المسافر · الرقية · قضاء الفوائت · الحفظ والتسميع"
            >
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span>زاد المسلم · القضاء والحفظ</span>
            </button>

            <button
              onClick={() => navigateToSection('commute')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap shrink-0 ${
                activeTab === 'commute'
                  ? 'bg-gradient-to-r from-[#e5b869]/25 via-emerald-700/40 to-teal-800/45 text-[#fbbf24] border border-[#e5b869]/55 shadow-[0_0_14px_rgba(229,184,105,0.2)] font-bold'
                  : 'text-slate-300 hover:text-[#fbbf24] hover:bg-[#072a22]/60 border border-transparent'
              }`}
              title="وضع المترو والمواصلات بيد واحدة • بدون نت"
            >
              <TrainFront className="w-3.5 h-3.5 text-emerald-400" />
              <span>🚇 وِرد الطريق</span>
            </button>

            <button
              onClick={() => navigateToSection('family')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap shrink-0 ${
                activeTab === 'family'
                  ? 'bg-gradient-to-r from-[#e5b869]/25 via-emerald-700/40 to-teal-800/45 text-[#fbbf24] border border-[#e5b869]/55 shadow-[0_0_14px_rgba(229,184,105,0.2)] font-bold'
                  : 'text-slate-300 hover:text-[#fbbf24] hover:bg-[#072a22]/60 border border-transparent'
              }`}
              title="نظام البيت المسلم للأسرة وشاشة التلفاز وتحفيز الأطفال على الصلاة"
            >
              <Home className="w-3.5 h-3.5 text-[#fbbf24]" />
              <span>البيت المسلم</span>
            </button>
          </nav>
        </div>

        {/* Desktop Daily Khatma Companion Strip */}
        <div className="mt-2 pt-2 border-t border-[#e5b869]/20">
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs">
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-[#fbbf24] shrink-0" />
                <span className="font-bold text-[#fbbf24] font-amiri text-sm whitespace-nowrap">
                  مُرافق الختمة اليومية
                </span>
              </div>
              <span className="text-[#e5b869]/40" aria-hidden="true">·</span>
              <span className="text-[11px] font-bold text-emerald-300 whitespace-nowrap">
                {khatmaSchedule.currentJuzName}
              </span>
              <span className="text-[#e5b869]/40" aria-hidden="true">·</span>
              <span className="text-[11px] text-slate-200 whitespace-nowrap">
                اليوم:{' '}
                <strong className="text-[#fbbf24] tabular-nums">
                  {khatmaSchedule.pagesCompletedToday}/{khatmaSchedule.dailyTargetPages} ص
                </strong>
              </span>
              <span className="text-[#e5b869]/40" aria-hidden="true">·</span>
              <span className="text-[11px] text-slate-300 whitespace-nowrap">
                المصحف:{' '}
                <strong className="text-emerald-300 tabular-nums">
                  {khatmaSchedule.totalPagesCompleted}/{TOTAL_MUSHAF_PAGES} ({khatmaSchedule.overallPercent}%)
                </strong>
              </span>
            </div>

            <div className="flex items-center justify-end gap-3">
              <div className="flex items-center gap-2 min-w-[150px]">
                <div className="flex-1 h-2 rounded-full bg-[#02100d] border border-[#e5b869]/25 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-l from-[#fbbf24] via-[#e5b869] to-emerald-400 transition-all duration-300"
                    style={{
                      width: `${Math.max(
                        khatmaSchedule.dailyPercent,
                        khatmaSchedule.pagesCompletedToday > 0 ? 4 : 0
                      )}%`,
                    }}
                  />
                </div>
                <span className="text-[11px] font-mono font-bold text-[#fbbf24] tabular-nums shrink-0">
                  {khatmaSchedule.dailyPercent}%
                </span>
              </div>

              <div className="flex items-center gap-1">
                {KHATMA_PRAYER_ORDER.map((prayerKey) => {
                  const wird = khatmaSchedule.wirdByPrayer[prayerKey];
                  const label = getPrayerLabel(prayerKey);
                  return (
                    <div
                      key={prayerKey}
                      className={`flex items-center rounded-lg border text-[11px] transition-all shrink-0 overflow-hidden ${
                        wird.isCompleted
                          ? 'bg-emerald-950/85 border-emerald-500/60 text-emerald-200'
                          : 'bg-[#041d17]/90 border-[#e5b869]/30 text-slate-200 hover:border-[#fbbf24]/70'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => onOpenWirdModal(prayerKey, label)}
                        title={`قراءة وِرد ${label}: ${wird.summary}`}
                        className="px-2 py-1 hover:text-[#fbbf24] font-medium whitespace-nowrap transition-colors"
                      >
                        {label}
                      </button>
                      <button
                        type="button"
                        onClick={() => onTogglePrayerWird(prayerKey)}
                        title={wird.isCompleted ? `تم إنجاز وِرد ${label}` : `تسجيل إنجاز وِرد ${label}`}
                        className={`px-1.5 py-1 border-r transition-colors ${
                          wird.isCompleted
                            ? 'bg-emerald-500/25 border-emerald-500/40 text-emerald-300'
                            : 'border-[#e5b869]/20 text-slate-400 hover:text-[#fbbf24]'
                        }`}
                      >
                        <Check className="w-3 h-3 stroke-[2.75]" />
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <div className="flex items-center gap-0.5 bg-[#02120e] p-0.5 rounded-lg border border-[#e5b869]/30">
                  <button
                    type="button"
                    onClick={() => onSwitchKhatmaPlan(30)}
                    className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all whitespace-nowrap ${
                      khatmaState.plan === 30
                        ? 'bg-gradient-to-r from-[#fbbf24] via-[#e5b869] to-emerald-400 text-slate-950 shadow'
                        : 'text-slate-300 hover:text-[#fbbf24]'
                    }`}
                  >
                    30 يوماً (4 ص)
                  </button>
                  <button
                    type="button"
                    onClick={() => onSwitchKhatmaPlan(60)}
                    className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all whitespace-nowrap ${
                      khatmaState.plan === 60
                        ? 'bg-gradient-to-r from-[#fbbf24] via-[#e5b869] to-emerald-400 text-slate-950 shadow'
                        : 'text-slate-300 hover:text-[#fbbf24]'
                    }`}
                  >
                    60 يوماً (صفحتان)
                  </button>
                </div>

                {khatmaSchedule.totalPagesCompleted > 0 && (
                  <button
                    type="button"
                    onClick={onStartNewKhatma}
                    title="بدء ختمة جديدة من الجزء الأول"
                    className="p-1.5 rounded-lg bg-[#041d17] border border-[#e5b869]/30 text-[#e5b869] hover:border-[#fbbf24] hover:text-[#fbbf24] transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
