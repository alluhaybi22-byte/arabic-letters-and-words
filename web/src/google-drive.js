import { GOOGLE_CLIENT_ID } from './cloud-config.js';
import { collectData, createBackup, validateBackup, restoreBackup,
  backupSummary, RECOVERY_KEY, MAX_BACKUP_BYTES } from './backup-data.js';
import { createDriveApi } from './google-drive-api.js';

const SETTINGS = 'tibyan.google-drive.settings';
const DEVICE = 'tibyan.backup.device';
const SCOPE = 'https://www.googleapis.com/auth/drive.appdata';
const byId = id => document.getElementById(id);
let settings = {};
try { settings = JSON.parse(localStorage.getItem(SETTINGS) || '{}'); } catch { /* Fresh settings. */ }
if (!settings || typeof settings !== 'object' || Array.isArray(settings)) settings = {};
if (!settings.clientId && GOOGLE_CLIENT_ID) settings.clientId = GOOGLE_CLIENT_ID;
let deviceId = localStorage.getItem(DEVICE);
if (!deviceId || !/^[a-zA-Z0-9-]{1,80}$/.test(deviceId)) {
  deviceId = crypto.randomUUID();
  localStorage.setItem(DEVICE, deviceId);
}
let accessToken = '';
let expiresAt = 0;
let expiryTimer;
let timer;
let retryTimer;
let saving = false;
let pending = false;
let paused = false;
let authorizing = false;
let lastData;
let generation = 0;
let sdkPromise;

function persistSettings() { localStorage.setItem(SETTINGS, JSON.stringify(settings)); }
function status(message) {
  byId('cloudStatus').textContent = message;
  byId('cloudBadge').textContent = message;
}
function connected() { return Boolean(accessToken) && Date.now() < expiresAt; }
function updateButtons() {
  const active = connected();
  byId('cloudSave').disabled = !active || saving;
  byId('cloudList').disabled = !active || saving;
  byId('cloudDisconnect').disabled = !active && !authorizing;
  byId('cloudConnect').disabled = active || authorizing;
  byId('cloudClientId').disabled = active || authorizing;
  byId('cloudAuto').disabled = !active;
  byId('cloudAuto').checked = Boolean(settings.auto);
  byId('cloudAccount').textContent = active ? 'Google Drive مفوّض للحساب الذي اخترته في نافذة Google' : 'لم يتم ربط Google Drive في هذه الجلسة';
  byId('cloudLastSave').textContent = settings.lastSavedAt
    ? 'آخر حفظ ناجح من هذا المتصفح: ' + new Date(settings.lastSavedAt).toLocaleString('ar-SA') : 'لا يوجد حفظ سحابي مؤكد من هذا المتصفح.';
}

function clearSession() {
  generation += 1;
  accessToken = '';
  expiresAt = 0;
  clearTimeout(timer);
  clearTimeout(retryTimer);
  clearTimeout(expiryTimer);
  lastData = undefined;
  byId('cloudFiles').replaceChildren();
  updateButtons();
}

function errorMessage(error) {
  if (!navigator.onLine) return 'لا يوجد اتصال. بياناتك محلية وسيُعاد الحفظ عند عودة الإنترنت ما دامت الجلسة سارية.';
  if (error?.status === 401) {
    clearSession();
    return 'انتهت جلسة Google. اضغط ربط حساب Google لتجديدها؛ بياناتك المحلية محفوظة.';
  }
  if (error?.status === 403) return 'رفض Google Drive الوصول. تحقق من تفعيل Drive API وصلاحية بيانات التطبيق في إعداد Google.';
  if (error?.status === 429) return 'Google Drive يطلب الانتظار. ستبقى البيانات محليًا ويمكن إعادة الحفظ.';
  return error?.message?.startsWith('Tibyan:') ? error.message.slice(7) : 'تعذر الاتصال بـ Google Drive. بياناتك المحلية محفوظة؛ حاول مرة أخرى.';
}

const drive = createDriveApi(() => {
  if (!connected()) { const error = new Error('Expired Google token'); error.status = 401; throw error; }
  return accessToken;
});

function loadGoogle() {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => window.google?.accounts?.oauth2 ? resolve() : reject(new Error('SDK unavailable'));
    script.onerror = () => { script.remove(); sdkPromise = null; reject(new Error('Google SDK failed')); };
    document.head.append(script);
  });
  return sdkPromise;
}

