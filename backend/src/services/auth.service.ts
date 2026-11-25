import argon2 from 'argon2';
import crypto from 'crypto';
import type { PrismaClient, User } from '@prisma/client';

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
type SessionDatabase = Pick<PrismaClient, 'session'>;

export class AuthenticationUnavailableError extends Error {
  readonly statusCode = 503;
  readonly expose = false;

  constructor() {
    super('Authentication service temporarily unavailable');
    this.name = 'AuthenticationUnavailableError';
  }
}

// ECMAScript trim whitespace; accepted email identifiers are ASCII (Zod email).
// Querying existing values preserves legacy case/whitespace without rewriting users.
const EMAIL_WHITESPACE = '\u0009\u000a\u000b\u000c\u000d\u0020\u00a0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u2028\u2029\u202f\u205f\u3000\ufeff';

export async function findIdentityMatches(
  normalizedEmail: string,
  database: Pick<PrismaClient, '$queryRaw'>,
): Promise<Pick<User, 'id' | 'name' | 'email' | 'passwordHash'>[]> {
  // Two matches are enough to reject ambiguity; no account is chosen or merged.
  return database.$queryRaw`
    SELECT id, name, email, passwordHash FROM users
    WHERE lower(trim(email, ${EMAIL_WHITESPACE})) = ${normalizedEmail}
    LIMIT 2
  `;
}

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

export async function createSession(userId: string, prisma: SessionDatabase): Promise<string> {
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
  prisma: SessionDatabase,
): Promise<{ id: string; name: string; email: string; role: string } | null> {
  const tokenHash = hashToken(rawToken);

  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: { user: { select: { id: true, name: true, email: true, role: true, isActive: true } } },
  });

  if (!session) return null;
  if (session.expiresAt <= new Date()) {
    // Expired — clean up lazily
    await prisma.session.deleteMany({ where: { tokenHash } });
    return null;
  }
  // An admin turned this account off: the session stops working at once.
  if (!session.user.isActive) {
    await prisma.session.deleteMany({ where: { tokenHash } });
    return null;
  }

  const { id, name, email, role } = session.user;
  return { id, name, email, role };
}

export async function revokeSession(rawToken: string, prisma: SessionDatabase): Promise<void> {
  const tokenHash = hashToken(rawToken);
  // deleteMany is idempotent for missing rows and still propagates DB failures.
  await prisma.session.deleteMany({ where: { tokenHash } });
}
