import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { mandiCacheManager } from '../src/services/mandi.service';
import { env } from '../src/config/env';

const MOCK_MANDI_RESPONSE = {
  status: 'ok',
  total: 105,
  count: 3,
  limit: 20,
  offset: 0,
  records: [
    {
      state: 'Madhya Pradesh',
      district: 'Sidhi',
      market: 'Sidhi APMC',
      commodity: 'Wheat',
      variety: 'Mill Quality',
      grade: 'Non-FAQ',
      arrival_date: '25/10/2026',
      min_price: 2400,
      max_price: 2450,
      modal_price: 2450,
    },
    {
      state: 'Madhya Pradesh',
      district: 'Hoshangabad',
      market: 'Itarsi APMC',
      commodity: 'Wheat',
      variety: 'Sharbati',
      grade: 'FAQ',
      arrival_date: '24/10/2026',
      min_price: '2800',
      max_price: '3200',
      modal_price: '3050',
    },
    {
      state: 'Madhya Pradesh',
      district: 'Dewas',
      market: 'Dewas APMC',
      commodity: 'Wheat',
      variety: 'Lokwan',
      grade: 'FAQ',
      arrival_date: '23/10/2026',
      min_price: 2200,
      max_price: 2350,
      modal_price: 2300,
    },
  ],
};

