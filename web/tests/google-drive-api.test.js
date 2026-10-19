import test from 'node:test';
import assert from 'node:assert/strict';
import { createDriveApi } from '../src/google-drive-api.js';
import { createBackup } from '../src/backup-data.js';

const backup = JSON.stringify(createBackup({ getItem: () => null }, 'device-a'));
const json = data => new Response(JSON.stringify(data), { status: 200 });
const uploadSession = () => new Response('', {
  status: 200, headers: { Location: 'https://www.googleapis.com/upload/drive/v3/files?upload_id=test' },
});

test('Create an isolated app-data backup and return success only after content is confirmed', async () => {
  const calls = [];
  const responses = [json({ files: [] }), uploadSession(), json({ id: 'saved-id', name: 'Tibyan-device-a.json' })];
  const drive = createDriveApi(() => 'TOKEN', async (url, options) => {
    calls.push({ url, options }); return responses.shift();
  });
  const result = await drive.upload(backup, 'device-a');
  assert.equal(result.id, 'saved-id');
  assert.equal(new URL(calls[0].url).searchParams.get('spaces'), 'appDataFolder');
  assert.equal(calls[1].options.method, 'POST');
  assert.deepEqual(JSON.parse(calls[1].options.body).parents, ['appDataFolder']);
  assert.equal(calls[2].options.method, 'PUT');
  assert.equal(calls[2].options.body, backup);
  assert.equal(calls[2].options.headers.Authorization, 'Bearer TOKEN');
  assert.equal(backup.includes('TOKEN'), false);
});

test('A device updates its own existing backup and does not replace another device', async () => {
  const calls = [];
  const responses = [json({ files: [
    { id: 'other', name: 'Tibyan-device-b.json', modifiedTime: '2026-10-19T08:00:00Z' },
    { id: 'own', name: 'Tibyan-device-a.json', modifiedTime: '2026-10-19T07:00:00Z' },
  ] }), uploadSession(), json({ id: 'own' })];
  const drive = createDriveApi(() => 'TOKEN', async (url, options) => {
    calls.push({ url, options }); return responses.shift();
  });
  await drive.upload(backup, 'device-a');
  assert.match(calls[1].url, /\/files\/own\?/);
  assert.equal(calls[1].options.method, 'PATCH');
  assert.equal(calls.some(call => /\/files\/other/.test(call.url)), false);
});

test('An upload error is propagated and cannot count as a saved backup', async () => {
  const responses = [json({ files: [] }), uploadSession(), new Response('unavailable', { status: 503 })];
  const drive = createDriveApi(() => 'TOKEN', async () => responses.shift());
  await assert.rejects(drive.upload(backup, 'device-a'), error => error.status === 503);
});

test('Invalid backup files are rejected before any Google request', async () => {
  let calls = 0;
  const drive = createDriveApi(() => 'TOKEN', async () => { calls++; return json({}); });
  await assert.rejects(drive.upload('{}', 'device-a'));
  assert.equal(calls, 0);
});

test('Backup listing follows pagination and excludes unrelated app files', async () => {
  const urls = [];
  const pages = [json({ nextPageToken: 'opaque-next', files: [{ id: 'unrelated', name: 'config.json' }] }),
    json({ files: [{ id: 'valid', name: 'Tibyan-device-a.json', modifiedTime: '2026-10-19T08:00:00Z' }] })];
  const drive = createDriveApi(() => 'TOKEN', async url => { urls.push(url); return pages.shift(); });
  assert.deepEqual((await drive.list()).map(file => file.id), ['valid']);
  assert.equal(new URL(urls[1]).searchParams.get('pageToken'), 'opaque-next');
});

test('No token is forwarded to a foreign resumable-upload URL', async () => {
  let calls = 0;
  const responses = [json({ files: [] }), new Response('', { status: 200,
    headers: { Location: 'https://example.com/upload' } })];
  const drive = createDriveApi(() => 'TOKEN', async () => { calls++; return responses.shift(); });
  await assert.rejects(drive.upload(backup, 'device-a'));
  assert.equal(calls, 2);
});
