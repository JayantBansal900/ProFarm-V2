import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import express, { Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import { randomUUID } from 'node:crypto';
import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';
import { env } from '../src/config/env';
import * as authService from '../src/services/auth.service';
import { requireAuth } from '../src/middleware/requireAuth';
import { csrfProtection } from '../src/middleware/csrf';
import { errorHandler } from '../src/middleware/errorHandler';
import { createAuthRouter } from '../src/routes/auth.routes';

const origin = env.FRONTEND_ORIGIN;
const password = '  Phase1 secure password!  ';
const users: string[] = [];
let passwordHash: string;

beforeAll(async () => { passwordHash = await authService.hashPassword(password); });
afterEach(async () => {
  vi.restoreAllMocks();
  await prisma.user.deleteMany({ where: { id: { in: users.splice(0) } } });
});

function email() { return `phase1-${randomUUID()}@example.com`; }
function cookieHeaders(response: request.Response): string[] {
  const value: unknown = response.headers['set-cookie'];
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string')
    : typeof value === 'string' ? [value] : [];
}
function cookie(response: request.Response): string {
  const headers = cookieHeaders(response);
  return headers.find((value) => value.startsWith('profarm_sid='))?.split(';')[0] || '';
}
function cleared(response: request.Response): boolean {
  const headers = cookieHeaders(response);
  return headers.some((value) => value.startsWith('profarm_sid=;') && value.includes('Expires='));
}
async function fixture(storedEmail = email()) {
  const user = await prisma.user.create({ data: { name: 'Phase One Farmer', email: storedEmail, passwordHash } });
  users.push(user.id);
  const token = await authService.createSession(user.id, prisma);
  return { user, authCookie: `profarm_sid=${token}`, tokenHash: authService.hashToken(token) };
}
function unavailable(response: request.Response) {
  expect(response.status).toBe(503);
  expect(response.body).toEqual({ status: 'error', message: 'Service temporarily unavailable' });
}

describe('normalized registration and identity compatibility', () => {
  it.each(['lowercase', 'uppercase', 'mixed-case', 'whitespace'])('registers %s email in canonical form', async (variant) => {
    const canonical = email();
    const input = variant === 'uppercase' ? canonical.toUpperCase()
      : variant === 'mixed-case' ? canonical.replace('example', 'ExAmPlE')
      : variant === 'whitespace' ? ` \t${canonical}\n ` : canonical;
    const response = await request(app).post('/api/auth/register').set('Origin', origin)
      .send({ name: 'Phase One Farmer', email: input, password });
    if (response.body.user?.id) users.push(response.body.user.id);
    expect(response.status).toBe(201);
    expect(response.body.user.email).toBe(canonical);
    expect(Boolean(cookie(response))).toBe(true);
    const stored = await prisma.user.findUniqueOrThrow({ where: { id: response.body.user.id } });
    expect(await authService.verifyPassword(stored.passwordHash, password)).toBe(true);
    expect(await authService.verifyPassword(stored.passwordHash, password.trim())).toBe(false);
    const headers = cookieHeaders(response);
    expect(headers.some((value) => value.includes('HttpOnly') && value.includes('SameSite=Lax') && value.includes('Path=/'))).toBe(true);
    expect(response.body.user.passwordHash).toBeUndefined();
  });

  it.each(['/register', '/login'])('rejects invalid email at %s', async (route) => {
    const response = await request(app).post(`/api/auth${route}`).set('Origin', origin)
      .send({ name: 'Phase One Farmer', email: 'not-an-email', password });
    expect(response.status).toBe(400);
  });

  it('preserves Secure, HttpOnly and SameSite cookie flags in production mode', async () => {
    const previousMode = env.NODE_ENV;
    try {
      env.NODE_ENV = 'production';
      const response = await request(app).post('/api/auth/register').set('Origin', origin)
        .send({ name: 'Phase One Farmer', email: email(), password });
      if (response.body.user?.id) users.push(response.body.user.id);
      expect(response.status).toBe(201);
      expect(cookieHeaders(response).some((value) => value.includes('Secure') && value.includes('HttpOnly') && value.includes('SameSite=Lax'))).toBe(true);
      const logout = await request(app).post('/api/auth/logout').set('Origin', origin).set('Cookie', cookie(response));
      expect(logout.status).toBe(200);
      expect(cookieHeaders(logout).some((value) => value.includes('Secure') && value.includes('HttpOnly') && value.includes('SameSite=Lax'))).toBe(true);
    } finally { env.NODE_ENV = previousMode; }
  });

  it('rejects equivalent registration against a legacy email without rewriting it', async () => {
    const canonical = email();
    const legacy = `\t ${canonical.toUpperCase()} \u00a0`;
    const { user } = await fixture(legacy);
    const response = await request(app).post('/api/auth/register').set('Origin', origin)
      .send({ name: 'Another Farmer', email: ` ${canonical} `, password });
    expect(response.status).toBe(409);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).email).toBe(legacy);
  });

  it('rejects duplicate canonical identities after normalized registration', async () => {
    const canonical = email();
    const first = await request(app).post('/api/auth/register').set('Origin', origin)
      .send({ name: 'Phase One Farmer', email: canonical.toUpperCase(), password });
    if (first.body.user?.id) users.push(first.body.user.id);
    expect(first.status).toBe(201);
    const duplicate = await request(app).post('/api/auth/register').set('Origin', origin)
      .send({ name: 'Phase One Farmer', email: ` ${canonical} `, password });
    expect(duplicate.status).toBe(409);
  });

  it('fails closed on colliding legacy identities instead of choosing or merging accounts', async () => {
    const canonical = email();
    const first = await fixture(canonical);
    const second = await fixture(` ${canonical.toUpperCase()} `);
    const response = await request(app).post('/api/auth/login').set('Origin', origin).send({ email: canonical, password });
    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Invalid email or password');
    expect(Boolean(cookie(response))).toBe(false);
    const duplicate = await request(app).post('/api/auth/register').set('Origin', origin)
      .send({ name: 'Phase One Farmer', email: canonical, password });
    expect(duplicate.status).toBe(409);
    expect(await prisma.user.count({ where: { id: { in: [first.user.id, second.user.id] } } })).toBe(2);
  });

  it('rolls back account creation if issuing its session fails', async () => {
    const canonical = email();
    vi.spyOn(authService, 'createSession').mockRejectedValueOnce(new Error('sensitive internal database detail'));
    const response = await request(app).post('/api/auth/register').set('Origin', origin)
      .send({ name: 'Phase One Farmer', email: canonical, password });
    unavailable(response);
    expect(await prisma.user.count({ where: { email: canonical } })).toBe(0);
    expect(Boolean(cookie(response))).toBe(false);
  });

  it.each(['/register', '/login'])('sanitizes database lookup failures at %s', async (route) => {
    vi.spyOn(prisma, '$queryRaw').mockRejectedValueOnce(new Error('sensitive internal database detail'));
    const response = await request(app).post(`/api/auth${route}`).set('Origin', origin)
      .send({ name: 'Phase One Farmer', email: email(), password });
    unavailable(response);
  });
});

