const ethosConfig = require('./configurations/ethos.config');
const userConfig = require('./configurations/user.config');

module.exports = {
  ...ethosConfig,
  ...userConfig
};
