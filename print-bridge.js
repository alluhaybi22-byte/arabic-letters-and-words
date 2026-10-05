const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("printActions", {
  openPreview: html => ipcRenderer.invoke("preview:open", html),
  getDocument: () => ipcRenderer.invoke("preview:document"),
  getPrinters: () => ipcRenderer.invoke("preview:printers"),
  print: options => ipcRenderer.invoke("preview:print", options),
  savePdf: () => ipcRenderer.invoke("preview:pdf")
});

contextBridge.exposeInMainWorld("updateActions", {
  getState:()=>ipcRenderer.invoke('updates:state'),
  check:()=>ipcRenderer.invoke('updates:check'),
  download:()=>ipcRenderer.invoke('updates:download'),
  install:()=>ipcRenderer.invoke('updates:install'),
  onState:callback=>{
    if(typeof callback!=='function')return ()=>{};
    const listener=(_event,state)=>callback(state);
    ipcRenderer.on('updates:changed',listener);
    return ()=>ipcRenderer.removeListener('updates:changed',listener);
  }
});
