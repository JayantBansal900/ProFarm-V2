import { Request, Response, NextFunction } from 'express';
import {
  AdminError, getAdminStats, listAudit, listUsers, resetMfa, setActive, setRole,
} from '../services/admin.service';
import {
  adminAuditQuerySchema, adminUsersQuerySchema, roleBodySchema, userIdParamSchema,
} from '../validators/admin.validator';

function fail(error: unknown, res: Response, next: NextFunction): void {
  if (error instanceof AdminError) {
    res.status(error.statusCode).json({ status: 'error', message: error.message });
    return;
  }
  next(error);
}

const targetId = (req: Request) => userIdParamSchema.parse(req.params).id;

export async function statsController(_req: Request, res: Response, next: NextFunction) {
  try { res.json({ status: 'success', data: await getAdminStats() }); } catch (error) { fail(error, res, next); }
}

export async function usersController(req: Request, res: Response, next: NextFunction) {
  try { res.json({ status: 'success', ...(await listUsers(adminUsersQuerySchema.parse(req.query))) }); }
  catch (error) { fail(error, res, next); }
}

export async function roleController(req: Request, res: Response, next: NextFunction) {
  try {
    const { role } = roleBodySchema.parse(req.body);
    res.json({ status: 'success', data: await setRole(req.user!.id, targetId(req), role) });
  } catch (error) { fail(error, res, next); }
}

export async function deactivateController(req: Request, res: Response, next: NextFunction) {
  try { res.json({ status: 'success', data: await setActive(req.user!.id, targetId(req), false) }); }
  catch (error) { fail(error, res, next); }
}

export async function reactivateController(req: Request, res: Response, next: NextFunction) {
  try { res.json({ status: 'success', data: await setActive(req.user!.id, targetId(req), true) }); }
  catch (error) { fail(error, res, next); }
}

export async function resetMfaController(req: Request, res: Response, next: NextFunction) {
  try { res.json({ status: 'success', data: await resetMfa(req.user!.id, targetId(req)) }); }
  catch (error) { fail(error, res, next); }
}

export async function auditController(req: Request, res: Response, next: NextFunction) {
  try { res.json({ status: 'success', ...(await listAudit(adminAuditQuerySchema.parse(req.query))) }); }
  catch (error) { fail(error, res, next); }
}
