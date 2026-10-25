import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

describe('Health Endpoints', () => {
  it('GET /api/health returns 200 with service information', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      status: 'ok',
      service: 'profarm-api',
    });
  });

  it('GET / returns 200 with root status', async () => {
    const res = await request(app).get('/');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('online');
    expect(res.body.name).toBe('ProFarm API');
  });
});
