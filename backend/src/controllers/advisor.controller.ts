import { Request, Response, NextFunction } from 'express';
import {
  generateAdvisorGuidance,
  getAllCropsSummary,
  getAllSoilsSummary,
} from '../services/advisor.service';
import { advisorRequestBodySchema } from '../validators/advisor.validator';

export async function getAdvisorRecommendationsController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const validatedBody = advisorRequestBodySchema.parse(req.body);
    const guidance = await generateAdvisorGuidance(validatedBody);
    res.status(200).json({
      status: 'success',
      data: guidance,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found in curated knowledge base')) {
      res.status(404).json({
        status: 'error',
        message: error.message,
      });
      return;
    }
    next(error);
  }
}

export async function getAdvisorCropsController(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const crops = getAllCropsSummary();
    res.status(200).json({
      status: 'success',
      count: crops.length,
      crops,
    });
  } catch (error) {
    next(error);
  }
}

export async function getAdvisorSoilsController(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const soils = getAllSoilsSummary();
    res.status(200).json({
      status: 'success',
      count: soils.length,
      soils,
    });
  } catch (error) {
    next(error);
  }
}
