const config = require('../config.json');
const logger = require('../utils/logger');

let userAgentIndex = 0;
const userAgents = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.2 Safari/605.1.15",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36 Edg/121.0.0.0"
];

const deviceInfo = {
  rotateUserAgent() {
    userAgentIndex = (userAgentIndex + 1) % userAgents.length;
    return userAgents[userAgentIndex];
  },

  getRandomDevice() {
    const devices = ['Windows', 'iPhone', 'iPad', 'Android'];
    return devices[Math.floor(Math.random() * devices.length)];
  },

  simulateTypingSpeed() {
    const { minSpeed, maxSpeed } = config.humanBehavior.typing;
    return Math.floor(Math.random() * (maxSpeed - minSpeed) + minSpeed);
  }
};

const activityPattern = {
  lastActivity: Date.now(),
  messageCount: 0,
  breakDue: false,

  shouldTakeBreak() {
    const now = Date.now();
    const timeSinceLastBreak = now - this.lastActivity;
    const { interval } = config.humanBehavior.activityPatterns.breaks;
    
    if (timeSinceLastBreak >= interval.min && Math.random() > 0.7) {
      return true;
    }

    if (this.messageCount >= config.humanBehavior.rateLimits.messagesPerHour) {
      return true;
    }

    return false;
  },

  resetActivity() {
    this.lastActivity = Date.now();
    this.messageCount = 0;
    this.breakDue = false;
  }
};

const antiSpam = {
  messageQueue: new Map(),
  
  addMessage(userId, message) {
    if (!this.messageQueue.has(userId)) {
      this.messageQueue.set(userId, []);
    }
    this.messageQueue.get(userId).push({
      content: message,
      timestamp: Date.now()
    });
    this.cleanOldMessages(userId);
  },

  isSpamming(userId) {
    const userMessages = this.messageQueue.get(userId) || [];
    const recentMessages = userMessages.filter(msg => 
      Date.now() - msg.timestamp < 60000
    );
    return recentMessages.length > config.humanBehavior.rateLimits.messagesPerMinute;
  },

  cleanOldMessages(userId) {
    const userMessages = this.messageQueue.get(userId) || [];
    const now = Date.now();
    this.messageQueue.set(userId, 
      userMessages.filter(msg => now - msg.timestamp < 300000)
    );
  }
};

module.exports = {
  deviceInfo,
  activityPattern,
  antiSpam
};
