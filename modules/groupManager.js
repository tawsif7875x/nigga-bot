const logger = require('../utils/logger');
const dbManager = require('./dbManager');
const analytics = require('./analytics');

class GroupManager {
  constructor(api) {
    this.api = api;
    this.antiSpamWarnings = new Map();
    this.userTimeouts = new Map();
  }

  async handleNewMember(threadID, userID) {
    try {
      const groupInfo = await dbManager.getGroup(threadID);
      const welcomeMsg = groupInfo?.welcome_message || 'Welcome to the group!';
      
      await this.api.sendMessage({
        body: welcomeMsg,
        mentions: [{ tag: '@user', id: userID }]
      }, threadID);

      await analytics.logUserActivity(userID, threadID, 'join_group');
    } catch (error) {
      logger.error('Error handling new member:', error);
    }
  }

  async handleSpam(threadID, userID, message) {
    let warnings = this.antiSpamWarnings.get(userID) || 0;
    warnings++;
    this.antiSpamWarnings.set(userID, warnings);

    if (warnings >= 3) {
      try {
        await this.api.removeUserFromGroup(userID, threadID);
        await analytics.logUserActivity(userID, threadID, 'removed_for_spam');
        this.antiSpamWarnings.delete(userID);
      } catch (error) {
        logger.error('Error removing spammer:', error);
      }
    } else {
      await this.api.sendMessage(
        `⚠️ Warning ${warnings}/3: Please don't spam!`,
        threadID
      );
    }
  }

  async updateGroupSettings(threadID, settings) {
    try {
      await dbManager.updateGroupSettings(threadID, settings);
      await this.api.sendMessage(
        '✅ Group settings updated successfully!',
        threadID
      );
      
      await analytics.logUserActivity(
        'system',
        threadID,
        'update_settings',
        settings
      );
    } catch (error) {
      logger.error('Error updating group settings:', error);
    }
  }

  async autoModerate(message) {
    const { threadID, senderID, body } = message;
    
    // Check for banned words
    const groupInfo = await dbManager.getGroup(threadID);
    const bannedWords = JSON.parse(groupInfo?.settings || '{}').bannedWords || [];
    
    if (bannedWords.some(word => body?.toLowerCase().includes(word))) {
      await this.api.unsendMessage(message.messageID);
      await this.warnUser(threadID, senderID, 'banned_words');
    }

    // Check for spam
    if (this.isSpamming(senderID)) {
      await this.handleSpam(threadID, senderID, message);
    }
  }

  isSpamming(userID) {
    const now = Date.now();
    const userMessages = this.userTimeouts.get(userID) || [];
    
    // Remove old messages
    const recentMessages = userMessages.filter(
      time => now - time < 60000
    );
    
    this.userTimeouts.set(userID, recentMessages);
    
    // Add new message timestamp
    recentMessages.push(now);
    
    // Check if user is spamming
    return recentMessages.length > 5;
  }

  async warnUser(threadID, userID, reason) {
    const warnings = await dbManager.incrementWarning(userID);
    
    if (warnings >= 3) {
      await this.api.removeUserFromGroup(userID, threadID);
      await analytics.logUserActivity(userID, threadID, 'banned', { reason });
    } else {
      await this.api.sendMessage(
        `⚠️ Warning ${warnings}/3: Violation: ${reason}`,
        threadID
      );
    }
  }
}

module.exports = GroupManager;
