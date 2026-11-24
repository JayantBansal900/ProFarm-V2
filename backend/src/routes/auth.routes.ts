import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { env } from '../config/env';
import { validateRequest } from '../middleware/validate';
import { registerSchema, loginSchema } from '../validators/auth.validator';
import { register, login, me, logout } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/requireAuth';

export function createAuthRouter(options: { credentialLimit?: number } = {}) {
  const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: options.credentialLimit ?? (env.NODE_ENV === 'test' ? 10000 : 10),
    standardHeaders: true,
    legacyHeaders: false,
    message: { status: 'error', message: 'Too many authentication attempts, please try again later.' },
  });

  const router = Router();

  // Session checks/logout retain the general API limiter, not the credential quota.
  router.post('/register', authRateLimiter, validateRequest(registerSchema), register);
  router.post('/login', authRateLimiter, validateRequest(loginSchema), login);
  router.get('/me', requireAuth, me);
  router.post('/logout', logout);

  return router;
}

export const authRoutes = createAuthRouter();
