const config = require('../config.json');
const logger = require('../utils/logger');
const rateLimit = require('../utils/rateLimit');

let isInBreak = false;
let dailyMessageCount = 0;

function processMessage(message) {
  const currentTime = Date.now();
  const hour = new Date().getHours();

  // Check active hours
  if (hour < config.botBehavior.activeHours.start || hour >= config.botBehavior.activeHours.end) {
    logger.warn('Message blocked: Outside active hours');
    return false;
  }

  // Check if in break
  if (isInBreak) {
    logger.warn('Message blocked: Bot is taking a break');
    return false;
  }

  // Check rate limits
  if (rateLimit.isLimited(message.senderID, 'message')) {
    logger.warn('Message blocked: Rate limit exceeded');
    return false;
  }

  if (dailyMessageCount >= config.safeMode.maxDailyMessages) {
    logger.warn('Message blocked: Daily limit reached');
    return false;
  }

  // Check content filters
  if (config.safeMode.contentFilter.some(word => message.body?.includes(word))) {
    logger.warn('Message blocked: Filtered content');
    return false;
  }

  // Update counters
  dailyMessageCount++;

  // Random break check
  if (config.botBehavior.autoBreaks.enabled && Math.random() < 0.1) {
    takeBreak();
  }

  return true;
}

function takeBreak() {
  if (isInBreak) return;
  
  isInBreak = true;
  const duration = Math.floor(
    Math.random() * 
    (config.botBehavior.autoBreaks.maxDuration - config.botBehavior.autoBreaks.minDuration) +
    config.botBehavior.autoBreaks.minDuration
  );

  logger.info(`Taking a break for ${duration/1000} seconds`);
  
  setTimeout(() => {
    isInBreak = false;
    logger.info('Break finished');
  }, duration);
}

// Reset daily count at midnight
setInterval(() => {
  const now = new Date();
  if (now.getHours() === 0 && now.getMinutes() === 0) {
    dailyMessageCount = 0;
    logger.info('Daily message count reset');
  }
}, 60000);

module.exports = { processMessage };
