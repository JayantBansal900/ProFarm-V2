import { afterAll, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';
import { createSession, hashPassword } from '../src/services/auth.service';
import { env } from '../src/config/env';

// Scoped disposable fixtures; never deletes another suite's records.
export function farmFixture() {
  const f = { ownerId: '', otherId: '', cookie: '', otherCookie: '', farmId: '', secondId: '', foreignId: '', archivedId: '' };
  beforeAll(async () => {
    const passwordHash = await hashPassword('Phase 3 disposable fixture password!');
    const owner = await prisma.user.create({ data: { name: 'Phase Three Owner', email: `${randomUUID()}@example.com`, passwordHash } });
    f.ownerId = owner.id;
    const other = await prisma.user.create({ data: { name: 'Phase Three Other', email: `${randomUUID()}@example.com`, passwordHash } });
    f.otherId = other.id;
    f.cookie = `profarm_sid=${await createSession(owner.id, prisma)}`;
    f.otherCookie = `profarm_sid=${await createSession(other.id, prisma)}`;
  });
  beforeEach(async () => {
    await prisma.farm.deleteMany({ where: { userId: { in: [f.ownerId, f.otherId] } } });
    f.farmId = (await prisma.farm.create({ data: { userId: f.ownerId, name: 'Primary farm' } })).id;
    f.secondId = (await prisma.farm.create({ data: { userId: f.ownerId, name: 'Second farm' } })).id;
    f.archivedId = (await prisma.farm.create({ data: { userId: f.ownerId, name: 'Archived farm', isArchived: true } })).id;
    f.foreignId = (await prisma.farm.create({ data: { userId: f.otherId, name: 'Other user farm' } })).id;
  });
  afterAll(async () => { await prisma.user.deleteMany({ where: { id: { in: [f.ownerId, f.otherId].filter(Boolean) } } }); });
  return {
    f,
    get: (url: string, cookie?: string) => request(app).get(url).set('Cookie', cookie ?? f.cookie),
    post: (url: string, body: object, cookie?: string) => request(app).post(url).set('Cookie', cookie ?? f.cookie).set('Origin', env.FRONTEND_ORIGIN).send(body),
    patch: (url: string, body: object, cookie?: string) => request(app).patch(url).set('Cookie', cookie ?? f.cookie).set('Origin', env.FRONTEND_ORIGIN).send(body),
    remove: (url: string, cookie?: string) => request(app).delete(url).set('Cookie', cookie ?? f.cookie).set('Origin', env.FRONTEND_ORIGIN),
    cycle: (overrides: Partial<Prisma.CropCycleUncheckedCreateInput> = {}) => prisma.cropCycle.create({ data: {
      farmId: f.farmId, cropId: 'crop-wheat', cropName: 'Wheat', sowingDate: '2024-01-01', status: 'completed', ...overrides,
    } }),
    task: (overrides: Partial<Prisma.FarmTaskUncheckedCreateInput> = {}) => prisma.farmTask.create({ data: {
      farmId: f.farmId, title: 'Inspect field', category: 'general', dueDate: '2024-02-15', status: 'pending', ...overrides,
    } }),
    activity: (overrides: Partial<Prisma.FarmActivityUncheckedCreateInput> = {}) => prisma.farmActivity.create({ data: {
      farmId: f.farmId, title: 'Inspected field', category: 'general', activityDate: '2024-02-15', ...overrides,
    } }),
  };
}
