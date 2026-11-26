import { Router } from 'express';
import { validateRequest } from '../middleware/validate';
import { locationSearchSchema, forecastSchema } from '../validators/weather.validator';
import {
  searchLocationsController,
  getForecastController,
} from '../controllers/weather.controller';

const router = Router();

router.get('/locations', validateRequest(locationSearchSchema), searchLocationsController);
router.get('/forecast', validateRequest(forecastSchema), getForecastController);

export const weatherRoutes = router;
