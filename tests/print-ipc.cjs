const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const {pathToFileURL}=require('node:url');
const handlers = new Map(), windows = [], writes = [], removed = [];
const timers = new Map(); let timerId = 0;
let printers = [{name:'Test printer'}], printError = null, canceled = false, loadFailure = false;
class BrowserWindow {
  constructor(options) {
    this.options=options; this.callbacks={}; this.parent=options.parent || null; this.visible=false;
    this.webContents={id:windows.length+1,mainFrame:{},setWindowOpenHandler:fn=>this.openHandler=fn,on(){},
      getPrintersAsync:async()=>printers,
      print:(options,callback)=>{this.printOptions=options;if(printError)throw new Error(printError);callback(true,'')},
      printToPDF:async options=>{this.pdfOptions=options;return Buffer.from('PDF-test')}};
    windows.push(this);
  }
  async loadFile(file){this.file=file;this.webContents.mainFrame.url=pathToFileURL(file).href;if(loadFailure)throw new Error('load failed')}
  once(event,fn){this.callbacks[event]=fn}
  show(){this.visible=true}
  focus(){this.focused=true}
  getParentWindow(){return this.parent}
  isDestroyed(){return !!this.destroyed}
  destroy(){this.destroyed=true;this.callbacks.closed?.()}
  static fromWebContents(sender){return windows.find(window=>window.webContents===sender)}
  static getAllWindows(){return windows}
}
let sessionProtected=false,cleanupDone=false;
const electron={BrowserWindow,app:{whenReady:()=>Promise.resolve(),requestSingleInstanceLock:()=>true,getPath:()=>'/profile',on(){},quit(){}},session:{defaultSession:{setPermissionRequestHandler(){},setPermissionCheckHandler(){},webRequest:{onHeadersReceived(){sessionProtected=true;}}}},shell:{openExternal(){}},ipcMain:{handle:(key,fn)=>handlers.set(key,fn)},dialog:{showErrorBox(){throw new Error('Startup failure')},showSaveDialog:async()=>({canceled,filePath:'/tmp/test.pdf'})}};
const fakeFs={mkdtemp:async()=>'/tmp/test-preview',writeFile:async(...args)=>writes.push(args),rm:async(...args)=>removed.push(args)};
const context=vm.createContext({__dirname:'/app',process:{platform:'win32'},Buffer,console,
  setTimeout:fn=>{timers.set(++timerId,fn);return timerId},clearTimeout:id=>timers.delete(id),
  require:name=>name==='electron'?electron:name==='node:fs/promises'?fakeFs:name==='./profile-policy'?{configureUserData:()=>{}}:name==='./update-service'?{setupUpdates:()=>{}}:name==='./security-policy'?require('../security-policy'):name==='./preview-storage'?{previewStorage:()=>({cleanup:async()=>{cleanupDone=true},create:async html=>{writes.push(['/tmp/test-preview/report.html',html]);return {directory:'/tmp/test-preview',file:'/tmp/test-preview/report.html'}},remove:async directory=>removed.push(directory)})}:require(name)});
