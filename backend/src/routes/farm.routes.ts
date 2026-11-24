import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import {
  createFarmController,
  getFarmsController,
  getFarmByIdController,
  updateFarmController,
  archiveFarmController,
  restoreFarmController,
  createCropCycleController,
  getCropCyclesController,
  updateCropCycleController,
  createActivityController,
  getActivitiesController,
  updateActivityController,
  deleteActivityController,
  createTaskController,
  getTasksController,
  updateTaskController,
  getFarmsOverviewController,
  getCalendarController,
} from '../controllers/farm.controller';

const router = Router();

// Enforce authentication for all farm endpoints
router.use(requireAuth);

// Overview & Calendar routes (placed before parameter routes)
router.get('/overview', getFarmsOverviewController);
router.get('/calendar', getCalendarController);

// Farm CRUD
router.get('/', getFarmsController);
router.post('/', createFarmController);
router.get('/:farmId', getFarmByIdController);
router.patch('/:farmId', updateFarmController);
router.post('/:farmId/archive', archiveFarmController);
router.post('/:farmId/restore', restoreFarmController);

// Crop Cycles
router.get('/:farmId/cycles', getCropCyclesController);
router.post('/:farmId/cycles', createCropCycleController);
router.patch('/:farmId/cycles/:cycleId', updateCropCycleController);

// Activities
router.get('/:farmId/activities', getActivitiesController);
router.post('/:farmId/activities', createActivityController);
router.patch('/:farmId/activities/:activityId', updateActivityController);
router.delete('/:farmId/activities/:activityId', deleteActivityController);

// Tasks
router.get('/:farmId/tasks', getTasksController);
router.post('/:farmId/tasks', createTaskController);
router.patch('/:farmId/tasks/:taskId', updateTaskController);

export const farmRoutes = router;
