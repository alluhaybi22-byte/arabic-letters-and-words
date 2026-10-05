'use strict';
const assert=require('node:assert/strict');
const importer=require('../roster-import');
const item=(y,text='اسم طالب')=>({str:text,transform:[1,0,0,1,40,y],width:50});
function oldRows(items) {
  const rows=[];
  for(const entry of items) {
    let row=rows.find(row=>Math.abs(row.y-entry.transform[5])<=3);
    if(!row)rows.push(row={y:entry.transform[5],items:[]});
    row.items.push({x:entry.transform[4],width:Math.abs(entry.width),text:entry.str});
  }
  return rows;
}
const plain=rows=>rows.map(({y,items})=>({y,items}));
(async()=>{
  let seed=27;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed;};
  for(let trial=0;trial<20;trial++) {
    const input=Array.from({length:150},()=>item((random()%1000-500)/10));
    assert.deepEqual(plain(importer.groupPdfRows(input)),oldRows(input));
  }
  assert.deepEqual(plain(importer.groupPdfRows([item(0),item(5),item(2)])),oldRows([item(0),item(5),item(2)]),'Keep earliest matching row when two are within tolerance');
  const input=Array.from({length:2000},(_,i)=>item(i*4));
  let probes=0;
  const measured=input.map(entry=>new Proxy(entry,{get(target,key){if(key==='transform')return new Proxy(target.transform,{get(a,k){if(k==='5')probes++;return a[k];}});return target[key];}}));
  assert.equal(importer.groupPdfRows(measured).length,2000);
  assert.equal(probes,2000,'Read Y once per item, without scanning all prior rows');
  assert.throws(()=>importer.groupPdfRows(Array(importer.LIMITS.pdfItemsPerPage+1)),/حدود الأمان/);
  assert.throws(()=>importer.groupPdfRows([item(0,'أ'.repeat(importer.LIMITS.pdfCharsPerPage+1))]),/حدود الأمان/);
  assert.throws(()=>importer.groupPdfRows([item(NaN)]),/حدود الأمان/);
  const abort=new AbortController();let started=false;
  abort.abort(importer.abortError());
  await assert.rejects(()=>importer.withAbort(()=>{started=true;},abort.signal),{name:'AbortError'});assert.equal(started,false);
  const active=new AbortController();
  const pending=importer.withAbort(()=>new Promise(()=>{}),active.signal);active.abort(importer.abortError());
  await assert.rejects(()=>pending,{name:'AbortError'});
  let canceled=false;
  const fakePage={streamTextContent:()=>new ReadableStream({start(controller){controller.enqueue({items:input});controller.enqueue({items:Array(importer.LIMITS.pdfItemsPerPage)});},cancel(){canceled=true;}})};
  await assert.rejects(()=>importer.pdfTextItems(fakePage),/حدود الأمان/);assert.equal(canceled,true);
  canceled=false;const reading=new AbortController();
  const hangingPage={streamTextContent:()=>new ReadableStream({cancel(){canceled=true;}})};
  const waiting=importer.pdfTextItems(hangingPage,reading.signal);reading.abort(importer.abortError());
  await assert.rejects(()=>waiting,{name:'AbortError'});assert.equal(canceled,true);
  const goodPage={streamTextContent:()=>new ReadableStream({start(controller){controller.enqueue({items:input.slice(0,5)});controller.close();}})};
  assert.deepEqual(await importer.pdfTextItems(goodPage),input.slice(0,5));
  console.log('PASS: PDF grouping preserves old geometry/first-match behavior; 2000 rows without quadratic scanning; bounded streamed text, malformed coordinates, cancellation and reader cleanup');
})().catch(error=>{console.error(error);process.exitCode=1});
