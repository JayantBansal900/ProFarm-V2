import crypto from 'crypto';
import type { PrismaClient } from '@prisma/client';
import { prisma as defaultPrisma } from '../lib/prisma';
import { generateTotpSecret, otpauthUri, verifyTotp } from '../lib/totp';
import { openSecret, sealSecret } from '../lib/secretBox';
import { hashToken, verifyPassword } from './auth.service';

export const MFA_CHALLENGE_TTL_MS = 5 * 60 * 1000;
export const MFA_MAX_CHALLENGE_ATTEMPTS = 5;
export const BACKUP_CODE_COUNT = 10;

type Db = PrismaClient;

/** Expected, user-facing failures. Anything else is treated as a service outage. */
export class MfaError extends Error {
  constructor(message: string, public readonly statusCode: number) {
    super(message);
    this.name = 'MfaError';
  }
}

// Unambiguous alphabet: no 0/o, 1/l/i.
const BACKUP_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';

function generateBackupCode(): string {
  const bytes = crypto.randomBytes(10);
  const chars = Array.from(bytes, (byte) => BACKUP_ALPHABET[byte % BACKUP_ALPHABET.length]);
  return `${chars.slice(0, 5).join('')}-${chars.slice(5).join('')}`;
}

export function normalizeBackupCode(code: string): string {
  return code.toLowerCase().replace(/[\s-]/g, '');
}

function hashBackupCode(code: string): string {
  return crypto.createHash('sha256').update(`profarm-backup:${normalizeBackupCode(code)}`).digest('hex');
}

async function replaceBackupCodes(userId: string, db: Pick<Db, 'mfaBackupCode'>): Promise<string[]> {
  const codes = Array.from({ length: BACKUP_CODE_COUNT }, generateBackupCode);
  await db.mfaBackupCode.deleteMany({ where: { userId } });
  await db.mfaBackupCode.createMany({ data: codes.map((code) => ({ userId, codeHash: hashBackupCode(code) })) });
  return codes;
}

export async function getMfaStatus(userId: string, db: Db = defaultPrisma) {
  const user = await db.user.findUnique({ where: { id: userId }, select: { mfaEnabled: true, mfaEnabledAt: true } });
  const backupCodesRemaining = user?.mfaEnabled
    ? await db.mfaBackupCode.count({ where: { userId, usedAt: null } })
    : 0;
  return { enabled: Boolean(user?.mfaEnabled), enabledAt: user?.mfaEnabledAt ?? null, backupCodesRemaining };
}

/** Step 1 of setup: create a new secret, kept pending until the user proves their app has it. */
export async function startMfaSetup(userId: string, email: string, db: Db = defaultPrisma) {
  const user = await db.user.findUnique({ where: { id: userId }, select: { mfaEnabled: true } });
  if (user?.mfaEnabled) throw new MfaError('Two-step verification is already on.', 409);
  const secret = generateTotpSecret();
  await db.user.update({ where: { id: userId }, data: { mfaPendingSecret: sealSecret(secret) } });
  return { secret, otpauthUri: otpauthUri(secret, email) };
}

/** Step 2 of setup: confirm a code from the app, switch MFA on and issue backup codes once. */
export async function enableMfa(userId: string, code: string, db: Db = defaultPrisma) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { mfaEnabled: true, mfaPendingSecret: true },
  });
  if (user?.mfaEnabled) throw new MfaError('Two-step verification is already on.', 409);
  if (!user?.mfaPendingSecret) throw new MfaError('Start setup again to get a new key.', 400);

  const secret = openSecret(user.mfaPendingSecret);
  const step = verifyTotp(secret, code.trim());
  if (step === null) throw new MfaError('That code is not correct. Check the time on your phone and try the newest code.', 400);

  return db.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: true,
        mfaSecret: user.mfaPendingSecret,
        mfaPendingSecret: null,
        mfaLastUsedStep: step,
        mfaEnabledAt: new Date(),
      },
    });
    return { backupCodes: await replaceBackupCodes(userId, tx) };
  });
}

/**
 * Checks a second factor: a 6-digit authenticator code (each code works once) or an unused backup code.
 * Uses conditional updates so two concurrent requests cannot both spend the same code.
 */
