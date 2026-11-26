import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { advisorCacheManager } from '../src/services/advisor.service';
import { weatherCacheManager } from '../src/services/weather.service';
import { env } from '../src/config/env';

const TEST_ORIGIN = env.FRONTEND_ORIGIN || 'http://localhost:5173';

const MOCK_WEATHER_API_RESPONSE = {
  latitude: 28.61,
  longitude: 77.23,
  elevation: 216.0,
  timezone: 'Asia/Kolkata',
  current: {
    time: '2026-10-26T12:00',
    temperature_2m: 32.0,
    relative_humidity_2m: 60,
    apparent_temperature: 34.5,
    precipitation: 0.0,
    weather_code: 1,
    cloud_cover: 20,
    wind_speed_10m: 14.0,
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
    weather_code: [1, 61, 80, 0, 1, 2, 3],
    temperature_2m_max: [33.0, 31.0, 29.0, 32.0, 33.0, 34.0, 32.0],
    temperature_2m_min: [22.0, 21.0, 20.0, 21.0, 22.0, 23.0, 22.0],
    precipitation_sum: [0.0, 22.5, 12.0, 0.0, 0.0, 0.0, 0.0],
    precipitation_probability_max: [10, 85, 65, 10, 5, 5, 15],
    wind_speed_10m_max: [14.0, 32.0, 20.0, 12.0, 10.0, 9.0, 8.0],
  },
};

