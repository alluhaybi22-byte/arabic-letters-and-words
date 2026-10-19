export const DATA_KEYS = Object.freeze([
  'lughaty-web.local.records',
  'lughaty-web.local.teacher-name',
  'lughaty-web.local.principal-name',
  'lughaty-web.local.school-info',
  'lughaty-web.local.draft',
  'lughaty-web.local.roster',
  'lughaty-web.local.test-sessions',
  'lughaty-web.local.preferred-level',
]);

export const RECOVERY_KEY = 'tibyan.backup.before-restore';
export const MAX_BACKUP_BYTES = 20 * 1024 * 1024;

export function collectData(storage) {
  return Object.fromEntries(DATA_KEYS.map(key => [key, storage.getItem(key)]));
}

export function createBackup(storage, deviceId) {
  return {
    application: 'Tibyan',
    schemaVersion: 1,
    savedAt: new Date().toISOString(),
    deviceId,
    data: collectData(storage),
  };
}

function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function validateBackup(text) {
  if (new TextEncoder().encode(text).length > MAX_BACKUP_BYTES) {
    throw new Error('حجم النسخة يتجاوز 20 ميجابايت.');
  }
  let backup;
  try { backup = JSON.parse(text); } catch {
    throw new Error('الملف ليس نسخة JSON صالحة.');
  }
  if (backup?.application !== 'Tibyan' || backup.schemaVersion !== 1 || !object(backup.data)) {
    throw new Error('هذا الملف ليس نسخة احتياطية مدعومة من Tibyan.');
  }
  if (Object.keys(backup.data).length !== DATA_KEYS.length ||
      DATA_KEYS.some(key => !Object.hasOwn(backup.data, key)) ||
      Object.keys(backup.data).some(key => !DATA_KEYS.includes(key))) {
    throw new Error('بيانات النسخة غير مكتملة أو تحتوي حقولًا غير مسموحة.');
  }
  for (const key of DATA_KEYS) {
    const value = backup.data[key];
    if (value === null) continue;
    if (typeof value !== 'string') throw new Error('صيغة بيانات النسخة غير صالحة.');
    if (key.endsWith('-name') || key.endsWith('preferred-level')) continue;
    let parsed;
    try { parsed = JSON.parse(value); } catch { throw new Error('بيانات داخل النسخة غير صالحة.'); }
    if (!object(parsed)) throw new Error('بنية بيانات النسخة غير صالحة.');
    if (key.endsWith('.records') && (!Array.isArray(parsed.records) ||
        parsed.records.some(record => !object(record) || !Array.isArray(record.items) || !object(record.summary)))) {
      throw new Error('سجل النتائج في النسخة غير صالح.');
    }
    if (key.endsWith('.roster') && (!Array.isArray(parsed.rosters) ||
        parsed.rosters.some(roster => !object(roster) || !Array.isArray(roster.names) || !Array.isArray(roster.students)))) {
      throw new Error('كشوف الطلاب في النسخة غير صالحة.');
    }
    if (key.endsWith('.draft') && (!Array.isArray(parsed.q) || !Array.isArray(parsed.res))) {
      throw new Error('مسودة الاختبار في النسخة غير صالحة.');
    }
  }
  return backup;
}

export function restoreBackup(storage, text, deviceId) {
  const backup = validateBackup(text);
  const previous = collectData(storage);
  // If the recovery copy cannot be saved (for example, quota exceeded), abort before mutation.
  storage.setItem(RECOVERY_KEY, JSON.stringify(createBackup(storage, deviceId)));
  try {
    for (const key of DATA_KEYS) {
      const value = backup.data[key];
      if (value === null) storage.removeItem(key);
      else storage.setItem(key, value);
    }
  } catch (error) {
    for (const key of DATA_KEYS) {
      const value = previous[key];
      if (value === null) storage.removeItem(key);
      else storage.setItem(key, value);
    }
    throw error;
  }
  return backup;
}

export function deviceFileName(deviceId) {
  if (!/^[a-zA-Z0-9-]{1,80}$/.test(deviceId)) throw new Error('معرّف الجهاز غير صالح.');
  return `Tibyan-${deviceId}.json`;
}

export function backupSummary(backup) {
  const rosters = JSON.parse(backup.data['lughaty-web.local.roster'] || '{"rosters":[]}').rosters;
  const records = JSON.parse(backup.data['lughaty-web.local.records'] || '{"records":[]}').records;
  return `${rosters.length} صف · ${records.length} نتيجة`;
}
