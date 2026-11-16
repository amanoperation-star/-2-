import React, { useState } from 'react';
import { X, Check, Image as ImageIcon, Sliders, Eye, Sparkles, Sun, Moon, Video } from 'lucide-react';
import { UserSettings } from '../types';
import { LIVE_BACKGROUNDS } from '../utils/backgroundsData';

interface BackgroundPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
}

export const BackgroundPickerModal: React.FC<BackgroundPickerModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  const [filter, setFilter] = useState<'all' | 'day' | 'night' | 'video'>('all');

  if (!isOpen) return null;

  const autoDayNight = settings.autoDayNightBackground ?? true;

  const filteredBackgrounds = LIVE_BACKGROUNDS.filter((bg) => {
    if (filter === 'all') return true;
    if (filter === 'day') return bg.period === 'day';
    if (filter === 'night') return bg.period === 'night';
    if (filter === 'video') return bg.type === 'video';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-gradient-to-b from-[#0a1e30] via-[#071626] to-[#030c17] border border-emerald-500/50 rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white font-amiri">
                خلفيات المساجد الشريفة (النهار والليل)
              </h2>
              <p className="text-xs text-slate-400">
                مساجد نهارية مشمسة للظهر والعصر، ومساجد ليلية ساحرة للفجر والمغرب والعشاء
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          
          {/* Smart Auto Day / Night Switch */}
          <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-indigo-950/40 border border-amber-500/40 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4">
            <div className="space-y-1 text-right">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                <Sun className="w-4 h-4 text-amber-400" />
                <span>التبديل التلقائي الذكي (ليل / نهار حسب وقت الصلاة):</span>
                <Moon className="w-4 h-4 text-indigo-400" />
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                عند التفعيل، يعرض البرنامج تلقائياً مساجد نهارية مشمسة في صلاة الظهر والعصر، ومساجد ليلية مضيئة في صلاة الفجر والمغرب والعشاء.
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={autoDayNight}
                onChange={(e) => onUpdateSettings({ autoDayNightBackground: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-14 h-7 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:start-[3px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-amber-500 peer-checked:to-emerald-500"></div>
            </label>
          </div>

          {/* Sliders: Clarity/Opacity & Blur Controls */}
          <div className="bg-slate-950/70 border border-emerald-900/60 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <Sliders className="w-4 h-4" />
              <span>التحكم في درجة وضوح وظهور صورة المسجد:</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Opacity Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
                  <span>وضوح معالم المسجد:</span>
                  <span className="text-emerald-400 font-mono font-bold">
                    {Math.round(settings.backgroundOpacity ?? 65)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  step="5"
                  value={settings.backgroundOpacity ?? 65}
                  onChange={(e) => onUpdateSettings({ backgroundOpacity: Number(e.target.value) })}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <span className="text-[11px] text-slate-400 block">
                  (70% - 90% لرؤية المسجد ومآذنه بوضوح تام خلف المحتوى)
                </span>
              </div>

              {/* Blur Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
                  <span>نعومة الصورة (Blur):</span>
                  <span className="text-emerald-400 font-mono font-bold">
                    {settings.backgroundBlur ?? 0}px (
                    {(settings.backgroundBlur ?? 0) === 0 ? 'صورة فائقة النقاء والحدة' : 'تغبيش خفيف'}
                    )
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="8"
                  step="1"
                  value={settings.backgroundBlur ?? 0}
                  onChange={(e) => onUpdateSettings({ backgroundBlur: Number(e.target.value) })}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <span className="text-[11px] text-slate-400 block">
                  (0px = نقاء فائق بدون أي ضبابية)
                </span>
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
            <span className="text-xs text-slate-400 font-bold shrink-0">تصنيف المساجد:</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  filter === 'all' ? 'bg-emerald-500 text-slate-950 shadow' : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                الكل
              </button>
              <button
                onClick={() => setFilter('day')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                  filter === 'day' ? 'bg-amber-500 text-slate-950 shadow' : 'bg-slate-800 text-amber-300 hover:text-amber-200'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>مساجد بالنهار ☀️</span>
              </button>
              <button
                onClick={() => setFilter('night')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                  filter === 'night' ? 'bg-indigo-600 text-white shadow' : 'bg-slate-800 text-indigo-300 hover:text-indigo-200'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>مساجد بالليل 🌙</span>
              </button>
              <button
                onClick={() => setFilter('video')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                  filter === 'video' ? 'bg-teal-600 text-white shadow' : 'bg-slate-800 text-teal-300 hover:text-teal-200'
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                <span>فيديو Live 🎥</span>
              </button>
            </div>
          </div>

          {/* Mosque Backgrounds Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBackgrounds.map((bg) => {
              const isSelected = !autoDayNight && settings.activeBackgroundId === bg.id;

              return (
                <div
                  key={bg.id}
                  onClick={() => {
                    onUpdateSettings({
                      activeBackgroundId: bg.id,
                      autoDayNightBackground: false, // If user clicks a specific background, disable auto so their choice sticks!
                    });
                  }}
                  className={`group relative rounded-2xl overflow-hidden border-2 cursor-pointer transition-all flex flex-col justify-end min-h-[170px] p-4 text-right shadow-lg ${
                    isSelected
                      ? 'border-emerald-400 ring-2 ring-emerald-400/50 shadow-emerald-950/60 scale-[1.02]'
                      : 'border-slate-800 hover:border-slate-600 opacity-80 hover:opacity-100'
                  }`}
                >
                  {/* Background Image Thumbnail */}
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                    style={{ backgroundImage: `url('${bg.imageUrl}')` }}
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />

                  {/* Selected Badge */}
                  {isSelected && (
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-emerald-500 text-slate-950 text-xs font-bold flex items-center gap-1 shadow-lg">
                      <Check className="w-3.5 h-3.5" />
                      <span>مثبتة</span>
                    </div>
                  )}

                  {/* Period Tag (Day / Night / Video) */}
                  <div className="absolute top-3 right-3 flex items-center gap-1">
                    {bg.period === 'day' && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 text-[10px] font-black flex items-center gap-1 shadow">
                        <Sun className="w-3 h-3" />
                        <span>نهاري</span>
                      </span>
                    )}
                    {bg.period === 'night' && (
                      <span className="px-2 py-0.5 rounded-md bg-indigo-950 text-indigo-200 border border-indigo-700 text-[10px] font-bold flex items-center gap-1 shadow">
                        <Moon className="w-3 h-3 text-indigo-400" />
                        <span>ليلي</span>
                      </span>
                    )}
                    {bg.type === 'video' && (
                      <span className="px-2 py-0.5 rounded-md bg-teal-950 text-teal-200 border border-teal-700 text-[10px] font-bold flex items-center gap-1 shadow">
                        <Video className="w-3 h-3 text-teal-400" />
                        <span>فيديو</span>
                      </span>
                    )}
                  </div>

                  {/* Card Title & Subtitle */}
                  <div className="relative z-10 space-y-1">
                    <h4 className="text-sm font-bold text-white font-amiri drop-shadow">
                      {bg.title}
                    </h4>
                    <p className="text-[11px] text-slate-300 line-clamp-1 drop-shadow">
                      {bg.subtitle}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="text-xs text-slate-400 flex items-center gap-1">
            <Eye className="w-4 h-4 text-emerald-400" />
            <span>
              {autoDayNight
                ? 'الوضع التلقائي مفعّل: تتبدل مساجد النهار والليل تلقائياً مع كل صلاة'
                : 'تم تثبيت الخلفية المحددة'}
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-sm transition-colors shadow-lg"
          >
            تم والحفظ
          </button>
        </div>

      </div>
    </div>
  );
};
