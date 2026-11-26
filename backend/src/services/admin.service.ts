import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { paginationMetadata, paginationWindow } from '../validators/pagination.validator';

export type Role = 'user' | 'admin';
export type AuditAction = 'grant_admin' | 'revoke_admin' | 'deactivate' | 'reactivate' | 'reset_mfa';

/** Expected, user-facing failures from admin operations. */
export class AdminError extends Error {
  constructor(message: string, public readonly statusCode: number) {
    super(message);
    this.name = 'AdminError';
  }
}

const userSummary = {
  id: true, name: true, email: true, role: true, isActive: true, mfaEnabled: true,
  createdAt: true, lastLoginAt: true, _count: { select: { farms: true } },
} satisfies Prisma.UserSelect;

type UserRow = Prisma.UserGetPayload<{ select: typeof userSummary }>;

/**
 * Admins manage accounts, not farm records: only counts are exposed here,
 * never farm names, locations, tasks or activities.
 */
function present(user: UserRow) {
  const { _count, ...rest } = user;
  return { ...rest, farmCount: _count.farms };
}

export async function getAdminStats() {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [users, activeUsers, admins, usersWithMfa, newUsersLast7Days, farms, activeCropCycles] = await prisma.$transaction([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.user.count({ where: { role: 'admin' } }),
    prisma.user.count({ where: { mfaEnabled: true } }),
    prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.farm.count({ where: { isArchived: false } }),
    prisma.cropCycle.count({ where: { status: 'active' } }),
  ]);
  return { users, activeUsers, inactiveUsers: users - activeUsers, admins, usersWithMfa, newUsersLast7Days, farms, activeCropCycles };
}

export async function listUsers(query: {
  page?: number; limit?: number; search?: string; role?: Role; status?: 'active' | 'inactive';
}) {
  const { page, limit, skip } = paginationWindow(query);
  const where: Prisma.UserWhereInput = {
    ...(query.role ? { role: query.role } : {}),
    ...(query.status ? { isActive: query.status === 'active' } : {}),
    ...(query.search
      ? { OR: [{ name: { contains: query.search } }, { email: { contains: query.search.toLowerCase() } }] }
      : {}),
  };
  const [total, rows] = await prisma.$transaction([
    prisma.user.count({ where }),
    prisma.user.findMany({ where, select: userSummary, orderBy: [{ createdAt: 'desc' }, { id: 'asc' }], skip, take: limit }),
  ]);
  return { users: rows.map(present), pagination: paginationMetadata(total, page, limit) };
}

async function findTarget(tx: Prisma.TransactionClient, id: string) {
  const target = await tx.user.findUnique({ where: { id }, select: { id: true, role: true, isActive: true, mfaEnabled: true } });
  if (!target) throw new AdminError('Account not found.', 404);
  return target;
}

function audit(tx: Prisma.TransactionClient, actorId: string | null, targetUserId: string, action: AuditAction, detail?: string) {
  return tx.adminAuditEntry.create({ data: { actorId, targetUserId, action, detail: detail ?? null } });
}

export async function setRole(actorId: string, targetId: string, role: Role) {
  return prisma.$transaction(async (tx) => {
    const target = await findTarget(tx, targetId);
    if (target.role === role) throw new AdminError(`This account is already ${role === 'admin' ? 'an admin' : 'a farmer account'}.`, 409);
    if (role === 'user' && targetId === actorId) throw new AdminError('You cannot remove your own admin access.', 400);
    if (role === 'admin' && !target.isActive) throw new AdminError('Turn this account on before making it an admin.', 409);
    await tx.user.update({ where: { id: targetId }, data: { role } });
    await audit(tx, actorId, targetId, role === 'admin' ? 'grant_admin' : 'revoke_admin');
    return present(await tx.user.findUniqueOrThrow({ where: { id: targetId }, select: userSummary }));
  });
}

export async function setActive(actorId: string, targetId: string, active: boolean) {
  return prisma.$transaction(async (tx) => {
    const target = await findTarget(tx, targetId);
    if (!active && targetId === actorId) throw new AdminError('You cannot turn off your own account.', 400);
    if (target.isActive === active) throw new AdminError(`This account is already ${active ? 'on' : 'off'}.`, 409);
    await tx.user.update({ where: { id: targetId }, data: { isActive: active } });
    if (!active) {
      // Sign the person out everywhere right away.
      await tx.session.deleteMany({ where: { userId: targetId } });
      await tx.mfaChallenge.deleteMany({ where: { userId: targetId } });
    }
    await audit(tx, actorId, targetId, active ? 'reactivate' : 'deactivate');
    return present(await tx.user.findUniqueOrThrow({ where: { id: targetId }, select: userSummary }));
  });
}

/** For a farmer who lost both their phone and their backup codes. They set it up again after signing in. */
export async function resetMfa(actorId: string, targetId: string) {
  return prisma.$transaction(async (tx) => {
    const target = await findTarget(tx, targetId);
    if (targetId === actorId) throw new AdminError('Use Account security to change your own two-step verification.', 400);
    if (!target.mfaEnabled) throw new AdminError('This account does not use two-step verification.', 409);
    await tx.user.update({
      where: { id: targetId },
      data: { mfaEnabled: false, mfaSecret: null, mfaPendingSecret: null, mfaLastUsedStep: null, mfaEnabledAt: null },
    });
    await tx.mfaBackupCode.deleteMany({ where: { userId: targetId } });
    await tx.mfaChallenge.deleteMany({ where: { userId: targetId } });
    await tx.session.deleteMany({ where: { userId: targetId } });
    await audit(tx, actorId, targetId, 'reset_mfa');
    return present(await tx.user.findUniqueOrThrow({ where: { id: targetId }, select: userSummary }));
  });
}

export async function listAudit(query: { page?: number; limit?: number }) {
  const { page, limit, skip } = paginationWindow(query);
  const [total, rows] = await prisma.$transaction([
    prisma.adminAuditEntry.count(),
    prisma.adminAuditEntry.findMany({
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }], skip, take: limit,
      include: { actor: { select: { name: true, email: true } }, target: { select: { name: true, email: true } } },
    }),
  ]);
  return {
    entries: rows.map((row) => ({
      id: row.id, action: row.action, detail: row.detail, createdAt: row.createdAt,
      actor: row.actor, target: row.target,
    })),
    pagination: paginationMetadata(total, page, limit),
  };
}

/** Command-line path (no signed-in actor). Returns false when no account has that email. */
export async function setRoleByEmail(email: string, role: Role): Promise<'changed' | 'unchanged' | 'not_found'> {
  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() }, select: { id: true, role: true } });
  if (!user) return 'not_found';
  if (user.role === role) return 'unchanged';
  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: user.id }, data: { role } });
    await audit(tx, null, user.id, role === 'admin' ? 'grant_admin' : 'revoke_admin', 'command line');
  });
  return 'changed';
}
