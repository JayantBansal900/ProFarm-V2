// Real browser verification uses the existing Phase 1 database safety boundary.
// No fixtures or API mocks: create test data through the real application UI.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawn, spawnSync } = require('node:child_process');
const { backendRoot, testRoot, prepareTestDatabase, assertSafeTestDatabase, cleanupTestDatabase } = require('../testing/database-safety.cjs');
const id = crypto.randomUUID();
const root = path.dirname(backendRoot);
const secrets = {};
for (const location of [path.join(backendRoot, '.env'), path.join(root, '.env')]) {
  if (fs.existsSync(location)) Object.assign(secrets, require('dotenv').parse(fs.readFileSync(location)));
}
const url = `file:${path.join(testRoot, `run-${id}`, 'test.db').replace(/\\/g, '/')}`;
const config = { ...process.env, NODE_ENV: 'test', DATABASE_URL: url, PROFARM_TEST_DATABASE_URL: url,
  PROFARM_TEST_RUN_ID: id, PORT: '4100', FRONTEND_ORIGIN: 'http://localhost:5183',
  VITE_API_BASE_URL: 'http://localhost:4100', DATA_GOV_IN_API_KEY: secrets.DATA_GOV_IN_API_KEY || '',
  OPENWEATHER_API_KEY: '', CHECKPOINT_DISABLE: '1' };
const protectedFiles = () => Object.fromEntries(fs.readdirSync(path.join(backendRoot, 'prisma'))
  .filter((name) => /\.db(?:-(?:journal|wal|shm))?$/.test(name))
  .map((name) => [name, crypto.createHash('sha256').update(fs.readFileSync(path.join(backendRoot, 'prisma', name))).digest('hex')]));
const before = JSON.stringify(protectedFiles());
const children = [];
let prepared = false;
let stopping = false;
async function stop() {
  if (stopping) return;
  stopping = true;
  await Promise.all(children.map((child) => new Promise((resolve) => {
    if (child.exitCode !== null) return resolve();
    child.once('exit', resolve);
    child.kill();
  })));
  if (prepared) cleanupTestDatabase(config);
  if (before !== JSON.stringify(protectedFiles())) { console.error('Protected database fingerprint changed'); process.exitCode = 1; }
  else console.log('Browser verification cleaned up; protected database fingerprints unchanged.');
  process.stdin.pause();
}
try {
  const target = prepareTestDatabase(config);
  prepared = true;
  fs.closeSync(fs.openSync(target.databasePath, 'wx'));
  assertSafeTestDatabase(config, true);
  const migrated = spawnSync(process.execPath, [require.resolve('prisma/build/index.js'), 'migrate', 'deploy', '--schema', path.join(backendRoot, 'prisma/schema.prisma')], { env: config, cwd: backendRoot, stdio: 'inherit', windowsHide: true });
  if (migrated.status !== 0) throw new Error('Disposable migration failed');
  for (const [args, cwd] of [
    [['--import', 'tsx', path.join(backendRoot, 'testing/browser-server.ts')], backendRoot],
    [[path.join(path.dirname(require.resolve('vite/package.json', { paths: [path.join(root, 'frontend')] })), 'bin/vite.js'), '--port', '5183', '--host', '127.0.0.1', '--strictPort'], path.join(root, 'frontend')],
  ]) {
    const child = spawn(process.execPath, args, { cwd, env: config, stdio: ['ignore', 'inherit', 'inherit'], windowsHide: true });
    children.push(child);
    child.on('error', () => { process.exitCode = 1; void stop(); });
    child.on('exit', () => { if (!stopping) { process.exitCode = 1; void stop(); } });
  }
  console.log('Open http://localhost:5183. Type stop to finish and remove only this owned disposable database.');
  process.stdin.on('data', (data) => { if (String(data).trim() === 'stop') void stop(); });
  process.stdin.resume();
  process.on('SIGINT', () => void stop());
  process.on('SIGTERM', () => void stop());
} catch (error) { console.error(error.message); process.exitCode = 1; void stop(); }
