const config = require('../config.json');

class RateLimit {
  constructor() {
    // Store user requests in memory
    this.requests = new Map();
    // Get settings from config (60000ms = 1 minute window, max 10 requests)
    this.windowMs = config.performance.messageRateLimit.windowMs;  // 60000ms
    this.max = config.performance.messageRateLimit.max;           // 10 requests
  }

  isLimited(id, type = 'default') {
    const now = Date.now();
    const key = `${id}:${type}`;
    const userRequests = this.requests.get(key) || [];
    
    // Remove old requests outside the time window
    const validRequests = userRequests.filter(time => now - time < this.windowMs);
    
    // If user has more requests than allowed in the time window
    if (validRequests.length >= this.max) {
      return true; // User is rate limited
    }
    
    // Add this new request
    validRequests.push(now);
    this.requests.set(key, validRequests);
    return false; // User is not rate limited
  }

  clear() {
    this.requests.clear();
  }
}

module.exports = new RateLimit();
