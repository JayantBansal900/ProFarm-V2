export interface WmoCodeInfo {
  code: number;
  description: string;
  icon: string; // Weather emoji / icon
  category: 'clear' | 'cloudy' | 'fog' | 'drizzle' | 'rain' | 'snow' | 'thunderstorm';
}

export const WMO_WEATHER_CODES: Record<number, WmoCodeInfo> = {
  0: { code: 0, description: 'Clear sky', icon: '☀️', category: 'clear' },
  1: { code: 1, description: 'Mainly clear', icon: '🌤️', category: 'clear' },
  2: { code: 2, description: 'Partly cloudy', icon: '⛅', category: 'cloudy' },
  3: { code: 3, description: 'Overcast', icon: '☁️', category: 'cloudy' },
  45: { code: 45, description: 'Foggy', icon: '🌫️', category: 'fog' },
  48: { code: 48, description: 'Depositing rime fog', icon: '🌫️', category: 'fog' },
  51: { code: 51, description: 'Light drizzle', icon: '🌦️', category: 'drizzle' },
  53: { code: 53, description: 'Moderate drizzle', icon: '🌦️', category: 'drizzle' },
  55: { code: 55, description: 'Dense drizzle', icon: '🌧️', category: 'drizzle' },
  56: { code: 56, description: 'Light freezing drizzle', icon: '🌨️', category: 'drizzle' },
  57: { code: 57, description: 'Dense freezing drizzle', icon: '🌨️', category: 'drizzle' },
  61: { code: 61, description: 'Slight rain', icon: '🌦️', category: 'rain' },
  63: { code: 63, description: 'Moderate rain', icon: '🌧️', category: 'rain' },
  65: { code: 65, description: 'Heavy rain', icon: '🌧️', category: 'rain' },
  66: { code: 66, description: 'Light freezing rain', icon: '🌨️', category: 'rain' },
  67: { code: 67, description: 'Heavy freezing rain', icon: '🌨️', category: 'rain' },
  71: { code: 71, description: 'Slight snowfall', icon: '🌨️', category: 'snow' },
  73: { code: 73, description: 'Moderate snowfall', icon: '❄️', category: 'snow' },
  75: { code: 75, description: 'Heavy snowfall', icon: '❄️', category: 'snow' },
  77: { code: 77, description: 'Snow grains', icon: '❄️', category: 'snow' },
  80: { code: 80, description: 'Slight rain showers', icon: '🌦️', category: 'rain' },
  81: { code: 81, description: 'Moderate rain showers', icon: '🌧️', category: 'rain' },
  82: { code: 82, description: 'Violent rain showers', icon: '⛈️', category: 'rain' },
  85: { code: 85, description: 'Slight snow showers', icon: '🌨️', category: 'snow' },
  86: { code: 86, description: 'Heavy snow showers', icon: '❄️', category: 'snow' },
  95: { code: 95, description: 'Thunderstorm', icon: '⛈️', category: 'thunderstorm' },
  96: { code: 96, description: 'Thunderstorm with slight hail', icon: '⛈️', category: 'thunderstorm' },
  99: { code: 99, description: 'Thunderstorm with heavy hail', icon: '⛈️', category: 'thunderstorm' },
};

export function getWmoInfo(code: number): WmoCodeInfo {
  return (
    WMO_WEATHER_CODES[code] || {
      code,
      description: 'Variable weather',
      icon: '🌤️',
      category: 'cloudy',
    }
  );
}

// ---------------------------------------------------------------------------
// Farmer Weather Guidance Rules (Threshold-based)
// ---------------------------------------------------------------------------

export interface WeatherGuidanceItem {
  id: string;
  type: 'rain' | 'heat' | 'wind' | 'dry' | 'favorable';
  severity: 'info' | 'advisory' | 'caution';
  title: string;
  message: string;
}

