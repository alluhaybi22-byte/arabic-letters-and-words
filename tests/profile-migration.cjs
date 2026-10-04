const {copyLegacyProfile} = require('../profile-migration');
const fs = require('node:fs/promises'), path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
(async()=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'lughaty-migration-test-'));
  try {
    const old=path.join(root,'arabic-letter-assessment'),current=path.join(root,'lughaty-oral-diagnostic');
    await fs.mkdir(path.join(old,'Local Storage'),{recursive:true});await fs.writeFile(path.join(old,'Local Storage','records'),'old-data');
    assert.equal(await copyLegacyProfile(root,current),true);
    assert.equal(await fs.readFile(path.join(current,'Local Storage','records'),'utf8'),'old-data');
    assert.equal(await fs.readFile(path.join(old,'Local Storage','records'),'utf8'),'old-data');
    await fs.writeFile(path.join(current,'Local Storage','records'),'current-data');
    assert.equal(await copyLegacyProfile(root,current),false);assert.equal(await fs.readFile(path.join(current,'Local Storage','records'),'utf8'),'current-data');
    assert.equal(await copyLegacyProfile(root,old),false);
    console.log('PASS: legacy data copied, original retained, existing trial data never overwritten');
  } finally {await fs.rm(root,{recursive:true,force:true})}
})().catch(error=>{console.error(error);process.exitCode=1});
