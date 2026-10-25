import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load local backend .env if present
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
// Also load workspace root .env if present (supports root-level key configuration in monorepo)
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  FRONTEND_ORIGIN: z.string().default('http://localhost:5173'),
  OPENWEATHER_API_KEY: z.string().optional().default(''),
  NASA_POWER_BASE_URL: z.string().url().default('https://power.larc.nasa.gov'),
  DATA_GOV_IN_API_KEY: z.string().optional().default(''),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Environment validation failed:', parsed.error.format());
  throw new Error('Invalid environment configuration');
}

export const env = parsed.data;
