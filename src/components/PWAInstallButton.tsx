import React, { useState } from 'react';
import { Download, WifiOff } from 'lucide-react';
import { useOnlineStatus, usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-[#05221c] border border-emerald-500/45 hover:border-[#fbbf24] text-emerald-300 hover:text-[#fbbf24] text-xs font-bold transition-all whitespace-nowrap shrink-0"
        title="تثبيت التطبيق للعمل بدون إنترنت"
      >
        <Download className="w-3.5 h-3.5" />
        <span>تثبيت التطبيق</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-[#05221c] border border-emerald-500/45 hover:border-[#fbbf24] text-emerald-300 text-xs font-bold transition-all whitespace-nowrap shrink-0"
          title="تثبيت التطبيق على iPhone / iPad"
        >
          <Download className="w-3.5 h-3.5" />
          <span>تثبيت التطبيق</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" dir="rtl">
            <div className="w-full max-w-sm rounded-2xl bg-[#041b16] border border-[#D4AF37]/50 p-6 shadow-2xl space-y-4 text-right">
              <h3 className="text-lg font-bold font-amiri text-[#F3CA63]">
                تثبيت التطبيق على iPhone / iPad
              </h3>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                ١. اضغط على زر <strong>المشاركة (Share)</strong> في شريط متصفح Safari.
                <br />
                ٢. اختر <strong>إضافة إلى الشاشة الرئيسية (Add to Home Screen)</strong> للوصول الفوري والعمل بدون إنترنت.
              </p>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8962E] text-slate-950 font-bold text-xs"
              >
                حسناً
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      dir="rtl"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-[#111C18]/95 border border-[#D4AF37]/60 px-3.5 py-2 text-xs font-bold text-[#F3CA63] shadow-xl backdrop-blur-md"
    >
      <WifiOff className="w-4 h-4 text-emerald-400 shrink-0" />
      <span>وضع عدم الاتصال — المواقيت والصوتيات المحفوظة تعمل</span>
    </div>
  );
};
