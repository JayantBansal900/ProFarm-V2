import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Origin-based CSRF protection.
 *
 * For all state-changing requests (POST, PUT, PATCH, DELETE) we verify that
 * the `Origin` header matches FRONTEND_ORIGIN.  Combined with SameSite=Lax
 * cookies and a restrictive CORS policy this provides solid CSRF defence for
 * a same-site single-page application.
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  if (SAFE_METHODS.has(req.method)) {
    return next();
  }

  const origin = req.headers.origin;

  if (!origin) {
    // No Origin header — reject (browser always sends it for cross-site requests;
    // absence from a browser means something unusual is happening).
    res.status(403).json({ status: 'error', message: 'Forbidden: missing Origin header' });
    return;
  }

  // Normalise: remove trailing slash for comparison
  const normalised = origin.replace(/\/$/, '');
  const allowed = env.FRONTEND_ORIGIN.replace(/\/$/, '');

  if (normalised !== allowed) {
    res.status(403).json({ status: 'error', message: 'Forbidden: Origin not allowed' });
    return;
  }

  next();
}
