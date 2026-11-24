export const backendRoot: string;
export const testRoot: string;
export interface TestDatabaseConfig {
  NODE_ENV?: string;
  DATABASE_URL?: string;
  PROFARM_TEST_DATABASE_URL?: string;
  PROFARM_TEST_RUN_ID?: string;
}
export function assertSafeTestDatabase(config?: TestDatabaseConfig, requirePrepared?: boolean): {
  databasePath: string;
  runDirectory: string;
};
export function prepareTestDatabase(config: TestDatabaseConfig): ReturnType<typeof assertSafeTestDatabase>;
export function cleanupTestDatabase(config: TestDatabaseConfig): void;
