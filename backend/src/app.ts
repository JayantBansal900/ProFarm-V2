import express, { Express } from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { corsMiddleware } from './middleware/cors';
import { apiRateLimiter } from './middleware/rateLimit';
import { csrfProtection } from './middleware/csrf';
import { notFoundHandler, errorHandler } from './middleware/errorHandler';
import { apiRouter } from './routes';
import { env } from './config/env';
import { defaultFrontendDir, hasBuiltFrontend, mountFrontend } from './lib/staticSite';

export interface AppOptions {
  /** Folder holding the built frontend. In production it is found automatically. */
  frontendDir?: string;
}

export function createApp(options: AppOptions = {}): Express {
  const app = express();

  // Behind a hosting proxy, take the visitor's address from X-Forwarded-For. Without this
  // every visitor shares the proxy's IP and one rate-limit bucket.
  app.set('trust proxy', env.TRUST_PROXY);

  const candidate = options.frontendDir ?? (env.NODE_ENV === 'production' ? defaultFrontendDir() : undefined);
  const frontendDir = candidate && hasBuiltFrontend(candidate) ? candidate : undefined;

  // Security HTTP headers. Browsers are told to upgrade http:// subresources only when the
  // site itself is served over https, so a local production test over http still loads.
  const secureSite = env.FRONTEND_ORIGIN.startsWith('https://');
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        'upgrade-insecure-requests': secureSite ? [] : null,
      },
    },
  }));

  // Explicit CORS handling
  app.use(corsMiddleware);

  // Cookie parsing (required for session token)
  app.use(cookieParser());

  // CSRF protection via Origin header validation
  app.use(csrfProtection);

  // Rate limiting for API surface
  app.use('/api', apiRateLimiter);

  // Body parsing with safe size bounds
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: true, limit: '100kb' }));

  // Root health summary (when no frontend is served from here)
  if (!frontendDir) {
    app.get('/', (_req, res) => {
      res.status(200).json({
        name: 'ProFarm API',
        status: 'online',
        version: '0.1.0',
      });
    });
  }

  // Mount API router
  app.use('/api', apiRouter);

  // The built single-page app, served from the same origin as the API
  if (frontendDir) mountFrontend(app, frontendDir);

  // Catch-all 404 handler
  app.use(notFoundHandler);

  // Centralized error handler
  app.use(errorHandler);

  return app;
}

export const app = createApp();
