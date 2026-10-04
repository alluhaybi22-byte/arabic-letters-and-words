const assert=require('node:assert/strict'),{EventEmitter}=require('node:events'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const {setupUpdates}=require('../update-service');

function fixture({supported=true}={}) {
  const handlers=new Map(),messages=[];let confirm=1,allow=true,installed=0,checks=0,downloads=0;
  const sender={mainFrame:{url:pathToFileURL(path.join(__dirname,'../index.html')).href},send:(channel,state)=>messages.push({...state})};
  const window={webContents:sender,isDestroyed:()=>false};
  const updater=new EventEmitter();
  updater.checkForUpdates=async()=>{checks++;updater.emit('update-available',{version:'1.3.5'})};
  updater.downloadUpdate=async()=>{downloads++;updater.emit('download-progress',{percent:25});updater.emit('update-downloaded',{version:'1.3.5'})};
  updater.quitAndInstall=(silent,restart)=>{assert.equal(silent,true);assert.equal(restart,true);installed++};
  const service=setupUpdates({app:{isPackaged:supported,getVersion:()=> '1.3.4'},platform:'win32',
    ipcMain:{handle:(name,handler)=>handlers.set(name,handler)},dialog:{showMessageBox:async()=>({response:confirm})},
    getWindow:()=>window,canInstall:async()=>allow,getUpdater:()=>updater});
  return {handlers,updater,service,messages,sender,event:{sender,senderFrame:sender.mainFrame},
    allow:value=>allow=value,confirm:value=>confirm=value,counts:()=>({installed,checks,downloads})};
}
(async()=>{
  const f=fixture();const call=(name,event=f.event)=>Promise.resolve().then(()=>f.handlers.get('updates:'+name)(event));
  assert.equal(f.updater.autoDownload,false);assert.equal(f.updater.autoInstallOnAppQuit,false);
  assert.equal(f.updater.allowDowngrade,false);assert.equal(f.updater.allowPrerelease,false);assert.equal(f.updater.disableWebInstaller,true);
  for(const name of ['state','check','download','install']) {
    await assert.rejects(call(name,{sender:{},senderFrame:f.sender.mainFrame}),/غير معتمد/);
    await assert.rejects(call(name,{sender:f.sender,senderFrame:{url:'https://foreign.invalid/'}}),/غير معتمد/);
    const original=f.sender.mainFrame.url;f.sender.mainFrame.url='https://foreign.invalid/';
    await assert.rejects(call(name),/غير معتمد/);f.sender.mainFrame.url=original;
  }
  assert.equal((await call('state')).status,'idle');assert.equal((await call('download')).status,'idle');
  assert.equal((await call('check')).status,'available');assert.equal(f.counts().downloads,0);
  assert.equal((await call('download')).status,'downloaded');assert.ok(f.messages.some(state=>state.percent===25));
  await call('check');assert.equal(f.counts().checks,1,'ready update must not be discarded');
  f.allow(false);assert.match((await call('install')).message,/احفظ/);assert.equal(f.counts().installed,0);
  f.allow(true);assert.equal((await call('install')).status,'downloaded');assert.equal(f.counts().installed,0,'cancel must not quit app');
  f.confirm(0);assert.equal((await call('install')).status,'installing');await new Promise(setImmediate);assert.equal(f.counts().installed,1);
  const g=fixture();g.updater.checkForUpdates=async()=>{throw Object.assign(new Error('No published versions'),{code:'ERR_UPDATER_NO_PUBLISHED_VERSIONS'})};
  assert.equal((await g.handlers.get('updates:check')(g.event)).status,'not-published');
  g.updater.checkForUpdates=async()=>{g.updater.emit('update-available',{version:'1.3.5'})};await g.handlers.get('updates:check')(g.event);
  g.updater.downloadUpdate=async()=>{throw new Error('sha512 checksum mismatch')};assert.match((await g.handlers.get('updates:download')(g.event)).message,/رُفض/);
  await g.handlers.get('updates:install')(g.event);assert.equal(g.counts().installed,0,'invalid download must never execute');
  g.updater.checkForUpdates=async()=>{throw new Error('network unavailable')};assert.equal((await g.handlers.get('updates:check')(g.event)).status,'error');
  let release;g.updater.checkForUpdates=()=>new Promise(resolve=>{release=resolve});const pending=g.handlers.get('updates:check')(g.event);
  assert.equal((await g.handlers.get('updates:check')(g.event)).status,'checking');release();await pending;
  const unsupported=fixture({supported:false});assert.equal((await unsupported.handlers.get('updates:check')(unsupported.event)).status,'unsupported');
  console.log('PASS: update IPC authorization, explicit download/install, draft guard, cancel, checksum rejection, missing releases, network errors and concurrency');
})().catch(error=>{console.error(error);process.exitCode=1});
