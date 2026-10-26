import { Router } from 'express';
import { healthRoutes } from './health.routes';
import { authRoutes } from './auth.routes';
import { weatherRoutes } from './weather.routes';
import { mandiRoutes } from './mandi.routes';
import { advisorRoutes } from './advisor.routes';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/weather', weatherRoutes);
router.use('/mandi', mandiRoutes);
router.use('/advisor', advisorRoutes);

export const apiRouter = router;
