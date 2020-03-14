const env = require('../environment');
const helpers = require('../helpers');

try {
  helpers.moveFile(env.ethosLocalBackup, env.ethosLocal);
  helpers.moveFile(env.ethosRemoteBackup, env.ethosRemote);
} catch (e) {
  console.error(e);
  return process.exit(1);
}

console.log('Local and remote configuration files have been reset!');

process.exit(0);
