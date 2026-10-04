const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const asar=require('@electron/asar');
const archive=path.resolve('release/win-unpacked/resources/app.asar');
const entries=asar.listPackage(archive).map(file=>file.replace(/\\/g,'/'));
const allowed=new Set(['/node_modules','/vendor','/brand','/LICENSE','/PRIVACY.md','/index.html','/main.js','/package.json','/print-bridge.js','/profile-policy.js']);
for(const file of entries) {
  if(file.startsWith('/node_modules/')||file.startsWith('/vendor/')||file.startsWith('/brand/'))continue;
  assert.ok(allowed.has(file),'Unexpected file in distributable: '+file);
}
for(const name of ['index.html','main.js','profile-policy.js']) {
  const packaged=asar.extractFile(archive,name);
  assert.deepEqual(packaged,fs.readFileSync(name),'packaged source mismatch: '+name);
  assert.equal(/طالب التجربة|ريم الحربي|عبدالمجيد العامري|previous-private-roster/.test(packaged.toString()),false,'test/private data in distributable');
}
assert.ok(!entries.some(file=>/\/tests\/|\/ui-proof\/|\/Local Storage\/|\/IndexedDB\/|\.docx$|\.xlsx$|\.pdf$/i.test(file)),'rosters or test data must not be bundled');
console.log('PASS: distributable contains approved runtime files only, no rosters, saved profiles or test fixtures');
