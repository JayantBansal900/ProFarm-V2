import { Router } from 'express';
import { healthRoutes } from './health.routes';
import { authRoutes } from './auth.routes';
import { weatherRoutes } from './weather.routes';
import { mandiRoutes } from './mandi.routes';
import { advisorRoutes } from './advisor.routes';
import { farmRoutes } from './farm.routes';
import { adminRoutes } from './admin.routes';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/weather', weatherRoutes);
router.use('/mandi', mandiRoutes);
router.use('/advisor', advisorRoutes);
router.use('/farms', farmRoutes);
router.use('/admin', adminRoutes);

export const apiRouter = router;
