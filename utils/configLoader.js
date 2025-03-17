const fs = require('fs');
const path = require('path');
const logger = require('./logger');

/**
 * Configuration loader and manager to handle default values
 * and prevent redundancy across the application
 */
class ConfigLoader {
  constructor() {
    this.config = this.getDefaultConfig();
    this.configPath = path.join(process.cwd(), 'config.json');
    this.loaded = false;
  }

  /**
   * Get default configuration values
   * @returns {Object} Default configuration
   */
  getDefaultConfig() {
    return {
      // Basic bot settings
      name: "NexusBot",
      version: "1.0.0",
      prefix: "!",
      language: "en",
      timezone: "UTC",
      logLevel: "info",
      admins: [],
      
      // Permission structure
      permissions: {
        owner: null,
        superAdmins: []
      },
      
      // System settings
      system: {
        autoRestart: {
          enabled: true,
          memoryThreshold: 500,
          interval: 21600000, // 6 hours
          type: "soft",
          refreshConnection: true,
          reloadPermissions: true,
          clearCache: true,
          backupDatabase: false,
          timeout: 3000,
          autoRestartOnError: true,
          maxErrorsBeforeRestart: 20,
          errorResetInterval: 3600000 // 1 hour
        },
        performance: {
          cacheEnabled: true,
          cacheTimeout: 300000, // 5 minutes
          maxConcurrentCommands: 5,
          maxCacheSize: 100,
          cleanupInterval: 3600000, // 1 hour
          commandDelay: {
            min: 500, 
            max: 2000
          }
        }
      },
      
      // Bot behavior
      behavior: {
        typing: {
          enabled: false, // Disabled by default to prevent API issues
          minSpeed: 50,
          maxSpeed: 100
        },
        activeHours: {
          start: 0, // 24-hour format
          end: 24  // 24-hour format
        },
        messageHandling: {
          enabled: true,
          autoRead: true,
          typingIndicator: false, // Disabled by default
          seenIndicator: true,
          delay: {
            min: 500,
            max: 2000
          },
          messageRateLimit: {
            enabled: true,
            windowMs: 60000,
            maxMessages: 10
          }
        },
        adminNotifications: true
      },
      
      // Safety features
      safety: {
        enabled: true,
        maxDailyMessages: 1000,
        rateLimit: {
          enabled: true,
          windowMs: 60000,
          max: 10
        },
        moderation: {
          enabled: true,
          maxWarns: 3,
          bannedWords: [],
          spamProtection: true
        }
      },
      
      // Database settings
      database: {
        backup: {
          enabled: true,
          interval: 3600000, // 1 hour
          retention: 7
        },
        backupPath: "database/backup",
        path: "database/data.db"
      },
      
      // GitHub integration
      github: {
        enabled: false,
        owner: "",
        repo: "",
        branch: "main",
        token: "",
        autoSync: false
      }
    };
  }

  /**
   * Load configuration from file and merge with defaults
   * @returns {Object} Loaded configuration
   */
  load() {
    try {
      if (fs.existsSync(this.configPath)) {
        const userConfig = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
        this.config = this.deepMerge(this.config, userConfig);
        logger.info('Configuration loaded successfully');
      } else {
        logger.warn('Config file not found, using defaults');
        // Create default config file
        this.save();
      }
      this.loaded = true;
      return this.config;
    } catch (error) {
      logger.error('Error loading configuration:', error);
      return this.config;
    }
  }

  /**
   * Save current configuration to file
   * @returns {Boolean} Success status
   */
  save() {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
      logger.info('Configuration saved');
      return true;
    } catch (error) {
      logger.error('Error saving configuration:', error);
      return false;
    }
  }

  /**
   * Update configuration values
   * @param {Object} newValues - New configuration values 
   * @param {Boolean} saveToFile - Whether to save to file
   * @returns {Object} Updated configuration
   */
  update(newValues, saveToFile = true) {
    try {
      this.config = this.deepMerge(this.config, newValues);
      if (saveToFile) {
        this.save();
      }
      return this.config;
    } catch (error) {
      logger.error('Error updating configuration:', error);
      return this.config;
    }
  }

  /**
   * Deep merge two objects
   * @param {Object} target - Target object 
   * @param {Object} source - Source object
   * @returns {Object} Merged object
   */
  deepMerge(target, source) {
    if (!source) return target;
    
    const output = { ...target };
    
    // Handle simple source (primitives)
    if (source === null || typeof source !== 'object') {
      return source;
    }

    // Handle Date objects
    if (source instanceof Date) {
      return new Date(source.getTime());
    }

    // Handle Arrays
    if (Array.isArray(source)) {
      return [...source];
    }

    Object.keys(source).forEach(key => {
      if (source[key] === undefined) return;

      // If property exists and both are objects, merge
      if (key in target && typeof target[key] === 'object' && 
          typeof source[key] === 'object' && !Array.isArray(source[key]) &&
          source[key] !== null) {
        output[key] = this.deepMerge(target[key], source[key]);
      } else {
        output[key] = source[key];
      }
    });

    return output;
  }

  /**
   * Get a specific config value with path support (e.g., "system.performance.cacheEnabled")
   * @param {String} path - Configuration path 
   * @param {*} defaultValue - Default value if path not found
   * @returns {*} Configuration value
   */
  get(path, defaultValue = undefined) {
    if (!path) return this.config;
    
    const parts = path.split('.');
    let current = this.config;
    
    for (const part of parts) {
      if (!current || typeof current !== 'object') {
        return defaultValue;
      }
      current = current[part];
      if (current === undefined) {
        return defaultValue;
      }
    }
    
    return current;
  }
}

// Create a singleton instance
const configLoader = new ConfigLoader();

module.exports = configLoader;
