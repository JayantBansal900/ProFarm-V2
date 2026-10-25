import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import {
  WeatherPage,
  STORAGE_KEY,
  isValidSavedLocation,
} from '../src/pages/tools/WeatherPage';
import { api } from '../src/services/api';
import { LocationResult, NormalizedForecastResponse } from '../src/types/weather';

vi.mock('../src/services/api', () => ({
  api: {
    searchLocations: vi.fn(),
    getWeatherForecast: vi.fn(),
  },
  ApiError: class ApiError extends Error {
    constructor(public message: string, public statusCode: number) {
      super(message);
    }
  },
}));

const mockVijayawada: LocationResult = {
  id: 1253184,
  name: 'Vijayawada',
  latitude: 16.50745,
  longitude: 80.6466,
  country: 'India',
  state: 'Andhra Pradesh',
  timezone: 'Asia/Kolkata',
};

const mockJaipur: LocationResult = {
  id: 1269515,
  name: 'Jaipur',
  latitude: 26.9124,
  longitude: 75.7873,
  country: 'India',
  state: 'Rajasthan',
  timezone: 'Asia/Kolkata',
};

const mockForecastVijayawada: NormalizedForecastResponse = {
  location: {
    latitude: 16.51,
    longitude: 80.65,
    timezone: 'Asia/Kolkata',
    locationName: 'Vijayawada, Andhra Pradesh',
  },
  current: {
    temperatureC: 31.4,
    apparentTemperatureC: 36.2,
    relativeHumidity: 78,
    precipitationMm: 0.0,
    weatherCode: 2,
    condition: 'Partly Cloudy',
    icon: '⛅',
    cloudCover: 40,
    windSpeedKmH: 14.2,
    isDay: true,
    timestamp: '2026-10-26T10:00:00Z',
  },
  daily: [
    {
      date: '2026-10-26',
      weatherCode: 2,
      condition: 'Partly Cloudy',
      icon: '⛅',
      tempMaxC: 34.1,
      tempMinC: 24.3,
      precipitationSumMm: 1.2,
      precipitationProbabilityMax: 35,
      windSpeedMaxKmH: 16.5,
    },
  ],
  rainfallSummary: {
    todayExpectedMm: 1.2,
    tomorrowExpectedMm: 14.0,
    sevenDayTotalMm: 38.4,
    maxDailyProbabilityPercent: 55,
    heavyRainDays: [],
  },
  guidance: [
    {
      id: 'favorable-1',
      type: 'favorable',
      severity: 'info',
      title: 'Favorable Farming Conditions',
      message: 'Optimal conditions for routine agricultural activities.',
    },
  ],
  attribution: {
    provider: 'Open-Meteo',
    notice: 'Weather data by Open-Meteo.com under CC BY 4.0',
    url: 'https://open-meteo.com/',
  },
  dataFreshness: {
    fetchedAt: '2026-10-26T10:00:00Z',
    cached: false,
  },
};

const mockForecastJaipur: NormalizedForecastResponse = {
  location: {
    latitude: 26.91,
    longitude: 75.79,
    timezone: 'Asia/Kolkata',
    locationName: 'Jaipur, Rajasthan',
  },
  current: {
    temperatureC: 28.0,
    apparentTemperatureC: 27.5,
    relativeHumidity: 35,
    precipitationMm: 0.0,
    weatherCode: 0,
    condition: 'Clear Sky',
    icon: '☀️',
    cloudCover: 10,
    windSpeedKmH: 12.0,
    isDay: true,
    timestamp: '2026-10-26T10:00:00Z',
  },
  daily: [
    {
      date: '2026-10-26',
      weatherCode: 0,
      condition: 'Clear Sky',
      icon: '☀️',
      tempMaxC: 31.0,
      tempMinC: 18.0,
      precipitationSumMm: 0.0,
      precipitationProbabilityMax: 5,
      windSpeedMaxKmH: 12.0,
    },
  ],
  rainfallSummary: {
    todayExpectedMm: 0.0,
    tomorrowExpectedMm: 0.0,
    sevenDayTotalMm: 0.0,
    maxDailyProbabilityPercent: 5,
    heavyRainDays: [],
  },
  guidance: [
    {
      id: 'dry-1',
      type: 'dry',
      severity: 'info',
      title: 'Dry Spell Window',
      message: 'No rainfall forecast. Ideal window for harvesting or grain drying.',
    },
  ],
  attribution: {
    provider: 'Open-Meteo',
    notice: 'Weather data by Open-Meteo.com under CC BY 4.0',
    url: 'https://open-meteo.com/',
  },
  dataFreshness: {
    fetchedAt: '2026-10-26T10:00:00Z',
    cached: false,
  },
};

