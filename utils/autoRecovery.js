const fs = require('fs');
const path = require('path');
const logger = require('./logger');

/**
 * Handles automatic recovery and restart features
 */
class AutoRecovery {
  static errorCount = 0;
  static lastErrorTime = Date.now();
  static errorResetTimer = null;
  
  /**
   * Initialize error tracking for auto-restart on errors
   */
  static initErrorTracking() {
    const config = global.config || require('../config.json');
    const autoRestartConfig = config?.system?.autoRestart || {};
    
    // Reset error count periodically
    if (autoRestartConfig.autoRestartOnError && autoRestartConfig.errorResetInterval) {
      this.errorResetTimer = setInterval(() => {
        this.errorCount = 0;
        this.lastErrorTime = Date.now();
        logger.debug('Error counter reset for auto-restart tracking');
      }, autoRestartConfig.errorResetInterval);
    }
  }
  
  /**
   * Track errors and restart if threshold is exceeded
   * @param {Error} error - The error that occurred
   */
  static trackError(error) {
    const config = global.config || require('../config.json');
    const autoRestartConfig = config?.system?.autoRestart || {};
    
    if (!autoRestartConfig.autoRestartOnError) return;
    
    this.errorCount++;
    this.lastErrorTime = Date.now();
    
    logger.warn(`Error tracked for auto-restart (${this.errorCount}/${autoRestartConfig.maxErrorsBeforeRestart}): ${error.message}`);
    
    if (this.errorCount >= autoRestartConfig.maxErrorsBeforeRestart) {
      logger.error(`Error threshold reached (${this.errorCount} errors). Triggering auto-restart...`);
      this.initiateRestart('error-threshold', `${this.errorCount} errors triggered auto-restart`);
    }
  }
  
  /**
   * Monitor memory usage for auto-restart
   */
  static startMemoryMonitor() {
    const config = global.config || require('../config.json');
    const autoRestartConfig = config?.system?.autoRestart || {};
    
    if (!autoRestartConfig.enabled || !autoRestartConfig.memoryThreshold) return;
    
    setInterval(() => {
      const memoryUsage = process.memoryUsage();
      const usedMemoryMB = Math.round(memoryUsage.rss / 1024 / 1024);
      
      if (usedMemoryMB > autoRestartConfig.memoryThreshold) {
        logger.warn(`Memory threshold exceeded (${usedMemoryMB}MB > ${autoRestartConfig.memoryThreshold}MB). Triggering auto-restart...`);
        this.initiateRestart('memory-threshold', `Memory usage (${usedMemoryMB}MB) exceeded threshold`);
      }
    }, 60000); // Check every minute
  }
  
  /**
   * Initiate a restart sequence
   * @param {string} reason - The reason for restart
   * @param {string} details - Additional details about the restart
   */
  static initiateRestart(reason, details) {
    const config = global.config || require('../config.json');
    const autoRestartConfig = config?.system?.autoRestart || {};
    
    try {
      // Create a restart marker file
      const restartMarkerPath = path.join(process.cwd(), 'restart.marker');
      fs.writeFileSync(restartMarkerPath, JSON.stringify({
        time: Date.now(),
        reason: reason,
        details: details,
        type: autoRestartConfig.type || 'soft'
      }));
      
      // Notify admins if API is available
      if (global.api) {
        const admins = Array.isArray(config.admins) ? config.admins : [];
        if (admins.length > 0) {
          global.api.sendMessage(
            `🔄 BOT AUTO-RESTART\n\n` +
            `🔸 Reason: ${reason}\n` +
            `🔸 Details: ${details}\n\n` +
            `Bot will restart in ${autoRestartConfig.timeout || 3000}ms.`,
            admins[0]
          ).catch(err => logger.error('Failed to notify admin about restart:', err.message));
        }
      }
      
      // Perform pre-restart tasks
      if (autoRestartConfig.backupDatabase) {
        // Add database backup logic here
        logger.info('Creating database backup before restart...');
      }
      
      if (autoRestartConfig.clearCache) {
        // Clear cache if enabled
        logger.info('Clearing cache before restart...');
        if (global.cache && typeof global.cache.flush === 'function') {
          global.cache.flush();
        }
        if (global.messageCache && typeof global.messageCache.flush === 'function') {
          global.messageCache.flush();
        }
      }
      
      // Exit with restart code
      setTimeout(() => {
        process.exit(1);
      }, autoRestartConfig.timeout || 3000);
      
    } catch (error) {
      logger.error('Error during restart sequence:', error);
    }
  }
  
