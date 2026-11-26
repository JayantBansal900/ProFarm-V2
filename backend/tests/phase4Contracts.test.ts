import { afterEach, expect, it, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { mandiCacheManager } from '../src/services/mandi.service';
import { farmFixture } from './farmFixtures';

const x = farmFixture();
afterEach(() => { vi.restoreAllMocks(); mandiCacheManager.clearAll(); });

it('supplies farm-wide pending totals independently of the ten-task preview', async () => {
  for (let i = 0; i < 12; i++) await x.task();
  await x.task({ status: 'completed', completedAt: new Date() });
  await x.task({ farmId: x.f.foreignId });
  const response = await x.get(`/api/farms/${x.f.farmId}`);
  expect(response.status).toBe(200);
  expect(response.body.data.pendingTasksCount).toBe(12);
  expect(response.body.data.totalTasksCount).toBe(13);
  expect(response.body.data.tasks).toHaveLength(10);
});

it.each(['page=100001', 'page=1.5', 'page=1e2', 'page=0', 'limit=101'])('bounds Mandi pagination: %s', async (query) => {
  expect((await request(app).get(`/api/mandi/prices?${query}`)).status).toBe(400);
});

it('sends market sort upstream before pagination and does not invent missing arrival dates', async () => {
  const fetcher = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({
    total: 1, records: [{ state: 'Rajasthan', district: 'Jaipur', market: 'Test market', commodity: 'Wheat', modal_price: 2000 }],
  }) } as Response);
  const response = await request(app).get('/api/mandi/prices?commodity=Wheat&sort=modal_price_asc&page=2&limit=1');
  expect(response.status).toBe(200);
  const url = new URL(String(fetcher.mock.calls[0][0]));
  expect(url.searchParams.get('sort[modal_price]')).toBe('asc');
  expect(url.searchParams.get('offset')).toBe('1');
  expect(response.body.records[0].arrivalDate).toBe('Not reported');
});

it('rejects malformed market data instead of reporting a successful empty market', async () => {
  vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ message: 'upstream invalid data' }) } as Response);
  const response = await request(app).get('/api/mandi/prices');
  expect(response.status).toBe(502);
  expect(response.body.records).toBeUndefined();
});
