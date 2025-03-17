/**
 * API Wrapper for WS3-FCA to provide safer and more reliable API calls
 */
const logger = require('./utils/logger');

class ApiWrapper {
  constructor(api) {
    this.api = api;
    this.setupSafetyWrapper();
  }

  /**
   * Set up safety wrappers for all API functions
   */
  setupSafetyWrapper() {
    // Wrap critical methods with safety checks
    this.wrapMethod('sendMessage');
    this.wrapMethod('sendTypingIndicator');
    this.wrapMethod('markAsRead');
    this.wrapMethod('setMessageReaction');
    this.wrapMethod('getThreadInfo');
    this.wrapMethod('getThreadList');
    this.wrapMethod('getUserInfo');
    this.wrapMethod('addUserToGroup');
    this.wrapMethod('removeUserFromGroup');
    this.wrapMethod('changeThreadName');
    this.wrapMethod('changeNickname');
    this.wrapMethod('getThreadHistory');
    
    // Add special handling for sendMessage
    this.enhanceSendMessage();
    
    logger.info('API wrapper initialized with safety measures');
  }
  
  /**
   * Wrap an API method with safety checks
   * @param {string} methodName - Name of the method to wrap
   */
  wrapMethod(methodName) {
    if (typeof this.api[methodName] !== 'function') {
      logger.debug(`Method ${methodName} not available in API`);
      return;
    }
    
    const originalMethod = this.api[methodName];
    
    this.api[methodName] = (...args) => {
      try {
        // Ensure last argument is a callback if expected
        const lastIndex = args.length - 1;
        
        // If last argument is not a function, add a default callback
        if (typeof args[lastIndex] !== 'function') {
          args.push((err, result) => {
            if (err) {
              logger.debug(`Error in ${methodName}: ${err.message || err}`);
            }
          });
        }
        
        return originalMethod.apply(this.api, args);
      } catch (error) {
        logger.error(`Error calling ${methodName}: ${error.message}`);
        
        // Return a rejected promise for promise chains
        return Promise.reject(error);
      }
    };
  }
  
  /**
   * Add special handling for sendMessage which is the most commonly used method
   */
  enhanceSendMessage() {
    if (typeof this.api.sendMessage !== 'function') return;
    
    const originalSendMessage = this.api.sendMessage;
    
    // Create a promisified version
    this.api.sendMessageAsync = (message, threadID, messageID) => {
      return new Promise((resolve, reject) => {
        try {
          originalSendMessage.call(this.api, message, threadID, (err, info) => {
            if (err) return reject(err);
            resolve(info);
          }, messageID);
        } catch (error) {
          reject(error);
        }
      });
    };
  }
  
  /**
   * Convert the original API object to use our wrapper
   * @returns {Object} The wrapped API
   */
  getWrappedApi() {
    return this.api;
  }
}

module.exports = ApiWrapper;
