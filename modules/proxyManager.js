const { getRandomProxy } = require('../utils/proxy');
const logger = require('../utils/logger');

class ProxyManager {
  constructor() {
    this.currentProxy = null;
    this.failedAttempts = 0;
    this.maxFailedAttempts = 3;
  }

  async rotateProxy() {
    this.currentProxy = await getRandomProxy();
    this.failedAttempts = 0;
    logger.info('Rotated to new proxy:', this.currentProxy);
    return this.currentProxy;
  }

  async handleFailure() {
    this.failedAttempts++;
    if (this.failedAttempts >= this.maxFailedAttempts) {
      await this.rotateProxy();
    }
  }
}

module.exports = new ProxyManager();
