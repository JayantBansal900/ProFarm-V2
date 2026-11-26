import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AuthenticationUnavailableError } from '../services/auth.service';

/**
 * Use after requireAuth. The role is read from the database on every request,
 * so removing someone's admin access takes effect immediately. Admin accounts must
 * also have two-step verification on, because admins can switch other accounts off.
 */
export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ status: 'error', message: 'Admin access required' });
    return;
  }
  try {
    const account = await prisma.user.findUnique({ where: { id: req.user.id }, select: { mfaEnabled: true } });
    if (!account?.mfaEnabled) {
      res.status(403).json({
        status: 'error',
        code: 'mfa_required',
        message: 'Turn on two-step verification to use the admin panel.',
      });
      return;
    }
  } catch {
    next(new AuthenticationUnavailableError());
    return;
  }
  next();
}
