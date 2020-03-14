const { restartMiner } = require('../helpers');

restartMiner()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
