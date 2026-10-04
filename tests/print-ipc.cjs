const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const handlers = new Map(), windows = [], writes = [], removed = [];
let printers = [{name:'Test printer'}], printError = null, canceled = false, loadFailure = false;
class BrowserWindow {
  constructor(options) {
    this.options=options; this.callbacks={}; this.parent=options.parent || null; this.visible=false;
    this.webContents={id:windows.length+1,setWindowOpenHandler:fn=>this.openHandler=fn,on(){},
      getPrintersAsync:async()=>printers,
      print:(options,callback)=>{this.printOptions=options;if(printError)throw new Error(printError);callback(true,'')},
      printToPDF:async options=>{this.pdfOptions=options;return Buffer.from('PDF-test')}};
    windows.push(this);
  }
  async loadFile(file){this.file=file;if(loadFailure)throw new Error('load failed')}
  once(event,fn){this.callbacks[event]=fn}
  show(){this.visible=true}
  getParentWindow(){return this.parent}
  isDestroyed(){return !!this.destroyed}
  destroy(){this.destroyed=true;this.callbacks.closed?.()}
  static fromWebContents(sender){return windows.find(window=>window.webContents===sender)}
  static getAllWindows(){return windows}
}
const electron={BrowserWindow,app:{whenReady:()=>Promise.resolve(),on(){},quit(){}},shell:{openExternal(){}},ipcMain:{handle:(key,fn)=>handlers.set(key,fn)},dialog:{showSaveDialog:async()=>({canceled,filePath:'/tmp/test.pdf'})}};
const fakeFs={mkdtemp:async()=>'/tmp/test-preview',writeFile:async(...args)=>writes.push(args),rm:async(...args)=>removed.push(args)};
const context=vm.createContext({__dirname:'/app',process:{platform:'win32'},Buffer,console,
  require:name=>name==='electron'?electron:name==='node:fs/promises'?fakeFs:name==='./profile-policy'?{configureUserData:()=>{}}:require(name)});
vm.runInContext(fs.readFileSync(__dirname+'/../main.js','utf8'),context);
(async()=>{
  await Promise.resolve();
  const main=windows[0];assert.equal(main.options.webPreferences.preload,path.join('/app','print-bridge.js'));
  await assert.rejects(()=>handlers.get('preview:open')({sender:{id:999}},'<html/>'),/غير معتمد/);
  const opened=await handlers.get('preview:open')({sender:main.webContents},'<html lang="ar"><body>تقرير</body></html>');
  assert.equal(opened.opened,true);
  const preview=windows[1];assert.equal(preview.parent,main);assert.equal(preview.visible,true);
  assert.equal(preview.options.webPreferences.preload,path.join('/app','print-bridge.js'));assert.equal(preview.file,path.join('/tmp/test-preview','report.html'));
  const event={sender:preview.webContents};
  assert.equal((await handlers.get('preview:print')(event)).success,true);
  assert.equal(preview.printOptions.pageSize,'A4');assert.equal(preview.printOptions.silent,false);
  printers=[];const noPrinter=await handlers.get('preview:print')(event);assert.equal(noPrinter.success,false);assert.match(noPrinter.reason,/PDF/);
  printers=[{name:'Test'}];printError='spooler unavailable';assert.equal((await handlers.get('preview:print')(event)).reason,printError);printError=null;
  assert.equal((await handlers.get('preview:pdf')(event)).saved,true);assert.equal(preview.pdfOptions.preferCSSPageSize,true);
  assert.ok(writes.some(([path])=>path==='/tmp/test.pdf'));
  canceled=true;assert.equal((await handlers.get('preview:pdf')(event)).canceled,true);
  await assert.rejects(()=>handlers.get('preview:print')({sender:main.webContents}),/غير معتمدة/);
  preview.destroy();assert.ok(removed.length);
  await assert.rejects(()=>handlers.get('preview:print')(event),/غير معتمدة/);
  loadFailure=true;await assert.rejects(()=>handlers.get('preview:open')({sender:main.webContents},'<html/>'),/load failed/);
  console.log('PASS: main preview preload/ownership, native print A4, missing printer, spooler error, PDF saving/cancel, temporary file cleanup');
})().catch(error=>{console.error(error);process.exitCode=1});