function authorize() {
  const clientId = byId('cloudClientId').value.trim();
  if (!/^[0-9]+-[a-zA-Z0-9_-]+\.apps\.googleusercontent\.com$/.test(clientId)) {
    status('يلزم إعداد تسجيل Google للتطبيق أولًا وإدخال OAuth Client ID الصحيح.');
    byId('cloudSetup').open = true;
    byId('cloudClientId').focus();
    return;
  }
  if (!window.google?.accounts?.oauth2) {
    status('جارٍ تحميل تسجيل Google. اضغط ربط الحساب مرة أخرى بعد اكتمال التحميل.');
    loadGoogle().then(() => status('تسجيل Google جاهز — اضغط ربط حساب Google'))
      .catch(error => status(errorMessage(error)));
    return;
  }
  settings.clientId = clientId;
  persistSettings();
  const attempt = ++generation;
  authorizing = true;
  updateButtons();
  const client = window.google.accounts.oauth2.initTokenClient({
    client_id: clientId, scope: SCOPE, include_granted_scopes: false,
    callback: result => {
      if (attempt !== generation) return;
      authorizing = false;
      if (result.error || !result.access_token) {
        status('لم تتم موافقة Google على الربط. بياناتك المحلية محفوظة.');
        updateButtons();
        return;
      }
      if (!window.google.accounts.oauth2.hasGrantedAllScopes(result, SCOPE)) {
        status('لم تُمنح صلاحية حفظ بيانات تبيان في Drive.');
        updateButtons();
        return;
      }
      accessToken = result.access_token;
      expiresAt = Date.now() + Math.max(0, Number(result.expires_in) - 30) * 1000;
      paused = false;
      lastData = undefined;
      settings.auto = true;
      persistSettings();
      clearTimeout(expiryTimer);
      expiryTimer = setTimeout(() => {
        clearSession();
        status('انتهت جلسة Google. جدّد الربط لمتابعة الحفظ التلقائي؛ بياناتك المحلية محفوظة.');
      }, Math.max(0, expiresAt - Date.now()));
      status('Google Drive متصل — الحفظ التلقائي مفعّل أثناء فتح تبيان');
      updateButtons();
      scheduleSave();
    },
    error_callback: () => {
      if (attempt !== generation) return;
      authorizing = false;
      status('لم يكتمل تسجيل Google. اسمح بنافذة تسجيل الدخول ثم حاول مجددًا.');
      updateButtons();
    },
  });
  try { client.requestAccessToken({ prompt: 'select_account' }); }
  catch (error) { authorizing = false; updateButtons(); status(errorMessage(error)); }
}

async function saveNow(force = false) {
  if (navigator.locks) return navigator.locks.request('tibyan-google-drive-upload', () => performSave(force));
  return performSave(force);
}

async function performSave(force) {
  if (paused || !connected()) return;
  if (saving) { pending = true; return; }
  saving = true;
  updateButtons();
  const currentGeneration = generation;
  try {
    const values = collectData(localStorage);
    const data = JSON.stringify(values);
    if (!force && data === lastData) { status('محفوظ في Google Drive'); return; }
    if (!force && lastData === undefined && Object.values(values).every(value => value === null)) {
      status('Google Drive متصل — أضف بيانات أو اختر نسخة لاستعادتها');
      return;
    }
    if (!navigator.onLine) throw new Error('offline');
    status('جارٍ حفظ نسخة في Google Drive…');
    const body = JSON.stringify(createBackup(localStorage, deviceId), null, 2);
    validateBackup(body);
    if (paused || currentGeneration !== generation) return;
    await drive.upload(body, deviceId);
    if (currentGeneration !== generation) return;
    lastData = data;
    settings.lastSavedAt = new Date().toISOString();
    persistSettings();
    status('محفوظ في Google Drive');
    clearTimeout(retryTimer);
  } catch (error) {
    status(errorMessage(error));
    if (settings.auto && connected() && [429, 500, 502, 503, 504].includes(error.status)) {
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
  if (!settings.auto || !connected() || paused) return;
  clearTimeout(timer);
  timer = setTimeout(() => saveNow(), 2000);
  status('محفوظ محليًا — بانتظار الحفظ في Google Drive');
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
    status('جارٍ قراءة النسخ من Google Drive…');
    const files = await drive.list();
    const list = byId('cloudFiles');
    list.replaceChildren();
    for (const file of files) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'secondary';
      button.textContent = `استعادة نسخة ${new Date(file.modifiedTime).toLocaleString('ar-SA')} — ${file.name}`;
      button.addEventListener('click', async () => {
        try {
          if (Number(file.size) > MAX_BACKUP_BYTES) throw new Error('Tibyan:حجم النسخة أكبر من الحد المدعوم.');
          applyRestore(await drive.read(file.id));
        } catch (error) { status(errorMessage(error)); }
      });
      list.append(button);
    }
    status(files.length ? 'اختر نسخة لاستعادتها؛ لا تُدمج بيانات الأجهزة تلقائيًا.' : 'لا توجد نسخ Tibyan في حساب Google هذا بعد.');
  } catch (error) { status(errorMessage(error)); }
}

function mount() {
  byId('cloudClientId').value = settings.clientId || '';
  byId('cloudRedirectUri').textContent = location.origin;
  byId('cloudOpen').onclick = () => {
    byId('cloudDialog').showModal();
    if (settings.clientId) loadGoogle().catch(error => status(errorMessage(error)));
  };
  byId('cloudClose').onclick = () => byId('cloudDialog').close();
  byId('cloudConnect').onclick = authorize;
  byId('cloudSave').onclick = () => saveNow(true);
  byId('cloudList').onclick = listBackups;
  byId('cloudDisconnect').onclick = () => {
    authorizing = false;
    clearSession();
    settings.auto = false;
    persistSettings();
    status('تم فصل Google Drive من تبيان. النسخ السحابية والبيانات المحلية محفوظة.');
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
      try {
        const other = JSON.parse(event.newValue || '{}');
        if (other.clientId !== settings.clientId || !other.auto) {
          paused = true;
          clearTimeout(timer);
          status('تغيّر ربط Google Drive في نافذة أخرى؛ جدّد الربط من هذه الصفحة.');
        }
      } catch { /* Ignore invalid unrelated settings. */ }
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
  status(settings.clientId ? 'Google Drive غير متصل — اضغط ربط حساب Google' : 'Google Drive غير مربوط — يلزم إعداد تسجيل Google أولًا');
  updateButtons();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
else mount();
