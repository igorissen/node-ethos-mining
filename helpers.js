const { renameSync } = require('fs');
const bluebird = require('bluebird');

const execAsync = bluebird.promisify(require('child_process').exec);

const restartMiner = async () => {
  const { err, stdout, stderr } = await execAsync('minestop && sleep 10 && clear-thermals && sleep 10 && minestart');

  if (err) {
    throw err;
  }

  stdout && console.log(`stdout: ${stdout}`);
  stderr && console.error(`stderr: ${stderr}`);
};

const moveFile = (oldPath, newPath) => {
  try {
    renameSync(oldPath, newPath);
  } catch (e) {
    throw new Error(`Unable to move from ${oldPath} to ${newPath}`);
  }
};

module.exports = {
  moveFile,
  restartMiner
};
