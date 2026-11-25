import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';
import { assertSafeTestDatabase } from '../../testing/database-safety.cjs';
import { isValidTimeZone } from '../lib/timezone';

// Load local backend .env if present
const testing = process.env.NODE_ENV === 'test' || Boolean(process.env.VITEST);
if (testing) {
  // Never fall back to the normal application database during tests.
  assertSafeTestDatabase(process.env, true);
} else {
  dotenv.config({ path: path.resolve(__dirname, '../../.env') });
  // Also load workspace root .env if present (supports root-level key configuration in monorepo)
  dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
}

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  FRONTEND_ORIGIN: z.string().default('http://localhost:5173'),
  OPENWEATHER_API_KEY: z.string().optional().default(''),
  NASA_POWER_BASE_URL: z.string().url().default('https://power.larc.nasa.gov'),
  DATA_GOV_IN_API_KEY: z.string().optional().default(''),
  // Decides what "today" means for due dates and overdue tasks. The servers may run in UTC.
  APP_TIMEZONE: z.string().refine(isValidTimeZone, 'APP_TIMEZONE must be an IANA timezone such as Asia/Kolkata').default('Asia/Kolkata'),
  // Encrypts two-step verification secrets at rest. Required (32+ chars) in production.
  MFA_ENCRYPTION_KEY: z.string().optional().default(''),
}).transform((value, context) => {
  if (value.MFA_ENCRYPTION_KEY.length >= 32) return value;
  if (value.NODE_ENV === 'production') {
    context.addIssue({ code: 'custom', path: ['MFA_ENCRYPTION_KEY'], message: 'MFA_ENCRYPTION_KEY must be at least 32 characters in production' });
    return z.NEVER;
  }
  return { ...value, MFA_ENCRYPTION_KEY: 'profarm-development-only-mfa-encryption-key' };
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Environment validation failed:', parsed.error.format());
  throw new Error('Invalid environment configuration');
}

export const env = parsed.data;
