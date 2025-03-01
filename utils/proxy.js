const config = require('../config.json');

function getRandomProxy() {
  if (!config.proxy.enabled) {
    return null;
  }
  const proxies = config.proxy.list;
  return proxies[Math.floor(Math.random() * proxies.length)];
}

module.exports = { getRandomProxy };
