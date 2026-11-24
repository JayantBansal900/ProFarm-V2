import { afterEach, describe, expect, it, vi } from 'vitest';
import { Prisma } from '@prisma/client';
import { prisma } from '../src/lib/prisma';
import { createActivity, createTask, updateActivity, updateTask } from '../src/services/farm.service';
import { farmFixture } from './farmFixtures';

const x = farmFixture();
afterEach(() => vi.restoreAllMocks());

describe.each(['activities', 'tasks'] as const)('%s mutation and ownership contracts', (kind) => {
  const dateField = kind === 'activities' ? 'activityDate' : 'dueDate';
  const record = (id: string) => kind === 'activities'
    ? prisma.farmActivity.findUniqueOrThrow({ where: { id } }) : prisma.farmTask.findUniqueOrThrow({ where: { id } });

  it('creates, reads, edits only supplied fields, and explicitly clears cycle association', async () => {
    const cycle = await x.cycle();
    const url = `/api/farms/${x.f.farmId}/${kind}`;
    const response = await x.post(url, { title: ' Inspect field ', category: 'general', [dateField]: '2024-02-29', cropCycleId: cycle.id });
    expect(response.status).toBe(201);
    const before = await record(response.body.data.id);
    expect(before.title).toBe('Inspect field');
    expect((await x.get(url)).body[kind].map((r: { id: string }) => r.id)).toContain(before.id);
    expect((await x.patch(`${url}/${before.id}`, { title: 'Changed title' })).status).toBe(200);
    const changed = await record(before.id);
    expect(changed).toEqual({ ...before, title: 'Changed title', updatedAt: changed.updatedAt });
    const cleared = await x.patch(`${url}/${before.id}`, { cropCycleId: null, [dateField]: '2024-03-01' });
    expect(cleared.status).toBe(200);
    expect(cleared.body.data.cropCycleId).toBeNull();
    expect(cleared.body.data[dateField]).toBe('2024-03-01');
    const calendar = await x.get('/api/farms/calendar?year=2024&month=2');
    expect(calendar.body.data[kind]).toEqual([]);
  });

  it.each([{}, { unsupported: true }, { title: 'x' }, { category: 'unsupported' }, { cropCycleId: 7 },
    { title: 'Must not save', [dateField]: '2026-02-31' }])('rejects invalid PATCH %# without a write', async (body) => {
    const before = kind === 'activities' ? await x.activity() : await x.task();
    const response = await x.patch(`/api/farms/${x.f.farmId}/${kind}/${before.id}`, body);
    expect(response.status).toBe(400);
    expect(await record(before.id)).toEqual(before);
  });

  it('rejects cross-user/cross-farm mutations and invalid linked cycles without changing records', async () => {
    const before = kind === 'activities' ? await x.activity() : await x.task();
    const linked = await x.cycle({ farmId: x.f.secondId });
    const foreign = await x.cycle({ farmId: x.f.foreignId });
    const url = `/api/farms/${x.f.farmId}/${kind}/${before.id}`;
    expect((await x.patch(url, { title: 'Tampered' }, x.f.otherCookie)).status).toBe(404);
    expect((await x.patch(`/api/farms/${x.f.secondId}/${kind}/${before.id}`, { title: 'Tampered' })).status).toBe(404);
    expect((await x.patch(`/api/farms/${x.f.farmId}/${kind}/missing`, { title: 'Tampered' })).status).toBe(404);
    for (const cropCycleId of [linked.id, foreign.id, 'missing']) {
      expect((await x.patch(url, { cropCycleId, title: 'Must not persist' })).status).toBe(400);
      expect((await x.post(`/api/farms/${x.f.farmId}/${kind}`, { title: 'Must not create', category: 'general', [dateField]: '2024-02-29', cropCycleId })).status).toBe(400);
    }
    expect(await record(before.id)).toEqual(before);
    expect((await x.get(`/api/farms/${x.f.foreignId}/${kind}`)).status).toBe(404);
  });

  it('preserves legacy mixed unknown-field stripping while rejecting no-op requests', async () => {
    const before = kind === 'activities' ? await x.activity() : await x.task();
    const response = await x.patch(`/api/farms/${x.f.farmId}/${kind}/${before.id}`, { title: 'Accepted known field', legacyExtra: 'ignored' });
    expect(response.status).toBe(200);
    expect((await record(before.id)).title).toBe('Accepted known field');
  });
});