describe('login and session lifecycle', () => {
  it('rejects a JSON-valued session cookie without treating it as a database failure', async () => {
    const response = await request(app).get('/api/auth/me')
      .set('Cookie', 'profarm_sid=j%3A%7B%22unexpected%22%3Atrue%7D');
    expect(response.status).toBe(401);
  });
  it.each(['lowercase', 'uppercase', 'mixed-case', 'whitespace'])('logs in with equivalent %s email', async (variant) => {
    const { user } = await fixture();
    const input = variant === 'uppercase' ? user.email.toUpperCase()
      : variant === 'mixed-case' ? user.email.replace('example', 'ExAmPlE')
      : variant === 'whitespace' ? `\t ${user.email} \n` : user.email;
    const response = await request(app).post('/api/auth/login').set('Origin', origin).send({ email: input, password });
    expect(response.status).toBe(200);
    const me = await request(app).get('/api/auth/me').set('Cookie', cookie(response));
    expect(me.status).toBe(200);
    expect(me.body.user.id).toBe(user.id);
  });

  it('logs in to a unique legacy account without changing the stored email', async () => {
    const canonical = email();
    const storedEmail = `\t${canonical.toUpperCase()}\u00a0`;
    const { user } = await fixture(storedEmail);
    const response = await request(app).post('/api/auth/login').set('Origin', origin).send({ email: canonical, password });
    expect(response.status).toBe(200);
    expect(response.body.user.id).toBe(user.id);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).email).toBe(storedEmail);
  });

  it('does not trim passwords during login', async () => {
    const { user } = await fixture();
    const response = await request(app).post('/api/auth/login').set('Origin', origin)
      .send({ email: user.email, password: password.trim() });
    expect(response.status).toBe(401);
  });

  it('rejects an expired session and clears its cookie', async () => {
    const { authCookie, tokenHash } = await fixture();
    await prisma.session.update({ where: { tokenHash }, data: { expiresAt: new Date(Date.now() - 60000) } });
    const response = await request(app).get('/api/auth/me').set('Cookie', authCookie);
    expect(response.status).toBe(401);
    expect(cleared(response)).toBe(true);
    expect(await prisma.session.count({ where: { tokenHash } })).toBe(0);
  });

  it('returns a controlled error when session lookup fails', async () => {
    const lookup = vi.spyOn(authService, 'validateSession').mockRejectedValueOnce(new Error('sensitive connection detail'));
    unavailable(await request(app).get('/api/auth/me').set('Cookie', 'profarm_sid=synthetic-test-token'));
    expect(lookup).toHaveBeenCalledTimes(1);
  });

  it('returns a controlled error when login cannot create a session', async () => {
    const { user } = await fixture();
    vi.spyOn(authService, 'createSession').mockRejectedValueOnce(new Error('sensitive connection detail'));
    const response = await request(app).post('/api/auth/login').set('Origin', origin).send({ email: user.email, password });
    unavailable(response);
    expect(Boolean(cookie(response))).toBe(false);
  });
});

