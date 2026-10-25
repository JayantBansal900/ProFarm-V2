import { Request, Response, NextFunction } from 'express';
import { validateSession } from '../services/auth.service';
import { prisma } from '../lib/prisma';

// Extend Express Request so downstream handlers can access req.user
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { id: string; name: string; email: string };
    }
  }
}

export const COOKIE_NAME = 'profarm_sid';

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const rawToken: string | undefined = req.cookies?.[COOKIE_NAME];

  if (!rawToken) {
    res.status(401).json({ status: 'error', message: 'Authentication required' });
    return;
  }

  const user = await validateSession(rawToken, prisma);

  if (!user) {
    // Clear stale cookie
    res.clearCookie(COOKIE_NAME, { path: '/' });
    res.status(401).json({ status: 'error', message: 'Session expired or invalid' });
    return;
  }

  req.user = user;
  next();
}
