const config = require('../config.json');

class Cache {
  constructor() {
    this.store = new Map();
    this.timeout = config.performance.cacheTimeout;
  }

  set(key, value) {
    if (!config.performance.cacheEnabled) return;
    
    this.store.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  get(key) {
    if (!config.performance.cacheEnabled) return null;
    
    const data = this.store.get(key);
    if (!data) return null;

    if (Date.now() - data.timestamp > this.timeout) {
      this.store.delete(key);
      return null;
    }

    return data.value;
  }

  clear() {
    this.store.clear();
  }
}

module.exports = new Cache();
