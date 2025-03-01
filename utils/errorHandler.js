const logger = require('./logger');

class ErrorHandler {
  static handle(error, context = '') {
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
      logger.warn(`Network error in ${context}: ${error.message}`);
      return true;
    }

    if (error.error === 'login-approval') {
      logger.error('Login approval required');
      return false;
    }

    if (error.error === 'login-approval:checkpoint') {
      logger.error('Account checkpoint detected');
      return false;
    }

    logger.error(`Unhandled error in ${context}:`, error);
    return false;
  }

  static async retry(fn, retries = 3, delay = 1000) {
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }
}

module.exports = ErrorHandler;
