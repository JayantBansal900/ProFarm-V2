import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { env } from '../config/env';
import { validateRequest } from '../middleware/validate';
import { registerSchema, loginSchema } from '../validators/auth.validator';
import { register, login, me, logout } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/requireAuth';

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.NODE_ENV === 'test' ? 10000 : 10, // strict in production
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 'error', message: 'Too many authentication attempts, please try again later.' },
});

const router = Router();

// Apply strict rate limiting to all auth routes
router.use(authRateLimiter);

router.post('/register', validateRequest(registerSchema), register);
router.post('/login', validateRequest(loginSchema), login);
router.get('/me', requireAuth, me);
router.post('/logout', logout);

export const authRoutes = router;
