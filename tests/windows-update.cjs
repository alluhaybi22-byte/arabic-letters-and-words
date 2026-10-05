const {_electron:electron}=require('playwright');
const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const http=require('node:http'),crypto=require('node:crypto'),{execFile}=require('node:child_process'),{promisify}=require('node:util');
const asar=require('@electron/asar');
const execFileAsync=promisify(execFile),output=path.resolve('release/ui-proof');
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
(async()=>{
  const executablePath=process.env.LUGHATY_EXECUTABLE;
  assert.ok(executablePath,'Installed baseline executable required');
  const filename='Lughaty-Oral-Diagnostic-Setup-1.3.5.exe';
  const payload=await fs.readFile(path.join('release',filename));
  const sha512=crypto.createHash('sha512').update(payload).digest('base64');
  let bad=true,served=0;
  const manifest=`version: 1.3.5\nfiles:\n  - url: ${filename}\n    sha512: ${sha512}\n    size: ${payload.length}\npath: ${filename}\nsha512: ${sha512}\nreleaseDate: '2026-10-05T00:00:00.000Z'\n`;
  const server=http.createServer((req,res)=>{
    const route=new URL(req.url,'http://127.0.0.1').pathname;
    if(route==='/latest.yml'){res.writeHead(200,{'Content-Type':'application/yaml'});res.end(manifest);return;}
    if(route==='/'+filename){served++;const body=bad?Buffer.from('invalid-update-test'):payload;res.writeHead(200,{'Content-Length':body.length,'Content-Type':'application/octet-stream'});res.end(body);return;}
    res.writeHead(404);res.end();
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  let app=await electron.launch({executablePath,timeout:60000});
  try {
    const page=await app.firstWindow();await page.waitForSelector('#student');
    assert.equal(await app.evaluate(({app})=>app.getVersion()),'1.3.4','Private baseline must have an older real version');
    const existing=await page.evaluate(()=>({students:getRosterStore().rosters[0].students.length,records:getStore().records.length}));
    assert.deepEqual(existing,{students:2,records:2});
    await app.evaluate(({app},url)=>{
      const {createRequire}=process.getBuiltinModule('node:module');
      const require=createRequire(app.getAppPath()+'/package.json');
      const updater=require('electron-updater').autoUpdater;
      // Test-only channel override; neither this file nor an override ships in the app.
      updater.setFeedURL({provider:'generic',url});updater.disableDifferentialDownload=true;
    },`http://127.0.0.1:${server.address().port}/`);
    await page.locator('#navSettings').click();
    assert.equal(await page.locator('#appVersion').innerText(),'1.3.4');
    await page.locator('#checkUpdate').click();await page.waitForFunction(()=>document.getElementById('downloadUpdate').classList.contains('hidden')===false);
    await page.screenshot({path:path.join(output,'update-available.png')});
    assert.equal(served,0,'Checking must not download silently');
    await page.locator('#downloadUpdate').click();await page.waitForFunction(()=>document.getElementById('updateStatus').textContent.includes('رُفض التحديث'));
    assert.equal(await page.locator('#installUpdate').isVisible(),false);
    assert.equal(await app.evaluate(({app})=>app.getVersion()),'1.3.4');
    bad=false;
    await page.locator('#checkUpdate').click();await page.locator('#downloadUpdate').waitFor({state:'visible'});
    await page.locator('#downloadUpdate').click();await page.locator('#installUpdate').waitFor({state:'visible',timeout:60000});
    await page.screenshot({path:path.join(output,'update-ready.png')});
    await page.evaluate(()=>localStorage.setItem('lughaty-oral-diagnostic.draft',JSON.stringify({q:['أ'],res:[]})));
    await page.locator('#installUpdate').click();await page.waitForFunction(()=>document.getElementById('updateStatus').textContent.includes('احفظ الاختبار'));
    await page.evaluate(()=>localStorage.removeItem('lughaty-oral-diagnostic.draft'));
    await app.evaluate(({dialog})=>{globalThis.lughatyOriginalUpdateDialog=dialog.showMessageBox;dialog.showMessageBox=async()=>({response:1});});
    await page.locator('#installUpdate').click();await page.waitForFunction(()=>document.getElementById('updateStatus').textContent.includes('لاحقًا'));
    assert.equal(await app.evaluate(({app})=>app.getVersion()),'1.3.4','Cancel must keep the app running');
    await app.evaluate(({dialog})=>{dialog.showMessageBox=async()=>({response:0});});
    const closing=app.waitForEvent('close',{timeout:60000});
    await page.locator('#installUpdate').click().catch(error=>{if(!page.isClosed())throw error;});
    await closing;app=null;
    const installedArchive=path.join(path.dirname(executablePath),'resources','app.asar');
    let installedVersion;
    for(let i=0;i<90;i++) {
      try {asar.uncacheAll();installedVersion=JSON.parse(asar.extractFile(installedArchive,'package.json')).version;}catch{}
      if(installedVersion==='1.3.5')break;
      await wait(1000);
    }
    assert.equal(installedVersion,'1.3.5','Downloaded installer must upgrade the installed app');
    let restarted=false;
    for(let i=0;i<30;i++) {
      const {stdout}=await execFileAsync('powershell.exe',['-NoProfile','-Command',
        '$target=$env:LUGHATY_EXECUTABLE; @(Get-Process | Where-Object {$_.Path -eq $target}).Count']);
      if(Number(stdout.trim())>0){restarted=true;break;}await wait(1000);
    }
    assert.equal(restarted,true,'Updater must restart the app after installation');
    // Stop only the test instance automatically restarted by the installer before
    // reopening it under Playwright to verify the preserved profile.
    await execFileAsync('powershell.exe',['-NoProfile','-Command',
      '$target=$env:LUGHATY_EXECUTABLE; Get-Process | Where-Object {$_.Path -eq $target} | Stop-Process -Force']);
    await wait(1500);
    app=await electron.launch({executablePath,timeout:60000});
    const updated=await app.firstWindow();await updated.waitForSelector('#student');
    assert.equal(await app.evaluate(({app})=>app.getVersion()),'1.3.5');
    assert.deepEqual(await updated.evaluate(()=>({students:getRosterStore().rosters[0].students.length,records:getStore().records.length})),existing);
    await updated.locator('#navSettings').click();await updated.waitForFunction(()=>document.getElementById('appVersion').textContent==='1.3.5');
    await updated.screenshot({path:path.join(output,'update-installed.png')});
    await fs.writeFile(path.join(output,'update-results.json'),JSON.stringify({success:true,fromVersion:'1.3.4',toVersion:'1.3.5',channel:'loopback HTTP test channel; production feed fixed to GitHub HTTPS',baseline:'Private fixture with updater code, not the previously distributed 1.3.4 installer',checks:['real NSIS version upgrade','SHA512 corrupted download rejected','no automatic download','unfinished draft blocks install','cancel keeps app open','explicit install and restart','student records retained'],filesServed:served},null,2));
    console.log('PASS: real installed Windows update 1.3.4 -> 1.3.5, checksum rejection, draft guard, cancel, restart and retained data');
  } finally {if(app)await app.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1});
