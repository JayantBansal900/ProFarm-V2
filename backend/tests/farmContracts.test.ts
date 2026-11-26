import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';
import { env } from '../src/config/env';
import { createSession, hashPassword } from '../src/services/auth.service';
import { createCropCycle, updateCropCycle } from '../src/services/farm.service';
import type { CreateCropCycleInput, CreateCropCycleRequest, UpdateCropCycleRequest } from '../src/validators/farm.validator';

const origin = env.FRONTEND_ORIGIN;
const userIds: string[] = [];
let ownerId: string;
let ownerCookie: string;
let otherCookie: string;
let farmId: string;
let secondFarmId: string;
let foreignFarmId: string;

const validCreate: CreateCropCycleRequest = {
  cropId: 'crop-wheat', sowingDate: '2026-06-10', expectedHarvestDate: '2026-09-20',
};

beforeAll(async () => {
  const passwordHash = await hashPassword('Disposable farm test password!');
  const owner = await prisma.user.create({ data: { name: 'Cycle Owner', email: `phase2-${randomUUID()}@example.com`, passwordHash } });
  userIds.push(owner.id);
  ownerId = owner.id;
  const other = await prisma.user.create({ data: { name: 'Other Owner', email: `phase2-${randomUUID()}@example.com`, passwordHash } });
  userIds.push(other.id);
  ownerCookie = `profarm_sid=${await createSession(owner.id, prisma)}`;
  otherCookie = `profarm_sid=${await createSession(other.id, prisma)}`;
  farmId = (await prisma.farm.create({ data: { userId: owner.id, name: 'Primary Test Farm' } })).id;
  secondFarmId = (await prisma.farm.create({ data: { userId: owner.id, name: 'Second Test Farm' } })).id;
  foreignFarmId = (await prisma.farm.create({ data: { userId: other.id, name: 'Other Owner Farm' } })).id;
});

beforeEach(async () => {
  const where = { farmId: { in: [farmId, secondFarmId, foreignFarmId] } };
  await prisma.farmActivity.deleteMany({ where });
  await prisma.farmTask.deleteMany({ where });
  await prisma.cropCycle.deleteMany({ where });
});

afterAll(async () => { await prisma.user.deleteMany({ where: { id: { in: userIds } } }); });

function postCycle(body: unknown, targetFarm = farmId, authCookie = ownerCookie) {
  return request(app).post(`/api/farms/${targetFarm}/cycles`).set('Origin', origin).set('Cookie', authCookie).send(body as object);
}
function patchCycle(cycleId: string, body: unknown, targetFarm = farmId, authCookie = ownerCookie) {
  return request(app).patch(`/api/farms/${targetFarm}/cycles/${cycleId}`).set('Origin', origin).set('Cookie', authCookie).send(body as object);
}
function seedCycle(overrides: Partial<Prisma.CropCycleUncheckedCreateInput> = {}) {
  return prisma.cropCycle.create({ data: {
    farmId, cropId: 'crop-wheat', cropName: 'Wheat', sowingDate: '2026-06-10',
    expectedHarvestDate: '2026-09-20', actualHarvestDate: '2026-09-25', status: 'completed',
    variety: 'Original variety', notes: 'Original notes', cultivatedArea: 3, areaUnit: 'hectares', ...overrides,
  } });
}
async function stored(id: string) { return prisma.cropCycle.findUniqueOrThrow({ where: { id } }); }

