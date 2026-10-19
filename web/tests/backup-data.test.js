import test from 'node:test';
import assert from 'node:assert/strict';
import { DATA_KEYS, RECOVERY_KEY, collectData, createBackup,
  validateBackup, restoreBackup, deviceFileName } from '../src/backup-data.js';

class MemoryStorage {
  constructor() { this.items = new Map(); }
  getItem(key) { return this.items.get(key) ?? null; }
  setItem(key, value) { this.items.set(key, String(value)); }
  removeItem(key) { this.items.delete(key); }
}

function seededStorage() {
  const storage = new MemoryStorage();
  storage.setItem(DATA_KEYS[0], JSON.stringify({ version: 2, records: [{
    id: 'record-test', studentName: 'طالب اختبار', items: [{ item: 'أ', score: '✓' }],
    summary: { percentage: 100, correct: 1, total: 1 },
  }] }));
  storage.setItem(DATA_KEYS[1], 'المعلم التجريبي');
  storage.setItem(DATA_KEYS[5], JSON.stringify({ version: 3, rosters: [{
    id: 'class-test', name: 'صف اختبار', names: ['طالب اختبار'],
    students: [{ id: 'student-test', name: 'طالب اختبار' }],
  }] }));
  storage.setItem(DATA_KEYS[4], JSON.stringify({ q: ['أ'], res: [], pos: 0 }));
  storage.setItem('msal.secret-token', 'DO-NOT-EXPORT');
  storage.setItem('tibyan.onedrive.settings', '{"clientId":"not-app-data"}');
  return storage;
}

test('Arabic rosters, results and draft survive a complete backup round trip', () => {
  const original = seededStorage();
  const text = JSON.stringify(createBackup(original, 'device-a'));
  const destination = new MemoryStorage();
  destination.setItem(DATA_KEYS[1], 'قبل الاستعادة');
  restoreBackup(destination, text, 'device-b');
  assert.deepEqual(collectData(destination), collectData(original));
  assert.equal(JSON.parse(destination.getItem(RECOVERY_KEY)).data[DATA_KEYS[1]], 'قبل الاستعادة');
  assert.equal(destination.getItem('msal.secret-token'), null);
  assert.equal(text.includes('DO-NOT-EXPORT'), false);
  assert.equal(text.includes('not-app-data'), false);
});

test('Unsupported, incomplete, injected-key and malformed backups cannot replace local data', () => {
  const storage = seededStorage();
  const baseline = collectData(storage);
  const valid = createBackup(storage, 'device-a');
  const incomplete = structuredClone(valid); delete incomplete.data[DATA_KEYS[0]];
  const injected = structuredClone(valid); injected.data['msal.secret-token'] = 'injected';
  const malformed = structuredClone(valid); malformed.data[DATA_KEYS[5]] = '{"rosters":[{}]}';
  for (const text of ['broken', '{}', JSON.stringify({ ...valid, schemaVersion: 99 }),
    JSON.stringify(incomplete), JSON.stringify(injected), JSON.stringify(malformed)]) {
    assert.throws(() => restoreBackup(storage, text, 'device-a'));
    assert.deepEqual(collectData(storage), baseline);
  }
});

test('A recovery-copy failure aborts before any local records change', () => {
  const source = seededStorage();
  const destination = seededStorage();
  destination.setItem(DATA_KEYS[1], 'بيانات لن تتغير');
  const baseline = collectData(destination);
  const set = destination.setItem.bind(destination);
  destination.setItem = (key, value) => {
    if (key === RECOVERY_KEY) throw new Error('quota exceeded');
    set(key, value);
  };
  assert.throws(() => restoreBackup(destination, JSON.stringify(createBackup(source, 'device-a')), 'device-b'));
  assert.deepEqual(collectData(destination), baseline);
});

test('An interrupted restore rolls back the already changed keys', () => {
  const source = seededStorage();
  source.setItem(DATA_KEYS[1], 'new teacher');
  const destination = seededStorage();
  const baseline = collectData(destination);
  const set = destination.setItem.bind(destination);
  let failOnce = true;
  destination.setItem = (key, value) => {
    if (key === DATA_KEYS[5] && failOnce) { failOnce = false; throw new Error('write failed'); }
    set(key, value);
  };
  assert.throws(() => restoreBackup(destination, JSON.stringify(createBackup(source, 'device-a')), 'device-b'));
  assert.deepEqual(collectData(destination), baseline);
});

test('Device backup filenames cannot overwrite another device or inject a path', () => {
  assert.notEqual(deviceFileName('device-a'), deviceFileName('device-b'));
  assert.throws(() => deviceFileName('../other'));
  assert.throws(() => deviceFileName(''));
});

test('An empty new installation is a valid portable backup', () => {
  const storage = new MemoryStorage();
  const backup = validateBackup(JSON.stringify(createBackup(storage, 'new-device')));
  assert.equal(Object.keys(backup.data).length, DATA_KEYS.length);
});
