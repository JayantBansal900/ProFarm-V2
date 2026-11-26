import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { assertSafeTestDatabase } from './testing/database-safety.cjs';

assertSafeTestDatabase(process.env, true);

export default defineConfig({
  cacheDir: path.join(__dirname, '.test-databases', `run-${process.env.PROFARM_TEST_RUN_ID || 'unconfigured'}`, 'vite-cache'),
  test: {
    cache: false,
    fileParallelism: false,
    setupFiles: ['./testing/setup.ts'],
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    testTimeout: 15000,
  },
});
