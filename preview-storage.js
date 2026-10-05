'use strict';
const fs=require('node:fs/promises'),path=require('node:path');
const OWN_DIRECTORY=/^preview-[a-zA-Z0-9]{6}$/;
function previewStorage(userData) {
  const root=path.join(userData,'print-previews');
  async function prepare() {
    await fs.mkdir(root,{recursive:true,mode:0o700});
    const stat=await fs.lstat(root);
    if(!stat.isDirectory() || stat.isSymbolicLink()) throw new Error('مسار معاينة غير آمن');
  }
  async function remove(directory) {
    if(path.dirname(directory)!==root || !OWN_DIRECTORY.test(path.basename(directory))) throw new Error('مسار تنظيف غير معتمد');
    await fs.rm(directory,{recursive:true,force:true});
  }
  async function cleanup() {
    await prepare();
    for(const entry of await fs.readdir(root,{withFileTypes:true})) {
      if(entry.isDirectory() && !entry.isSymbolicLink() && OWN_DIRECTORY.test(entry.name)) await remove(path.join(root,entry.name));
    }
  }
  async function create(html) {
    await prepare();
    const directory=await fs.mkdtemp(path.join(root,'preview-'));
    const file=path.join(directory,'report.html');
    try {await fs.writeFile(file,html,{encoding:'utf8',mode:0o600});return {directory,file};}
    catch(error){await remove(directory);throw error;}
  }
  return {cleanup,create,remove};
}
module.exports={previewStorage};
