import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { env } from '../src/config/env';
import { prisma } from '../src/lib/prisma';
import { hashPassword } from '../src/services/auth.service';
import { DEMO_EMAIL, seedDemoIfEmpty } from '../src/services/demoSeed.service';

const PASSWORD = 'Demo-seed-test-pass-1';

// Test files run one after another against one disposable database, so starting from an
// empty accounts table here cannot disturb another file's records.
beforeAll(async () => { await prisma.user.deleteMany(); });
afterAll(async () => { await prisma.user.deleteMany({ where: { email: DEMO_EMAIL } }); });

describe('demo data for an empty database', () => {
  it('adds one demo farmer with farms, cycles, tasks and activities', async () => {
    expect(await seedDemoIfEmpty(prisma, PASSWORD)).toEqual({ seeded: true });

    const user = await prisma.user.findUniqueOrThrow({ where: { email: DEMO_EMAIL } });
    expect(user).toMatchObject({ name: 'Demo Farmer', role: 'user', isActive: true, mfaEnabled: false });
    expect(user.passwordHash).not.toContain(PASSWORD);

    expect(await prisma.farm.count({ where: { userId: user.id } })).toBe(3);
    const farmIds = (await prisma.farm.findMany({ where: { userId: user.id }, select: { id: true } })).map((f) => f.id);
    expect(await prisma.cropCycle.count({ where: { farmId: { in: farmIds } } })).toBe(4);
    expect(await prisma.farmActivity.count({ where: { farmId: { in: farmIds } } })).toBe(6);

    const tasks = await prisma.farmTask.findMany({ where: { farmId: { in: farmIds } } });
    expect(tasks).toHaveLength(8);
    expect(tasks.filter((t) => t.status === 'completed')).toHaveLength(1);
    const today = new Date().toLocaleDateString('en-CA', { timeZone: env.APP_TIMEZONE });
    expect(tasks.filter((t) => t.status === 'pending' && t.dueDate < today).length).toBeGreaterThanOrEqual(2);
  });

  it('lets a visitor sign in with the demo account and see the sample farms', async () => {
    // The seeded account uses a known password, so replace the hash to match this test's value.
    await prisma.user.update({ where: { email: DEMO_EMAIL }, data: { passwordHash: await hashPassword(PASSWORD) } });
    const login = await request(app).post('/api/auth/login').set('Origin', env.FRONTEND_ORIGIN).send({ email: DEMO_EMAIL, password: PASSWORD });
    expect(login.status).toBe(200);
    const cookie = ([] as string[]).concat(login.headers['set-cookie'] ?? []).find((c) => c.startsWith('profarm_sid='))!.split(';')[0];

    const farms = await request(app).get('/api/farms').set('Cookie', cookie);
    expect(farms.body.farms.map((f: { name: string }) => f.name).sort()).toEqual(['Canal-side Paddy Plot', 'Dakha Wheat Block', 'Mustard Strip']);
    const overview = await request(app).get('/api/farms/overview').set('Cookie', cookie);
    expect(overview.body.data.overdueTasksCount).toBeGreaterThanOrEqual(2);
  });

  it('does nothing when accounts already exist, so real data is never touched', async () => {
    const before = { users: await prisma.user.count(), farms: await prisma.farm.count() };
    expect(await seedDemoIfEmpty(prisma, PASSWORD)).toEqual({ seeded: false });
    expect({ users: await prisma.user.count(), farms: await prisma.farm.count() }).toEqual(before);
  });

  it('adds nothing next to a different existing account', async () => {
    await prisma.user.deleteMany();
    const other = await prisma.user.create({ data: { name: 'Real Farmer', email: 'real.farmer@example.com', passwordHash: await hashPassword(PASSWORD) } });
    expect(await seedDemoIfEmpty(prisma, PASSWORD)).toEqual({ seeded: false });
    expect(await prisma.user.count()).toBe(1);
    await prisma.user.delete({ where: { id: other.id } });
  });
});
