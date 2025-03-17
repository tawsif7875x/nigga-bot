/**
 * API Fixes - Adds missing functions and fixes common issues with ws3-fca
 */
const logger = require('./logger');
const messageUtils = require('./messageUtils');

/**
 * Apply fixes to the Facebook API object
 * @param {Object} api - The Facebook API object from ws3-fca
 * @returns {Object} - The fixed API object
 */
function applyFixes(api) {
  if (!api) return null;
  
  logger.info("Applying API fixes");
  
  // Fix #1: Add missing typing indicator if not present
  if (typeof api.sendTypingIndicator !== 'function') {
    logger.info("Adding missing sendTypingIndicator function");
    
    api.sendTypingIndicator = function(threadID, callback) {
      // Ensure callback exists
      if (typeof callback !== 'function') {
        callback = () => {};
      }
      
      try {
        // Try using HTTP API if available
        if (typeof this._sendRequest === 'function') {
          this._sendRequest("https://www.facebook.com/ajax/messaging/typ.php", {
            typ: 1,
            to: threadID,
            source: "source:chat:web",
            sid: Date.now()
          }).then(() => {
            callback(null);
          }).catch(err => {
            logger.debug(`Typing indicator error: ${err.message}`);
            callback(null); // Always succeed to avoid breaking functionality
          });
        } else {
          // If _sendRequest isn't available, succeed silently
          process.nextTick(() => callback(null));
        }
        return Promise.resolve();
      } catch (error) {
        logger.debug(`Typing indicator error: ${error.message}`);
        process.nextTick(() => callback(null));
        return Promise.resolve();
      }
    };
  }
  
  // Fix #2: Ensure sendMessage always has proper callback handling
  if (typeof api.sendMessage === 'function') {
    const originalSendMessage = api.sendMessage;
    
    api.sendMessage = function(message, threadID, callback, messageID) {
      // Handle different argument patterns
      if (typeof threadID === 'function') {
        messageID = callback;
        callback = threadID;
        threadID = null;
      }
      
      // Ensure callback is always a function
      if (typeof callback !== 'function') {
        callback = () => {};
      }
      
      // Fix mention format if message is an object with mentions
      if (message && typeof message === 'object' && Array.isArray(message.mentions)) {
        message = messageUtils.formatMessageWithMentions(message.body || '', message.mentions);
      }
      
      // Call the original with fixed arguments
      try {
        return originalSendMessage.call(this, message, threadID, callback, messageID);
      } catch (error) {
        logger.error("Error in sendMessage:", error);
        callback(error);
        return Promise.reject(error);
      }
    };
    
    logger.info("Fixed sendMessage callback handling and mention formatting");
  }
  
  // Add enhanced sendMessage with proper mention handling
  api.sendMessageWithMentions = function(text, mentions, threadID, callback, messageID) {
    const messageObj = messageUtils.createMention(text, mentions);
    return this.sendMessage(messageObj, threadID, callback, messageID);
  };
  
  // Fix #3: Add simple promisified versions of common functions
  api.sendMessageAsync = function(message, threadID, messageID) {
    return new Promise((resolve, reject) => {
      this.sendMessage(message, threadID, (err, info) => {
        if (err) return reject(err);
        resolve(info);
      }, messageID);
    });
  };
  
  api.getThreadInfoAsync = function(threadID) {
    return new Promise((resolve, reject) => {
      this.getThreadInfo(threadID, (err, info) => {
        if (err) return reject(err);
        resolve(info);
      });
    });
  };
  
  api.getUserInfoAsync = function(userIDs) {
    return new Promise((resolve, reject) => {
      this.getUserInfo(userIDs, (err, info) => {
        if (err) return reject(err);
        resolve(info);
      });
    });
  };
  
  logger.info("Added message utilities and async helper methods");
  
  return api;
}

module.exports = { applyFixes };
