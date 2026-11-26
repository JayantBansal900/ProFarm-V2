import { Router } from 'express';
import { validateRequest } from '../middleware/validate';
import { advisorRequestSchema } from '../validators/advisor.validator';
import {
  getAdvisorRecommendationsController,
  getAdvisorCropsController,
  getAdvisorSoilsController,
} from '../controllers/advisor.controller';

const router = Router();

router.post(
  '/recommendations',
  validateRequest(advisorRequestSchema),
  getAdvisorRecommendationsController
);

router.get('/crops', getAdvisorCropsController);
router.get('/soils', getAdvisorSoilsController);

export const advisorRoutes = router;
