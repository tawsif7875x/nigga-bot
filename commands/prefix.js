const logger = require('../utils/logger');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

module.exports = {
  config: {
    name: "prefix",
    aliases: ["setprefix", "changeprefix"],
    version: "1.0.0",
    author: "Nexus Team",
    countDown: 5,
    role: 1,  // Thread admin
    shortDescription: "Set custom prefix for this thread",
    longDescription: "Set a custom command prefix specific to this group chat",
    category: "system",
    guide: "{prefix}prefix [new_prefix or 'reset' to use default]"
  },
  
  execute: async function({ api, event, args, prefix }) {
    const { threadID, messageID } = event;
    const defaultPrefix = global.config?.prefix || '!';
    
    // Initialize thread prefixes if not exist
    if (!global.threadPrefixes) {
      global.threadPrefixes = new Map();
    }
    
    // Show current prefix if no arguments
    if (args.length === 0) {
      const currentPrefix = global.threadPrefixes.get(threadID) || defaultPrefix;
      return api.sendMessage(`📌 Current prefix: ${currentPrefix}\n\nUse "${currentPrefix}prefix [new_prefix]" to change it, or "${currentPrefix}prefix reset" to restore default.`, threadID, messageID);
    }
    
    // Get the new prefix from args
    const newPrefix = args[0];
    
    // Reset to default if requested
    if (newPrefix.toLowerCase() === 'reset') {
      try {
        global.threadPrefixes.delete(threadID);
        await updatePrefix(threadID); // null prefix means delete
        return api.sendMessage(`✅ Prefix reset to default: ${defaultPrefix}`, threadID, messageID);
      } catch (error) {
        logger.error('Error resetting prefix:', error);
        return api.sendMessage('❌ An error occurred while resetting the prefix.', threadID, messageID);
      }
    }
    
    // Validate prefix length (1-5 characters)
    if (newPrefix.length < 1 || newPrefix.length > 5) {
      return api.sendMessage("❌ Prefix must be between 1-5 characters long.", threadID, messageID);
    }
    
    try {
      // Set the new prefix for this thread only
      global.threadPrefixes.set(threadID, newPrefix);
      await updatePrefix(threadID, newPrefix);
      
      // Don't update global prefix
      
      return api.sendMessage(`✅ Prefix changed to: ${newPrefix}\n\nℹ️ This prefix will only work in this thread.\nDefault prefix for other threads remains: ${defaultPrefix}`, threadID, messageID);
    } catch (error) {
      logger.error('Error updating prefix:', error);
      return api.sendMessage('❌ An error occurred while changing the prefix.', threadID, messageID);
    }
  }
};

/**
 * Helper function to save prefix to database or file as fallback
 * @param {string} threadId - Thread ID
 * @param {string|null} prefixValue - Prefix value (null to delete)
 * @returns {Promise<boolean>} - Success status
 */
async function updatePrefix(threadId, prefixValue = null) {
  try {
    // Try to save in database first
    try {
      const dbPath = path.join(process.cwd(), 'database', 'data.db');
      if (fs.existsSync(dbPath)) {
        const db = new sqlite3.Database(dbPath);
        
        if (prefixValue === null) {
          // Delete prefix entry if resetting to default
          await new Promise((resolve, reject) => {
            db.run('DELETE FROM thread_prefixes WHERE thread_id = ?', [threadId], function(err) {
              if (err) reject(err);
              else resolve();
            });
          });
        } else {
          // Insert or replace prefix
          await new Promise((resolve, reject) => {
            db.run('INSERT OR REPLACE INTO thread_prefixes (thread_id, prefix, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)', 
              [threadId, prefixValue], function(err) {
              if (err) reject(err);
              else resolve();
            });
          });
        }
        
        db.close();
        return true;
      }
    } catch (dbError) {
      logger.warn(`Failed to update prefix in database: ${dbError.message}`);
      // Continue to file-based fallback
    }
    
    // Fallback to saving in file
    const prefixPath = path.join(process.cwd(), 'database', 'prefixes.json');
    
    // Read existing prefixes or create new object
    let prefixes = {};
    if (fs.existsSync(prefixPath)) {
      try {
        prefixes = JSON.parse(fs.readFileSync(prefixPath, 'utf8'));
      } catch (parseError) {
        logger.error(`Error parsing prefixes.json: ${parseError.message}`);
        prefixes = {};
      }
    }
    
    // Update or remove prefix
    if (prefixValue === null) {
      delete prefixes[threadId];
    } else {
      prefixes[threadId] = prefixValue;
    }
    
    // Write back to file
    fs.writeFileSync(prefixPath, JSON.stringify(prefixes, null, 2));
    
    return true;
  } catch (error) {
    logger.error(`Error updating prefix: ${error.message}`);
    return false;
  }
}
