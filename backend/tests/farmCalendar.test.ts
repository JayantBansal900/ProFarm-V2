import { describe, expect, it } from 'vitest';
import { prisma } from '../src/lib/prisma';
import { farmFixture } from './farmFixtures';

const x = farmFixture();
const calendar = (year: number, month: number, farmId?: string) => x.get(`/api/farms/calendar?year=${year}&month=${month}${farmId ? `&farmId=${farmId}` : ''}`);
type Milestone = { id: string; date: string; type: string; harvestKind?: string; farmId: string; cycleId: string };

describe('calendar query and month boundaries', () => {
  it.each(['', 'year=2024', 'month=2', 'year=1999&month=1', 'year=2101&month=1', 'year=2024.5&month=2',
    'year=2e3&month=2', 'year=2024&month=0', 'year=2024&month=13', 'year=2024&month=-1',
    'year=2024&month=1.5', 'year=2024&month=', 'year=2024&month=2&month=3',
    'year[x]=2024&month=2', 'year=2024&month=2&farmId=', 'year=2024&month=2&farmId=a&farmId=b',
    'year=2024%0A&month=2'])('rejects malformed calendar query %s', async (query) => {
      const response = await x.get(`/api/farms/calendar?${query}`);
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Validation failed');
    });

  it.each([
    [2024, 1, '2023-12-31', '2024-01-01', '2024-01-31', '2024-02-01'],
    [2024, 2, '2024-01-31', '2024-02-01', '2024-02-29', '2024-03-01'],
    [2026, 2, '2026-01-31', '2026-02-01', '2026-02-28', '2026-03-01'],
    [2024, 4, '2024-03-31', '2024-04-01', '2024-04-30', '2024-05-01'],
    [2024, 12, '2024-11-30', '2024-12-01', '2024-12-31', '2025-01-01'],
    [2100, 2, '2100-01-31', '2100-02-01', '2100-02-28', '2100-03-01'],
  ] as const)('returns exactly the complete %i/%i month', async (year, month, before, first, last, after) => {
    for (const date of [before, first, last, after]) {
      await x.task({ dueDate: date });
      await x.activity({ activityDate: date });
      await x.cycle({ sowingDate: date, expectedHarvestDate: date, actualHarvestDate: date });
    }
    const response = await calendar(year, month);
    expect(response.status).toBe(200);
    expect(response.body.data.tasks.map((t: { dueDate: string }) => t.dueDate)).toEqual([first, last]);
    expect(response.body.data.activities.map((a: { activityDate: string }) => a.activityDate)).toEqual([first, last]);
    const events: Milestone[] = response.body.data.cropCycleMilestones;
    expect(events).toHaveLength(6);
    expect(events.every((event) => event.date === first || event.date === last)).toBe(true);
    expect(new Set(events.map((event) => event.id)).size).toBe(6);
    expect(events.filter((event) => event.harvestKind === 'actual')).toHaveLength(2);
  });

  it('returns an empty month with the legacy envelope, including when no farms exist', async () => {
    expect((await calendar(2024, 3)).body).toEqual({ status: 'success', data: { year: 2024, month: 3, tasks: [], activities: [], cropCycleMilestones: [] } });
    await prisma.farm.deleteMany({ where: { userId: x.f.ownerId } });
    expect((await calendar(2024, 3)).body.data.tasks).toEqual([]);
  });

  it('handles the December upper boundary of the supported query range', async () => {
    await x.task({ dueDate: '2100-12-31' });
    await x.task({ dueDate: '2101-01-01' });
    const response = await calendar(2100, 12);
    expect(response.body.data.tasks.map((t: { dueDate: string }) => t.dueDate)).toEqual(['2100-12-31']);
  });
});

