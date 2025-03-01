const config = require('../config.json');
const logger = require('../utils/logger');

class AutoModerator {
  constructor() {
    this.toxicityPatterns = [
      /spam|scam|hack/i,
      /(http|https):\/\/[^\s]*/i,
      /\b(fuck|shit|bitch)\b/i
    ];

    this.suspiciousPatterns = {
      capsPam: text => {
        const caps = text.replace(/[^A-Z]/g, '').length;
        const total = text.length;
        return total > 8 && caps / total > 0.7;
      },
      repetition: text => {
        const chars = text.split('');
        let repeats = 0;
        for (let i = 0; i < chars.length - 3; i++) {
          if (chars[i] === chars[i+1] && chars[i] === chars[i+2]) {
            repeats++;
          }
        }
        return repeats > 2;
      }
    };
  }

  async moderateMessage(message) {
    const { body, senderID, threadID } = message;
    if (!body) return true;

    // Check for toxic content
    if (this.toxicityPatterns.some(pattern => pattern.test(body))) {
      logger.warn(`Toxic content detected from user ${senderID}`);
      return false;
    }

    // Check for suspicious patterns
    if (this.suspiciousPatterns.capsPam(body)) {
      logger.warn(`Excessive caps detected from user ${senderID}`);
      return false;
    }

    if (this.suspiciousPatterns.repetition(body)) {
      logger.warn(`Character repetition detected from user ${senderID}`);
      return false;
    }

    return true;
  }
}

module.exports = new AutoModerator();
