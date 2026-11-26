import { Request, Response, NextFunction } from 'express';
import {
  createFarm,
  getFarms,
  getFarmById,
  updateFarm,
  archiveFarm,
  restoreFarm,
  createCropCycle,
  getCropCycleCollection,
  updateCropCycle,
  createActivity,
  getActivities,
  updateActivity,
  deleteActivity,
  createTask,
  getTasks,
  updateTask,
  getFarmsOverview,
  getCalendarEvents,
  NotFoundError,
  ValidationError,
  ForbiddenError,
  ConflictError,
  FarmArchivedError,
} from '../services/farm.service';
import {
  createFarmBodySchema,
  updateFarmBodySchema,
  farmListQuerySchema,
  createCropCycleBodySchema,
  updateCropCycleBodySchema,
  createFarmActivityBodySchema,
  updateFarmActivityBodySchema,
  activityListQuerySchema,
  createFarmTaskBodySchema,
  updateFarmTaskBodySchema,
  taskListQuerySchema,
  calendarQuerySchema,
  cropCycleListQuerySchema,
} from '../validators/farm.validator';

function handleServiceError(error: unknown, res: Response, next: NextFunction) {
  if (error instanceof NotFoundError) {
    res.status(404).json({ status: 'error', message: error.message });
    return;
  }
  if (error instanceof ValidationError) {
    res.status(400).json({
      status: 'error', message: error.message,
      ...(error.field ? { errors: [{ field: error.field, message: error.message }] } : {}),
    });
    return;
  }
  if (error instanceof ForbiddenError) {
    res.status(403).json({ status: 'error', message: error.message });
    return;
  }
  if (error instanceof ConflictError || error instanceof FarmArchivedError) {
    res.status(409).json({ status: 'error', message: error.message });
    return;
  }
  next(error);
}

// ---------------------------------------------------------------------------
// Farm Handlers
// ---------------------------------------------------------------------------

export async function createFarmController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const body = createFarmBodySchema.parse(req.body);
    const farm = await createFarm(userId, body);
    res.status(201).json({ status: 'success', data: farm });
  } catch (err) {
    handleServiceError(err, res, next);
  }
}

export async function getFarmsController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const query = farmListQuerySchema.parse(req.query);
    const result = await getFarms(userId, query.includeArchived, query.page, query.limit);
    res.status(200).json({ status: 'success', ...result });
  } catch (err) {
    handleServiceError(err, res, next);
  }
}

export async function getFarmByIdController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const farmId = req.params.farmId;
    const farm = await getFarmById(userId, farmId);
    res.status(200).json({ status: 'success', data: farm });
  } catch (err) {
    handleServiceError(err, res, next);
  }
}

export async function updateFarmController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const farmId = req.params.farmId;
    const body = updateFarmBodySchema.parse(req.body);
    const farm = await updateFarm(userId, farmId, body);
    res.status(200).json({ status: 'success', data: farm });
  } catch (err) {
    handleServiceError(err, res, next);
  }
}

export async function archiveFarmController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const farmId = req.params.farmId;
    const farm = await archiveFarm(userId, farmId);
    res.status(200).json({ status: 'success', message: 'Farm archived successfully', data: farm });
  } catch (err) {
    handleServiceError(err, res, next);
  }
}

export async function restoreFarmController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const farmId = req.params.farmId;
    const farm = await restoreFarm(userId, farmId);
    res.status(200).json({ status: 'success', message: 'Farm restored successfully', data: farm });
  } catch (err) {
    handleServiceError(err, res, next);
  }
}

// ---------------------------------------------------------------------------
// Crop Cycle Handlers
// ---------------------------------------------------------------------------

export async function createCropCycleController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const farmId = req.params.farmId;
    const body = createCropCycleBodySchema.parse(req.body);
    const cycle = await createCropCycle(userId, farmId, body);
    res.status(201).json({ status: 'success', data: cycle });
  } catch (err) {
    handleServiceError(err, res, next);
  }
}

export async function getCropCyclesController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const farmId = req.params.farmId;
    const query = cropCycleListQuerySchema.parse(req.query);
    const result = await getCropCycleCollection(userId, farmId, query);
    res.status(200).json({ status: 'success', ...result });
  } catch (err) {
    handleServiceError(err, res, next);
  }
}

export async function updateCropCycleController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const farmId = req.params.farmId;
    const cycleId = req.params.cycleId;
    const body = updateCropCycleBodySchema.parse(req.body);
    const cycle = await updateCropCycle(userId, farmId, cycleId, body);
    res.status(200).json({ status: 'success', data: cycle });
  } catch (err) {
    handleServiceError(err, res, next);
  }
}

// ---------------------------------------------------------------------------
// Activity Handlers
// ---------------------------------------------------------------------------

export async function createActivityController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const farmId = req.params.farmId;
    const body = createFarmActivityBodySchema.parse(req.body);
    const activity = await createActivity(userId, farmId, body);
    res.status(201).json({ status: 'success', data: activity });
  } catch (err) {
    handleServiceError(err, res, next);
  }
}

export async function getActivitiesController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const farmId = req.params.farmId;
    const query = activityListQuerySchema.parse(req.query);
    const result = await getActivities(userId, farmId, query);
    res.status(200).json({ status: 'success', ...result });
  } catch (err) {
    handleServiceError(err, res, next);
  }
}

export async function updateActivityController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const farmId = req.params.farmId;
    const activityId = req.params.activityId;
    const body = updateFarmActivityBodySchema.parse(req.body);
    const activity = await updateActivity(userId, farmId, activityId, body);
    res.status(200).json({ status: 'success', data: activity });
  } catch (err) {
    handleServiceError(err, res, next);
  }
}

export async function deleteActivityController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const farmId = req.params.farmId;
    const activityId = req.params.activityId;
    await deleteActivity(userId, farmId, activityId);
    res.status(200).json({ status: 'success', message: 'Activity deleted successfully' });
  } catch (err) {
    handleServiceError(err, res, next);
  }
}

// ---------------------------------------------------------------------------
// Task Handlers
// ---------------------------------------------------------------------------

export async function createTaskController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const farmId = req.params.farmId;
    const body = createFarmTaskBodySchema.parse(req.body);
    const task = await createTask(userId, farmId, body);
    res.status(201).json({ status: 'success', data: task });
  } catch (err) {
    handleServiceError(err, res, next);
  }
}

export async function getTasksController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const farmId = req.params.farmId;
    const query = taskListQuerySchema.parse(req.query);
    const result = await getTasks(userId, farmId, query);
    res.status(200).json({ status: 'success', ...result });
  } catch (err) {
    handleServiceError(err, res, next);
  }
}

export async function updateTaskController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const farmId = req.params.farmId;
    const taskId = req.params.taskId;
    const body = updateFarmTaskBodySchema.parse(req.body);
    const task = await updateTask(userId, farmId, taskId, body);
    res.status(200).json({ status: 'success', data: task });
  } catch (err) {
    handleServiceError(err, res, next);
  }
}

// ---------------------------------------------------------------------------
// Overview & Calendar Handlers
// ---------------------------------------------------------------------------

export async function getFarmsOverviewController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const overview = await getFarmsOverview(userId);
    res.status(200).json({ status: 'success', data: overview });
  } catch (err) {
    handleServiceError(err, res, next);
  }
}

export async function getCalendarController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const query = calendarQuerySchema.parse(req.query);
    const calendar = await getCalendarEvents(userId, query.year, query.month, query.farmId);
    res.status(200).json({ status: 'success', data: calendar });
  } catch (err) {
    handleServiceError(err, res, next);
  }
}