  /**
   * Check if the bot was restarted on purpose
   * @param {object} api - The Facebook API instance
   * @returns {Promise<void>}
   */
  static async checkRestartMarker(api) {
    const markerPath = path.join(process.cwd(), 'restart.marker');
    
    try {
      if (fs.existsSync(markerPath)) {
        const data = JSON.parse(fs.readFileSync(markerPath, 'utf8'));
        const { time, reason, details, type } = data;
        const downtime = Math.round((Date.now() - time) / 1000);
        
        logger.info(`Bot recovered after ${type} restart. Downtime: ${downtime}s, Reason: ${reason}`);
        
        // Send notification that bot is back online
        if (api && global.config?.admins?.length > 0) {
          await api.sendMessage(
            `✅ BOT RESTARTED SUCCESSFULLY\n\n` +
            `🔸 Downtime: ${downtime} seconds\n` +
            `🔸 Restart type: ${type}\n` +
            `🔸 Reason: ${reason}\n` +
            `🔸 Details: ${details || 'N/A'}\n\n` +
            `Bot is now back online and ready!`, 
            global.config.admins[0]
          ).catch(err => logger.error('Failed to send restart notification:', err.message));
        }
        
        // Remove the marker file
        fs.unlinkSync(markerPath);
      }
    } catch (error) {
      logger.error('Error handling restart recovery:', error);
    }
  }
  
  /**
   * Send startup notification to bot administrators
   * @param {object} api - The Facebook API instance
   */
  static async sendStartupNotification(api) {
    try {
      const config = global.config || require('../config.json');
      const admins = Array.isArray(config.admins) ? config.admins : [];
      
      if (admins.length > 0 && api) {
        // Get environment information
        const platform = process.env.REPLIT_SLUG ? 'Replit' : 
                         process.env.RAILWAY_STATIC_URL ? 'Railway' :
                         process.env.RENDER_EXTERNAL_URL ? 'Render' : 
                         'Unknown Platform';
        
        // Send notification to all admins
        for (const adminId of admins) {
          try {
            await api.sendMessage(
              `🤖 BOT STARTED\n\n` +
              `🔸 Platform: ${platform}\n` +
              `🔸 Time: ${new Date().toLocaleString()}\n` +
              `🔸 Node.js: ${process.version}\n\n` +
              `Bot is now online and ready!`,
              adminId
            );
          } catch (err) {
            logger.debug(`Failed to notify admin ${adminId}: ${err.message}`);
          }
        }
        
        logger.info(`Startup notifications sent to admins`);
      }
    } catch (error) {
      logger.error('Error sending startup notification:', error);
    }
  }

  /**
   * Create a restart marker for error recovery
   * @param {string} reason - Reason for restart
   * @param {string} threadID - Thread ID to notify on restart
   */
  static createErrorRestartMarker(reason, threadID) {
    try {
      const markerPath = path.join(process.cwd(), 'restart.marker');
      fs.writeFileSync(markerPath, JSON.stringify({
        time: Date.now(),
        threadID: threadID || (global.config?.admins?.[0] ? global.config.admins[0] : null),
        userID: 'SYSTEM',
        reason: reason || 'Error recovery',
        type: 'error'
      }));
      
      logger.info('Error restart marker created');
    } catch (error) {
      logger.error('Failed to create error restart marker:', error);
    }
  }

  /**
   * Schedule periodic restart if configured
   */
  static schedulePeriodicRestart() {
    const config = global.config || require('../config.json');
    const autoRestartConfig = config?.system?.autoRestart || {};
    
    if (autoRestartConfig.enabled && autoRestartConfig.interval) {
      const interval = autoRestartConfig.interval;
      logger.info(`Scheduled auto-restart every ${interval/1000/60/60} hours`);
      
      setInterval(() => {
        logger.info('Periodic auto-restart triggered');
        this.initiateRestart('scheduled', 'Periodic scheduled restart');
      }, interval);
    }
  }
}

module.exports = AutoRecovery;
