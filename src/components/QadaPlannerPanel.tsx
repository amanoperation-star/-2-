import React, { useState, useEffect, useMemo } from 'react';
import {
  RotateCcw,
  Check,
  Calculator,
  Calendar,
  Bell,
  Plus,
  Edit3,
  Trash2,
  Sparkles,
  History,
} from 'lucide-react';
import {
  EMPTY_QADA_COUNTERS,
  QADA_PRAYER_META,
  QadaCountKey,
  QadaCounters,
  QadaPrayerKey,
  QadaState,
  applyQadaDelta,
  computeQadaAnalytics,
  loadQadaState,
  saveQadaState,
  undoLastQadaAction,
} from '../utils/qadaData';
import { toArabicDigits } from '../utils/khatmaData';
import { adhanPlayer } from '../utils/audioAdhan';

interface QadaPlannerPanelProps {
  onTestReminder?: () => void;
}

export const QadaPlannerPanel: React.FC<QadaPlannerPanelProps> = ({ onTestReminder }) => {
  const [qadaState, setQadaState] = useState<QadaState>(() => loadQadaState());

  // Estimator inputs
  const [estYears, setEstYears] = useState<number>(0);
  const [estMonths, setEstMonths] = useState<number>(1);
  const [estDays, setEstDays] = useState<number>(0);
  const [estFastingDays, setEstFastingDays] = useState<number>(0);
  const [estimatorFeedback, setEstimatorFeedback] = useState<string | null>(null);

  // Manual edit mode
  const [isEditingManual, setIsEditingManual] = useState<boolean>(false);
  const [manualDraft, setManualDraft] = useState<QadaCounters>(() => loadQadaState().remaining);

  useEffect(() => {
    const sync = () => {
      const latest = loadQadaState();
      setQadaState(latest);
    };
    window.addEventListener('qada_state_changed', sync);
    return () => window.removeEventListener('qada_state_changed', sync);
  }, []);

  const updateAndSave = (next: QadaState) => {
    setQadaState(next);
    saveQadaState(next);
  };

  const analytics = useMemo(() => computeQadaAnalytics(qadaState), [qadaState]);

  const handleLogSingle = (key: QadaCountKey, amount: number, labelAr: string) => {
    adhanPlayer.playChime();
    const next = applyQadaDelta(qadaState, { [key]: amount }, labelAr);
    updateAndSave(next);
  };

  const handleLogFullDay = () => {
    adhanPlayer.playChime();
    const deltas: Partial<QadaCounters> = {
      fajr: 1,
      dhuhr: 1,
      asr: 1,
      maghrib: 1,
      isha: 1,
      ...(qadaState.includeWitrInPlan ? { witr: 1 } : {}),
    };
    const next = applyQadaDelta(qadaState, deltas, 'قضاء يوم صلوات كامل');
    updateAndSave(next);
  };

  const handleUndo = () => {
    if (qadaState.recentActions.length === 0) return;
    const next = undoLastQadaAction(qadaState);
    updateAndSave(next);
  };

  const handleApplyEstimator = (mode: 'add' | 'replace') => {
    const totalEstimatedDays = Math.max(0, estYears * 354 + estMonths * 30 + estDays);
    const fastingAdd = Math.max(0, estFastingDays);
    if (totalEstimatedDays === 0 && fastingAdd === 0) {
      setEstimatorFeedback('أدخل مدة أو عدد أيام صيام أولاً.');
      return;
    }

    const baseRemaining = mode === 'replace' ? { ...EMPTY_QADA_COUNTERS } : { ...qadaState.remaining };
    const nextRemaining: QadaCounters = {
      fajr: baseRemaining.fajr + totalEstimatedDays,
      dhuhr: baseRemaining.dhuhr + totalEstimatedDays,
      asr: baseRemaining.asr + totalEstimatedDays,
      maghrib: baseRemaining.maghrib + totalEstimatedDays,
      isha: baseRemaining.isha + totalEstimatedDays,
      witr: baseRemaining.witr + (qadaState.includeWitrInPlan ? totalEstimatedDays : 0),
      fasting: baseRemaining.fasting + fastingAdd,
    };

    const nextState: QadaState = {
      ...qadaState,
      remaining: nextRemaining,
      ...(mode === 'replace' ? { completed: { ...EMPTY_QADA_COUNTERS }, recentActions: [] } : {}),
    };
    updateAndSave(nextState);
    setManualDraft(nextRemaining);
    setEstimatorFeedback(
      mode === 'replace'
        ? `تم تعيين خطة جديدة لـ ${toArabicDigits(totalEstimatedDays)} يوماً.`
        : `تمت إضافة ${toArabicDigits(totalEstimatedDays)} يوماً إلى الرصيد الحالي.`
    );
    window.setTimeout(() => setEstimatorFeedback(null), 4000);
  };

  const handleSaveManual = () => {
    const cleaned: QadaCounters = {
      fajr: Math.max(0, Math.floor(manualDraft.fajr || 0)),
      dhuhr: Math.max(0, Math.floor(manualDraft.dhuhr || 0)),
      asr: Math.max(0, Math.floor(manualDraft.asr || 0)),
      maghrib: Math.max(0, Math.floor(manualDraft.maghrib || 0)),
      isha: Math.max(0, Math.floor(manualDraft.isha || 0)),
      witr: Math.max(0, Math.floor(manualDraft.witr || 0)),
      fasting: Math.max(0, Math.floor(manualDraft.fasting || 0)),
    };
    updateAndSave({
      ...qadaState,
      remaining: cleaned,
    });
    setIsEditingManual(false);
  };

  const handleResetAll = () => {
    const fresh = {
      ...qadaState,
      remaining: { ...EMPTY_QADA_COUNTERS },
      completed: { ...EMPTY_QADA_COUNTERS },
      recentActions: [],
      dailyLog: {},
    };
    updateAndSave(fresh);
    setManualDraft({ ...EMPTY_QADA_COUNTERS });
  };

  const fardList = QADA_PRAYER_META.filter((p) => p.key !== 'witr' || qadaState.includeWitrInPlan || qadaState.remaining.witr > 0 || qadaState.completed.witr > 0);
  const hasAnyPlan =
    analytics.totalRemainingWithWitr > 0 ||
    analytics.totalCompletedWithWitr > 0 ||
    qadaState.remaining.fasting > 0 ||
    qadaState.completed.fasting > 0;

  return (
    <div dir="rtl" className="space-y-6 text-right">
      {/* Top KPI Summary Strip (Flat hairline structure, tabular figures, zero pill clutter) */}
      <div className="rounded-3xl bg-[#041b16]/95 border border-[#D4AF37]/40 p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#D4AF37]/20">
          <div className="space-y-1">
            <h3 className="text-xl sm:text-2xl font-bold font-amiri text-[#F3CA63]">
              مُخطّط قضاء الصلوات والصيام الفائت
            </h3>
            <p className="text-xs sm:text-sm text-slate-300">
              حوّل الفوائت المتراكمة إلى ورد يومي يسير مع حساب الموعد المتوقع للإتمام وحفظ تلقائي فوري.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {qadaState.recentActions.length > 0 && (
              <button
                type="button"
                onClick={handleUndo}
                className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#111C18] border border-[#D4AF37]/45 text-[#F3CA63] hover:bg-[#172822] text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap"
                title={`تراجع عن: ${qadaState.recentActions[0].labelAr}`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>تراجع</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleLogFullDay}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-gradient-to-r from-[#10B981] to-emerald-500 text-slate-950 hover:brightness-105 text-xs sm:text-sm font-black flex items-center gap-1.5 shadow transition-all whitespace-nowrap"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>قضاء يوم صلوات كامل</span>
            </button>
          </div>
        </div>

        {/* 4 Structured Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x lg:divide-x-reverse divide-[#D4AF37]/20">
          <div className="p-3 sm:px-4 space-y-1">
            <div className="text-xs text-slate-400">الصلوات المتبقية</div>
            <div className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-[#F3CA63]">
              {toArabicDigits(analytics.totalRemainingWithWitr)}
            </div>
            <div className="text-[11px] text-slate-400">
              مقضي حتى الآن: <span className="text-[#10B981] font-mono tabular-nums font-bold">{toArabicDigits(analytics.totalCompletedWithWitr)}</span>
            </div>
          </div>

          <div className="p-3 sm:px-4 space-y-1">
            <div className="text-xs text-slate-400">نسبة الإنجاز</div>
            <div className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-[#10B981]">
              {toArabicDigits(analytics.progressPercent)}%
            </div>
            <div className="w-full h-1.5 rounded-full bg-[#02110E] overflow-hidden mt-1">
              <div
                className="h-full bg-[#10B981] transition-all duration-300"
                style={{ width: `${analytics.progressPercent}%` }}
              />
            </div>
          </div>

          <div className="p-3 sm:px-4 space-y-1">
            <div className="text-xs text-slate-400">إنجاز اليوم والأسبوع</div>
            <div className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-white">
              {toArabicDigits(analytics.todayCompletedCount)}
            </div>
            <div className="text-[11px] text-slate-400">
              الأسبوع: <span className="font-mono tabular-nums text-[#F3CA63] font-bold">{toArabicDigits(analytics.weeklyCompletedCount)}</span> · السلسلة:{' '}
              <span className="font-mono tabular-nums text-[#10B981] font-bold">{toArabicDigits(analytics.streakDays)} يوم</span>
            </div>
          </div>

          <div className="p-3 sm:px-4 space-y-1">
            <div className="text-xs text-slate-400">تاريخ الإتمام المتوقع</div>
            <div className="text-base sm:text-lg font-bold font-amiri text-[#F3CA63] leading-snug">
              {analytics.estimatedDaysToFinish > 0
                ? analytics.estimatedFinishHijri
                : hasAnyPlan
                ? 'اكتمل القضاء بحمد الله'
                : 'بانتظار ضبط الخطة'}
            </div>
            <div className="text-[11px] text-slate-400 font-mono tabular-nums">
              {analytics.estimatedDaysToFinish > 0
                ? `${toArabicDigits(analytics.estimatedDaysToFinish)} يوماً · ${analytics.estimatedFinishGregorian}`
                : 'أضف رصيد الفوائت للبدء'}
            </div>
          </div>
        </div>
      </div>

      {/* Main 2-Column Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Column 1-2: Prayers & Fasting Debt Interactive Rows */}
        <div className="lg:col-span-2 rounded-3xl bg-[#041b16]/95 border border-[#D4AF37]/40 p-5 sm:p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#D4AF37]/20">
            <div>
              <h4 className="text-lg font-bold font-amiri text-[#F3CA63]">
                رصيد الصلوات والصيام الفائت
              </h4>
              <p className="text-xs text-slate-400">
                اضغط +١ أو +٥ عند إتمام أي صلاة قضاء · يُحفظ السجل تلقائياً
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                if (!isEditingManual) {
                  setManualDraft({ ...qadaState.remaining });
                }
                setIsEditingManual((v) => !v);
              }}
              className="min-h-[40px] px-3 py-1.5 rounded-xl bg-[#111C18] border border-[#D4AF37]/35 text-xs font-bold text-[#F3CA63] hover:bg-[#172822] flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditingManual ? 'إلغاء التعديل' : 'تعديل الأرقام يدوياً'}</span>
            </button>
          </div>

          {/* Empty Guide Banner if zero */}
          {!hasAnyPlan && !isEditingManual && (
            <div className="p-4 rounded-2xl bg-[#071410] border border-[#D4AF37]/25 text-xs sm:text-sm text-slate-300 leading-relaxed">
              لا توجد فوائت مسجلة حالياً. يمكنك استخدام <strong className="text-[#F3CA63]">حاسبة المدة الزمنية</strong> المجاورة لتقدير أيام أو سنوات فائتة بضغطة واحدة، أو الضغط على <strong className="text-[#F3CA63]">تعديل الأرقام يدوياً</strong> لإدخال عدد محدد لكل صلاة أو يوم صيام.
            </div>
          )}

          {isEditingManual ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {QADA_PRAYER_META.map((p) => (
                  <label
                    key={p.key}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#071410] border border-[#D4AF37]/25"
                  >
                    <span className="text-sm font-bold text-white">{p.nameAr}</span>
                    <input
                      type="number"
                      min={0}
                      max={100000}
                      value={manualDraft[p.key]}
                      onChange={(e) =>
                        setManualDraft((prev) => ({
                          ...prev,
                          [p.key]: Math.max(0, Number(e.target.value) || 0),
                        }))
                      }
                      className="w-28 min-h-[40px] px-3 rounded-lg bg-[#111C18] border border-[#D4AF37]/40 text-center font-mono tabular-nums text-white font-bold focus:outline-none focus:border-[#F3CA63]"
                    />
                  </label>
                ))}
                <label className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#071410] border border-[#10B981]/30 sm:col-span-2">
                  <span className="text-sm font-bold text-emerald-300">أيام الصيام الفائتة (قضاء/نذر/كفارة)</span>
                  <input
                    type="number"
                    min={0}
                    max={10000}
                    value={manualDraft.fasting}
                    onChange={(e) =>
                      setManualDraft((prev) => ({
                        ...prev,
                        fasting: Math.max(0, Number(e.target.value) || 0),
                      }))
                    }
                    className="w-28 min-h-[40px] px-3 rounded-lg bg-[#111C18] border border-[#10B981]/45 text-center font-mono tabular-nums text-white font-bold focus:outline-none focus:border-[#10B981]"
                  />
                </label>
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingManual(false)}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-[#111C18] border border-slate-700 text-xs font-bold text-slate-300"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleSaveManual}
                  className="min-h-[44px] px-5 py-2 rounded-xl bg-[#D4AF37] text-slate-950 text-xs font-black"
                >
                  حفظ الأرصدة
                </button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-[#D4AF37]/15">
              {fardList.map((prayer) => {
                const rem = qadaState.remaining[prayer.key];
                const done = qadaState.completed[prayer.key];
                const totalForPrayer = rem + done;
                const pct = totalForPrayer > 0 ? Math.round((done / totalForPrayer) * 100) : 0;

                return (
                  <div
                    key={prayer.key}
                    className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-sm sm:text-base">
                        <span className="font-bold text-white">{prayer.nameAr}</span>
                        <span className="text-slate-500" aria-hidden="true">·</span>
                        <span className="text-xs text-slate-400">{prayer.rakatsAr}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-slate-300">
                          المتبقي:{' '}
                          <strong className="font-mono tabular-nums text-[#F3CA63]">
                            {toArabicDigits(rem)}
                          </strong>
                        </span>
                        <span className="text-slate-600" aria-hidden="true">·</span>
                        <span className="text-slate-400">
                          المقضي:{' '}
                          <strong className="font-mono tabular-nums text-[#10B981]">
                            {toArabicDigits(done)}
                          </strong>
                        </span>
                        {totalForPrayer > 0 && (
                          <>
                            <span className="text-slate-600" aria-hidden="true">·</span>
                            <span className="font-mono tabular-nums text-slate-400">
                              {toArabicDigits(pct)}%
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleLogSingle(prayer.key as QadaPrayerKey, 1, `قضاء ${prayer.nameAr} (+١)`)}
                        className="min-h-[44px] min-w-[64px] px-3.5 py-2 rounded-xl bg-[#111C18] border border-[#10B981]/50 text-[#10B981] hover:bg-[#083027] text-xs font-black flex items-center justify-center gap-1 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>١</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLogSingle(prayer.key as QadaPrayerKey, 5, `قضاء ${prayer.nameAr} (+٥)`)}
                        className="min-h-[44px] min-w-[64px] px-3.5 py-2 rounded-xl bg-[#071410] border border-[#D4AF37]/35 text-[#F3CA63] hover:bg-[#172822] text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>٥</span>
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Fasting Days Debt Row */}
              <div className="pt-4 mt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm sm:text-base">
                    <span className="font-bold text-emerald-300">قضاء أيام الصيام</span>
                    <span className="text-slate-500" aria-hidden="true">·</span>
                    <span className="text-xs text-slate-400">رمضان / نذر / كفارة</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-slate-300">
                      المتبقي:{' '}
                      <strong className="font-mono tabular-nums text-[#F3CA63]">
                        {toArabicDigits(qadaState.remaining.fasting)} يوم
                      </strong>
                    </span>
                    <span className="text-slate-600" aria-hidden="true">·</span>
                    <span className="text-slate-400">
                      المقضي:{' '}
                      <strong className="font-mono tabular-nums text-[#10B981]">
                        {toArabicDigits(qadaState.completed.fasting)} يوم
                      </strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleLogSingle('fasting', 1, 'قضاء يوم صيام (+١)')}
                    className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#111C18] border border-[#10B981]/50 text-[#10B981] hover:bg-[#083027] text-xs font-black flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>١ يوم</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLogSingle('fasting', 3, 'قضاء ٣ أيام صيام')}
                    className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#071410] border border-[#D4AF37]/35 text-[#F3CA63] hover:bg-[#172822] text-xs font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>٣ أيام</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Recent Activity Log */}
          {qadaState.recentActions.length > 0 && (
            <div className="pt-4 border-t border-[#D4AF37]/20 space-y-2">
              <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>آخر حركات القضاء المسجلة:</span>
              </div>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pl-1">
                {qadaState.recentActions.slice(0, 5).map((act) => (
                  <div
                    key={act.id}
                    className="flex items-center justify-between text-xs text-slate-300 py-1.5 px-3 rounded-lg bg-[#071410]"
                  >
                    <span className="font-medium text-emerald-300">{act.labelAr}</span>
                    <span className="text-[11px] text-slate-400 font-mono tabular-nums">
                      {new Date(act.timestamp).toLocaleTimeString('ar-EG', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Column 3: Period Estimator, Daily Pace & Smart Reminder */}
        <div className="space-y-5">
          {/* Period Calculator */}
          <div className="rounded-3xl bg-[#111C18] border border-[#D4AF37]/40 p-5 space-y-4">
            <div className="flex items-center gap-2 text-base font-bold font-amiri text-[#F3CA63]">
              <Calculator className="w-4 h-4 text-[#10B981]" />
              <span>حاسبة المدة التقديرية</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <label className="space-y-1 text-center">
                <span className="text-[11px] text-slate-400 block">سنوات</span>
                <input
                  type="number"
                  min={0}
                  max={60}
                  value={estYears}
                  onChange={(e) => setEstYears(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full min-h-[42px] px-2 rounded-xl bg-[#071410] border border-[#D4AF37]/30 text-center font-mono tabular-nums text-white font-bold focus:outline-none focus:border-[#F3CA63]"
                />
              </label>
              <label className="space-y-1 text-center">
                <span className="text-[11px] text-slate-400 block">أشهر</span>
                <input
                  type="number"
                  min={0}
                  max={11}
                  value={estMonths}
                  onChange={(e) => setEstMonths(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full min-h-[42px] px-2 rounded-xl bg-[#071410] border border-[#D4AF37]/30 text-center font-mono tabular-nums text-white font-bold focus:outline-none focus:border-[#F3CA63]"
                />
              </label>
              <label className="space-y-1 text-center">
                <span className="text-[11px] text-slate-400 block">أيام</span>
                <input
                  type="number"
                  min={0}
                  max={30}
                  value={estDays}
                  onChange={(e) => setEstDays(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full min-h-[42px] px-2 rounded-xl bg-[#071410] border border-[#D4AF37]/30 text-center font-mono tabular-nums text-white font-bold focus:outline-none focus:border-[#F3CA63]"
                />
              </label>
            </div>

            <label className="flex items-center justify-between gap-2 text-xs text-slate-300">
              <span>أيام صيام فائتة:</span>
              <input
                type="number"
                min={0}
                max={1000}
                value={estFastingDays}
                onChange={(e) => setEstFastingDays(Math.max(0, Number(e.target.value) || 0))}
                className="w-24 min-h-[40px] px-2 rounded-xl bg-[#071410] border border-[#10B981]/35 text-center font-mono tabular-nums text-white font-bold focus:outline-none focus:border-[#10B981]"
              />
            </label>

            <label className="flex items-center justify-between gap-2 text-xs text-slate-300 cursor-pointer py-1">
              <span>تضمين صلاة الوتر في الخطة</span>
              <input
                type="checkbox"
                checked={qadaState.includeWitrInPlan}
                onChange={(e) =>
                  updateAndSave({ ...qadaState, includeWitrInPlan: e.target.checked })
                }
                className="w-4 h-4 accent-[#D4AF37]"
              />
            </label>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleApplyEstimator('add')}
                className="min-h-[44px] px-3 py-2 rounded-xl bg-[#083027] border border-[#10B981]/50 text-emerald-300 hover:bg-[#0b3e33] text-xs font-bold transition-colors"
              >
                إضافة للرصيد
              </button>
              <button
                type="button"
                onClick={() => handleApplyEstimator('replace')}
                className="min-h-[44px] px-3 py-2 rounded-xl bg-[#D4AF37] text-slate-950 hover:brightness-105 text-xs font-black transition-all"
              >
                تعيين كخطة جديدة
              </button>
            </div>

            {estimatorFeedback && (
              <div className="text-xs text-[#10B981] font-medium pt-1">{estimatorFeedback}</div>
            )}
          </div>

          {/* Daily Pace Selector */}
          <div className="rounded-3xl bg-[#111C18] border border-[#D4AF37]/40 p-5 space-y-3">
            <div className="flex items-center gap-2 text-base font-bold font-amiri text-[#F3CA63]">
              <Calendar className="w-4 h-4 text-[#10B981]" />
              <span>وتيرة القضاء اليومية</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { pace: 0.5, label: 'نصف يوم (صلاتان–٣)' },
                { pace: 1, label: 'يوم كامل (٥ صلوات)' },
                { pace: 2, label: 'يومان (١٠ صلوات)' },
                { pace: 3, label: '٣ أيام (١٥ صلاة)' },
              ].map((opt) => (
                <button
                  key={opt.pace}
                  type="button"
                  onClick={() => updateAndSave({ ...qadaState, dailyPaceDays: opt.pace })}
                  className={`min-h-[44px] px-2.5 py-2 rounded-xl border text-xs font-bold transition-all ${
                    qadaState.dailyPaceDays === opt.pace
                      ? 'bg-[#083027] border-[#10B981] text-emerald-300'
                      : 'bg-[#071410] border-[#D4AF37]/25 text-slate-300 hover:border-[#D4AF37]/60'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              نصيحة عملية: قضاء صلاة فائتة مع كل صلاة حاضرة ينهي <strong className="text-[#F3CA63]">يوماً كاملاً كل يوم</strong> دون مشقة.
            </p>
          </div>

          {/* Smart Daily Reminder & Clear */}
          <div className="rounded-3xl bg-[#111C18] border border-[#D4AF37]/40 p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-base font-bold font-amiri text-[#F3CA63]">
                <Bell className="w-4 h-4 text-[#10B981]" />
                <span>تذكير القضاء اليومي</span>
              </div>
              <button
                type="button"
                onClick={() =>
                  updateAndSave({ ...qadaState, reminderEnabled: !qadaState.reminderEnabled })
                }
                className={`min-h-[36px] px-3 py-1 rounded-xl text-xs font-bold border transition-colors ${
                  qadaState.reminderEnabled
                    ? 'bg-[#10B981] border-emerald-400 text-slate-950'
                    : 'bg-[#071410] border-[#D4AF37]/30 text-slate-300'
                }`}
              >
                {qadaState.reminderEnabled ? 'مفعّل' : 'مغلق'}
              </button>
            </div>

            <div className="flex items-center justify-between gap-2 text-xs text-slate-300">
              <span>وقت التذكير المفضل:</span>
              <input
                type="time"
                value={qadaState.reminderTime}
                onChange={(e) =>
                  updateAndSave({ ...qadaState, reminderTime: e.target.value || '16:30' })
                }
                className="min-h-[40px] px-3 rounded-xl bg-[#071410] border border-[#D4AF37]/35 font-mono text-white"
              />
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              {onTestReminder && (
                <button
                  type="button"
                  onClick={onTestReminder}
                  className="min-h-[40px] px-3 py-1.5 rounded-xl bg-[#071410] border border-[#D4AF37]/35 text-[#F3CA63] hover:bg-[#172822] text-xs font-bold flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>معاينة التذكير</span>
                </button>
              )}

              {hasAnyPlan && (
                <button
                  type="button"
                  onClick={handleResetAll}
                  className="min-h-[40px] px-3 py-1.5 rounded-xl bg-[#071410] border border-rose-500/30 text-rose-300 hover:bg-rose-950/40 text-xs font-bold flex items-center gap-1 mr-auto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>تصفير الخطة</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
