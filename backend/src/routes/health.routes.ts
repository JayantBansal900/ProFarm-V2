import { Router } from 'express';
import { HealthController } from '../controllers/health.controller';
import { validateRequest } from '../middleware/validate';
import { healthCheckQuerySchema } from '../validators/health.validator';

const router = Router();

router.get('/', validateRequest(healthCheckQuerySchema), HealthController.getHealth);
router.get('/database', HealthController.getDatabaseHealth);

export const healthRoutes = router;
