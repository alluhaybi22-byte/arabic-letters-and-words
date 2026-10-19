import { PublicClientApplication } from '@azure/msal-browser';
import { MICROSOFT_CLIENT_ID } from './cloud-config.js';
import { collectData, createBackup, validateBackup, restoreBackup,
  deviceFileName, backupSummary, RECOVERY_KEY, MAX_BACKUP_BYTES } from './backup-data.js';

const SETTINGS = 'tibyan.onedrive.settings';
const DEVICE = 'tibyan.backup.device';
const GRAPH = 'https://graph.microsoft.com/v1.0';
const SCOPES = ['Files.ReadWrite.AppFolder'];
const byId = id => document.getElementById(id);
let settings = {};
try { settings = JSON.parse(localStorage.getItem(SETTINGS) || '{}'); } catch { /* Fresh settings. */ }
if (!settings || typeof settings !== 'object' || Array.isArray(settings)) settings = {};
if (!settings.clientId && MICROSOFT_CLIENT_ID) settings.clientId = MICROSOFT_CLIENT_ID;
let deviceId = localStorage.getItem(DEVICE);
if (!deviceId || !/^[a-zA-Z0-9-]{1,80}$/.test(deviceId)) {
  deviceId = crypto.randomUUID();
  localStorage.setItem(DEVICE, deviceId);
}
let client;
let account;
let timer;
let retryTimer;
let saving = false;
let pending = false;
let paused = false;
let folderId;
let lastData;
let generation = 0;

function persistSettings() { localStorage.setItem(SETTINGS, JSON.stringify(settings)); }
function status(message) {
  byId('cloudStatus').textContent = message;
  byId('cloudBadge').textContent = message;
}
function updateButtons() {
  const connected = Boolean(account);
  byId('cloudSave').disabled = !connected || saving;
  byId('cloudList').disabled = !connected || saving;
  byId('cloudDisconnect').disabled = !connected;
  byId('cloudConnect').disabled = connected;
  byId('cloudClientId').disabled = connected;
  byId('cloudAuto').disabled = !connected;
  byId('cloudAuto').checked = Boolean(settings.auto);
  byId('cloudAccount').textContent = account?.username || 'لم يتم تسجيل الدخول';
  byId('cloudLastSave').textContent = settings.lastSavedAt
    ? 'آخر حفظ ناجح من هذا المتصفح: ' + new Date(settings.lastSavedAt).toLocaleString('ar-SA') : 'لا يوجد حفظ سحابي مؤكد من هذا المتصفح.';
}

function errorMessage(error) {
  if (!navigator.onLine) return 'لا يوجد اتصال. بياناتك محفوظة محليًا وسيُعاد الحفظ عند عودة الإنترنت.';
  if (error?.status === 403) return 'رفض OneDrive صلاحية مجلد التطبيق. راجع موافقة الحساب أو مسؤول Microsoft.';
  if (error?.status === 401 || error?.name === 'InteractionRequiredAuthError') {
    return 'انتهت جلسة Microsoft. افصل الربط ثم سجّل الدخول مجددًا؛ بياناتك المحلية محفوظة.';
  }
  if (error?.status === 429) return 'OneDrive يطلب الانتظار قليلًا. ستبقى البيانات محليًا ويمكن إعادة الحفظ.';
  return error?.message?.startsWith('Tibyan:') ? error.message.slice(7) : 'تعذر الاتصال بـ OneDrive. بياناتك المحلية محفوظة؛ حاول مرة أخرى.';
}

async function initialize() {
  if (!settings.clientId) { status('OneDrive غير مربوط — يلزم إعداد Microsoft أولًا'); updateButtons(); return; }
  client = new PublicClientApplication({
    auth: {
      clientId: settings.clientId,
      authority: 'https://login.microsoftonline.com/common',
      redirectUri: new URL('./', location.href).href,
      navigateToLoginRequestUrl: false,
    },
    cache: { cacheLocation: 'sessionStorage' },
  });
  await client.initialize();
  const result = await client.handleRedirectPromise();
  if (result?.account) {
    account = result.account;
    settings.accountId = account.homeAccountId;
    settings.auto = true;
    persistSettings();
  } else {
    account = client.getAllAccounts().find(item => item.homeAccountId === settings.accountId);
  }
  if (account) client.setActiveAccount(account);
  status(account ? 'OneDrive متصل — جارٍ التحقق من الحفظ' : 'OneDrive غير متصل — سجّل الدخول');
  updateButtons();
  if (account && settings.auto) scheduleSave();
}

