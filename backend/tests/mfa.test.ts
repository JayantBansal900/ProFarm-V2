import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';
import { env } from '../src/config/env';
import { base32Decode, base32Encode, timeStep, totpAt, verifyTotp } from '../src/lib/totp';
import { openSecret, sealSecret } from '../src/lib/secretBox';

const PASSWORD = 'Two-step test password 42';
const createdEmails: string[] = [];
let now = Date.UTC(2026, 10, 25, 6, 0, 0);

const post = (url: string, body: object, cookie?: string) => {
  const req = request(app).post(url).set('Origin', env.FRONTEND_ORIGIN);
  if (cookie) req.set('Cookie', cookie);
  return req.send(body);
};
const sessionCookie = (res: request.Response) =>
  ([] as string[]).concat(res.headers['set-cookie'] ?? []).find((c) => c.startsWith('profarm_sid='))?.split(';')[0];
/** Move to the next 30-second window so a fresh, unused code exists. */
const nextWindow = () => { now += 30_000; vi.setSystemTime(now); };

async function registerUser() {
  const email = `${randomUUID()}@example.com`;
  createdEmails.push(email);
  const res = await post('/api/auth/register', { name: 'Two Step Farmer', email, password: PASSWORD });
  expect(res.status).toBe(201);
  return { email, cookie: sessionCookie(res)!, id: res.body.user.id as string };
}

async function registerWithMfa() {
  const user = await registerUser();
  const setup = await post('/api/auth/mfa/setup', {}, user.cookie);
  expect(setup.status).toBe(200);
  const secret = setup.body.secret as string;
  const enabled = await post('/api/auth/mfa/enable', { code: totpAt(secret, timeStep()) }, user.cookie);
  expect(enabled.status).toBe(200);
  nextWindow();
  return { ...user, secret, backupCodes: enabled.body.backupCodes as string[] };
}

async function startLogin(email: string) {
  const res = await post('/api/auth/login', { email, password: PASSWORD });
  expect(res.status).toBe(200);
  return res;
}

beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(now); });
afterEach(() => { vi.useRealTimers(); });
afterAll(async () => { await prisma.user.deleteMany({ where: { email: { in: createdEmails } } }); });

describe('TOTP primitives', () => {
  // RFC 6238 Appendix B (SHA-1 seed "12345678901234567890"), last 6 of the 8-digit values.
  const seed = base32Encode(Buffer.from('12345678901234567890'));
  it.each([[59, '287082'], [1111111109, '081804'], [1234567890, '005924'], [2000000000, '279037']])(
    'matches the RFC 6238 vector at T=%i', (seconds, code) => {
      expect(totpAt(seed, Math.floor(seconds / 30))).toBe(code);
    });

  it('round-trips base32 and rejects replayed or malformed codes', () => {
    expect(base32Decode(seed).toString()).toBe('12345678901234567890');
    const step = timeStep(now);
    expect(verifyTotp(seed, totpAt(seed, step), { nowMs: now })).toBe(step);
    expect(verifyTotp(seed, totpAt(seed, step - 1), { nowMs: now })).toBe(step - 1);
    expect(verifyTotp(seed, totpAt(seed, step - 2), { nowMs: now })).toBeNull();
    expect(verifyTotp(seed, totpAt(seed, step), { nowMs: now, lastUsedStep: step })).toBeNull();
    expect(verifyTotp(seed, '12a456', { nowMs: now })).toBeNull();
  });

  it('encrypts secrets with authenticated encryption', () => {
    const sealed = sealSecret('JBSWY3DPEHPK3PXP');
    expect(sealed).not.toContain('JBSWY3DPEHPK3PXP');
    expect(openSecret(sealed)).toBe('JBSWY3DPEHPK3PXP');
    const [v, iv, tag, data] = sealed.split('.');
    const tampered = [v, iv, tag, data.slice(0, -2) + (data.endsWith('A') ? 'BB' : 'AA')].join('.');
    expect(() => openSecret(tampered)).toThrow();
  });
});

