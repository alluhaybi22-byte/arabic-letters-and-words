const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const yaml=require('js-yaml');
const manifest=yaml.load(fs.readFileSync('release/latest.yml','utf8'));
const config=yaml.load(fs.readFileSync('release/win-unpacked/resources/app-update.yml','utf8'));
assert.equal(manifest.version,'1.3.5');
assert.equal(config.provider,'github');assert.equal(config.owner,'alluhaybi22-byte');assert.equal(config.repo,'arabic-letters-and-words');
assert.notEqual(config.private,true); // Public feed needs no embedded GitHub credentials.
for(const key of ['token','authorization','requestHeaders'])assert.equal(config[key],undefined,key);
const file=manifest.files.find(file=>file.url.endsWith('.exe'));assert.ok(file);
assert.equal(file.url,path.basename(file.url),'Update filename must be relative');
const bytes=fs.readFileSync(path.join('release',file.url));
assert.equal(file.size,bytes.length);
assert.equal(file.sha512,crypto.createHash('sha512').update(bytes).digest('base64'));
assert.ok(fs.existsSync(path.join('release',file.url+'.blockmap')));
console.log('PASS: fixed public GitHub update feed, no credentials, latest.yml SHA512/size and blockmap match installer');
