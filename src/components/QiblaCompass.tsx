import React, { useState, useEffect } from 'react';
import { Compass, MapPin, Navigation, RotateCw } from 'lucide-react';
import { CityLocation } from '../types';
import { calculateQiblaDirection } from '../utils/prayerCalculator';

interface QiblaCompassProps {
  currentLocation: CityLocation;
}

export const QiblaCompass: React.FC<QiblaCompassProps> = ({ currentLocation }) => {
  const [heading, setHeading] = useState<number>(0);
  const [manualRotation, setManualRotation] = useState<number>(0);

  const qiblaAngle = calculateQiblaDirection(currentLocation.lat, currentLocation.lng);

  useEffect(() => {
    // Try to use DeviceOrientation API if available on mobile
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.alpha !== null) {
        setHeading(e.alpha);
      }
    };

    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation, true);
    }

    return () => {
      if (window.DeviceOrientationEvent) {
        window.removeEventListener('deviceorientation', handleOrientation, true);
      }
    };
  }, []);

  const totalRotation = (qiblaAngle - heading + manualRotation) % 360;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-slate-900/80 border border-emerald-900/40 rounded-3xl p-6 md:p-8 text-center shadow-xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-4">
          <Compass className="w-4 h-4" />
          <span>تحديد اتجاه القبلة بدقة</span>
        </div>

        <h2 className="text-2xl font-bold text-white font-amiri mb-2">الوجهة نحو الكعبة المشرفة</h2>
        <p className="text-slate-400 text-sm flex items-center justify-center gap-1 mb-6">
          <MapPin className="w-4 h-4 text-emerald-400" />
          <span>الموقع الحالي: {currentLocation.nameAr} ({currentLocation.countryAr})</span>
        </p>

        {/* Compass Dial */}
        <div className="relative w-72 h-72 md:w-80 md:h-80 mx-auto my-8 flex items-center justify-center">
          {/* Outer Ring */}
          <div className="absolute inset-0 rounded-full border-4 border-emerald-800/60 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 shadow-2xl flex items-center justify-center">
            
            {/* Cardinal points */}
            <span className="absolute top-3 text-xs font-bold text-slate-400">الشمال (N)</span>
            <span className="absolute bottom-3 text-xs font-bold text-slate-400">الجنوب (S)</span>
            <span className="absolute right-3 text-xs font-bold text-slate-400">الشرق (E)</span>
            <span className="absolute left-3 text-xs font-bold text-slate-400">الغرب (W)</span>

            {/* Rotating Needle / Kaaba Indicator */}
            <div
              className="absolute inset-0 flex items-center justify-center transition-transform duration-300 ease-out"
              style={{ transform: `rotate(${totalRotation}deg)` }}
            >
              <div className="w-full h-full relative flex items-center justify-center">
                {/* Needle pointing to Qibla */}
                <div className="absolute top-6 w-10 h-24 bg-gradient-to-t from-emerald-600 to-amber-400 rounded-t-full shadow-lg flex flex-col items-center pt-2">
                  <span className="text-xs text-slate-950 font-black">🕋</span>
                </div>
              </div>
            </div>

            {/* Center Pin */}
            <div className="w-8 h-8 rounded-full bg-emerald-500 border-4 border-slate-950 z-10 shadow-lg flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-white"></div>
            </div>
          </div>
        </div>

        {/* Angle & Distance Info */}
        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-6">
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
            <span className="text-xs text-slate-400 block mb-1">زاوية القبلة</span>
            <span className="text-2xl font-bold text-emerald-400 font-mono">
              {qiblaAngle.toFixed(1)}°
            </span>
          </div>
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
            <span className="text-xs text-slate-400 block mb-1">المسافة إلى مكة</span>
            <span className="text-2xl font-bold text-amber-400 font-mono">
              ~ تقريبي
            </span>
          </div>
        </div>

        {/* Manual adjustment controls */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setManualRotation(prev => prev - 15)}
            className="flex items-center gap-1 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors"
          >
            <RotateCw className="w-4 h-4 -scale-x-100" />
            <span>تدوير لليسار</span>
          </button>
          <button
            onClick={() => setManualRotation(0)}
            className="px-4 py-2 rounded-xl bg-emerald-900/40 text-emerald-300 hover:bg-emerald-800/60 text-sm font-medium transition-colors"
          >
            إعادة ضبط
          </button>
          <button
            onClick={() => setManualRotation(prev => prev + 15)}
            className="flex items-center gap-1 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors"
          >
            <span>تدوير لليمين</span>
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