describe('Sustainable Farming Advisor API', () => {
  beforeEach(() => {
    advisorCacheManager.clear();
    weatherCacheManager.clearAll();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET /api/advisor/crops', () => {
    it('returns a list of 12 curated agricultural crops', async () => {
      const res = await request(app).get('/api/advisor/crops');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.count).toBe(12);
      expect(Array.isArray(res.body.crops)).toBe(true);

      const wheat = res.body.crops.find((c: any) => c.id === 'crop-wheat');
      expect(wheat).toBeDefined();
      expect(wheat.name).toBe('Wheat');
      expect(wheat.category).toBe('Cereal & Grain');
      expect(wheat.waterLevel).toBe('Moderate');
    });
  });

  describe('GET /api/advisor/soils', () => {
    it('returns a list of 6 curated agricultural soils', async () => {
      const res = await request(app).get('/api/advisor/soils');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.count).toBe(6);
      expect(Array.isArray(res.body.soils)).toBe(true);

      const loam = res.body.soils.find((s: any) => s.id === 'soil-loam');
      expect(loam).toBeDefined();
      expect(loam.name).toBe('Loamy Soil');
      expect(loam.drainage).toContain('Well-Drained');
    });
  });

  describe('POST /api/advisor/recommendations', () => {
    it('rejects requests with missing Origin header due to CSRF protection', async () => {
      const res = await request(app)
        .post('/api/advisor/recommendations')
        .send({ cropId: 'crop-wheat' });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Forbidden');
    });

    it('provides crop-only recommendations when soil and weather are omitted', async () => {
      const res = await request(app)
        .post('/api/advisor/recommendations')
        .set('Origin', TEST_ORIGIN)
        .send({ cropId: 'crop-wheat' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toBeDefined();

      const { crop, soil, weatherSummary, recommendations, summary, disclaimer } = res.body.data;

      expect(crop.id).toBe('crop-wheat');
      expect(crop.name).toBe('Wheat');
      expect(soil).toBeNull();
      expect(weatherSummary).toBeNull();
      expect(summary.soilIncluded).toBe(false);
      expect(summary.weatherIncluded).toBe(false);
      expect(recommendations.cropCare.length).toBeGreaterThan(0);
      expect(recommendations.waterManagement.length).toBeGreaterThan(0);
      expect(recommendations.sustainablePractices.length).toBeGreaterThan(0);
      expect(recommendations.soilHealth).toHaveLength(0);
      expect(recommendations.weatherConsiderations).toHaveLength(0);
      expect(disclaimer).toContain('educational decision-support');
    });

    it('evaluates soil compatibility when a compatible soil is provided', async () => {
      const res = await request(app)
        .post('/api/advisor/recommendations')
        .set('Origin', TEST_ORIGIN)
        .send({ cropId: 'crop-wheat', soilId: 'soil-loam' });

      expect(res.status).toBe(200);
      const { soil, compatibility, recommendations, summary } = res.body.data;

      expect(soil).toBeDefined();
      expect(soil.name).toBe('Loamy Soil');
      expect(summary.soilIncluded).toBe(true);
      expect(compatibility).toBeDefined();
      expect(compatibility.isCompatible).toBe(true);
      expect(compatibility.status).toBe('recommended');
      expect(compatibility.headline).toContain('Highly Suitable');
      expect(recommendations.soilHealth.length).toBeGreaterThan(0);
    });

    it('flags challenging soil-crop combinations with mitigation advice', async () => {
      const res = await request(app)
        .post('/api/advisor/recommendations')
        .set('Origin', TEST_ORIGIN)
        .send({ cropId: 'crop-rice', soilId: 'soil-sandy' });

      expect(res.status).toBe(200);
      const { compatibility } = res.body.data;

      expect(compatibility).toBeDefined();
      expect(compatibility.isCompatible).toBe(false);
      expect(compatibility.status).toBe('challenging');
      expect(compatibility.reason).toContain('diverge significantly');
    });

    it('integrates live weather intelligence when location coordinates are provided', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
        return {
          ok: true,
          status: 200,
          json: async () => MOCK_WEATHER_API_RESPONSE,
        } as unknown as Response;
      });

      const res = await request(app)
        .post('/api/advisor/recommendations')
        .set('Origin', TEST_ORIGIN)
        .send({
          cropId: 'crop-wheat',
          soilId: 'soil-loam',
          location: {
            latitude: 28.61,
            longitude: 77.23,
            locationName: 'New Delhi',
          },
        });

      expect(res.status).toBe(200);
      const { weatherSummary, recommendations, summary } = res.body.data;

      expect(summary.weatherIncluded).toBe(true);
      expect(weatherSummary).toBeDefined();
      expect(weatherSummary.locationName).toBe('New Delhi');
      expect(weatherSummary.temperatureC).toBe(32);
      expect(weatherSummary.sevenDayTotalRainMm).toBeGreaterThan(0);

      // Rainfall alert and wind alert recommendations
      expect(recommendations.weatherConsiderations.length).toBeGreaterThan(0);
      const heavyRainRec = recommendations.waterManagement.find(
        (r: any) => r.id === 'water-forecast-rain-crop-wheat'
      );
      expect(heavyRainRec).toBeDefined();
      expect(heavyRainRec.title).toContain('Rainfall Precaution');
    });

    it('gracefully degrades and produces recommendations if weather service fails', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Open-Meteo connection timeout'));

      const res = await request(app)
        .post('/api/advisor/recommendations')
        .set('Origin', TEST_ORIGIN)
        .send({
          cropId: 'crop-wheat',
          location: {
            latitude: 28.61,
            longitude: 77.23,
            locationName: 'New Delhi',
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      const { crop, weatherSummary, recommendations, summary } = res.body.data;

      expect(crop.name).toBe('Wheat');
      expect(weatherSummary).toBeNull();
      expect(summary.weatherIncluded).toBe(false);
      expect(recommendations.cropCare.length).toBeGreaterThan(0);
    });

    it('returns 400 when cropId is missing or empty', async () => {
      const res = await request(app)
        .post('/api/advisor/recommendations')
        .set('Origin', TEST_ORIGIN)
        .send({ cropId: '   ' });

      expect(res.status).toBe(400);
    });

    it('returns 404 when cropId does not exist in curated dataset', async () => {
      const res = await request(app)
        .post('/api/advisor/recommendations')
        .set('Origin', TEST_ORIGIN)
        .send({ cropId: 'crop-dragonfruit-nonexistent' });

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('not found in curated knowledge base');
    });

    it('returns 404 when soilId does not exist in curated dataset', async () => {
      const res = await request(app)
        .post('/api/advisor/recommendations')
        .set('Origin', TEST_ORIGIN)
        .send({ cropId: 'crop-wheat', soilId: 'soil-lunar-regolith' });

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('not found in curated knowledge base');
    });

    it('returns 400 when invalid geographic coordinates are provided', async () => {
      const res = await request(app)
        .post('/api/advisor/recommendations')
        .set('Origin', TEST_ORIGIN)
        .send({
          cropId: 'crop-wheat',
          location: {
            latitude: 145.0, // Invalid latitude
            longitude: 77.23,
          },
        });

      expect(res.status).toBe(400);
    });

    it('ensures all recommendations satisfy explainability and citation standards', async () => {
      const res = await request(app)
        .post('/api/advisor/recommendations')
        .set('Origin', TEST_ORIGIN)
        .send({ cropId: 'crop-wheat', soilId: 'soil-loam' });

      expect(res.status).toBe(200);
      const recs = [
        ...res.body.data.recommendations.cropCare,
        ...res.body.data.recommendations.soilHealth,
        ...res.body.data.recommendations.waterManagement,
        ...res.body.data.recommendations.sustainablePractices,
      ];

      expect(recs.length).toBeGreaterThan(4);

      for (const rec of recs) {
        expect(rec.id).toBeDefined();
        expect(typeof rec.id).toBe('string');
        expect(rec.title).toBeTruthy();
        expect(rec.explanation).toBeTruthy();
        expect(rec.whyThisApplies).toBeTruthy();
        expect(Array.isArray(rec.evidence)).toBe(true);
        expect(rec.evidence.length).toBeGreaterThan(0);
        expect(rec.limitations).toBeTruthy();
        expect(rec.source).toBeDefined();
        expect(rec.source.name).toBeTruthy();
      }
    });

    it('serves cached response on consecutive requests', async () => {
      const res1 = await request(app)
        .post('/api/advisor/recommendations')
        .set('Origin', TEST_ORIGIN)
        .send({ cropId: 'crop-wheat' });

      const res2 = await request(app)
        .post('/api/advisor/recommendations')
        .set('Origin', TEST_ORIGIN)
        .send({ cropId: 'crop-wheat' });

      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);
      expect(res1.body.data.generatedAt).toBe(res2.body.data.generatedAt);
    });
  });
});
