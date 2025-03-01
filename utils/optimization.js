const cache = require('./cache');
const rateLimit = require('./rateLimit');
const logger = require('./logger');

class Optimization {
  static commandQueue = [];
  static isProcessing = false;

  static async queueCommand(handler, api, message) {
    this.commandQueue.push({ handler, api, message });
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  static async processQueue() {
    this.isProcessing = true;
    while (this.commandQueue.length > 0) {
      const { handler, api, message } = this.commandQueue.shift();
      try {
        await handler(api, message);
      } catch (error) {
        logger.error('Command execution error:', error);
      }
      // Add delay between commands
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    this.isProcessing = false;
  }

  static clearMemory() {
    cache.clear();
    rateLimit.clear();
    this.commandQueue = [];
    global.gc && global.gc(); // Force garbage collection if available
  }
}

// Run memory cleanup every hour
setInterval(() => {
  Optimization.clearMemory();
}, 3600000);

module.exports = Optimization;
