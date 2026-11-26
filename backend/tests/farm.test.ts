import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';
import { env } from '../src/config/env';

const TEST_ORIGIN = env.FRONTEND_ORIGIN || 'http://localhost:5173';
const RUN_ID = Date.now();

describe('Farm Management & Activity Tracker API (/api/farms)', () => {
  let userACookie: string[];
  let userBCookie: string[];
  let userAId: string;
  let userBId: string;

  let farmAId: string;
  let farmBId: string;
  let cycleAId: string;
  let activityAId: string;
  let taskAId: string;

  beforeAll(async () => {
    // Register User A
    const resA = await request(app)
      .post('/api/auth/register')
      .set('Origin', TEST_ORIGIN)
      .send({
        name: 'Farmer Arjun',
        email: `arjun_${RUN_ID}@example.com`,
        password: 'Password123!',
      });
    userACookie = resA.headers['set-cookie'] as unknown as string[];
    userAId = resA.body.user.id;

    // Register User B
    const resB = await request(app)
      .post('/api/auth/register')
      .set('Origin', TEST_ORIGIN)
      .send({
        name: 'Farmer Balram',
        email: `balram_${RUN_ID}@example.com`,
        password: 'Password123!',
      });
    userBCookie = resB.headers['set-cookie'] as unknown as string[];
    userBId = resB.body.user.id;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.farmActivity.deleteMany({
      where: { farm: { userId: { in: [userAId, userBId] } } },
    });
    await prisma.farmTask.deleteMany({
      where: { farm: { userId: { in: [userAId, userBId] } } },
    });
    await prisma.cropCycle.deleteMany({
      where: { farm: { userId: { in: [userAId, userBId] } } },
    });
    await prisma.farm.deleteMany({
      where: { userId: { in: [userAId, userBId] } },
    });
    await prisma.session.deleteMany({
      where: { userId: { in: [userAId, userBId] } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [userAId, userBId] } },
    });
    await prisma.$disconnect();
  });

  // ---------------------------------------------------------------------------
  // 1. Authentication & Security
  // ---------------------------------------------------------------------------
  describe('Authentication & CSRF Enforcement', () => {
    it('rejects unauthenticated request to /api/farms with 401', async () => {
      const res = await request(app).get('/api/farms');
      expect(res.status).toBe(401);
      expect(res.body.status).toBe('error');
    });

    it('rejects POST /api/farms with missing Origin header with 403 (CSRF)', async () => {
      const res = await request(app)
        .post('/api/farms')
        .set('Cookie', userACookie)
        .send({ name: 'Shanti Farm' });

      expect(res.status).toBe(403);
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Farm CRUD Lifecycle
  // ---------------------------------------------------------------------------
  describe('Farm CRUD Lifecycle', () => {
    it('creates a new farm for authenticated user', async () => {
      const res = await request(app)
        .post('/api/farms')
        .set('Origin', TEST_ORIGIN)
        .set('Cookie', userACookie)
        .send({
          name: 'Golden Wheat Acres',
          state: 'Punjab',
          district: 'Ludhiana',
          village: 'Samrala',
          pincode: '141114',
          area: 12.5,
          areaUnit: 'acres',
          soilType: 'soil-loam',
          notes: 'Fertile canal-irrigated alluvial loam soil.',
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.name).toBe('Golden Wheat Acres');
      expect(res.body.data.userId).toBe(userAId);
      expect(res.body.data.isArchived).toBe(false);

      farmAId = res.body.data.id;
    });

    it('rejects creating farm with invalid/missing name (< 2 chars)', async () => {
      const res = await request(app)
        .post('/api/farms')
        .set('Origin', TEST_ORIGIN)
        .set('Cookie', userACookie)
        .send({ name: 'A' });

      expect(res.status).toBe(400);
    });

    it('retrieves list of owned active farms', async () => {
      const res = await request(app)
        .get('/api/farms')
        .set('Cookie', userACookie);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.farms.length).toBeGreaterThanOrEqual(1);
      expect(res.body.farms.some((f: { id: string }) => f.id === farmAId)).toBe(true);
    });

    it('retrieves detailed farm by ID with associated counts', async () => {
      const res = await request(app)
        .get(`/api/farms/${farmAId}`)
        .set('Cookie', userACookie);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.id).toBe(farmAId);
      expect(res.body.data.name).toBe('Golden Wheat Acres');
      expect(res.body.data.cropCycles).toBeDefined();
    });

    it('updates farm details', async () => {
      const res = await request(app)
        .patch(`/api/farms/${farmAId}`)
        .set('Origin', TEST_ORIGIN)
        .set('Cookie', userACookie)
        .send({
          name: 'Golden Wheat Acres (Main Plot)',
          area: 15.0,
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.name).toBe('Golden Wheat Acres (Main Plot)');
      expect(res.body.data.area).toBe(15.0);
    });

    it('archives a farm and excludes it from default list', async () => {
      const archiveRes = await request(app)
        .post(`/api/farms/${farmAId}/archive`)
        .set('Origin', TEST_ORIGIN)
        .set('Cookie', userACookie);

      expect(archiveRes.status).toBe(200);
      expect(archiveRes.body.data.isArchived).toBe(true);

      // Verify default list excludes it
      const listRes = await request(app)
        .get('/api/farms')
        .set('Cookie', userACookie);
      expect(listRes.body.farms.some((f: { id: string }) => f.id === farmAId)).toBe(false);

      // Verify includeArchived=true includes it
      const archivedListRes = await request(app)
        .get('/api/farms?includeArchived=true')
        .set('Cookie', userACookie);
      expect(archivedListRes.body.farms.some((f: { id: string }) => f.id === farmAId)).toBe(true);
    });

    it('restores an archived farm', async () => {
      const restoreRes = await request(app)
        .post(`/api/farms/${farmAId}/restore`)
        .set('Origin', TEST_ORIGIN)
        .set('Cookie', userACookie);

      expect(restoreRes.status).toBe(200);
      expect(restoreRes.body.data.isArchived).toBe(false);

      const listRes = await request(app)
        .get('/api/farms')
        .set('Cookie', userACookie);
      expect(listRes.body.farms.some((f: { id: string }) => f.id === farmAId)).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Crop Cycle Lifecycle
  // ---------------------------------------------------------------------------
  describe('Crop Cycle Lifecycle', () => {
    it('creates a crop cycle on the farm with valid crop knowledge link', async () => {
      const res = await request(app)
        .post(`/api/farms/${farmAId}/cycles`)
        .set('Origin', TEST_ORIGIN)
        .set('Cookie', userACookie)
        .send({
          cropId: 'crop-wheat',
          variety: 'HD-2967',
          sowingDate: '2026-11-05',
          expectedHarvestDate: '2027-04-10',
          status: 'active',
          cultivatedArea: 10.0,
          areaUnit: 'acres',
          notes: 'Certified seed treated with Trichoderma.',
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.cropId).toBe('crop-wheat');
      expect(res.body.data.cropName).toBe('Wheat');
      expect(res.body.data.sowingDate).toBe('2026-11-05');

      cycleAId = res.body.data.id;
    });

    it('rejects crop cycle with unknown/fabricated cropId', async () => {
      const res = await request(app)
        .post(`/api/farms/${farmAId}/cycles`)
        .set('Origin', TEST_ORIGIN)
        .set('Cookie', userACookie)
        .send({
          cropId: 'crop-fabricated-alien-grain',
          sowingDate: '2026-11-05',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('not found in curated crop knowledge base');
    });

    it('rejects expectedHarvestDate earlier than sowingDate', async () => {
      const res = await request(app)
        .post(`/api/farms/${farmAId}/cycles`)
        .set('Origin', TEST_ORIGIN)
        .set('Cookie', userACookie)
        .send({
          cropId: 'crop-wheat',
          sowingDate: '2026-11-10',
          expectedHarvestDate: '2026-10-01', // Earlier!
        });

      expect(res.status).toBe(400);
    });

    it('lists crop cycles for the farm', async () => {
      const res = await request(app)
        .get(`/api/farms/${farmAId}/cycles`)
        .set('Cookie', userACookie);

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(1);
      expect(res.body.data[0].id).toBe(cycleAId);
    });

    it('updates crop cycle status to completed with actualHarvestDate', async () => {
      const res = await request(app)
        .patch(`/api/farms/${farmAId}/cycles/${cycleAId}`)
        .set('Origin', TEST_ORIGIN)
        .set('Cookie', userACookie)
        .send({
          status: 'completed',
          actualHarvestDate: '2027-04-12',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('completed');
      expect(res.body.data.actualHarvestDate).toBe('2027-04-12');

      // Set back to active for remaining task tests
      await request(app)
        .patch(`/api/farms/${farmAId}/cycles/${cycleAId}`)
        .set('Origin', TEST_ORIGIN)
        .set('Cookie', userACookie)
        .send({ status: 'active' });
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Farm Activity Tracker
  // ---------------------------------------------------------------------------
  describe('Farming Activity Tracker', () => {
    it('records a completed farming activity', async () => {
      const res = await request(app)
        .post(`/api/farms/${farmAId}/activities`)
        .set('Origin', TEST_ORIGIN)
        .set('Cookie', userACookie)
        .send({
          cropCycleId: cycleAId,
          category: 'sowing',
          activityDate: '2026-11-05',
          title: 'Direct Drill Sowing with Happy Seeder',
          notes: 'Zero-till sowing in paddy stubble. Soil moisture optimal.',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.category).toBe('sowing');
      expect(res.body.data.activityDate).toBe('2026-11-05');
      expect(res.body.data.cropCycle.cropName).toBe('Wheat');

      activityAId = res.body.data.id;
    });

    it('rejects activity with invalid category enum', async () => {
      const res = await request(app)
        .post(`/api/farms/${farmAId}/activities`)
        .set('Origin', TEST_ORIGIN)
        .set('Cookie', userACookie)
        .send({
          category: 'magical_fertilizing',
          activityDate: '2026-11-05',
          title: 'Test',
        });

      expect(res.status).toBe(400);
    });

    it('lists activities filtered by category', async () => {
      const res = await request(app)
        .get(`/api/farms/${farmAId}/activities?category=sowing`)
        .set('Cookie', userACookie);

      expect(res.status).toBe(200);
      expect(res.body.activities.length).toBe(1);
      expect(res.body.activities[0].id).toBe(activityAId);

      const emptyRes = await request(app)
        .get(`/api/farms/${farmAId}/activities?category=irrigation`)
        .set('Cookie', userACookie);
      expect(emptyRes.body.activities.length).toBe(0);
    });

    it('edits an existing activity', async () => {
      const res = await request(app)
        .patch(`/api/farms/${farmAId}/activities/${activityAId}`)
        .set('Origin', TEST_ORIGIN)
        .set('Cookie', userACookie)
        .send({
          title: 'Direct Drill Sowing with Happy Seeder (Complete)',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toContain('(Complete)');
    });

    it('deletes an activity record', async () => {
      // Create a temporary activity to delete
      const tempRes = await request(app)
        .post(`/api/farms/${farmAId}/activities`)
        .set('Origin', TEST_ORIGIN)
        .set('Cookie', userACookie)
        .send({
          category: 'weeding',
          activityDate: '2026-11-15',
          title: 'Manual inter-row weeding',
        });
      const tempId = tempRes.body.data.id;

      const delRes = await request(app)
        .delete(`/api/farms/${farmAId}/activities/${tempId}`)
        .set('Origin', TEST_ORIGIN)
        .set('Cookie', userACookie);

      expect(delRes.status).toBe(200);
      expect(delRes.body.status).toBe('success');
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Farm Task Planner
  // ---------------------------------------------------------------------------
  describe('Farm Task Planner', () => {
    it('creates an upcoming farming task', async () => {
      const res = await request(app)
        .post(`/api/farms/${farmAId}/tasks`)
        .set('Origin', TEST_ORIGIN)
        .set('Cookie', userACookie)
        .send({
          cropCycleId: cycleAId,
          category: 'irrigation',
          title: 'First CRI Irrigation (Crown Root Stage)',
          description: 'Apply light irrigation at 21 DAS to ensure crown root anchorage.',
          dueDate: '2026-11-26',
          status: 'pending',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.title).toBe('First CRI Irrigation (Crown Root Stage)');
      expect(res.body.data.status).toBe('pending');
      expect(res.body.data.completedAt).toBeNull();

      taskAId = res.body.data.id;
    });

    it('lists tasks with status filter', async () => {
      const res = await request(app)
        .get(`/api/farms/${farmAId}/tasks?status=pending`)
        .set('Cookie', userACookie);

      expect(res.status).toBe(200);
      expect(res.body.tasks.length).toBeGreaterThanOrEqual(1);
      expect(res.body.tasks.some((t: { id: string }) => t.id === taskAId)).toBe(true);
    });

    it('marks a task as completed and sets completedAt timestamp', async () => {
      const res = await request(app)
        .patch(`/api/farms/${farmAId}/tasks/${taskAId}`)
        .set('Origin', TEST_ORIGIN)
        .set('Cookie', userACookie)
        .send({ status: 'completed' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('completed');
      expect(res.body.data.completedAt).toBeDefined();
      expect(res.body.data.completedAt).not.toBeNull();
    });

    it('reopens a completed task and clears completedAt', async () => {
      const res = await request(app)
        .patch(`/api/farms/${farmAId}/tasks/${taskAId}`)
        .set('Origin', TEST_ORIGIN)
        .set('Cookie', userACookie)
        .send({ status: 'pending' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('pending');
      expect(res.body.data.completedAt).toBeNull();
    });

    it('correctly marks an overdue task when dueDate is past', async () => {
      // Create past task
      const pastRes = await request(app)
        .post(`/api/farms/${farmAId}/tasks`)
        .set('Origin', TEST_ORIGIN)
        .set('Cookie', userACookie)
        .send({
          category: 'soil_preparation',
          title: 'Laser levelling plot A',
          dueDate: '2026-09-01', // Definitely in the past
          status: 'pending',
        });

      const listRes = await request(app)
        .get(`/api/farms/${farmAId}/tasks?status=pending`)
        .set('Cookie', userACookie);

      const pastTask = listRes.body.tasks.find((t: { id: string }) => t.id === pastRes.body.data.id);
      expect(pastTask).toBeDefined();
      expect(pastTask.isOverdue).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // 6. Farm Dashboard Overview & Calendar
  // ---------------------------------------------------------------------------
  describe('Farm Overview & Calendar', () => {
    it('calculates comprehensive dashboard metrics for active user', async () => {
      const res = await request(app)
        .get('/api/farms/overview')
        .set('Cookie', userACookie);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.activeFarmsCount).toBeGreaterThanOrEqual(1);
      expect(res.body.data.activeCropCyclesCount).toBeGreaterThanOrEqual(1);
      expect(res.body.data.pendingTasksCount).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(res.body.data.recentActivities)).toBe(true);
      expect(Array.isArray(res.body.data.upcomingTasks)).toBe(true);
    });

    it('aggregates calendar events for target year and month', async () => {
      const res = await request(app)
        .get('/api/farms/calendar?year=2026&month=11')
        .set('Cookie', userACookie);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.year).toBe(2026);
      expect(res.body.data.month).toBe(11);
      expect(Array.isArray(res.body.data.tasks)).toBe(true);
      expect(Array.isArray(res.body.data.activities)).toBe(true);
      expect(Array.isArray(res.body.data.cropCycleMilestones)).toBe(true);

      // Verify the activity logged on 2026-11-05 is returned
      const novActivity = res.body.data.activities.find((a: { id: string }) => a.id === activityAId);
      expect(novActivity).toBeDefined();

      // Verify sowing milestone on 2026-11-05 is returned
      const sowMilestone = res.body.data.cropCycleMilestones.find(
        (m: { date: string; type: string }) => m.date === '2026-11-05' && m.type === 'sowing'
      );
      expect(sowMilestone).toBeDefined();
      expect(sowMilestone.cropName).toBe('Wheat');
    });
  });

  // ---------------------------------------------------------------------------
  // 7. Data Isolation & Multi-Tenant Authorization Security
  // ---------------------------------------------------------------------------
  describe('Data Isolation & Security Enforcement', () => {
    beforeAll(async () => {
      // User B creates Farm B
      const res = await request(app)
        .post('/api/farms')
        .set('Origin', TEST_ORIGIN)
        .set('Cookie', userBCookie)
        .send({
          name: 'Balram Organic Orchards',
          state: 'Haryana',
          district: 'Karnal',
        });
      farmBId = res.body.data.id;
    });

    it('prevents User B from accessing User A farm details (404)', async () => {
      const res = await request(app)
        .get(`/api/farms/${farmAId}`)
        .set('Cookie', userBCookie);

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/not found or inaccessible/i);
    });

    it('prevents User B from editing User A farm (404)', async () => {
      const res = await request(app)
        .patch(`/api/farms/${farmAId}`)
        .set('Origin', TEST_ORIGIN)
        .set('Cookie', userBCookie)
        .send({ name: 'Hacked by User B' });

      expect(res.status).toBe(404);
    });

    it('prevents User B from archiving User A farm (404)', async () => {
      const res = await request(app)
        .post(`/api/farms/${farmAId}/archive`)
        .set('Origin', TEST_ORIGIN)
        .set('Cookie', userBCookie);

      expect(res.status).toBe(404);
    });

    it('prevents User B from adding crop cycle to User A farm (404)', async () => {
      const res = await request(app)
        .post(`/api/farms/${farmAId}/cycles`)
        .set('Origin', TEST_ORIGIN)
        .set('Cookie', userBCookie)
        .send({
          cropId: 'crop-rice',
          sowingDate: '2026-06-15',
        });

      expect(res.status).toBe(404);
    });

    it('prevents User B from modifying User A activity (404)', async () => {
      const res = await request(app)
        .patch(`/api/farms/${farmAId}/activities/${activityAId}`)
        .set('Origin', TEST_ORIGIN)
        .set('Cookie', userBCookie)
        .send({ title: 'Tampered title' });

      expect(res.status).toBe(404);
    });

    it('prevents User B from deleting User A activity (404)', async () => {
      const res = await request(app)
        .delete(`/api/farms/${farmAId}/activities/${activityAId}`)
        .set('Origin', TEST_ORIGIN)
        .set('Cookie', userBCookie);

      expect(res.status).toBe(404);
    });

    it('prevents User B from modifying User A task (404)', async () => {
      const res = await request(app)
        .patch(`/api/farms/${farmAId}/tasks/${taskAId}`)
        .set('Origin', TEST_ORIGIN)
        .set('Cookie', userBCookie)
        .send({ title: 'Tampered task' });

      expect(res.status).toBe(404);
    });

    it('rejects cross-farm crop cycle association (linking User A cycle from User B farm)', async () => {
      // User B tries to record activity on Farm B referencing User A's cropCycleAId
      const res = await request(app)
        .post(`/api/farms/${farmBId}/activities`)
        .set('Origin', TEST_ORIGIN)
        .set('Cookie', userBCookie)
        .send({
          cropCycleId: cycleAId, // Belongs to Farm A!
          category: 'irrigation',
          activityDate: '2026-11-06',
          title: 'Cross-farm leak attempt',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('does not exist on farm');
    });

    it('ensures User B overview isolates their own metrics completely', async () => {
      const res = await request(app)
        .get('/api/farms/overview')
        .set('Cookie', userBCookie);

      expect(res.status).toBe(200);
      expect(res.body.data.activeFarmsCount).toBe(1);
      expect(res.body.data.activeCropCyclesCount).toBe(0); // None created for User B
      expect(res.body.data.pendingTasksCount).toBe(0);
    });
  });
});
