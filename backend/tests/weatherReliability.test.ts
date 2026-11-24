import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { weatherCacheManager } from '../src/services/weather.service';
import { MemoryCache } from '../src/lib/memoryCache';

const validForecast = () => ({
  current: { temperature_2m: 30, apparent_temperature: 31, relative_humidity_2m: 65,
    precipitation: 0, weather_code: 1, cloud_cover: 10, wind_speed_10m: 5, is_day: 1, time: '2026-10-28T12:00' },
  daily: { time: ['2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01', '2026-11-02', '2026-11-03'],
    weather_code: Array(7).fill(1), temperature_2m_max: Array(7).fill(32), temperature_2m_min: Array(7).fill(22),
    precipitation_sum: Array(7).fill(0), precipitation_probability_max: Array(7).fill(10), wind_speed_10m_max: Array(7).fill(8) },
});
beforeEach(() => weatherCacheManager.clearAll());
afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); });

it.each(['missing-rain', 'null-temperature', 'short-week', 'invalid-day', 'invalid-number'])('rejects partial upstream data (%s) instead of fabricating forecast values', async (kind) => {
  const raw = validForecast();
  if (kind === 'missing-rain') raw.daily.precipitation_sum = [];
  if (kind === 'null-temperature') raw.current.temperature_2m = null as unknown as number;
  if (kind === 'short-week') raw.daily.time.pop();
  if (kind === 'invalid-day') raw.daily.time[0] = '2026-02-31';
  if (kind === 'invalid-number') raw.daily.temperature_2m_max[0] = Infinity;
  const fetcher = vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, json: async () => raw } as Response);
  const response = await request(app).get('/api/weather/forecast?latitude=16.51&longitude=80.65');
  expect(response.status).toBe(500);
  expect(response.body.message).toMatch(/malformed upstream weather/i);
  expect(response.body.forecast).toBeUndefined();
  fetcher.mockResolvedValueOnce({ ok: true, json: async () => validForecast() } as Response);
  const retried = await request(app).get('/api/weather/forecast?latitude=16.51&longitude=80.65');
  expect(retried.status).toBe(200);
  expect(retried.body.forecast.daily).toHaveLength(7);
  expect(fetcher).toHaveBeenCalledTimes(2);
});

it.each([429, 500])('does not cache an upstream HTTP %s failure', async (status) => {
  const fetcher = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({ ok: false, status } as Response)
    .mockResolvedValueOnce({ ok: true, json: async () => validForecast() } as Response);
  expect((await request(app).get('/api/weather/forecast?latitude=26.91&longitude=75.79')).status).toBe(500);
  expect((await request(app).get('/api/weather/forecast?latitude=26.91&longitude=75.79')).status).toBe(200);
  expect(fetcher).toHaveBeenCalledTimes(2);
});

it('expires cached values and evicts the least recently read entry', () => {
  vi.useFakeTimers();
  const cache = new MemoryCache<number>(2);
  cache.set('a', 1, 100);
  cache.set('b', 2, 100);
  expect(cache.get('a')).toBe(1);
  cache.set('c', 3, 100);
  expect(cache.get('b')).toBeUndefined();
  vi.advanceTimersByTime(101);
  expect(cache.get('a')).toBeUndefined();
  expect(cache.get('c')).toBeUndefined();
});

it('refreshes an existing cache key without evicting another key and expires exactly at TTL', () => {
  vi.useFakeTimers();
  const cache = new MemoryCache<number>(2);
  cache.set('a', 1, 100);
  cache.set('b', 2, 100);
  cache.set('b', 3, 100);
  expect(cache.get('a')).toBe(1);
  expect(cache.get('b')).toBe(3);
  vi.advanceTimersByTime(100);
  expect(cache.get('a')).toBeUndefined();
  expect(cache.get('b')).toBeUndefined();
});

it('reports an upstream timeout without returning forecast data', async () => {
  vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new DOMException('test timeout', 'AbortError'));
  const response = await request(app).get('/api/weather/forecast?latitude=16.51&longitude=80.65');
  expect(response.status).toBe(500);
  expect(response.body.message).toMatch(/timed out/i);
  expect(response.body.forecast).toBeUndefined();
});

it('rejects invalid geocoding values and excludes non-Indian results', async () => {
  const fetcher = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({ ok: true, json: async () => ({ results: [{ id: 1, name: 'Invalid', latitude: 'bad', longitude: 77, country: 'India' }] }) } as Response);
  expect((await request(app).get('/api/weather/locations?query=Invalid')).status).toBe(500);
  fetcher.mockResolvedValueOnce({ ok: true, json: async () => ({ results: [
    { id: 2, name: 'Delhi', latitude: 28.6, longitude: 77.2, country: 'India' },
    { id: 3, name: 'Delhi', latitude: 42, longitude: -74, country: 'United States' },
  ] }) } as Response);
  const response = await request(app).get('/api/weather/locations?query=Delhi');
  expect(response.status).toBe(200);
  expect(response.body.locations).toHaveLength(1);
  expect(response.body.locations[0].country).toBe('India');
});