export async function verifySecondFactor(userId: string, rawCode: string, db: Db = defaultPrisma): Promise<boolean> {
  const code = rawCode.trim();
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { mfaEnabled: true, mfaSecret: true, mfaLastUsedStep: true },
  });
  if (!user?.mfaEnabled || !user.mfaSecret) return false;

  if (/^\d{6}$/.test(code)) {
    const step = verifyTotp(openSecret(user.mfaSecret), code, { lastUsedStep: user.mfaLastUsedStep });
    if (step === null) return false;
    const claimed = await db.user.updateMany({
      where: { id: userId, OR: [{ mfaLastUsedStep: null }, { mfaLastUsedStep: { lt: step } }] },
      data: { mfaLastUsedStep: step },
    });
    return claimed.count === 1;
  }

  if (normalizeBackupCode(code).length !== 10) return false;
  const spent = await db.mfaBackupCode.updateMany({
    where: { userId, codeHash: hashBackupCode(code), usedAt: null },
    data: { usedAt: new Date() },
  });
  return spent.count === 1;
}

export async function disableMfa(userId: string, password: string, code: string, db: Db = defaultPrisma) {
  const user = await db.user.findUnique({ where: { id: userId }, select: { passwordHash: true, mfaEnabled: true } });
  if (!user?.mfaEnabled) throw new MfaError('Two-step verification is already off.', 409);
  if (!(await verifyPassword(user.passwordHash, password))) throw new MfaError('Password is not correct.', 400);
  if (!(await verifySecondFactor(userId, code, db))) throw new MfaError('That code is not correct.', 400);

  await db.$transaction([
    db.mfaBackupCode.deleteMany({ where: { userId } }),
    db.mfaChallenge.deleteMany({ where: { userId } }),
    db.user.update({
      where: { id: userId },
      data: { mfaEnabled: false, mfaSecret: null, mfaPendingSecret: null, mfaLastUsedStep: null, mfaEnabledAt: null },
    }),
  ]);
}

export async function regenerateBackupCodes(userId: string, code: string, db: Db = defaultPrisma) {
  if (!(await verifySecondFactor(userId, code, db))) throw new MfaError('That code is not correct.', 400);
  return { backupCodes: await replaceBackupCodes(userId, db) };
}

/** Issued after a correct password when the account has MFA on. The raw token is returned once. */
export async function createMfaChallenge(userId: string, db: Pick<Db, 'mfaChallenge'> = defaultPrisma): Promise<string> {
  const rawToken = crypto.randomBytes(32).toString('hex');
  await db.mfaChallenge.deleteMany({ where: { userId, expiresAt: { lte: new Date() } } });
  await db.mfaChallenge.create({
    data: { userId, tokenHash: hashToken(rawToken), expiresAt: new Date(Date.now() + MFA_CHALLENGE_TTL_MS) },
  });
  return rawToken;
}

/** Spends a challenge with a second-factor code. Returns the user on success. */
export async function completeMfaChallenge(rawToken: string, code: string, db: Db = defaultPrisma) {
  const tokenHash = hashToken(rawToken);
  const challenge = await db.mfaChallenge.findUnique({
    where: { tokenHash },
    include: { user: { select: { id: true, name: true, email: true, role: true, isActive: true } } },
  });
  const expired = new MfaError('Your sign-in took too long. Enter your email and password again.', 401);
  if (!challenge) throw expired;
  if (challenge.expiresAt <= new Date() || challenge.attempts >= MFA_MAX_CHALLENGE_ATTEMPTS) {
    await db.mfaChallenge.deleteMany({ where: { tokenHash } });
    throw expired;
  }

  if (!(await verifySecondFactor(challenge.userId, code, db))) {
    const updated = await db.mfaChallenge.update({ where: { tokenHash }, data: { attempts: { increment: 1 } } });
    if (updated.attempts >= MFA_MAX_CHALLENGE_ATTEMPTS) {
      await db.mfaChallenge.deleteMany({ where: { tokenHash } });
      throw new MfaError('Too many wrong codes. Enter your email and password again.', 401);
    }
    throw new MfaError('That code is not correct. Try the newest code from your app, or a backup code.', 400);
  }

  // Single use: only the request that deletes the challenge may sign in.
  const consumed = await db.mfaChallenge.deleteMany({ where: { tokenHash } });
  if (consumed.count !== 1) throw expired;
  if (!challenge.user.isActive) throw new MfaError('This account has been turned off. Contact ProFarm support.', 403);
  const { id, name, email, role } = challenge.user;
  return { id, name, email, role };
}