describe('idempotent logout and revocation failures', () => {
  it('revokes a session, clears its cookie and makes the token unusable', async () => {
    const { authCookie, tokenHash } = await fixture();
    const response = await request(app).post('/api/auth/logout').set('Origin', origin).set('Cookie', authCookie);
    expect(response.status).toBe(200);
    expect(cleared(response)).toBe(true);
    expect(await prisma.session.count({ where: { tokenHash } })).toBe(0);
    expect((await request(app).get('/api/auth/me').set('Cookie', authCookie)).status).toBe(401);
    const repeated = await request(app).post('/api/auth/logout').set('Origin', origin).set('Cookie', authCookie);
    expect(repeated.status).toBe(200);
    expect(cleared(repeated)).toBe(true);
  });
  it('accepts missing and already-deleted sessions', async () => {
    for (const authCookie of ['', 'profarm_sid=nonexistent-synthetic-token', 'profarm_sid=j%3A%7B%22unexpected%22%3Atrue%7D']) {
      const operation = request(app).post('/api/auth/logout').set('Origin', origin);
      if (authCookie) operation.set('Cookie', authCookie);
      const response = await operation;
      expect(response.status).toBe(200);
      expect(cleared(response)).toBe(true);
    }
  });
  it('clears the browser cookie but reports failed server revocation honestly', async () => {
    const { authCookie, tokenHash } = await fixture();
    vi.spyOn(authService, 'revokeSession').mockRejectedValueOnce(new Error('sensitive database detail'));
    const response = await request(app).post('/api/auth/logout').set('Origin', origin).set('Cookie', authCookie);
    unavailable(response);
    expect(cleared(response)).toBe(true);
    expect(await prisma.session.count({ where: { tokenHash } })).toBe(1);
    expect((await request(app).get('/api/auth/me').set('Cookie', authCookie)).status).toBe(200);
  });
  it.each([undefined, 'https://untrusted.example'])('preserves Origin protection for %s', async (requestOrigin) => {
    const { authCookie, tokenHash } = await fixture();
    const operation = request(app).post('/api/auth/logout').set('Cookie', authCookie);
    if (requestOrigin) operation.set('Origin', requestOrigin);
    expect((await operation).status).toBe(403);
    expect(await prisma.session.count({ where: { tokenHash } })).toBe(1);
  });
});

