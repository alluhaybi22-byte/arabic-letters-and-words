const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("printActions", {
  openPreview: html => ipcRenderer.invoke("preview:open", html),
  print: () => ipcRenderer.invoke("preview:print"),
  savePdf: () => ipcRenderer.invoke("preview:pdf")
});