vm.runInContext(fs.readFileSync(__dirname+'/../main.js','utf8'),context);
(async()=>{
  await Promise.resolve();
  await new Promise(setImmediate);
  assert.equal(cleanupDone,true);assert.equal(sessionProtected,true);
  const main=windows[0];assert.equal(main.options.webPreferences.preload,path.join('/app','print-bridge.js'));
  for(const url of ['about:blank','https://foreign.invalid/report.pdf','file:///outside/report.pdf','https://github.com.attacker.invalid/report.pdf']) assert.equal(main.openHandler({url}).action,'deny');
  await assert.rejects(()=>handlers.get('preview:open')({sender:{id:999}},'<html/>'),/غير معتمد/);
  const safeHtml='<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"></head><body>تقرير</body></html>';
  const opened=await handlers.get('preview:open')({sender:main.webContents,senderFrame:main.webContents.mainFrame},safeHtml);
  assert.ok(writes[0][1].includes('Content-Security-Policy'));
  assert.equal(opened.opened,true);
  const preview=windows[1];assert.equal(preview.parent,main);assert.equal(preview.visible,true);
  assert.equal(preview.options.webPreferences.preload,path.join('/app','print-bridge.js'));assert.equal(preview.file,'/tmp/test-preview/report.html');
  const event={sender:preview.webContents,senderFrame:preview.webContents.mainFrame};
  const expectedUrl=preview.webContents.mainFrame.url;
  preview.webContents.mainFrame.url='https://foreign.invalid/report.pdf';
  for(const channel of ['preview:document','preview:printers','preview:print','preview:pdf']) await assert.rejects(()=>handlers.get(channel)(event),/غير معتمد/);
  preview.webContents.mainFrame.url=expectedUrl;
  assert.equal((await handlers.get('preview:print')(event,{deviceName:'Test printer',copies:2})).success,true);
  assert.equal(preview.printOptions.pageSize,'A4');assert.equal(preview.printOptions.silent,true);
  assert.equal(preview.printOptions.deviceName,'Test printer');assert.equal(preview.printOptions.copies,2);
  assert.equal((await handlers.get('preview:print')(event,{deviceName:'unknown'})).success,false);
  assert.equal((await handlers.get('preview:print')(event,{deviceName:'Test printer',copies:0})).success,false);
  await assert.rejects(()=>handlers.get('preview:document')({...event,senderFrame:{}}),/غير معتمدة/);
  const document=await handlers.get('preview:document')(event);assert.equal(Buffer.from(document).toString(),'PDF-test');
  const nativePrint=preview.webContents.print; let lateCallback,dispatches=0;
  preview.webContents.print=(_options,callback)=>{dispatches++;lateCallback=callback};
  const stalled=handlers.get('preview:print')(event,{deviceName:'Test printer'});
  await new Promise(setImmediate);
  for(const fn of timers.values()) fn();
  assert.equal((await stalled).pending,true,'Missing native callback returns an uncertain result');
  assert.equal((await handlers.get('preview:print')(event,{deviceName:'Test printer'})).pending,true);
  assert.equal(dispatches,1,'Timeout must not send duplicate print jobs');
  assert.equal((await handlers.get('preview:pdf')(event)).saved,true,'PDF remains available after timeout');
  lateCallback(true,'');assert.equal(timers.size,0);
  preview.webContents.print=nativePrint;
  assert.equal((await handlers.get('preview:print')(event,{deviceName:'Test printer'})).success,true);
  assert.equal((await handlers.get('preview:printers')(event))[0].name,'Test printer');
  printers=[];const noPrinter=await handlers.get('preview:print')(event);assert.equal(noPrinter.success,false);assert.match(noPrinter.reason,/PDF/);
  printers=[{name:'Test'}];printError='spooler unavailable';assert.equal((await handlers.get('preview:print')(event,{deviceName:'Test'})).reason,printError);printError=null;
  assert.equal((await handlers.get('preview:pdf')(event)).saved,true);assert.equal(preview.pdfOptions.preferCSSPageSize,true);
  assert.ok(writes.some(([path])=>path==='/tmp/test.pdf'));
  canceled=true;assert.equal((await handlers.get('preview:pdf')(event)).canceled,true);
  await assert.rejects(()=>handlers.get('preview:print')({sender:main.webContents,senderFrame:main.webContents.mainFrame}),/غير معتمدة/);
  preview.destroy();assert.ok(removed.length);
  await assert.rejects(()=>handlers.get('preview:print')(event),/غير معتمدة/);
  loadFailure=true;await assert.rejects(()=>handlers.get('preview:open')({sender:main.webContents,senderFrame:main.webContents.mainFrame},safeHtml),/load failed/);
  console.log('PASS: main preview preload/ownership, PDF document preview, selected native printer A4, missing printer, spooler error, PDF saving/cancel, temporary file cleanup');
})().catch(error=>{console.error(error);process.exitCode=1});
