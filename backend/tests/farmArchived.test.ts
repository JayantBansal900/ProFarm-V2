import { describe, expect, it } from 'vitest';
import { prisma } from '../src/lib/prisma';
import { farmFixture } from './farmFixtures';

const x = farmFixture();
const archivedMessage = 'This farm is archived. Restore it before making changes.';

describe('archived farms are read-only', () => {
  it('rejects every write endpoint with 409 and leaves data unchanged', async () => {
    const farmId = x.f.archivedId;
    const base = `/api/farms/${farmId}`;
    const cycle = await x.cycle({ farmId });
    const activity = await x.activity({ farmId });
    const task = await x.task({ farmId });

    const writes = [
      x.patch(base, { name: 'Renamed while archived' }),
      x.post(`${base}/cycles`, { cropId: 'crop-wheat', sowingDate: '2024-01-01' }),
      x.patch(`${base}/cycles/${cycle.id}`, { notes: 'changed' }),
      x.post(`${base}/activities`, { title: 'Inspect field', category: 'general', activityDate: '2024-02-15' }),
      x.patch(`${base}/activities/${activity.id}`, { title: 'Changed title' }),
      x.remove(`${base}/activities/${activity.id}`),
      x.post(`${base}/tasks`, { title: 'Inspect field', category: 'general', dueDate: '2024-02-15' }),
      x.patch(`${base}/tasks/${task.id}`, { status: 'completed' }),
    ];

    for (const pending of writes) {
      const response = await pending;
      expect(response.status).toBe(409);
      expect(response.body).toEqual({ status: 'error', message: archivedMessage });
    }

    const farm = await prisma.farm.findUniqueOrThrow({ where: { id: farmId } });
    expect(farm.name).toBe('Archived farm');
    expect(await prisma.cropCycle.count({ where: { farmId } })).toBe(1);
    expect(await prisma.farmActivity.count({ where: { farmId } })).toBe(1);
    expect(await prisma.farmTask.findUniqueOrThrow({ where: { id: task.id } })).toMatchObject({ status: 'pending' });
  });

  it('still allows reads and restore, after which writes succeed', async () => {
    const base = `/api/farms/${x.f.archivedId}`;
    expect((await x.get(base)).status).toBe(200);
    expect((await x.get(`${base}/tasks`)).status).toBe(200);

    const restored = await x.post(`${base}/restore`, {});
    expect(restored.status).toBe(200);
    expect(restored.body.data.isArchived).toBe(false);

    const created = await x.post(`${base}/tasks`, { title: 'After restore', category: 'general', dueDate: '2024-02-15' });
    expect(created.status).toBe(201);
  });

  it('keeps ownership checks ahead of the archive check (404 for another user)', async () => {
    const response = await x.patch(`/api/farms/${x.f.archivedId}`, { name: 'Hijack' }, x.f.otherCookie);
    expect(response.status).toBe(404);
  });
});
