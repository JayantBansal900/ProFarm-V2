import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { weatherCacheManager } from '../src/services/weather.service';
import { generateFarmerGuidance } from '../src/lib/weatherCodes';

// Sample mock data for Geocoding
const MOCK_GEOCODING_RESPONSE = {
  results: [
    {
      id: 1253184,
      name: 'Vijayawada',
      latitude: 16.50745,
      longitude: 80.6466,
      elevation: 47.0,
      country: 'India',
      admin1: 'Andhra Pradesh',
      admin2: 'NTR',
      admin3: 'Vijayawada Urban',
      timezone: 'Asia/Kolkata',
    },
  ],
};

// Sample mock data for Forecast
const MOCK_FORECAST_RESPONSE = {
  latitude: 16.51,
  longitude: 80.65,
  elevation: 28.0,
  timezone: 'Asia/Kolkata',
  current: {
    time: '2026-10-26T12:00',
    temperature_2m: 32.5,
    relative_humidity_2m: 65,
    apparent_temperature: 36.2,
    precipitation: 0.0,
    weather_code: 3,
    cloud_cover: 75,
    wind_speed_10m: 12.4,
    is_day: 1,
  },
  daily: {
    time: [
      '2026-10-26',
      '2026-10-27',
      '2026-10-28',
      '2026-10-29',
      '2026-10-30',
      '2026-10-31',
      '2026-11-01',
    ],
    weather_code: [3, 61, 80, 0, 1, 2, 3],
    temperature_2m_max: [34.0, 31.5, 30.0, 33.0, 33.5, 34.0, 32.0],
    temperature_2m_min: [24.0, 23.5, 22.0, 23.0, 23.5, 24.0, 23.0],
    precipitation_sum: [0.0, 18.5, 8.0, 0.0, 0.0, 0.0, 1.2],
    precipitation_probability_max: [10, 75, 55, 15, 10, 10, 25],
    wind_speed_10m_max: [14.0, 26.5, 18.0, 12.0, 11.5, 10.0, 9.5],
  },
};

