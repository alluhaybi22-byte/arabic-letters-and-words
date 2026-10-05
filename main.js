const { app, BrowserWindow, shell, ipcMain, dialog, session } = require("electron");
const path = require("node:path");
const fs = require("node:fs/promises");
const {authorizeFrame,protectSession,protectReport}=require('./security-policy');
const {previewStorage}=require('./preview-storage');
const {configureUserData} = require("./profile-policy");
const {setupUpdates} = require("./update-service");

// A separate profile starts empty and never imports another installation's data.
configureUserData(app);
const reports=previewStorage(app.getPath('userData'));

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 900,
    minWidth: 720,
    minHeight: 580,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: "#f1f6fb",
    icon: path.join(__dirname, "brand", "icon.png"),
    title: "الاختبار التشخيصي الشفوي | لغتي الجميلة",
    webPreferences: {
      preload: path.join(__dirname, "print-bridge.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  mainWindow.loadFile(path.join(__dirname, "index.html"));
  mainWindow.once("ready-to-show", () => mainWindow.show());
  mainWindow.webContents.on("will-navigate", event => event.preventDefault());

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // Reports use the dedicated authenticated preview IPC, never arbitrary URLs.
    try {
      const link=new URL(url);
      const repository='/alluhaybi22-byte/arabic-letters-and-words';
      if(link.protocol==='https:' && link.hostname==='github.com' && !link.username && !link.password &&
        (link.pathname===repository || link.pathname.startsWith(repository+'/'))) {
        shell.openExternal(link.href).catch(()=>{});
      }
    } catch {}
    return {action:'deny'};
  });
}

const previews = new Set();
const busyPreviews = new Set();
const pendingPrints = new Set();
const previewDocuments = new Map();
const previewFiles = new Map();

ipcMain.handle("preview:open", async (event, html) => {
  authorizeFrame(event,mainWindow,path.join(__dirname,'index.html'));
  if (typeof html !== "string" || Buffer.byteLength(html,'utf8') > 8 * 1024 * 1024) {
    throw new Error("طلب معاينة غير معتمد");
  }
  const {directory,file}=await reports.create(protectReport(html));
  let window;
  try {
    window = new BrowserWindow({
      parent: mainWindow, width: 1100, height: 900, minWidth: 720, minHeight: 580,
      show: false, autoHideMenuBar: true, backgroundColor: "#ffffff",
      title: "معاينة الطباعة — لغتي الجميلة",
      webPreferences: {preload: path.join(__dirname, "print-bridge.js"), contextIsolation: true, nodeIntegration: false, sandbox: true}
    });
    previews.add(window.webContents.id);
    previewFiles.set(window.webContents.id,file);
    const senderId = window.webContents.id;
    window.webContents.setWindowOpenHandler(() => ({action: "deny"}));
    window.once("closed", () => {
      previews.delete(senderId);
      busyPreviews.delete(senderId);
      pendingPrints.delete(senderId);
      previewDocuments.delete(senderId);
      previewFiles.delete(senderId);
      reports.remove(directory).catch(() => {});
    });
    await window.loadFile(file);
    window.show();
    window.focus();
    return {opened: true};
  } catch (error) {
    if (window && !window.isDestroyed()) window.destroy();
    await reports.remove(directory);
    throw error;
  }
});

function previewWindow(event) {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (!window || !previews.has(event.sender.id) || event.senderFrame !== event.sender.mainFrame || window.getParentWindow() !== mainWindow) {
    throw new Error("طلب طباعة من نافذة غير معتمدة");
  }
  authorizeFrame(event,window,previewFiles.get(event.sender.id));
  return window;
}

async function previewDocument(window) {
  const id = window.webContents.id;
  if (!previewDocuments.has(id)) {
    const pending = window.webContents.printToPDF({printBackground: true, preferCSSPageSize: true, pageSize: "A4"});
    previewDocuments.set(id, pending);
    pending.catch(() => previewDocuments.delete(id));
  }
  return previewDocuments.get(id);
}

ipcMain.handle("preview:document", async event => {
  const window = previewWindow(event);
  return new Uint8Array(await previewDocument(window));
});