export interface GuidanceInputMetrics {
  currentTemp: number;
  maxTempToday: number;
  currentPrecip: number;
  todayPrecipSum: number;
  tomorrowPrecipSum: number;
  maxWindSpeed: number;
  sevenDayPrecipSum: number;
  maxPrecipProb: number;
}

export function generateFarmerGuidance(metrics: GuidanceInputMetrics): WeatherGuidanceItem[] {
  const guidance: WeatherGuidanceItem[] = [];

  // 1. Heavy rainfall anticipated today or tomorrow
  if (metrics.todayPrecipSum >= 30 || metrics.tomorrowPrecipSum >= 30) {
    guidance.push({
      id: 'rain-heavy',
      type: 'rain',
      severity: 'caution',
      title: 'Heavy Rain Expected',
      message:
        'Significant precipitation is forecast. Inspect field drainage channels to prevent waterlogging in pulse and vegetable beds. Postpone fertilizer broadcasting and pesticide spraying to prevent runoff wash-off.',
    });
  } else if (metrics.todayPrecipSum >= 10 || metrics.tomorrowPrecipSum >= 10 || metrics.maxPrecipProb >= 60) {
    guidance.push({
      id: 'rain-moderate',
      type: 'rain',
      severity: 'advisory',
      title: 'Rainfall Expected',
      message:
        'Light to moderate showers are forecast. Consider delaying scheduled field irrigations to conserve water and power. Review upcoming harvesting or drying operations.',
    });
  }

  // 2. High Temperature / Heat stress
  if (metrics.maxTempToday >= 40) {
    guidance.push({
      id: 'heat-extreme',
      type: 'heat',
      severity: 'caution',
      title: 'High Heat Conditions (40°C+)',
      message:
        'High daytime temperatures can induce moisture stress and flower shedding. Ensure light, frequent evening irrigations and provide shade or mulching for nursery saplings.',
    });
  } else if (metrics.maxTempToday >= 36) {
    guidance.push({
      id: 'heat-moderate',
      type: 'heat',
      severity: 'advisory',
      title: 'Elevated Daytime Temperatures',
      message:
        'Temperatures are running above 36°C. Monitor soil moisture in sandy and shallow soils; prioritize morning or late evening operations for field laborers.',
    });
  }

  // 3. High Wind Speed
  if (metrics.maxWindSpeed >= 35) {
    guidance.push({
      id: 'wind-high',
      type: 'wind',
      severity: 'caution',
      title: 'Gusty Winds Forecast (35+ km/h)',
      message:
        'Strong wind gusts may cause lodging in tall crops (maize, sugarcane) and tear greenhouse shade nets. Check staking for horticultural crops and postpone foliar spraying.',
    });
  } else if (metrics.maxWindSpeed >= 25) {
    guidance.push({
      id: 'wind-moderate',
      type: 'wind',
      severity: 'info',
      title: 'Breezy Conditions',
      message:
        'Moderate winds may cause spray drift. Ensure spray nozzles are set low if applying foliar nutrients.',
    });
  }

  // 4. Extended dry conditions
  if (metrics.sevenDayPrecipSum < 2 && metrics.todayPrecipSum < 1 && metrics.tomorrowPrecipSum < 1) {
    guidance.push({
      id: 'dry-spell',
      type: 'dry',
      severity: 'info',
      title: 'Dry Conditions Ahead',
      message:
        'Minimal rainfall is predicted over the 7-day forecast. Check soil moisture at root depth and plan scheduled irrigations, particularly for crops in flowering or grain filling stages.',
    });
  }

  // Default neutral state if no threshold is met
  if (guidance.length === 0) {
    guidance.push({
      id: 'normal-favorable',
      type: 'favorable',
      severity: 'info',
      title: 'Normal Seasonal Conditions',
      message:
        'No extreme weather thresholds are flagged for the immediate period. Standard seasonal farm management and routine field maintenance can proceed as planned.',
    });
  }

  return guidance;
}