describe('calendar ownership, completeness and deterministic events', () => {
  it('preserves archived/history policy and isolates ownership across all event collections', async () => {
    for (const farmId of [x.f.farmId, x.f.secondId, x.f.archivedId, x.f.foreignId]) {
      await x.task({ farmId, status: 'completed', completedAt: new Date() });
      await x.activity({ farmId });
      await x.cycle({ farmId, sowingDate: '2024-02-15', status: 'cancelled' });
    }
    const all = (await calendar(2024, 2)).body.data;
    for (const key of ['tasks', 'activities', 'cropCycleMilestones']) {
      expect(all[key]).toHaveLength(2);
      expect(all[key].every((row: { farmId: string }) => [x.f.farmId, x.f.secondId].includes(row.farmId))).toBe(true);
    }
    const filtered = (await calendar(2024, 2, x.f.farmId)).body.data;
    expect(filtered.tasks).toHaveLength(1);
    expect(filtered.tasks[0].status).toBe('completed');
    expect(filtered.cropCycleMilestones).toHaveLength(1);
    expect((await calendar(2024, 2, x.f.archivedId)).body.data.tasks).toHaveLength(1);
    expect((await calendar(2024, 2, x.f.foreignId)).status).toBe(404);
    expect((await calendar(2024, 2, 'nonexistent')).status).toBe(404);
  });

  it('retains existing milestone IDs/types and emits actual-only harvests', async () => {
    const c = await x.cycle({ sowingDate: '2024-01-01', expectedHarvestDate: '2024-01-31', actualHarvestDate: '2024-02-15' });
    const january: Milestone[] = (await calendar(2024, 1)).body.data.cropCycleMilestones;
    expect(january.map((m) => m.id)).toEqual([`milestone-sow-${c.id}`, `milestone-harv-${c.id}`]);
    expect(january[1]).toMatchObject({ type: 'harvest', harvestKind: 'expected' });
    const february: Milestone[] = (await calendar(2024, 2)).body.data.cropCycleMilestones;
    expect(february).toHaveLength(1);
    expect(february[0]).toMatchObject({ id: `milestone-actual-harv-${c.id}`, type: 'harvest', harvestKind: 'actual', date: '2024-02-15', cycleId: c.id, farmId: x.f.farmId });
  });

  it('orders tied events consistently and does not duplicate cycles matched by multiple date conditions', async () => {
    for (const id of ['b', 'a']) {
      await x.task({ id: `calendar-task-${id}` });
      await x.activity({ id: `calendar-activity-${id}` });
      await x.cycle({ id: `calendar-cycle-${id}`, sowingDate: '2024-02-15', expectedHarvestDate: '2024-02-15', actualHarvestDate: '2024-02-15' });
    }
    const data = (await calendar(2024, 2)).body.data;
    expect(data.tasks.map((t: { id: string }) => t.id)).toEqual(['calendar-task-a', 'calendar-task-b']);
    expect(data.activities.map((a: { id: string }) => a.id)).toEqual(['calendar-activity-a', 'calendar-activity-b']);
    const ids = data.cropCycleMilestones.map((m: Milestone) => m.id);
    expect(ids).toHaveLength(6);
    expect(ids).toEqual([...ids].sort());
    expect(new Set(ids).size).toBe(6);
    expect((await calendar(2024, 2)).body.data).toEqual(data);
  });

  it('returns a complete large month and avoids a farm-ID query parameter ceiling', async () => {
    await prisma.farm.createMany({ data: Array.from({ length: 1100 }, (_, i) => ({ userId: x.f.ownerId, name: `Large fixture ${i}` })) });
    await prisma.farmTask.createMany({ data: Array.from({ length: 125 }, (_, i) => ({ farmId: x.f.farmId, title: `Task ${i}`, category: 'general', dueDate: '2024-02-29' })) });
    await prisma.farmActivity.createMany({ data: Array.from({ length: 125 }, (_, i) => ({ farmId: x.f.secondId, title: `Activity ${i}`, category: 'general', activityDate: '2024-02-29' })) });
    const response = await calendar(2024, 2);
    expect(response.status).toBe(200);
    expect(response.body.data.tasks).toHaveLength(125);
    expect(response.body.data.activities).toHaveLength(125);
    const overview = await x.get('/api/farms/overview');
    expect(overview.status).toBe(200);
    expect(overview.body.data.activeFarmsCount).toBe(1102);
    expect(overview.body.data.pendingTasksCount).toBe(125);
    expect(overview.body.data.upcomingTasks).toHaveLength(5);
  });

  it('retains exact date-only values across timezones', async () => {
    await x.task({ dueDate: '2024-02-29' });
    await x.activity({ activityDate: '2024-02-29' });
    await x.cycle({ sowingDate: '2024-02-29' });
    const previous = process.env.TZ;
    try {
      for (const timezone of ['UTC', 'Asia/Kolkata', 'America/Los_Angeles']) {
        process.env.TZ = timezone;
        const data = (await calendar(2024, 2)).body.data;
        expect(data.tasks[0].dueDate).toBe('2024-02-29');
        expect(data.activities[0].activityDate).toBe('2024-02-29');
        expect(data.cropCycleMilestones[0].date).toBe('2024-02-29');
      }
    } finally { if (previous === undefined) delete process.env.TZ; else process.env.TZ = previous; }
  });

  it('does not present impossible legacy dates as calendar events or modify their records', async () => {
    const task = await x.task({ dueDate: '2026-02-31' });
    const activity = await x.activity({ activityDate: '2026-02-29' });
    const cycle = await x.cycle({ sowingDate: '2026-02-30' });
    const data = (await calendar(2026, 2)).body.data;
    expect(data.tasks).toEqual([]);
    expect(data.activities).toEqual([]);
    expect(data.cropCycleMilestones).toEqual([]);
    expect(data.invalidDateCounts).toEqual({ tasks: 1, activities: 1, milestones: 1 });
    expect(await prisma.farmTask.findUnique({ where: { id: task.id } })).toEqual(task);
    expect(await prisma.farmActivity.findUnique({ where: { id: activity.id } })).toEqual(activity);
    expect(await prisma.cropCycle.findUnique({ where: { id: cycle.id } })).toEqual(cycle);
  });
});

