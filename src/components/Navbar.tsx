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
  ChevronDown,
  ChevronUp,
  Timer,
  Calendar,
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
  activeTab: 'times' | 'tracker' | 'qibla' | 'adhkar' | 'quran' | 'ai' | 'companion';
  setActiveTab: (tab: 'times' | 'tracker' | 'qibla' | 'adhkar' | 'quran' | 'ai' | 'companion') => void;
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
  const [isKhatmaExpandedMobile, setIsKhatmaExpandedMobile] = useState<boolean>(false);
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

  return (
    <header className="sticky top-0 z-40 bg-[#03120f]/90 backdrop-blur-xl border-b border-[#e5b869]/30 px-3 lg:px-5 py-2.5 shadow-[0_6px_30px_rgba(0,0,0,0.45)]">
      <div className="max-w-[1440px] mx-auto flex flex-col gap-2.5">
        {/* Top Row: Brand/Location/Weather (Right) + Quick Actions & Settings (Left) */}
        <div className="flex flex-wrap items-center justify-between w-full gap-2.5">
          {/* Right Zone: Golden Crescent & 8-Pointed Star Emblem + App Name + Location + Integrated Weather Pill */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0c3b30] to-[#031712] flex items-center justify-center shadow-[0_0_16px_rgba(229,184,105,0.22)] border border-[#e5b869]/55 shrink-0">
              <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                {/* 8-Pointed Star (Rub el Hizb) frame */}
                <rect x="6" y="6" width="20" height="20" rx="1.5" stroke="#e5b869" strokeWidth="1.2" strokeOpacity="0.45" />
                <rect x="6" y="6" width="20" height="20" rx="1.5" stroke="#e5b869" strokeWidth="1.2" strokeOpacity="0.45" transform="rotate(45 16 16)" />
                {/* Golden Crescent */}
                <path
                  d="M17.8 9.2C14.1 9.5 11.2 12.6 11.2 16.4C11.2 20.4 14.4 23.6 18.4 23.6C20.2 23.6 21.8 22.9 23.1 21.8C21.8 22.2 20.3 22.1 19 21.5C16.2 20.2 14.9 16.9 16.2 14C16.9 12.3 18.2 11 19.9 10.3C19.2 9.6 18.5 9.2 17.8 9.2Z"
                  fill="#fbbf24"
                />
                {/* 8-Pointed Inner Star */}
                <polygon
                  points="21.5,11.5 22.2,13.1 23.8,13.8 22.2,14.5 21.5,16.1 20.8,14.5 19.2,13.8 20.8,13.1"
                  fill="#fef08a"
                />
              </svg>
            </div>
            <div className="leading-tight">
              <h1 className="text-xl font-bold text-[#fbbf24] tracking-wide font-amiri whitespace-nowrap">
                مواقيت الصلاة
              </h1>
              <p className="text-[11px] text-slate-300 flex items-center gap-1 whitespace-nowrap">
                <MapPin className="w-3 h-3 text-[#e5b869] shrink-0" />
                <span>{currentLocation.nameAr}، {currentLocation.countryAr}</span>
              </p>
            </div>

            {/* Integrated Weather Pill */}
            <div className="hidden sm:block shrink-0 ms-1">
              <WeatherWidget currentLocation={currentLocation} compact={true} />
            </div>
          </div>

          {/* Mobile & Tablet Action Buttons (< xl) */}
          <div className="flex flex-wrap items-center justify-end gap-1.5 xl:hidden">
            <button
              onClick={onCycleTheme}
              onContextMenu={(e) => {
                e.preventDefault();
                onOpenBackgroundPicker();
              }}
              title={
                autoThemeStatusBadge
                  ? `${autoThemeStatusBadge} · تبديل سريع للثيم (${activeThemeDef.nameAr}) — انقر باليمين للخلفيات`
                  : `تبديل سريع للثيم (${activeThemeDef.nameAr}) — انقر باليمين للخلفيات`
              }
              className="p-2 rounded-lg bg-[#06261f] border border-[#e5b869]/30 text-[#fbbf24] hover:bg-[#09362c] transition-colors relative"
            >
              <ImageIcon className="w-4 h-4" />
            </button>
            <button
              onClick={handleToggleAdhan}
              title={playerState === 'playing' ? 'إيقاف الأذان' : 'سماع الأذان'}
              className={`p-2 rounded-lg border transition-colors ${
                playerState === 'playing'
                  ? 'bg-rose-900/60 border-rose-500/50 text-rose-200'
                  : 'bg-[#06261f] border-[#e5b869]/30 text-emerald-300 hover:bg-[#09362c]'
              }`}
            >
              {playerState === 'playing' ? <Square className="w-4 h-4 fill-current" /> : <Volume2 className="w-4 h-4" />}
            </button>
            {(onOpenStandbyMode || onToggleTvMode) && (
              <button
                type="button"
                onClick={onOpenStandbyMode ?? onToggleTvMode}
                title="وضع العرض الموحّد (وضع المنضدة الفردي وشاشة البيت والمصلى)"
                className="px-2.5 py-2 rounded-lg bg-[#111C18] border border-[#D4AF37]/55 text-[#F3CA63] hover:bg-[#172822] text-xs font-bold flex items-center gap-1 whitespace-nowrap shrink-0 transition-colors shadow-sm"
              >
                <span className="leading-none">🖥️</span>
                <span>وضع العرض</span>
              </button>
            )}
            {onOpenIstikharaHajah && (
              <button
                type="button"
                onClick={onOpenIstikharaHajah}
                title="مُساعد صلاة الاستخارة والحاجة"
                className="p-2 rounded-lg bg-[#111C18] border border-[#D4AF37]/50 text-[#F3CA63] hover:bg-[#172822] text-xs font-bold flex items-center justify-center transition-colors"
              >
                <span className="leading-none">🤲</span>
              </button>
            )}
            {onOpenWidgetsStudio && (
              <button
                type="button"
                onClick={onOpenWidgetsStudio}
                title="الودجات واختصارات الشاشة"
                className="p-2 rounded-lg bg-[#111C18] border border-[#D4AF37]/50 text-[#F3CA63] hover:bg-[#172822] text-xs font-bold flex items-center justify-center transition-colors"
              >
                <span className="leading-none">📱</span>
              </button>
            )}
            {onOpenSteadfastness && (
              <button
                onClick={onOpenSteadfastness}
                title="سِجلّ استقامة القلب"
                className="p-2 rounded-lg bg-[#083027] border border-[#e5b869]/60 text-[#fbbf24] text-xs font-bold flex items-center justify-center transition-colors"
              >
                <Award className="w-4 h-4" />
              </button>
            )}
            <PWAInstallButton />
            <button
              type="button"
              onClick={onOpenSettings}
              title="الإعدادات"
              aria-label="الإعدادات"
              className="flex items-center gap-1 px-2.5 py-2 rounded-lg bg-[#083027] border border-[#e5b869]/70 text-[#fbbf24] text-xs font-bold shadow-[0_0_12px_rgba(229,184,105,0.3)] hover:bg-[#0b3e33] transition-colors shrink-0"
            >
              <Settings className="w-4 h-4" />
              <span>الإعدادات</span>
            </button>
          </div>

          {/* Desktop Action Buttons (>= xl) */}
          <div className="hidden xl:flex flex-wrap items-center justify-end gap-1.5">
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

        {/* Center Zone: Glassmorphic Gold-Rimmed Navigation Links */}
        <nav className="flex items-center xl:justify-center gap-1 bg-[#031612]/85 p-1 rounded-2xl border border-[#e5b869]/25 overflow-x-auto w-full scrollbar-none shadow-inner">
          <button
            onClick={() => {
              setActiveTab('times');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
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
            onClick={() => {
              setActiveTab('tracker');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
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
            onClick={() => {
              setActiveTab('qibla');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
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
            onClick={() => {
              setActiveTab('adhkar');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
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
            onClick={() => {
              setActiveTab('quran');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'quran'
                ? 'bg-gradient-to-r from-[#e5b869]/25 via-emerald-700/40 to-teal-800/45 text-[#fbbf24] border border-[#e5b869]/55 shadow-[0_0_14px_rgba(229,184,105,0.2)] font-bold'
                : 'text-slate-300 hover:text-[#fbbf24] hover:bg-[#072a22]/60 border border-transparent'
            }`}
          >
            <span className="text-xs leading-none">📖</span>
            <span>القرآن والأسماء</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('ai');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
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
            onClick={() => {
              setActiveTab('companion');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'companion'
                ? 'bg-gradient-to-r from-[#e5b869]/25 via-emerald-700/40 to-teal-800/45 text-[#fbbf24] border border-[#e5b869]/55 shadow-[0_0_14px_rgba(229,184,105,0.2)] font-bold'
                : 'text-slate-300 hover:text-[#fbbf24] hover:bg-[#072a22]/60 border border-transparent'
            }`}
            title="التقويم الهجري الشهري · رخصة المسافر · الرقية الشرعية"
          >
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            <span>التقويم والسفر والرقية</span>
          </button>
        </nav>
      </div>

      {/* Top Bar Daily Khatma Companion Strip (شريط مُرافق الختمة اليومية) */}
      <div className="max-w-[1440px] mx-auto mt-2 pt-2 border-t border-[#e5b869]/20">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2">
          {/* Right: Title, Juz, Today & Total Progress + Mobile Collapse Toggle */}
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
              <span className="text-[#e5b869]/40 hidden sm:inline" aria-hidden="true">·</span>
              <span className="text-[11px] text-slate-200 whitespace-nowrap">
                اليوم:{' '}
                <strong className="text-[#fbbf24] tabular-nums">
                  {khatmaSchedule.pagesCompletedToday}/{khatmaSchedule.dailyTargetPages} ص
                </strong>
              </span>
              <span className="text-[#e5b869]/40 hidden sm:inline" aria-hidden="true">·</span>
              <span className="text-[11px] text-slate-300 hidden sm:inline whitespace-nowrap">
                المصحف:{' '}
                <strong className="text-emerald-300 tabular-nums">
                  {khatmaSchedule.totalPagesCompleted}/{TOTAL_MUSHAF_PAGES} ({khatmaSchedule.overallPercent}%)
                </strong>
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsKhatmaExpandedMobile((prev) => !prev)}
              className="lg:hidden flex items-center gap-1 px-2 py-1 rounded-lg bg-[#05221c] border border-[#e5b869]/30 text-[11px] font-bold text-[#fbbf24] shrink-0"
              title="عرض أو إخفاء تفاصيل الختمة"
            >
              <span className="font-mono tabular-nums">{khatmaSchedule.dailyPercent}%</span>
              {isKhatmaExpandedMobile ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Center & Left: Progress Bar + 5 Prayer Wird Pills + Plan Switcher */}
          <div
            className={`${
              isKhatmaExpandedMobile ? 'flex' : 'hidden lg:flex'
            } flex-col sm:flex-row lg:items-center justify-between lg:justify-end gap-2 lg:gap-3 flex-wrap`}
          >
            {/* Progress Bar */}
            <div className="flex items-center gap-2 min-w-[130px] sm:min-w-[150px]">
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

            {/* Quick 5-Prayer Wird Pills */}
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
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

            {/* Plan Switcher + Reset */}
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
    </header>
  );
};
