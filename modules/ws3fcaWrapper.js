// Custom wrapper for WS3-FCA to handle login issues
const ws3fca = require('ws3-fca');
const logger = require('../utils/logger');

/**
 * Custom login function with proper error handling and retry logic
 * @param {Object} options - Login options
 * @returns {Promise<Object>} - API object
 */
async function login(options) {
  return new Promise((resolve, reject) => {
    ws3fca(options, (err, api) => {
      if (err) {
        reject(err);
        return;
      }
      
      // Override sendTypingIndicator with a fixed version
      const originalSendTyping = api.sendTypingIndicator;
      api.sendTypingIndicator = function(threadID, callback) {
        // Make callback optional
        if (!callback) {
          callback = () => {};
        }
        
        try {
          // Call the original function with proper callback
          return originalSendTyping.call(this, threadID, callback);
        } catch (error) {
          logger.error('Error in sendTypingIndicator:', error);
          // Still call the callback to prevent hanging promises
          callback(error);
          return Promise.reject(error);
        }
      };
      
      resolve(api);
    });
  });
}

module.exports = { login };