describe('Express 4 authentication error forwarding', () => {
  it('propagates underlying session lookup and deletion failures from the service', async () => {
    const database = {
      session: {
        findUnique: vi.fn().mockRejectedValue(new Error('simulated lookup failure')),
        deleteMany: vi.fn().mockRejectedValue(new Error('simulated deletion failure')),
      },
    } as unknown as Parameters<typeof authService.validateSession>[1];
    await expect(authService.validateSession('synthetic-token', database)).rejects.toThrow('simulated lookup failure');
    await expect(authService.revokeSession('synthetic-token', database)).rejects.toThrow('simulated deletion failure');
  });
  it.each(['throws', 'rejects'])('forwards a session lookup that %s exactly once', async (failure) => {
    const spy = vi.spyOn(authService, 'validateSession');
    if (failure === 'throws') spy.mockImplementationOnce(() => { throw new Error('internal detail'); });
    else spy.mockRejectedValueOnce(new Error('internal detail'));
    const next = vi.fn<(error?: unknown) => void>();
    await requireAuth({ cookies: { profarm_sid: 'synthetic-token' } } as unknown as Request, {} as Response, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0]).toBeInstanceOf(authService.AuthenticationUnavailableError);
  });
  it('continues once with the authenticated user context', async () => {
    const user = { id: 'fixture-user', name: 'Phase One Farmer', email: 'fixture@example.com', role: 'user' };
    vi.spyOn(authService, 'validateSession').mockResolvedValueOnce(user);
    const req = { cookies: { profarm_sid: 'synthetic-token' } } as unknown as Request;
    const next = vi.fn<(error?: unknown) => void>();
    await requireAuth(req, {} as Response, next);
    expect(req.user).toEqual(user);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
  });
});

function limitedApp() {
  const result = express();
  result.use(cookieParser(), csrfProtection, express.json());
  result.use('/api/auth', createAuthRouter({ credentialLimit: 3 }));
  result.use(errorHandler);
  return result;
}
describe('credential quota separation', () => {
  it.each(['login', 'register'])('limits excessive %s attempts', async (route) => {
    const target = limitedApp();
    for (let count = 0; count < 3; count++) {
      expect((await request(target).post(`/api/auth/${route}`).set('Origin', origin).send({})).status).toBe(400);
    }
    expect((await request(target).post(`/api/auth/${route}`).set('Origin', origin).send({})).status).toBe(429);
  });
  it('session checks and logout do not spend credential quota and work after exhaustion', async () => {
    const target = limitedApp();
    for (let count = 0; count < 5; count++) {
      expect((await request(target).get('/api/auth/me')).status).toBe(401);
      expect((await request(target).post('/api/auth/logout').set('Origin', origin)).status).toBe(200);
    }
    for (let count = 0; count < 3; count++) {
      expect((await request(target).post('/api/auth/login').set('Origin', origin).send({})).status).toBe(400);
    }
    expect((await request(target).post('/api/auth/register').set('Origin', origin).send({})).status).toBe(429);
    expect((await request(target).get('/api/auth/me')).status).toBe(401);
    expect((await request(target).post('/api/auth/logout').set('Origin', origin)).status).toBe(200);
    expect((await request(target).post('/api/auth/logout')).status).toBe(403);
  });
});
