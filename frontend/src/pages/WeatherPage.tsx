import { tr, useLocale, locale, formatNumber, isRtl } from '../i18n';
import { LocalizedContent } from '../i18n/LocalizedContent';

import React, { useEffect, useId, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../api/api';
import type {
  LocationResult,
  NormalizedForecastResponse,
} from '../types/weather';

export const STORAGE_KEY = 'profarm_weather_selected_location';

// eslint-disable-next-line react-refresh/only-export-components
export function isValidSavedLocation(
  data: unknown
): data is LocationResult {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return false;
  }

  const value = data as Record<string, unknown>;

  return (
    typeof value.name === 'string' &&
    value.name.trim().length > 0 &&
    typeof value.latitude === 'number' &&
    Number.isFinite(value.latitude) &&
    value.latitude >= -90 &&
    value.latitude <= 90 &&
    typeof value.longitude === 'number' &&
    Number.isFinite(value.longitude) &&
    value.longitude >= -180 &&
    value.longitude <= 180
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function getStoredLocation(): LocationResult | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;

    const value: unknown = JSON.parse(saved);

    if (isValidSavedLocation(value)) {
      return value;
    }

    localStorage.removeItem(STORAGE_KEY);
    return null;
  } catch {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Storage may be unavailable.
    }
    return null;
  }
}

const QUICK_LOCATIONS: LocationResult[] = [
  {
    id: 0,
    name: 'Vijayawada',
    state: 'Andhra Pradesh',
    country: 'India',
    latitude: 16.50745,
    longitude: 80.6466,
    timezone: 'Asia/Kolkata',
  },
  {
    id: 0,
    name: 'Jaipur',
    state: 'Rajasthan',
    country: 'India',
    latitude: 26.9124,
    longitude: 75.7873,
    timezone: 'Asia/Kolkata',
  },
  {
    id: 0,
    name: 'Pune',
    state: 'Maharashtra',
    country: 'India',
    latitude: 18.5204,
    longitude: 73.8567,
    timezone: 'Asia/Kolkata',
  },
];

const IMAGES = {
  hero: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1800&q=85',
  field: 'https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=1100&q=85',
  rain: 'https://images.unsplash.com/photo-1433086966358-54859d0ed716?auto=format&fit=crop&w=1000&q=85',
};

type Daily = NormalizedForecastResponse['daily'][number];

const format = (value: number, digits = 0) =>
  Number.isFinite(value) ? formatNumber(value, { minimumFractionDigits: digits, maximumFractionDigits: digits }) : '—';

const dayName = (date: string) =>
  new Date(`${date}T12:00:00`).toLocaleDateString(locale(), {
    weekday: 'short',
  });

const dateName = (date: string) =>
  new Date(`${date}T12:00:00`).toLocaleDateString(locale(), {
    day: 'numeric',
    month: 'short',
  });

const locationName = (location: LocationResult) =>
  [location.name, location.district || location.state]
    .filter(Boolean)
    .join(', ');

const isAbortError = (error: unknown) =>
  error instanceof Error &&
  (error.name === 'AbortError' ||
    error.message.toLowerCase().includes('abort'));

function getWeatherSymbol(condition: string): string {
  const text = condition.toLowerCase();
  if (/thunder|storm|lightning/.test(text)) return '⛈';
  if (/snow|sleet/.test(text)) return '❄';
  if (/rain|drizzle|shower/.test(text)) return '🌧';
  if (/fog|mist|haze/.test(text)) return '🌫';
  if (/partly|few cloud/.test(text)) return '⛅';
  if (/cloud|overcast/.test(text)) return '☁';
  return '☀';
}

const WeatherIcon: React.FC<{
  condition: string;
  size?: number;
}> = ({ condition, size = 56 }) => (
  <span
    aria-hidden="true"
    className="inline-flex shrink-0 items-center justify-center leading-none"
    style={{ fontSize: size }}
  >
    {getWeatherSymbol(condition)}
  </span>
);

const Stat: React.FC<{
  label: string;
  value: string;
  detail?: string;
}> = ({ label, value, detail }) => (
  <div className="min-w-0">
    <p className="text-xs font-medium text-[#526658]">{tr(label)}</p>
    <p className="mt-2 text-2xl font-bold tracking-tight text-[#183B29]">
      <bdi dir="ltr">{value}</bdi>
    </p>
    {detail && (
      <p className="mt-1 text-xs text-[#526658]">{tr(detail)}</p>
    )}
  </div>
);

