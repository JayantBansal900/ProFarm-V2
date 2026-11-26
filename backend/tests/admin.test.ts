import { afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';
import { env } from '../src/config/env';
import { generateTotpSecret } from '../src/lib/totp';
import { sealSecret } from '../src/lib/secretBox';
import { setRoleByEmail } from '../src/services/admin.service';

const PASSWORD = 'Admin panel test password 42';
const createdEmails: string[] = [];

const get = (url: string, cookie?: string) => {
  const req = request(app).get(url);
  return cookie ? req.set('Cookie', cookie) : req;
};
const send = (method: 'post' | 'patch', url: string, body: object, cookie?: string) => {
  const req = request(app)[method](url).set('Origin', env.FRONTEND_ORIGIN);
  if (cookie) req.set('Cookie', cookie);
  return req.send(body);
};
const sessionCookie = (res: request.Response) =>
  ([] as string[]).concat(res.headers['set-cookie'] ?? []).find((c) => c.startsWith('profarm_sid='))?.split(';')[0];

/** Registers through the real API; role and MFA are set directly because sign-up can never grant them. */
async function makeUser(options: { admin?: boolean; mfa?: boolean; name?: string } = {}) {
  const email = `${randomUUID()}@example.com`;
  createdEmails.push(email);
  const res = await send('post', '/api/auth/register', { name: options.name ?? 'Test Farmer', email, password: PASSWORD });
  expect(res.status).toBe(201);
  const id = res.body.user.id as string;
  if (options.admin || options.mfa) {
    await prisma.user.update({
      where: { id },
      data: {
        role: options.admin ? 'admin' : 'user',
        mfaEnabled: Boolean(options.mfa),
        mfaSecret: options.mfa ? sealSecret(generateTotpSecret()) : null,
      },
    });
  }
  return { id, email, cookie: sessionCookie(res)! };
}
const makeAdmin = () => makeUser({ admin: true, mfa: true, name: 'Admin Person' });

afterAll(async () => { await prisma.user.deleteMany({ where: { email: { in: createdEmails } } }); });

describe('who can reach the admin API', () => {
  it('rejects signed-out visitors and ordinary farmers', async () => {
    expect((await get('/api/admin/stats')).status).toBe(401);
    const farmer = await makeUser();
    const res = await get('/api/admin/users', farmer.cookie);
    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Admin access required');
    for (const path of ['/api/admin/stats', '/api/admin/audit']) expect((await get(path, farmer.cookie)).status).toBe(403);
    expect((await send('post', `/api/admin/users/${farmer.id}/deactivate`, {}, farmer.cookie)).status).toBe(403);
  });

  it('requires an admin to have two-step verification on', async () => {
    const admin = await makeUser({ admin: true });
    const res = await get('/api/admin/stats', admin.cookie);
    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({ code: 'mfa_required' });
  });

  it('never lets sign-up choose a role, and reports the role on /me', async () => {
    const email = `${randomUUID()}@example.com`;
    createdEmails.push(email);
    const res = await send('post', '/api/auth/register', { name: 'Sneaky', email, password: PASSWORD, role: 'admin' });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('user');
    const me = await get('/api/auth/me', sessionCookie(res));
    expect(me.body.user.role).toBe('user');
  });

  it('takes admin access away immediately when the role is removed', async () => {
    const boss = await makeAdmin();
    const other = await makeAdmin();
    expect((await get('/api/admin/stats', other.cookie)).status).toBe(200);
    expect((await send('patch', `/api/admin/users/${other.id}/role`, { role: 'user' }, boss.cookie)).status).toBe(200);
    expect((await get('/api/admin/stats', other.cookie)).status).toBe(403);
  });
});

describe('admin overview and user list', () => {
  it('counts accounts and farms', async () => {
    const admin = await makeAdmin();
    const before = (await get('/api/admin/stats', admin.cookie)).body.data;
    const farmer = await makeUser();
    await prisma.farm.create({ data: { userId: farmer.id, name: 'Secret Farm Name' } });
    const after = (await get('/api/admin/stats', admin.cookie)).body.data;
    expect(after.users).toBe(before.users + 1);
    expect(after.activeUsers).toBe(before.activeUsers + 1);
    expect(after.farms).toBe(before.farms + 1);
    expect(after.newUsersLast7Days).toBe(before.newUsersLast7Days + 1);
    expect(after.admins).toBeGreaterThanOrEqual(1);
    expect(after.usersWithMfa).toBeGreaterThanOrEqual(1);
  });

  it('lists accounts with counts only, never farm details or secrets', async () => {
    const admin = await makeAdmin();
    const farmer = await makeUser({ name: 'Findable Farmer' });
    await prisma.farm.create({ data: { userId: farmer.id, name: 'Secret Farm Name', village: 'Hidden Village' } });

    const res = await get(`/api/admin/users?search=${encodeURIComponent(farmer.email.slice(0, 12))}`, admin.cookie);
    expect(res.status).toBe(200);
    expect(res.body.users).toHaveLength(1);
    expect(res.body.users[0]).toMatchObject({ id: farmer.id, email: farmer.email, role: 'user', isActive: true, mfaEnabled: false, farmCount: 1 });
    const raw = JSON.stringify(res.body);
    for (const secret of ['Secret Farm Name', 'Hidden Village', 'passwordHash', 'mfaSecret', 'tokenHash', '$argon2']) {
      expect(raw).not.toContain(secret);
    }
  });

  it('filters by role and status and paginates', async () => {
    const admin = await makeAdmin();
    const off = await makeUser();
    await send('post', `/api/admin/users/${off.id}/deactivate`, {}, admin.cookie);

    const inactive = await get('/api/admin/users?status=inactive&limit=50', admin.cookie);
    expect(inactive.body.users.map((u: { id: string }) => u.id)).toContain(off.id);
    expect(inactive.body.users.every((u: { isActive: boolean }) => !u.isActive)).toBe(true);

    const admins = await get('/api/admin/users?role=admin&limit=50', admin.cookie);
    expect(admins.body.users.every((u: { role: string }) => u.role === 'admin')).toBe(true);
    expect(admins.body.users.map((u: { id: string }) => u.id)).toContain(admin.id);

    const page = await get('/api/admin/users?page=1&limit=2', admin.cookie);
    expect(page.body.users).toHaveLength(2);
    expect(page.body.pagination).toMatchObject({ currentPage: 1, limit: 2 });
    expect(page.body.pagination.totalRecords).toBeGreaterThan(2);
    expect((await get('/api/admin/users?limit=500', admin.cookie)).status).toBe(400);
    expect((await get('/api/admin/users?role=owner', admin.cookie)).status).toBe(400);
  });
});

describe('changing roles', () => {
  it('grants and removes admin access and records both', async () => {
    const admin = await makeAdmin();
    const farmer = await makeUser();
    const granted = await send('patch', `/api/admin/users/${farmer.id}/role`, { role: 'admin' }, admin.cookie);
    expect(granted.status).toBe(200);
    expect(granted.body.data.role).toBe('admin');
    expect((await send('patch', `/api/admin/users/${farmer.id}/role`, { role: 'admin' }, admin.cookie)).status).toBe(409);
    expect((await send('patch', `/api/admin/users/${farmer.id}/role`, { role: 'user' }, admin.cookie)).status).toBe(200);

    const actions = await prisma.adminAuditEntry.findMany({ where: { targetUserId: farmer.id }, orderBy: { createdAt: 'asc' } });
    expect(actions.map((a) => a.action)).toEqual(['grant_admin', 'revoke_admin']);
    expect(actions.every((a) => a.actorId === admin.id)).toBe(true);
  });

  it('stops admins removing themselves and rejects bad requests', async () => {
    const admin = await makeAdmin();
    const own = await send('patch', `/api/admin/users/${admin.id}/role`, { role: 'user' }, admin.cookie);
    expect(own.status).toBe(400);
    expect(own.body.message).toBe('You cannot remove your own admin access.');
    expect((await send('patch', `/api/admin/users/${randomUUID()}/role`, { role: 'admin' }, admin.cookie)).status).toBe(404);
    expect((await send('patch', '/api/admin/users/not-an-id/role', { role: 'admin' }, admin.cookie)).status).toBe(400);
    expect((await send('patch', `/api/admin/users/${admin.id}/role`, { role: 'owner' }, admin.cookie)).status).toBe(400);
    expect((await send('patch', `/api/admin/users/${admin.id}/role`, { role: 'user', extra: 1 }, admin.cookie)).status).toBe(400);
  });

  it('will not make a turned-off account an admin', async () => {
    const admin = await makeAdmin();
    const farmer = await makeUser();
    await send('post', `/api/admin/users/${farmer.id}/deactivate`, {}, admin.cookie);
    expect((await send('patch', `/api/admin/users/${farmer.id}/role`, { role: 'admin' }, admin.cookie)).status).toBe(409);
  });
});

describe('turning accounts off and on', () => {
  it('signs the person out at once and blocks sign-in, but only after the right password', async () => {
    const admin = await makeAdmin();
    const farmer = await makeUser();
    expect((await get('/api/auth/me', farmer.cookie)).status).toBe(200);

    const off = await send('post', `/api/admin/users/${farmer.id}/deactivate`, {}, admin.cookie);
    expect(off.status).toBe(200);
    expect(off.body.data.isActive).toBe(false);
    expect((await get('/api/auth/me', farmer.cookie)).status).toBe(401);
    expect(await prisma.session.count({ where: { userId: farmer.id } })).toBe(0);

    const blocked = await send('post', '/api/auth/login', { email: farmer.email, password: PASSWORD });
    expect(blocked.status).toBe(403);
    expect(blocked.body.message).toContain('turned off');
    expect(sessionCookie(blocked)).toBeUndefined();
    const wrong = await send('post', '/api/auth/login', { email: farmer.email, password: 'not the password' });
    expect(wrong.status).toBe(401);
    expect(wrong.body.message).toBe('Invalid email or password');

    expect((await send('post', `/api/admin/users/${farmer.id}/deactivate`, {}, admin.cookie)).status).toBe(409);
    expect((await send('post', `/api/admin/users/${farmer.id}/reactivate`, {}, admin.cookie)).status).toBe(200);
    const back = await send('post', '/api/auth/login', { email: farmer.email, password: PASSWORD });
    expect(back.status).toBe(200);
    expect(back.body.user.role).toBe('user');
  });

  it('records the last sign-in time', async () => {
    const farmer = await makeUser();
    expect((await prisma.user.findUniqueOrThrow({ where: { id: farmer.id } })).lastLoginAt).toBeNull();
    await send('post', '/api/auth/login', { email: farmer.email, password: PASSWORD });
    expect((await prisma.user.findUniqueOrThrow({ where: { id: farmer.id } })).lastLoginAt).toBeInstanceOf(Date);
  });

  it('will not let an admin turn off their own account', async () => {
    const admin = await makeAdmin();
    const res = await send('post', `/api/admin/users/${admin.id}/deactivate`, {}, admin.cookie);
    expect(res.status).toBe(400);
    expect((await get('/api/admin/stats', admin.cookie)).status).toBe(200);
  });
});

describe('resetting lost two-step verification', () => {
  it('clears the farmer’s two-step setup so password sign-in works again', async () => {
    const admin = await makeAdmin();
    const farmer = await makeUser({ mfa: true });
    await prisma.mfaBackupCode.create({ data: { userId: farmer.id, codeHash: randomUUID() } });
    const stale = await send('post', '/api/auth/login', { email: farmer.email, password: PASSWORD });
    expect(stale.body.status).toBe('mfa_required');

    const reset = await send('post', `/api/admin/users/${farmer.id}/reset-mfa`, {}, admin.cookie);
    expect(reset.status).toBe(200);
    expect(reset.body.data.mfaEnabled).toBe(false);
    const stored = await prisma.user.findUniqueOrThrow({ where: { id: farmer.id } });
    expect(stored).toMatchObject({ mfaEnabled: false, mfaSecret: null });
    expect(await prisma.mfaBackupCode.count({ where: { userId: farmer.id } })).toBe(0);
    expect(await prisma.mfaChallenge.count({ where: { userId: farmer.id } })).toBe(0);

    const login = await send('post', '/api/auth/login', { email: farmer.email, password: PASSWORD });
    expect(login.body.status).toBe('success');
    expect((await send('post', `/api/admin/users/${farmer.id}/reset-mfa`, {}, admin.cookie)).status).toBe(409);
  });

  it('is not available on your own account', async () => {
    const admin = await makeAdmin();
    expect((await send('post', `/api/admin/users/${admin.id}/reset-mfa`, {}, admin.cookie)).status).toBe(400);
  });
});

describe('audit log', () => {
  it('lists every admin action, newest first, with who did what', async () => {
    const admin = await makeAdmin();
    const farmer = await makeUser({ name: 'Audited Farmer' });
    await send('post', `/api/admin/users/${farmer.id}/deactivate`, {}, admin.cookie);
    await send('post', `/api/admin/users/${farmer.id}/reactivate`, {}, admin.cookie);

    const res = await get('/api/admin/audit?limit=50', admin.cookie);
    expect(res.status).toBe(200);
    const mine = res.body.entries.filter((e: { target: { email: string } | null }) => e.target?.email === farmer.email);
    expect(mine.map((e: { action: string }) => e.action)).toEqual(['reactivate', 'deactivate']);
    expect(mine[0].actor).toEqual({ name: 'Admin Person', email: admin.email });
    expect(res.body.pagination.totalRecords).toBeGreaterThanOrEqual(2);
    expect(JSON.stringify(res.body)).not.toContain('passwordHash');
  });
});

describe('command-line admin bootstrap', () => {
  it('grants and revokes by email, reporting no-ops and unknown accounts', async () => {
    const farmer = await makeUser();
    expect(await setRoleByEmail(` ${farmer.email.toUpperCase()} `, 'admin')).toBe('changed');
    expect((await prisma.user.findUniqueOrThrow({ where: { id: farmer.id } })).role).toBe('admin');
    expect(await setRoleByEmail(farmer.email, 'admin')).toBe('unchanged');
    expect(await setRoleByEmail('nobody@example.com', 'admin')).toBe('not_found');
    expect(await setRoleByEmail(farmer.email, 'user')).toBe('changed');

    const entries = await prisma.adminAuditEntry.findMany({ where: { targetUserId: farmer.id }, orderBy: { createdAt: 'asc' } });
    expect(entries.map((e) => [e.action, e.actorId, e.detail])).toEqual([
      ['grant_admin', null, 'command line'],
      ['revoke_admin', null, 'command line'],
    ]);
  });
});
