const fs = require('node:fs');
const path = require('node:path');

// Keep this stable across updates. Existing user imports survive restarts/uninstall.
// Earlier profiles are neither read, copied, nor deleted.
const PROFILE_DIRECTORY = 'lughaty-oral-diagnostic-clean';

function configureUserData(app) {
  const userData = path.join(app.getPath('appData'), PROFILE_DIRECTORY);
  fs.mkdirSync(userData, {recursive: true});
  app.setPath('userData', userData);
  return userData;
}

module.exports = {configureUserData, PROFILE_DIRECTORY};
