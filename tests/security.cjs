'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os');
const {deflateRawSync}=require('node:zlib');
const importer=require('../roster-import');
const {CONTENT_SECURITY_POLICY,authorizeFrame,protectSession,protectReport}=require('../security-policy');
const {previewStorage}=require('../preview-storage');
const {pathToFileURL}=require('node:url');
function zip(xml,{declared=Buffer.byteLength(xml),name='word/document.xml',method=8}={}) {
  const input=Buffer.from(xml),data=method===8?deflateRawSync(input):input,n=Buffer.from(name);
  const local=Buffer.alloc(30);local.writeUInt32LE(0x04034b50);local.writeUInt16LE(method,8);local.writeUInt32LE(data.length,18);local.writeUInt32LE(declared,22);local.writeUInt16LE(n.length,26);
  const central=Buffer.alloc(46);central.writeUInt32LE(0x02014b50);central.writeUInt16LE(method,10);central.writeUInt32LE(data.length,20);central.writeUInt32LE(declared,24);central.writeUInt16LE(n.length,28);
  const end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(1,8);end.writeUInt16LE(1,10);end.writeUInt32LE(central.length+n.length,12);end.writeUInt32LE(local.length+n.length+data.length,16);
  return Buffer.concat([local,n,data,central,n,end]);
}
const file=bytes=>({size:bytes.length,arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.length)});
(async()=>{
  const xml='<w:document>سالم علي</w:document>';
  for(const method of [0,8])assert.equal((await importer.unzipOffice(file(zip(xml,{method})))).get('word/document.xml'),xml);
  for(const name of ['roster-test.docx','roster-test.xlsx','roster-columns.docx','roster-columns.xlsx']) {
    assert.ok((await importer.unzipOffice(file(await fs.readFile(path.join(__dirname,name))))).size>0,name);
  }
  let read=false;
  await assert.rejects(()=>importer.readFile({size:importer.LIMITS.fileBytes+1,arrayBuffer:async()=>{read=true;return new ArrayBuffer(0)}}),/حدود الأمان/);
  assert.equal(read,false,'Oversize file rejected before allocation');
  await assert.rejects(()=>importer.readFile(file(Buffer.alloc(importer.LIMITS.fileBytes+1))),/حدود الأمان/);
  // Tiny archive, bounded 2MiB test data: no attempt to exhaust machine memory.
  const bomb='A'.repeat(2*1024*1024);
  await assert.rejects(()=>importer.unzipOffice(file(zip(bomb))),/حدود الأمان/);
  await assert.rejects(()=>importer.unzipOffice(file(zip(bomb,{declared:1}))),/حدود الأمان/,'Actual output, not advertised header, must be bounded');
  const malformed=zip(xml);malformed.writeUInt32LE(0xffffffff,malformed.length-6);
  await assert.rejects(()=>importer.unzipOffice(file(malformed)),/غير صالح/);
  const crowded=zip(xml);crowded.writeUInt16LE(importer.LIMITS.entries+1,crowded.length-14);crowded.writeUInt16LE(importer.LIMITS.entries+1,crowded.length-12);
  await assert.rejects(()=>importer.unzipOffice(file(crowded)),/حدود الأمان/);
  assert.equal((await importer.unzipOffice(file(zip(xml,{name:'../../outside.xml'})))).size,0,'No unused/traversal XML extracted');
  const frame={url:pathToFileURL('/app/index.html').href},sender={mainFrame:null};sender.mainFrame=frame;
  const window={webContents:sender,isDestroyed:()=>false};
  authorizeFrame({sender,senderFrame:frame},window,'/app/index.html');
  for(const event of [{sender,senderFrame:undefined},{sender,senderFrame:{url:frame.url}},{sender:{mainFrame:frame},senderFrame:frame}]) {
    assert.throws(()=>authorizeFrame(event,window,'/app/index.html'),/غير معتمد/);
  }
  frame.url='https://foreign.invalid/';assert.throws(()=>authorizeFrame({sender,senderFrame:frame},window,'/app/index.html'),/غير معتمد/);
  let request,check,headers;
  protectSession({setPermissionRequestHandler:fn=>request=fn,setPermissionCheckHandler:fn=>check=fn,webRequest:{onHeadersReceived:fn=>headers=fn}});
  let allowed;request({},'media',value=>allowed=value);assert.equal(allowed,false);assert.equal(check(),false);
  headers({responseHeaders:{Existing:['keep']}},result=>{assert.equal(result.responseHeaders['Content-Security-Policy'][0],CONTENT_SECURITY_POLICY);assert.deepEqual(result.responseHeaders.Existing,['keep']);});
  assert.ok(!CONTENT_SECURITY_POLICY.includes("script-src 'self' 'unsafe-inline'"));
  assert.ok(!CONTENT_SECURITY_POLICY.includes("'unsafe-eval'"));
  const html=await fs.readFile(path.join(__dirname,'../index.html'),'utf8');
  assert.ok(html.includes('content="'+CONTENT_SECURITY_POLICY+'"'));
  assert.equal(/<script\b[^>]*>\s*[^<\s]/i.test(html),false,'No inline renderer script');
  const protectedHtml=protectReport('<!doctype html><html lang="ar" dir="rtl"><head></head><body></body></html>');
  assert.ok(protectedHtml.indexOf('Content-Security-Policy')<protectedHtml.indexOf('<body>'));
  assert.throws(()=>protectReport('<script>unsafe()</script>'),/غير معتمد/);
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'lughaty-security-test-'));
  try {
    const storage=previewStorage(root);await storage.cleanup();
    const saved=await storage.create('<html>private report</html>');
    assert.equal(await fs.readFile(saved.file,'utf8'),'<html>private report</html>');
    if(process.platform!=='win32') assert.equal((await fs.stat(saved.file)).mode&0o777,0o600);
    await fs.writeFile(path.join(root,'student-results-sentinel'),'keep');
    await fs.writeFile(path.join(root,'print-previews','unrelated-sentinel'),'keep');
    await assert.rejects(()=>storage.remove(root),/غير معتمد/);
    await storage.cleanup();
    await assert.rejects(()=>fs.access(saved.file));
    assert.equal(await fs.readFile(path.join(root,'student-results-sentinel'),'utf8'),'keep');
    assert.equal(await fs.readFile(path.join(root,'print-previews','unrelated-sentinel'),'utf8'),'keep');
    if(process.platform!=='win32') {
      const linked=path.join(root,'linked');await fs.mkdir(linked);
      await fs.symlink(path.join(root,'print-previews'),path.join(linked,'print-previews'));
      await assert.rejects(()=>previewStorage(linked).cleanup(),/غير آمن/);
    }
  } finally {await fs.rm(root,{recursive:true,force:true});}
  console.log('PASS: bounded Office/file imports, forged-size ZIP bomb rejected, malformed ZIP, entry limits, trusted frame/URL, deny permissions, CSP, crash cleanup without touching student data');
})().catch(error=>{console.error(error);process.exitCode=1});
