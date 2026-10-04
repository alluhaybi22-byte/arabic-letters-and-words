const path = require('node:path');
const {pathToFileURL} = require('node:url');

function setupUpdates({app,ipcMain,dialog,getWindow,canInstall,platform=process.platform,getUpdater=()=>require('electron-updater').autoUpdater}) {
  const supported=app.isPackaged && platform==='win32';
  const expectedUrl=pathToFileURL(path.join(__dirname,'index.html')).href;
  let state={status:supported?'idle':'unsupported',currentVersion:app.getVersion(),version:null,percent:0,
    message:supported?'اضغط للتحقق من وجود إصدار أحدث.':'التحديث متاح في النسخة المثبتة على Windows.'};
  let operation=null;
  const updater=supported?getUpdater():null;
  function publish(status,message,values={}) {
    state={...state,...values,status,message};
    const window=getWindow();
    if(window && !window.isDestroyed()) window.webContents.send('updates:changed',state);
    return {...state};
  }
  function authorize(event) {
    const window=getWindow();
    if(!window || window.isDestroyed() || event.sender!==window.webContents ||
      !event.senderFrame || event.senderFrame!==event.sender.mainFrame || event.senderFrame.url!==expectedUrl) {
      throw new Error('طلب تحديث من مصدر غير معتمد');
    }
  }
  function failed(error) {
    const text=String(error?.code||'')+' '+String(error?.message||'');
    if(/ERR_UPDATER_NO_PUBLISHED_VERSIONS|ERR_UPDATER_LATEST_VERSION_NOT_FOUND|ERR_UPDATER_CHANNEL_FILE_NOT_FOUND|404.*(?:Not Found|latest\.yml)/i.test(text)) {
      return publish('not-published','لم يُنشر إصدار للتحديث بعد. يمكنك متابعة استخدام النسخة الحالية.',{version:null,percent:0});
    }
    if(/sha512|checksum|ERR_UPDATER_INVALID_SIGNATURE|signature/i.test(text)) {
      return publish('error','رُفض التحديث لأن التحقق من سلامة الملف أو توقيعه لم ينجح. لن يُثبّت.',{percent:0});
    }
    return publish('error','تعذر الاتصال بخدمة التحديث أو تنزيل الملف. تحقق من الإنترنت ثم أعد المحاولة.',{percent:0});
  }
  if(updater) {
    updater.autoDownload=false;
    updater.autoInstallOnAppQuit=false;
    updater.allowDowngrade=false;
    updater.allowPrerelease=false;
    updater.disableWebInstaller=true;
    updater.logger=null;
    // Feed comes only from the packaged app-update.yml for the owner's repository.
    // Never accept a feed, installer path, or URL from the renderer.
    updater.on('checking-for-update',()=>publish('checking','جارٍ التحقق من وجود تحديث...'));
    updater.on('update-available',info=>publish('available','يتوفر إصدار أحدث. اختر تنزيل التحديث.',{version:info.version,percent:0}));
    updater.on('update-not-available',()=>publish('current','لديك أحدث إصدار منشور.',{version:null,percent:0}));
    updater.on('download-progress',info=>publish('downloading','جارٍ تنزيل التحديث...',
      {percent:Math.max(0,Math.min(100,Number(info.percent)||0))}));
    updater.on('update-downloaded',info=>publish('downloaded','اكتمل التنزيل والتحقق. احفظ عملك ثم اختر تثبيت التحديث.',{version:info.version,percent:100}));
    updater.on('error',failed);
  }
  ipcMain.handle('updates:state',event=>{authorize(event);return {...state};});
  ipcMain.handle('updates:check',async event=>{
    authorize(event);
    if(!supported||operation||state.status==='downloaded'||state.status==='installing')return {...state};
    operation='check';
    try {publish('checking','جارٍ التحقق من وجود تحديث...');await updater.checkForUpdates();}
    catch(error){failed(error);}
    finally{operation=null;}
    return {...state};
  });
  ipcMain.handle('updates:download',async event=>{
    authorize(event);
    if(!supported||operation||state.status!=='available')return {...state};
    operation='download';
    try {publish('downloading','جارٍ تنزيل التحديث...',{percent:0});await updater.downloadUpdate();}
    catch(error){failed(error);}
    finally{operation=null;}
    return {...state};
  });
  ipcMain.handle('updates:install',async event=>{
    authorize(event);
    if(!supported||operation||state.status!=='downloaded')return {...state};
    operation='install';
    try {
      if(!await canInstall())return publish('downloaded','احفظ الاختبار غير المكتمل أو أنهِ مراجعة الأسماء قبل تثبيت التحديث.');
      const window=getWindow();
      const result=await dialog.showMessageBox(window,{type:'question',title:'تثبيت التحديث',
        message:'سيُغلق البرنامج لتثبيت التحديث ثم يُعاد تشغيله. تبقى بيانات الطلاب محفوظة.',
        buttons:['تثبيت وإعادة التشغيل','لاحقًا'],defaultId:1,cancelId:1,noLink:true});
      if(result.response!==0)return publish('downloaded','التحديث جاهز؛ يمكنك تثبيته لاحقًا.');
      // Recheck after the confirmation; no automatic installation on normal quit.
      if(!await canInstall())return publish('downloaded','احفظ الاختبار أو أنهِ مراجعة الأسماء قبل التثبيت.');
      publish('installing','جارٍ إغلاق البرنامج وتثبيت التحديث...');
      setImmediate(()=>{try{updater.quitAndInstall(true,true);}catch(error){failed(error);}});
    } catch(error){failed(error);}
    finally{operation=null;}
    return {...state};
  });
  return {getState:()=>({...state})};
}

module.exports={setupUpdates};