describe('two-step verification setup', () => {
  it('requires a signed-in user', async () => {
    expect((await post('/api/auth/mfa/setup', {})).status).toBe(401);
    expect((await request(app).get('/api/auth/mfa')).status).toBe(401);
  });

  it('enables only after a correct code, stores the secret encrypted and issues 10 backup codes', async () => {
    const user = await registerUser();
    const setup = await post('/api/auth/mfa/setup', {}, user.cookie);
    expect(setup.headers['cache-control']).toBe('no-store');
    expect(setup.body.otpauthUri).toMatch(/^otpauth:\/\/totp\/ProFarm%3A.+\?secret=[A-Z2-7]+&issuer=ProFarm/);

    expect((await post('/api/auth/mfa/enable', { code: '000000' }, user.cookie)).status).toBe(400);
    const enabled = await post('/api/auth/mfa/enable', { code: totpAt(setup.body.secret, timeStep()) }, user.cookie);
    expect(enabled.status).toBe(200);
    expect(enabled.body.backupCodes).toHaveLength(10);
    expect(new Set(enabled.body.backupCodes).size).toBe(10);
    enabled.body.backupCodes.forEach((code: string) => expect(code).toMatch(/^[a-z2-9]{5}-[a-z2-9]{5}$/));

    const stored = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(stored.mfaEnabled).toBe(true);
    expect(stored.mfaPendingSecret).toBeNull();
    expect(stored.mfaSecret).not.toContain(setup.body.secret);
    expect(openSecret(stored.mfaSecret!)).toBe(setup.body.secret);
    const codes = await prisma.mfaBackupCode.findMany({ where: { userId: user.id } });
    expect(codes.some((c) => enabled.body.backupCodes.includes(c.codeHash))).toBe(false);

    const status = await request(app).get('/api/auth/mfa').set('Cookie', user.cookie);
    expect(status.body.mfa).toMatchObject({ enabled: true, backupCodesRemaining: 10 });
    expect((await post('/api/auth/mfa/setup', {}, user.cookie)).status).toBe(409);
  });
});