describe('Weather Location Persistence & Lifecycle Regressions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  // 1. Validation helper tests
  it('validates saved location structure properly', () => {
    expect(isValidSavedLocation(null)).toBe(false);
    expect(isValidSavedLocation(undefined)).toBe(false);
    expect(isValidSavedLocation('string')).toBe(false);
    expect(isValidSavedLocation(12345)).toBe(false);
    expect(isValidSavedLocation({})).toBe(false);
    expect(isValidSavedLocation({ name: 'City' })).toBe(false);
    expect(isValidSavedLocation({ name: 'City', latitude: 'bad', longitude: 80 })).toBe(false);
    expect(isValidSavedLocation({ name: 'City', latitude: NaN, longitude: 80 })).toBe(false);
    expect(isValidSavedLocation({ name: 'City', latitude: 120, longitude: 80 })).toBe(false); // out of lat bounds
    expect(isValidSavedLocation({ name: 'City', latitude: 16.5, longitude: 200 })).toBe(false); // out of lon bounds
    expect(isValidSavedLocation(mockVijayawada)).toBe(true);
  });

  // 2. Saving a selected location
  it('saves selected location to localStorage when a preset or search result is clicked', async () => {
    vi.mocked(api.getWeatherForecast).mockResolvedValue({
      status: 'success',
      forecast: mockForecastVijayawada,
    });

    render(
      <React.StrictMode>
        <BrowserRouter>
          <WeatherPage />
        </BrowserRouter>
      </React.StrictMode>
    );

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();

    const presetBtn = screen.getByRole('button', { name: /Vijayawada/i });
    fireEvent.click(presetBtn);

    await waitFor(() => {
      const stored = localStorage.getItem(STORAGE_KEY);
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!);
      expect(parsed.name).toBe('Vijayawada');
      expect(parsed.latitude).toBeCloseTo(16.50745, 3);
      expect(parsed.longitude).toBeCloseTo(80.6466, 3);
    });
  });

  // 3. Restoring a valid saved location after component remount
  it('restores a valid saved location on initial mount/remount in StrictMode', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockVijayawada));

    vi.mocked(api.getWeatherForecast).mockResolvedValue({
      status: 'success',
      forecast: mockForecastVijayawada,
    });

    render(
      <React.StrictMode>
        <BrowserRouter>
          <WeatherPage />
        </BrowserRouter>
      </React.StrictMode>
    );

    // Active location badge renders immediately
    await waitFor(() => {
      expect(screen.getByText(/Active location:/i)).toBeInTheDocument();
      expect(screen.getByText(/Vijayawada/i)).toBeInTheDocument();
    });
  });

  // 4. Automatically fetching weather for the restored location
  it('automatically fetches weather forecast for the restored location without user intervention', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockVijayawada));

    vi.mocked(api.getWeatherForecast).mockResolvedValue({
      status: 'success',
      forecast: mockForecastVijayawada,
    });

    render(
      <React.StrictMode>
        <BrowserRouter>
          <WeatherPage />
        </BrowserRouter>
      </React.StrictMode>
    );

    await waitFor(() => {
      expect(api.getWeatherForecast).toHaveBeenCalledWith(
        mockVijayawada.latitude,
        mockVijayawada.longitude,
        'Vijayawada, Andhra Pradesh',
        expect.any(AbortSignal)
      );
    });

    // Renders loaded weather data
    await waitFor(() => {
      expect(screen.getByText(/31\.4/i)).toBeInTheDocument();
      expect(screen.getByText('Feels Like')).toBeInTheDocument();
      expect(screen.getByText('Favorable Farming Conditions')).toBeInTheDocument();
    });
  });

  // 5. Replacing a previously saved location
  it('replaces a previously saved location with a new selection and updates forecast', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockVijayawada));

    vi.mocked(api.getWeatherForecast).mockImplementation(async (lat) => {
      if (Math.abs(lat - mockJaipur.latitude) < 0.1) {
        return { status: 'success', forecast: mockForecastJaipur };
      }
      return { status: 'success', forecast: mockForecastVijayawada };
    });

    render(
      <React.StrictMode>
        <BrowserRouter>
          <WeatherPage />
        </BrowserRouter>
      </React.StrictMode>
    );

    // Initial restored state is Vijayawada
    await waitFor(() => {
      expect(screen.getByText(/31\.4/i)).toBeInTheDocument();
    });

    // Clear / change location
    const changeBtn = screen.getByRole('button', { name: /Change/i });
    fireEvent.click(changeBtn);

    // After clearing, storage is empty and empty state is displayed
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(screen.getByText('No Location Selected')).toBeInTheDocument();

    // Now select Jaipur preset
    const jaipurBtn = screen.getByRole('button', { name: /Jaipur/i });
    fireEvent.click(jaipurBtn);

    // Storage is updated to Jaipur
    await waitFor(() => {
      const stored = localStorage.getItem(STORAGE_KEY);
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!);
      expect(parsed.name).toBe('Jaipur');
    });

    // Weather forecast reloaded for Jaipur
    await waitFor(() => {
      expect(screen.getByText(/28/i)).toBeInTheDocument();
      expect(screen.getByText('Dry Spell Window')).toBeInTheDocument();
    });
  });

  // 6. Handling malformed saved data
  it('safely ignores and purges corrupt non-JSON localStorage data on mount', async () => {
    localStorage.setItem(STORAGE_KEY, '{malformed_json: broken');

    render(
      <React.StrictMode>
        <BrowserRouter>
          <WeatherPage />
        </BrowserRouter>
      </React.StrictMode>
    );

    // No forecast fetch is made
    expect(api.getWeatherForecast).not.toHaveBeenCalled();

    // Shows empty prompt
    expect(screen.getByText('No Location Selected')).toBeInTheDocument();

    // Corrupt entry is purged
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('safely ignores and purges invalid object schemas in localStorage on mount', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ invalid: true, latitude: 'not-number' }));

    render(
      <React.StrictMode>
        <BrowserRouter>
          <WeatherPage />
        </BrowserRouter>
      </React.StrictMode>
    );

    expect(api.getWeatherForecast).not.toHaveBeenCalled();
    expect(screen.getByText('No Location Selected')).toBeInTheDocument();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  // 7. Handling missing saved data
  it('handles empty localStorage cleanly without error on initial render', () => {
    render(
      <React.StrictMode>
        <BrowserRouter>
          <WeatherPage />
        </BrowserRouter>
      </React.StrictMode>
    );

    expect(api.getWeatherForecast).not.toHaveBeenCalled();
    expect(screen.getByText('No Location Selected')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  // 8. Ensuring an initial render does not erase the saved location
  it('ensures an initial render and StrictMode remount never erases the valid saved location', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockVijayawada));

    vi.mocked(api.getWeatherForecast).mockResolvedValue({
      status: 'success',
      forecast: mockForecastVijayawada,
    });

    render(
      <React.StrictMode>
        <BrowserRouter>
          <WeatherPage />
        </BrowserRouter>
      </React.StrictMode>
    );

    // Immediately after rendering, localStorage must STILL be intact
    const stored = localStorage.getItem(STORAGE_KEY);
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed.name).toBe('Vijayawada');

    await waitFor(() => {
      expect(screen.getByText(/31\.4/i)).toBeInTheDocument();
    });

    // After full data resolution, localStorage remains intact
    const finalStored = localStorage.getItem(STORAGE_KEY);
    expect(finalStored).not.toBeNull();
    expect(JSON.parse(finalStored!).name).toBe('Vijayawada');
  });
});
