import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../../services/api';
import { LocationResult, NormalizedForecastResponse } from '../../types/weather';

export const STORAGE_KEY = 'profarm_weather_selected_location';

export function isValidSavedLocation(data: unknown): data is LocationResult {
  if (!data || typeof data !== 'object') return false;
  const item = data as Record<string, unknown>;
  return (
    typeof item.name === 'string' &&
    item.name.trim().length > 0 &&
    typeof item.latitude === 'number' &&
    !isNaN(item.latitude) &&
    item.latitude >= -90 &&
    item.latitude <= 90 &&
    typeof item.longitude === 'number' &&
    !isNaN(item.longitude) &&
    item.longitude >= -180 &&
    item.longitude <= 180
  );
}

export function getStoredLocation(): LocationResult | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    if (isValidSavedLocation(parsed)) {
      return parsed;
    }
    // Clean up malformed data
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  } catch {
    // Clean up unparseable JSON
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  }
  return null;
}

export const WeatherPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [selectedLocation, setSelectedLocation] = useState<LocationResult | null>(() => {
    return getStoredLocation();
  });

  const [forecast, setForecast] = useState<NormalizedForecastResponse | null>(null);
  const [isLoadingForecast, setIsLoadingForecast] = useState<boolean>(() => {
    return getStoredLocation() !== null;
  });
  const [forecastError, setForecastError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // ---------------------------------------------------------------------------
  // Debounced Location Search
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setSearchError(null);
      setIsSearching(false);
      return;
    }

    let isCancelled = false;
    const controller = new AbortController();

    const timer = setTimeout(async () => {
      setIsSearching(true);
      setSearchError(null);

      try {
        const response = await api.searchLocations(searchQuery, controller.signal);
        if (!isCancelled) {
          setSearchResults(response.locations || []);
        }
      } catch (err: unknown) {
        if (isCancelled) return;
        if (err instanceof Error && (err.name === 'AbortError' || err.message.includes('aborted'))) return;
        if (err instanceof ApiError) {
          if (err.message.includes('aborted')) return;
          setSearchError(err.message);
        } else {
          setSearchError('Failed to search locations. Please check your connection.');
        }
        setSearchResults([]);
      } finally {
        if (!isCancelled) {
          setIsSearching(false);
        }
      }
    }, 350);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery]);

  // ---------------------------------------------------------------------------
  // Fetch Forecast on Location Selection or Mount
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!selectedLocation) {
      setForecast(null);
      setForecastError(null);
      setIsLoadingForecast(false);
      return;
    }

    let isCancelled = false;
    const controller = new AbortController();

    const loadForecast = async () => {
      setIsLoadingForecast(true);
      setForecastError(null);

      const displayName = selectedLocation.district
        ? `${selectedLocation.name}, ${selectedLocation.district}`
        : selectedLocation.state
        ? `${selectedLocation.name}, ${selectedLocation.state}`
        : selectedLocation.name;

      try {
        const response = await api.getWeatherForecast(
          selectedLocation.latitude,
          selectedLocation.longitude,
          displayName,
          controller.signal
        );

        if (!isCancelled) {
          setForecast(response.forecast);
          setForecastError(null);
        }
      } catch (err: unknown) {
        if (isCancelled) return;
        if (err instanceof Error && (err.name === 'AbortError' || err.message.includes('aborted'))) {
          return;
        }
        if (err instanceof ApiError) {
          if (err.message.includes('aborted') || err.message.includes('AbortError')) {
            return;
          }
          setForecastError(err.message);
        } else {
          setForecastError('Failed to fetch weather forecast. Please try again.');
        }
        setForecast(null);
      } finally {
        if (!isCancelled) {
          setIsLoadingForecast(false);
        }
      }
    };

    loadForecast();

    return () => {
      isCancelled = true;
      controller.abort();
    };
  }, [selectedLocation, refreshTrigger]);

  const handleSelectLocation = (loc: LocationResult) => {
    setSelectedLocation(loc);
    setSearchQuery('');
    setSearchResults([]);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
    } catch {
      // Ignore localStorage errors
    }
  };

  const handleClearLocation = () => {
    setSelectedLocation(null);
    setForecast(null);
    setForecastError(null);
    setIsLoadingForecast(false);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore localStorage errors
    }
  };

  const handleRetryForecast = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="text-xs text-slate-500 flex items-center space-x-2">
        <Link to="/" className="hover:text-green-700">Home</Link>
        <span>/</span>
        <Link to="/tools" className="hover:text-green-700">Farm Tools</Link>
        <span>/</span>
        <span className="text-slate-800 font-semibold">Weather & Rainfall Intelligence</span>
      </nav>

      {/* Hero Header */}
      <div className="bg-gradient-to-r from-blue-900 via-sky-800 to-indigo-900 text-white rounded-xl p-6 sm:p-8 shadow-sm">
        <div className="max-w-3xl">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-sky-950/60 text-sky-200 border border-sky-400/30 mb-3">
            Live Meteorological Intelligence • Open-Meteo Integration
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Live Weather & Rainfall Forecasting
          </h1>
          <p className="mt-2 text-sky-100 text-sm sm:text-base leading-relaxed">
            Real-time model-based weather observations, 7-day precipitation outlooks, and transparent agronomic weather guidance designed to help Indian farmers plan sowing, irrigation, and field operations.
          </p>
        </div>
      </div>

      {/* Location Search Bar & Selector */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <label htmlFor="location-input" className="block text-sm font-semibold text-slate-800">
            Search Indian Village, Town, or City
          </label>
          {selectedLocation && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-500">Active location:</span>
              <span className="text-xs font-bold text-slate-800 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded">
                📍 {selectedLocation.name}{selectedLocation.state ? `, ${selectedLocation.state}` : ''}
              </span>
              <button
                type="button"
                onClick={handleClearLocation}
                className="text-xs text-red-600 hover:text-red-800 font-medium hover:underline"
              >
                Change
              </button>
            </div>
          )}
        </div>

        <div className="relative">
          <input
            id="location-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Type at least 2 characters (e.g. Vijayawada, Jaipur, Amaravati, Pune)..."
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
          />
          {isSearching && (
            <div className="absolute right-3 top-3 text-xs text-slate-400 animate-pulse">
              Searching locations...
            </div>
          )}

          {/* Search Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto divide-y divide-slate-100">
              {searchResults.map((loc) => (
                <button
                  key={`${loc.id}-${loc.latitude}-${loc.longitude}`}
                  type="button"
                  onClick={() => handleSelectLocation(loc)}
                  className="w-full text-left px-4 py-2.5 hover:bg-sky-50 transition flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-semibold text-slate-900 text-sm block">
                      {loc.name}
                    </span>
                    <span className="text-slate-500 text-xs">
                      {[loc.district, loc.state, loc.country].filter(Boolean).join(', ')}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {loc.latitude.toFixed(2)}°N, {loc.longitude.toFixed(2)}°E
                  </span>
                </button>
              ))}
            </div>
          )}

          {searchError && (
            <p className="text-xs text-red-600 mt-1" role="alert">
              {searchError}
            </p>
          )}

          {!isSearching && searchQuery.trim().length >= 2 && searchResults.length === 0 && (
            <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-sm p-4 text-center text-xs text-slate-500">
              No matching Indian locations found. If searching for a small village, try searching for the nearest recognized Mandal or District headquarters.
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {isLoadingForecast ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm space-y-3">
          <div className="w-10 h-10 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <h2 className="text-base font-semibold text-slate-800">
            Fetching Real-Time Meteorological Data...
          </h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Contacting Open-Meteo API and calculating 7-day precipitation and farmer guidance indicators.
          </p>
        </div>
      ) : forecastError ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center space-y-3" role="alert">
          <div className="text-2xl">⚠️</div>
          <h2 className="text-base font-bold text-red-900">Weather Data Unavailable</h2>
          <p className="text-xs text-red-700 max-w-md mx-auto">{forecastError}</p>
          {selectedLocation && (
            <button
              type="button"
              onClick={handleRetryForecast}
              className="px-4 py-2 bg-red-700 text-white rounded-md text-xs font-semibold hover:bg-red-800 transition"
            >
              Retry Forecast Request
            </button>
          )}
        </div>
      ) : forecast ? (
        <div className="space-y-6">
          {/* Section 1: Current Weather & Overview */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-sky-700">
                  Current Atmospheric Observations
                </span>
                <h2 className="text-2xl font-bold text-slate-900 mt-0.5">
                  {forecast.location.locationName || `${forecast.location.latitude.toFixed(2)}°N, ${forecast.location.longitude.toFixed(2)}°E`}
                </h2>
                <p className="text-xs text-slate-500">
                  Timezone: {forecast.location.timezone} • Model Observation: {forecast.current.timestamp}
                </p>
              </div>

              <div className="flex items-center space-x-3 bg-slate-50 px-4 py-2.5 rounded-lg border border-slate-200">
                <span className="text-4xl">{forecast.current.icon}</span>
                <div>
                  <span className="text-3xl font-extrabold text-slate-900">
                    {forecast.current.temperatureC}°C
                  </span>
                  <span className="text-xs text-slate-600 block font-medium">
                    {forecast.current.condition}
                  </span>
                </div>
              </div>
            </div>

            {/* Current Metrics Grid */}
            <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-500 block">Feels Like</span>
                <strong className="text-base text-slate-800 block mt-0.5">
                  {forecast.current.apparentTemperatureC}°C
                </strong>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-500 block">Relative Humidity</span>
                <strong className="text-base text-slate-800 block mt-0.5">
                  {forecast.current.relativeHumidity}%
                </strong>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-500 block">Wind Speed (10m)</span>
                <strong className="text-base text-slate-800 block mt-0.5">
                  {forecast.current.windSpeedKmH} km/h
                </strong>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-500 block">Precipitation Now</span>
                <strong className="text-base text-slate-800 block mt-0.5">
                  {forecast.current.precipitationMm} mm
                </strong>
              </div>
            </div>

            <p className="mt-4 text-[11px] text-slate-400 italic">
              Note: This is model-assimilated meteorological data provided by numerical prediction models rather than a direct physical on-farm sensor.
            </p>
          </div>

          {/* Section 2: Farmer Weather Guidance (Transparent rule-based) */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <span>🌾</span>
                <span>Agronomic Weather Guidance</span>
              </h2>
              <span className="text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                Transparent Rule-Based System
              </span>
            </div>

            <div className="space-y-3">
              {forecast.guidance.map((item) => {
                const borderClass =
                  item.severity === 'caution'
                    ? 'border-red-300 bg-red-50/60 text-red-950'
                    : item.severity === 'advisory'
                    ? 'border-amber-300 bg-amber-50/60 text-amber-950'
                    : 'border-emerald-300 bg-emerald-50/60 text-emerald-950';

                const icon =
                  item.type === 'rain'
                    ? '🌧️'
                    : item.type === 'heat'
                    ? '☀️'
                    : item.type === 'wind'
                    ? '💨'
                    : item.type === 'dry'
                    ? '🏜️'
                    : '✅';

                return (
                  <div key={item.id} className={`p-4 border rounded-lg text-xs ${borderClass} space-y-1`}>
                    <div className="flex items-center space-x-2 font-bold text-sm">
                      <span>{icon}</span>
                      <span>{item.title}</span>
                    </div>
                    <p className="leading-relaxed text-xs opacity-90 pl-6">
                      {item.message}
                    </p>
                  </div>
                );
              })}
            </div>

            <p className="text-[11px] text-slate-500 pt-1">
              <strong>Advisory:</strong> These guidance points are derived solely from forecast variables (temperature, wind, precipitation) and do not constitute official meteorological warnings or replace local Krishi Vigyan Kendra (KVK) advisories.
            </p>
          </div>

          {/* Section 3: Dedicated Rainfall Intelligence */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-5">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-700">
                Precipitation Analysis
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-0.5 flex items-center space-x-2">
                <span>🌧️</span>
                <span>Rainfall Intelligence & Soil Moisture Outlook</span>
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                Distinguishing predicted precipitation volume from rain probability.
              </p>
            </div>

            {/* Rainfall Metrics Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-lg">
                <span className="text-blue-800 font-medium block">Today Expected</span>
                <strong className="text-2xl text-blue-950 block mt-1">
                  {forecast.rainfallSummary.todayExpectedMm} mm
                </strong>
                <span className="text-[11px] text-blue-700 block mt-1">
                  {forecast.daily[0]?.precipitationProbabilityMax ?? 0}% rain probability
                </span>
              </div>

              <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-lg">
                <span className="text-blue-800 font-medium block">Tomorrow Expected</span>
                <strong className="text-2xl text-blue-950 block mt-1">
                  {forecast.rainfallSummary.tomorrowExpectedMm} mm
                </strong>
                <span className="text-[11px] text-blue-700 block mt-1">
                  {forecast.daily[1]?.precipitationProbabilityMax ?? 0}% rain probability
                </span>
              </div>

              <div className="p-4 bg-sky-50/60 border border-sky-200 rounded-lg">
                <span className="text-sky-800 font-medium block">7-Day Predicted Total</span>
                <strong className="text-2xl text-sky-950 block mt-1">
                  {forecast.rainfallSummary.sevenDayTotalMm} mm
                </strong>
                <span className="text-[11px] text-sky-700 block mt-1">
                  Cumulative across week
                </span>
              </div>

              <div className="p-4 bg-indigo-50/60 border border-indigo-200 rounded-lg">
                <span className="text-indigo-800 font-medium block">Max Daily Probability</span>
                <strong className="text-2xl text-indigo-950 block mt-1">
                  {forecast.rainfallSummary.maxDailyProbabilityPercent}%
                </strong>
                <span className="text-[11px] text-indigo-700 block mt-1">
                  Peak chance this week
                </span>
              </div>
            </div>

            {/* Educational Clarification Banner */}
            <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-1">
              <div className="font-bold flex items-center space-x-1.5">
                <span>💡</span>
                <span>Important Distinction: Rain Probability vs. Expected Rainfall</span>
              </div>
              <p className="leading-relaxed text-[11px]">
                A <strong>70% precipitation probability</strong> indicates a 70% chance that measurable rain will occur in the area; it does <em>not</em> mean 70 mm of rain will fall. Conversely, a predicted <strong>15 mm rainfall total</strong> represents the modeled water accumulation depth. Both metrics should be reviewed together when deciding on nursery drainage or tractor tillage.
              </p>
            </div>

            {/* Heavy Rain Days Notice */}
            {forecast.rainfallSummary.heavyRainDays.length > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-900">
                <strong>Heavy Rainfall Flagged:</strong> Elevated rainfall (≥ 15 mm) is expected on{' '}
                <span className="font-semibold underline">
                  {forecast.rainfallSummary.heavyRainDays.join(', ')}
                </span>
                . Ensure field furrows are clear of debris.
              </div>
            )}
          </div>

          {/* Section 4: Seven-Day Weather Forecast Cards */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <span>📅</span>
                <span>Seven-Day Weather Forecast</span>
              </h2>
              <span className="text-xs text-slate-500">
                Forecast days: 7 • Timezone adjusted
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
              {forecast.daily.map((day, idx) => {
                const dateObj = new Date(day.date + 'T00:00:00');
                const dayName = idx === 0 ? 'Today' : idx === 1 ? 'Tomorrow' : dateObj.toLocaleDateString('en-IN', { weekday: 'short' });
                const displayDate = dateObj.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });

                return (
                  <div
                    key={day.date}
                    className={`p-3.5 border rounded-lg flex flex-col justify-between text-xs transition ${
                      idx === 0
                        ? 'border-sky-300 bg-sky-50/40 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{dayName}</span>
                        <span className="text-[11px] text-slate-400">{displayDate}</span>
                      </div>

                      <div className="my-2.5 text-center">
                        <span className="text-3xl block">{day.icon}</span>
                        <span className="text-[11px] text-slate-600 font-medium block mt-1 line-clamp-1">
                          {day.condition}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                        <span className="font-bold text-slate-900">{day.tempMaxC}°</span>
                        <span className="text-slate-500">{day.tempMinC}°</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 space-y-1 text-[11px]">
                      <div className="flex items-center justify-between text-blue-700">
                        <span>Rain:</span>
                        <span className="font-semibold">{day.precipitationSumMm} mm</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-500">
                        <span>Chance:</span>
                        <span>{day.precipitationProbabilityMax}%</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-400">
                        <span>Wind:</span>
                        <span>{day.windSpeedMaxKmH} km/h</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 5: Data Attribution & Terms */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-xs text-slate-600 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-slate-800">
                Data Source Attribution
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {forecast.attribution.notice}
              </p>
            </div>
            <a
              href={forecast.attribution.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-sky-700 hover:text-sky-900 font-semibold hover:underline whitespace-nowrap"
            >
              Open-Meteo Documentation →
            </a>
          </div>
        </div>
      ) : (
        /* Empty State (No Location Selected Yet) */
        <div className="border border-dashed border-slate-300 rounded-xl p-10 text-center bg-white space-y-4">
          <div className="text-4xl">🌦️</div>
          <h2 className="text-lg font-bold text-slate-800">No Location Selected</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Search for your Indian village, town, or district using the search bar above to generate live current weather, 7-day rainfall forecasts, and agronomic management guidance.
          </p>

          <div className="pt-2">
            <span className="text-xs text-slate-400 block mb-2 font-medium">Or choose a quick location:</span>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                { name: 'Vijayawada', state: 'Andhra Pradesh', lat: 16.50745, lon: 80.6466 },
                { name: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lon: 75.7873 },
                { name: 'Pune', state: 'Maharashtra', lat: 18.5204, lon: 73.8567 },
              ].map((city) => (
                <button
                  key={city.name}
                  type="button"
                  onClick={() =>
                    handleSelectLocation({
                      id: 0,
                      name: city.name,
                      latitude: city.lat,
                      longitude: city.lon,
                      country: 'India',
                      state: city.state,
                      timezone: 'Asia/Kolkata',
                    })
                  }
                  className="text-xs px-3 py-1.5 rounded-md bg-slate-100 hover:bg-sky-100 text-slate-700 hover:text-sky-800 font-medium transition"
                >
                  📍 {city.name}, {city.state}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
