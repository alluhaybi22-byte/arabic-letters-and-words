// Shared browser/Node importer. Limits are enforced on actual streamed output,
// not just the untrusted ZIP directory's advertised uncompressed size.
(function(root) {
  'use strict';
  const LIMITS = Object.freeze({fileBytes:25*1024*1024, xmlBytes:8*1024*1024,
    totalXmlBytes:32*1024*1024, entries:512, ratio:250, timeoutMs:15000,
    pdfPages:300, pdfItemsPerPage:20000, pdfItemsTotal:200000,
    pdfCharsPerPage:1024*1024, pdfCharsTotal:8*1024*1024, pdfColumns:256, pdfTimeoutMs:180000,
    canvasPixels:16*1024*1024, spreadsheetColumns:16384});
  function limitError() { return new Error('تجاوز الملف حدود الأمان للاستيراد. قسّم الكشف إلى ملفات أصغر ثم أعد المحاولة.'); }
  function abortError() { const error=new Error('أُلغي استيراد الملف. لم تتغير الصفوف أو النتائج المحفوظة.');error.name='AbortError';return error; }
  function withAbort(task,signal) {
    if(signal?.aborted) return Promise.reject(signal.reason || abortError());
    return new Promise((resolve,reject)=>{
      const abort=()=>{cleanup();reject(signal.reason || abortError());};
      const cleanup=()=>signal?.removeEventListener('abort',abort);
      signal?.addEventListener('abort',abort,{once:true});
      Promise.resolve().then(()=>{if(signal?.aborted)throw signal.reason || abortError();return task();})
        .then(value=>{cleanup();resolve(value);},error=>{cleanup();reject(error);});
    });
  }
  function groupPdfRows(items) {
    if(!Array.isArray(items) || items.length>LIMITS.pdfItemsPerPage) throw limitError();
    const rows=[],buckets=new Map();let characters=0;
    for(const item of items) {
      if(typeof item.str!=='string' || !item.str.trim()) continue;
      characters+=item.str.length;if(characters>LIMITS.pdfCharsPerPage)throw limitError();
      const y=item.transform?.[5],x=item.transform?.[4];
      if(!Number.isFinite(x)||!Number.isFinite(y)||!Number.isFinite(item.width))throw limitError();
      const bucket=Math.floor(y/3);let row;
      for(const key of new Set([bucket-1,bucket,bucket+1])) {
        for(const candidate of buckets.get(key)||[]) {
          if(Math.abs(candidate.y-y)<=3 && (!row || candidate.order<row.order))row=candidate;
        }
      }
      if(!row) {
        row={y,order:rows.length,items:[]};rows.push(row);
        if(!buckets.has(bucket))buckets.set(bucket,[]);buckets.get(bucket).push(row);
      }
      row.items.push({x,width:Math.abs(item.width),text:item.str});
    }
    return rows;
  }
  async function pdfTextItems(page,signal) {
    const reader=page.streamTextContent().getReader();const items=[];let characters=0;
    try {
      while(true) {
        const {value,done}=await withAbort(()=>reader.read(),signal);if(done)break;
        if(!Array.isArray(value?.items)||items.length+value.items.length>LIMITS.pdfItemsPerPage)throw limitError();
        for(const item of value.items) {
          characters+=typeof item.str==='string'?item.str.length:0;
          if(characters>LIMITS.pdfCharsPerPage)throw limitError();
          items.push(item);
        }
      }
      return items;
    } finally {
      // Do not wait indefinitely for a stopped PDF worker to acknowledge cancel.
      reader.cancel().catch(()=>{});
      reader.releaseLock();
    }
  }
  async function readFile(file) {
    if (!file || typeof file.arrayBuffer !== 'function') throw new Error('ملف استيراد غير صالح.');
    if (Number.isFinite(file.size) && file.size > LIMITS.fileBytes) throw limitError();
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (bytes.byteLength > LIMITS.fileBytes) throw limitError();
    return bytes;
  }
  async function inflate(data, maximum, deadline, signal) {
    const reader = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw')).getReader();
    const chunks=[]; let length=0;
    const timer=setTimeout(()=>{reader.cancel().catch(()=>{});},Math.max(1,deadline-Date.now()));
    const abort=()=>reader.cancel().catch(()=>{});
    signal?.addEventListener('abort',abort,{once:true});
    try {
      while (true) {
        if (Date.now() >= deadline) throw limitError();
        const {value,done}=await withAbort(()=>reader.read(),signal);
        if (Date.now() >= deadline) throw limitError();
        if (done) break;
        length+=value.byteLength;
        if (length>maximum) throw limitError();
        chunks.push(value);
      }
      const result=new Uint8Array(length); let offset=0;
      for (const chunk of chunks) { result.set(chunk,offset); offset+=chunk.byteLength; }
      return result;
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener('abort',abort);
      await reader.cancel().catch(()=>{});
      reader.releaseLock();
    }
  }
  async function unzipOffice(file,signal) {
    const bytes=await withAbort(()=>readFile(file),signal),view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
    const invalid=()=>new Error('أرشيف Office غير صالح أو غير مدعوم.');
    const range=(offset,length)=>Number.isSafeInteger(offset)&&Number.isSafeInteger(length)&&offset>=0&&length>=0&&offset<=bytes.length-length;
    let end=-1;
    for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--) {
      if(view.getUint32(i,true)===0x06054b50 && i+22+view.getUint16(i+20,true)===bytes.length) {end=i;break;}
    }
    if(end<0) throw invalid();
    const count=view.getUint16(end+10,true),directorySize=view.getUint32(end+12,true);
    let offset=view.getUint32(end+16,true),total=0;
    if(view.getUint16(end+4,true)!==0 || view.getUint16(end+6,true)!==0 || view.getUint16(end+8,true)!==count) throw invalid();
    if(count>LIMITS.entries) throw limitError();
    if(!range(offset,directorySize) || offset+directorySize!==end) throw invalid();
    const directoryEnd=offset+directorySize, entries=new Map(),deadline=Date.now()+LIMITS.timeoutMs;
    for(let i=0;i<count;i++) {
      if(signal?.aborted)throw signal.reason || abortError();
      if(Date.now()>=deadline) throw limitError();
      if(!range(offset,46)||offset+46>directoryEnd||view.getUint32(offset,true)!==0x02014b50) throw invalid();
      const flags=view.getUint16(offset+8,true),method=view.getUint16(offset+10,true),length=view.getUint32(offset+20,true),expanded=view.getUint32(offset+24,true);
      const nameLength=view.getUint16(offset+28,true),extra=view.getUint16(offset+30,true),comment=view.getUint16(offset+32,true),local=view.getUint32(offset+42,true);
      const next=offset+46+nameLength+extra+comment;
      if(next>directoryEnd || !range(local,30)||view.getUint32(local,true)!==0x04034b50) throw invalid();
      const name=new TextDecoder().decode(bytes.subarray(offset+46,offset+46+nameLength));
      const dataStart=local+30+view.getUint16(local+26,true)+view.getUint16(local+28,true);
      if(!range(dataStart,length)||dataStart+length>view.getUint32(end+16,true) || (flags&1)) throw invalid();
      // Only these XML entries are used by the roster parser. Never extract paths.
      if(/^(?:word\/document\.xml|xl\/sharedStrings\.xml|xl\/worksheets\/sheet\d+\.xml)$/.test(name)) {
        if(entries.has(name)) throw invalid();
        const maximum=Math.min(LIMITS.xmlBytes,LIMITS.totalXmlBytes-total,length*LIMITS.ratio+65536);
        if(expanded>maximum) throw limitError();
        let data=bytes.subarray(dataStart,dataStart+length);
        if(method===8) data=await inflate(data,maximum,deadline,signal);
        else if(method!==0) throw invalid();
        if(data.byteLength>maximum) throw limitError();
        if(data.byteLength!==expanded) throw invalid();
        total+=data.byteLength;
        entries.set(name,new TextDecoder().decode(data));
      }
      offset=next;
    }
    if(offset!==directoryEnd) throw invalid();
    return entries;
  }
  const api=Object.freeze({LIMITS,limitError,abortError,withAbort,groupPdfRows,pdfTextItems,readFile,unzipOffice});
  if(typeof module==='object'&&module.exports) module.exports=api;
  else root.RosterImport=api;
})(globalThis);
