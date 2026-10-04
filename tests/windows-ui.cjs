const { _electron: electron } = require('playwright');
const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const output=path.resolve('release/ui-proof');
(async()=>{
  await fs.mkdir(output,{recursive:true});
  const executablePath=process.env.LUGHATY_EXECUTABLE || require('electron');
  const args=process.env.LUGHATY_EXECUTABLE ? [] : ['.'];
  if (process.env.LUGHATY_TEST_NO_SANDBOX==='1') args.push('--no-sandbox');
  const app=await electron.launch({executablePath,args,timeout:60000});
  try {
    const page=await app.firstWindow();page.on('dialog',dialog=>dialog.accept());
    await page.waitForSelector('#student');
    for (const [width,height] of [[760,680],[1024,768],[1440,1000]]) {
      await app.evaluate(({BrowserWindow},size)=>BrowserWindow.getAllWindows()[0].setSize(...size),[width,height]);
      await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),true,`horizontal overflow at ${width}`);
      assert.ok((await page.locator('#student').evaluate(element=>getComputedStyle(element).fontFamily)).includes('Arial'));
      await page.screenshot({path:path.join(output,`setup-${width}.png`)});
    }
    await page.evaluate(()=>{
      document.getElementById('rosterName').value='صف تجربة التثبيت';
      saveImportedRoster({name:'install-test.xlsx'},[{name:'طالب التجربة ألف'},{name:'طالب التجربة باء'}]);
      document.getElementById('schoolName').value='مدرسة التجربة';
      document.getElementById('teacher').value='معلم التجربة';
    });
    await page.locator('[data-select-level="vocalized"]').click();await page.locator('#start').click();
    assert.equal(await page.locator('#errorType').count(),0);
    assert.match(await page.locator('#letter').innerText(),/[ًٌٍَُِْ]/);
    assert.equal(await page.locator('#letter').evaluate(element=>getComputedStyle(element).direction),'rtl');
    assert.ok(await page.locator('#letter').evaluate(element=>parseFloat(getComputedStyle(element).fontSize)>80));
    await page.screenshot({path:path.join(output,'assessment.png')});
    await page.locator('[data-score="✓"]').click();await page.locator('#finish').click();
    const session=await page.evaluate(()=>activeRecord.testSessionId);
    assert.equal(await page.evaluate(()=>activeRecord.summary.correct),1);
    await page.locator('#nextStudent').click();await page.locator('[data-score="✕"]').click();await page.locator('#finish').click();
    assert.equal(await page.evaluate(()=>activeRecord.testSessionId),session);
    await page.locator('#reportHistory').click();await page.locator('#historyRoot').click();
    await page.locator('[data-history-class]').click();await page.locator('[data-history-test]').click();
    assert.equal(await page.locator('.history-table tbody tr').count(),2);
    await page.screenshot({path:path.join(output,'history.png')});
    const waiting=app.waitForEvent('window');await page.locator('#allPrint').click();const preview=await waiting;
    await preview.waitForSelector('#doPrint');assert.equal(await preview.locator('.class-table tbody tr').count(),2);
    await preview.screenshot({path:path.join(output,'print-preview.png')});
    const pdfPath=path.join(output,'report.pdf');
    await app.evaluate(({dialog},file)=>{
      globalThis.lughatyTestSaveDialog=dialog.showSaveDialog;
      dialog.showSaveDialog=async()=>({canceled:false,filePath:file});
    },pdfPath);
    try {
      await preview.locator('#savePdf').click();
      await preview.waitForFunction(()=>document.getElementById('printStatus').textContent==='حُفظ ملف PDF.');
    } finally {
      await app.evaluate(({dialog})=>{dialog.showSaveDialog=globalThis.lughatyTestSaveDialog;delete globalThis.lughatyTestSaveDialog;});
    }
    const pdf=await fs.readFile(pdfPath);assert.ok(pdf.length>1000);assert.equal(pdf.subarray(0,4).toString(),'%PDF');
    await app.evaluate(({BrowserWindow})=>{
      const wc=BrowserWindow.getAllWindows().find(window=>window.getParentWindow()).webContents;
      globalThis.lughatyTestPrinters=wc.getPrintersAsync;wc.getPrintersAsync=async()=>[];
    });
    try {
      await preview.locator('#doPrint').click();
      await preview.waitForFunction(()=>document.getElementById('printStatus').textContent.includes('لا توجد طابعة'));
      assert.equal(await preview.locator('#doPrint').isEnabled(),true);
    } finally {
      await app.evaluate(({BrowserWindow})=>{
        BrowserWindow.getAllWindows().find(window=>window.getParentWindow()).webContents.getPrintersAsync=globalThis.lughatyTestPrinters;
        delete globalThis.lughatyTestPrinters;
      });
    }
    const userData=await app.evaluate(({app})=>app.getPath('userData'));
    await fs.writeFile(path.join(userData,'installer-data-retention-test'),'retained');
    await fs.writeFile(path.join(output,'results.json'),JSON.stringify({success:true,session,userData,checks:['sizes','Arial','RTL','diacritics','assessment','class folders','test folders','print preview','PDF button with native PDF generation','print button missing-printer response']},null,2));
    console.log('PASS: installed Windows app, sizes/RTL/Arial, scoring, folders, native print preview/PDF');
  } finally {await app.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
