const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const vm = require('node:vm');
const { backendRoot, testRoot, assertSafeTestDatabase, prepareTestDatabase, cleanupTestDatabase } = require('./database-safety.cjs');

function configuration() {
  const id = randomUUID();
  const url = `file:${path.join(testRoot, `run-${id}`, 'test.db').replace(/\\/g, '/')}`;
  return { NODE_ENV: 'test', DATABASE_URL: url, PROFARM_TEST_DATABASE_URL: url, PROFARM_TEST_RUN_ID: id };
}

test('accepts only an explicitly configured disposable target', () => {
  const config = configuration();
  assert.equal(assertSafeTestDatabase(config).databasePath, path.resolve(config.DATABASE_URL.slice(5)));
});
test('rejects a missing URL or run ID and a non-test environment', () => {
  for (const key of ['DATABASE_URL', 'PROFARM_TEST_DATABASE_URL', 'PROFARM_TEST_RUN_ID', 'NODE_ENV']) {
    const config = configuration();
    delete config[key];
    assert.throws(() => assertSafeTestDatabase(config), /Unsafe test database configuration/);
  }
  assert.throws(() => assertSafeTestDatabase({ ...configuration(), NODE_ENV: 'development' }), /NODE_ENV/);
});
test('rejects the development database and arbitrary outside paths', () => {
  for (const target of [path.join(backendRoot, 'prisma', 'dev.db'), path.join(backendRoot, 'other.db')]) {
    const url = `file:${target.replace(/\\/g, '/')}`;
    assert.throws(() => assertSafeTestDatabase({ ...configuration(), DATABASE_URL: url, PROFARM_TEST_DATABASE_URL: url }), /approved disposable/);
  }
});
test('rejects traversal, URL parameters, relative paths and mismatched URLs', () => {
  const config = configuration();
  for (const url of [config.DATABASE_URL.replace('/test.db', '/../test.db'), config.DATABASE_URL + '?mode=rwc', 'file:./test.db']) {
    assert.throws(() => assertSafeTestDatabase({ ...config, DATABASE_URL: url, PROFARM_TEST_DATABASE_URL: url }), /Unsafe test database/);
  }
  assert.throws(() => assertSafeTestDatabase({ ...config, DATABASE_URL: 'file:./dev.db' }), /must match/);
});
test('rejects directory symlinks or Windows junctions without following them', (t) => {
  const config = configuration();
  const { runDirectory } = assertSafeTestDatabase(config);
  if (!fs.existsSync(testRoot)) fs.mkdirSync(testRoot);
  try {
    fs.symlinkSync(path.join(backendRoot, 'testing'), runDirectory, process.platform === 'win32' ? 'junction' : 'dir');
  } catch (error) {
    if (['EPERM', 'ENOTSUP', 'EACCES'].includes(error.code)) return t.skip('Host forbids creating filesystem links; simulated alias rejection is tested separately');
    throw error;
  }
  try { assert.throws(() => assertSafeTestDatabase(config), /symbolic links or junctions/); }
  finally { fs.unlinkSync(runDirectory); }
});
test('rejects hard-linked database files', (t) => {
  const config = configuration();
  const target = prepareTestDatabase(config);
  const original = path.join(target.runDirectory, 'fixture.txt');
  fs.writeFileSync(original, 'disposable fixture', { flag: 'wx' });
  try {
    try { fs.linkSync(original, target.databasePath); }
    catch (error) {
      if (['EPERM', 'ENOTSUP', 'EACCES'].includes(error.code)) return t.skip('Host forbids creating hard links; simulated hard-link rejection is tested separately');
      throw error;
    }
    assert.throws(() => assertSafeTestDatabase(config), /hard links/);
  } finally {
    if (fs.existsSync(target.databasePath)) fs.unlinkSync(target.databasePath);
    cleanupTestDatabase(config);
  }
});
function guardWithFilesystem(overrides) {
  const testModule = { exports: {} };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'database-safety.cjs'), 'utf8'), {
    module: testModule, __dirname, process,
    require: (name) => name === 'node:fs' ? { ...fs, ...overrides } : require(name),
  });
  return testModule.exports.assertSafeTestDatabase;
}
test('fails closed on a simulated junction even when link creation is unavailable', () => {
  const config = configuration();
  const { runDirectory } = assertSafeTestDatabase(config);
  const guard = guardWithFilesystem({
    existsSync: (p) => p === runDirectory || fs.existsSync(p),
    lstatSync: (p) => p === runDirectory ? { isSymbolicLink: () => true } : fs.lstatSync(p),
  });
  assert.throws(() => guard(config), /symbolic links or junctions/);
});
test('fails closed on a simulated hard link even when link creation is unavailable', () => {
  const config = configuration();
  const { databasePath } = assertSafeTestDatabase(config);
  const guard = guardWithFilesystem({
    existsSync: (p) => p === databasePath || fs.existsSync(p),
    lstatSync: (p) => p === databasePath ? { isSymbolicLink: () => false, isFile: () => true, nlink: 2 } : fs.lstatSync(p),
    realpathSync: { native: (p) => p === databasePath ? p : fs.realpathSync.native(p) },
  });
  assert.throws(() => guard(config), /hard links/);
});
test('requires ownership before use, refuses run reuse, and cleans only the owned run', () => {
  const config = configuration();
  assert.throws(() => assertSafeTestDatabase(config, true), /ownership marker/);
  const target = prepareTestDatabase(config);
  assert.throws(() => prepareTestDatabase(config), /EEXIST/);
  fs.writeFileSync(target.databasePath, 'disposable fixture', { flag: 'wx' });
  cleanupTestDatabase(config);
  assert.equal(fs.existsSync(target.runDirectory), false);
  assert.equal(fs.existsSync(path.join(backendRoot, 'testing', 'database-safety.cjs')), true);
});
