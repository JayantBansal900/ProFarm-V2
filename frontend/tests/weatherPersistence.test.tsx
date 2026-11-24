
import React from 'react';
import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
} from 'vitest';
import {
  render,
  screen,
  waitFor,
  fireEvent,
  cleanup,
} from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

import {
  WeatherPage,
  STORAGE_KEY,
  isValidSavedLocation,
} from '../src/pages/WeatherPage';

import { api } from '../src/api/api';

import type {
  LocationResult,
  NormalizedForecastResponse,
} from '../src/types/weather';

vi.mock('../src/api/api', () => ({
  api: {
    searchLocations: vi.fn(),
    getWeatherForecast: vi.fn(),
  },
  ApiError: class ApiError extends Error {
    constructor(
      message: string,
      public statusCode: number
    ) {
      super(message);
      this.name = 'ApiError';
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
    precipitationMm: 0,
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
    tomorrowExpectedMm: 14,
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
      message:
        'Optimal conditions for routine agricultural activities.',
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
    temperatureC: 28,
    apparentTemperatureC: 27.5,
    relativeHumidity: 35,
    precipitationMm: 0,
    weatherCode: 0,
    condition: 'Clear Sky',
    icon: '☀️',
    cloudCover: 10,
    windSpeedKmH: 12,
    isDay: true,
    timestamp: '2026-10-26T10:00:00Z',
  },
  daily: [
    {
      date: '2026-10-26',
      weatherCode: 0,
      condition: 'Clear Sky',
      icon: '☀️',
      tempMaxC: 31,
      tempMinC: 18,
      precipitationSumMm: 0,
      precipitationProbabilityMax: 5,
      windSpeedMaxKmH: 12,
    },
  ],
  rainfallSummary: {
    todayExpectedMm: 0,
    tomorrowExpectedMm: 0,
    sevenDayTotalMm: 0,
    maxDailyProbabilityPercent: 5,
    heavyRainDays: [],
  },
  guidance: [
    {
      id: 'dry-1',
      type: 'dry',
      severity: 'info',
      title: 'Dry Spell Window',
      message:
        'No rainfall forecast. Ideal window for harvesting or grain drying.',
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

const mockedGetWeatherForecast = vi.mocked(
  api.getWeatherForecast
);

const mockedSearchLocations = vi.mocked(
  api.searchLocations
);

function renderWeatherPage() {
  return render(
    <React.StrictMode>
      <BrowserRouter>
        <WeatherPage />
      </BrowserRouter>
    </React.StrictMode>
  );
}

function mockVijayawadaForecast() {
  mockedGetWeatherForecast.mockResolvedValue({
    status: 'success',
    forecast: mockForecastVijayawada,
  });
}

function saveLocation(location: LocationResult) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(location)
  );
}

function getSavedLocation(): LocationResult | null {
  const stored = localStorage.getItem(STORAGE_KEY);

  if (!stored) {
    return null;
  }

  return JSON.parse(stored) as LocationResult;
}

describe('Weather Location Persistence & Lifecycle Regressions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    mockedSearchLocations.mockResolvedValue({
      status: 'success',
      locations: [],
      count: 0,
    });

    mockVijayawadaForecast();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    localStorage.clear();
  });

  // TEST 1: Saved location validation

  it('validates saved location structure properly', () => {
    expect(isValidSavedLocation(null)).toBe(false);
    expect(isValidSavedLocation(undefined)).toBe(false);
    expect(isValidSavedLocation('string')).toBe(false);
    expect(isValidSavedLocation(12345)).toBe(false);
    expect(isValidSavedLocation({})).toBe(false);

    expect(
      isValidSavedLocation({ name: 'City' })
    ).toBe(false);

    expect(
      isValidSavedLocation({
        name: 'City',
        latitude: 'bad',
        longitude: 80,
      })
    ).toBe(false);

    expect(
      isValidSavedLocation({
        name: 'City',
        latitude: NaN,
        longitude: 80,
      })
    ).toBe(false);

    expect(
      isValidSavedLocation({
        name: 'City',
        latitude: 120,
        longitude: 80,
      })
    ).toBe(false);

    expect(
      isValidSavedLocation({
        name: 'City',
        latitude: 16.5,
        longitude: 200,
      })
    ).toBe(false);

    expect(isValidSavedLocation(mockVijayawada)).toBe(true);
    expect(isValidSavedLocation(mockJaipur)).toBe(true);
  });

  // TEST 2: Save selected location

  it('saves selected location to localStorage when a preset is clicked', async () => {
    renderWeatherPage();

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();

    const presetButton = screen.getByRole('button', {
      name: /Vijayawada/i,
    });

    fireEvent.click(presetButton);

    await waitFor(() => {
      const saved = getSavedLocation();

      expect(saved).not.toBeNull();
      expect(saved?.name).toBe('Vijayawada');
      expect(saved?.latitude).toBeCloseTo(16.50745, 3);
      expect(saved?.longitude).toBeCloseTo(80.6466, 3);
    });

    await waitFor(() => {
      expect(mockedGetWeatherForecast).toHaveBeenCalled();
    });
  });

  // TEST 3: Restore saved location

  it('restores a valid saved location on initial mount/remount in StrictMode', async () => {
    saveLocation(mockVijayawada);

    renderWeatherPage();

    expect(
      screen.getByText(/Active location:/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText('Vijayawada, Andhra Pradesh')
    ).toBeInTheDocument();

    expect(getSavedLocation()?.name).toBe('Vijayawada');

    await waitFor(() => {
      expect(mockedGetWeatherForecast).toHaveBeenCalled();
    });
  });

  // TEST 4: Automatically fetch restored weather

  it('automatically fetches weather forecast for the restored location without user intervention', async () => {
    saveLocation(mockVijayawada);

    renderWeatherPage();

    await waitFor(() => {
      expect(mockedGetWeatherForecast).toHaveBeenCalledWith(
        mockVijayawada.latitude,
        mockVijayawada.longitude,
        'Vijayawada, Andhra Pradesh',
        expect.any(AbortSignal)
      );
    });

    await waitFor(() => {
      expect(
        screen.getByText(/31\.4/)
      ).toBeInTheDocument();

      expect(
        screen.getByText(/Feels Like/i)
      ).toBeInTheDocument();

      expect(
        screen.getByText('Favorable Farming Conditions')
      ).toBeInTheDocument();
    });
  });

  // TEST 5: Change selected location

  it('replaces a previously saved location with a new selection and updates forecast', async () => {
    saveLocation(mockVijayawada);

    mockedGetWeatherForecast.mockImplementation(
      async (latitude) => {
        if (
          Math.abs(latitude - mockJaipur.latitude) < 0.1
        ) {
          return {
            status: 'success',
            forecast: mockForecastJaipur,
          };
        }

        return {
          status: 'success',
          forecast: mockForecastVijayawada,
        };
      }
    );

    renderWeatherPage();

    await waitFor(() => {
      expect(
        screen.getByText(/31\.4/)
      ).toBeInTheDocument();
    });

    expect(getSavedLocation()?.name).toBe('Vijayawada');

    const changeButton = screen.getByRole('button', {
      name: /Change/i,
    });

    fireEvent.click(changeButton);

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();

    expect(
      screen.getByText('No Location Selected')
    ).toBeInTheDocument();

    const jaipurButton = screen.getByRole('button', {
      name: /Jaipur/i,
    });

    fireEvent.click(jaipurButton);

    await waitFor(() => {
      expect(getSavedLocation()?.name).toBe('Jaipur');
    });

    await waitFor(() => {
      expect(mockedGetWeatherForecast).toHaveBeenCalledWith(
        mockJaipur.latitude,
        mockJaipur.longitude,
        'Jaipur, Rajasthan',
        expect.any(AbortSignal)
      );
    });

    await waitFor(() => {
      expect(
        screen.getByText('Dry Spell Window')
      ).toBeInTheDocument();

      expect(
        screen.getAllByText('Clear Sky').length
      ).toBeGreaterThan(0);
    });

    expect(getSavedLocation()?.name).toBe('Jaipur');
  });

  // TEST 6: Malformed JSON

  it('safely ignores and purges corrupt non-JSON localStorage data on mount', () => {
    localStorage.setItem(
      STORAGE_KEY,
      '{malformed_json: broken'
    );

    renderWeatherPage();

    expect(
      mockedGetWeatherForecast
    ).not.toHaveBeenCalled();

    expect(
      screen.getByText('No Location Selected')
    ).toBeInTheDocument();

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  // TEST 7: Invalid saved location schema

  it('safely ignores and purges invalid object schemas in localStorage on mount', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        invalid: true,
        latitude: 'not-number',
      })
    );

    renderWeatherPage();

    expect(
      mockedGetWeatherForecast
    ).not.toHaveBeenCalled();

    expect(
      screen.getByText('No Location Selected')
    ).toBeInTheDocument();

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  // TEST 8: Empty localStorage

  it('handles empty localStorage cleanly without error on initial render', () => {
    renderWeatherPage();

    expect(
      mockedGetWeatherForecast
    ).not.toHaveBeenCalled();

    expect(
      screen.getByText('No Location Selected')
    ).toBeInTheDocument();

    expect(screen.queryByRole('alert')).toBeNull();

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  // TEST 9: StrictMode does not erase valid storage

  it('ensures an initial render and StrictMode remount never erases the valid saved location', async () => {
    saveLocation(mockVijayawada);

    renderWeatherPage();

    const storedImmediately = getSavedLocation();

    expect(storedImmediately).not.toBeNull();
    expect(storedImmediately?.name).toBe('Vijayawada');

    await waitFor(() => {
      expect(
        screen.getByText(/31\.4/)
      ).toBeInTheDocument();
    });

    const storedAfterFetch = getSavedLocation();

    expect(storedAfterFetch).not.toBeNull();
    expect(storedAfterFetch?.name).toBe('Vijayawada');

    expect(storedAfterFetch?.latitude).toBeCloseTo(
      mockVijayawada.latitude,
      3
    );

    expect(storedAfterFetch?.longitude).toBeCloseTo(
      mockVijayawada.longitude,
      3
    );
  });
});
