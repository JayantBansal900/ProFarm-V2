import { assertSafeTestDatabase } from './database-safety.cjs';

// Runs before test modules can import the application's Prisma singleton.
assertSafeTestDatabase(process.env, true);
