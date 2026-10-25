import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

describe('Validation Infrastructure', () => {
  it('accepts valid query parameters validated by Zod', async () => {
    const res = await request(app).get('/api/health?verbose=true');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('rejects invalid query parameters with 400 Bad Request', async () => {
    const res = await request(app).get('/api/health?verbose=invalid_choice');

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toBe('Validation failed');
    expect(Array.isArray(res.body.errors)).toBe(true);
  });
});
