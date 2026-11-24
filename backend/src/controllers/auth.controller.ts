import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';
import { prisma } from '../lib/prisma';
import {
  hashPassword,
  verifyPassword,
  createSession,
  revokeSession,
  findIdentityMatches,
  AuthenticationUnavailableError,
} from '../services/auth.service';
import { RegisterInput, LoginInput } from '../validators/auth.validator';
import { COOKIE_NAME } from '../middleware/requireAuth';
import { Prisma } from '@prisma/client';

// ---------------------------------------------------------------------------
// Cookie options
// ---------------------------------------------------------------------------

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    path: '/',
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
    const existing = await findIdentityMatches(email, prisma);
    if (existing.length > 0) {
      res.status(409).json({ status: 'error', message: 'An account with that email already exists' });
      return;
    }

    const passwordHash = await hashPassword(password);
    const { user, rawToken } = await prisma.$transaction(async (transaction) => {
      const user = await transaction.user.create({
        data: { name, email, passwordHash },
        select: { id: true, name: true, email: true, createdAt: true },
      });

      const rawToken = await createSession(user.id, transaction);
      return { user, rawToken };
    });
    res.cookie(COOKIE_NAME, rawToken, { ...cookieOptions(), maxAge: SEVEN_DAYS_MS });

    res.status(201).json({
      status: 'success',
      message: 'Account created successfully',
      user,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      res.status(409).json({ status: 'error', message: 'An account with that email already exists' });
      return;
    }
    next(new AuthenticationUnavailableError());
  }
}

// ---------------------------------------------------------------------------
// POST /api/auth/login
// ---------------------------------------------------------------------------

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body as LoginInput;

    const matches = await findIdentityMatches(email, prisma);
    const user = matches.length === 1 ? matches[0] : null;

    // Constant-time failure path: always run verifyPassword even when user not found
    const dummyHash =
      '$argon2id$v=19$m=65536,t=3,p=1$aaaaaaaaaaaaaaaaaaaaaa$aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    const passwordOk = await verifyPassword(user?.passwordHash ?? dummyHash, password);

    if (!user || !passwordOk) {
      res.status(401).json({ status: 'error', message: 'Invalid email or password' });
      return;
    }

    const rawToken = await createSession(user.id, prisma);
    res.cookie(COOKIE_NAME, rawToken, { ...cookieOptions(), maxAge: SEVEN_DAYS_MS });

    res.status(200).json({
      status: 'success',
      message: 'Logged in successfully',
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch {
    next(new AuthenticationUnavailableError());
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
  // Clear this browser's cookie even when the server cannot revoke a copied token.
  res.clearCookie(COOKIE_NAME, cookieOptions());
  try {
    const rawToken: unknown = req.cookies?.[COOKIE_NAME];
    if (typeof rawToken === 'string' && rawToken) {
      await revokeSession(rawToken, prisma);
    }
    res.status(200).json({ status: 'success', message: 'Logged out successfully' });
  } catch {
    next(new AuthenticationUnavailableError());
  }
}
