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

export interface WeatherGuidanceItem {
  id: string;
  type: 'rain' | 'heat' | 'wind' | 'dry' | 'favorable';
  severity: 'info' | 'advisory' | 'caution';
  title: string;
  message: string;
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

export interface LocationsSearchResponse {
  status: 'success';
  count: number;
  locations: LocationResult[];
}

export interface ForecastResponse {
  status: 'success';
  forecast: NormalizedForecastResponse;
}