describe('crop-cycle creation contract', () => {
  it('creates canonical identity with normalized fields and the existing response envelope', async () => {
    const response = await postCycle({ ...validCreate, status: 'planned', variety: '  HD-2967  ', notes: '  Seeded plot  ', cultivatedArea: 2, areaUnit: 'hectares' });
    expect(response.status).toBe(201);
    expect(response.body.status).toBe('success');
    expect(response.body.data).toMatchObject({ farmId, cropId: 'crop-wheat', cropName: 'Wheat', status: 'planned', variety: 'HD-2967', notes: 'Seeded plot', cultivatedArea: 2, areaUnit: 'hectares' });
    expect((await stored(response.body.data.id)).sowingDate).toBe(validCreate.sowingDate);
    expect(response.body.data.actualHarvestDate).toBeNull();
    expect(typeof response.body.data.createdAt).toBe('string');
  });

  it.each(['wheat', ' WHEAT ', ' CROP-WHEAT '])('preserves deterministic legacy ID/slug alias %s', async (cropId) => {
    const response = await postCycle({ ...validCreate, cropId });
    expect(response.status).toBe(201);
    expect(response.body.data.cropId).toBe('crop-wheat');
    expect(response.body.data.cropName).toBe('Wheat');
  });

  it.each(['planned', 'active', 'completed', 'cancelled'])('accepts explicitly requested initial status %s', async (status) => {
    const response = await postCycle({ ...validCreate, status });
    expect(response.status).toBe(201);
    expect(response.body.data.status).toBe(status);
  });

  it('retains active/acres creation defaults when omitted', async () => {
    const response = await postCycle(validCreate);
    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({ status: 'active', areaUnit: 'acres' });
  });

  it('rejects unknown catalog IDs with a field error', async () => {
    const response = await postCycle({ ...validCreate, cropId: 'crop-unsupported' });
    expect(response.status).toBe(400);
    expect(response.body.errors[0].field).toBe('cropId');
    expect(await prisma.cropCycle.count({ where: { farmId } })).toBe(0);
  });

  it.each([
    {}, null, [], { sowingDate: '2026-06-10' },
    { ...validCreate, cropId: '' }, { ...validCreate, cropId: 7 },
    { ...validCreate, cropName: 'Rice' }, { cropName: 'Wheat', sowingDate: '2026-06-10' },
    { ...validCreate, unexpected: true }, { ...validCreate, farmId: 'override' },
    { ...validCreate, status: 'invented' }, { ...validCreate, sowingDate: '2026-02-31' },
    { ...validCreate, expectedHarvestDate: '2026-04-31' }, { ...validCreate, actualHarvestDate: '2026-02-29' },
    { ...validCreate, expectedHarvestDate: '2026-05-01' }, { ...validCreate, actualHarvestDate: '2026-05-01' },
  ].map((body) => [body]))('rejects malformed, unsupported or inconsistent creation body %# without persistence', async (body) => {
    const response = await postCycle(body);
    expect(response.status).toBe(400);
    expect(await prisma.cropCycle.count({ where: { farmId } })).toBe(0);
  });

  it('rejects malformed JSON without writing', async () => {
    const response = await request(app).post(`/api/farms/${farmId}/cycles`).set('Origin', origin)
      .set('Cookie', ownerCookie).set('Content-Type', 'application/json').send('{"cropId":');
    expect(response.status).toBe(400);
    expect(await prisma.cropCycle.count({ where: { farmId } })).toBe(0);
  });

  it('rejects nonexistent and inaccessible farms', async () => {
    expect((await postCycle(validCreate, randomUUID())).status).toBe(404);
    expect((await postCycle(validCreate, foreignFarmId)).status).toBe(404);
    expect((await postCycle(validCreate, farmId, otherCookie)).status).toBe(404);
    expect(await prisma.cropCycle.count()).toBe(0);
  });

  it('retains authentication and Origin protection', async () => {
    const unauthenticated = await request(app).post(`/api/farms/${farmId}/cycles`).set('Origin', origin).send(validCreate);
    expect(unauthenticated.status).toBe(401);
    const noOrigin = await request(app).post(`/api/farms/${farmId}/cycles`).set('Cookie', ownerCookie).send(validCreate);
    expect(noOrigin.status).toBe(403);
  });
});