async function graph(path, options = {}) {
  const token = await client.acquireTokenSilent({ scopes: SCOPES, account });
  const response = await fetch(GRAPH + path, {
    ...options,
    headers: { ...options.headers, Authorization: `Bearer ${token.accessToken}` },
  });
  if (!response.ok) {
    const error = new Error('Graph request failed');
    error.status = response.status;
    throw error;
  }
  return response.json();
}

async function getFolder() {
  if (!folderId) folderId = (await graph('/me/drive/special/approot')).id;
  return encodeURIComponent(folderId);
}

async function saveNow(force = false) {
  if (navigator.locks) {
    return navigator.locks.request('tibyan-onedrive-upload', () => performSave(force));
  }
  return performSave(force);
}

async function performSave(force = false) {
  if (paused || !account) return;
  if (saving) { pending = true; return; }
  saving = true;
  updateButtons();
  const currentGeneration = generation;
  try {
    const data = JSON.stringify(collectData(localStorage));
    if (!force && data === lastData) { status('محفوظ في OneDrive'); return; }
    if (!navigator.onLine) throw new Error('offline');
    status('جارٍ حفظ نسخة في OneDrive…');
    const folder = await getFolder();
    // A distinct file per device avoids replacing another device's data.
    const body = JSON.stringify(createBackup(localStorage, deviceId), null, 2);
    validateBackup(body);
    if (paused || currentGeneration !== generation) return;
    await graph(`/me/drive/items/${folder}:/${deviceFileName(deviceId)}:/content`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body,
    });
    if (currentGeneration !== generation) return;
    lastData = data;
    settings.lastSavedAt = new Date().toISOString();
    persistSettings();
    status('محفوظ في OneDrive');
    clearTimeout(retryTimer);
  } catch (error) {
    status(errorMessage(error));
    if (settings.auto && account && navigator.onLine && [429, 500, 502, 503, 504].includes(error.status)) {
      clearTimeout(retryTimer);
      retryTimer = setTimeout(() => saveNow(), 60000);
    }
  } finally {
    saving = false;
    updateButtons();
    if (pending) { pending = false; scheduleSave(); }
  }
}

function scheduleSave() {
  if (!settings.auto || !account || paused) return;
  clearTimeout(timer);
  timer = setTimeout(() => saveNow(), 2000);
  status('محفوظ محليًا — بانتظار الحفظ في OneDrive');
}

function download(text, name) {
  const anchor = document.createElement('a');
  anchor.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  anchor.download = name;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(anchor.href), 1000);
}

function applyRestore(text) {
  const backup = validateBackup(text);
  if (!confirm(`استعادة ${backupSummary(backup)}؟ ستُستبدل البيانات المحلية، وتُحفظ نسخة استرجاع قبل الاستبدال.`)) return;
  if (saving) throw new Error('Tibyan:انتظر اكتمال الحفظ الجاري ثم أعد الاستعادة.');
  paused = true;
  clearTimeout(timer);
  clearTimeout(retryTimer);
  try { restoreBackup(localStorage, text, deviceId); }
  catch (error) { paused = false; throw error; }
  location.reload();
}

async function listBackups() {
  try {
    status('جارٍ قراءة النسخ من OneDrive…');
    const folder = await getFolder();
    const result = await graph(`/me/drive/items/${folder}/children?$top=200&$select=id,name,size,lastModifiedDateTime`);
    const list = byId('cloudFiles');
    list.replaceChildren();
    const files = result.value.filter(file => /^Tibyan-[a-zA-Z0-9-]+\.json$/.test(file.name))
      .sort((a, b) => b.lastModifiedDateTime.localeCompare(a.lastModifiedDateTime));
    for (const file of files) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'secondary';
      button.textContent = `استعادة نسخة ${new Date(file.lastModifiedDateTime).toLocaleString('ar-SA')} — ${file.name}`;
      button.addEventListener('click', async () => {
        try {
          if (file.size > MAX_BACKUP_BYTES) throw new Error('Tibyan:حجم النسخة أكبر من الحد المدعوم.');
          const item = await graph(`/me/drive/items/${encodeURIComponent(file.id)}?$select=id,size,@microsoft.graph.downloadUrl`);
          const url = new URL(item['@microsoft.graph.downloadUrl']);
          if (url.protocol !== 'https:') throw new Error('Invalid download URL');
          // Download URLs are pre-authorized; do not forward the Graph access token.
          const response = await fetch(url.href, { credentials: 'omit' });
          if (!response.ok) throw new Error('download failed');
          applyRestore(await response.text());
        } catch (error) { status(errorMessage(error)); }
      });
      list.append(button);
    }
    status(files.length ? 'اختر نسخة لاستعادتها؛ لا تُدمج بيانات الأجهزة تلقائيًا.' : 'لا توجد نسخ Tibyan في هذا الحساب بعد.');
  } catch (error) { status(errorMessage(error)); }
}

