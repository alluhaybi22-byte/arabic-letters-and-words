import { deviceFileName, validateBackup } from './backup-data.js';

const API = 'https://www.googleapis.com/drive/v3';
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3/files';

export function createDriveApi(getAccessToken, fetcher = fetch) {
  async function request(url, options = {}, sessionToken = getAccessToken()) {
    if (getAccessToken() !== sessionToken) {
      const error = new Error('Google account changed during request');
      error.status = 401;
      throw error;
    }
    const response = await fetcher(url, {
      ...options,
      headers: { ...options.headers, Authorization: `Bearer ${sessionToken}` },
    });
    if (!response.ok) {
      const error = new Error('Google Drive request failed');
      error.status = response.status;
      throw error;
    }
    return response;
  }

  async function list(sessionToken = getAccessToken()) {
    const files = [];
    let pageToken;
    do {
      const params = new URLSearchParams({
        spaces: 'appDataFolder', pageSize: '100',
        fields: 'nextPageToken,files(id,name,size,modifiedTime)',
        q: 'trashed = false',
      });
      if (pageToken) params.set('pageToken', pageToken);
      const data = await (await request(`${API}/files?${params}`, {}, sessionToken)).json();
      files.push(...(data.files || []).filter(file => /^Tibyan-[a-zA-Z0-9-]+\.json$/.test(file.name)));
      pageToken = data.nextPageToken;
    } while (pageToken);
    return files.sort((a, b) => b.modifiedTime.localeCompare(a.modifiedTime));
  }

  async function upload(text, deviceId) {
    validateBackup(text);
    const sessionToken = getAccessToken();
    const name = deviceFileName(deviceId);
    const existing = (await list(sessionToken)).find(file => file.name === name);
    const url = existing ? `${UPLOAD}/${encodeURIComponent(existing.id)}` : UPLOAD;
    const metadata = existing ? { name } : { name, parents: ['appDataFolder'] };
    const start = await request(`${url}?uploadType=resumable&fields=id,name,modifiedTime,size`, {
      method: existing ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Upload-Content-Type': 'application/json' },
      body: JSON.stringify(metadata),
    }, sessionToken);
    const location = start.headers.get('Location');
    if (!location || !location.startsWith(UPLOAD + '?') && !location.startsWith(UPLOAD + '/')) {
      throw new Error('Invalid Drive upload session');
    }
    const result = await (await request(location, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: text,
    }, sessionToken)).json();
    if (!result.id) throw new Error('Drive did not confirm the saved file');
    return result;
  }

  async function read(id) {
    const response = await request(`${API}/files/${encodeURIComponent(id)}?alt=media`);
    const text = await response.text();
    validateBackup(text);
    return text;
  }
  return { list, upload, read };
}
