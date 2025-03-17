const logger = require('./logger');
const messageUtils = require('./messageUtils');

/**
 * Safe API wrappers that handle undefined values and errors gracefully
 */
const safeApi = {
  /**
   * Safely send typing indicator
   * @param {Object} api - The Facebook API object
   * @param {string|number} threadID - The thread ID
   * @returns {Promise} - Promise resolving to the API response or null
   */
  sendTypingIndicator: (api, threadID) => {
    return new Promise(resolve => {
      try {
        // Return early if API or threadID invalid
        if (!api || !threadID) return resolve(null);
        
        // Convert to string safely
        const thread = String(threadID);
        
        // Check if the function exists
        if (typeof api.sendTypingIndicator !== 'function') {
          logger.warn('sendTypingIndicator function missing on API object, adding simple implementation...');
          
          // Add a simple implementation if missing
          api.sendTypingIndicator = function(threadId, callback) {
            if (typeof callback !== 'function') {
              callback = () => {};
            }
            process.nextTick(() => callback(null));
            return Promise.resolve();
          };
        }
        
        // Call the API with proper error handling
        api.sendTypingIndicator(thread, (err) => {
          if (err) {
            logger.debug(`Typing indicator error: ${err.message || 'Unknown error'}`);
          }
          resolve(null);
        });
      } catch (error) {
        // Log but don't rethrow - typing indicators aren't critical
        logger.debug(`Typing indicator exception: ${error.message}`);
        resolve(null);
      }
    });
  },
  
  /**
   * Safely mark message as read
   * @param {Object} api - The Facebook API object
   * @param {string|number} threadID - The thread ID
   * @returns {Promise} - Promise resolving to null
   */
  markAsRead: (api, threadID) => {
    return new Promise(resolve => {
      try {
        if (!api || !threadID) return resolve(null);
        const thread = String(threadID);
        
        // Use an explicit callback to prevent potential errors
        api.markAsRead(thread, () => resolve(null));
      } catch (error) {
        logger.debug(`Mark as read exception: ${error.message}`);
        resolve(null);
      }
    });
  },
  
  /**
   * Safely mark message as delivered
   * @param {Object} api - The ws3-fca API object
   * @param {string|number} threadID - The thread ID
   * @param {string|number} messageID - The message ID
   * @returns {Promise} - Promise resolving to the API response or null
   */
  markAsDelivered: (api, threadID, messageID) => {
    return new Promise(resolve => {
      try {
        if (!api || !threadID || !messageID) return resolve(null);
        
        const thread = String(threadID);
        const message = String(messageID);
        
        api.markAsDelivered(thread, message, (err) => {
          if (err) logger.debug(`Mark as delivered error: ${err.message}`);
          resolve(null);
        });
      } catch (error) {
        logger.debug(`Failed to mark as delivered: ${error.message}`);
        resolve(null);
      }
    });
  },

  /**
   * Safely send a message with error handling
   * @param {Object} api - The Facebook API object
   * @param {string|Object} message - The message text or object
   * @param {string|number} threadID - The thread ID
   * @param {string|number} [messageID] - Optional message ID to reply to
   * @returns {Promise} - Promise resolving to the message info or error
   */
  sendMessage: (api, message, threadID, messageID = null) => {
    return new Promise((resolve, reject) => {
      try {
        // Validate parameters
        if (!api || !message || !threadID) {
          reject(new Error('Missing required parameters'));
          return;
        }
        
        // Use our enhanced sendMessage function
        messageUtils.sendMessage(api, message, threadID, (err, info) => {
          if (err) reject(err);
          else resolve(info);
        }, messageID);
      } catch (error) {
        reject(error);
      }
    });
  },
  
  /**
   * Create and send a message with user mentions
   * @param {Object} api - The Facebook API object
   * @param {string} text - The message text
   * @param {Array|Object} mentions - User(s) to mention
   * @param {string|number} threadID - The thread ID
   * @returns {Promise} - Promise resolving to the message info or error
   */
  sendMention: (api, text, mentions, threadID) => {
    return new Promise((resolve, reject) => {
      try {
        // Format the message with mentions
        const messageObj = messageUtils.createMention(text, mentions);
        
        // Send the formatted message
        safeApi.sendMessage(api, messageObj, threadID)
          .then(resolve)
          .catch(reject);
      } catch (error) {
        reject(error);
      }
    });
  }
};

module.exports = safeApi;