describe('partial crop-cycle updates', () => {
  it('changes identity and derives its name without changing unrelated fields', async () => {
    const before = await seedCycle();
    const patch: UpdateCropCycleRequest = { cropId: 'crop-rice' };
    const response = await patchCycle(before.id, patch);
    expect(response.status).toBe(200);
    const after = await stored(before.id);
    expect(after).toEqual({ ...before, cropId: 'crop-rice', cropName: 'Rice', updatedAt: after.updatedAt });
    expect(response.body.data.cropName).toBe('Rice');
  });

  it.each(['planned', 'active', 'completed', 'cancelled'])('preserves existing %s status on an ordinary edit', async (status) => {
    const before = await seedCycle({ status });
    const response = await patchCycle(before.id, { notes: '  Updated note  ' });
    expect(response.status).toBe(200);
    const after = await stored(before.id);
    expect(after).toEqual({ ...before, notes: 'Updated note', updatedAt: after.updatedAt });
  });

  it.each(['planned', 'active', 'completed', 'cancelled'])('honors an explicit valid status %s without other changes', async (status) => {
    const before = await seedCycle();
    expect((await patchCycle(before.id, { status })).status).toBe(200);
    const after = await stored(before.id);
    expect(after).toEqual({ ...before, status, updatedAt: after.updatedAt });
  });

  it.each([
    ['variety', 'New variety'], ['cultivatedArea', 4], ['areaUnit', 'acres'],
    ['sowingDate', '2026-06-11'], ['expectedHarvestDate', '2026-09-21'], ['actualHarvestDate', '2026-09-24'],
  ])('updates only the requested %s field', async (field, value) => {
    const before = await seedCycle();
    expect((await patchCycle(before.id, { [field]: value })).status).toBe(200);
    const after = await stored(before.id);
    expect(after).toEqual({ ...before, [field]: value, updatedAt: after.updatedAt });
  });

  it.each([
    {}, { cropName: 'Rice' }, { cropId: 'crop-rice', cropName: 'Wheat' }, { unknown: true },
    { id: 'override' }, { farmId: 'override' }, { status: 'invalid' }, { cropId: 'crop-unknown' },
    { sowingDate: null }, { actualHarvestDate: '2026-04-31' },
  ])('rejects invalid/unsupported patch %# with no partial changes', async (body) => {
    const before = await seedCycle();
    const response = await patchCycle(before.id, body);
    expect(response.status).toBe(400);
    expect(await stored(before.id)).toEqual(before);
  });

  it('rejects cross-user and cross-farm cycle updates', async () => {
    const before = await seedCycle();
    expect((await patchCycle(before.id, { notes: 'Changed' }, farmId, otherCookie)).status).toBe(404);
    expect((await patchCycle(before.id, { notes: 'Changed' }, secondFarmId)).status).toBe(400);
    expect((await patchCycle(randomUUID(), { notes: 'Changed' })).status).toBe(400);
    expect(await stored(before.id)).toEqual(before);
  });

  it('keeps existing stored identities readable without rewriting them', async () => {
    const legacy = await seedCycle({ cropId: 'wheat', cropName: 'Historical display name' });
    const response = await request(app).get(`/api/farms/${farmId}/cycles`).set('Cookie', ownerCookie);
    expect(response.status).toBe(200);
    expect(response.body.data[0]).toMatchObject({ id: legacy.id, cropId: 'wheat', cropName: 'Historical display name' });
    expect(await stored(legacy.id)).toEqual(legacy);
  });
});

