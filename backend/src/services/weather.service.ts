import { MemoryCache } from '../lib/memoryCache';
import { upstreamForecastSchema, upstreamGeocodingSchema } from '../validators/weatherUpstream.validator';
import { getWmoInfo, generateFarmerGuidance, WeatherGuidanceItem } from '../lib/weatherCodes';

export interface LocationResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  elevation?: number;
  country: string;
  state?: string;
  district?: string;
  subDistrict?: string;
  timezone: string;
}

export interface CurrentWeatherView {
  temperatureC: number;
  apparentTemperatureC: number;
  relativeHumidity: number;
  precipitationMm: number;
  weatherCode: number;
  condition: string;
  icon: string;
  cloudCover: number;
  windSpeedKmH: number;
  isDay: boolean;
  timestamp: string;
}

export interface DailyForecastDay {
  date: string;
  weatherCode: number;
  condition: string;
  icon: string;
  tempMaxC: number;
  tempMinC: number;
  precipitationSumMm: number;
  precipitationProbabilityMax: number;
  windSpeedMaxKmH: number;
}

export interface RainfallIntelligenceSummary {
  todayExpectedMm: number;
  tomorrowExpectedMm: number;
  sevenDayTotalMm: number;
  maxDailyProbabilityPercent: number;
  heavyRainDays: string[];
}

export interface NormalizedForecastResponse {
  location: {
    latitude: number;
    longitude: number;
    elevation?: number;
    timezone: string;
    locationName?: string;
  };
  current: CurrentWeatherView;
  daily: DailyForecastDay[];
  rainfallSummary: RainfallIntelligenceSummary;
  guidance: WeatherGuidanceItem[];
  attribution: {
    provider: string;
    notice: string;
    url: string;
  };
  dataFreshness: {
    fetchedAt: string;
    cached: boolean;
  };
}

// ---------------------------------------------------------------------------
// In-Memory Caches
// ---------------------------------------------------------------------------

const GEOCODING_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const FORECAST_TTL_MS = 15 * 60 * 1000; // 15 minutes

const geocodingCache = new MemoryCache<LocationResult[]>(200);
const forecastCache = new MemoryCache<NormalizedForecastResponse>(200);

// Export caches for inspection/clearing in tests
export const weatherCacheManager = {
  geocoding: geocodingCache,
  forecast: forecastCache,
  clearAll: () => {
    geocodingCache.clear();
    forecastCache.clear();
  },
};

// ---------------------------------------------------------------------------
// Open-Meteo Endpoints
// ---------------------------------------------------------------------------

const GEOCODING_BASE_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_BASE_URL = 'https://api.open-meteo.com/v1/forecast';
const REQUEST_TIMEOUT_MS = 8000;

// ---------------------------------------------------------------------------
// Geocoding Service
// ---------------------------------------------------------------------------

export async function searchLocations(query: string): Promise<LocationResult[]> {
  const cacheKey = query.trim().toLowerCase();
  const cached = geocodingCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const url = `${GEOCODING_BASE_URL}?name=${encodeURIComponent(query.trim())}&count=10&language=en&format=json&countryCode=IN`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'ProFarm-Agricultural-Platform/2.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Geocoding upstream responded with status ${response.status}`);
    }

    const data = (await response.json()) as {
      results?: Array<{
        id: number;
        name: string;
        latitude: number;
        longitude: number;
        elevation?: number;
        country: string;
        admin1?: string;
        admin2?: string;
        admin3?: string;
        timezone?: string;
      }>;
    };

    if (!upstreamGeocodingSchema.safeParse(data).success) {
      throw new Error('Malformed upstream geocoding response format');
    }
    if (!data.results) {
      geocodingCache.set(cacheKey, [], GEOCODING_TTL_MS);
      return [];
    }

    const normalized: LocationResult[] = data.results.filter((item) => item.country === 'India').map((item) => ({
      id: item.id,
      name: item.name,
      latitude: item.latitude,
      longitude: item.longitude,
      elevation: item.elevation,
      country: item.country || 'India',
      state: item.admin1,
      district: item.admin2,
      subDistrict: item.admin3,
      timezone: item.timezone || 'Asia/Kolkata',
    }));

    geocodingCache.set(cacheKey, normalized, GEOCODING_TTL_MS);
    return normalized;
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Geocoding request timed out. Please try again.');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ---------------------------------------------------------------------------
// Forecast Service
// ---------------------------------------------------------------------------

