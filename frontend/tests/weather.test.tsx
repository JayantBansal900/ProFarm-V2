import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { WeatherPage } from '../src/pages/tools/WeatherPage';
import { api, ApiError } from '../src/services/api';
import { NormalizedForecastResponse, LocationResult } from '../src/types/weather';

// Mock the API module
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
    {
      date: '2026-10-27',
      weatherCode: 63,
      condition: 'Moderate Rain',
      icon: '🌧️',
      tempMaxC: 33.5,
      tempMinC: 23.8,
      precipitationSumMm: 32.5,
      precipitationProbabilityMax: 85,
      windSpeedMaxKmH: 22.0,
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
      message: 'Heavy rain expected on 2026-10-27. Ensure field drainage channels are clear.',
    },
    {
      id: 'heat-alert-1',
      type: 'heat',
      severity: 'advisory',
      title: 'Elevated Daytime Temperatures',
      message: 'Daytime temperatures reaching 34.1°C with high humidity.',
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

describe('WeatherPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders search input and preset cities in empty state', () => {
    render(
      <BrowserRouter>
        <WeatherPage />
      </BrowserRouter>
    );

    expect(
      screen.getByRole('heading', { name: /Live Weather & Rainfall Forecasting/i })
    ).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText(/Type at least 2 characters/i);
    expect(searchInput).toBeInTheDocument();

    // Presets
    expect(screen.getByRole('button', { name: /Vijayawada/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Jaipur/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Pune/i })).toBeInTheDocument();
  });

  it('searches for a location and displays suggestions', async () => {
    vi.mocked(api.searchLocations).mockResolvedValueOnce({
      status: 'success',
      count: 2,
      locations: mockLocations,
    });

    render(
      <BrowserRouter>
        <WeatherPage />
      </BrowserRouter>
    );

    const searchInput = screen.getByPlaceholderText(/Type at least 2 characters/i);
    fireEvent.change(searchInput, { target: { value: 'Vijay' } });

    await waitFor(() => {
      expect(api.searchLocations).toHaveBeenCalledWith('Vijay', expect.any(AbortSignal));
    });

    await waitFor(() => {
      expect(screen.getByText('Andhra Pradesh, India')).toBeInTheDocument();
    });
  });

  it('selects a location and loads weather forecast data', async () => {
    vi.mocked(api.getWeatherForecast).mockResolvedValueOnce({
      status: 'success',
      forecast: mockForecast,
    });

    render(
      <BrowserRouter>
        <WeatherPage />
      </BrowserRouter>
    );

    // Click on preset "Vijayawada"
    const presetBtn = screen.getByRole('button', { name: /Vijayawada/i });
    fireEvent.click(presetBtn);

    await waitFor(() => {
      expect(api.getWeatherForecast).toHaveBeenCalledWith(
        16.50745,
        80.6466,
        'Vijayawada, Andhra Pradesh',
        expect.any(AbortSignal)
      );
    });

    // Check Current Weather Card
    await waitFor(() => {
      expect(screen.getByText(/31\.4/i)).toBeInTheDocument();
      expect(screen.getByText('Feels Like')).toBeInTheDocument();
      expect(screen.getByText(/36\.2/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Partly Cloudy/i).length).toBeGreaterThanOrEqual(1);
    });

    // Check Rainfall Intelligence
    expect(
      screen.getByText(/Rainfall Intelligence & Soil Moisture Outlook/i)
    ).toBeInTheDocument();
    expect(screen.getAllByText(/1\.2\s*mm/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/32\.5\s*mm/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/58\.4\s*mm/i)).toBeInTheDocument();
    expect(screen.getAllByText(/85%/i).length).toBeGreaterThanOrEqual(1);

    // Check Farmer Guidance Advisories
    expect(screen.getByText('Heavy Rainfall Warning')).toBeInTheDocument();
    expect(screen.getByText('Elevated Daytime Temperatures')).toBeInTheDocument();

    // Check 7-Day Forecast section
    expect(screen.getByText(/Seven-Day Weather Forecast/i)).toBeInTheDocument();

    // Check Attribution
    expect(screen.getByText(/Weather data by Open-Meteo.com/i)).toBeInTheDocument();
  });

  it('handles search error gracefully', async () => {
    vi.mocked(api.searchLocations).mockRejectedValueOnce(
      new ApiError('Failed to fetch location suggestions', 500)
    );

    render(
      <BrowserRouter>
        <WeatherPage />
      </BrowserRouter>
    );

    const searchInput = screen.getByPlaceholderText(/Type at least 2 characters/i);
    fireEvent.change(searchInput, { target: { value: 'Nowhere' } });

    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch location suggestions/i)).toBeInTheDocument();
    });
  });

  it('handles forecast fetch error with retry button', async () => {
    vi.mocked(api.getWeatherForecast).mockRejectedValueOnce(
      new ApiError('Weather service temporarily unavailable', 503)
    );

    render(
      <BrowserRouter>
        <WeatherPage />
      </BrowserRouter>
    );

    const presetBtn = screen.getByRole('button', { name: /Vijayawada/i });
    fireEvent.click(presetBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/Weather service temporarily unavailable/i)
      ).toBeInTheDocument();
    });

    const retryBtn = screen.getByRole('button', { name: /Retry Forecast Request/i });
    expect(retryBtn).toBeInTheDocument();

    // Mock successful retry
    vi.mocked(api.getWeatherForecast).mockResolvedValueOnce({
      status: 'success',
      forecast: mockForecast,
    });

    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByText(/31\.4/i)).toBeInTheDocument();
    });
  });

  it('persists selected location to localStorage and loads on initial mount', async () => {
    localStorage.setItem(
      'profarm_weather_selected_location',
      JSON.stringify(mockLocations[0])
    );

    vi.mocked(api.getWeatherForecast).mockResolvedValueOnce({
      status: 'success',
      forecast: mockForecast,
    });

    render(
      <BrowserRouter>
        <WeatherPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(api.getWeatherForecast).toHaveBeenCalledWith(
        16.50745,
        80.6466,
        'Vijayawada, Andhra Pradesh',
        expect.any(AbortSignal)
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/31\.4/i)).toBeInTheDocument();
    });
  });
});
