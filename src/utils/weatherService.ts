// Weather service using Open-Meteo API (free, reliable, no API key required)

export interface WeatherData {
  temperature: number; // in Celsius
  weatherCode: number;
  descriptionAr: string;
  iconType: 'sun' | 'cloud-sun' | 'cloud' | 'rain' | 'storm' | 'snow' | 'fog';
  windSpeed: number; // km/h
  humidity: number; // %
  isDay: boolean;
  cityId: string;
  updatedAt: string;
}

// Convert Open-Meteo WMO weather codes to Arabic description and icon type
export function getWeatherDetails(code: number, isDay: boolean = true): { descriptionAr: string; iconType: WeatherData['iconType'] } {
  switch (code) {
    case 0:
      return {
        descriptionAr: isDay ? 'صافٍ مشمس' : 'سماء صافية',
        iconType: isDay ? 'sun' : 'cloud-sun',
      };
    case 1:
      return {
        descriptionAr: 'صحو بوجه عام',
        iconType: 'cloud-sun',
      };
    case 2:
      return {
        descriptionAr: 'غائم جزئياً',
        iconType: 'cloud-sun',
      };
    case 3:
      return {
        descriptionAr: 'غائم كلياً',
        iconType: 'cloud',
      };
    case 45:
    case 48:
      return {
        descriptionAr: 'ضباب وأجواء باردة',
        iconType: 'fog',
      };
    case 51:
    case 53:
    case 55:
      return {
        descriptionAr: 'رذاذ خفيف',
        iconType: 'rain',
      };
    case 61:
    case 63:
    case 65:
      return {
        descriptionAr: 'أمطار خيرة مباركة',
        iconType: 'rain',
      };
    case 71:
    case 73:
    case 75:
      return {
        descriptionAr: 'تساقط ثلوج',
        iconType: 'snow',
      };
    case 80:
    case 81:
    case 82:
      return {
        descriptionAr: 'زخات مطر',
        iconType: 'rain',
      };
    case 95:
    case 96:
    case 99:
      return {
        descriptionAr: 'عواصف رعدية وأمطار',
        iconType: 'storm',
      };
    default:
      return {
        descriptionAr: 'معتدل ومستقر',
        iconType: 'sun',
      };
  }
}

// In-memory cache to prevent unnecessary repeat requests
const weatherCache = new Map<string, { data: WeatherData; timestamp: number }>();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

export async function fetchWeather(lat: number, lng: number, cityId: string): Promise<WeatherData> {
  const cacheKey = `${lat.toFixed(2)},${lng.toFixed(2)}`;
  const cached = weatherCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&hourly=relativehumidity_2m&timezone=auto`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Weather API returned ${res.status}`);
    }
    const json = await res.json();
    const current = json.current_weather;
    const isDay = current.is_day === 1;
    const { descriptionAr, iconType } = getWeatherDetails(current.weathercode, isDay);

    // Approximate humidity from hourly or default to 50%
    let humidity = 50;
    if (json.hourly && Array.isArray(json.hourly.relativehumidity_2m) && json.hourly.relativehumidity_2m.length > 0) {
      const hourIndex = new Date().getHours();
      humidity = json.hourly.relativehumidity_2m[hourIndex] ?? 50;
    }

    const weatherData: WeatherData = {
      temperature: Math.round(current.temperature),
      weatherCode: current.weathercode,
      descriptionAr,
      iconType,
      windSpeed: Math.round(current.windspeed),
      humidity: Math.round(humidity),
      isDay,
      cityId,
      updatedAt: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    };

    weatherCache.set(cacheKey, { data: weatherData, timestamp: Date.now() });
    return weatherData;
  } catch (err) {
    console.warn('Weather fetch error:', err);
    // Provide a sensible fallback based on city coordinates
    const fallback: WeatherData = {
      temperature: lat < 25 ? 28 : 22,
      weatherCode: 0,
      descriptionAr: 'أجواء معتدلة وصافية',
      iconType: 'sun',
      windSpeed: 12,
      humidity: 55,
      isDay: true,
      cityId,
      updatedAt: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    };
    return fallback;
  }
}
