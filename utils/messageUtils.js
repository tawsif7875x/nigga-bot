/**
 * Utility functions for handling messages
 */
const logger = require('./logger');

/**
 * Format message with mentions to avoid ws3-fca warnings
 * 
 * @param {string} text - Message text
 * @param {array} mentions - Array of mention objects
 * @returns {object} - Properly formatted message object
 */
function formatMessageWithMentions(text, mentions = []) {
  // If no mentions or empty text, just return the text
  if (!mentions?.length || !text) {
    return text;
  }

  try {
    // Construct the message object
    const messageObj = {
      body: text,
      mentions: []
    };
    
    // Process each mention
    for (const mention of mentions) {
      // Skip invalid mentions
      if (!mention.tag || !mention.id) continue;
      
      // Make sure the tag appears in the message
      if (!text.includes(mention.tag)) {
        // Tag not found, so we append it to avoid the warning
        messageObj.body += `\n${mention.tag}`;
        messageObj.mentions.push({
          tag: mention.tag,
          id: mention.id,
          fromIndex: messageObj.body.indexOf(mention.tag),
        });
      } else {
        // Tag exists in message, add with correct index
        messageObj.mentions.push({
          tag: mention.tag,
          id: mention.id,
          fromIndex: text.indexOf(mention.tag),
        });
      }
    }
    
    return messageObj;
  } catch (error) {
    logger.error("Error formatting message with mentions:", error);
    // Return original text as fallback
    return text;
  }
}

/**
 * Create a properly formatted mention in message
 * 
 * @param {string} text - Base message text
 * @param {array|object} users - User(s) to mention (object with id and tag properties, or array of such objects)
 * @returns {object} - Message object with proper mentions
 */
function createMention(text, users) {
  try {
    // Convert single user to array for uniform handling
    const userArray = Array.isArray(users) ? users : [users];
    
    // Filter out invalid users
    const validUsers = userArray.filter(user => user && user.id && user.tag);
    
    // Return formatted message with mentions
    return formatMessageWithMentions(text, validUsers);
  } catch (error) {
    logger.error("Error creating mention:", error);
    return text;
  }
}

/**
 * Extract user mentions from message event
 * 
 * @param {object} event - Facebook message event
 * @returns {array} - Array of user objects with id and tag
 */
function extractMentions(event) {
  if (!event?.mentions) return [];
  
  try {
    const mentions = [];
    
    // Convert Facebook's mentions format to our format
    for (const id in event.mentions) {
      if (Object.hasOwnProperty.call(event.mentions, id)) {
        const tag = event.mentions[id];
        mentions.push({ id, tag });
      }
    }
    
    return mentions;
  } catch (error) {
    logger.error("Error extracting mentions:", error);
    return [];
  }
}

/**
 * Enhanced sendMessage that properly handles mentions
 * 
 * @param {object} api - The Facebook API 
 * @param {string|object} message - Message text or object
 * @param {string} threadID - Thread ID to send to
 * @param {function} callback - Optional callback
 * @param {string} messageID - Optional messageID to reply to
 * @returns {Promise<object>} - Promise that resolves with message info
 */
function sendMessage(api, message, threadID, callback, messageID) {
  return new Promise((resolve, reject) => {
    try {
      // Ensure API exists
      if (!api || typeof api.sendMessage !== 'function') {
        const error = new Error('Invalid API object');
        if (typeof callback === 'function') callback(error);
        return reject(error);
      }
      
      // Optional callback
      const cb = typeof callback === 'function' 
        ? callback 
        : (typeof messageID === 'function' ? messageID : () => {});
      
      // If messageID is a function, it's actually the callback
      const msgID = typeof messageID === 'function' ? undefined : messageID;
      
      // Process message object to ensure mentions are properly formatted
      let finalMessage = message;
      if (typeof message === 'object' && message.mentions) {
        finalMessage = formatMessageWithMentions(
          message.body || '',
          message.mentions
        );
      }
      
      // Send message
      api.sendMessage(finalMessage, threadID, (err, info) => {
        if (err) {
          cb(err);
          reject(err);
        } else {
          cb(null, info);
          resolve(info);
        }
      }, msgID);
      
    } catch (error) {
      if (typeof callback === 'function') callback(error);
      reject(error);
    }
  });
}

module.exports = {
  formatMessageWithMentions,
  createMention,
  extractMentions,
  sendMessage
};
