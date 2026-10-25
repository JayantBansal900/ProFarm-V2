import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';
import { prisma } from '../lib/prisma';
import {
  hashPassword,
  verifyPassword,
  createSession,
  revokeSession,
} from '../services/auth.service';
import { RegisterInput, LoginInput } from '../validators/auth.validator';
import { COOKIE_NAME } from '../middleware/requireAuth';

// ---------------------------------------------------------------------------
// Cookie options
// ---------------------------------------------------------------------------

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SEVEN_DAYS_MS,
    secure: env.NODE_ENV === 'production',
  };
}

// ---------------------------------------------------------------------------
// POST /api/auth/register
// ---------------------------------------------------------------------------

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, email, password } = req.body as RegisterInput;

    // Check email uniqueness
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ status: 'error', message: 'An account with that email already exists' });
      return;
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { name, email, passwordHash },
      select: { id: true, name: true, email: true, createdAt: true },
    });

    const rawToken = await createSession(user.id, prisma);
    res.cookie(COOKIE_NAME, rawToken, cookieOptions());

    res.status(201).json({
      status: 'success',
      message: 'Account created successfully',
      user,
    });
  } catch (error) {
    next(error);
  }
}

// ---------------------------------------------------------------------------
// POST /api/auth/login
// ---------------------------------------------------------------------------

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body as LoginInput;

    const user = await prisma.user.findUnique({ where: { email } });

    // Constant-time failure path: always run verifyPassword even when user not found
    const dummyHash =
      '$argon2id$v=19$m=65536,t=3,p=1$aaaaaaaaaaaaaaaaaaaaaa$aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    const passwordOk = await verifyPassword(user?.passwordHash ?? dummyHash, password);

    if (!user || !passwordOk) {
      res.status(401).json({ status: 'error', message: 'Invalid email or password' });
      return;
    }

    const rawToken = await createSession(user.id, prisma);
    res.cookie(COOKIE_NAME, rawToken, cookieOptions());

    res.status(200).json({
      status: 'success',
      message: 'Logged in successfully',
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error) {
    next(error);
  }
}

// ---------------------------------------------------------------------------
// GET /api/auth/me
// ---------------------------------------------------------------------------

export async function me(req: Request, res: Response): Promise<void> {
  // req.user is populated by requireAuth middleware
  res.status(200).json({ status: 'success', user: req.user });
}

// ---------------------------------------------------------------------------
// POST /api/auth/logout
// ---------------------------------------------------------------------------

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rawToken: string | undefined = req.cookies?.[COOKIE_NAME];
    if (rawToken) {
      await revokeSession(rawToken, prisma);
    }
    res.clearCookie(COOKIE_NAME, { path: '/' });
    res.status(200).json({ status: 'success', message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
}