it('deletes activities and prevents deleted records from reappearing', async () => {
  const activity = await x.activity();
  const url = `/api/farms/${x.f.farmId}/activities/${activity.id}`;
  expect((await x.remove(url, x.f.otherCookie)).status).toBe(404);
  expect((await x.remove(`/api/farms/${x.f.secondId}/activities/${activity.id}`)).status).toBe(404);
  expect((await x.remove(url)).status).toBe(200);
  expect((await x.remove(url)).status).toBe(404);
  expect((await x.get(`/api/farms/${x.f.farmId}/activities`)).body.pagination.totalRecords).toBe(0);
  expect((await x.get('/api/farms/calendar?year=2024&month=2')).body.data.activities).toEqual([]);
});

it('preserves completion timestamps on ordinary/repeated edits and clears them on reopening', async () => {
  const completedAt = new Date('2024-02-01T12:00:00Z');
  const task = await x.task({ status: 'completed', completedAt });
  const url = `/api/farms/${x.f.farmId}/tasks/${task.id}`;
  for (const patch of [{ title: 'Updated completed task' }, { dueDate: '2024-03-01' }, { status: 'completed' }]) {
    expect((await x.patch(url, patch)).status).toBe(200);
    expect((await prisma.farmTask.findUniqueOrThrow({ where: { id: task.id } })).completedAt).toEqual(completedAt);
  }
  const reopened = await x.patch(url, { status: 'pending' });
  expect(reopened.body.data.completedAt).toBeNull();
  expect(reopened.body.data.isOverdue).toBe(true);
  const completed = await x.patch(url, { status: 'completed' });
  expect(completed.body.data.completedAt).not.toBeNull();
  expect(completed.body.data.isOverdue).toBe(false);
  const before = await prisma.farmTask.findUniqueOrThrow({ where: { id: task.id } });
  expect((await x.patch(url, { status: 'cancelled' })).status).toBe(400);
  expect(await prisma.farmTask.findUnique({ where: { id: task.id } })).toEqual(before);
});

it('counts all overdue tasks rather than only the ten-task farm preview', async () => {
  for (let i = 0; i < 15; i++) await x.task({ dueDate: '2001-01-01' });
  await x.task({ status: 'completed', dueDate: '2001-01-01', completedAt: new Date() });
  await x.task({ farmId: x.f.foreignId, dueDate: '2001-01-01' });
  await x.task({ farmId: x.f.archivedId, dueDate: '2001-01-01' });
  const detail = await x.get(`/api/farms/${x.f.farmId}`);
  expect(detail.body.data.tasks).toHaveLength(10);
  expect(detail.body.data.overdueTasksCount).toBe(15);
  expect(detail.body.data.totalTasksCount).toBe(16);
  const overview = (await x.get('/api/farms/overview')).body.data;
  expect(overview.pendingTasksCount).toBe(15);
  expect(overview.overdueTasksCount).toBe(15);
  expect(overview.upcomingTasks).toHaveLength(5);
});

it('validates activity/task service calls without relying on controller validation', async () => {
  await expect(createActivity(x.f.ownerId, x.f.farmId, { category: 'general', title: 'Invalid date', activityDate: '2024-02-31' })).rejects.toThrow();
  await expect(createTask(x.f.ownerId, x.f.farmId, { category: 'general', title: 'Invalid date', dueDate: '2024-02-31', status: 'pending' })).rejects.toThrow();
  const activity = await x.activity();
  const task = await x.task();
  await expect(updateActivity(x.f.ownerId, x.f.farmId, activity.id, {})).rejects.toThrow();
  await expect(updateTask(x.f.ownerId, x.f.farmId, task.id, {})).rejects.toThrow();
});

it.each(['P2034', 'P2028', 'P1008'])('returns controlled 409 for transaction failure %s without persistence', async (code) => {
  const cycle = await x.cycle();
  // Fault injection tests the error boundary; real timeline/concurrency integrity
  // remains exercised by farmContracts.test.ts and farmCalendar.test.ts.
  vi.spyOn(prisma, '$transaction').mockRejectedValueOnce(new Prisma.PrismaClientKnownRequestError('Injected conflict', { code, clientVersion: '5' }));
  const response = await x.patch(`/api/farms/${x.f.farmId}/cycles/${cycle.id}`, { notes: 'Must not persist' });
  expect(response.status).toBe(409);
  expect(response.body).toEqual({ status: 'error', message: 'Crop-cycle update conflicted with another operation or timed out. Reload and retry.' });
  expect(await prisma.cropCycle.findUnique({ where: { id: cycle.id } })).toEqual(cycle);
});
