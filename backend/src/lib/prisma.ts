import { PrismaClient } from '@prisma/client';
import { env } from '../config/env';
import { assertSafeTestDatabase } from '../../testing/database-safety.cjs';

declare global {
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  global.__prisma ||
  new PrismaClient({
    datasourceUrl: env.DATABASE_URL,
    log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (env.NODE_ENV === 'test') {
  const initialTarget = assertSafeTestDatabase(process.env, true).databasePath;
  prisma.$use(async (params, next) => {
    if (assertSafeTestDatabase(process.env, true).databasePath !== initialTarget) {
      throw new Error('Test database target changed after Prisma initialization');
    }
    return next(params);
  });
}

if (env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}
