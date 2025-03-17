# Performance Optimization Guide

Nexus Bot includes several performance optimization features designed to keep the bot running smoothly, especially in high-activity environments.

## Memory Management

### Automatic Memory Monitoring

The bot continuously monitors memory usage through the Optimization module. When memory usage approaches the configured threshold, the system will:

1. Clear unnecessary caches
2. Force garbage collection when possible
3. Restart the bot if memory usage exceeds the threshold

```javascript
// Example from utils/optimization.js
static checkMemoryUsage() {
  try {
    const memUsage = process.memoryUsage();
    const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const rssMB = Math.round(memUsage.rss / 1024 / 1024);
    
    // Get configured memory threshold
    const threshold = config?.system?.autoRestart?.memoryThreshold || 500;
    
    // If we're using > 80% of our threshold, clear memory
    if (rssMB > threshold * 0.8) {
      if (!this.memoryWarningIssued) {
        logger.warn(`High memory usage detected: ${rssMB}MB RSS, ${heapUsedMB}MB heap`);
        this.memoryWarningIssued = true;
        this.clearMemory();
      }
    }
  } catch (error) {
    logger.error('Error checking memory usage:', error);
  }
}
```

### Configuration Options

You can adjust memory management in the config.json file:

```json
"system": {
  "autoRestart": {
    "memoryThreshold": 500,  // MB before triggering restart
    "clearCache": true        // Whether to clear cache before restart
  }
}
```

## Command Queue Management

Commands are processed through a queue system to prevent overloading the API and improve reliability:

```javascript
static queueCommand(handler, api, message) {
  this.commandQueue.push({ handler, api, message });
  if (!this.isProcessing) {
    this.processQueue();
  }
}
```

This gives several advantages:
- Prevents rate limiting by Facebook's API
- Improves reliability by spacing out command execution
- Allows for better error handling of individual commands

## Error Rate Monitoring

The system tracks errors and can automatically restart if too many errors occur:

```javascript
static trackError() {
  this.errorCount++;
  
  // Reset error count if it's been 1 hour since last reset
  const oneHour = 60 * 60 * 1000;
  if (Date.now() - this.lastErrorReset > oneHour) {
    this.resetErrors();
  }
  
  // Check if we need to restart due to errors
  const maxErrors = config?.system?.autoRestart?.maxErrorsBeforeRestart || 50;
  
  if (this.errorCount >= maxErrors) {
    if (global.AutoRecovery) {
      global.AutoRecovery.initiateRestart('error-threshold', `${this.errorCount} errors triggered auto-restart`);
    }
  }
}
```

## Cache Management

The bot uses a smart caching system to reduce database load and improve response times:

```javascript
// Example from utils/cache.js
get(key) {
  return this.cache.get(key);
}

set(key, value, ttl = 3600) {
  return this.cache.set(key, value, ttl);
}

flush() {
  return this.cache.flushAll();
}
```

For optimal performance, the system:
- Caches frequently accessed data
- Automatically expires cached items
- Cleans up caches periodically
- Flushes caches when memory usage is high

## Message Handling Optimization

The message handling system is optimized to reduce API load:

- Typing indicators are rate-limited to prevent excessive API calls
- Message read receipts are batched
- Events are processed efficiently to minimize overhead

```javascript
// Rate limiting typing indicators
if (messagingConfig.typingIndicator === true) {
  const typingKey = `typing_${event.threadID}`;
  const lastTyping = global.messageCache?.get(typingKey);
  
  // Only send typing indicator every 30 seconds per thread
  if (!lastTyping || (Date.now() - lastTyping > 30000)) {
    await safeApi.sendTypingIndicator(api, event.threadID);
    global.messageCache?.set(typingKey, Date.now(), 60);
  }
}
```

## Troubleshooting Performance Issues

If you're experiencing performance problems:

1. Check the logs for memory warnings or error rate alerts
2. Adjust the memory threshold in config.json
3. Increase the error tolerance if needed
4. Disable typing indicators if API rate limiting occurs
5. Consider running the bot on a machine with more resources

You can also enable debug logs for more detailed information:

```json
"logLevel": "debug"
```
