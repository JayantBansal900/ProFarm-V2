import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createApp } from '../src/app';
import { env } from '../src/config/env';
import { createAuthRouter } from '../src/routes/auth.routes';
import { errorHandler } from '../src/middleware/errorHandler';

let site: string;
const INDEX = '<!doctype html><title>ProFarm</title><div id="root"></div>';

beforeAll(() => {
  site = fs.mkdtempSync(path.join(os.tmpdir(), 'profarm-site-'));
  fs.mkdirSync(path.join(site, 'assets'));
  fs.mkdirSync(path.join(site, 'images'));
  fs.writeFileSync(path.join(site, 'index.html'), INDEX);
  fs.writeFileSync(path.join(site, 'assets', 'index-abc123.js'), 'console.log("app")');
  fs.writeFileSync(path.join(site, 'images', 'wheat.webp'), 'not-really-an-image');
  fs.writeFileSync(path.join(site, 'favicon.svg'), '<svg xmlns="http://www.w3.org/2000/svg"/>');
});
afterAll(() => { fs.rmSync(site, { recursive: true, force: true }); });

describe('serving the built frontend from the API server', () => {
  it('serves the app at the root, never cached', async () => {
    const res = await request(createApp({ frontendDir: site })).get('/');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');
    expect(res.text).toBe(INDEX);
    expect(res.headers['cache-control']).toBe('no-cache');
  });

  it('gives deep links the app too, so refreshing /knowledge/crops/mustard works', async () => {
    const res = await request(createApp({ frontendDir: site })).get('/knowledge/crops/mustard');
    expect(res.status).toBe(200);
    expect(res.text).toBe(INDEX);
    expect(res.headers['cache-control']).toBe('no-cache');
  });

  it('caches hashed files for a year and other files for a day', async () => {
    const target = createApp({ frontendDir: site });
    const hashed = await request(target).get('/assets/index-abc123.js');
    expect(hashed.status).toBe(200);
    expect(hashed.headers['cache-control']).toBe('public, max-age=31536000, immutable');
    expect((await request(target).get('/images/wheat.webp')).headers['cache-control']).toBe('public, max-age=86400');
    expect((await request(target).get('/favicon.svg')).headers['cache-control']).toBe('public, max-age=86400');
  });

  it('answers 404 for a missing file instead of pretending it is a page', async () => {
    const res = await request(createApp({ frontendDir: site })).get('/assets/missing.js');
    expect(res.status).toBe(404);
    expect(res.text).not.toContain('<div id="root">');
  });

  it('keeps the API working and its errors as JSON', async () => {
    const target = createApp({ frontendDir: site });
    expect((await request(target).get('/api/health')).body).toMatchObject({ status: 'ok' });
    const missing = await request(target).get('/api/does-not-exist');
    expect(missing.status).toBe(404);
    expect(missing.body.status).toBe('error');
  });

  it('does not turn a POST to a page address into the app', async () => {
    const res = await request(createApp({ frontendDir: site })).post('/dashboard').set('Origin', env.FRONTEND_ORIGIN).send({});
    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
  });

  it('cannot be tricked into reading files outside the site folder', async () => {
    const res = await request(createApp({ frontendDir: site })).get('/..%2f..%2fetc%2fpasswd');
    expect(res.status).not.toBe(200);
    expect(res.text).not.toContain('root:');
  });

  it('behaves as a plain API when no frontend is built', async () => {
    const target = createApp({ frontendDir: path.join(site, 'does-not-exist') });
    expect((await request(target).get('/')).body).toMatchObject({ name: 'ProFarm API', status: 'online' });
    expect((await request(target).get('/knowledge/crops/mustard')).status).toBe(404);
  });
});

describe('behind a hosting proxy', () => {
  it('uses the configured number of trusted hops', () => {
    expect(createApp().get('trust proxy')).toBe(env.TRUST_PROXY);
  });

  /** A small app with a quota of 2 sign-in attempts, to see whose attempts are counted together. */
  const limited = (hops: number) => {
    const target = express();
    target.set('trust proxy', hops);
    target.use(cookieParser(), express.json());
    target.use('/api/auth', createAuthRouter({ credentialLimit: 2 }));
    target.use(errorHandler);
    return target;
  };
  const attempt = (target: express.Express, client: string) =>
    request(target).post('/api/auth/login').set('X-Forwarded-For', client).send({}).then((res) => res.status);

  it('counts each visitor separately once the proxy is trusted', async () => {
    const target = limited(1);
    expect([await attempt(target, '203.0.113.1'), await attempt(target, '203.0.113.1'), await attempt(target, '203.0.113.1')]).toEqual([400, 400, 429]);
    expect(await attempt(target, '203.0.113.2')).toBe(400); // a different visitor is unaffected
  });

  it('without the setting, everyone shares one quota (the problem this fixes)', async () => {
    const target = limited(0);
    await attempt(target, '203.0.113.1');
    await attempt(target, '203.0.113.1');
    expect(await attempt(target, '203.0.113.2')).toBe(429); // a stranger is blocked by someone else's attempts
  });
});
