const env = require('../environment');
const helpers = require('../helpers');

try {
  helpers.moveFile(env.ethosLocal, env.ethosLocalBackup);
  helpers.moveFile(env.ethosRemote, env.ethosRemoteBackup);
} catch (e) {
  console.error(e);
  return process.exit(1);
}

console.log('Local and remote configuration files have been copied!');

process.exit(0);