describe('sign-in with two-step verification', () => {
  it('withholds the session until a valid code is given', async () => {
    const user = await registerWithMfa();
    const first = await startLogin(user.email);
    expect(first.body).toMatchObject({ status: 'mfa_required', mfaRequired: true });
    expect(first.body.challengeToken).toMatch(/^[a-f0-9]{64}$/);
    expect(first.body.user).toBeUndefined();
    expect(sessionCookie(first)).toBeUndefined();

    const wrong = await post('/api/auth/login/mfa', { challengeToken: first.body.challengeToken, code: '000000' });
    expect(wrong.status).toBe(400);
    expect(sessionCookie(wrong)).toBeUndefined();

    const ok = await post('/api/auth/login/mfa', { challengeToken: first.body.challengeToken, code: totpAt(user.secret, timeStep()) });
    expect(ok.status).toBe(200);
    expect(ok.body.user).toMatchObject({ id: user.id, email: user.email });
    const cookie = sessionCookie(ok)!;
    expect((await request(app).get('/api/auth/me').set('Cookie', cookie)).status).toBe(200);

    // The challenge is single use.
    const reuse = await post('/api/auth/login/mfa', { challengeToken: first.body.challengeToken, code: totpAt(user.secret, timeStep()) });
    expect(reuse.status).toBe(401);
  });

  it('rejects a replayed authenticator code', async () => {
    const user = await registerWithMfa();
    const code = totpAt(user.secret, timeStep());
    const a = await startLogin(user.email);
    expect((await post('/api/auth/login/mfa', { challengeToken: a.body.challengeToken, code })).status).toBe(200);
    const b = await startLogin(user.email);
    expect((await post('/api/auth/login/mfa', { challengeToken: b.body.challengeToken, code })).status).toBe(400);
  });

  it('accepts each backup code exactly once, with or without the dash', async () => {
    const user = await registerWithMfa();
    const [code] = user.backupCodes;
    const a = await startLogin(user.email);
    expect((await post('/api/auth/login/mfa', { challengeToken: a.body.challengeToken, code: code.replace('-', '').toUpperCase() })).status).toBe(200);
    const b = await startLogin(user.email);
    expect((await post('/api/auth/login/mfa', { challengeToken: b.body.challengeToken, code })).status).toBe(400);
    const status = await request(app).get('/api/auth/mfa').set('Cookie', user.cookie);
    expect(status.body.mfa.backupCodesRemaining).toBe(9);
  });

  it('locks a challenge after 5 wrong codes', async () => {
    const user = await registerWithMfa();
    const { body } = await startLogin(user.email);
    for (let i = 0; i < 4; i++) {
      expect((await post('/api/auth/login/mfa', { challengeToken: body.challengeToken, code: '000000' })).status).toBe(400);
    }
    expect((await post('/api/auth/login/mfa', { challengeToken: body.challengeToken, code: '000000' })).status).toBe(401);
    const good = await post('/api/auth/login/mfa', { challengeToken: body.challengeToken, code: totpAt(user.secret, timeStep()) });
    expect(good.status).toBe(401);
  });

  it('expires a challenge after 5 minutes', async () => {
    const user = await registerWithMfa();
    const { body } = await startLogin(user.email);
    now += 5 * 60_000 + 1; vi.setSystemTime(now);
    const res = await post('/api/auth/login/mfa', { challengeToken: body.challengeToken, code: totpAt(user.secret, timeStep()) });
    expect(res.status).toBe(401);
  });

  it('still rejects a wrong password without revealing MFA state', async () => {
    const user = await registerWithMfa();
    const res = await post('/api/auth/login', { email: user.email, password: 'not the password' });
    expect(res.status).toBe(401);
    expect(res.body.challengeToken).toBeUndefined();
  });

  it('validates the second-step request body', async () => {
    expect((await post('/api/auth/login/mfa', { challengeToken: 'short', code: '123456' })).status).toBe(400);
    expect((await post('/api/auth/login/mfa', { challengeToken: 'a'.repeat(64), code: '1' })).status).toBe(400);
    expect((await post('/api/auth/login/mfa', { challengeToken: 'a'.repeat(64), code: '123456' })).status).toBe(401);
  });
});

describe('managing two-step verification', () => {
  it('regenerates backup codes only with a valid code, invalidating the old ones', async () => {
    const user = await registerWithMfa();
    expect((await post('/api/auth/mfa/backup-codes', { code: '000000' }, user.cookie)).status).toBe(400);
    const res = await post('/api/auth/mfa/backup-codes', { code: totpAt(user.secret, timeStep()) }, user.cookie);
    expect(res.status).toBe(200);
    expect(res.body.backupCodes).toHaveLength(10);
    const { body } = await startLogin(user.email);
    expect((await post('/api/auth/login/mfa', { challengeToken: body.challengeToken, code: user.backupCodes[0] })).status).toBe(400);
  });

  it('turns off only with the password and a valid code, then signs in with password alone', async () => {
    const user = await registerWithMfa();
    expect((await post('/api/auth/mfa/disable', { password: 'wrong', code: totpAt(user.secret, timeStep()) }, user.cookie)).status).toBe(400);
    expect((await post('/api/auth/mfa/disable', { password: PASSWORD, code: '000000' }, user.cookie)).status).toBe(400);
    nextWindow();
    expect((await post('/api/auth/mfa/disable', { password: PASSWORD, code: totpAt(user.secret, timeStep()) }, user.cookie)).status).toBe(200);

    const stored = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(stored).toMatchObject({ mfaEnabled: false, mfaSecret: null, mfaLastUsedStep: null });
    expect(await prisma.mfaBackupCode.count({ where: { userId: user.id } })).toBe(0);

    const login = await startLogin(user.email);
    expect(login.body.status).toBe('success');
    expect(sessionCookie(login)).toBeDefined();
  });
});
