import React, { useState, useEffect } from 'react';
import {
  Sun,
  CloudSun,
  Cloud,
  CloudRain,
  CloudLightning,
  CloudSnow,
  Wind,
  Droplets,
  RefreshCw,
} from 'lucide-react';
import { CityLocation } from '../types';
import { WeatherData, fetchWeather } from '../utils/weatherService';

interface WeatherWidgetProps {
  currentLocation: CityLocation;
  compact?: boolean;
  showFullStripOnMobile?: boolean;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({
  currentLocation,
  compact = false,
  showFullStripOnMobile = false,
}) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadWeather = async () => {
    setLoading(true);
    try {
      const data = await fetchWeather(currentLocation.lat, currentLocation.lng, currentLocation.id);
      setWeather(data);
    } catch (e) {
      console.warn('Weather fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWeather();
  }, [currentLocation.lat, currentLocation.lng, currentLocation.id]);

  const renderIcon = (type?: WeatherData['iconType']) => {
    switch (type) {
      case 'sun':
        return <Sun className="w-5 h-5 text-amber-400 animate-spin-slow" />;
      case 'cloud-sun':
        return <CloudSun className="w-5 h-5 text-amber-300" />;
      case 'cloud':
        return <Cloud className="w-5 h-5 text-slate-300" />;
      case 'rain':
        return <CloudRain className="w-5 h-5 text-sky-400" />;
      case 'storm':
        return <CloudLightning className="w-5 h-5 text-amber-400 animate-pulse" />;
      case 'snow':
        return <CloudSnow className="w-5 h-5 text-sky-200" />;
      default:
        return <Sun className="w-5 h-5 text-amber-400" />;
    }
  };

  if (showFullStripOnMobile) {
    return (
      <div
        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[#071E17] border border-[#D4AF37]/30 text-xs text-slate-100 shadow-inner"
        title={`الطقس في ${currentLocation.nameAr}: ${weather?.descriptionAr || 'غائم كلياً'}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {loading ? (
            <RefreshCw className="w-4 h-4 text-[#D4AF37] animate-spin shrink-0" />
          ) : (
            <span className="shrink-0">{renderIcon(weather?.iconType)}</span>
          )}
          <span className="font-bold text-[#F3D078] font-mono tabular-nums shrink-0" dir="ltr">
            {weather?.temperature ?? 23}°C
          </span>
          <span className="text-slate-100 font-semibold truncate">
            {weather?.descriptionAr || 'غائم كلياً'}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0 text-[11px] tabular-nums">
          <span className="text-[#D4AF37]/35" aria-hidden="true">|</span>
          <span className="inline-flex items-center gap-1 text-sky-300 font-mono">
            <span aria-hidden="true">💧</span>
            <span>{weather?.humidity ?? 48}%</span>
          </span>
          <span className="text-[#D4AF37]/35" aria-hidden="true">|</span>
          <span className="inline-flex items-center gap-1 text-[#34D399] font-mono">
            <span aria-hidden="true">💨</span>
            <span>{weather?.windSpeed ?? 8} كم/س</span>
          </span>
          <button
            type="button"
            onClick={loadWeather}
            className="p-1 rounded-lg text-[#D4AF37]/80 hover:text-[#F3D078] transition-colors"
            title="تحديث الطقس"
            aria-label="تحديث حالة الطقس"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#041d17]/90 border border-[#e5b869]/35 text-xs text-slate-200 backdrop-blur-md whitespace-nowrap shadow-inner"
        title={`الطقس في ${currentLocation.nameAr}: ${weather?.descriptionAr || 'غائم جزئياً'}`}
      >
        {loading ? (
          <RefreshCw className="w-3.5 h-3.5 text-[#e5b869] animate-spin shrink-0" />
        ) : (
          <span className="shrink-0">{renderIcon(weather?.iconType)}</span>
        )}
        <span className="font-bold text-[#fbbf24] font-mono tabular-nums">
          {weather?.temperature ?? 24}°C
        </span>
        <span className="text-slate-200 font-medium text-[11px]">
          {weather?.descriptionAr || 'غائم جزئياً'}
        </span>
        <span className="hidden lg:inline text-[#e5b869]/40" aria-hidden="true">|</span>
        <span className="hidden lg:inline-flex items-center gap-1 text-[11px] text-sky-300 font-mono tabular-nums">
          <span>💧</span>
          <span>{weather?.humidity ?? 44}%</span>
        </span>
        <span className="hidden lg:inline text-[#e5b869]/40" aria-hidden="true">|</span>
        <span className="hidden lg:inline-flex items-center gap-1 text-[11px] text-emerald-300 font-mono tabular-nums">
          <span>💨</span>
          <span>{weather?.windSpeed ?? 18} كم/س</span>
        </span>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/70 border border-emerald-900/40 rounded-2xl p-4 shadow-lg backdrop-blur-md flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
          {loading ? (
            <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin" />
          ) : (
            renderIcon(weather?.iconType)
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-amber-300 font-mono">
              {weather?.temperature ?? 24}°C
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
              {weather?.descriptionAr || 'أجواء معتدلة'}
            </span>
          </div>
          <span className="text-xs text-slate-400 block mt-0.5">
            حالة الطقس الحالية في {currentLocation.nameAr}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs text-slate-300">
        <div className="flex items-center gap-1 bg-slate-950/50 px-2.5 py-1.5 rounded-lg border border-slate-800" title="الرطوبة">
          <Droplets className="w-3.5 h-3.5 text-sky-400" />
          <span className="font-mono">{weather?.humidity ?? 50}%</span>
        </div>
        <div className="flex items-center gap-1 bg-slate-950/50 px-2.5 py-1.5 rounded-lg border border-slate-800" title="سرعة الرياح">
          <Wind className="w-3.5 h-3.5 text-teal-400" />
          <span className="font-mono">{weather?.windSpeed ?? 12} كم/س</span>
        </div>
      </div>
    </div>
  );
};