function mount() {
  byId('cloudClientId').value = settings.clientId || '';
  byId('cloudRedirectUri').textContent = new URL('./', location.href).href;
  byId('cloudOpen').onclick = () => byId('cloudDialog').showModal();
  byId('cloudClose').onclick = () => byId('cloudDialog').close();
  byId('cloudConnect').onclick = async () => {
    const clientId = byId('cloudClientId').value.trim();
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clientId)) {
      status('يلزم إعداد تطبيق Microsoft أولًا وإدخال معرّف التطبيق الصحيح.');
      byId('cloudSetup').open = true;
      byId('cloudClientId').focus();
      return;
    }
    try {
      if (settings.clientId !== clientId) {
        settings = { clientId, auto: false };
        persistSettings();
        await initialize();
      }
      await client.loginRedirect({ scopes: SCOPES, prompt: 'select_account' });
    } catch (error) { status(errorMessage(error)); }
  };
  byId('cloudSave').onclick = () => saveNow(true);
  byId('cloudList').onclick = listBackups;
  byId('cloudDisconnect').onclick = async () => {
    paused = true;
    generation += 1;
    clearTimeout(timer);
    clearTimeout(retryTimer);
    settings.auto = false;
    delete settings.accountId;
    persistSettings();
    if (client && account) await client.clearCache({ account });
    account = null;
    folderId = null;
    byId('cloudFiles').replaceChildren();
    status('تم فصل OneDrive. النسخ السحابية والبيانات المحلية محفوظة.');
    updateButtons();
    paused = false;
  };
  byId('cloudAuto').onchange = () => {
    settings.auto = byId('cloudAuto').checked;
    persistSettings();
    clearTimeout(timer);
    clearTimeout(retryTimer);
    if (settings.auto) scheduleSave();
    else status('الحفظ التلقائي متوقف — بياناتك محفوظة محليًا');
  };
  byId('backupExport').onclick = () => download(JSON.stringify(createBackup(localStorage, deviceId), null, 2), 'Tibyan-backup.json');
  byId('backupImport').onchange = async event => {
    try {
      const file = event.target.files[0];
      if (!file) return;
      if (file.size > MAX_BACKUP_BYTES) throw new Error('Tibyan:حجم النسخة يتجاوز 20 ميجابايت.');
      applyRestore(await file.text());
    } catch (error) { status(error.message); }
    finally { event.target.value = ''; }
  };
  byId('backupRecovery').onclick = () => {
    const text = localStorage.getItem(RECOVERY_KEY);
    if (text) download(text, 'Tibyan-before-restore.json');
    else status('لا توجد نسخة استرجاع سابقة في هذا المتصفح.');
  };
  window.addEventListener('tibyan:data-changed', scheduleSave);
  window.addEventListener('storage', event => {
    if (event.key === SETTINGS) {
      let other;
      try { other = JSON.parse(event.newValue || '{}'); } catch { return; }
      if (other.clientId !== settings.clientId || other.accountId !== settings.accountId) {
        paused = true;
        clearTimeout(timer);
        status('تغيّر حساب OneDrive في نافذة أخرى؛ أعد فتح الصفحة لتأكيد الحساب.');
      } else {
        settings.auto = Boolean(other.auto);
        if (!settings.auto) clearTimeout(timer);
        updateButtons();
      }
      return;
    }
    if (event.key?.startsWith('lughaty-web.local.')) scheduleSave();
  });
  window.addEventListener('online', scheduleSave);
  window.addEventListener('tibyan:pause-backup', () => {
    paused = true;
    settings.auto = false;
    persistSettings();
    clearTimeout(timer);
    clearTimeout(retryTimer);
  });
  initialize().catch(error => { status(errorMessage(error)); updateButtons(); });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
else mount();
