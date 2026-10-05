// A public CI runner may expose artifacts: encrypt all installer bytes for the
// owner's local RSA private key. The private key is NEVER committed or shipped.
const fs=require('node:fs'),fsp=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const {pipeline}=require('node:stream/promises');
(async()=>{
  const root=path.resolve('release'),output=path.resolve('encrypted-delivery');
  await fsp.mkdir(output,{recursive:true});
  const publicKey=await fsp.readFile('scripts/installer-delivery-public.pub');
  const key=crypto.randomBytes(32),entries=[];
  async function walk(directory) {
    for(const item of await fsp.readdir(directory,{withFileTypes:true})) {
      const file=path.join(directory,item.name);
      if(item.isDirectory()){if(file===path.join(root,'ui-proof'))await walk(file);continue;}
      if(directory===root && !(/Setup.*\.exe(?:\.blockmap)?$|^latest\.yml$|^SHA256SUMS\.txt$|^SIGNING-STATUS\./).test(item.name))continue;
      const relative=path.relative(root,file).replaceAll('\\','/');
      const encrypted=String(entries.length).padStart(3,'0')+'.enc',iv=crypto.randomBytes(12);
      const cipher=crypto.createCipheriv('aes-256-gcm',key,iv);
      await pipeline(fs.createReadStream(file),cipher,fs.createWriteStream(path.join(output,encrypted)));
      entries.push({path:relative,encrypted,size:(await fsp.stat(file)).size,iv:iv.toString('base64'),tag:cipher.getAuthTag().toString('base64')});
    }
  }
  await walk(root);
  if(!entries.some(item=>/Setup.*\.exe$/.test(item.path)))throw new Error('Installer missing');
  const wrappedKey=crypto.publicEncrypt({key:publicKey,oaepHash:'sha256',padding:crypto.constants.RSA_PKCS1_OAEP_PADDING},key);
  await fsp.writeFile(path.join(output,'envelope.json'),JSON.stringify({format:'lughaty-owner-delivery-v1',algorithm:'AES-256-GCM + RSA-OAEP-SHA256',wrappedKey:wrappedKey.toString('base64'),entries},null,2));
  console.log('Encrypted owner-only installer delivery prepared; no plaintext executable is uploaded to Actions artifacts.');
})().catch(error=>{console.error(error.message);process.exitCode=1});
