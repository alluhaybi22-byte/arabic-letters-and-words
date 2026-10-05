const {_electron:electron}=require('playwright');
const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const output=path.resolve('release/ui-proof');
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
(async()=>{
  const app=await electron.launch({executablePath:process.env.LUGHATY_EXECUTABLE,timeout:60000});
  const pages=[],errors=[],checks=[];
  try {
    assert.equal(await app.evaluate(({app})=>app.getVersion()),'1.3.5');
    const main=await app.firstWindow();await main.waitForSelector('#student');
    main.on('dialog',dialog=>dialog.accept());main.on('pageerror',error=>errors.push(error.message));
    const before=await main.evaluate(()=>JSON.stringify({rosters:getRosterStore(),records:getStore()}));
    assert.equal(await main.evaluate(()=>getStore().records.length),2);
    async function openPreview(button) {
      const waiting=app.waitForEvent('window',{timeout:30000});
      await main.locator(button).click();const preview=await waiting;pages.push(preview);
      preview.on('pageerror',error=>errors.push(error.message));
      await preview.waitForFunction(()=>document.getElementById('pagePreview')?.dataset.pageCount || document.getElementById('printStatus')?.textContent.includes('تعذر تجهيز المعاينة'),{},{timeout:60000});
      assert.ok(await preview.locator('#pagePreview').getAttribute('data-page-count'),await preview.locator('#printStatus').innerText());
      await preview.waitForFunction(()=>!document.getElementById('savePdf').disabled);
      assert.equal(await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().find(window=>window.getParentWindow())?.isVisible()),true);
      const ink=await preview.locator('canvas').evaluate(canvas=>{
        const pixels=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
        let count=0;for(let i=0;i<pixels.length;i+=4)if(pixels[i+3]>0 && Math.min(pixels[i],pixels[i+1],pixels[i+2])<200)count++;
        return count;
      });
      assert.ok(ink>200,'Actual rendered PDF page must contain visible ink');
      assert.equal(await preview.evaluate(()=>getComputedStyle(document.body).direction),'rtl');
      assert.ok(await preview.evaluate(()=>getComputedStyle(document.body).fontFamily.includes('Arial')));
      assert.equal(await preview.locator('canvas').count(),1,'Bound bitmap memory for long reports');
      return preview;
    }
    for(const format of ['brief','detailed']) {
      await main.evaluate(format=>{renderReport(getStore().records[0]);document.getElementById('printFormat').value=format;},format);
      const preview=await openPreview('#print');
      assert.equal(await preview.locator('#reportSource .detail-table').count(),format==='detailed'?1:0);
      await preview.screenshot({path:path.join(output,'individual-'+format+'-preview.png')});
      await preview.close();checks.push('individual '+format+' PDF pages visible');
    }
    await main.evaluate(()=>{showHistory(true);historyAll=true;renderHistoryRows();});
    let preview=await openPreview('#allPrint');
    assert.equal(await preview.locator('.class-table tbody tr').count(),2);
    await preview.screenshot({path:path.join(output,'class-page-preview.png')});
    await app.evaluate(({BrowserWindow})=>{
      const wc=BrowserWindow.getAllWindows().find(window=>window.getParentWindow()).webContents;
      globalThis.lughatyPrintTest={wc,list:wc.getPrintersAsync,print:wc.print};
      wc.getPrintersAsync=async()=>[{name:'test-device-name',displayName:'طابعة التجربة',isDefault:true}];
      wc.print=(options,callback)=>{globalThis.lughatyPrintTest.options=options;callback(true,'');};
    });
    await preview.locator('#retryPreview').evaluate(button=>button.click());
    await preview.waitForFunction(()=>!document.getElementById('doPrint').disabled);
    await preview.locator('#copies').fill('2');await preview.locator('#doPrint').click();
    await preview.waitForFunction(()=>document.getElementById('printStatus').textContent==='أُرسلت المهمة إلى الطابعة.');
    const sent=await app.evaluate(()=>globalThis.lughatyPrintTest.options);
    assert.equal(sent.deviceName,'test-device-name');assert.equal(sent.copies,2);assert.equal(sent.silent,true);assert.equal(sent.pageSize,'A4');
    checks.push('UI-selected printer and copies reach native print API');
    await app.evaluate(()=>{globalThis.lughatyPrintTest.wc.print=(_options,callback)=>callback(false,'spooler unavailable');});
    await preview.locator('#doPrint').click();await preview.waitForFunction(()=>document.getElementById('printStatus').textContent.includes('spooler unavailable'));
    assert.equal(await preview.locator('#doPrint').isEnabled(),true);checks.push('spooler failure visible and retry enabled');
    await app.evaluate(()=>{globalThis.lughatyPrintTest.wc.getPrintersAsync=async()=>[];});
    await preview.locator('#doPrint').click();await preview.waitForFunction(()=>document.getElementById('printStatus').textContent.includes('لا توجد طابعة'));
    assert.equal(await preview.locator('#savePdf').isEnabled(),true);checks.push('disconnected printer keeps PDF available');
    await app.evaluate(()=>{const test=globalThis.lughatyPrintTest;test.wc.getPrintersAsync=test.list;test.wc.print=test.print;delete globalThis.lughatyPrintTest;});
    if(process.env.LUGHATY_NATIVE_PRINTER) {
      await preview.locator('#retryPreview').evaluate(button=>button.click());
      await preview.waitForFunction(()=>!document.getElementById('savePdf').disabled);
      await preview.locator('#printer').selectOption(process.env.LUGHATY_NATIVE_PRINTER);
      await preview.locator('#copies').fill('1');await preview.locator('#doPrint').click();
      await preview.waitForFunction(()=>document.getElementById('printStatus').textContent==='أُرسلت المهمة إلى الطابعة.',{},{timeout:90000});
      let printed;
      for(let attempt=0;attempt<60;attempt++) {
        printed=await fs.readFile(process.env.LUGHATY_NATIVE_PRINT_FILE).catch(()=>null);
        if(printed && printed.length>1000)break;await pause(500);
      }
      assert.ok(printed?.length>1000,'Real Windows spooler must write the selected test printer output');
      assert.equal(printed.subarray(0,4).toString(),'%PDF');
      await fs.writeFile(path.join(output,'native-spooler-output.pdf'),printed);
      checks.push('real Windows Print to PDF driver and spooler output');
    } else checks.push('physical/virtual printer hardware not available; native API dispatch tested with controlled driver failures');
    await preview.close();checks.push('class report PDF pages visible');
    // Synthetic long report exists in renderer memory only, never in saved data.
    await main.evaluate(()=>{globalThis.lughatyOriginalClassRows=classRows;classRows=()=>Array.from({length:95},(_,i)=>['طالب اختبار معاينة رقم '+(i+1),'تم الاختبار','75%','مُتابعة القراءة والحركات والتنوين والمدود']);showHistory(true);historyAll=true;renderHistoryRows();});
    preview=await openPreview('#allPrint');
    const count=Number(await preview.locator('#pagePreview').getAttribute('data-page-count'));assert.ok(count>1,'Long report must paginate');
    assert.equal(await preview.locator('.class-table tbody tr').count(),95);
    await preview.locator('#nextPage').click();await preview.waitForFunction(()=>document.getElementById('pagePreview').dataset.currentPage==='2');
    await preview.locator('#prevPage').click();await preview.waitForFunction(()=>document.getElementById('pagePreview').dataset.currentPage==='1');
    await preview.screenshot({path:path.join(output,'multipage-class-preview.png')});
    const saved=path.join(output,'multipage-report.pdf');
    await app.evaluate(({dialog},file)=>{globalThis.lughatyPrintSaveDialog=dialog.showSaveDialog;dialog.showSaveDialog=async()=>({canceled:false,filePath:file});},saved);
    await preview.locator('#savePdf').click();await preview.waitForFunction(()=>document.getElementById('printStatus').textContent==='حُفظ ملف PDF.');
    await app.evaluate(({dialog})=>{dialog.showSaveDialog=globalThis.lughatyPrintSaveDialog;delete globalThis.lughatyPrintSaveDialog;});
    const savedBytes=await fs.readFile(saved);
    const previewHash=await preview.evaluate(async()=>{
      const bytes=await window.printActions.getDocument();
      return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new Uint8Array(bytes)))).map(n=>n.toString(16).padStart(2,'0')).join('');
    });
    assert.equal(require('node:crypto').createHash('sha256').update(savedBytes).digest('hex'),previewHash,'Saved PDF must exactly match the document displayed');
    await preview.close();await main.evaluate(()=>{classRows=globalThis.lughatyOriginalClassRows;delete globalThis.lughatyOriginalClassRows;});
    assert.equal(await main.evaluate(()=>JSON.stringify({rosters:getRosterStore(),records:getStore()})),before,'Printing must not alter student data or results');
    checks.push('95-row report, multiple A4 pages, previous/next and exact saved PDF','records and rosters unchanged');
    const ocr=await main.evaluate(async()=>{
      const worker=await Tesseract.createWorker('ara',1,{workerPath:'./vendor/worker.min.js',corePath:'./vendor',langPath:'./vendor'});
      try {
        const canvas=document.createElement('canvas');canvas.width=600;canvas.height=120;
        const ctx=canvas.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,600,120);ctx.fillStyle='black';ctx.font='40px Arial';ctx.direction='rtl';ctx.fillText('سالم علي',550,70);
        return typeof (await worker.recognize(canvas)).data.text==='string';
      } finally {await worker.terminate();}
    });assert.equal(ocr,true);checks.push('local Arabic OCR worker and WASM compatible with restrictive CSP');
    await main.locator('#navSettings').click();assert.equal(await main.locator('#checkUpdate').isVisible(),true);
    assert.equal(await main.locator('#appVersion').innerText(),'1.3.5');checks.push('update controls retained');
    assert.deepEqual(errors,[]);
    await fs.writeFile(path.join(output,'print-results.json'),JSON.stringify({success:true,installedVersion:'1.3.5',checks,longReportRows:95,longReportPages:count,realVirtualPrinterTested:!!process.env.LUGHATY_NATIVE_PRINTER,physicalPrinterTested:false},null,2));
    console.log('PASS: installed 1.3.5, individual/class/95-row paginated PDF previews, printer selection/dispatch/errors, exact PDF, retained records and updater');
  } catch(error) {
    for(let i=0;i<pages.length;i++)if(!pages[i].isClosed())await pages[i].screenshot({path:path.join(output,'print-failure-'+i+'.png')}).catch(()=>{});
    throw error;
  } finally {await app.close();}
})().catch(error=>{console.error(error);process.exitCode=1});
