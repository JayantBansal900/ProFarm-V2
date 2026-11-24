
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
} from '../src/pages/WeatherPage';

import { api, ApiError } from '../src/api/api';

import type {
  NormalizedForecastResponse,
  LocationResult,
} from '../src/types/weather';

// Mock API requests without changing the real WeatherPage.
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

const mockLocations: LocationResult[] = [
  {
    id: 1253184,
    name: 'Vijayawada',
    latitude: 16.50745,
    longitude: 80.6466,
    country: 'India',
    state: 'Andhra Pradesh',
    timezone: 'Asia/Kolkata',
  },
  {
    id: 1269515,
    name: 'Jaipur',
    latitude: 26.9196,
    longitude: 75.7878,
    country: 'India',
    state: 'Rajasthan',
    timezone: 'Asia/Kolkata',
  },
];

const mockForecast: NormalizedForecastResponse = {
  location: {
    latitude: 16.51,
    longitude: 80.65,
    elevation: 25,
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
    {
      date: '2026-10-27',
      weatherCode: 63,
      condition: 'Moderate Rain',
      icon: '🌧️',
      tempMaxC: 33.5,
      tempMinC: 23.8,
      precipitationSumMm: 32.5,
      precipitationProbabilityMax: 85,
      windSpeedMaxKmH: 22,
    },
  ],
  rainfallSummary: {
    todayExpectedMm: 1.2,
    tomorrowExpectedMm: 32.5,
    sevenDayTotalMm: 58.4,
    maxDailyProbabilityPercent: 85,
    heavyRainDays: ['2026-10-27'],
  },
  guidance: [
    {
      id: 'rain-alert-1',
      type: 'rain',
      severity: 'caution',
      title: 'Heavy Rainfall Warning',
      message:
        'Heavy rain expected on 2026-10-27. Ensure field drainage channels are clear.',
    },
    {
      id: 'heat-alert-1',
      type: 'heat',
      severity: 'advisory',
      title: 'Elevated Daytime Temperatures',
      message:
        'Daytime temperatures reaching 34.1°C with high humidity.',
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

const mockedSearchLocations = vi.mocked(
  api.searchLocations
);

const mockedGetWeatherForecast = vi.mocked(
  api.getWeatherForecast
);

function renderWeatherPage(strictMode = false) {
  const page = (
    <BrowserRouter>
      <WeatherPage />
    </BrowserRouter>
  );

  return render(
    strictMode ? (
      <React.StrictMode>{page}</React.StrictMode>
    ) : (
      page
    )
  );
}

function mockSuccessfulForecast() {
  mockedGetWeatherForecast.mockResolvedValue({
    status: 'success',
    forecast: mockForecast,
  });
}

describe('WeatherPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    mockedSearchLocations.mockResolvedValue({
      status: 'success',
      count: 0,
      locations: [],
    });

    mockSuccessfulForecast();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    localStorage.clear();
  });

  // TEST 1: Empty state and location presets

  it('renders search input and preset cities in empty state', () => {
    renderWeatherPage();

    expect(
      screen.getByRole('heading', {
        name: /Weather & Field Conditions/i,
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole('searchbox', {
        name: /Search location/i,
      })
    ).toBeInTheDocument();

    expect(
      screen.getByPlaceholderText(
        /Search village, town or city/i
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText('No Location Selected')
    ).toBeInTheDocument();

    expect(
      screen.getByRole('button', {
        name: /Vijayawada/i,
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole('button', {
        name: /Jaipur/i,
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole('button', {
        name: /Pune/i,
      })
    ).toBeInTheDocument();

    expect(
      mockedGetWeatherForecast
    ).not.toHaveBeenCalled();
  });

  // TEST 2: Location search and suggestions

  it('searches for a location and displays suggestions', async () => {
    mockedSearchLocations.mockResolvedValue({
      status: 'success',
      count: 2,
      locations: mockLocations,
    });

    renderWeatherPage();

    const searchInput = screen.getByRole('searchbox', {
      name: /Search location/i,
    });

    fireEvent.change(searchInput, {
      target: {
        value: 'Vijay',
      },
    });

    await waitFor(() => {
      expect(
        mockedSearchLocations
      ).toHaveBeenCalledWith(
        'Vijay',
        expect.any(AbortSignal)
      );
    });

    await waitFor(() => {
      expect(
        screen.getByText('Andhra Pradesh, India')
      ).toBeInTheDocument();
    });

    // One Vijayawada button is a preset.
    // Another is the API search suggestion.
    expect(
      screen.getAllByRole('button', {
        name: /Vijayawada/i,
      }).length
    ).toBeGreaterThanOrEqual(2);
  });

  // TEST 3: Forecast loading and weather data

  it('selects a location and loads weather forecast data', async () => {
    renderWeatherPage();

    const presetButton = screen.getByRole('button', {
      name: /Vijayawada/i,
    });

    fireEvent.click(presetButton);

    await waitFor(() => {
      expect(
        mockedGetWeatherForecast
      ).toHaveBeenCalledWith(
        16.50745,
        80.6466,
        'Vijayawada, Andhra Pradesh',
        expect.any(AbortSignal)
      );
    });

    // Current weather
    await waitFor(() => {
      expect(
        screen.getByText(/31\.4/)
      ).toBeInTheDocument();

      expect(
        screen.getByText(/Feels Like/i)
      ).toBeInTheDocument();

      expect(
        screen.getAllByText(/Partly Cloudy/i).length
      ).toBeGreaterThanOrEqual(1);
    });

    // Current UI rounds apparent temperature.
    expect(
      screen.getByText(/Feels Like\s*36\s*°C/i)
    ).toBeInTheDocument();

    // Rainfall intelligence
    expect(
      screen.getAllByText(/1\.2\s*mm/i).length
    ).toBeGreaterThanOrEqual(1);

    expect(
      screen.getAllByText(/32\.5\s*mm/i).length
    ).toBeGreaterThanOrEqual(1);

    expect(
      screen.getAllByText(/58\.4\s*mm/i).length
    ).toBeGreaterThanOrEqual(1);

    expect(
      screen.getAllByText(/85%/i).length
    ).toBeGreaterThanOrEqual(1);

    // Farmer guidance
    expect(
      screen.getByText('Heavy Rainfall Warning')
    ).toBeInTheDocument();

    expect(
      screen.getByText('Elevated Daytime Temperatures')
    ).toBeInTheDocument();

    // Verify daily forecast content rather than an
    // outdated section heading.
    expect(
      screen.getAllByText(/Partly Cloudy/i).length
    ).toBeGreaterThanOrEqual(1);

    expect(
      screen.getAllByText(/Moderate Rain/i).length
    ).toBeGreaterThanOrEqual(1);

    // Weather provider attribution
    expect(
      screen.getByText(/Weather data by Open-Meteo.com/i)
    ).toBeInTheDocument();
  });

  // TEST 4: Search failure handling

  it('handles search error gracefully', async () => {
    mockedSearchLocations.mockRejectedValue(
      new ApiError(
        'Failed to fetch location suggestions',
        500
      )
    );

    renderWeatherPage();

    const searchInput = screen.getByRole('searchbox', {
      name: /Search location/i,
    });

    fireEvent.change(searchInput, {
      target: {
        value: 'Nowhere',
      },
    });

    await waitFor(() => {
      expect(
        mockedSearchLocations
      ).toHaveBeenCalledWith(
        'Nowhere',
        expect.any(AbortSignal)
      );
    });

    await waitFor(() => {
      expect(
        screen.getByText(
          /Failed to fetch location suggestions/i
        )
      ).toBeInTheDocument();
    });
  });

  // TEST 5: Forecast error and retry

  it('handles forecast fetch error with retry button', async () => {
    mockedGetWeatherForecast.mockReset();

    mockedGetWeatherForecast.mockRejectedValueOnce(
      new ApiError(
        'Weather service temporarily unavailable',
        503
      )
    );

    mockedGetWeatherForecast.mockResolvedValue({
      status: 'success',
      forecast: mockForecast,
    });

    renderWeatherPage();

    const presetButton = screen.getByRole('button', {
      name: /Vijayawada/i,
    });

    fireEvent.click(presetButton);

    await waitFor(() => {
      expect(
        screen.getByText(
          /Weather service temporarily unavailable/i
        )
      ).toBeInTheDocument();
    });

    expect(
      screen.getByRole('alert')
    ).toBeInTheDocument();

    const retryButton = screen.getByRole('button', {
      name: /Try again/i,
    });

    expect(retryButton).toBeInTheDocument();

    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(
        mockedGetWeatherForecast
      ).toHaveBeenCalledTimes(2);
    });

    await waitFor(() => {
      expect(
        screen.getByText(/31\.4/)
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText('Heavy Rainfall Warning')
    ).toBeInTheDocument();
  });

  // TEST 6: Location persistence and restoration

  it('persists selected location to localStorage and loads on initial mount', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(mockLocations[0])
    );

    mockSuccessfulForecast();

    renderWeatherPage(true);

    await waitFor(() => {
      expect(
        mockedGetWeatherForecast
      ).toHaveBeenCalledWith(
        16.50745,
        80.6466,
        'Vijayawada, Andhra Pradesh',
        expect.any(AbortSignal)
      );
    });

    await waitFor(() => {
      expect(
        screen.getByText(/31\.4/)
      ).toBeInTheDocument();
    });

    const stored = localStorage.getItem(STORAGE_KEY);

    expect(stored).not.toBeNull();

    const parsed = JSON.parse(stored!) as LocationResult;

    expect(parsed.name).toBe('Vijayawada');
    expect(parsed.latitude).toBeCloseTo(16.50745, 3);
    expect(parsed.longitude).toBeCloseTo(80.6466, 3);

    expect(
      screen.getByText(/Active location:/i)
    ).toBeInTheDocument();
  });
});
