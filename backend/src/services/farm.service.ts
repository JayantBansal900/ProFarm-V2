import { prisma } from '../lib/prisma';
import { Prisma, PrismaClient, CropCycle } from '@prisma/client';
import { findCropByIdOrSlug } from './advisor.service';
import { paginationWindow, paginationMetadata } from '../validators/pagination.validator';
import { isValidDateOnly } from '../validators/date.validator';
import {
  CreateFarmInput,
  UpdateFarmInput,
  CreateCropCycleInput,
  UpdateCropCycleInput,
  CreateFarmActivityInput,
  UpdateFarmActivityInput,
  CreateFarmTaskInput,
  UpdateFarmTaskInput,
  createCropCycleBodySchema,
  updateCropCycleBodySchema,
  cropCycleTimelineSchema,
  calendarQuerySchema,
  createFarmActivityBodySchema,
  updateFarmActivityBodySchema,
  createFarmTaskBodySchema,
  updateFarmTaskBodySchema,
} from '../validators/farm.validator';

// ---------------------------------------------------------------------------
// Custom Errors
// ---------------------------------------------------------------------------

export class NotFoundError extends Error {
  public statusCode = 404;
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends Error {
  public statusCode = 400;
  constructor(message: string, public readonly field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class ConflictError extends Error {
  public statusCode = 409;
  constructor() {
    super('Crop-cycle update conflicted with another operation or timed out. Reload and retry.');
    this.name = 'ConflictError';
  }
}

export class FarmArchivedError extends Error {
  public statusCode = 409;
  constructor() {
    super('This farm is archived. Restore it before making changes.');
    this.name = 'FarmArchivedError';
  }
}

export class ForbiddenError extends Error {
  public statusCode = 403;
  constructor(message: string) {
    super(message);
    this.name = 'ForbiddenError';
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function ensureFarmOwnership(
  farmId: string, userId: string, database: Pick<PrismaClient, 'farm'> = prisma
) {
  const farm = await database.farm.findFirst({
    where: {
      id: farmId,
      userId,
    },
  });

  if (!farm) {
    throw new NotFoundError('Farm not found or inaccessible');
  }

  return farm;
}

/**
 * Ownership check for write operations: archived farms are read-only history
 * and must be restored before their details, cycles, activities or tasks change.
 */
export async function ensureWritableFarm(
  farmId: string, userId: string, database: Pick<PrismaClient, 'farm'> = prisma
) {
  const farm = await ensureFarmOwnership(farmId, userId, database);
  if (farm.isArchived) {
    throw new FarmArchivedError();
  }
  return farm;
}

export async function ensureCropCycleBelongsToFarm(
  cropCycleId: string, farmId: string, database: Pick<PrismaClient, 'cropCycle'> = prisma
) {
  const cycle = await database.cropCycle.findFirst({
    where: {
      id: cropCycleId,
      farmId,
    },
  });

  if (!cycle) {
    throw new ValidationError(
      `Crop cycle "${cropCycleId}" does not exist on farm "${farmId}"`
    );
  }

  return cycle;
}

// ---------------------------------------------------------------------------
// Farm CRUD
// ---------------------------------------------------------------------------

export async function createFarm(userId: string, input: CreateFarmInput) {
  return prisma.farm.create({
    data: {
      userId,
      name: input.name,
      state: input.state || null,
      district: input.district || null,
      village: input.village || null,
      pincode: input.pincode || null,
      area: input.area !== undefined ? input.area : null,
      areaUnit: input.areaUnit || 'acres',
      soilType: input.soilType || null,
      notes: input.notes || null,
      isArchived: false,
    },
  });
}

export async function getFarms(
  userId: string,
  includeArchived = false,
  page = 1,
  limit = 20
) {
  const window = paginationWindow({ page, limit });
  const skip = window.skip;

  const where = {
    userId,
    ...(includeArchived ? {} : { isArchived: false }),
  };

  const [farms, total] = await prisma.$transaction([
    prisma.farm.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      skip,
      take: limit,
      include: {
        _count: {
          select: {
            cropCycles: { where: { status: 'active' } },
            tasks: { where: { status: 'pending' } },
            activities: true,
          },
        },
      },
    }),
    prisma.farm.count({ where }),
  ]);

  return {
    farms: farms.map((f) => ({
      ...f,
      activeCropCyclesCount: f._count.cropCycles,
      pendingTasksCount: f._count.tasks,
      totalActivitiesCount: f._count.activities,
      _count: undefined,
    })),
    pagination: paginationMetadata(total, page, limit),
  };
}

export async function getFarmById(userId: string, farmId: string) {
  await ensureFarmOwnership(farmId, userId);

  const farm = await prisma.farm.findUnique({
    where: { id: farmId },
    include: {
      cropCycles: {
        orderBy: [{ sowingDate: 'desc' }, { id: 'asc' }],
      },
      tasks: {
        where: { status: 'pending' },
        orderBy: [{ dueDate: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
        take: 10,
      },
      activities: {
        orderBy: [{ activityDate: 'desc' }, { createdAt: 'desc' }, { id: 'asc' }],
        take: 10,
      },
      _count: {
        select: {
          cropCycles: true,
          tasks: true,
          activities: true,
        },
      },
    },
  });

  if (!farm) {
    throw new NotFoundError('Farm not found');
  }

  const today = getTodayDateString();
  const [overdueTasksCount, pendingTasksCount] = await prisma.$transaction([
    prisma.farmTask.count({ where: { farmId, status: 'pending', dueDate: { lt: today } } }),
    prisma.farmTask.count({ where: { farmId, status: 'pending' } }),
  ]);

  return {
    ...farm,
    overdueTasksCount,
    pendingTasksCount,
    totalCropCyclesCount: farm._count.cropCycles,
    totalTasksCount: farm._count.tasks,
    totalActivitiesCount: farm._count.activities,
    _count: undefined,
  };
}

export async function updateFarm(userId: string, farmId: string, input: UpdateFarmInput) {
  await ensureWritableFarm(farmId, userId);

  return prisma.farm.update({
    where: { id: farmId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.state !== undefined ? { state: input.state } : {}),
      ...(input.district !== undefined ? { district: input.district } : {}),
      ...(input.village !== undefined ? { village: input.village } : {}),
      ...(input.pincode !== undefined ? { pincode: input.pincode } : {}),
      ...(input.area !== undefined ? { area: input.area } : {}),
      ...(input.areaUnit !== undefined ? { areaUnit: input.areaUnit } : {}),
      ...(input.soilType !== undefined ? { soilType: input.soilType } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    },
  });
}

export async function archiveFarm(userId: string, farmId: string) {
  await ensureFarmOwnership(farmId, userId);

  return prisma.farm.update({
    where: { id: farmId },
    data: {
      isArchived: true,
      archivedAt: new Date(),
    },
  });
}

export async function restoreFarm(userId: string, farmId: string) {
  await ensureFarmOwnership(farmId, userId);

  return prisma.farm.update({
    where: { id: farmId },
    data: {
      isArchived: false,
      archivedAt: null,
    },
  });
}

// ---------------------------------------------------------------------------
// Crop Cycles CRUD
// ---------------------------------------------------------------------------

async function cycleTransaction<T>(operation: (transaction: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  try {
    return await prisma.$transaction(operation, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && ['P2034', 'P2028', 'P1008'].includes(error.code)) {
      throw new ConflictError();
    }
    throw error;
  }
}

function requireCatalogCrop(identifier: string) {
  // Retain existing case-insensitive ID/slug aliases, always persist catalog identity.
  const crop = findCropByIdOrSlug(identifier);
  if (!crop) throw new ValidationError(
    `Crop identifier "${identifier}" not found in curated crop knowledge base`, 'cropId'
  );
  return crop;
}

export async function createCropCycle(
  userId: string,
  farmId: string,
  input: CreateCropCycleInput
): Promise<CropCycle> {
  const parsed = createCropCycleBodySchema.parse(input);
  return cycleTransaction(async (transaction) => {
    await ensureWritableFarm(farmId, userId, transaction);
    const crop = requireCatalogCrop(parsed.cropId);
    return transaction.cropCycle.create({
      data: {
        farmId,
        cropId: crop.id,
        cropName: crop.name,
        variety: parsed.variety || null,
        sowingDate: parsed.sowingDate,
        expectedHarvestDate: parsed.expectedHarvestDate ?? null,
        actualHarvestDate: parsed.actualHarvestDate ?? null,
        status: parsed.status,
        cultivatedArea: parsed.cultivatedArea ?? null,
        areaUnit: parsed.areaUnit || 'acres',
        notes: parsed.notes || null,
      },
    });
  });
}

export async function getCropCycles(userId: string, farmId: string) {
  return (await getCropCycleCollection(userId, farmId)).data;
}

export async function getCropCycleCollection(
  userId: string, farmId: string, query: { page?: number; limit?: number } = {}
) {
  await ensureFarmOwnership(farmId, userId);
  const window = query.page !== undefined || query.limit !== undefined ? paginationWindow(query) : undefined;
  const [cycles, total] = await prisma.$transaction([prisma.cropCycle.findMany({
    where: { farmId },
    orderBy: [{ sowingDate: 'desc' }, { createdAt: 'desc' }, { id: 'asc' }],
    ...(window ? { skip: window.skip, take: window.limit } : {}),
    include: {
      _count: {
        select: {
          activities: true,
          tasks: true,
        },
      },
    },
  }), prisma.cropCycle.count({ where: { farmId } })]);
  return {
    count: cycles.length,
    data: cycles,
    ...(window ? { pagination: paginationMetadata(total, window.page, window.limit) } : {}),
  };
}

export async function updateCropCycle(
  userId: string,
  farmId: string,
  cycleId: string,
  input: UpdateCropCycleInput
): Promise<CropCycle> {
  const parsed = updateCropCycleBodySchema.parse(input);
  return cycleTransaction(async (transaction) => {
    await ensureWritableFarm(farmId, userId, transaction);
    const existing = await ensureCropCycleBelongsToFarm(cycleId, farmId, transaction);
    cropCycleTimelineSchema.parse({
      sowingDate: parsed.sowingDate ?? existing.sowingDate,
      expectedHarvestDate: parsed.expectedHarvestDate !== undefined ? parsed.expectedHarvestDate : existing.expectedHarvestDate,
      actualHarvestDate: parsed.actualHarvestDate !== undefined ? parsed.actualHarvestDate : existing.actualHarvestDate,
    });
    const crop = parsed.cropId !== undefined ? requireCatalogCrop(parsed.cropId) : undefined;

    return transaction.cropCycle.update({
      where: { id: cycleId },
      data: {
        ...(crop ? { cropId: crop.id, cropName: crop.name } : {}),
        ...(parsed.variety !== undefined ? { variety: parsed.variety } : {}),
        ...(parsed.sowingDate !== undefined ? { sowingDate: parsed.sowingDate } : {}),
        ...(parsed.expectedHarvestDate !== undefined
          ? { expectedHarvestDate: parsed.expectedHarvestDate }
          : {}),
        ...(parsed.actualHarvestDate !== undefined
          ? { actualHarvestDate: parsed.actualHarvestDate }
          : {}),
        ...(parsed.status !== undefined ? { status: parsed.status } : {}),
        ...(parsed.cultivatedArea !== undefined
          ? { cultivatedArea: parsed.cultivatedArea }
          : {}),
        ...(parsed.areaUnit !== undefined ? { areaUnit: parsed.areaUnit } : {}),
        ...(parsed.notes !== undefined ? { notes: parsed.notes } : {}),
      },
    });
  });
}

// ---------------------------------------------------------------------------
// Farm Activities CRUD
// ---------------------------------------------------------------------------

export async function createActivity(
  userId: string,
  farmId: string,
  input: CreateFarmActivityInput
) {
  input = createFarmActivityBodySchema.parse(input);
  await ensureWritableFarm(farmId, userId);

  if (input.cropCycleId && input.cropCycleId.trim().length > 0) {
    await ensureCropCycleBelongsToFarm(input.cropCycleId, farmId);
  }

  return prisma.farmActivity.create({
    data: {
      farmId,
      cropCycleId: input.cropCycleId?.trim() || null,
      category: input.category,
      activityDate: input.activityDate,
      title: input.title,
      notes: input.notes || null,
    },
    include: {
      cropCycle: {
        select: {
          id: true,
          cropName: true,
          variety: true,
        },
      },
    },
  });
}

export async function getActivities(
  userId: string,
  farmId: string,
  query: { category?: string; cropCycleId?: string; page?: number; limit?: number }
) {
  await ensureFarmOwnership(farmId, userId);

  const { page, limit, skip } = paginationWindow(query);

  const where = {
    farmId,
    ...(query.category ? { category: query.category } : {}),
    ...(query.cropCycleId ? { cropCycleId: query.cropCycleId } : {}),
  };

  const [activities, total] = await prisma.$transaction([
    prisma.farmActivity.findMany({
      where,
      orderBy: [{ activityDate: 'desc' }, { createdAt: 'desc' }, { id: 'asc' }],
      skip,
      take: limit,
      include: {
        cropCycle: {
          select: {
            id: true,
            cropName: true,
            variety: true,
          },
        },
      },
    }),
    prisma.farmActivity.count({ where }),
  ]);

  return {
    activities,
    pagination: paginationMetadata(total, page, limit),
  };
}

export async function updateActivity(
  userId: string,
  farmId: string,
  activityId: string,
  input: UpdateFarmActivityInput
) {
  input = updateFarmActivityBodySchema.parse(input);
  await ensureWritableFarm(farmId, userId);

  const existing = await prisma.farmActivity.findFirst({
    where: { id: activityId, farmId },
  });

  if (!existing) {
    throw new NotFoundError('Activity not found on this farm');
  }

  if (input.cropCycleId && input.cropCycleId.trim().length > 0) {
    await ensureCropCycleBelongsToFarm(input.cropCycleId, farmId);
  }

  return prisma.farmActivity.update({
    where: { id: activityId },
    data: {
      ...(input.category !== undefined ? { category: input.category } : {}),
      ...(input.activityDate !== undefined ? { activityDate: input.activityDate } : {}),
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
      ...(input.cropCycleId !== undefined
        ? { cropCycleId: input.cropCycleId?.trim() || null }
        : {}),
    },
    include: {
      cropCycle: {
        select: {
          id: true,
          cropName: true,
          variety: true,
        },
      },
    },
  });
}

export async function deleteActivity(
  userId: string,
  farmId: string,
  activityId: string
) {
  await ensureWritableFarm(farmId, userId);

  const existing = await prisma.farmActivity.findFirst({
    where: { id: activityId, farmId },
  });

  if (!existing) {
    throw new NotFoundError('Activity not found on this farm');
  }

  await prisma.farmActivity.delete({
    where: { id: activityId },
  });

  return { success: true };
}

// ---------------------------------------------------------------------------
// Farm Tasks CRUD
// ---------------------------------------------------------------------------

export async function createTask(
  userId: string,
  farmId: string,
  input: CreateFarmTaskInput
) {
  input = createFarmTaskBodySchema.parse(input);
  await ensureWritableFarm(farmId, userId);

  if (input.cropCycleId && input.cropCycleId.trim().length > 0) {
    await ensureCropCycleBelongsToFarm(input.cropCycleId, farmId);
  }

  return prisma.farmTask.create({
    data: {
      farmId,
      cropCycleId: input.cropCycleId?.trim() || null,
      category: input.category,
      title: input.title,
      description: input.description || null,
      dueDate: input.dueDate,
      status: input.status || 'pending',
      completedAt: input.status === 'completed' ? new Date() : null,
    },
    include: {
      cropCycle: {
        select: {
          id: true,
          cropName: true,
          variety: true,
        },
      },
    },
  });
}

export async function getTasks(
  userId: string,
  farmId: string,
  query: { status?: 'pending' | 'completed' | 'all'; category?: string; cropCycleId?: string; page?: number; limit?: number }
) {
  await ensureFarmOwnership(farmId, userId);

  const { page, limit, skip } = paginationWindow(query);

  const where = {
    farmId,
    ...(query.status && query.status !== 'all' ? { status: query.status } : {}),
    ...(query.category ? { category: query.category } : {}),
    ...(query.cropCycleId ? { cropCycleId: query.cropCycleId } : {}),
  };

  const [tasks, total] = await prisma.$transaction([
    prisma.farmTask.findMany({
      where,
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
      skip,
      take: limit,
      include: {
        cropCycle: {
          select: {
            id: true,
            cropName: true,
            variety: true,
          },
        },
      },
    }),
    prisma.farmTask.count({ where }),
  ]);

  const today = getTodayDateString();

  return {
    tasks: tasks.map((t) => ({
      ...t,
      isOverdue: t.status === 'pending' && t.dueDate < today,
    })),
    pagination: paginationMetadata(total, page, limit),
  };
}

export async function updateTask(
  userId: string,
  farmId: string,
  taskId: string,
  input: UpdateFarmTaskInput
) {
  input = updateFarmTaskBodySchema.parse(input);
  await ensureWritableFarm(farmId, userId);

  const existing = await prisma.farmTask.findFirst({
    where: { id: taskId, farmId },
  });

  if (!existing) {
    throw new NotFoundError('Task not found on this farm');
  }

  if (input.cropCycleId && input.cropCycleId.trim().length > 0) {
    await ensureCropCycleBelongsToFarm(input.cropCycleId, farmId);
  }

  let completedAtUpdate: { completedAt?: Date | null } = {};
  if (input.status !== undefined) {
    if (input.status === 'completed' && existing.status !== 'completed') {
      completedAtUpdate = { completedAt: new Date() };
    } else if (input.status === 'pending') {
      completedAtUpdate = { completedAt: null };
    }
  }

  const updated = await prisma.farmTask.update({
    where: { id: taskId },
    data: {
      ...completedAtUpdate,
      ...(input.category !== undefined ? { category: input.category } : {}),
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.dueDate !== undefined ? { dueDate: input.dueDate } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.cropCycleId !== undefined
        ? { cropCycleId: input.cropCycleId?.trim() || null }
        : {}),
    },
    include: {
      cropCycle: {
        select: {
          id: true,
          cropName: true,
          variety: true,
        },
      },
    },
  });

  const today = getTodayDateString();

  return {
    ...updated,
    isOverdue: updated.status === 'pending' && updated.dueDate < today,
  };
}

// ---------------------------------------------------------------------------
// Overview & Dashboard Aggregations
// ---------------------------------------------------------------------------

export async function getFarmsOverview(userId: string) {
  const farm = { userId, isArchived: false };
  const today = getTodayDateString();

  const [
    activeFarmsCount,
    activeCropCyclesCount,
    pendingTasksCount,
    overdueTasksCount,
    recentActivities,
    upcomingTasks,
  ] = await prisma.$transaction([
    prisma.farm.count({ where: farm }),
    prisma.cropCycle.count({
      where: {
        farm,
        status: 'active',
      },
    }),
    prisma.farmTask.count({
      where: {
        farm,
        status: 'pending',
      },
    }),
    prisma.farmTask.count({
      where: {
        farm,
        status: 'pending',
        dueDate: { lt: today },
      },
    }),
    prisma.farmActivity.findMany({
      where: { farm },
      orderBy: [{ activityDate: 'desc' }, { createdAt: 'desc' }, { id: 'asc' }],
      take: 5,
      include: {
        farm: { select: { id: true, name: true } },
        cropCycle: { select: { id: true, cropName: true } },
      },
    }),
    prisma.farmTask.findMany({
      where: {
        farm,
        status: 'pending',
      },
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
      take: 5,
      include: {
        farm: { select: { id: true, name: true } },
        cropCycle: { select: { id: true, cropName: true } },
      },
    }),
  ]);

  return {
    activeFarmsCount,
    activeCropCyclesCount,
    pendingTasksCount,
    overdueTasksCount,
    recentActivities,
    upcomingTasks: upcomingTasks.map((t) => ({
      ...t,
      isOverdue: t.dueDate < today,
    })),
  };
}

// ---------------------------------------------------------------------------
// Calendar Aggregations
// ---------------------------------------------------------------------------

export async function getCalendarEvents(
  userId: string,
  year: number,
  month: number,
  farmId?: string
) {
  calendarQuerySchema.parse({ year, month, farmId });
  if (farmId) {
    await ensureFarmOwnership(farmId, userId);
  }
  // Preserve history: default excludes archived farms; an explicit owned farm
  // includes its history. Cancelled cycles and completed tasks remain visible.
  const farm = { userId, ...(farmId ? { id: farmId } : { isArchived: false }) };
  const monthStr = String(month).padStart(2, '0');
  const monthPrefix = `${year}-${monthStr}`;
  const startDate = `${monthPrefix}-01`;
  const nextMonth = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const dateRange = { gte: startDate, lt: nextMonth };
  const inMonth = (date: string) => isValidDateOnly(date) && date >= startDate && date < nextMonth;

  const today = getTodayDateString();

  // Complete month, no silent result cap; relational ownership avoids a large
  // farm-ID parameter list and all three collections share one read snapshot.
  const [tasks, activities, cropCycles] = await prisma.$transaction([
    prisma.farmTask.findMany({
      where: {
        farm,
        dueDate: dateRange,
      },
      orderBy: [{ dueDate: 'asc' }, { id: 'asc' }],
      include: {
        farm: { select: { id: true, name: true } },
        cropCycle: { select: { id: true, cropName: true } },
      },
    }),
    prisma.farmActivity.findMany({
      where: {
        farm,
        activityDate: dateRange,
      },
      orderBy: [{ activityDate: 'asc' }, { id: 'asc' }],
      include: {
        farm: { select: { id: true, name: true } },
        cropCycle: { select: { id: true, cropName: true } },
      },
    }),
    prisma.cropCycle.findMany({
      where: {
        farm,
        OR: [
          { sowingDate: dateRange },
          { expectedHarvestDate: dateRange },
          { actualHarvestDate: dateRange },
        ],
      },
      include: {
        farm: { select: { id: true, name: true } },
      },
    }),
  ]);

  const milestones: Array<{
    id: string;
    date: string;
    title: string;
    type: 'sowing' | 'harvest';
    harvestKind?: 'expected' | 'actual';
    cropName: string;
    farmName: string;
    farmId: string;
    cycleId: string;
  }> = [];

  for (const c of cropCycles) {
    if (inMonth(c.sowingDate)) {
      milestones.push({
        id: `milestone-sow-${c.id}`,
        date: c.sowingDate,
        title: `Sowing: ${c.cropName}${c.variety ? ` (${c.variety})` : ''}`,
        type: 'sowing',
        cropName: c.cropName,
        farmName: c.farm.name,
        farmId: c.farmId,
        cycleId: c.id,
      });
    }
    if (c.expectedHarvestDate && inMonth(c.expectedHarvestDate)) {
      milestones.push({
        id: `milestone-harv-${c.id}`,
        date: c.expectedHarvestDate,
        title: `Expected Harvest: ${c.cropName}`,
        type: 'harvest',
        harvestKind: 'expected',
        cropName: c.cropName,
        farmName: c.farm.name,
        farmId: c.farmId,
        cycleId: c.id,
      });
    }
    if (c.actualHarvestDate && inMonth(c.actualHarvestDate)) {
      milestones.push({
        id: `milestone-actual-harv-${c.id}`,
        date: c.actualHarvestDate,
        title: `Actual Harvest: ${c.cropName}`,
        type: 'harvest',
        harvestKind: 'actual',
        cropName: c.cropName,
        farmName: c.farm.name,
        farmId: c.farmId,
        cycleId: c.id,
      });
    }
  }
  milestones.sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  const invalidDateCounts = {
    tasks: tasks.filter((t) => !inMonth(t.dueDate)).length,
    activities: activities.filter((a) => !inMonth(a.activityDate)).length,
    milestones: cropCycles.reduce((count, cycle) => count +
      [cycle.sowingDate, cycle.expectedHarvestDate, cycle.actualHarvestDate].filter((date) =>
        date && date >= startDate && date < nextMonth && !isValidDateOnly(date)).length, 0),
  };

  return {
    year,
    month,
    tasks: tasks.filter((t) => inMonth(t.dueDate)).map((t) => ({
      ...t,
      isOverdue: t.status === 'pending' && t.dueDate < today,
    })),
    activities: activities.filter((a) => inMonth(a.activityDate)),
    cropCycleMilestones: milestones,
    ...(Object.values(invalidDateCounts).some((count) => count > 0) ? { invalidDateCounts } : {}),
  };
}