describe('Weather API Endpoints (/api/weather)', () => {
  beforeEach(() => {
    weatherCacheManager.clearAll();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // Location Search Tests
  // -------------------------------------------------------------------------
  describe('GET /api/weather/locations', () => {
    it('returns normalized locations for a valid query', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => MOCK_GEOCODING_RESPONSE,
      } as Response);

      const res = await request(app).get('/api/weather/locations?query=Vijayawada');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.count).toBe(1);
      expect(res.body.locations[0]).toMatchObject({
        name: 'Vijayawada',
        latitude: 16.50745,
        longitude: 80.6466,
        state: 'Andhra Pradesh',
        country: 'India',
      });
    });

    it('returns empty array when upstream finds no matching locations', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: undefined }),
      } as Response);

      const res = await request(app).get('/api/weather/locations?query=UnknownCityXYZ');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.count).toBe(0);
      expect(res.body.locations).toEqual([]);
    });

    it('rejects short query (< 2 chars) with 400 Bad Request', async () => {
      const res = await request(app).get('/api/weather/locations?query=a');

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Validation failed');
    });

    it('serves cached results on second query without secondary upstream fetch', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => MOCK_GEOCODING_RESPONSE,
      } as Response);

      // First call
      await request(app).get('/api/weather/locations?query=Vijayawada');
      expect(fetchSpy).toHaveBeenCalledTimes(1);

      // Second call with same normalized query
      const res2 = await request(app).get('/api/weather/locations?query=vijayawada');
      expect(res2.status).toBe(200);
      expect(fetchSpy).toHaveBeenCalledTimes(1); // Cached!
    });
  });

  // -------------------------------------------------------------------------
  // Forecast Tests
  // -------------------------------------------------------------------------
  describe('GET /api/weather/forecast', () => {
    it('returns normalized current weather, 7-day forecast, rainfall, and guidance', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => MOCK_FORECAST_RESPONSE,
      } as Response);

      const res = await request(app).get(
        '/api/weather/forecast?latitude=16.51&longitude=80.65&locationName=Vijayawada'
      );

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');

      const { forecast } = res.body;
      expect(forecast).toBeDefined();

      // Location
      expect(forecast.location.latitude).toBe(16.51);
      expect(forecast.location.locationName).toBe('Vijayawada');

      // Current
      expect(forecast.current.temperatureC).toBe(32.5);
      expect(forecast.current.condition).toBe('Overcast');
      expect(forecast.current.icon).toBe('☁️');
      expect(forecast.current.windSpeedKmH).toBe(12.4);

      // Daily
      expect(forecast.daily).toHaveLength(7);
      expect(forecast.daily[0].date).toBe('2026-10-26');
      expect(forecast.daily[1].condition).toBe('Slight rain');

      // Rainfall Summary
      expect(forecast.rainfallSummary.todayExpectedMm).toBe(0.0);
      expect(forecast.rainfallSummary.tomorrowExpectedMm).toBe(18.5);
      expect(forecast.rainfallSummary.sevenDayTotalMm).toBe(27.7);
      expect(forecast.rainfallSummary.maxDailyProbabilityPercent).toBe(75);
      expect(forecast.rainfallSummary.heavyRainDays).toContain('2026-10-27');

      // Attribution
      expect(forecast.attribution.provider).toBe('Open-Meteo');
    });

    it('rejects invalid latitude (> 90) with 400 Bad Request', async () => {
      const res = await request(app).get('/api/weather/forecast?latitude=105&longitude=80');

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Validation failed');
    });

    it('rejects invalid longitude (> 180) with 400 Bad Request', async () => {
      const res = await request(app).get('/api/weather/forecast?latitude=16&longitude=205');

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Validation failed');
    });

    it('handles upstream 503 error gracefully', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 503,
      } as Response);

      const res = await request(app).get('/api/weather/forecast?latitude=16.5&longitude=80.6');

      expect(res.status).toBe(500);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toMatch(/responded with status 503/i);
    });

    it('handles malformed upstream payload gracefully', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ unexpected: 'data' }),
      } as Response);

      const res = await request(app).get('/api/weather/forecast?latitude=16.5&longitude=80.6');

      expect(res.status).toBe(500);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toMatch(/malformed upstream weather response/i);
    });
  });

  // -------------------------------------------------------------------------
  // Farmer Guidance Unit Tests
  // -------------------------------------------------------------------------
  describe('Farmer Guidance Threshold Rules', () => {
    it('generates heavy rain caution when today or tomorrow precipitation >= 30mm', () => {
      const guidance = generateFarmerGuidance({
        currentTemp: 28,
        maxTempToday: 30,
        currentPrecip: 5,
        todayPrecipSum: 35,
        tomorrowPrecipSum: 10,
        maxWindSpeed: 15,
        sevenDayPrecipSum: 50,
        maxPrecipProb: 90,
      });

      const rainItem = guidance.find((g) => g.type === 'rain');
      expect(rainItem).toBeDefined();
      expect(rainItem?.severity).toBe('caution');
      expect(rainItem?.title).toMatch(/Heavy Rain Expected/i);
    });

    it('generates high heat caution when daytime temperature >= 40°C', () => {
      const guidance = generateFarmerGuidance({
        currentTemp: 38,
        maxTempToday: 42,
        currentPrecip: 0,
        todayPrecipSum: 0,
        tomorrowPrecipSum: 0,
        maxWindSpeed: 10,
        sevenDayPrecipSum: 0,
        maxPrecipProb: 0,
      });

      const heatItem = guidance.find((g) => g.type === 'heat');
      expect(heatItem).toBeDefined();
      expect(heatItem?.severity).toBe('caution');
      expect(heatItem?.title).toMatch(/40°C\+/i);
    });

    it('generates dry spell alert when 7-day precipitation is under 2mm', () => {
      const guidance = generateFarmerGuidance({
        currentTemp: 25,
        maxTempToday: 30,
        currentPrecip: 0,
        todayPrecipSum: 0,
        tomorrowPrecipSum: 0,
        maxWindSpeed: 10,
        sevenDayPrecipSum: 0.5,
        maxPrecipProb: 5,
      });

      const dryItem = guidance.find((g) => g.type === 'dry');
      expect(dryItem).toBeDefined();
      expect(dryItem?.title).toMatch(/Dry Conditions Ahead/i);
    });

    it('returns neutral favorable guidance when no adverse thresholds are triggered', () => {
      const guidance = generateFarmerGuidance({
        currentTemp: 26,
        maxTempToday: 31,
        currentPrecip: 0,
        todayPrecipSum: 2,
        tomorrowPrecipSum: 3,
        maxWindSpeed: 12,
        sevenDayPrecipSum: 15,
        maxPrecipProb: 30,
      });

      expect(guidance).toHaveLength(1);
      expect(guidance[0].type).toBe('favorable');
      expect(guidance[0].title).toMatch(/Normal Seasonal Conditions/i);
    });
  });
});