describe('effective timeline validation', () => {
  it.each(['expectedHarvestDate', 'actualHarvestDate'])('rejects a %s-only patch before stored sowing', async (field) => {
    const before = await seedCycle();
    const response = await patchCycle(before.id, { [field]: '2026-05-01', notes: 'Must not persist' });
    expect(response.status).toBe(400);
    expect(response.body.errors.some((error: { field: string }) => error.field === field)).toBe(true);
    expect(await stored(before.id)).toEqual(before);
  });

  it.each([
    { sowingDate: '2026-09-21', actualHarvestDate: null },
    { sowingDate: '2026-09-26', expectedHarvestDate: null },
  ])('rejects sowing-only chronology against retained harvest values %#', async (body) => {
    const before = await seedCycle();
    expect((await patchCycle(before.id, body)).status).toBe(400);
    expect(await stored(before.id)).toEqual(before);
  });

  it('accepts jointly valid replacement dates without reactivating a completed cycle', async () => {
    const before = await seedCycle();
    const response = await patchCycle(before.id, { sowingDate: '2027-01-01', expectedHarvestDate: '2027-03-01', actualHarvestDate: '2027-02-28' });
    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({ sowingDate: '2027-01-01', expectedHarvestDate: '2027-03-01', actualHarvestDate: '2027-02-28', status: 'completed' });
  });

  it.each([
    ['expectedHarvestDate', null], ['expectedHarvestDate', ''], ['actualHarvestDate', null], ['actualHarvestDate', ''],
  ])('clears %s with %s while preserving other values', async (field, value) => {
    const before = await seedCycle();
    const response = await patchCycle(before.id, { [field]: value });
    expect(response.status).toBe(200);
    const after = await stored(before.id);
    expect(after).toEqual({ ...before, [field]: null, updatedAt: after.updatedAt });
  });

  it('permits same-day sowing/harvest and retains exact leap-day strings', async () => {
    const response = await postCycle({ cropId: 'crop-wheat', sowingDate: '2024-02-29', expectedHarvestDate: '2024-02-29', actualHarvestDate: '2024-02-29' });
    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({ sowingDate: '2024-02-29', expectedHarvestDate: '2024-02-29', actualHarvestDate: '2024-02-29' });
  });

  it('updates sowing when optional harvest dates are absent', async () => {
    const before = await seedCycle({ expectedHarvestDate: null, actualHarvestDate: null });
    expect((await patchCycle(before.id, { sowingDate: '2027-01-01' })).status).toBe(200);
    expect((await stored(before.id)).sowingDate).toBe('2027-01-01');
  });

  it('validates a stale client patch against the latest stored sowing date', async () => {
    const before = await seedCycle({ actualHarvestDate: null });
    expect((await patchCycle(before.id, { sowingDate: '2026-08-01' })).status).toBe(200);
    const latest = await stored(before.id);
    expect((await patchCycle(before.id, { expectedHarvestDate: '2026-07-01' })).status).toBe(400);
    expect(await stored(before.id)).toEqual(latest);
  });

  it('does not commit an invalid combined timeline from concurrent date patches', async () => {
    const before = await seedCycle({ actualHarvestDate: null });
    const responses = await Promise.all([
      patchCycle(before.id, { sowingDate: '2026-08-01' }),
      patchCycle(before.id, { expectedHarvestDate: '2026-07-01' }),
    ]);
    const statuses = responses.map((response) => response.status);
    expect(statuses.every((status) => [200, 400, 409].includes(status))).toBe(true);
    expect(statuses.filter((status) => status === 200).length).toBe(1);
    const after = await stored(before.id);
    expect(after.expectedHarvestDate! >= after.sowingDate).toBe(true);
    expect(after.status).toBe('completed');
  }, 20000);

  it('enforces semantic validation at the service boundary too', async () => {
    await expect(createCropCycle(ownerId, farmId, { ...validCreate, sowingDate: '2026-02-31', status: 'active' } as CreateCropCycleInput)).rejects.toThrow();
    const before = await seedCycle();
    await expect(updateCropCycle(ownerId, farmId, before.id, { expectedHarvestDate: '2026-05-01' })).rejects.toThrow();
    expect(await stored(before.id)).toEqual(before);
  });
});

describe('activity/task date API regression', () => {
  it.each(['activities', 'tasks'])('rejects impossible dates on %s creation and updates', async (kind) => {
    const field = kind === 'activities' ? 'activityDate' : 'dueDate';
    const endpoint = `/api/farms/${farmId}/${kind}`;
    const invalid = await request(app).post(endpoint).set('Origin', origin).set('Cookie', ownerCookie)
      .send({ title: 'Field inspection', category: 'general', [field]: '2026-02-31' });
    expect(invalid.status).toBe(400);
    const valid = await request(app).post(endpoint).set('Origin', origin).set('Cookie', ownerCookie)
      .send({ title: 'Field inspection', category: 'general', [field]: '2024-02-29' });
    expect(valid.status).toBe(201);
    expect(valid.body.data[field]).toBe('2024-02-29');
    const patch = await request(app).patch(`${endpoint}/${valid.body.data.id}`).set('Origin', origin).set('Cookie', ownerCookie)
      .send({ [field]: '2026-04-31', title: 'Must not persist' });
    expect(patch.status).toBe(400);
    const record = kind === 'activities'
      ? await prisma.farmActivity.findUniqueOrThrow({ where: { id: valid.body.data.id } })
      : await prisma.farmTask.findUniqueOrThrow({ where: { id: valid.body.data.id } });
    expect(record.title).toBe('Field inspection');
  });
});