export async function getForecast(
  latitude: number | string,
  longitude: number | string,
  locationName?: string
): Promise<NormalizedForecastResponse> {
  const numLat = typeof latitude === 'number' ? latitude : parseFloat(latitude);
  const numLon = typeof longitude === 'number' ? longitude : parseFloat(longitude);

  // Round coordinates to 2 decimal places for cache key (~1km radius)
  const latKey = numLat.toFixed(2);
  const lonKey = numLon.toFixed(2);
  const cacheKey = `${latKey},${lonKey}`;

  const cached = forecastCache.get(cacheKey);
  if (cached) {
    return {
      ...cached,
      location: {
        ...cached.location,
        locationName: locationName || cached.location.locationName,
      },
      dataFreshness: {
        ...cached.dataFreshness,
        cached: true,
      },
    };
  }

  const queryParams = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    current:
      'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,cloud_cover,wind_speed_10m,is_day',
    daily:
      'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max',
    timezone: 'auto',
    forecast_days: '7',
  });

  const url = `${FORECAST_BASE_URL}?${queryParams.toString()}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'ProFarm-Agricultural-Platform/2.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Forecast upstream responded with status ${response.status}`);
    }

    const raw = (await response.json()) as {
      current?: {
        temperature_2m: number;
        apparent_temperature: number;
        relative_humidity_2m: number;
        precipitation: number;
        weather_code: number;
        cloud_cover: number;
        wind_speed_10m: number;
        is_day: number;
        time: string;
      };
      daily?: {
        time: string[];
        weather_code: number[];
        temperature_2m_max: number[];
        temperature_2m_min: number[];
        precipitation_sum: number[];
        precipitation_probability_max: number[];
        wind_speed_10m_max: number[];
      };
      elevation?: number;
      timezone?: string;
      latitude?: number;
      longitude?: number;
    };

    if (!raw.current || !raw.daily || !upstreamForecastSchema.safeParse(raw).success) {
      throw new Error('Malformed upstream weather response format');
    }
    // Reject partial/missing values before normalization; never invent zero rain
    // or temperatures for unavailable provider observations.

    // Normalize Current
    const currentWmo = getWmoInfo(raw.current.weather_code);
    const current: CurrentWeatherView = {
      temperatureC: Math.round(raw.current.temperature_2m * 10) / 10,
      apparentTemperatureC: Math.round(raw.current.apparent_temperature * 10) / 10,
      relativeHumidity: raw.current.relative_humidity_2m,
      precipitationMm: raw.current.precipitation,
      weatherCode: raw.current.weather_code,
      condition: currentWmo.description,
      icon: currentWmo.icon,
      cloudCover: raw.current.cloud_cover,
      windSpeedKmH: Math.round(raw.current.wind_speed_10m * 10) / 10,
      isDay: raw.current.is_day === 1,
      timestamp: raw.current.time,
    };

    // Normalize Daily (7 days)
    const daily: DailyForecastDay[] = [];
    const times: string[] = raw.daily.time || [];
    const codes: number[] = raw.daily.weather_code || [];
    const maxTemps: number[] = raw.daily.temperature_2m_max || [];
    const minTemps: number[] = raw.daily.temperature_2m_min || [];
    const precipSums: number[] = raw.daily.precipitation_sum || [];
    const precipProbs: number[] = raw.daily.precipitation_probability_max || [];
    const windSpeeds: number[] = raw.daily.wind_speed_10m_max || [];

    let sevenDayTotalMm = 0;
    let maxDailyProb = 0;
    const heavyRainDays: string[] = [];

    for (let i = 0; i < times.length; i++) {
      const code = codes[i] ?? 0;
      const wmo = getWmoInfo(code);
      const precip = precipSums[i] ?? 0;
      const prob = precipProbs[i] ?? 0;

      sevenDayTotalMm += precip;
      if (prob > maxDailyProb) maxDailyProb = prob;
      if (precip >= 15) {
        heavyRainDays.push(times[i]);
      }

      daily.push({
        date: times[i],
        weatherCode: code,
        condition: wmo.description,
        icon: wmo.icon,
        tempMaxC: Math.round((maxTemps[i] ?? 0) * 10) / 10,
        tempMinC: Math.round((minTemps[i] ?? 0) * 10) / 10,
        precipitationSumMm: Math.round(precip * 10) / 10,
        precipitationProbabilityMax: prob,
        windSpeedMaxKmH: Math.round((windSpeeds[i] ?? 0) * 10) / 10,
      });
    }

    const rainfallSummary: RainfallIntelligenceSummary = {
      todayExpectedMm: Math.round((precipSums[0] ?? 0) * 10) / 10,
      tomorrowExpectedMm: Math.round((precipSums[1] ?? 0) * 10) / 10,
      sevenDayTotalMm: Math.round(sevenDayTotalMm * 10) / 10,
      maxDailyProbabilityPercent: maxDailyProb,
      heavyRainDays,
    };

    // Generate Farmer Guidance
    const maxWind = Math.max(...windSpeeds, 0);
    const guidance = generateFarmerGuidance({
      currentTemp: current.temperatureC,
      maxTempToday: maxTemps[0] ?? current.temperatureC,
      currentPrecip: current.precipitationMm,
      todayPrecipSum: rainfallSummary.todayExpectedMm,
      tomorrowPrecipSum: rainfallSummary.tomorrowExpectedMm,
      maxWindSpeed: maxWind,
      sevenDayPrecipSum: rainfallSummary.sevenDayTotalMm,
      maxPrecipProb: maxDailyProb,
    });

    const normalized: NormalizedForecastResponse = {
      location: {
        latitude: typeof raw.latitude === 'number' ? raw.latitude : numLat,
        longitude: typeof raw.longitude === 'number' ? raw.longitude : numLon,
        elevation: raw.elevation,
        timezone: raw.timezone || 'Asia/Kolkata',
        locationName,
      },
      current,
      daily,
      rainfallSummary,
      guidance,
      attribution: {
        provider: 'Open-Meteo',
        notice: 'Weather data provided by Open-Meteo.com under Non-Commercial attribution terms.',
        url: 'https://open-meteo.com',
      },
      dataFreshness: {
        fetchedAt: new Date().toISOString(),
        cached: false,
      },
    };

    forecastCache.set(cacheKey, normalized, FORECAST_TTL_MS);
    return normalized;
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Weather forecast request timed out. Please try again.');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
