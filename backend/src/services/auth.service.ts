import argon2 from 'argon2';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// ---------------------------------------------------------------------------
// Password helpers
// ---------------------------------------------------------------------------

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536, // 64 MiB
    timeCost: 3,
    parallelism: 1,
  });
}

export async function verifyPassword(hash: string, candidate: string): Promise<boolean> {
  return argon2.verify(hash, candidate);
}

// ---------------------------------------------------------------------------
// Session token helpers
// ---------------------------------------------------------------------------

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function hashToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

// ---------------------------------------------------------------------------
// Session CRUD
// ---------------------------------------------------------------------------

export async function createSession(userId: string, prisma: PrismaClient): Promise<string> {
  const rawToken = generateSessionToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await prisma.session.create({
    data: { userId, tokenHash, expiresAt },
  });

  return rawToken;
}

export async function validateSession(
  rawToken: string,
  prisma: PrismaClient,
): Promise<{ id: string; name: string; email: string } | null> {
  const tokenHash = hashToken(rawToken);

  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  if (!session) return null;
  if (session.expiresAt < new Date()) {
    // Expired — clean up lazily
    await prisma.session.delete({ where: { tokenHash } }).catch(() => undefined);
    return null;
  }

  return session.user;
}

export async function revokeSession(rawToken: string, prisma: PrismaClient): Promise<void> {
  const tokenHash = hashToken(rawToken);
  await prisma.session.delete({ where: { tokenHash } }).catch(() => undefined);
}