ipcMain.handle("preview:printers", async event => {
  const window = previewWindow(event);
  return (await window.webContents.getPrintersAsync()).map(({name, displayName, isDefault}) => ({name, displayName, isDefault}));
});

ipcMain.handle("preview:print", async (event, options) => {
  const window = previewWindow(event);
  if (pendingPrints.has(event.sender.id)) return {success: false, pending: true, reason: "لم تؤكد الطابعة انتهاء الطلب السابق. تحقق من قائمة انتظار الطباعة؛ لم تُرسل مهمة أخرى."};
  if (busyPreviews.has(event.sender.id)) return {success: false, reason: "هناك طلب طباعة أو حفظ قيد التنفيذ."};
  busyPreviews.add(event.sender.id);
  try {
    const printers = await window.webContents.getPrintersAsync();
    if (!printers.length) return {success: false, reason: "لا توجد طابعة مثبتة في Windows. يمكنك حفظ التقرير بصيغة PDF."};
    if (!options || !printers.some(printer => printer.name === options.deviceName)) return {success: false, reason: "اختر طابعة متاحة ثم أعد المحاولة."};
    const copies = options.copies ?? 1;
    if (!Number.isInteger(copies) || copies < 1 || copies > 99) return {success: false, reason: "عدد النسخ يجب أن يكون بين 1 و99."};
    return await new Promise(resolve => {
      const id = event.sender.id;
      pendingPrints.add(id);
      const timer = setTimeout(() => resolve({success: false, pending: true,
        reason: "تأخر تأكيد الطابعة. قد تكون المهمة في قائمة انتظار Windows؛ تحقق منها قبل إعادة الطباعة. يمكنك حفظ PDF."}), 60000);
      const complete = (success, reason) => {
        clearTimeout(timer);
        pendingPrints.delete(id);
        resolve({success, reason: reason || ""});
      };
      // The user has already chosen a printer beside the real PDF page preview.
      // Windows' native printer dialog does not supply Chromium's page preview.
      try { window.webContents.print({silent: true, deviceName: options.deviceName, copies, printBackground: true, pageSize: "A4"}, complete); }
      catch (error) { clearTimeout(timer); pendingPrints.delete(id); throw error; }
    });
  } catch (error) {
    return {success: false, reason: error.message};
  } finally {
    busyPreviews.delete(event.sender.id);
  }
});

ipcMain.handle("preview:pdf", async event => {
  const window = previewWindow(event);
  if (busyPreviews.has(event.sender.id)) return {error: "هناك طلب طباعة أو حفظ قيد التنفيذ."};
  busyPreviews.add(event.sender.id);
  try {
  const { canceled, filePath } = await dialog.showSaveDialog(window, {
    title: "حفظ التقرير بصيغة PDF",
    defaultPath: "تقرير-لغتي.pdf",
    filters: [{name: "PDF", extensions: ["pdf"]}]
  });
  if (canceled || !filePath) return {canceled: true};
    const pdf = await previewDocument(window);
    await fs.writeFile(filePath, pdf);
    return {saved: true};
  } catch (error) {
    return {error: error.message};
  } finally {
    busyPreviews.delete(event.sender.id);
  }
});

app.on("browser-window-created", (_, window) => {
  if (window !== mainWindow && window.getParentWindow() === mainWindow) {
    window.webContents.on("will-navigate", event => event.preventDefault());
  }
});

if(!app.requestSingleInstanceLock()) app.quit();
else app.whenReady().then(async () => {
  // The single-instance lock prevents removal of another live window's report.
  await reports.cleanup();
  protectSession(session.defaultSession);
  createWindow();
  setupUpdates({app,ipcMain,dialog,getWindow:()=>mainWindow,
    canInstall:()=>mainWindow.webContents.executeJavaScript("typeof readDraft === 'function' && !readDraft() && !pendingRosterImport && document.getElementById('test').classList.contains('hidden')")});

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
}).catch(error=>{
  dialog.showErrorBox('تعذر تشغيل البرنامج','تعذر تجهيز مساحة معاينة آمنة. بيانات الطلاب لم تُحذف.');
  app.quit();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
