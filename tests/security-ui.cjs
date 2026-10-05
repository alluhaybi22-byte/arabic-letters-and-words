// Local Linux/headless integration only. Windows installer/spooler testing is
// separate: tests/windows-print.cjs. Always use an isolated synthetic profile.
'use strict';
const fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
const {_electron:electron}=require('playwright');
(async()=>{
  if(process.platform!=='linux')throw new Error('This isolated headless test targets Linux only');
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'lughaty-security-ui-'));
  let app;
  try {
    app=await electron.launch({executablePath:require('electron'),args:['--no-sandbox','--ozone-platform=headless',path.join(__dirname,'..')],env:{...process.env,XDG_CONFIG_HOME:root},timeout:20000});
    const page=await app.firstWindow();await page.waitForSelector('#start');
    assert.equal(await page.evaluate(()=>getStore().records.length),0);
    const policy=await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content');assert.ok(policy.includes("default-src 'none'"));
    const blocked=await page.evaluate(async()=>{
      const script=document.createElement('script');script.textContent='globalThis.securityInlineProbe=1';document.head.append(script);
      let networkBlocked=false;
      try{await fetch('https://example.invalid/student-data')}catch{networkBlocked=true}
      return {inlineBlocked:globalThis.securityInlineProbe!==1,networkBlocked};
    });
    const cdp=await page.context().newCDPSession(page);
    try {
      const probe=await cdp.send('Runtime.evaluate',{expression:"(()=>{try{window.eval('globalThis.securityEvalProbe=1');return false}catch{return true}})()",allowUnsafeEvalBlockedByCSP:false,returnByValue:true});
      blocked.evalBlocked=probe.result.value;
    } finally {await cdp.detach();}
    assert.deepEqual(blocked,{inlineBlocked:true,evalBlocked:true,networkBlocked:true});
    await page.evaluate(()=>{document.getElementById('student').value='طالب اختبار أمان';begin();mark('✓');completeAssessment();});
    const previewPromise=app.waitForEvent('window');await page.locator('#print').click();
    const preview=await previewPromise;
    await preview.waitForFunction(()=>document.getElementById('pagePreview')?.dataset.pageCount || document.getElementById('printStatus')?.textContent.includes('تعذر تجهيز المعاينة'),{},{timeout:45000});
    assert.ok(await preview.locator('#pagePreview').getAttribute('data-page-count'),await preview.locator('#printStatus').innerText());
    assert.equal(await preview.locator('canvas').count(),1);
    assert.equal(await preview.locator('#savePdf').isEnabled(),true);
    const pdf=await preview.evaluate(async()=>Array.from(await window.printActions.getDocument()));assert.equal(Buffer.from(pdf).subarray(0,4).toString(),'%PDF');
    await preview.close();
    // Verify local OCR worker, traineddata and WASM still work under the CSP.
    const ocr=await page.evaluate(async()=>{
      const worker=await Tesseract.createWorker('ara',1,{workerPath:'./vendor/worker.min.js',corePath:'./vendor',langPath:'./vendor'});
      try {
        const canvas=document.createElement('canvas');canvas.width=600;canvas.height=120;
        const ctx=canvas.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,600,120);ctx.fillStyle='black';ctx.font='40px Arial';ctx.direction='rtl';ctx.fillText('سالم علي',550,70);
        const result=await worker.recognize(canvas);return typeof result.data.text==='string';
      } finally {await worker.terminate();}
    });assert.equal(ocr,true);
    assert.equal(await page.evaluate(()=>getStore().records.length),1,'Synthetic assessment survives preview and OCR');
    console.log('PASS: actual Electron Linux CSP blocks inline script/eval/remote fetch; PDF canvas preview and local Arabic OCR work; synthetic history retained. NOT a Windows installer/spooler test.');
  } finally {if(app)await app.close();await fs.rm(root,{recursive:true,force:true});}
})().catch(error=>{console.error(error);process.exitCode=1});
