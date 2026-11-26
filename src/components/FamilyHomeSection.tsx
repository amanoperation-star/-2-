import React, { useEffect, useState } from 'react';
import {
  Home,
  Users,
  Tv,
  Sparkles,
  Plus,
  Check,
  Edit3,
  Trash2,
  BellRing,
  BookOpen,
  Star,
  Award,
  Volume2,
  Minus,
} from 'lucide-react';
import { CityLocation, PrayerTimeData, UserSettings } from '../types';
import {
  FAMILY_AVATAR_OPTIONS,
  FAMILY_PRAYER_LABELS,
  FAMILY_PRAYER_ORDER,
  FAMILY_ROLE_LABELS,
  FAMILY_WEEKLY_COVENANT_ITEMS,
  FamilyHomeState,
  FamilyMember,
  FamilyMemberRole,
  FamilyPrayerKey,
  FamilyPrayerStatus,
  createEmptyFamilyDayLog,
  getFamilyWeeklySummary,
  getMemberDayLog,
  getMemberDayStats,
  getMemberEarnedBadges,
  getMemberStreakDays,
  getNextHomeJamaahAlert,
  getTodayFamilyDateKey,
  getWeekKey,
  loadFamilyHomeState,
  saveFamilyHomeState,
} from '../utils/familyHomeData';
import { adhanPlayer } from '../utils/audioAdhan';
import { KidWuduSalahModal } from './KidWuduSalahModal';
import { FamilyLivingRoomBoard } from './FamilyLivingRoomBoard';

interface FamilyHomeSectionProps {
  prayerTimes: PrayerTimeData;
  currentLocation: CityLocation;
  settings: UserSettings;
  onRegisterBackHandler?: (handler: (() => boolean) | null) => void;
}

