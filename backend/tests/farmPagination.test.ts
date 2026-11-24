import { describe, expect, it } from 'vitest';
import { prisma } from '../src/lib/prisma';
import { paginationWindow } from '../src/validators/pagination.validator';
import { farmFixture } from './farmFixtures';

const x = farmFixture();
const endpoints = ['farms', 'cycles', 'activities', 'tasks'] as const;
function endpoint(kind: typeof endpoints[number]) { return kind === 'farms' ? '/api/farms' : `/api/farms/${x.f.farmId}/${kind}`; }
function rows(body: Record<string, unknown>, kind: typeof endpoints[number]): Array<{ id: string }> {
  return body[kind === 'cycles' ? 'data' : kind] as Array<{ id: string }>;
}

describe.each(endpoints)('%s pagination contract', (kind) => {
  it.each(['page=0', 'page=-1', 'page=1.5', 'page=abc', 'page=', 'page=1e2', 'page=100001', 'page=9007199254740991',
    'page=1&page=2', 'page[x]=1', 'page=1%0A', 'limit=0', 'limit=-1', 'limit=1.5', 'limit=abc', 'limit=101', 'limit=Infinity'])
    ('rejects invalid query %s with a field error', async (query) => {
      const response = await x.get(`${endpoint(kind)}?${query}`);
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Validation failed');
      expect(response.body.errors.length).toBeGreaterThan(0);
    });

  it('returns compatible defaults, bounded custom pages, and safe empty pages', async () => {
    const defaults = await x.get(endpoint(kind));
    expect(defaults.status).toBe(200);
    if (kind === 'cycles') {
      expect(defaults.body).toEqual({ status: 'success', count: 0, data: [] });
    } else {
      expect(defaults.body.pagination).toMatchObject({ currentPage: 1, limit: 20 });
    }
    const custom = await x.get(`${endpoint(kind)}?page=2&limit=3`);
    expect(custom.status).toBe(200);
    expect(custom.body.pagination).toMatchObject({ currentPage: 2, limit: 3 });
    expect(rows(custom.body, kind)).toEqual([]);
    const outside = await x.get(`${endpoint(kind)}?page=100000&limit=100`);
    expect(outside.status).toBe(200);
    expect(rows(outside.body, kind)).toEqual([]);
    expect(outside.body.pagination.totalRecords).toBe(kind === 'farms' ? 2 : 0);
    expect(outside.body.pagination.totalPages).toBe(1);
  });

  it('uses a unique tie-breaker across pages and counts only owned/filtered records', async () => {
    const createdAt = new Date('2024-01-01T12:00:00Z');
    let ids: string[];
    if (kind === 'farms') {
      await prisma.farm.deleteMany({ where: { userId: x.f.ownerId, isArchived: false } });
      ids = await Promise.all(['c', 'a', 'b'].map(async (id) => (await prisma.farm.create({ data: { id: `page-${id}`, userId: x.f.ownerId, name: `Farm ${id}`, createdAt } })).id));
    } else {
      const create = kind === 'cycles' ? x.cycle : kind === 'activities' ? x.activity : x.task;
      ids = [];
      for (const id of ['c', 'a', 'b']) ids.push((await create({ id: `page-${id}`, createdAt })).id);
      await create({ farmId: x.f.foreignId, createdAt });
      await create({ farmId: x.f.secondId, createdAt });
    }
    const first = await x.get(`${endpoint(kind)}?page=1&limit=2`);
    const second = await x.get(`${endpoint(kind)}?page=2&limit=2`);
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect([...rows(first.body, kind), ...rows(second.body, kind)].map((r) => r.id)).toEqual(ids.sort());
    expect(first.body.pagination).toEqual({ totalRecords: 3, totalPages: 2, currentPage: 1, limit: 2 });
    expect((await x.get(`${endpoint(kind)}?limit=2`)).body.pagination.currentPage).toBe(1);
    expect((await x.get(`${endpoint(kind)}?page=1`)).body.pagination.limit).toBe(20);
  });
});

it('keeps legacy cycle retrieval complete while allowing all pages to be retrieved', async () => {
  for (let i = 0; i < 25; i++) await x.cycle();
  const legacy = await x.get(endpoint('cycles'));
  expect(legacy.body.count).toBe(25);
  expect(legacy.body.data).toHaveLength(25);
  expect(legacy.body.pagination).toBeUndefined();
  const page = await x.get(`${endpoint('cycles')}?limit=20`);
  expect(page.body.data).toHaveLength(20);
  expect(page.body.count).toBe(20);
  expect(page.body.pagination.totalRecords).toBe(25);
  const next = await x.get(`${endpoint('cycles')}?limit=20&page=2`);
  expect(next.body.data).toHaveLength(5);
});

it('filters activities and tasks before counting and paginating', async () => {
  const cycle = await x.cycle();
  const other = await x.cycle();
  for (let i = 0; i < 4; i++) {
    await x.activity({ cropCycleId: cycle.id, category: 'irrigation' });
    await x.task({ cropCycleId: cycle.id, category: 'irrigation', status: 'completed' });
  }
  await x.activity({ cropCycleId: other.id, category: 'irrigation' });
  await x.activity({ cropCycleId: cycle.id, category: 'general' });
  await x.task({ cropCycleId: cycle.id, category: 'irrigation', status: 'pending' });
  await x.task({ cropCycleId: other.id, category: 'irrigation', status: 'completed' });
  await x.task({ cropCycleId: cycle.id, category: 'general', status: 'completed' });
  for (const kind of ['activities', 'tasks'] as const) {
    const response = await x.get(`${endpoint(kind)}?cropCycleId=${cycle.id}&category=irrigation&status=completed&page=2&limit=2`);
    expect(response.status).toBe(200);
    expect(response.body[kind]).toHaveLength(2);
    expect(response.body.pagination.totalRecords).toBe(4);
    for (const row of response.body[kind]) expect(row.cropCycleId).toBe(cycle.id);
    const foreignFilter = await x.get(`${endpoint(kind)}?cropCycleId=does-not-belong`);
    expect(foreignFilter.body[kind]).toEqual([]);
  }
});

it.each(['activities', 'tasks'])('rejects unknown %s categories', async (kind) => {
  expect((await x.get(`${endpoint(kind as 'activities' | 'tasks')}?category=invented`)).status).toBe(400);
});

it('includes archived farms only on explicit request and excludes another user', async () => {
  const response = await x.get('/api/farms?includeArchived=true');
  expect(response.body.pagination.totalRecords).toBe(3);
  expect(response.body.farms.map((f: { id: string }) => f.id)).toContain(x.f.archivedId);
  expect(response.body.farms.map((f: { id: string }) => f.id)).not.toContain(x.f.foreignId);
});

it('bounds service-level offsets as well as HTTP parameters', () => {
  expect(paginationWindow({ page: 100000, limit: 100 }).skip).toBe(9999900);
  for (const page of [0, -1, 1.5, Infinity, Number.MAX_SAFE_INTEGER]) expect(() => paginationWindow({ page })).toThrow();
});
