const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');

// Ensure the database directory exists
const dbDir = path.join(__dirname, '../database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Define database path directly - no environment variables needed
const dbPath = path.join(dbDir, 'data.db');
logger.info(`Database path: ${dbPath}`);

// Default configuration
const defaultConfig = {
    github: {
        enabled: false,
        autoSync: false,
        syncInterval: 3600000,
        backupRetention: 7
    },
    database: {
        backupPath: 'database/backup'
    }
};

// Load config from JSON file
let config = defaultConfig;
try {
    const configPath = path.join(__dirname, '../config.json');
    if (fs.existsSync(configPath)) {
        const loadedConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        config = {
            ...defaultConfig,
            ...loadedConfig,
            github: {
                ...defaultConfig.github,
                ...(loadedConfig.github || {})
            }
        };
    } else {
        logger.warn('Config file not found, using defaults');
    }
} catch (error) {
    logger.error('Error loading config:', error);
    logger.info('Using default configuration');
}

const prisma = new PrismaClient();

class DatabaseManager {
  async getUser(id) {
    try {
      return await prisma.user.findUnique({
        where: { id: String(id) }
      });
    } catch (error) {
      logger.error('Database error getting user:', error);
      throw error;
    }
  }

  async createUser(id, name) {
    try {
      return await prisma.user.upsert({
        where: { id: String(id) },
        update: {},
        create: {
          id: String(id),
          name
        }
      });
    } catch (error) {
      logger.error('Database error creating user:', error);
      throw error;
    }
  }

  async updateExp(id, amount) {
    try {
      return await prisma.user.update({
        where: { id: String(id) },
        data: {
          exp: { increment: amount }
        }
      });
    } catch (error) {
      logger.error('Database error updating exp:', error);
      throw error;
    }
  }

  async updateMoney(id, amount) {
    try {
      return await prisma.user.update({
        where: { id: String(id) },
        data: {
          money: { increment: amount }
        }
      });
    } catch (error) {
      logger.error('Database error updating money:', error);
      throw error;
    }
  }

  async createTransaction(userId, type, amount, description) {
    try {
      return await prisma.transaction.create({
        data: {
          userId: String(userId),
          type,
          amount,
          description
        }
      });
    } catch (error) {
      logger.error('Database error creating transaction:', error);
      throw error;
    }
  }

  async getGroupMembers(groupId) {
    try {
      return await prisma.groupMember.findMany({
        where: { groupId: String(groupId) },
        include: { user: true }
      });
    } catch (error) {
      logger.error('Database error getting group members:', error);
      throw error;
    }
  }

  // Database cleanup routine
  async cleanup() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    try {
      await prisma.$transaction([
        prisma.transaction.deleteMany({
          where: {
            createdAt: { lt: thirtyDaysAgo }
          }
        })
      ]);
      logger.info('Database cleanup completed');
    } catch (error) {
      logger.error('Database cleanup failed:', error);
    }
  }

  async backupDatabase() {
    const backupPath = path.join(__dirname, '../', config.database?.backupPath || 'database/backup');
    if (!fs.existsSync(backupPath)) {
      fs.mkdirSync(backupPath, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupPath, `database-${timestamp}.sqlite`);
    
    try {
      // Create local backup
      await new Promise((resolve, reject) => {
        const backup = fs.createWriteStream(backupFile);
        const source = fs.createReadStream(dbPath);
        
        source.pipe(backup);
        backup.on('finish', resolve);
        backup.on('error', reject);
      });

      logger.info(`Local backup created: ${backupFile}`);

      // Push to GitHub if enabled
      if (config.github?.enabled && config.github?.autoSync) {
        await pushToGithub(backupFile, `Database backup ${timestamp}`);
      }

      // Cleanup old backups
      const files = fs.readdirSync(backupPath)
        .filter(file => file.endsWith('.sqlite'))
        .sort()
        .reverse();

      // Keep only the specified number of backups
      const maxBackups = config.github?.backupRetention || 7;
      while (files.length > maxBackups) {
        const oldFile = files.pop();
        fs.unlinkSync(path.join(backupPath, oldFile));
        logger.info(`Deleted old backup: ${oldFile}`);
      }

    } catch (error) {
      logger.error('Backup failed:', error.message);
      throw error;
    }
  }

  async createGroup(threadID, name, settings = {}) {
    try {
      return await prisma.group.upsert({
        where: { id: String(threadID) },
        update: {},
        create: {
          id: String(threadID),
          name,
          settings: JSON.stringify(settings)
        }
      });
    } catch (error) {
      logger.error('Database error creating group:', error);
      throw error;
    }
  }

  async getGroup(threadID) {
    try {
      return await prisma.group.findUnique({
        where: { id: String(threadID) }
      });
    } catch (error) {
      logger.error('Database error getting group:', error);
      throw error;
    }
  }

  async updateGroupInfo(threadID, info) {
    try {
      const group = await this.getGroup(threadID);
      if (!group) {
        // If group doesn't exist, create it
        await this.createGroup(threadID, info.name || 'Unknown Group', info);
      } else {
        // Update existing group
        const settings = { ...JSON.parse(group.settings || '{}'), ...info };
        await prisma.group.update({
          where: { id: String(threadID) },
          data: {
            name: info.name || group.name,
            settings: JSON.stringify(settings)
          }
        });
        logger.info(`Updated group info: ${info.name} (${threadID})`);
      }
    } catch (error) {
      logger.error('Database error updating group info:', error);
      throw error;
    }
  }

  /**
   * Get user from database or create if not exists
   * @param {string} id - User ID
   * @param {string} name - User name
   * @returns {Promise<Object>} - User object
   */
  async getOrCreateUser(id, name = "Unknown User") {
    try {
      // Convert ID to string
      const userID = String(id);
      
      // Try to find existing user
      let user = await prisma.user.findUnique({
        where: { id: userID }
      });
      
      // Create if not exists
      if (!user) {
        user = await prisma.user.create({
          data: {
            id: userID,
            name: name,
            exp: 0,
            money: 0
          }
        });
        logger.info(`Created new user: ${name} (${userID})`);
      }
      
      return user;
    } catch (error) {
      logger.error('Database error in getOrCreateUser:', error);
      throw error;
    }
  }
  
  /**
   * Get thread from database or create if not exists
   * @param {string} threadID - Thread ID
   * @param {string} name - Thread name
   * @returns {Promise<Object>} - Thread object
   */
  async getOrCreateGroup(threadID, name = "Unknown Group") {
    try {
      // Convert ID to string
      const groupID = String(threadID);
      
      // Try to find existing group
      let group = await prisma.group.findUnique({
        where: { id: groupID }
      });
      
      // Create if not exists
      if (!group) {
        group = await prisma.group.create({
          data: {
            id: groupID,
            name: name,
            settings: "{}"
          }
        });
        logger.info(`Created new group: ${name} (${groupID})`);
      }
      
      return group;
    } catch (error) {
      logger.error('Database error in getOrCreateGroup:', error);
      throw error;
    }
  }

  /**
   * Count all users in database
   * @returns {Promise<number>} - Number of users
   */
  async countUsers() {
    try {
      return await prisma.user.count();
    } catch (error) {
      logger.error('Database error counting users:', error);
      return 0;
    }
  }
  
  /**
   * Count all groups in database
   * @returns {Promise<number>} - Number of groups
   */
  async countGroups() {
    try {
      return await prisma.group.count();
    } catch (error) {
      logger.error('Database error counting groups:', error);
      return 0;
    }
  }

  /**
   * Get thread prefix
   * @param {string} threadID - Thread ID
   * @returns {Promise<string|null>} - Thread prefix or null
   */
  async getThreadPrefix(threadID) {
    try {
      const result = await prisma.$queryRaw`
        SELECT prefix FROM thread_prefixes WHERE thread_id = ${String(threadID)}
      `;
      
      return result.length > 0 ? result[0].prefix : null;
    } catch (error) {
      logger.error('Database error getting thread prefix:', error);
      return null;
    }
  }
  
  /**
   * Set thread prefix
   * @param {string} threadID - Thread ID
   * @param {string} prefix - Thread prefix
   * @returns {Promise<boolean>} - Success status
   */
  async setThreadPrefix(threadID, prefix) {
    try {
      await prisma.$executeRaw`
        INSERT OR REPLACE INTO thread_prefixes (thread_id, prefix, updated_at)
        VALUES (${String(threadID)}, ${prefix}, CURRENT_TIMESTAMP)
      `;
      
      return true;
    } catch (error) {
      logger.error('Database error setting thread prefix:', error);
      return false;
    }
  }
  
  /**
   * Delete thread prefix
   * @param {string} threadID - Thread ID
   * @returns {Promise<boolean>} - Success status
   */
  async deleteThreadPrefix(threadID) {
    try {
      await prisma.$executeRaw`
        DELETE FROM thread_prefixes WHERE thread_id = ${String(threadID)}
      `;
      
      return true;
    } catch (error) {
      logger.error('Database error deleting thread prefix:', error);
      return false;
    }
  }
  
  /**
   * Get all thread prefixes
   * @returns {Promise<Map<string, string>>} - Map of thread IDs to prefixes
   */
  async getAllThreadPrefixes() {
    try {
      const prefixes = await prisma.$queryRaw`
        SELECT thread_id, prefix FROM thread_prefixes
      `;
      
      const prefixMap = new Map();
      prefixes.forEach(item => {
        prefixMap.set(item.thread_id, item.prefix);
      });
      
      return prefixMap;
    } catch (error) {
      logger.error('Database error getting all thread prefixes:', error);
      return new Map();
    }
  }
  
  /**
   * Get user role
   * @param {string} userID - User ID
   * @returns {Promise<number>} - User role (0-3)
   */
  async getUserRole(userID) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: String(userID) },
        select: { role: true }
      });
      
      return user ? user.role : 0;
    } catch (error) {
      logger.error('Database error getting user role:', error);
      return 0;
    }
  }
  
  /**
   * Set user role
   * @param {string} userID - User ID
   * @param {number} role - User role (0-3)
   * @returns {Promise<boolean>} - Success status
   */
  async setUserRole(userID, role) {
    try {
      // First check if user exists, create if not
      await this.getOrCreateUser(userID);
      
      // Update role
      await prisma.user.update({
        where: { id: String(userID) },
        data: { role }
      });
      
      return true;
    } catch (error) {
      logger.error('Database error setting user role:', error);
      return false;
    }
  }
  
  /**
   * Check if user is thread admin
   * @param {string} userID - User ID
   * @param {string} threadID - Thread ID
   * @returns {Promise<boolean>} - True if user is thread admin
   */
  async isThreadAdmin(userID, threadID) {
    try {
      const result = await prisma.$queryRaw`
        SELECT * FROM thread_admins 
        WHERE thread_id = ${String(threadID)} AND user_id = ${String(userID)}
      `;
      
      return result.length > 0;
    } catch (error) {
      logger.error('Database error checking thread admin:', error);
      return false;
    }
  }
  
  /**
   * Add thread admin
   * @param {string} userID - User ID
   * @param {string} threadID - Thread ID
   * @returns {Promise<boolean>} - Success status
   */
  async addThreadAdmin(userID, threadID) {
    try {
      await prisma.$executeRaw`
        INSERT OR REPLACE INTO thread_admins (thread_id, user_id, updated_at)
        VALUES (${String(threadID)}, ${String(userID)}, CURRENT_TIMESTAMP)
      `;
      
      return true;
    } catch (error) {
      logger.error('Database error adding thread admin:', error);
      return false;
    }
  }
  
  /**
   * Remove thread admin
   * @param {string} userID - User ID
   * @param {string} threadID - Thread ID
   * @returns {Promise<boolean>} - Success status
   */
  async removeThreadAdmin(userID, threadID) {
    try {
      await prisma.$executeRaw`
        DELETE FROM thread_admins 
        WHERE thread_id = ${String(threadID)} AND user_id = ${String(userID)}
      `;
      
      return true;
    } catch (error) {
      logger.error('Database error removing thread admin:', error);
      return false;
    }
  }
  
  /**
   * Get all thread admins
   * @param {string} threadID - Thread ID
   * @returns {Promise<string[]>} - List of admin user IDs
   */
  async getThreadAdmins(threadID) {
    try {
      const admins = await prisma.$queryRaw`
        SELECT user_id FROM thread_admins WHERE thread_id = ${String(threadID)}
      `;
      
      return admins.map(admin => admin.user_id);
    } catch (error) {
      logger.error('Database error getting thread admins:', error);
      return [];
    }
  }
  
  /**
   * Clear all thread admins
   * @param {string} threadID - Thread ID
   * @returns {Promise<boolean>} - Success status
   */
  async clearThreadAdmins(threadID) {
    try {
      await prisma.$executeRaw`
        DELETE FROM thread_admins WHERE thread_id = ${String(threadID)}
      `;
      
      return true;
    } catch (error) {
      logger.error('Database error clearing thread admins:', error);
      return false;
    }
  }
}

// Run cleanup daily
setInterval(() => {
  const dbManager = new DatabaseManager();
  dbManager.cleanup();
}, 24 * 60 * 60 * 1000);

// Add auto-sync interval if enabled
if (config.github?.enabled && config.github?.autoSync) {
  setInterval(async () => {
    try {
      const dbManager = new DatabaseManager();
      await dbManager.backupDatabase();
    } catch (error) {
      logger.error('Auto-sync failed:', error.message);
    }
  }, config.github.syncInterval || 3600000);
}

module.exports = new DatabaseManager();
