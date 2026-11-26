import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { env } from '../config/env';
import { validateRequest } from '../middleware/validate';
import { registerSchema, loginSchema, mfaLoginSchema, mfaCodeSchema, mfaDisableSchema } from '../validators/auth.validator';
import {
  register, login, me, logout,
  loginWithMfa, mfaStatus, mfaSetup, mfaEnable, mfaDisable, mfaBackupCodes,
} from '../controllers/auth.controller';
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

  // Two-step verification. Code-checking routes share the credential quota against brute force.
  router.post('/login/mfa', authRateLimiter, validateRequest(mfaLoginSchema), loginWithMfa);
  router.get('/mfa', requireAuth, mfaStatus);
  router.post('/mfa/setup', requireAuth, mfaSetup);
  router.post('/mfa/enable', authRateLimiter, requireAuth, validateRequest(mfaCodeSchema), mfaEnable);
  router.post('/mfa/disable', authRateLimiter, requireAuth, validateRequest(mfaDisableSchema), mfaDisable);
  router.post('/mfa/backup-codes', authRateLimiter, requireAuth, validateRequest(mfaCodeSchema), mfaBackupCodes);

  return router;
}

export const authRoutes = createAuthRouter();