const SectionHeading: React.FC<{
  eyebrow?: string;
  title: string;
  right?: React.ReactNode;
}> = ({ eyebrow, title, right }) => (
  <div className="flex flex-wrap items-center justify-between gap-3">
    <div>
      {eyebrow && (
        <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.13em] text-[#47734D]">
          {tr(eyebrow)}
        </p>
      )}
      <h2 className="font-serif text-2xl font-semibold tracking-tight text-[#173D29]">
        {tr(title)}
      </h2>
    </div>
    {right}
  </div>
);

const ForecastChart: React.FC<{ daily: Daily[] }> = ({ daily }) => {
  const [activeDay, setActiveDay] = useState(0);
  const [mode, setMode] = useState<
    'all' | 'temperature' | 'rain'
  >('all');

  const width = 820;
  const height = 280;
  const left = 46;
  const right = 22;
  const top = 25;
  const bottom = 42;

  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;

  const temperatures = daily.flatMap((day) => [
    day.tempMaxC,
    day.tempMinC,
  ]);

  const minTemperature = temperatures.length
    ? Math.floor(Math.min(...temperatures) - 3)
    : 0;

  const maxTemperature = temperatures.length
    ? Math.ceil(Math.max(...temperatures) + 3)
    : 40;

  const temperatureRange = Math.max(
    1,
    maxTemperature - minTemperature
  );

  const maxRain = Math.max(
    5,
    ...daily.map((day) => day.precipitationSumMm)
  );

  const x = (index: number) =>
    left +
    (daily.length <= 1
      ? plotWidth / 2
      : (index * plotWidth) / (daily.length - 1));

  const temperatureY = (temperature: number) =>
    top +
    (1 - (temperature - minTemperature) / temperatureRange) *
      plotHeight;

  const rainfallY = (rain: number) =>
    top + plotHeight - (rain / maxRain) * plotHeight * 0.48;

  const highPath = daily
    .map(
      (day, index) =>
        `${index === 0 ? 'M' : 'L'} ${x(index)} ${temperatureY(
          day.tempMaxC
        )}`
    )
    .join(' ');

  const lowPath = daily
    .map(
      (day, index) =>
        `${index === 0 ? 'M' : 'L'} ${x(index)} ${temperatureY(
          day.tempMinC
        )}`
    )
    .join(' ');

  const selected =
    daily[Math.min(activeDay, Math.max(0, daily.length - 1))];

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-[#334D3A]">
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#D7894B]" />{tr("High")}</span>
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#3D805C]" />{tr("Low")}</span>
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm bg-[#82B8D4]" />{tr("Rainfall")}</span>
        </div>

        <div className="flex gap-1 rounded-lg bg-[#F0F4ED] p-1">
          {(
            [
              ['all', 'All'],
              ['temperature', 'Temperature'],
              ['rain', 'Rainfall'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setMode(value)}
              aria-pressed={mode === value}
              className={`rounded-md px-3 py-2 text-xs font-semibold transition ${
                mode === value
                  ? 'bg-[#285C3D] text-white shadow-sm'
                  : 'text-[#395A44] hover:bg-white'
              }`}
            >
              {tr(label)}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl bg-[#F8FAF6] p-3 sm:p-5">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-auto w-full"
          role="img"
          aria-label={tr("Seven-day temperature and rainfall chart")}
        >
          {[0, 1, 2, 3, 4].map((step) => {
            const y = top + (step / 4) * plotHeight;
            const temperature =
              maxTemperature - (step / 4) * temperatureRange;

            return (
              <g key={step}>
                <line
                  x1={left}
                  x2={width - right}
                  y1={y}
                  y2={y}
                  stroke="#D8E2D7"
                  strokeDasharray="4 5"
                />
                <text
                  x={left - 10}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="11"
                  fill="#48604E"
                >
                  {Math.round(temperature)}°
                </text>
              </g>
            );
          })}

          {daily.map((day, index) => (
            <g key={day.date}>
              {index === activeDay && (
                <rect
                  x={x(index) - 37}
                  y={top - 12}
                  width="74"
                  height={plotHeight + 24}
                  rx="9"
                  fill="#E8F1E5"
                />
              )}

              {mode !== 'temperature' &&
                day.precipitationSumMm > 0 && (
                  <rect
                    x={x(index) - 15}
                    y={rainfallY(day.precipitationSumMm)}
                    width="30"
                    height={
                      top +
                      plotHeight -
                      rainfallY(day.precipitationSumMm)
                    }
                    rx="4"
                    fill="#8DBCD5"
                  />
                )}

              <text
                x={x(index)}
                y={height - 12}
                textAnchor="middle"
                fontSize="12"
                fontWeight={index === activeDay ? 700 : 500}
                fill={
                  index === activeDay ? '#205338' : '#4F6454'
                }
              >
                {dayName(day.date)}
              </text>
            </g>
          ))}

          {mode !== 'rain' && daily.length > 0 && (
            <>
              <path
                d={highPath}
                fill="none"
                stroke="#D7894B"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d={lowPath}
                fill="none"
                stroke="#3D805C"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {daily.map((day, index) => (
                <g key={day.date}>
                  <circle
                    cx={x(index)}
                    cy={temperatureY(day.tempMaxC)}
                    r="5"
                    fill="#D7894B"
                    stroke="white"
                    strokeWidth="2"
                  />
                  <circle
                    cx={x(index)}
                    cy={temperatureY(day.tempMinC)}
                    r="5"
                    fill="#3D805C"
                    stroke="white"
                    strokeWidth="2"
                  />
                </g>
              ))}
            </>
          )}
        </svg>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-7">
        {daily.map((day, index) => (
          <button
            key={day.date}
            type="button"
            onClick={() => setActiveDay(index)}
            aria-pressed={activeDay === index}
            className={`rounded-xl border px-2 py-3 text-center transition ${
              activeDay === index
                ? 'border-[#92B69A] bg-[#EBF4E9]'
                : 'border-[#DFE7DD] bg-white hover:border-[#A6C5A9]'
            }`}
          >
            <p className="text-xs font-bold text-[#254A33]">
              {index === 0 ? tr("Today") : dayName(day.date)}
            </p>
            <p className="mt-0.5 text-[10px] text-[#536756]">
              {dateName(day.date)}
            </p>
            <div className="my-2 flex justify-center">
              <WeatherIcon condition={day.condition} size={40} />
            </div>
            <p className="text-sm font-bold text-[#193B28]">
              {format(day.tempMaxC)}°
              <span className="ms-1 font-medium text-[#536B58]">
                {format(day.tempMinC)}°
              </span>
            </p>
            <p className="mt-2 text-xs font-semibold text-[#316F91]">
              {format(day.precipitationProbabilityMax)}{tr("% rain")}</p>
          </button>
        ))}
      </div>

      {selected && (
        <div className="mt-4 grid grid-cols-2 gap-4 rounded-xl border border-[#D8E6D7] bg-[#F1F7EE] p-4 sm:grid-cols-4">
          <div>
            <p className="text-xs font-bold text-[#21472E]">
              {dayName(selected.date)}, {dateName(selected.date)}
            </p>
            <p className="mt-1 text-xs text-[#465D4B]">
              {tr(selected.condition)}
            </p>
          </div>
          <Stat
            label={tr("Rainfall")}
            value={`${format(selected.precipitationSumMm, 1)} mm`}
          />
          <Stat
            label={tr("Rain chance")}
            value={`${format(selected.precipitationProbabilityMax)}%`}
          />
          <Stat
            label={tr("Max wind")}
            value={`${format(selected.windSpeedMaxKmH)} km/h`}
          />
        </div>
      )}
    </div>
  );
};

export const WeatherPage: React.FC = () => {
  useLocale();
  const searchId = useId();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LocationResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchDone, setSearchDone] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(
    null
  );

  const [selectedLocation, setSelectedLocation] =
    useState<LocationResult | null>(getStoredLocation);

  const [forecast, setForecast] =
    useState<NormalizedForecastResponse | null>(null);

  const [loading, setLoading] = useState(
    () => getStoredLocation() !== null
  );

  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setSearchDone(false);
      setSearching(false);
      setSearchError(null);
      return;
    }

    const controller = new AbortController();
    let cancelled = false;

    setSearching(true);
    setSearchDone(false);
    setSearchError(null);
    setResults([]);

    const timer = window.setTimeout(async () => {
      try {
        const response = await api.searchLocations(
          query.trim(),
          controller.signal
        );

        if (!cancelled) {
          setResults(response.locations || []);
          setSearchDone(true);
        }
      } catch (err: unknown) {
        if (cancelled || isAbortError(err)) return;

        setSearchError(
          err instanceof ApiError
            ? err.message
            : 'Unable to search locations.'
        );
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  useEffect(() => {
    if (!selectedLocation) {
      setForecast(null);
      setError(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      setForecast(null);

      try {
        const response = await api.getWeatherForecast(
          selectedLocation.latitude,
          selectedLocation.longitude,
          locationName(selectedLocation),
          controller.signal
        );

        if (!cancelled) {
          setForecast(response.forecast);
        }
      } catch (err: unknown) {
        if (cancelled || isAbortError(err)) return;

        setError(
          err instanceof ApiError
            ? err.message
            : 'Unable to load the forecast.'
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [selectedLocation, retry]);

  const selectLocation = (location: LocationResult) => {
    if (!isValidSavedLocation(location)) return;

    setSelectedLocation(location);
    setQuery('');
    setResults([]);
    setSearchDone(false);
    setSearchError(null);
    setError(null);

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(location)
      );
    } catch {
      // Forecast still works without localStorage.
    }
  };

  const clearLocation = () => {
    setSelectedLocation(null);
    setForecast(null);
    setLoading(false);
    setError(null);
    setQuery('');
    setResults([]);
    setSearchDone(false);
    setSearchError(null);

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage errors.
    }
  };

  const daily = useMemo(
    () => forecast?.daily ?? [],
    [forecast?.daily]
  );

  const stats = useMemo(() => {
    if (daily.length === 0) return null;

    const wettest = daily.reduce((a, b) =>
      a.precipitationSumMm >= b.precipitationSumMm ? a : b
    );

    const hottest = daily.reduce((a, b) =>
      a.tempMaxC >= b.tempMaxC ? a : b
    );

    const windiest = daily.reduce((a, b) =>
      a.windSpeedMaxKmH >= b.windSpeedMaxKmH ? a : b
    );

    return {
      wettest,
      hottest,
      windiest,
      rainyDays: daily.filter(
        (day) => day.precipitationSumMm > 0
      ).length,
      minTemp: Math.min(...daily.map((day) => day.tempMinC)),
      maxTemp: Math.max(...daily.map((day) => day.tempMaxC)),
    };
  }, [daily]);

  return (
    <div className="mx-auto w-full min-w-0 max-w-[1440px] space-y-6 pb-14 text-[#203B29]">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <nav className="mb-3 flex items-center gap-2 text-xs font-medium text-[#536758]">
            <Link to="/" className="hover:text-[#245F3C]">{tr("Home")}</Link>
            <span>/</span>
            <span className="text-[#285F3E]">{tr("Weather")}</span>
          </nav>

          <h1 className="font-serif text-3xl font-semibold tracking-tight text-[#173C29] sm:text-4xl">{tr("Weather & Field Conditions")}</h1>

          <p className="mt-2 text-sm text-[#425B49]">{tr("Local forecasts for better farming decisions.")}</p>
        </div>

        <span className="text-xs font-medium text-[#526957]">{tr("Data by Open-Meteo")}</span>
      </header>

      <section className="relative z-20 flex flex-col gap-4 rounded-xl border border-[#DCE6DB] bg-white p-4 sm:flex-row sm:items-center sm:p-5">
        <div className="min-w-0 sm:w-56">
          <p className="text-xs font-medium text-[#526858]">
            {selectedLocation ? tr("Active location:") : tr("Forecast location")}
          </p>

          <p className="mt-1 truncate text-sm font-bold text-[#1C462E]">
            {selectedLocation ? locationName(selectedLocation) : tr("No Location Selected")}
          </p>
        </div>

        <div className="relative flex-1">
          <label htmlFor={searchId} className="sr-only">{tr("Search location")}</label>

          <input
            id={searchId}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={tr("Search village, town or city...")}
            autoComplete="off"
            aria-expanded={results.length > 0}
            className="w-full rounded-lg border border-[#D5E1D4] bg-[#F8FAF7] px-4 py-3 text-sm font-medium text-[#1F3D2A] placeholder:text-[#637567] outline-none focus:border-[#5D9470] focus:ring-2 focus:ring-[#5D9470]/15"
          />

          {results.length > 0 && (
            <div className="absolute inset-x-0 top-full z-40 mt-2 max-h-64 overflow-y-auto rounded-xl border border-[#D9E5D8] bg-white p-1 shadow-xl">
              {results.map((place) => (
                <button
                  key={`${place.id}-${place.latitude}-${place.longitude}`}
                  type="button"
                  onClick={() => selectLocation(place)}
                  className="w-full rounded-lg px-4 py-3 text-start hover:bg-[#EFF5EC]"
                >
                  <span className="block text-sm font-bold text-[#21452F]">
                    {place.name}
                  </span>
                  <span className="mt-0.5 block text-xs text-[#526858]">
                    {[place.district, place.state, place.country]
                      .filter(Boolean)
                      .join(', ')}
                  </span>
                </button>
              ))}
            </div>
          )}

          {searching && (
            <p className="mt-2 text-xs text-[#425C48]">{tr("Searching...")}</p>
          )}

          {searchError && (
            <p role="alert" className="mt-2 text-xs text-red-700">
              {tr(searchError)}
            </p>
          )}

          {searchDone &&
            !searching &&
            !searchError &&
            results.length === 0 &&
            query.trim().length >= 2 && (
              <p className="mt-2 text-xs text-[#425C48]">{tr("No matching locations.")}</p>
            )}
        </div>

        {selectedLocation && (
          <button
            type="button"
            onClick={clearLocation}
            className="text-xs font-bold text-[#245F3C] hover:underline"
          >{tr("Change")}</button>
        )}
      </section>

      {loading ? (
        <section
          role="status"
          className="rounded-xl border border-[#DEE8DC] bg-white py-24 text-center"
        >
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-[#E0EBDD] border-t-[#32714B]" />
          <p className="mt-4 text-sm font-medium text-[#2C583B]">{tr("Loading local forecast...")}</p>
        </section>
      ) : error ? (
        <section
          role="alert"
          className="rounded-xl border border-red-200 bg-white p-8"
        >
          <h2 className="text-lg font-bold text-red-800">{tr("Forecast unavailable")}</h2>
          <p className="mt-2 text-sm text-red-700">{tr(error)}</p>
          <button
            type="button"
            onClick={() => setRetry((value) => value + 1)}
            className="mt-5 rounded-lg bg-[#285C3D] px-5 py-2.5 text-sm font-semibold text-white"
          >{tr("Try again")}</button>
        </section>
      ) : forecast ? (
        <>
          <section className="relative isolate min-h-[330px] overflow-hidden rounded-2xl bg-[#1D4A31] text-white">
            <img
              src={IMAGES.hero}
              alt={tr("Green agricultural fields under an open sky")}
              className="absolute inset-0 h-full w-full object-cover"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#103D28]/95 via-[#16452E]/85 to-[#16452E]/30" />

            <div className="relative grid min-h-[330px] gap-8 p-6 sm:p-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#E3F1DF]">{tr("Current weather")}</p>

                <h2 className="mt-2 font-serif text-xl font-semibold text-white">
                  {forecast.location.locationName}
                </h2>

                <div className="mt-5 flex flex-wrap items-center gap-3 sm:gap-5">
                  <WeatherIcon
                    condition={forecast.current.condition}
                    size={88}
                  />

                  <div>
                    <div className="flex items-start" dir="ltr">
                      <span className="text-[72px] font-bold leading-none tracking-[-0.08em] sm:text-[88px]">
                        {format(forecast.current.temperatureC, 1)}
                      </span>
                      <span className="ms-2 mt-2 text-3xl font-medium">
                        °C
                      </span>
                    </div>

                    <p className="mt-2 text-lg font-semibold text-white">
                      {tr(forecast.current.condition)}
                    </p>

                    <p className="mt-1 text-sm font-medium text-[#E3F0E2]">{tr("Feels Like")}{' '}
                      {isRtl() ? <bdi dir="ltr">{format(forecast.current.apparentTemperatureC)}°C</bdi> : `${format(forecast.current.apparentTemperatureC)}°C`}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-5 gap-y-7 border-t border-white/30 pt-6 lg:border-l lg:border-t-0 lg:ps-8 lg:pt-0">
                {[
                  {
                    label: 'Humidity',
                    value: `${format(
                      forecast.current.relativeHumidity
                    )}%`,
                  },
                  {
                    label: 'Wind',
                    value: `${format(
                      forecast.current.windSpeedKmH
                    )} km/h`,
                  },
                  {
                    label: 'Precipitation',
                    value: `${format(
                      forecast.current.precipitationMm,
                      1
                    )} mm`,
                  },
                  {
                    label: 'Expected today',
                    value: `${format(
                      forecast.rainfallSummary.todayExpectedMm,
                      1
                    )} mm`,
                  },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-xs font-medium text-[#E3F0E2]">
                      {tr(item.label)}
                    </p>
                    <p className="mt-2 text-xl font-bold text-white">
                      <bdi dir="ltr">{item.value}</bdi>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="rounded-xl border border-[#DDE7DA] bg-white p-5">
              <Stat
                label={tr("7-day rainfall")}
                value={`${format(
                  forecast.rainfallSummary.sevenDayTotalMm,
                  1
                )} mm`}
              />
            </div>

            <div className="rounded-xl border border-[#DDE7DA] bg-white p-5">
              <Stat
                label={tr("Days with rain")}
                value={`${stats?.rainyDays ?? 0} / ${daily.length}`}
              />
            </div>

            <div className="rounded-xl border border-[#DDE7DA] bg-white p-5">
              <Stat
                label={tr("Temperature range")}
                value={
                  stats
                    ? `${format(stats.minTemp)}°–${format(
                        stats.maxTemp
                      )}°`
                    : '—'
                }
              />
            </div>

            <div className="rounded-xl border border-[#DDE7DA] bg-white p-5">
              <Stat
                label={tr("Maximum wind")}
                value={
                  stats
                    ? `${format(
                        stats.windiest.windSpeedMaxKmH
                      )} km/h`
                    : '—'
                }
              />
            </div>
          </section>

          <section className="rounded-xl border border-[#DDE7DA] bg-white p-5 sm:p-7">
            <div className="mb-6">
              <SectionHeading
                eyebrow={tr("Forecast")}
                title={tr("7-Day Weather Outlook")}
                right={
                  <span className="text-xs font-semibold text-[#48624E]">
                    {daily.length}{tr("days")}</span>
                }
              />
            </div>
            <ForecastChart daily={daily} />
          </section>

          <section className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-xl border border-[#DDE7DA] bg-white p-5 sm:p-6">
              <SectionHeading title={tr("Key Insights")} />

              <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
                <div className="sm:border-r sm:border-[#E0E8DE]">
                  <p className="text-xs font-medium text-[#4D6352]">{tr("Highest rainfall")}</p>
                  <p className="mt-2 text-2xl font-bold text-[#1C432E]">
                    {stats ? tr("{{v0}} mm", { v0: format(
                          stats.wettest.precipitationSumMm,
                          1
                        ) }) : '—'}
                  </p>
                  <p className="mt-1 text-xs text-[#526956]">
                    {stats ? dateName(stats.wettest.date) : '—'}
                  </p>
                </div>

                <div className="sm:border-r sm:border-[#E0E8DE]">
                  <p className="text-xs font-medium text-[#4D6352]">{tr("Hottest day")}</p>
                  <p className="mt-2 text-2xl font-bold text-[#1C432E]">
                    {stats
                      ? `${format(stats.hottest.tempMaxC)}°C`
                      : '—'}
                  </p>
                  <p className="mt-1 text-xs text-[#526956]">
                    {stats ? dateName(stats.hottest.date) : '—'}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-[#4D6352]">{tr("Strongest wind")}</p>
                  <p className="mt-2 text-2xl font-bold text-[#1C432E]">
                    {stats ? tr("{{v0}} km/h", { v0: format(
                          stats.windiest.windSpeedMaxKmH
                        ) }) : '—'}
                  </p>
                  <p className="mt-1 text-xs text-[#526956]">
                    {stats ? dateName(stats.windiest.date) : '—'}
                  </p>
                </div>
              </div>
            </div>

            <div className="relative min-h-[205px] overflow-hidden rounded-xl bg-[#275A39]">
              <img
                src={IMAGES.field}
                alt={tr("Natural green landscape")}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#103E29]/85 to-[#103E29]/10" />
              <div className="relative flex h-full flex-col justify-end p-6 text-white">
                <p className="text-xs font-semibold uppercase tracking-widest text-[#E0F0DD]">{tr("ProFarm")}</p>
                <h2 className="mt-2 font-serif text-3xl font-semibold leading-tight">{tr("Plan smart. Farm better.")}</h2>
              </div>
            </div>
          </section>

          <section className="grid items-start gap-5 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="overflow-hidden rounded-xl border border-[#DDE7DA] bg-white">
              <div className="p-5 sm:p-6">
                <SectionHeading title={tr("Daily Forecast")} />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[650px] text-start">
                  <thead className="bg-[#F1F6EF]">
                    <tr className="text-xs font-bold text-[#31533B]">
                      <th className="px-4 py-3 sm:ps-6">{tr("Day")}</th>
                      <th className="px-3 py-3">{tr("Weather")}</th>
                      <th className="px-3 py-3">{tr("High / Low")}</th>
                      <th className="px-3 py-3">{tr("Rain %")}</th>
                      <th className="px-3 py-3">{tr("Rainfall")}</th>
                      <th className="px-3 py-3">{tr("Wind")}</th>
                    </tr>
                  </thead>

                  <tbody>
                    {daily.map((day, index) => (
                      <tr
                        key={day.date}
                        className="border-t border-[#E5ECE2] text-xs hover:bg-[#F8FAF7]"
                      >
                        <td className="whitespace-nowrap px-4 py-3 sm:ps-6">
                          <p className="font-bold text-[#20442F]">
                            {index === 0 ? tr("Today") : dayName(day.date)}
                          </p>
                          <p className="mt-1 text-[#526858]">
                            {dateName(day.date)}
                          </p>
                        </td>

                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <WeatherIcon
                              condition={day.condition}
                              size={30}
                            />
                            <span className="font-medium text-[#344D3A]">
                              {tr(day.condition)}
                            </span>
                          </div>
                        </td>

                        <td className="whitespace-nowrap px-3 py-3 font-bold text-[#1F432D]">
                          {format(day.tempMaxC)}° /{' '}
                          {format(day.tempMinC)}°
                        </td>

                        <td className="px-3 py-3 font-semibold text-[#286B8C]">
                          {format(
                            day.precipitationProbabilityMax
                          )}
                          %
                        </td>

                        <td className="whitespace-nowrap px-3 py-3 font-medium text-[#344E3A]">
                          {format(day.precipitationSumMm, 1)}{tr("mm")}</td>

                        <td className="whitespace-nowrap px-3 py-3 font-medium text-[#344E3A]">
                          {format(day.windSpeedMaxKmH)}{tr("km/h")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-xl border border-[#DDE7DA] bg-white p-5 sm:p-6">
                <SectionHeading
                  title={tr("Farming Advisory")}
                  right={
                    <span className="rounded-full bg-[#EAF3E7] px-3 py-1 text-[11px] font-bold text-[#326143]">{tr("Rule-based")}</span>
                  }
                />

                <div className="mt-5 space-y-3">
                  {forecast.guidance.length > 0 ? (
                    forecast.guidance.map((item) => (
                      <article
                        key={item.id}
                        className="rounded-lg border border-[#E1E9DF] bg-[#FAFCF9] p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h3 className="text-sm font-bold text-[#1E422D]">
                            <LocalizedContent text={item.title} />
                          </h3>

                          <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                              item.severity === 'caution'
                                ? 'bg-[#FFF0E2] text-[#9B5726]'
                                : item.severity === 'advisory'
                                  ? 'bg-[#FFF5D9] text-[#86641C]'
                                  : 'bg-[#E5F3E7] text-[#306B42]'
                            }`}
                          >
                            {tr(item.severity)}
                          </span>
                        </div>

                        <p className="mt-2 text-xs leading-5 text-[#3D5542]">
                          <LocalizedContent text={item.message} />
                        </p>
                      </article>
                    ))
                  ) : (
                    <p className="text-sm font-medium text-[#425C49]">{tr("No specific advisories for this forecast.")}</p>
                  )}
                </div>
              </div>

              <div className="relative min-h-[185px] overflow-hidden rounded-xl bg-[#1B482F]">
                <img
                  src={IMAGES.rain}
                  alt={tr("Water flowing through a natural green landscape")}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#103B28]/95 to-[#103B28]/30" />

                <div className="relative flex min-h-[185px] flex-col justify-end p-6 text-white">
                  <p className="text-sm font-semibold">{tr("Rainfall Outlook")}</p>

                  <p className="mt-2 text-4xl font-bold">
                    {format(
                      forecast.rainfallSummary.sevenDayTotalMm,
                      1
                    )}{' '}
                    <span className="text-xl">{tr("mm")}</span>
                  </p>

                  <p className="mt-1 text-xs font-medium text-[#E3F0E3]">{tr("Expected over the next 7 days")}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-[#DDE7DA] bg-white p-5 sm:p-6">
            <SectionHeading
              title={tr("Rainfall Distribution")}
              right={
                <span className="text-xs font-semibold text-[#3E5A45]">{tr("Daily accumulation (mm)")}</span>
              }
            />

            <div className="mt-6 grid grid-cols-7 items-end gap-2 sm:gap-4">
              {daily.map((day) => {
                const maxRain = Math.max(
                  1,
                  ...daily.map(
                    (entry) => entry.precipitationSumMm
                  )
                );

                const heightPercent =
                  (day.precipitationSumMm / maxRain) * 100;

                return (
                  <div
                    key={day.date}
                    className="min-w-0 text-center"
                  >
                    <p className="mb-2 text-[10px] font-bold text-[#2C5138] sm:text-xs">
                      {format(day.precipitationSumMm, 1)}
                    </p>

                    <div className="flex h-32 items-end justify-center rounded-md bg-[#F2F7F0] px-2 pt-3">
                      <div
                        className="w-full max-w-12 rounded-t-md bg-[#77AEB8]"
                        style={{
                          height: `${heightPercent}%`,
                          minHeight:
                            day.precipitationSumMm > 0
                              ? '3px'
                              : '0px',
                        }}
                      />
                    </div>

                    <p className="mt-2 text-[11px] font-bold text-[#2B5037]">
                      {dayName(day.date)}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#DDE7DA] pt-5 text-xs font-medium text-[#48614E]">
            <p>{tr("Forecasts are estimates. Farming advice is rule-based.")}</p>

            <a
              href={forecast.attribution.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-[#276440] hover:underline"
            >
              {forecast.attribution.notice || tr("Weather data source")}
            </a>
          </footer>
        </>
      ) : (
        <section className="overflow-hidden rounded-2xl border border-[#DDE7DA] bg-white">
          <div className="grid lg:grid-cols-2">
            <div className="flex flex-col justify-center p-8 sm:p-12">
              <p className="text-xs font-bold uppercase tracking-widest text-[#46784E]">{tr("ProFarm Weather")}</p>

              <h2 className="mt-3 font-serif text-3xl font-semibold text-[#173C29]">{tr("Your local forecast starts here.")}</h2>

              <p className="mt-3 text-sm font-medium text-[#425A48]">{tr("Select a location to view weather, rainfall and farming advisories.")}</p>

              <div className="mt-7 flex flex-wrap gap-2">
                {QUICK_LOCATIONS.map((location) => (
                  <button
                    key={location.name}
                    type="button"
                    onClick={() => selectLocation(location)}
                    className="rounded-lg border border-[#BED4BE] bg-[#F0F6ED] px-4 py-2.5 text-xs font-bold text-[#285C3D] hover:bg-[#E4F0DF]"
                  >
                    {location.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative min-h-[280px] bg-[#2C6240]">
              <img
                src={IMAGES.hero}
                alt={tr("Open farmland landscape")}
                className="absolute inset-0 h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
