import { Request, Response, NextFunction } from 'express';
import { searchLocations, getForecast } from '../services/weather.service';
import {
  LocationSearchInput,
  forecastQueryParamsSchema,
} from '../validators/weather.validator';

export async function searchLocationsController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { query } = req.query as unknown as LocationSearchInput;
    const locations = await searchLocations(query);

    res.status(200).json({
      status: 'success',
      count: locations.length,
      locations,
    });
  } catch (error) {
    next(error);
  }
}

export async function getForecastController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { latitude, longitude, locationName } = forecastQueryParamsSchema.parse(req.query);
    const forecast = await getForecast(latitude, longitude, locationName);

    res.status(200).json({
      status: 'success',
      forecast,
    });
  } catch (error) {
    next(error);
  }
}
