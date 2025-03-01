const logger = require('../utils/logger');
const rateLimit = require('../utils/rateLimit');

class AntiSpam {
  constructor() {
    this.warnedUsers = new Set();
    this.blockedUsers = new Set();
  }

  checkMessage(message) {
    const { senderID } = message;
    
    if (this.blockedUsers.has(senderID)) {
      return 'blocked';
    }

    if (rateLimit.isLimited(senderID, 'spam')) {
      if (this.warnedUsers.has(senderID)) {
        this.blockedUsers.add(senderID);
        logger.warn(`User ${senderID} blocked for spamming`);
        return 'blocked';
      }

      this.warnedUsers.add(senderID);
      logger.warn(`User ${senderID} warned for potential spam`);
      return 'warned';
    }

    return 'safe';
  }
}

module.exports = new AntiSpam();
