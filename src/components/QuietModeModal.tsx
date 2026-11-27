import React, { useEffect, useState } from 'react';
import {
  Bell,
  BellOff,
  BookOpen,
  Check,
  Clock,
  Heart,
  Moon,
  Plus,
  ShieldAlert,
  Sparkles,
  Trash2,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { UserSettings } from '../types';
import { toArabicDigits } from '../utils/khatmaData';
import { adhanPlayer } from '../utils/audioAdhan';
import {
  QuietExceptionPolicy,
  QuietModeEvaluation,
  QuietModeState,
  QuietSchedulePeriod,
  computeUntilFajrTimestamp,
  formatTime12ArShort,
  getExceptionPolicyLabelAr,
} from '../utils/quietModeData';

interface QuietModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  quietState: QuietModeState;
  evaluation: QuietModeEvaluation;
  onUpdateQuietState: (updater: (prev: QuietModeState) => QuietModeState) => void;
  fajrTimeStr: string;
  settings: UserSettings;
  onUpdateSettings?: (newSettings: Partial<UserSettings>) => void;
}

const INTERVAL_OPTIONS: Array<5 | 10 | 15 | 30 | 60> = [5, 10, 15, 30, 60];

export const QuietModeModal: React.FC<QuietModeModalProps> = ({
  isOpen,
  onClose,
  quietState,
  evaluation,
  onUpdateQuietState,
  fajrTimeStr,
  settings,
  onUpdateSettings,
}) => {
  const [isAddingPeriod, setIsAddingPeriod] = useState(false);
  const [newPeriodLabel, setNewPeriodLabel] = useState('');
  const [newPeriodStart, setNewPeriodStart] = useState('13:00');
  const [newPeriodEnd, setNewPeriodEnd] = useState('15:00');

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const salawatActive = settings.salawatEnabled !== false;
  const periodicActive = Boolean(settings.periodicReminderEnabled);
  const periodicSoundActive = settings.periodicReminderSoundEnabled !== false;

  const handleToggleManualQuiet = () => {
    adhanPlayer.playChime();
    onUpdateQuietState((prev) => {
      if (prev.manualActive || (prev.pauseUntilMs && prev.pauseUntilMs > Date.now())) {
        return {
          ...prev,
          manualActive: false,
          pauseUntilMs: null,
          pauseLabelAr: null,
        };
      }
      return {
        ...prev,
        manualActive: true,
      };
    });
  };

  const handleQuickPauseMinutes = (minutes: number, labelAr: string) => {
    adhanPlayer.playChime();
    const untilMs = Date.now() + minutes * 60 * 1000;
    onUpdateQuietState((prev) => ({
      ...prev,
      manualActive: false,
      pauseUntilMs: untilMs,
      pauseLabelAr: labelAr,
    }));
  };

  const handleQuickPauseUntilFajr = () => {
    adhanPlayer.playChime();
    const { untilMs, labelAr } = computeUntilFajrTimestamp(fajrTimeStr, new Date());
    onUpdateQuietState((prev) => ({
      ...prev,
      manualActive: false,
      pauseUntilMs: untilMs,
      pauseLabelAr: labelAr,
    }));
  };

  const handleClearQuickPause = () => {
    onUpdateQuietState((prev) => ({
      ...prev,
      pauseUntilMs: null,
      pauseLabelAr: null,
    }));
  };

  const handleToggleSchedule = (id: string) => {
    onUpdateQuietState((prev) => ({
      ...prev,
      schedules: prev.schedules.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)),
    }));
  };

  const handleUpdateScheduleField = (
    id: string,
    field: 'label' | 'startTime' | 'endTime',
    value: string
  ) => {
    onUpdateQuietState((prev) => ({
      ...prev,
      schedules: prev.schedules.map((s) => (s.id === id ? { ...s, [field]: value } : s)),
    }));
  };

  const handleDeleteSchedule = (id: string) => {
    onUpdateQuietState((prev) => ({
      ...prev,
      schedules: prev.schedules.filter((s) => s.id !== id),
    }));
  };

  const handleAddPeriod = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanLabel = newPeriodLabel.trim() || 'فترة سكون مخصصة';
    const newItem: QuietSchedulePeriod = {
      id: `custom_${Date.now()}`,
      label: cleanLabel,
      startTime: newPeriodStart || '13:00',
      endTime: newPeriodEnd || '15:00',
      enabled: true,
    };
    onUpdateQuietState((prev) => ({
      ...prev,
      schedules: [...prev.schedules, newItem],
    }));
    setNewPeriodLabel('');
    setIsAddingPeriod(false);
  };

  const handleSelectPolicy = (policy: QuietExceptionPolicy) => {
    onUpdateQuietState((prev) => ({
      ...prev,
      exceptionPolicy: policy,
    }));
  };

  const untilFajrPreview = formatTime12ArShort(fajrTimeStr);

  return (
    <div
      className="fixed inset-0 z-[105] bg-black/80 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-5"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      dir="rtl"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="quiet-mode-modal-title"
        className="theme-keep-light relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl bg-[#0D1713] border-2 border-[#D4AF37]/65 shadow-[0_24px_64px_rgba(0,0,0,0.85)] text-right flex flex-col"
      >
        {/* Top Ornamental Gold Hairline */}
        <div
          className="absolute inset-x-10 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37]/85 to-transparent pointer-events-none"
          aria-hidden="true"
        />

        {/* Sticky Header */}
        <header className="sticky top-0 z-20 bg-[#0D1713]/95 backdrop-blur-md border-b border-[#D4AF37]/20 px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 transition-colors ${
                evaluation.isQuietNow
                  ? 'bg-[#10B981]/15 border-[#10B981]/70 text-[#34D399]'
                  : 'bg-[#15241E] border-[#D4AF37]/45 text-[#F3CA63]'
              }`}
            >
              <Moon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2
                id="quiet-mode-modal-title"
                className="text-lg sm:text-xl font-bold font-amiri text-white leading-tight truncate"
              >
                وضع السكون وإدارة الإشعارات
              </h2>
              <p className="text-xs text-slate-300 truncate">
                إيقاف التنبيهات في المواقيت المحددة والتحكم بالتذكيرات
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق صفحة وضع السكون"
            className="min-w-[44px] min-h-[44px] rounded-xl bg-[#111C18] border border-[#D4AF37]/35 text-slate-300 hover:text-[#F3CA63] hover:border-[#D4AF37] flex items-center justify-center transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-6 space-y-6">
          {/* 1. Live Quiet Mode Status Summary + Primary Toggle */}
          <div
            className={`rounded-2xl border p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
              evaluation.isQuietNow
                ? 'bg-gradient-to-br from-[#0A291F] via-[#0D211A] to-[#0A1612] border-[#10B981]/65'
                : 'bg-[#111C18] border-[#D4AF37]/35'
            }`}
          >
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2 text-xs font-bold">
                {evaluation.isQuietNow ? (
                  <BellOff className="w-4 h-4 text-[#34D399] shrink-0" />
                ) : (
                  <Bell className="w-4 h-4 text-[#F3CA63] shrink-0" />
                )}
                <span className={evaluation.isQuietNow ? 'text-[#34D399]' : 'text-[#F3CA63]'}>
                  {evaluation.statusHeadlineAr}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                {evaluation.statusDetailAr}
              </p>

              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-300 pt-0.5">
                <span>السياسة الحالية: {getExceptionPolicyLabelAr(quietState.exceptionPolicy)}</span>
                {evaluation.remainingPauseText && (
                  <>
                    <span aria-hidden="true" className="text-[#D4AF37]/60">·</span>
                    <span className="font-mono font-bold text-[#34D399] tabular-nums">
                      متبقي {evaluation.remainingPauseText}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {evaluation.reasonType === 'quick_pause' && !quietState.manualActive && (
                <button
                  type="button"
                  onClick={handleClearQuickPause}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-[#09120F] border border-rose-400/50 text-rose-200 hover:bg-rose-950/50 text-xs font-bold transition-colors whitespace-nowrap"
                >
                  إلغاء المؤقت
                </button>
              )}
              <button
                type="button"
                onClick={handleToggleManualQuiet}
                className={`min-h-[44px] px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all whitespace-nowrap flex items-center justify-center gap-2 ${
                  quietState.manualActive
                    ? 'bg-emerald-950 border-2 border-[#34D399] text-[#34D399] hover:bg-emerald-900/60'
                    : evaluation.reasonType === 'quick_pause'
                    ? 'bg-[#D4AF37] text-slate-950 hover:brightness-105'
                    : 'bg-gradient-to-r from-[#D4AF37] to-[#e5b869] text-slate-950 hover:brightness-105 shadow-md'
                }`}
              >
                {quietState.manualActive ? (
                  <>
                    <Bell className="w-4 h-4 shrink-0" />
                    <span>إعادة تشغيل الإشعارات</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 shrink-0" />
                    <span>تفعيل السكون الآن</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 2. Quick Temporary Pause (30m / 1h / 2h / Until Fajr) */}
          <div className="space-y-3 pt-1 border-t border-[#D4AF37]/15">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <h3 className="text-sm sm:text-base font-bold font-amiri text-white">
                  إيقاف مؤقت سريع للإشعارات
                </h3>
              </div>
              {evaluation.remainingPauseText && (
                <span className="text-xs font-mono font-bold text-[#34D399] tabular-nums">
                  {evaluation.remainingPauseText}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleQuickPauseMinutes(30, '٣٠ دقيقة')}
                className={`min-h-[44px] px-3 py-2 rounded-xl border text-xs font-bold transition-colors whitespace-nowrap ${
                  quietState.pauseLabelAr === '٣٠ دقيقة' && evaluation.remainingPauseMs > 0
                    ? 'bg-[#0C3325] border-[#34D399] text-[#34D399]'
                    : 'bg-[#111C18] border-[#D4AF37]/30 hover:border-[#D4AF37] text-slate-100'
                }`}
              >
                ٣٠ دقيقة
              </button>
              <button
                type="button"
                onClick={() => handleQuickPauseMinutes(60, 'ساعة واحدة')}
                className={`min-h-[44px] px-3 py-2 rounded-xl border text-xs font-bold transition-colors whitespace-nowrap ${
                  quietState.pauseLabelAr === 'ساعة واحدة' && evaluation.remainingPauseMs > 0
                    ? 'bg-[#0C3325] border-[#34D399] text-[#34D399]'
                    : 'bg-[#111C18] border-[#D4AF37]/30 hover:border-[#D4AF37] text-slate-100'
                }`}
              >
                ساعة واحدة
              </button>
              <button
                type="button"
                onClick={() => handleQuickPauseMinutes(120, 'ساعتان')}
                className={`min-h-[44px] px-3 py-2 rounded-xl border text-xs font-bold transition-colors whitespace-nowrap ${
                  quietState.pauseLabelAr === 'ساعتان' && evaluation.remainingPauseMs > 0
                    ? 'bg-[#0C3325] border-[#34D399] text-[#34D399]'
                    : 'bg-[#111C18] border-[#D4AF37]/30 hover:border-[#D4AF37] text-slate-100'
                }`}
              >
                ساعتان
              </button>
              <button
                type="button"
                onClick={handleQuickPauseUntilFajr}
                className={`min-h-[44px] px-3 py-2 rounded-xl border text-xs font-bold transition-colors whitespace-nowrap ${
                  quietState.pauseLabelAr?.startsWith('حتى صلاة الفجر') &&
                  evaluation.remainingPauseMs > 0
                    ? 'bg-[#0C3325] border-[#34D399] text-[#34D399]'
                    : 'bg-[#111C18] border-[#D4AF37]/30 hover:border-[#D4AF37] text-[#F3CA63]'
                }`}
              >
                حتى الفجر ({untilFajrPreview})
              </button>
            </div>
          </div>

          {/* 3. Adhan & Fajr Exception Policy */}
          <div className="space-y-3 pt-4 border-t border-[#D4AF37]/15">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#D4AF37] shrink-0" />
              <h3 className="text-sm sm:text-base font-bold font-amiri text-white">
                استثناء الأذان والفجر أثناء السكون
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {(
                [
                  {
                    id: 'fajr_only',
                    title: 'استثناء الفجر فقط',
                    desc: 'كتم جميع الإشعارات والسماح بأذان الفجر',
                  },
                  {
                    id: 'all_adhan',
                    title: 'استثناء كل الأذان',
                    desc: 'إيقاف التذكيرات وبقاء الأذان للصلوات الخمس',
                  },
                  {
                    id: 'none',
                    title: 'كتم شامل للكل',
                    desc: 'إيقاف كل الأصوات والإشعارات بما فيها الأذان',
                  },
                ] as const
              ).map((opt) => {
                const isSelected = quietState.exceptionPolicy === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectPolicy(opt.id)}
                    aria-pressed={isSelected}
                    className={`min-h-[60px] p-3 rounded-2xl border text-right flex flex-col justify-between gap-1 transition-all ${
                      isSelected
                        ? 'bg-[#0E2B22] border-[#34D399] shadow-[0_0_16px_rgba(16,185,129,0.18)]'
                        : 'bg-[#111C18] border-[#D4AF37]/25 hover:border-[#D4AF37]/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-xs sm:text-sm font-bold ${
                          isSelected ? 'text-[#34D399]' : 'text-white'
                        }`}
                      >
                        {opt.title}
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-[#34D399] shrink-0" />}
                    </div>
                    <span className="text-[11px] text-slate-300 leading-snug">{opt.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Scheduled Quiet Periods (Daily & Custom Multiple Windows) */}
          <div className="space-y-3 pt-4 border-t border-[#D4AF37]/15">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm sm:text-base font-bold font-amiri text-white">
                  أوقات السكون اليومية المجدولة
                </h3>
                <p className="text-xs text-slate-300">
                  تُوقف الإشعارات تلقائياً يومياً خلال الفترات المفعّلة (مثل النوم أو العمل)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingPeriod((prev) => !prev)}
                className="min-h-[42px] px-3.5 py-2 rounded-xl bg-[#15241E] hover:bg-[#1B2F27] border border-[#D4AF37]/45 text-xs font-bold text-[#F3CA63] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span>إضافة فترة</span>
              </button>
            </div>

            {isAddingPeriod && (
              <form
                onSubmit={handleAddPeriod}
                className="p-3.5 rounded-2xl bg-[#13201B] border border-[#D4AF37]/50 space-y-3"
              >
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#F3CA63]">اسم الفترة</label>
                  <input
                    type="text"
                    value={newPeriodLabel}
                    onChange={(e) => setNewPeriodLabel(e.target.value)}
                    placeholder="مثال: وقت القيلولة أو المحاضرة"
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-[#09120F] border border-[#D4AF37]/30 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-300">من الساعة</label>
                    <input
                      type="time"
                      value={newPeriodStart}
                      onChange={(e) => setNewPeriodStart(e.target.value)}
                      className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-[#09120F] border border-[#D4AF37]/30 text-sm text-white font-mono tabular-nums focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-300">إلى الساعة</label>
                    <input
                      type="time"
                      value={newPeriodEnd}
                      onChange={(e) => setNewPeriodEnd(e.target.value)}
                      className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-[#09120F] border border-[#D4AF37]/30 text-sm text-white font-mono tabular-nums focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingPeriod(false)}
                    className="min-h-[40px] px-4 py-1.5 rounded-xl bg-[#09120F] border border-slate-700 text-xs font-bold text-slate-300"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="min-h-[40px] px-4 py-1.5 rounded-xl bg-[#D4AF37] text-slate-950 text-xs font-black"
                  >
                    حفظ الفترة
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-2.5">
              {quietState.schedules.length === 0 ? (
                <div className="p-4 rounded-2xl bg-[#111C18] border border-[#D4AF37]/20 text-center text-xs text-slate-300">
                  لا توجد فترات مجدولة حالياً — اضغط «إضافة فترة» لتحديد ساعات إيقاف الإشعارات اليومية.
                </div>
              ) : (
                quietState.schedules.map((slot) => {
                  const isSlotCurrentlyActive =
                    evaluation.activeSchedule?.id === slot.id && evaluation.isQuietNow;
                  return (
                    <div
                      key={slot.id}
                      className={`p-3.5 rounded-2xl border transition-colors space-y-3 ${
                        slot.enabled
                          ? isSlotCurrentlyActive
                            ? 'bg-[#0C281F] border-[#34D399]/70'
                            : 'bg-[#13221C] border-[#D4AF37]/45'
                          : 'bg-[#101916] border-slate-800/80 opacity-85'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <input
                            type="text"
                            value={slot.label}
                            onChange={(e) =>
                              handleUpdateScheduleField(slot.id, 'label', e.target.value)
                            }
                            aria-label="اسم فترة السكون"
                            className="bg-transparent border-b border-transparent focus:border-[#D4AF37]/60 text-sm font-bold text-white focus:outline-none min-w-0 flex-1 truncate py-0.5"
                          />
                          {isSlotCurrentlyActive && (
                            <span className="text-[11px] font-bold text-[#34D399] whitespace-nowrap shrink-0">
                              نشطة الآن
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {quietState.schedules.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteSchedule(slot.id)}
                              aria-label={`حذف ${slot.label}`}
                              className="min-w-[38px] min-h-[38px] rounded-lg bg-[#09120F] border border-slate-700/80 text-slate-400 hover:text-rose-300 hover:border-rose-400/50 flex items-center justify-center transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            type="button"
                            role="switch"
                            aria-checked={slot.enabled}
                            onClick={() => handleToggleSchedule(slot.id)}
                            className={`min-h-[38px] px-3 rounded-xl border text-xs font-bold transition-colors whitespace-nowrap ${
                              slot.enabled
                                ? 'bg-[#10B981] border-[#34D399] text-slate-950'
                                : 'bg-[#09120F] border-slate-700 text-slate-300'
                            }`}
                          >
                            {slot.enabled ? 'مفعّلة' : 'معطّلة'}
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <label className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[#09120F] border border-[#D4AF37]/20 text-xs">
                          <span className="text-slate-300 shrink-0">من</span>
                          <input
                            type="time"
                            value={slot.startTime}
                            onChange={(e) =>
                              handleUpdateScheduleField(slot.id, 'startTime', e.target.value)
                            }
                            className="bg-transparent text-white font-mono font-bold tabular-nums focus:outline-none text-left"
                          />
                        </label>
                        <label className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[#09120F] border border-[#D4AF37]/20 text-xs">
                          <span className="text-slate-300 shrink-0">إلى</span>
                          <input
                            type="time"
                            value={slot.endTime}
                            onChange={(e) =>
                              handleUpdateScheduleField(slot.id, 'endTime', e.target.value)
                            }
                            className="bg-transparent text-white font-mono font-bold tabular-nums focus:outline-none text-left"
                          />
                        </label>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* 5. Independent Controls for Salawat & Periodic Reminders */}
          <div className="space-y-3.5 pt-4 border-t border-[#D4AF37]/15">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#D4AF37] shrink-0" />
              <h3 className="text-sm sm:text-base font-bold font-amiri text-white">
                التحكم المستقل في التذكير بالصلاة على النبي ﷺ والآيات الدورية
              </h3>
            </div>

            {/* Salawat upon the Prophet (ﷺ) Row */}
            <div className="p-4 rounded-2xl bg-[#111C18] border border-[#D4AF37]/35 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#08241C] border border-[#D4AF37]/45 flex items-center justify-center text-[#F3CA63] shrink-0">
                    <Heart className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-white truncate">
                      التذكير بالصلاة على النبي ﷺ
                    </div>
                    <div className="text-[11px] text-slate-300">
                      {!salawatActive
                        ? 'متوقف يدوياً بالكامل'
                        : evaluation.isQuietNow
                        ? 'مفعّل — ومكتوم حالياً أثناء وضع السكون'
                        : `يعمل كل ${toArabicDigits(settings.salawatIntervalMinutes ?? 10)} دقائق`}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={salawatActive}
                  onClick={() => onUpdateSettings?.({ salawatEnabled: !salawatActive })}
                  className={`min-h-[42px] px-4 rounded-xl border text-xs font-black transition-colors whitespace-nowrap shrink-0 ${
                    salawatActive
                      ? 'bg-[#10B981] border-[#34D399] text-slate-950'
                      : 'bg-[#09120F] border-rose-400/50 text-rose-200'
                  }`}
                >
                  {salawatActive ? 'مفعّل' : 'متوقف'}
                </button>
              </div>

              {salawatActive && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-slate-400 ml-1">التكرار:</span>
                  {INTERVAL_OPTIONS.map((mins) => {
                    const active = (settings.salawatIntervalMinutes ?? 10) === mins;
                    return (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => onUpdateSettings?.({ salawatIntervalMinutes: mins })}
                        className={`min-h-[36px] px-3 py-1 rounded-lg border text-xs font-bold tabular-nums transition-colors ${
                          active
                            ? 'bg-[#D4AF37] border-[#F3CA63] text-slate-950'
                            : 'bg-[#09120F] border-[#D4AF37]/25 text-slate-300 hover:border-[#D4AF37]'
                        }`}
                      >
                        {toArabicDigits(mins)} د
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Periodic Verses, Hadith & Wisdom Row */}
            <div className="p-4 rounded-2xl bg-[#111C18] border border-[#D4AF37]/35 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#08241C] border border-[#D4AF37]/45 flex items-center justify-center text-[#34D399] shrink-0">
                    <BookOpen className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-white truncate">
                      الآيات والأحاديث الدورية
                    </div>
                    <div className="text-[11px] text-slate-300">
                      {!periodicActive
                        ? 'متوقفة يدوياً بالكامل'
                        : evaluation.isQuietNow
                        ? 'مفعّلة — ومكتومة حالياً أثناء وضع السكون'
                        : `تظهر كل ${toArabicDigits(settings.periodicReminderInterval ?? 15)} دقيقة`}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={periodicActive}
                  onClick={() =>
                    onUpdateSettings?.({ periodicReminderEnabled: !periodicActive })
                  }
                  className={`min-h-[42px] px-4 rounded-xl border text-xs font-black transition-colors whitespace-nowrap shrink-0 ${
                    periodicActive
                      ? 'bg-[#10B981] border-[#34D399] text-slate-950'
                      : 'bg-[#09120F] border-rose-400/50 text-rose-200'
                  }`}
                >
                  {periodicActive ? 'مفعّل' : 'متوقف'}
                </button>
              </div>

              {periodicActive && (
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] text-slate-400 ml-1">التكرار:</span>
                    {INTERVAL_OPTIONS.map((mins) => {
                      const active = (settings.periodicReminderInterval ?? 15) === mins;
                      return (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => onUpdateSettings?.({ periodicReminderInterval: mins })}
                          className={`min-h-[36px] px-3 py-1 rounded-lg border text-xs font-bold tabular-nums transition-colors ${
                            active
                              ? 'bg-[#D4AF37] border-[#F3CA63] text-slate-950'
                              : 'bg-[#09120F] border-[#D4AF37]/25 text-slate-300 hover:border-[#D4AF37]'
                          }`}
                        >
                          {toArabicDigits(mins)} د
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      onUpdateSettings?.({
                        periodicReminderSoundEnabled: !periodicSoundActive,
                      })
                    }
                    className={`min-h-[36px] px-3 py-1 rounded-lg border text-xs font-bold inline-flex items-center gap-1.5 transition-colors ${
                      periodicSoundActive
                        ? 'bg-[#0C3325] border-[#34D399]/60 text-[#34D399]'
                        : 'bg-[#09120F] border-slate-700 text-slate-400'
                    }`}
                  >
                    {periodicSoundActive ? (
                      <Volume2 className="w-3.5 h-3.5 shrink-0" />
                    ) : (
                      <VolumeX className="w-3.5 h-3.5 shrink-0" />
                    )}
                    <span>{periodicSoundActive ? 'بنغمة هادئة' : 'صامتة'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
