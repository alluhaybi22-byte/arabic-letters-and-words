const {configureUserData,PROFILE_DIRECTORY} = require('../profile-policy');
const fs = require('node:fs/promises'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
(async()=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'lughaty-profile-policy-test-'));
  try {
    const oldNames=['arabic-letter-assessment','Arabic Letter Assessment','lughaty-oral-diagnostic'];
    for (const name of oldNames) {
      await fs.mkdir(path.join(root,name,'Local Storage'),{recursive:true});
      await fs.writeFile(path.join(root,name,'Local Storage','old-roster'),'previous-private-data');
    }
    let configured;
    const app={getPath:name=>{assert.equal(name,'appData');return root},setPath:(name,value)=>{assert.equal(name,'userData');configured=value}};
    const directory=configureUserData(app);
    assert.equal(directory,path.join(root,PROFILE_DIRECTORY));assert.equal(configured,directory);
    assert.deepEqual(await fs.readdir(directory),[],'first profile must contain no copied records');
    for(const name of oldNames) assert.equal(await fs.readFile(path.join(root,name,'Local Storage','old-roster'),'utf8'),'previous-private-data');
    await fs.mkdir(path.join(directory,'Local Storage'));await fs.writeFile(path.join(directory,'Local Storage','new-roster'),'user-imported-data');
    assert.equal(configureUserData(app),directory);
    assert.equal(await fs.readFile(path.join(directory,'Local Storage','new-roster'),'utf8'),'user-imported-data','restarting must not erase user imports');
    console.log('PASS: clean initial profile, no legacy copy, old profiles untouched, own imports retained');
  } finally {await fs.rm(root,{recursive:true,force:true})}
})().catch(error=>{console.error(error);process.exitCode=1});
