const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),destination=path.join(root,'vendor','licenses');
fs.mkdirSync(destination,{recursive:true});
for (const name of ['pdfjs-dist','tesseract.js','tesseract.js-core']) {
  const directory=path.join(root,'node_modules',name);
  let count=0;
  for (const subdirectory of ['', 'dist']) {
    const source=path.join(directory,subdirectory);
    if (!fs.existsSync(source)) continue;
    for (const file of fs.readdirSync(source)) {
      if (!/license|notice|copying/i.test(file) || !fs.statSync(path.join(source,file)).isFile()) continue;
      fs.copyFileSync(path.join(source,file),path.join(destination,`${name}-${file}`));count++;
    }
  }
  if (!count) throw new Error(`Missing upstream license for ${name}`);
}
fs.writeFileSync(path.join(destination,'README.txt'),
  'Third-party license texts and bundled notices copied from locked npm dependencies.\n'+
  'PDF.js: Mozilla Foundation, Apache-2.0.\n'+
  'Tesseract.js and Tesseract core: upstream contributors, Apache-2.0; bundled notices retain other dependency licenses.\n'+
  'Arabic traineddata: Tesseract tessdata contributors, Apache-2.0.\n'+
  'Electron: Electron contributors, MIT, with Chromium notices in the Electron distribution.\n'+
  'Project code has its own MIT LICENSE. These notices do not relicense third-party assets.\n');
console.log('Copied third-party license texts and notices into runtime vendor/licenses');