export const FamilyHomeSection: React.FC<FamilyHomeSectionProps> = ({
  prayerTimes,
  currentLocation,
  settings,
  onRegisterBackHandler,
}) => {
  const [familyState, setFamilyState] = useState<FamilyHomeState>(() => loadFamilyHomeState());
  const [isLivingRoomOpen, setIsLivingRoomOpen] = useState<boolean>(false);
  const [isKidGuideOpen, setIsKidGuideOpen] = useState<boolean>(false);
  const [kidGuideInitialMode, setKidGuideInitialMode] = useState<'wudu' | 'salah'>('wudu');

  // Inline Member Add/Edit Form
  const [showMemberForm, setShowMemberForm] = useState<boolean>(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [memberNameInput, setMemberNameInput] = useState<string>('');
  const [memberRoleInput, setMemberRoleInput] = useState<FamilyMemberRole>('child');
  const [memberAvatarInput, setMemberAvatarInput] = useState<string>('⭐');
  const [confirmDeleteMemberId, setConfirmDeleteMemberId] = useState<string | null>(null);

  // Editable Family Name
  const [isEditingTitle, setIsEditingTitle] = useState<boolean>(false);
  const [familyTitleInput, setFamilyTitleInput] = useState<string>(familyState.customFamilyTitle);

  // Celebration notice when a member completes all 5 prayers
  const [celebrationBanner, setCelebrationBanner] = useState<{
    name: string;
    role: FamilyMemberRole;
  } | null>(null);

  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  // Sync back handler for Android TV / Hardware back button
  useEffect(() => {
    if (!onRegisterBackHandler) return;
    const handler = (): boolean => {
      if (isKidGuideOpen) {
        setIsKidGuideOpen(false);
        return true;
      }
      if (isLivingRoomOpen) {
        setIsLivingRoomOpen(false);
        return true;
      }
      if (showMemberForm) {
        setShowMemberForm(false);
        return true;
      }
      return false;
    };
    onRegisterBackHandler(handler);
    return () => onRegisterBackHandler(null);
  }, [onRegisterBackHandler, isKidGuideOpen, isLivingRoomOpen, showMemberForm]);

  const updateState = (updater: (prev: FamilyHomeState) => FamilyHomeState) => {
    setFamilyState((prev) => {
      const next = updater(prev);
      saveFamilyHomeState(next);
      return next;
    });
  };

  const todayKey = getTodayFamilyDateKey(now);
  const weekKey = getWeekKey(now);
  const isFriday = now.getDay() === 5;
  const summary = getFamilyWeeklySummary(familyState, now);
  const jamaahAlert = getNextHomeJamaahAlert(
    prayerTimes,
    familyState.jamaahAlertMinutesBefore,
    now
  );

  const getPrayerLabel = (pk: FamilyPrayerKey) =>
    pk === 'dhuhr' && isFriday ? 'الجمعة' : FAMILY_PRAYER_LABELS[pk];

  const handleCycleMemberPrayer = (memberId: string, prayerKey: FamilyPrayerKey) => {
    const member = familyState.members.find((m) => m.id === memberId);
    const prevStats = getMemberDayStats(familyState, memberId, todayKey);

    updateState((prev) => {
      const dayLogs = prev.logsByDate[todayKey] || {};
      const currentLog = dayLogs[memberId] || createEmptyFamilyDayLog();
      const curStatus = currentLog.prayers?.[prayerKey] || 'none';
      const nextStatus: FamilyPrayerStatus =
        curStatus === 'none' ? 'jamaah' : curStatus === 'jamaah' ? 'solo' : 'none';

      const nextLog = {
        ...currentLog,
        prayers: {
          ...currentLog.prayers,
          [prayerKey]: nextStatus,
        },
      };

      const updated = {
        ...prev,
        logsByDate: {
          ...prev.logsByDate,
          [todayKey]: {
            ...dayLogs,
            [memberId]: nextLog,
          },
        },
      };

      if (member) {
        const nextStats = getMemberDayStats(updated, memberId, todayKey);
        if (!prevStats.allFiveDone && nextStats.allFiveDone) {
          setCelebrationBanner({ name: member.name, role: member.role });
        }
      }
      return updated;
    });
  };

  const handleToggleMemberAdhkar = (memberId: string) => {
    updateState((prev) => {
      const dayLogs = prev.logsByDate[todayKey] || {};
      const currentLog = dayLogs[memberId] || createEmptyFamilyDayLog();
      return {
        ...prev,
        logsByDate: {
          ...prev.logsByDate,
          [todayKey]: {
            ...dayLogs,
            [memberId]: {
              ...currentLog,
              adhkarDone: !currentLog.adhkarDone,
            },
          },
        },
      };
    });
  };

  const handleStepMemberQuranPages = (memberId: string, delta: number) => {
    updateState((prev) => {
      const dayLogs = prev.logsByDate[todayKey] || {};
      const currentLog = dayLogs[memberId] || createEmptyFamilyDayLog();
      const nextPages = Math.max(0, Math.min(604, (currentLog.quranPages || 0) + delta));
      return {
        ...prev,
        logsByDate: {
          ...prev.logsByDate,
          [todayKey]: {
            ...dayLogs,
            [memberId]: {
              ...currentLog,
              quranPages: nextPages,
            },
          },
        },
      };
    });
  };

  const handleOpenAddMember = () => {
    setEditingMemberId(null);
    setMemberNameInput('');
    setMemberRoleInput('child');
    setMemberAvatarInput('⭐');
    setShowMemberForm(true);
  };

  const handleOpenEditMember = (member: FamilyMember) => {
    setEditingMemberId(member.id);
    setMemberNameInput(member.name);
    setMemberRoleInput(member.role);
    setMemberAvatarInput(member.avatarSymbol);
    setShowMemberForm(true);
  };

  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = memberNameInput.trim();
    if (!cleanName) return;

    if (editingMemberId) {
      updateState((prev) => ({
        ...prev,
        members: prev.members.map((m) =>
          m.id === editingMemberId
            ? { ...m, name: cleanName, role: memberRoleInput, avatarSymbol: memberAvatarInput }
            : m
        ),
      }));
    } else {
      const newMember: FamilyMember = {
        id: `member_${Date.now()}`,
        name: cleanName,
        role: memberRoleInput,
        avatarSymbol: memberAvatarInput,
        createdAt: todayKey,
      };
      updateState((prev) => ({
        ...prev,
        members: [...prev.members, newMember],
      }));
    }
    setShowMemberForm(false);
    setEditingMemberId(null);
  };

  const handleDeleteMember = (memberId: string) => {
    if (familyState.members.length <= 1) return;
    updateState((prev) => ({
      ...prev,
      members: prev.members.filter((m) => m.id !== memberId),
    }));
    setConfirmDeleteMemberId(null);
  };

  const handleToggleCovenantItem = (itemId: string) => {
    updateState((prev) => {
      const current = prev.weeklyCovenantByWeek[weekKey] || [];
      const exists = current.includes(itemId);
      const nextList = exists ? current.filter((id) => id !== itemId) : [...current, itemId];
      return {
        ...prev,
        weeklyCovenantByWeek: {
          ...prev.weeklyCovenantByWeek,
          [weekKey]: nextList,
        },
      };
    });
  };

  const handleSaveFamilyTitle = () => {
    const clean = familyTitleInput.trim() || 'بيتنا المسلم';
    updateState((prev) => ({ ...prev, customFamilyTitle: clean }));
    setFamilyTitleInput(clean);
    setIsEditingTitle(false);
  };

  const handleTestHomeJamaahChime = () => {
    void adhanPlayer.playPreAdhanReminderSound(settings.preAdhanVoiceMode || 'rotate');
  };

  const formatCountdown = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0) return `${h} س ${m} د`;
    return `${m} دقيقة`;
  };

  const completedCovenantIds = familyState.weeklyCovenantByWeek[weekKey] || [];
  const maxWeeklyDayPrayers = Math.max(1, familyState.members.length * 5);

  return (
    <section className="max-w-6xl mx-auto space-y-6 text-right" dir="rtl">
      {/* 1. Sanctuary Header & TV / Kids Quick Launch */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-[#062d24] via-[#041d18] to-[#02120e] border border-[#e5b869]/45 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            {isEditingTitle ? (
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  type="text"
                  value={familyTitleInput}
                  onChange={(e) => setFamilyTitleInput(e.target.value)}
                  className="bg-[#021410] border border-[#fbbf24]/60 rounded-xl px-3.5 py-2 text-sm font-bold text-white focus:outline-none"
                  placeholder="اسم البيت أو الأسرة"
                />
                <button
                  type="button"
                  onClick={handleSaveFamilyTitle}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-[#fbbf24] text-slate-950 text-xs font-bold whitespace-nowrap"
                >
                  حفظ الاسم
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 flex-wrap">
                <Home className="w-6 h-6 text-[#fbbf24] shrink-0" />
                <h2 className="text-2xl sm:text-3xl font-bold font-amiri text-[#fbbf24]">
                  {familyState.customFamilyTitle}
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setFamilyTitleInput(familyState.customFamilyTitle);
                    setIsEditingTitle(true);
                  }}
                  aria-label="تعديل اسم الأسرة"
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-[#fbbf24] transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
            )}

            <p className="text-xs sm:text-sm text-slate-300 tabular-nums">
              <span>{familyState.members.length} أفراد في البيت</span>
              <span> · </span>
              <span>
                صلوات اليوم:{' '}
                <strong className="text-emerald-300">
                  {summary.todayCompletedPrayers}/{summary.todayMaxPrayers}
                </strong>
              </span>
              <span> · </span>
              <span>
                نجوم الأسبوع: <strong className="text-[#fbbf24]">★ {summary.weeklyStarsTotal}</strong>
              </span>
              <span> · </span>
              <span>نسبة الجماعة: {summary.weeklyJamaahPercent}%</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsLivingRoomOpen(true)}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#fbbf24] via-[#e5b869] to-emerald-400 text-slate-950 text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg whitespace-nowrap shrink-0"
            >
              <Tv className="w-4 h-4 shrink-0" />
              <span>شاشة غرفة المعيشة (TV)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setKidGuideInitialMode('wudu');
                setIsKidGuideOpen(true);
              }}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#06261f] border border-[#e5b869]/45 text-[#fbbf24] hover:bg-[#08342a] text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors"
            >
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>معلّم الوضوء والصلاة للصغار</span>
            </button>

            <button
              type="button"
              onClick={handleOpenAddMember}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-emerald-950/90 border border-emerald-500/45 text-emerald-200 hover:bg-emerald-900 text-xs sm:text-sm font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>إضافة فرد</span>
            </button>
          </div>
        </div>

        {/* Home Jama'ah Call Banner & Reminder Controls */}
        <div
          className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            familyState.jamaahAlertEnabled && jamaahAlert.isWithinWindow
              ? 'bg-[#0a3628]/90 border-[#fbbf24]'
              : 'bg-[#031713]/90 border-[#e5b869]/25'
          }`}
        >
          <div className="flex items-start sm:items-center gap-3">
            <BellRing
              className={`w-5 h-5 shrink-0 mt-0.5 sm:mt-0 ${
                familyState.jamaahAlertEnabled && jamaahAlert.isWithinWindow
                  ? 'text-[#fbbf24]'
                  : 'text-emerald-400'
              }`}
            />
            <div>
              <div className="text-xs sm:text-sm font-bold text-white">
                {familyState.jamaahAlertEnabled && jamaahAlert.isWithinWindow
                  ? `نداء الوضوء وجماعة البيت — حان الاستعداد لصلاة ${jamaahAlert.prayerNameAr}`
                  : `نداء جماعة البيت: الصلاة القادمة ${jamaahAlert.prayerNameAr} (${jamaahAlert.prayerTimeStr})`}
              </div>
              <p className="text-[11px] text-slate-300 tabular-nums mt-0.5">
                متبقي {formatCountdown(jamaahAlert.minutesUntil)} · ينبّه الأسرة قبل الأذان بـ{' '}
                {familyState.jamaahAlertMinutesBefore} دقائق
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-[#02120e] p-1 rounded-xl border border-[#e5b869]/25">
              {([5, 10, 15] as const).map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() =>
                    updateState((prev) => ({ ...prev, jamaahAlertMinutesBefore: mins }))
                  }
                  className={`min-h-[44px] px-3 py-1 rounded-lg text-xs font-bold tabular-nums whitespace-nowrap transition-colors ${
                    familyState.jamaahAlertMinutesBefore === mins
                      ? 'bg-[#fbbf24] text-slate-950'
                      : 'text-slate-300 hover:text-[#fbbf24]'
                  }`}
                >
                  {mins} د
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() =>
                updateState((prev) => ({
                  ...prev,
                  jamaahAlertEnabled: !prev.jamaahAlertEnabled,
                }))
              }
              className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold border whitespace-nowrap shrink-0 ${
                familyState.jamaahAlertEnabled
                  ? 'bg-emerald-950 border-emerald-500/50 text-emerald-300'
                  : 'bg-slate-900 border-slate-700 text-slate-400'
              }`}
            >
              {familyState.jamaahAlertEnabled ? 'التنبيه مفعّل' : 'التنبيه معطّل'}
            </button>

            <button
              type="button"
              onClick={handleTestHomeJamaahChime}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#052921] border border-[#e5b869]/35 text-[#fbbf24] hover:bg-[#07382e] text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Volume2 className="w-4 h-4" />
              <span>تجربة النداء</span>
            </button>
          </div>
        </div>
      </div>

      {/* Child / Member 5-Prayer Blessing Celebration Banner */}
      {celebrationBanner && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#0a3628] via-[#062d24] to-[#0a3628] border-2 border-[#fbbf24] flex items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-3">
            <Award className="w-7 h-7 text-[#fbbf24] shrink-0" />
            <div>
              <h3 className="text-base sm:text-lg font-bold font-amiri text-[#fbbf24]">
                ما شاء الله! بارك الله في {celebrationBanner.name}
              </h3>
              <p className="text-xs sm:text-sm text-emerald-200">
                {celebrationBanner.role === 'child'
                  ? 'أتمّ الصلوات الخمس اليوم بنورٍ واستقامة — ثبتك الله وجعلك قرة عين لوالديك.'
                  : 'تم إتمام الصلوات الخمس لهذا اليوم — تقبّل الله طاعتكم وبارك في البيت.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setCelebrationBanner(null)}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#fbbf24] text-slate-950 text-xs font-bold whitespace-nowrap shrink-0"
          >
            آمين ✓
          </button>
        </div>
      )}

      {/* Inline Add / Edit Family Member Form */}
      {showMemberForm && (
        <form
          onSubmit={handleSaveMember}
          className="p-5 rounded-3xl bg-[#041b16] border-2 border-[#fbbf24]/60 space-y-4 shadow-xl"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold font-amiri text-[#fbbf24]">
              {editingMemberId ? 'تعديل بيانات فرد الأسرة' : 'إضافة فرد جديد إلى البيت المسلم'}
            </h3>
            <button
              type="button"
              onClick={() => setShowMemberForm(false)}
              className="min-h-[44px] px-3 text-xs text-slate-300 hover:text-white"
            >
              إلغاء
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#e5b869]">الاسم</label>
              <input
                type="text"
                required
                value={memberNameInput}
                onChange={(e) => setMemberNameInput(e.target.value)}
                placeholder="مثال: سارة أو حمزة"
                className="w-full min-h-[44px] bg-[#021410] border border-[#e5b869]/35 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-[#fbbf24]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#e5b869]">الفئة</label>
              <select
                value={memberRoleInput}
                onChange={(e) => setMemberRoleInput(e.target.value as FamilyMemberRole)}
                className="w-full min-h-[44px] bg-[#021410] border border-[#e5b869]/35 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-[#fbbf24]"
              >
                <option value="child">{FAMILY_ROLE_LABELS.child}</option>
                <option value="youth">{FAMILY_ROLE_LABELS.youth}</option>
                <option value="parent">{FAMILY_ROLE_LABELS.parent}</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#e5b869]">الرمز المميز</label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {FAMILY_AVATAR_OPTIONS.map((sym) => (
                  <button
                    key={sym}
                    type="button"
                    onClick={() => setMemberAvatarInput(sym)}
                    className={`min-h-[44px] min-w-[44px] rounded-xl border text-lg flex items-center justify-center transition-colors ${
                      memberAvatarInput === sym
                        ? 'bg-[#08362a] border-[#fbbf24]'
                        : 'bg-[#021410] border-[#e5b869]/25'
                    }`}
                  >
                    {sym}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowMemberForm(false)}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#031713] border border-[#e5b869]/30 text-slate-300 text-xs font-bold"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="min-h-[44px] px-6 py-2 rounded-xl bg-gradient-to-r from-[#fbbf24] via-[#e5b869] to-emerald-400 text-slate-950 text-xs sm:text-sm font-bold shadow"
            >
              {editingMemberId ? 'حفظ التعديلات' : 'إضافة للأسرة ✓'}
            </button>
          </div>
        </form>
      )}

      {/* 2. Family Members Interactive Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-lg sm:text-xl font-bold font-amiri text-[#fbbf24] flex items-center gap-2">
            <Users className="w-5 h-5" />
            <span>سجل الصلوات اليومي للأسرة والأبناء</span>
          </h3>
          <p className="text-xs text-slate-400">
            النقرة الأولى: صلاة جماعة (★٢) · الثانية: منفرد (★١) · الثالثة: إلغاء
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {familyState.members.map((member) => {
            const log = getMemberDayLog(familyState, member.id, todayKey);
            const stats = getMemberDayStats(familyState, member.id, todayKey);
            const streak = getMemberStreakDays(familyState, member, now);
            const badges = getMemberEarnedBadges(familyState, member, now);

            return (
              <div
                key={member.id}
                className={`p-4 sm:p-5 rounded-3xl border flex flex-col justify-between gap-4 transition-colors ${
                  stats.allFiveDone
                    ? 'bg-[#062d24]/95 border-[#fbbf24]/70 shadow-[0_8px_30px_rgba(251,191,36,0.12)]'
                    : 'bg-[#041b16]/95 border-[#e5b869]/35'
                }`}
              >
                {/* Card Header */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-11 h-11 rounded-2xl bg-[#03120f] border border-[#e5b869]/40 flex items-center justify-center text-xl shrink-0">
                        {member.avatarSymbol}
                      </span>
                      <div className="min-w-0">
                        <h4 className="text-base sm:text-lg font-bold text-white truncate">
                          {member.name}
                        </h4>
                        <p className="text-[11px] text-slate-300 tabular-nums">
                          <span>{FAMILY_ROLE_LABELS[member.role]}</span>
                          <span> · </span>
                          <span className="text-[#fbbf24] font-semibold">★ {stats.stars}</span>
                          {streak > 0 && (
                            <>
                              <span> · </span>
                              <span className="text-emerald-300">سلسلة {streak} ي</span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEditMember(member)}
                        aria-label={`تعديل ${member.name}`}
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-[#fbbf24] transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      {familyState.members.length > 1 && (
                        confirmDeleteMemberId === member.id ? (
                          <button
                            type="button"
                            onClick={() => handleDeleteMember(member.id)}
                            className="min-h-[44px] px-2.5 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-[11px] font-bold whitespace-nowrap"
                          >
                            تأكيد الحذف
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteMemberId(member.id)}
                            aria-label={`حذف ${member.name}`}
                            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-300 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {/* Member Progress Bar */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full bg-[#02120e] border border-[#e5b869]/20 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-l from-[#fbbf24] to-emerald-400 transition-all duration-200"
                        style={{ width: `${(stats.completedCount / 5) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono font-bold text-[#fbbf24] tabular-nums shrink-0">
                      {stats.completedCount}/5
                    </span>
                  </div>
                </div>

                {/* 5 Prayers Interactive Grid */}
                <div className="grid grid-cols-5 gap-1.5">
                  {FAMILY_PRAYER_ORDER.map((pk) => {
                    const status = log.prayers[pk];
                    return (
                      <button
                        key={pk}
                        type="button"
                        onClick={() => handleCycleMemberPrayer(member.id, pk)}
                        className={`min-h-[54px] px-1 py-1.5 rounded-xl border text-center flex flex-col items-center justify-center gap-0.5 transition-colors ${
                          status === 'jamaah'
                            ? 'bg-emerald-900/80 border-[#fbbf24] text-[#fbbf24] font-bold'
                            : status === 'solo'
                              ? 'bg-emerald-950/85 border-emerald-500/70 text-emerald-200 font-bold'
                              : 'bg-[#03120f] border-[#e5b869]/20 text-slate-400 hover:border-[#fbbf24]/50'
                        }`}
                      >
                        <span className="text-[11px] whitespace-nowrap">{getPrayerLabel(pk)}</span>
                        <span className="text-[10px] tabular-nums whitespace-nowrap flex items-center gap-0.5">
                          {status === 'jamaah' ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>جماعة</span>
                            </>
                          ) : status === 'solo' ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>منفرد</span>
                            </>
                          ) : (
                            <span>—</span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Adhkar + Quran Pages Row */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#e5b869]/15 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleToggleMemberAdhkar(member.id)}
                    className={`min-h-[44px] px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors ${
                      log.adhkarDone
                        ? 'bg-emerald-950 border-emerald-500/60 text-emerald-300'
                        : 'bg-[#03120f] border-[#e5b869]/25 text-slate-300 hover:border-[#fbbf24]/50'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>أذكار اليوم</span>
                  </button>

                  <div className="flex items-center gap-1.5 bg-[#03120f] border border-[#e5b869]/25 rounded-xl px-2 py-1">
                    <button
                      type="button"
                      onClick={() => handleStepMemberQuranPages(member.id, -1)}
                      aria-label="إنقاص صفحات القرآن"
                      className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-slate-300 hover:text-[#fbbf24]"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs text-slate-200 tabular-nums whitespace-nowrap px-1">
                      <BookOpen className="w-3.5 h-3.5 inline ml-1 text-[#fbbf24]" />
                      {log.quranPages} ص
                    </span>
                    <button
                      type="button"
                      onClick={() => handleStepMemberQuranPages(member.id, 1)}
                      aria-label="زيادة صفحات القرآن"
                      className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-slate-300 hover:text-[#fbbf24]"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Quiet Unboxed Badges Summary */}
                <div className="text-[11px] text-slate-400 leading-relaxed">
                  {badges.length > 0 ? (
                    <span className="text-[#e5b869]">
                      <Star className="w-3 h-3 inline ml-1 fill-current text-[#fbbf24]" />
                      {badges.join(' · ')}
                    </span>
                  ) : (
                    <span>حافظ على ٣ أيام فجر أو ٥ جماعات لنيل الأوسمة</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Bottom 2-Column Interactive Split: Weekly Home Covenant & 7-Day Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Weekly Family Covenant */}
        <div className="p-5 rounded-3xl bg-[#041b16]/95 border border-[#e5b869]/35 space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h3 className="text-lg font-bold font-amiri text-[#fbbf24] flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              <span>ميثاق البيت المسلم الأسبوعي</span>
            </h3>
            <span className="text-xs text-emerald-300 font-bold tabular-nums">
              {summary.covenantDoneCount} من {summary.covenantTotalCount} ({summary.covenantPercent}%)
            </span>
          </div>

          <div className="space-y-2.5">
            {FAMILY_WEEKLY_COVENANT_ITEMS.map((item) => {
              const isDone = completedCovenantIds.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleToggleCovenantItem(item.id)}
                  className={`w-full min-h-[52px] p-3.5 rounded-2xl border text-right flex items-center justify-between gap-3 transition-colors ${
                    isDone
                      ? 'bg-emerald-950/75 border-emerald-500/55'
                      : 'bg-[#03120f] border-[#e5b869]/20 hover:border-[#fbbf24]/50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 ${
                        isDone
                          ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                          : 'border-[#e5b869]/40 text-transparent'
                      }`}
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-bold text-white">{item.titleAr}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{item.subtitleAr}</div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#fbbf24] tabular-nums whitespace-nowrap shrink-0">
                    +{item.points} ★
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 7-Day Family Statistics */}
        <div className="p-5 rounded-3xl bg-[#041b16]/95 border border-[#e5b869]/35 flex flex-col justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-lg font-bold font-amiri text-[#fbbf24] flex items-center gap-2">
              <Award className="w-5 h-5" />
              <span>إحصائيات التزام الأسرة (آخر ٧ أيام)</span>
            </h3>
            <p className="text-xs text-slate-300 tabular-nums">
              <span>إجمالي الصلوات المسجلة: {summary.weeklyPrayersTotal}</span>
              <span> · </span>
              <span>نسبة صلاة الجماعة: {summary.weeklyJamaahPercent}%</span>
              <span> · </span>
              <span className="text-[#fbbf24]">★ {summary.weeklyStarsTotal} نجمة</span>
            </p>
          </div>

          <div className="grid grid-cols-7 gap-2 items-end h-44 pt-4 pb-2 px-1 bg-[#03120f] rounded-2xl border border-[#e5b869]/20">
            {summary.dailyBreakdown.map((day) => {
              const pct = Math.round((day.completedPrayers / maxWeeklyDayPrayers) * 100);
              return (
                <div key={day.dateKey} className="flex flex-col items-center justify-end h-full gap-1.5">
                  <span className="text-[10px] font-mono text-[#fbbf24] tabular-nums">
                    {day.completedPrayers}
                  </span>
                  <div className="w-full max-w-[28px] flex-1 flex items-end bg-[#041b16] rounded-lg overflow-hidden border border-[#e5b869]/15">
                    <div
                      className="w-full bg-gradient-to-t from-emerald-600 via-emerald-400 to-[#fbbf24] transition-all duration-300 rounded-t-md"
                      style={{ height: `${Math.max(pct, day.completedPrayers > 0 ? 10 : 3)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-300 whitespace-nowrap">{day.labelAr}</span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-[#e5b869]/15">
            <button
              type="button"
              onClick={() => {
                setKidGuideInitialMode('salah');
                setIsKidGuideOpen(true);
              }}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#031713] border border-[#e5b869]/35 text-[#fbbf24] hover:border-[#fbbf24] text-xs font-bold whitespace-nowrap"
            >
              فتح درس خطوات الصلاة للصغار
            </button>
            <span className="text-xs text-slate-400 font-amiri">
              «مُرُوا أَوْلَادَكُمْ بِالصَّلَاةِ وَهُمْ أَبْنَاءُ سَبْعِ سِنِينَ»
            </span>
          </div>
        </div>
      </div>

      {/* Modals */}
      <KidWuduSalahModal
        isOpen={isKidGuideOpen}
        onClose={() => setIsKidGuideOpen(false)}
        initialMode={kidGuideInitialMode}
      />

      <FamilyLivingRoomBoard
        isOpen={isLivingRoomOpen}
        onClose={() => setIsLivingRoomOpen(false)}
        familyState={familyState}
        prayerTimes={prayerTimes}
        currentLocation={currentLocation}
        onCycleMemberPrayer={handleCycleMemberPrayer}
      />
    </section>
  );
};
