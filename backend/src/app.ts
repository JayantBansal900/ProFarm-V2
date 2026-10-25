import express, { Express } from 'express';
import helmet from 'helmet';
import { corsMiddleware } from './middleware/cors';
import { apiRateLimiter } from './middleware/rateLimit';
import { notFoundHandler, errorHandler } from './middleware/errorHandler';
import { apiRouter } from './routes';

export function createApp(): Express {
  const app = express();

  // Security HTTP headers
  app.use(helmet());

  // Explicit CORS handling
  app.use(corsMiddleware);

  // Rate limiting for API surface
  app.use('/api', apiRateLimiter);

  // Body parsing with safe size bounds
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: true, limit: '100kb' }));

  // Root health summary
  app.get('/', (_req, res) => {
    res.status(200).json({
      name: 'ProFarm API',
      status: 'online',
      version: '0.1.0',
    });
  });

  // Mount API router
  app.use('/api', apiRouter);

  // Catch-all 404 handler
  app.use(notFoundHandler);

  // Centralized error handler
  app.use(errorHandler);

  return app;
}

export const app = createApp();
