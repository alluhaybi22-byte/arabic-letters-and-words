const { app, BrowserWindow, shell, ipcMain, dialog } = require("electron");
const path = require("node:path");
const fs = require("node:fs/promises");
const os = require("node:os");
const {configureUserData} = require("./profile-policy");

// A separate profile starts empty and never imports another installation's data.
configureUserData(app);

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

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url === "about:blank") {
      return {
        action: "allow",
        overrideBrowserWindowOptions: {
          parent: mainWindow,
          width: 1040,
          height: 900,
          minWidth: 750,
          minHeight: 600,
          autoHideMenuBar: true,
          backgroundColor: "#ffffff",
          webPreferences: {
            preload: path.join(__dirname, "print-bridge.js"),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true
          }
        }
      };
    }
    if (url.endsWith(".pdf")) {
      return {
        action: "allow",
        overrideBrowserWindowOptions: {
          width: 1280,
          height: 900,
          minWidth: 900,
          minHeight: 650,
          autoHideMenuBar: true,
          backgroundColor: "#ffffff",
          webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true
          }
        }
      };
    }
    if (url.startsWith("https://")) {
      shell.openExternal(url);
    }
    return { action: "deny" };
  });
}

const previews = new Set();
const busyPreviews = new Set();

ipcMain.handle("preview:open", async (event, html) => {
  if (event.sender !== mainWindow.webContents || typeof html !== "string" || html.length > 8 * 1024 * 1024) {
    throw new Error("طلب معاينة غير معتمد");
  }
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "lughaty-print-"));
  const file = path.join(directory, "report.html");
  let window;
  try {
    await fs.writeFile(file, html, "utf8");
    window = new BrowserWindow({
      parent: mainWindow, width: 1100, height: 900, minWidth: 720, minHeight: 580,
      show: false, autoHideMenuBar: true, backgroundColor: "#ffffff",
      title: "معاينة الطباعة — لغتي الجميلة",
      webPreferences: {preload: path.join(__dirname, "print-bridge.js"), contextIsolation: true, nodeIntegration: false, sandbox: true}
    });
    previews.add(window.webContents.id);
    const senderId = window.webContents.id;
    window.webContents.setWindowOpenHandler(() => ({action: "deny"}));
    window.once("closed", () => {
      previews.delete(senderId);
      busyPreviews.delete(senderId);
      fs.rm(directory, {recursive: true, force: true}).catch(() => {});
    });
    await window.loadFile(file);
    window.show();
    return {opened: true};
  } catch (error) {
    if (window && !window.isDestroyed()) window.destroy();
    await fs.rm(directory, {recursive: true, force: true});
    throw error;
  }
});

function previewWindow(event) {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (!window || !previews.has(event.sender.id) || window.getParentWindow() !== mainWindow) {
    throw new Error("طلب طباعة من نافذة غير معتمدة");
  }
  return window;
}

ipcMain.handle("preview:print", async event => {
  const window = previewWindow(event);
  if (busyPreviews.has(event.sender.id)) return {success: false, reason: "هناك طلب طباعة أو حفظ قيد التنفيذ."};
  busyPreviews.add(event.sender.id);
  try {
    const printers = await window.webContents.getPrintersAsync();
    if (!printers.length) return {success: false, reason: "لا توجد طابعة مثبتة في Windows. يمكنك حفظ التقرير بصيغة PDF."};
    return await new Promise(resolve => {
      window.webContents.print({silent: false, printBackground: true, pageSize: "A4"}, (success, reason) => {
        resolve({success, reason: reason || ""});
      });
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
    const pdf = await window.webContents.printToPDF({
      printBackground: true,
      preferCSSPageSize: true,
      pageSize: "A4"
    });
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

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
