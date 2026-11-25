import type { PrismaClient } from '@prisma/client';
import { env } from '../config/env';
import { dateInTimeZone } from '../lib/timezone';
import { hashPassword } from './auth.service';

export const DEMO_EMAIL = 'demo.farmer@example.com';
const DAY = 86_400_000;

/**
 * Creates one demo farmer with sample farms, crop cycles, tasks and activities, but only
 * when there are no accounts at all. Free hosting often starts with an empty database after
 * a restart; this makes sure a visitor still finds something to explore.
 */
export async function seedDemoIfEmpty(db: PrismaClient, password: string): Promise<{ seeded: boolean }> {
  if ((await db.user.count()) > 0) return { seeded: false };

  const passwordHash = await hashPassword(password);
  const day = (offset: number) => dateInTimeZone(new Date(Date.now() + offset * DAY), env.APP_TIMEZONE);
  const ago = (days: number) => new Date(Date.now() - days * DAY);

  await db.$transaction(async (tx) => {
    const farmer = await tx.user.create({
      data: { name: 'Demo Farmer', email: DEMO_EMAIL, passwordHash, createdAt: ago(30) },
    });

    const wheatFarm = await tx.farm.create({ data: {
      userId: farmer.id, name: 'Dakha Wheat Block', state: 'Punjab', district: 'Ludhiana', village: 'Dakha',
      pincode: '141102', area: 6, areaUnit: 'acres', soilType: 'Loamy Soil', notes: 'Canal-irrigated, sown with a happy seeder.',
    } });
    const paddyFarm = await tx.farm.create({ data: {
      userId: farmer.id, name: 'Canal-side Paddy Plot', state: 'Punjab', district: 'Ludhiana', village: 'Dakha',
      area: 3, areaUnit: 'acres', soilType: 'Clay Loam Soil',
    } });
    const mustardFarm = await tx.farm.create({ data: {
      userId: farmer.id, name: 'Mustard Strip', state: 'Punjab', district: 'Ludhiana', village: 'Raikot',
      area: 2.5, areaUnit: 'acres', soilType: 'Sandy Loam Soil',
    } });

    const wheat = await tx.cropCycle.create({ data: {
      farmId: wheatFarm.id, cropId: 'crop-wheat', cropName: 'Wheat', variety: 'HD-3086', sowingDate: day(-18),
      expectedHarvestDate: day(137), status: 'active', cultivatedArea: 6, areaUnit: 'acres',
    } });
    await tx.cropCycle.create({ data: {
      farmId: paddyFarm.id, cropId: 'crop-rice', cropName: 'Rice', variety: 'PR-126', sowingDate: day(-160),
      expectedHarvestDate: day(-35), actualHarvestDate: day(-33), status: 'completed', cultivatedArea: 3, areaUnit: 'acres',
    } });
    await tx.cropCycle.create({ data: {
      farmId: paddyFarm.id, cropId: 'crop-wheat', cropName: 'Wheat', sowingDate: day(6),
      expectedHarvestDate: day(160), status: 'planned', cultivatedArea: 3, areaUnit: 'acres',
    } });
    const mustard = await tx.cropCycle.create({ data: {
      farmId: mustardFarm.id, cropId: 'crop-mustard', cropName: 'Mustard', sowingDate: day(-39),
      expectedHarvestDate: day(100), status: 'active', cultivatedArea: 2.5, areaUnit: 'acres',
    } });

    const tasks = [
      { farmId: wheatFarm.id, cropCycleId: wheat.id, category: 'fertilizer', title: 'Apply zinc sulphate', dueDate: day(-4) },
      { farmId: wheatFarm.id, cropCycleId: wheat.id, category: 'irrigation', title: 'First irrigation (CRI stage)', dueDate: day(3) },
      { farmId: wheatFarm.id, cropCycleId: wheat.id, category: 'weeding', title: 'Weed control, 30 days after sowing', dueDate: day(12) },
      { farmId: wheatFarm.id, cropCycleId: wheat.id, category: 'pest_disease', title: 'Scout for yellow rust', dueDate: day(20) },
      { farmId: mustardFarm.id, cropCycleId: mustard.id, category: 'general', title: 'Thin out mustard seedlings', dueDate: day(-1) },
      { farmId: mustardFarm.id, cropCycleId: mustard.id, category: 'irrigation', title: 'Second irrigation', dueDate: day(9) },
      { farmId: paddyFarm.id, category: 'soil_preparation', title: 'Level the field before wheat', dueDate: day(2) },
      { farmId: wheatFarm.id, cropCycleId: wheat.id, category: 'sowing', title: 'Seed treatment', dueDate: day(-19), status: 'completed', completedAt: ago(19) },
    ];
    for (const task of tasks) await tx.farmTask.create({ data: task });

    const activities = [
      { farmId: wheatFarm.id, cropCycleId: wheat.id, category: 'sowing', title: 'Sowed HD-3086 with Happy Seeder', activityDate: day(-18), notes: '45 kg per acre' },
      { farmId: wheatFarm.id, cropCycleId: wheat.id, category: 'fertilizer', title: 'Basal dose: DAP 50 kg per acre', activityDate: day(-18) },
      { farmId: wheatFarm.id, category: 'irrigation', title: 'Pre-sowing irrigation (rauni)', activityDate: day(-26) },
      { farmId: wheatFarm.id, category: 'soil_preparation', title: 'Deep ploughing and levelling', activityDate: day(-31) },
      { farmId: mustardFarm.id, cropCycleId: mustard.id, category: 'sowing', title: 'Sowed mustard in rows', activityDate: day(-39) },
      { farmId: paddyFarm.id, category: 'harvesting', title: 'Harvested paddy (PR-126)', activityDate: day(-33) },
    ];
    for (const activity of activities) await tx.farmActivity.create({ data: activity });
  });

  return { seeded: true };
}
