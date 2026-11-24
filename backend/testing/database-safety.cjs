const fs = require('node:fs');
const path = require('node:path');

const backendRoot = path.resolve(__dirname, '..');
const testRoot = path.join(backendRoot, '.test-databases');
const runIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

function reject(reason) {
  throw new Error(`Unsafe test database configuration: ${reason}. Use npm run test:backend.`);
}

function assertNoAliases(target) {
  const parsed = path.parse(target);
  let current = parsed.root;
  for (const part of target.slice(parsed.root.length).split(path.sep).filter(Boolean)) {
    current = path.join(current, part);
    if (!fs.existsSync(current)) {
      // existsSync is false for a dangling symbolic link too.
      try { fs.lstatSync(current); reject('symbolic links are forbidden'); }
      catch (error) { if (error.code !== 'ENOENT') throw error; }
      continue;
    }
    const stat = fs.lstatSync(current);
    if (stat.isSymbolicLink()) reject('symbolic links or junctions are forbidden');
    if (path.resolve(fs.realpathSync.native(current)).toLowerCase() !== current.toLowerCase()) {
      reject('filesystem aliases are forbidden');
    }
  }
}

function assertSafeTestDatabase(config = process.env, requirePrepared = false) {
  if (config.NODE_ENV !== 'test') reject('NODE_ENV must explicitly equal test');
  if (!config.PROFARM_TEST_DATABASE_URL || !config.DATABASE_URL) reject('test database URL is missing');
  if (config.DATABASE_URL !== config.PROFARM_TEST_DATABASE_URL) reject('database URLs must match');
  if (!runIdPattern.test(config.PROFARM_TEST_RUN_ID || '')) reject('a valid disposable run ID is required');

  const url = config.DATABASE_URL;
  if (!url.startsWith('file:') || /[?#%\0]/.test(url)) reject('only an unambiguous SQLite file URL is accepted');
  const raw = url.slice(5);
  if (!path.isAbsolute(raw) || raw.startsWith('//') || raw.startsWith('\\\\')) reject('an absolute local path is required');
  if (raw.split(/[\\/]/).some((part) => part === '..' || part === '.')) reject('path traversal is forbidden');
  const databasePath = path.resolve(raw);
  const runDirectory = path.join(testRoot, `run-${config.PROFARM_TEST_RUN_ID}`);
  if (databasePath !== path.join(runDirectory, 'test.db')) reject('target is outside its approved disposable run directory');
  assertNoAliases(databasePath);
  for (const suffix of ['', '-journal', '-wal', '-shm']) {
    const file = databasePath + suffix;
    assertNoAliases(file);
    if (fs.existsSync(file)) {
      const stat = fs.lstatSync(file);
      if (!stat.isFile() || stat.nlink !== 1) reject('database files must be regular files without hard links');
    }
  }
  const marker = path.join(runDirectory, '.profarm-test-run');
  assertNoAliases(marker);
  if (fs.existsSync(marker)) {
    const stat = fs.lstatSync(marker);
    if (!stat.isFile() || stat.nlink !== 1 || fs.readFileSync(marker, 'utf8') !== config.PROFARM_TEST_RUN_ID) {
      reject('run ownership marker is invalid');
    }
  } else if (requirePrepared) reject('run ownership marker is missing');
  return { databasePath, runDirectory };
}

function prepareTestDatabase(config) {
  const target = assertSafeTestDatabase(config);
  if (!fs.existsSync(testRoot)) fs.mkdirSync(testRoot);
  assertNoAliases(testRoot);
  // Never reuse or reset an existing run, even if its name looks valid.
  fs.mkdirSync(target.runDirectory);
  fs.writeFileSync(path.join(target.runDirectory, '.profarm-test-run'), config.PROFARM_TEST_RUN_ID, { flag: 'wx' });
  return assertSafeTestDatabase(config, true);
}

function cleanupTestDatabase(config) {
  const target = assertSafeTestDatabase(config, true);
  function removeOwnedTree(directory) {
    assertNoAliases(directory);
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      assertNoAliases(file);
      const stat = fs.lstatSync(file);
      if (stat.isDirectory()) removeOwnedTree(file);
      else if (stat.isFile() && stat.nlink === 1) fs.unlinkSync(file);
      else reject('cleanup encountered an unexpected filesystem object');
    }
    fs.rmdirSync(directory);
  }
  // The marker and exact resolved target are checked before scoped cleanup.
  removeOwnedTree(target.runDirectory);
}

module.exports = { backendRoot, testRoot, assertSafeTestDatabase, prepareTestDatabase, cleanupTestDatabase };
