import { Router } from 'express';
import { validateRequest } from '../middleware/validate';
import {
  mandiPricesRequestSchema,
  mandiFilterRequestSchema,
} from '../validators/mandi.validator';
import {
  getMandiPricesController,
  getMandiFiltersController,
  getMandiTrendsController,
} from '../controllers/mandi.controller';

const router = Router();

router.get('/prices', validateRequest(mandiPricesRequestSchema), getMandiPricesController);
router.get('/filters', validateRequest(mandiFilterRequestSchema), getMandiFiltersController);
router.get('/trends', getMandiTrendsController);

export const mandiRoutes = router;
