import { Request, Response, NextFunction } from 'express';
import {
  mandiPriceQuerySchema,
  mandiFilterQuerySchema,
} from '../validators/mandi.validator';
import {
  getMandiPrices,
  getMandiFilters,
} from '../services/mandi.service';

export async function getMandiPricesController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const validatedQuery = mandiPriceQuerySchema.parse(req.query);
    const data = await getMandiPrices(validatedQuery);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}

export async function getMandiFiltersController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const validatedQuery = mandiFilterQuerySchema.parse(req.query);
    const filters = await getMandiFilters(validatedQuery.state);
    res.status(200).json({
      status: 'success',
      ...filters,
    });
  } catch (error) {
    next(error);
  }
}

export async function getMandiTrendsController(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    res.status(200).json({
      status: 'success',
      available: false,
      message: 'Historical time-series trends are unavailable from the daily AGMARKNET snapshot feed.',
      reason:
        'The official data.gov.in resource 9ef84268-d588-465a-a308-a864a43d0070 publishes single-day daily mandi price snapshots (current observation date: 25/10/2026) without multi-day historical archives.',
      recommendations:
        'ProFarm V2 preserves data integrity and does not fabricate historical price points. A dedicated historical mandi warehouse or time-series ingestion worker is recommended for future historical charting.',
    });
  } catch (error) {
    next(error);
  }
}
