import { Request, Response } from 'express';
import { DatabaseService } from '../services/database.service';

export class HealthController {
  /**
   * GET /api/health
   * Basic application liveness probe
   */
  static getHealth(_req: Request, res: Response): void {
    res.status(200).json({
      status: 'ok',
      service: 'profarm-api',
    });
  }

  /**
   * GET /api/health/database
   * Safe database connectivity probe
   */
  static async getDatabaseHealth(_req: Request, res: Response): Promise<void> {
    const dbStatus = await DatabaseService.checkConnection();

    if (dbStatus.connected) {
      res.status(200).json({
        status: 'ok',
        service: 'profarm-api',
        database: 'connected',
        latencyMs: dbStatus.latencyMs,
      });
    } else {
      res.status(503).json({
        status: 'error',
        service: 'profarm-api',
        database: 'disconnected',
      });
    }
  }
}
