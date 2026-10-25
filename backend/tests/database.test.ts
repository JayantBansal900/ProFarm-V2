import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';
import { DatabaseService } from '../src/services/database.service';

describe('Database Health & Schema Verification', () => {
  afterAll(async () => {
    // Clean up test records if any exist
    await prisma.farm.deleteMany({
      where: { name: { startsWith: '__test_farm__' } },
    });
    await prisma.user.deleteMany({
      where: { email: { startsWith: '__test_user__' } },
    });
    await prisma.$disconnect();
  });

  it('DatabaseService.checkConnection executes safe query successfully', async () => {
    const result = await DatabaseService.checkConnection();
    expect(result.connected).toBe(true);
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it('GET /api/health/database returns 200 with connected status', async () => {
    const res = await request(app).get('/api/health/database');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('profarm-api');
    expect(res.body.database).toBe('connected');
    expect(typeof res.body.latencyMs).toBe('number');
  });

  it('Verifies User and Farm relationship constraints in Prisma', async () => {
    const testEmail = `__test_user__${Date.now()}@example.com`;

    // Create a User with hashed password placeholder
    const user = await prisma.user.create({
      data: {
        name: 'Test Farmer',
        email: testEmail,
        passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$dummyhashforphase2verification',
      },
    });

    expect(user.id).toBeDefined();
    expect(user.email).toBe(testEmail);

    // Create a Farm associated with the User
    const farm = await prisma.farm.create({
      data: {
        userId: user.id,
        name: '__test_farm__GreenAcres',
        state: 'Punjab',
        district: 'Ludhiana',
        pincode: '141001',
        soilType: 'Loam',
      },
    });

    expect(farm.id).toBeDefined();
    expect(farm.userId).toBe(user.id);

    // Query Farm with relation to User
    const farmWithUser = await prisma.farm.findUnique({
      where: { id: farm.id },
      include: { user: true },
    });

    expect(farmWithUser).not.toBeNull();
    expect(farmWithUser?.user.email).toBe(testEmail);

    // Cascade delete verification
    await prisma.user.delete({
      where: { id: user.id },
    });

    const orphanedFarm = await prisma.farm.findUnique({
      where: { id: farm.id },
    });

    expect(orphanedFarm).toBeNull();
  });
});
