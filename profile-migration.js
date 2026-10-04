const fs = require('node:fs/promises');
const path = require('node:path');

async function exists(file) {
  try { await fs.access(file); return true; } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

// A copy, never a move: the previous installation remains intact.
async function copyLegacyProfile(appData, userData) {
  if (await exists(path.join(userData, 'Local Storage'))) return false;
  for (const name of ['arabic-letter-assessment', 'Arabic Letter Assessment']) {
    const source = path.join(appData, name);
    if (path.resolve(source) === path.resolve(userData) || !await exists(path.join(source,'Local Storage'))) continue;
    await fs.mkdir(userData,{recursive:true});
    const staging = await fs.mkdtemp(path.join(userData,'.legacy-import-'));
    try {
      await fs.cp(path.join(source,'Local Storage'),path.join(staging,'Local Storage'),{recursive:true});
      if (await exists(path.join(source,'IndexedDB')) && !await exists(path.join(userData,'IndexedDB'))) {
        await fs.cp(path.join(source,'IndexedDB'),path.join(staging,'IndexedDB'),{recursive:true});
        await fs.rename(path.join(staging,'IndexedDB'),path.join(userData,'IndexedDB'));
      }
      await fs.rename(path.join(staging,'Local Storage'),path.join(userData,'Local Storage'));
      return true;
    } finally { await fs.rm(staging,{recursive:true,force:true}); }
  }
  return false;
}

module.exports = {copyLegacyProfile};
