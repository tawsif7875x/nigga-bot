const logger = require('./logger');

/**
 * Helper functions for thread management
 */
class ThreadHelper {
  /**
   * Get detailed information about a thread
   * @param {Object} api - Facebook API
   * @param {String} threadID - Thread ID
   * @returns {Promise<Object>} Thread information
   */
  static async getThreadInfo(api, threadID) {
    return new Promise((resolve, reject) => {
      api.getThreadInfo(threadID, (err, info) => {
        if (err) reject(err);
        else resolve(info);
      });
    });
  }
  
  /**
   * Get information about multiple users
   * @param {Object} api - Facebook API
   * @param {Array<String>} userIDs - User IDs to fetch
   * @returns {Promise<Object>} Map of user info by user ID
   */
  static async getUsersInfo(api, userIDs) {
    if (!userIDs || !userIDs.length) return {};
    
    return new Promise((resolve, reject) => {
      api.getUserInfo(userIDs, (err, info) => {
        if (err) reject(err);
        else resolve(info);
      });
    });
  }
  
  /**
   * Add bot to a thread
   * @param {Object} api - Facebook API
   * @param {String} threadID - Thread ID to join
   * @returns {Promise<void>}
   */
  static async addBotToThread(api, threadID) {
    const botID = api.getCurrentUserID();
    
    return new Promise((resolve, reject) => {
      api.addUserToGroup(botID, threadID, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
  
  /**
   * Remove bot from a thread
   * @param {Object} api - Facebook API
   * @param {String} threadID - Thread ID to leave
   * @returns {Promise<void>}
   */
  static async removeBotFromThread(api, threadID) {
    const botID = api.getCurrentUserID();
    
    return new Promise((resolve, reject) => {
      api.removeUserFromGroup(botID, threadID, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
  
  /**
   * Get list of threads the bot is in
   * @param {Object} api - Facebook API
   * @param {Number} limit - Number of threads to fetch
   * @returns {Promise<Array>} List of threads
   */
  static async getThreadList(api, limit = 100) {
    return new Promise((resolve, reject) => {
      api.getThreadList(limit, null, ["INBOX"], (err, threads) => {
        if (err) reject(err);
        else resolve(threads);
      });
    });
  }
  
  /**
   * Update thread admins in the permission system
   * @param {Object} api - Facebook API
   * @param {String} threadID - Thread ID to update
   * @returns {Promise<Array>} List of admin IDs
   */
  static async updateThreadAdmins(api, threadID) {
    try {
      // Get thread info
      const threadInfo = await this.getThreadInfo(api, threadID);
      
      // Extract admin IDs
      const adminIDs = threadInfo?.adminIDs?.map(admin => admin.id) || [];
      
      // Update permission manager if available
      if (global.permissionManager) {
        await global.permissionManager.refreshThreadAdmins(api, threadID);
        logger.info(`Updated ${adminIDs.length} admins for thread ${threadID}`);
      }
      
      return adminIDs;
    } catch (error) {
      logger.error(`Failed to update thread admins: ${error.message}`);
      throw error;
    }
  }
}

module.exports = ThreadHelper;