describe('Mandi Price Tracker & Market Trends API (/api/mandi)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mandiCacheManager.clearAll();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // 1. GET /api/mandi/prices - Success & Normalization
  describe('GET /api/mandi/prices', () => {
    it('returns normalized mandi records for valid commodity query', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => MOCK_MANDI_RESPONSE,
      } as Response);

      const res = await request(app).get('/api/mandi/prices?commodity=Wheat');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.records).toHaveLength(3);
      expect(res.body.pagination).toMatchObject({
        page: 1,
        limit: 20,
        totalRecords: 105,
        totalPages: 6,
      });

      const first = res.body.records[0];
      expect(first).toMatchObject({
        state: 'Madhya Pradesh',
        district: 'Hoshangabad', // default sort is modal_price_desc, 3050 is highest
        commodity: 'Wheat',
        modalPrice: 3050,
        priceUnit: '₹ / quintal',
      });
      expect(first.id).toBeDefined();
    });

    it('filters by state and district', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          status: 'ok',
          total: 1,
          count: 1,
          records: [MOCK_MANDI_RESPONSE.records[0]],
        }),
      } as Response);

      const res = await request(app).get(
        '/api/mandi/prices?commodity=Wheat&state=Madhya%20Pradesh&district=Sidhi'
      );

      expect(res.status).toBe(200);
      expect(res.body.records).toHaveLength(1);
      expect(res.body.filters).toMatchObject({
        commodity: 'Wheat',
        state: 'Madhya Pradesh',
        district: 'Sidhi',
      });
    });

    it('supports sorting by modal_price_asc', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => MOCK_MANDI_RESPONSE,
      } as Response);

      const res = await request(app).get('/api/mandi/prices?commodity=Wheat&sort=modal_price_asc');

      expect(res.status).toBe(200);
      expect(res.body.records[0].modalPrice).toBe(2300);
      expect(res.body.records[2].modalPrice).toBe(3050);
    });

    it('supports sorting by arrival_date_desc', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => MOCK_MANDI_RESPONSE,
      } as Response);

      const res = await request(app).get('/api/mandi/prices?commodity=Wheat&sort=arrival_date_desc');

      expect(res.status).toBe(200);
      expect(res.body.records[0].arrivalDate).toBe('25/10/2026');
      expect(res.body.records[2].arrivalDate).toBe('23/10/2026');
    });

    it('handles empty records cleanly without throwing errors', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ status: 'ok', total: 0, count: 0, records: [] }),
      } as Response);

      const res = await request(app).get('/api/mandi/prices?commodity=ExoticFruit');

      expect(res.status).toBe(200);
      expect(res.body.records).toEqual([]);
      expect(res.body.pagination.totalRecords).toBe(0);
    });

    it('safely parses string prices and filters out malformed non-numeric modal prices', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          status: 'ok',
          total: 2,
          records: [
            {
              state: 'Punjab',
              district: 'Ludhiana',
              market: 'Ludhiana APMC',
              commodity: 'Wheat',
              variety: 'PBW 343',
              grade: 'FAQ',
              arrival_date: '25/10/2026',
              min_price: 'invalid_price',
              max_price: null,
              modal_price: 2425,
            },
            {
              state: 'Punjab',
              district: 'Ludhiana',
              market: 'Ludhiana APMC',
              commodity: 'Wheat',
              variety: 'Broken',
              grade: 'FAQ',
              arrival_date: '25/10/2026',
              min_price: 1000,
              max_price: 2000,
              modal_price: 'not_a_number', // malformed modal price
            },
          ],
        }),
      } as Response);

      const res = await request(app).get('/api/mandi/prices?commodity=Wheat');

      expect(res.status).toBe(200);
      expect(res.body.records).toHaveLength(1);
      expect(res.body.records[0].minPrice).toBeNull(); // invalid converted to null, not 0
      expect(res.body.records[0].maxPrice).toBeNull();
      expect(res.body.records[0].modalPrice).toBe(2425);
    });

    it('caches repeated queries and returns cached=true', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => MOCK_MANDI_RESPONSE,
      } as Response);

      // First call (fetches upstream)
      const res1 = await request(app).get('/api/mandi/prices?commodity=Wheat');
      expect(res1.body.dataFreshness.cached).toBe(false);

      // Second call (hits cache)
      const res2 = await request(app).get('/api/mandi/prices?commodity=Wheat');
      expect(res2.body.dataFreshness.cached).toBe(true);
      expect(res2.body.records).toHaveLength(3);
    });

    it('validates query parameters and rejects invalid limit', async () => {
      const res = await request(app).get('/api/mandi/prices?limit=500'); // limit exceeds 100
      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
    });

    it('validates query parameters and rejects invalid page', async () => {
      const res = await request(app).get('/api/mandi/prices?page=0'); // page must be >= 1
      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
    });

    it('handles upstream 401/403 with 502 Bad Gateway and no key leakage', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      } as Response);

      const res = await request(app).get('/api/mandi/prices?commodity=Wheat');

      expect(res.status).toBe(502);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('rejected authentication');
      expect(JSON.stringify(res.body)).not.toContain(env.DATA_GOV_IN_API_KEY);
    });

    it('handles upstream 429 rate limiting with 429 status', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
      } as Response);

      const res = await request(app).get('/api/mandi/prices?commodity=Wheat');

      expect(res.status).toBe(429);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('rate limit exceeded');
    });

    it('handles upstream 500 server error with 502 Bad Gateway', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response);

      const res = await request(app).get('/api/mandi/prices?commodity=Wheat');

      expect(res.status).toBe(502);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('temporarily unavailable');
    });

    it('handles upstream request timeout with 504 Gateway Timeout', async () => {
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      vi.spyOn(global, 'fetch').mockRejectedValueOnce(abortError);

      const res = await request(app).get('/api/mandi/prices?commodity=Wheat');

      expect(res.status).toBe(504);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('timed out');
    });
  });

  // 2. GET /api/mandi/filters
  describe('GET /api/mandi/filters', () => {
    it('returns list of popular agricultural commodities and state district filters', async () => {
      const res = await request(app).get('/api/mandi/filters');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.commodities).toContain('Wheat');
      expect(res.body.commodities).toContain('Paddy(Common)');
      expect(res.body.states.length).toBeGreaterThan(10);

      const mp = res.body.states.find((s: { state: string }) => s.state === 'Madhya Pradesh');
      expect(mp).toBeDefined();
      expect(mp.districts).toContain('Sidhi');
      expect(mp.districts).toContain('Hoshangabad');
    });

    it('filters districts by specific state when requested', async () => {
      const res = await request(app).get('/api/mandi/filters?state=Andhra%20Pradesh');

      expect(res.status).toBe(200);
      expect(res.body.states).toHaveLength(1);
      expect(res.body.states[0].state).toBe('Andhra Pradesh');
      expect(res.body.states[0].districts).toContain('Prakasam');
    });
  });

  // 3. GET /api/mandi/trends
  describe('GET /api/mandi/trends', () => {
    it('returns truthful unavailable status and architectural explanation for single-day feed', async () => {
      const res = await request(app).get('/api/mandi/trends');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.available).toBe(false);
      expect(res.body.message).toContain('unavailable');
      expect(res.body.reason).toContain('9ef84268-d588-465a-a308-a864a43d0070');
      expect(res.body.recommendations).toBeDefined();
    });
  });
});