it('reflects persisted milestone edits, clears and status without duplicates or partial failure', async () => {
  const cycle = await x.cycle({ sowingDate: '2024-02-01', expectedHarvestDate: '2024-02-28', actualHarvestDate: '2024-02-29' });
  const url = `/api/farms/${x.f.farmId}/cycles/${cycle.id}`;
  const moved = await x.patch(url, { expectedHarvestDate: '2024-03-01' });
  expect(moved.status).toBe(200);
  expect(moved.body.data.status).toBe('completed');
  expect((await calendar(2024, 2)).body.data.cropCycleMilestones).toHaveLength(2);
  expect((await calendar(2024, 3)).body.data.cropCycleMilestones[0].id).toBe(`milestone-harv-${cycle.id}`);
  const before = await prisma.cropCycle.findUniqueOrThrow({ where: { id: cycle.id } });
  expect((await x.patch(url, { sowingDate: '2024-04-01', notes: 'Must not save' })).status).toBe(400);
  expect(await prisma.cropCycle.findUnique({ where: { id: cycle.id } })).toEqual(before);
  expect((await x.patch(url, { actualHarvestDate: null })).status).toBe(200);
  expect((await calendar(2024, 2)).body.data.cropCycleMilestones).toHaveLength(1);
  expect((await x.patch(url, { status: 'cancelled' })).status).toBe(200);
  expect((await calendar(2024, 3)).body.data.cropCycleMilestones).toHaveLength(1);
  const after = await prisma.cropCycle.findUniqueOrThrow({ where: { id: cycle.id } });
  expect(after.sowingDate).toBe('2024-02-01');
  expect(after.expectedHarvestDate).toBe('2024-03-01');
  expect(after.actualHarvestDate).toBeNull();
  expect((await x.patch(url, { expectedHarvestDate: null }, x.f.otherCookie)).status).toBe(404);
  expect(await prisma.cropCycle.findUnique({ where: { id: cycle.id } })).toEqual(after);
});
