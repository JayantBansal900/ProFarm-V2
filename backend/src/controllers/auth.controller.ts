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
import {
  MfaError,
  completeMfaChallenge,
  createMfaChallenge,
  disableMfa,
  enableMfa,
  getMfaStatus,
  regenerateBackupCodes,
  startMfaSetup,
} from '../services/mfa.service';

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

    const security = await prisma.user.findUnique({ where: { id: user.id }, select: { mfaEnabled: true } });
    if (security?.mfaEnabled) {
      // Password was right; no session until the second factor is checked.
      const challengeToken = await createMfaChallenge(user.id, prisma);
      res.status(200).json({
        status: 'mfa_required',
        message: 'Enter the code from your authenticator app',
        mfaRequired: true,
        challengeToken,
      });
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

// ---------------------------------------------------------------------------
// Two-step verification
// ---------------------------------------------------------------------------

function mfaFailure(error: unknown, res: Response, next: NextFunction): void {
  if (error instanceof MfaError) {
    res.status(error.statusCode).json({ status: 'error', message: error.message });
    return;
  }
  next(new AuthenticationUnavailableError());
}

// POST /api/auth/login/mfa — second step of sign-in.
export async function loginWithMfa(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { challengeToken, code } = req.body as { challengeToken: string; code: string };
    const user = await completeMfaChallenge(challengeToken, code, prisma);
    const rawToken = await createSession(user.id, prisma);
    res.cookie(COOKIE_NAME, rawToken, { ...cookieOptions(), maxAge: SEVEN_DAYS_MS });
    res.status(200).json({ status: 'success', message: 'Logged in successfully', user });
  } catch (error) {
    mfaFailure(error, res, next);
  }
}

// GET /api/auth/mfa
export async function mfaStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.status(200).json({ status: 'success', mfa: await getMfaStatus(req.user!.id, prisma) });
  } catch (error) {
    mfaFailure(error, res, next);
  }
}

// POST /api/auth/mfa/setup
export async function mfaSetup(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const setup = await startMfaSetup(req.user!.id, req.user!.email, prisma);
    res.set('Cache-Control', 'no-store');
    res.status(200).json({ status: 'success', ...setup });
  } catch (error) {
    mfaFailure(error, res, next);
  }
}

// POST /api/auth/mfa/enable
export async function mfaEnable(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await enableMfa(req.user!.id, (req.body as { code: string }).code, prisma);
    res.set('Cache-Control', 'no-store');
    res.status(200).json({ status: 'success', message: 'Two-step verification is on', ...result });
  } catch (error) {
    mfaFailure(error, res, next);
  }
}

// POST /api/auth/mfa/disable
export async function mfaDisable(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { password, code } = req.body as { password: string; code: string };
    await disableMfa(req.user!.id, password, code, prisma);
    res.status(200).json({ status: 'success', message: 'Two-step verification is off' });
  } catch (error) {
    mfaFailure(error, res, next);
  }
}

// POST /api/auth/mfa/backup-codes
export async function mfaBackupCodes(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await regenerateBackupCodes(req.user!.id, (req.body as { code: string }).code, prisma);
    res.set('Cache-Control', 'no-store');
    res.status(200).json({ status: 'success', ...result });
  } catch (error) {
    mfaFailure(error, res, next);
  }
}
