import React, { useState } from 'react';
import { Award, BookOpen, Flame, X, CheckCircle2, Clock, Sparkles, Moon } from 'lucide-react';
import { computeSteadfastnessAnalytics, DaySteadfastnessRecord } from '../utils/steadfastnessData';
import { toArabicDigits } from '../utils/khatmaData';
import { countCompletedFastingDays, loadFastingPreferences } from '../utils/fastingCalculator';

interface SteadfastnessModalProps {
  isOpen: boolean;
  onClose: () => void;
  showFastingCounter?: boolean;
}

export const SteadfastnessModal: React.FC<SteadfastnessModalProps> = ({
  isOpen,
  onClose,
  showFastingCounter,
}) => {
  const [selectedDay, setSelectedDay] = useState<DaySteadfastnessRecord | null>(null);
  const analytics = computeSteadfastnessAnalytics();
  const fastingPrefs = loadFastingPreferences();
  const shouldShowFastingCard = showFastingCounter ?? fastingPrefs.showFastingStatsInRecord;
  const completedFastingDays = countCompletedFastingDays();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
        className="relative w-full max-w-2xl max-h-[90vh] rounded-3xl border-2 border-[#D4AF37]/60 bg-[#041b16]/95 text-right flex flex-col overflow-hidden shadow-[0_24px_70px_rgba(0,0,0,0.65)] font-sans"
      >
        {/* Header */}
        <div className="shrink-0 px-5 py-4 border-b border-[#D4AF37]/30 bg-[#03120f]/90 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#B8962E] flex items-center justify-center text-slate-950 shadow-lg shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold font-amiri text-[#F3CA63] tracking-wide">
                ❖ سِجلّ استقامة القلب ❖
              </h3>
              <p className="text-xs text-slate-300">
                خريطة التزام الخشوع والفرائض والسنن الرواتب وأوراد القرآن خلال آخر ٣٠ يوماً
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] rounded-xl bg-[#031713] hover:bg-[#06261f] border border-[#D4AF37]/40 text-slate-200 hover:text-[#F3CA63] flex items-center justify-center transition-colors"
            title="إغلاق"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* 1. Motivational Metric Cards */}
          <div className={`grid gap-3 ${shouldShowFastingCard ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'}`}>
            {/* Streak */}
            <div className="p-4 rounded-2xl bg-[#111C18] border border-[#D4AF37]/40 flex flex-col items-center text-center gap-1.5 shadow">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-[#F3CA63]">
                <Flame className="w-5 h-5" />
              </div>
              <span className="text-xl sm:text-2xl font-black font-mono text-white tabular-nums">
                {toArabicDigits(analytics.streakDays)} يوم
              </span>
              <span className="text-[11px] font-bold text-[#F3CA63]">سلسلة الالتزام</span>
            </div>

            {/* Rawatib Rakats */}
            <div className="p-4 rounded-2xl bg-[#111C18] border border-[#D4AF37]/40 flex flex-col items-center text-center gap-1.5 shadow">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-300">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="text-xl sm:text-2xl font-black font-mono text-white tabular-nums">
                {toArabicDigits(analytics.monthRawatibRakats)} ركعة
              </span>
              <span className="text-[11px] font-bold text-emerald-300">ركعات الرواتب</span>
            </div>

            {/* Wird Days */}
            <div className="p-4 rounded-2xl bg-[#111C18] border border-[#D4AF37]/40 flex flex-col items-center text-center gap-1.5 shadow">
              <div className="w-9 h-9 rounded-xl bg-teal-500/15 border border-teal-500/40 flex items-center justify-center text-teal-300">
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="text-xl sm:text-2xl font-black font-mono text-white tabular-nums">
                {toArabicDigits(analytics.monthWirdDays)} يوم
              </span>
              <span className="text-[11px] font-bold text-teal-300">أيام الوِرد</span>
            </div>

            {/* Completed Fasting Days (Optional from Settings) */}
            {shouldShowFastingCard && (
              <div className="p-4 rounded-2xl bg-[#111C18] border border-[#D4AF37]/40 flex flex-col items-center text-center gap-1.5 shadow">
                <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center text-[#F3CA63]">
                  <Moon className="w-5 h-5" />
                </div>
                <span className="text-xl sm:text-2xl font-black font-mono text-white tabular-nums">
                  {toArabicDigits(completedFastingDays)} يوم
                </span>
                <span className="text-[11px] font-bold text-[#F3CA63]">أيام الصيام المنجزة</span>
              </div>
            )}
          </div>

          {/* 2. Heatmap Section */}
          <div className="p-5 rounded-3xl bg-[#0B1713] border border-[#D4AF37]/35 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">
                تتبع النشاط اليومي (آخر ٣٠ يوماً)
              </span>
              <span className="text-xs font-mono text-[#F3CA63] font-semibold">
                متصل ومحفوظ تلقائياً
              </span>
            </div>

            {/* 30 Boxes Grid */}
            <div className="grid grid-cols-6 sm:grid-cols-10 gap-2.5">
              {analytics.last30Days.map((day) => {
                const isSelected = selectedDay?.dateKey === day.dateKey;
                const bgClass =
                  day.status === 'completed'
                    ? 'bg-[#10B981] border-[#34D399] shadow-[0_0_12px_rgba(16,185,129,0.45)]'
                    : day.status === 'moderate'
                    ? 'bg-[#D4AF37] border-[#F3CA63] text-slate-950'
                    : 'bg-[#1A2622] border-slate-700/60 text-slate-500';

                return (
                  <button
                    key={day.dateKey}
                    type="button"
                    onClick={() => setSelectedDay(day)}
                    className={`min-h-[44px] rounded-xl border p-2 flex flex-col items-center justify-center gap-1 transition-all ${bgClass} ${
                      isSelected ? 'ring-2 ring-white scale-105' : 'hover:opacity-90'
                    }`}
                    title={`${day.hijriLabel} (${day.formattedDate}) — ${
                      day.status === 'completed'
                        ? 'يوم مكتمل'
                        : day.status === 'moderate'
                        ? 'يوم متوسط'
                        : 'بدون سجل'
                    }`}
                  >
                    <span className="text-[10px] font-mono font-bold">
                      {day.formattedDate.split(' ')[0]}
                    </span>
                    <span className="w-2 h-2 rounded-full bg-white/80" />
                  </button>
                );
              })}
            </div>

            {/* Color Key / Legend */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-3 border-t border-[#D4AF37]/20 text-xs text-slate-300">
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-md bg-[#10B981] border border-[#34D399]" />
                <span>مكتمل (الفرائض + الرواتب + الوِرد)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-md bg-[#D4AF37] border border-[#F3CA63]" />
                <span>متوسط (إنجاز جزئي)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-md bg-[#1A2622] border border-slate-700" />
                <span>بدون سجل</span>
              </div>
            </div>
          </div>

          {/* Selected Day Details Card if clicked */}
          {selectedDay && (
            <div className="p-4 rounded-2xl bg-[#111C18] border border-[#D4AF37]/60 space-y-2.5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#F3CA63]">
                  تفاصيل يوم {selectedDay.hijriLabel} ({selectedDay.formattedDate})
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedDay(null)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  ✕ إخفاء
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-[#041d17] border border-emerald-500/30 flex items-center gap-2 text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>الفرائض: {selectedDay.faraidCompleted ? 'مكتملة بحمد الله' : 'غير مسجلة'}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#041d17] border border-[#D4AF37]/30 flex items-center gap-2 text-[#F3CA63]">
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>السنن الرواتب: {toArabicDigits(selectedDay.rawatibRakats)} ركعة</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#041d17] border border-teal-500/30 flex items-center gap-2 text-teal-300">
                  <BookOpen className="w-4 h-4 shrink-0" />
                  <span>الوِرد اليومي: {selectedDay.wirdCompleted ? 'تم إنجازه' : 'لم يُستكمل'}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 px-5 py-4 border-t border-[#D4AF37]/30 bg-[#03120f]/90 flex items-center justify-between">
          <span className="text-xs text-slate-300 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#F3CA63]" />
            <span>﴿وَالَّذِينَ جَاهَدُوا فِينَا لَنَهْدِيَنَّهُمْ سُبُلَنَا﴾</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8962E] text-slate-950 font-black text-xs sm:text-sm hover:brightness-105 transition-all"
          >
            إغلاق السِجلّ
          </button>
        </div>
      </div>
    </div>
  );
};
