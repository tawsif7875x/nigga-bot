const logger = require('./logger');

/**
 * Central optimization utilities for memory and performance management
 */
class Optimization {
  // Queue for processing commands sequentially
  static commandQueue = [];
  static isProcessing = false;
  
  // Error tracking for auto-recovery
  static errorCount = 0;
  static lastErrorReset = Date.now();
  static memoryWarningIssued = false;
  static errorResetTimer = null;

  /**
   * Initialize error tracking system
   */
  static initErrorTracking() {
    try {
      // Reset error count on initialization
      this.errorCount = 0;
      this.lastErrorReset = Date.now();
      
      // Clear any existing timer
      if (this.errorResetTimer) {
        clearInterval(this.errorResetTimer);
      }
      
      // Get config settings
      const config = global.config || {};
      const resetInterval = config?.system?.autoRestart?.errorResetInterval || 3600000; // 1 hour default
      
      // Set up periodic error count reset
      this.errorResetTimer = setInterval(() => {
        this.resetErrors();
        logger.debug("Periodic error counter reset");
      }, resetInterval);
      
      logger.info("Error tracking system initialized");
      return true;
    } catch (error) {
      logger.error("Failed to initialize error tracking:", error.message);
      return false;
    }
  }
  
  /**
   * Initialize memory monitoring
   */
  static startMemoryMonitor() {
    try {
      // Get config settings
      const config = global.config || {};
      const checkInterval = config?.system?.performance?.memoryCheckInterval || 300000; // 5 minutes default
      
      // Start periodic memory checks
      setInterval(() => {
        this.checkMemoryUsage();
      }, checkInterval);
      
      // Perform initial check
      this.checkMemoryUsage();
      
      logger.info("Memory monitoring started");
      return true;
    } catch (error) {
      logger.error("Failed to start memory monitoring:", error.message);
      return false;
    }
  }

  /**
   * Add a command to the execution queue
   * @param {Function} handler - Command handler function
   * @param {Object} api - Facebook API
   * @param {Object} message - Message object
   */
  static queueCommand(handler, api, message) {
    this.commandQueue.push({ handler, api, message });
    if (!this.isProcessing) {
      this.processQueue();
    }
    
    // Check memory usage every 10 commands
    if (this.commandQueue.length % 10 === 0) {
      this.checkMemoryUsage();
    }
  }

  /**
   * Process the command queue sequentially
   */
  static async processQueue() {
    this.isProcessing = true;
    while (this.commandQueue.length > 0) {
      const { handler, api, message } = this.commandQueue.shift();
      try {
        await handler(api, message);
      } catch (error) {
        logger.error('Command execution error:', error);
        this.trackError();
      }
      // Add small delay between commands to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    this.isProcessing = false;
  }

  /**
   * Clear caches and force garbage collection if possible
   * @returns {Boolean} - True if GC was called, false otherwise
   */
  static clearMemory() {
    try {
      // Clear module-level caches
      if (global.cache && typeof global.cache.flush === 'function') {
        global.cache.flush();
      }
      
      if (global.messageCache && typeof global.messageCache.flush === 'function') {
        global.messageCache.flush();
      }
      
      // Clear require cache for dynamic reloading
      Object.keys(require.cache).forEach(key => {
        // Skip core modules and node_modules
        if (!key.includes('node_modules') && !key.startsWith('node:')) {
          delete require.cache[key];
        }
      });
      
      // Force garbage collection if available
      const gcSuccess = Boolean(global.gc && global.gc());
      if (gcSuccess) {
        logger.debug('Garbage collection executed');
      }
      
      // Reset error count
      this.resetErrors();
      
      return gcSuccess;
    } catch (error) {
      logger.error('Error during memory cleanup:', error);
      return false;
    }
  }

  /**
   * Check memory usage and take action if needed
   */
  static checkMemoryUsage() {
    try {
      const memUsage = process.memoryUsage();
      const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
      const rssMB = Math.round(memUsage.rss / 1024 / 1024);
      
      // Get configured memory threshold or use default
      const config = global.config || {};
      const threshold = config?.system?.autoRestart?.memoryThreshold || 500;
      
      // If we're using > 80% of our threshold, clear memory
      if (rssMB > threshold * 0.8) {
        if (!this.memoryWarningIssued) {
          logger.warn(`High memory usage detected: ${rssMB}MB RSS, ${heapUsedMB}MB heap`);
          this.memoryWarningIssued = true;
          this.clearMemory();
        }
      } else {
        this.memoryWarningIssued = false;
      }
      
      // If we've exceeded our threshold, notify for restart
      if (rssMB > threshold) {
        if (global.AutoRecovery && typeof global.AutoRecovery.initiateRestart === 'function') {
          global.AutoRecovery.initiateRestart('memory-limit', `Memory usage (${rssMB}MB) exceeded threshold (${threshold}MB)`);
        } else {
          logger.error(`Memory threshold exceeded: ${rssMB}MB > ${threshold}MB, but AutoRecovery not available`);
        }
      }
    } catch (error) {
      logger.error('Error checking memory usage:', error);
    }
  }

  /**
   * Track error occurrences and reset the counter periodically
   */
  static trackError(error) {
    this.errorCount++;
    
    // Log the error if provided
    if (error && error.message) {
      logger.error(`Error tracked: ${error.message}`);
    }
    
    // Reset error count if it's been 1 hour since last reset
    const oneHour = 60 * 60 * 1000;
    if (Date.now() - this.lastErrorReset > oneHour) {
      this.resetErrors();
    }
    
    // Log error rate
    if (this.errorCount % 5 === 0) {
      logger.warn(`Error rate: ${this.errorCount} errors since last reset`);
    }
    
    // Check if we need to restart due to errors
    const config = global.config || {};
    const maxErrors = config?.system?.autoRestart?.maxErrorsBeforeRestart || 50;
    
    if (this.errorCount >= maxErrors) {
      if (global.AutoRecovery && typeof global.AutoRecovery.initiateRestart === 'function') {
        global.AutoRecovery.initiateRestart('error-threshold', `${this.errorCount} errors triggered auto-restart`);
      }
    }
  }

  /**
   * Reset the error counter
   */
  static resetErrors() {
    this.errorCount = 0;
    this.lastErrorReset = Date.now();
  }
}

// Schedule periodic memory cleanup
setInterval(() => {
  Optimization.clearMemory();
}, 30 * 60 * 1000); // Every 30 minutes

module.exports = Optimization;
