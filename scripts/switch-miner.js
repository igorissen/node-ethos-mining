const axios = require('axios');
const to = require('await-to-js').to;
const httpStatus = require('http-status');
const bluebird = require('bluebird');

const env = require('../environment');
const helpers = require('../helpers');
const coins = require('../coins');
const algorithms = require('../algorithms')[env.ethosGpu];

const writeFileAsync = bluebird.promisify(require('fs').writeFile);

const filterMostProfitableCoins = (mostProfitableCoins, userCoins) => {
  const filteredMostProfitableCoins = [];
  const keys = Object.keys(mostProfitableCoins);

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];

    if (userCoins.has(mostProfitableCoins[key].tag.toLowerCase())) {
      const coin = mostProfitableCoins[key];
      coin.name = key;
      filteredMostProfitableCoins.push(coin);
    }
  }

  return filteredMostProfitableCoins;
};

const fetchMostProfitableCoins = async () => {
  const [err, response] = await to(axios.get(env.userWhattomineUrl));

  if (err) {
    throw err;
  }

  if (response.status !== httpStatus.OK) {
    throw new Error(
      `Something went wrong when fetching the most profitable coins from WhatToMine (HTTP Status code: ${response.status})`
    );
  }

  return filterMostProfitableCoins(response.data.coins, new Set(env.userCoins.map((item) => item.toLowerCase())));
};

const findMostProfitableCoin = (mostProfitableCoins) => {
  if (env.userSelectedCoin) {
    const coin = mostProfitableCoins.find((coin) => coin.tag.toLowerCase() === env.userSelectedCoin.toLowerCase());
    if (coin) {
      return coin;
    }
  }
  
  return mostProfitableCoins.reduce((keep, coin) => {
    if (!keep) {
      return coin;
    }

    return coin.profitability > keep.profitability && !coin.lagging ? coin : keep;
  });
};

const updateEthOSLocalConfiguration = async (mostProfitableCoin, coinSettings, algorithmSettings) => {
  const pools = coinSettings.pools.map((pool, index) => `proxypool${index + 1} ${pool}`).join('\n');
  const dualminerPoolpass =
    (algorithmSettings.dualminerPoolpass ? 'dualminer-poolpass ' + algorithmSettings.dualminerPoolpass : '') + '\n';
  let configuration =
    `globalminer ${algorithmSettings.globalminer}\n` +
    `maxgputemp ${algorithmSettings.maxgputemp}\n` +
    `stratumproxy ${algorithmSettings.stratumproxy}\n` +
    `proxywallet ${coinSettings.wallet}\n` +
    pools +
    '\n' +
    `${coinSettings.poolemail ? 'poolemail ' + coinSettings.poolemail : ''}\n` +
    `${algorithmSettings.flags ? 'flags ' + algorithmSettings.flags : ''}\n` +
    `globalfan ${algorithmSettings.globalfan}\n` +
    `autoreboot ${algorithmSettings.autoreboot}\n` +
    `custompanel ${env.userRigName + env.userPrivateKey}\n`;

  if (algorithmSettings.dualminer === 'enabled') {
    configuration +=
      `dualminer ${algorithmSettings.dualminer}\n` +
      `dualminer-coin ${algorithmSettings.dualminerCoin}\n` +
      `dualminer-pool ${algorithmSettings.dualminerPool}\n` +
      `dualminer-wallet ${algorithmSettings.dualminerWallet}\n` +
      dualminerPoolpass;
  }

  console.log(configuration);

  try {
    await to(writeFileAsync(env.ethosLocal, configuration, { encoding: 'utf8' }));
  } catch (e) {
    throw e;
  }
};

const switchMiner = async () => {
  const mostProfitableCoin = findMostProfitableCoin(await fetchMostProfitableCoins());

  const tag = mostProfitableCoin.tag.toLowerCase();
  const algorithm = mostProfitableCoin.algorithm.toLowerCase();

  if (!coins.has(tag)) {
    throw new Error(
      `Coin with tag '${tag}' does not exists. Please update or add the coin in file named 'coins.config.json' in configurations folder`
    );
  }

  if (!algorithms.has(algorithm)) {
    throw new Error(
      `'${algorithm}' does not exists. Please update or add the algorithm in file named '(amd|nvidia)-algorithms.config.json' in configurations folder`
    );
  }

  await updateEthOSLocalConfiguration(mostProfitableCoin, coins.get(tag), algorithms.get(algorithm));
  await helpers.restartMiner();
};

switchMiner()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
