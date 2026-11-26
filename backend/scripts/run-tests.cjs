const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const { backendRoot, testRoot, assertSafeTestDatabase, prepareTestDatabase, cleanupTestDatabase } = require('../testing/database-safety.cjs');

// Do not load application .env files into the test process.
const id = crypto.randomUUID();
const url = `file:${path.join(testRoot, `run-${id}`, 'test.db').replace(/\\/g, '/')}`;
const config = {
  ...process.env,
  NODE_ENV: 'test',
  PROFARM_TEST_RUN_ID: process.env.PROFARM_TEST_RUN_ID || id,
  PROFARM_TEST_DATABASE_URL: process.env.PROFARM_TEST_DATABASE_URL || url,
  DATABASE_URL: process.env.PROFARM_TEST_DATABASE_URL || url,
  FRONTEND_ORIGIN: 'http://localhost:5173',
  DATA_GOV_IN_API_KEY: 'test-placeholder-not-a-real-key',
  OPENWEATHER_API_KEY: '',
  CHECKPOINT_DISABLE: '1',
  PRISMA_HIDE_UPDATE_MESSAGE: '1',
};

function databaseFingerprints() {
  const result = {};
  for (const name of fs.readdirSync(path.join(backendRoot, 'prisma'))) {
    if (!/\.db(?:-(?:journal|wal|shm))?$/.test(name)) continue;
    result[name] = crypto.createHash('sha256').update(fs.readFileSync(path.join(backendRoot, 'prisma', name))).digest('hex');
  }
  return JSON.stringify(result);
}

function run(script, args) {
  const result = spawnSync(process.execPath, [require.resolve(script), ...args], {
    cwd: backendRoot, env: config, stdio: 'inherit', windowsHide: true,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Verification subprocess failed (${result.status ?? result.signal})`);
}

let prepared = false;
const before = databaseFingerprints();
try {
  assertSafeTestDatabase(config);
  const target = prepareTestDatabase(config);
  prepared = true;
  console.log(`Isolated SQLite test target: ${target.databasePath}`);
  // Exclusively create the file ourselves; never let initialization reuse a target.
  fs.closeSync(fs.openSync(target.databasePath, 'wx'));
  assertSafeTestDatabase(config, true);
  // The guard precedes the only schema initialization command.
  run('prisma/build/index.js', ['migrate', 'deploy', '--schema', path.join(backendRoot, 'prisma', 'schema.prisma')]);
  assertSafeTestDatabase(config, true);
  // Resolve the CLI from the public package manifest (Vitest 4 restricts subpath exports).
  run(path.join(path.dirname(require.resolve('vitest/package.json')), 'vitest.mjs'), ['run', ...process.argv.slice(2)]);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  if (prepared) {
    try { cleanupTestDatabase(config); }
    catch (error) { console.error(`Disposable test cleanup failed: ${error.message}`); process.exitCode = 1; }
  }
  if (databaseFingerprints() !== before) {
    console.error('Application database fingerprint changed during verification. Investigate before continuing.');
    process.exitCode = 1;
  } else console.log('Application database files unchanged (SHA-256 comparison).');
}
