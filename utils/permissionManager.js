const fs = require('fs');
const path = require('path');
const logger = require('./logger');
const sqlite3 = require('sqlite3').verbose();

/**
 * Permission Manager - Handles user permissions and roles using SQLite
 * @param {Object} config - Bot configuration
 * @returns {Object} Permission manager methods
 */
module.exports = function(config) {
  // Database path
  const dbPath = path.join(process.cwd(), 'database', 'data.db');
  
  // Cache expiration time for thread admin status (10 minutes)
  const threadAdminCacheTime = 10 * 60 * 1000;
  
  // In-memory cache
  const userRoleCache = new Map();
  const threadAdminCache = new Map();
  
  /**
   * Get database connection
   * @returns {Promise<sqlite3.Database>}
   */
  async function getDatabase() {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(dbPath, (err) => {
        if (err) reject(err);
        else resolve(db);
      });
    });
  }
  
  /**
   * Initialize permissions from database and config
   */
  async function initialize() {
    logger.info('Initializing permission manager...');
    
    try {
      // Clear caches
      userRoleCache.clear();
      threadAdminCache.clear();
      
      // Connect to database
      const db = await getDatabase();
      
      // Load user roles from database
      const users = await new Promise((resolve, reject) => {
        db.all('SELECT id, role FROM users WHERE role > 0', (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        });
      });
      
      // Load into cache
      users.forEach(user => {
        userRoleCache.set(user.id, user.role);
      });
      
      // Set owner and admin roles from config
      if (config.owner) {
        userRoleCache.set(config.owner, 3);
        
        // Ensure owner is in database
        await new Promise((resolve, reject) => {
          db.run('INSERT OR REPLACE INTO users (id, role) VALUES (?, 3)', [config.owner], (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      }
      
      if (Array.isArray(config.admins)) {
        for (const adminId of config.admins) {
          // Only set if not already higher
          if (!userRoleCache.has(adminId) || userRoleCache.get(adminId) < 2) {
            userRoleCache.set(adminId, 2);
            
            // Ensure admin is in database
            await new Promise((resolve, reject) => {
              db.run('INSERT OR REPLACE INTO users (id, role) VALUES (?, 2)', [adminId], (err) => {
                if (err) reject(err);
                else resolve();
              });
            });
          }
        }
      }
      
      // Close database
      await new Promise(resolve => db.close(() => resolve()));
      
      logger.info(`Loaded permissions for ${userRoleCache.size} users and ${threadAdminCache.size} threads`);
      logger.info('Permission manager initialized successfully');
      return true;
    } catch (error) {
      logger.error('Error initializing permissions:', error);
      return false;
    }
  }
  
  /**
   * Get a user's role
   * @param {string} userId - User ID
   * @returns {Promise<number>} User role (0-3)
   */
  async function getUserRole(userId) {
    // Check owner first (highest priority)
    if (userId === config.owner) {
      return 3;
    }
    
    // Check cache
    if (userRoleCache.has(userId)) {
      return userRoleCache.get(userId);
    }
    
    // Check if user is in admin list
    if (Array.isArray(config.admins) && config.admins.includes(userId)) {
      userRoleCache.set(userId, 2);
      return 2;
    }
    
    try {
      // Check database
      const db = await getDatabase();
      
      const role = await new Promise((resolve, reject) => {
        db.get('SELECT role FROM users WHERE id = ?', [userId], (err, row) => {
          if (err) {
            db.close();
            reject(err);
          } else {
            db.close();
            resolve(row ? row.role : 0);
          }
        });
      });
      
      // Cache the role
      userRoleCache.set(userId, role);
      
      return role;
    } catch (error) {
      logger.error('Error getting user role:', error);
      return 0;
    }
  }
  
  /**
   * Set a user's role
   * @param {string} userId - User ID
   * @param {number} role - Role level (0-3)
   * @returns {Promise<boolean>} Success
   */
  async function setUserRole(userId, role) {
    // Validate role
    if (typeof role !== 'number' || role < 0 || role > 3) {
      return false;
    }
    
    try {
      // Update database
      const db = await getDatabase();
      
      await new Promise((resolve, reject) => {
        db.run('INSERT OR REPLACE INTO users (id, role) VALUES (?, ?)', [userId, role], function(err) {
          if (err) {
            db.close();
            reject(err);
          } else {
            db.close();
            resolve();
          }
        });
      });
      
      // Update cache
      userRoleCache.set(userId, role);
      
      return true;
    } catch (error) {
      logger.error('Error setting user role:', error);
      return false;
    }
  }
  
  /**
   * Check if a user is an admin of a thread
   * @param {Object} api - Facebook API
   * @param {string} userId - User ID
   * @param {string} threadId - Thread ID
   * @returns {Promise<boolean>} Whether the user is a thread admin
   */
  async function isThreadAdmin(api, userId, threadId) {
    try {
      // Check global roles first - bot admins and owners are thread admins everywhere
      const globalRole = await getUserRole(userId);
      if (globalRole >= 2) {
        return true;
      }
      
      // Check cached thread admin status
      if (!threadAdminCache.has(threadId)) {
        threadAdminCache.set(threadId, new Map());
      }
      
      const adminMap = threadAdminCache.get(threadId);
      
      if (adminMap.has(userId)) {
        const timestamp = adminMap.get(userId);
        
        // If cache is fresh, use it
        if (Date.now() - timestamp < threadAdminCacheTime) {
          return true;
        }
      }
      
      // Check database
      try {
        const db = await getDatabase();
        
        const isAdmin = await new Promise((resolve, reject) => {
          db.get('SELECT 1 FROM thread_admins WHERE thread_id = ? AND user_id = ?', 
            [threadId, userId], (err, row) => {
            db.close();
            if (err) reject(err);
            else resolve(Boolean(row));
          });
        });
        
        if (isAdmin) {
          // Update cache
          adminMap.set(userId, Date.now());
          return true;
        }
      } catch (dbError) {
        logger.error('Error checking thread admin in database:', dbError);
        // Continue to API check
      }
      
      // Cache miss, expired, or not in database - fetch from API
      const threadInfo = await new Promise((resolve, reject) => {
        api.getThreadInfo(threadId, (err, info) => {
          if (err) reject(err);
          else resolve(info);
        });
      });
      
      // Process all admins in the thread and cache them
      let isAdmin = false;
      
      if (threadInfo && Array.isArray(threadInfo.adminIDs)) {
        // Clear expired admins for this thread
        adminMap.clear();
        
        // Update database with all admins
        const db = await getDatabase();
        
        // Begin transaction
        await new Promise((resolve, reject) => {
          db.run('BEGIN TRANSACTION', (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
        
        try {
          // Clear existing admins
          await new Promise((resolve, reject) => {
            db.run('DELETE FROM thread_admins WHERE thread_id = ?', [threadId], (err) => {
              if (err) reject(err);
              else resolve();
            });
          });
          
          // Insert statement
          const stmt = db.prepare('INSERT INTO thread_admins (thread_id, user_id) VALUES (?, ?)');
          
          // Process admins
          for (const admin of threadInfo.adminIDs) {
            // Check if this is our target user
            if (admin.id === userId) {
              isAdmin = true;
            }
            
            // Add to database
            await new Promise((resolve, reject) => {
              stmt.run(threadId, admin.id, (err) => {
                if (err) reject(err);
                else resolve();
              });
            });
            
            // Cache admin status with timestamp
            adminMap.set(admin.id, Date.now());
          }
          
          // Finalize statement
          await new Promise((resolve, reject) => {
            stmt.finalize((err) => {
              if (err) reject(err);
              else resolve();
            });
          });
          
          // Commit transaction
          await new Promise((resolve, reject) => {
            db.run('COMMIT', (err) => {
              if (err) reject(err);
              else resolve();
            });
          });
        } catch (error) {
          // Rollback on error
          await new Promise((resolve, reject) => {
            db.run('ROLLBACK', (err) => {
              if (err) reject(err);
              else resolve();
            });
          });
          logger.error('Error updating thread admins:', error);
        } finally {
          // Close database
          await new Promise((resolve, reject) => {
            db.close((err) => {
              if (err) reject(err);
              else resolve();
            });
          });
        }
      }
      
      return isAdmin;
    } catch (error) {
      logger.error(`Error checking thread admin status: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Refresh thread admin cache for a specific thread
   * @param {Object} api - Facebook API
   * @param {string} threadId - Thread ID
   * @returns {Promise<boolean>} Success
   */
  async function refreshThreadAdmins(api, threadId) {
    try {
      const threadInfo = await new Promise((resolve, reject) => {
        api.getThreadInfo(threadId, (err, info) => {
          if (err) reject(err);
          else resolve(info);
        });
      });
      
      // Clear cache for this thread
      if (!threadAdminCache.has(threadId)) {
        threadAdminCache.set(threadId, new Map());
      }
      
      const adminMap = threadAdminCache.get(threadId);
      adminMap.clear();
      
      if (!threadInfo || !Array.isArray(threadInfo.adminIDs)) {
        return false;
      }
      
      // Update database
      const db = await getDatabase();
      
      // Begin transaction
      await new Promise(resolve => db.run('BEGIN TRANSACTION', resolve));
      
      try {
        // Clear existing admins
        await new Promise((resolve, reject) => {
          db.run('DELETE FROM thread_admins WHERE thread_id = ?', [threadId], err => {
            if (err) reject(err);
            else resolve();
          });
        });
        
        // Insert statement
        const stmt = db.prepare('INSERT INTO thread_admins (thread_id, user_id) VALUES (?, ?)');
        
        // Process admins
        for (const admin of threadInfo.adminIDs) {
          // Add to database
          await new Promise((resolve, reject) => {
            stmt.run(threadId, admin.id, err => {
              if (err) reject(err);
              else resolve();
            });
          });
          
          // Cache admin status with timestamp
          adminMap.set(admin.id, Date.now());
        }
        
        // Commit transaction
        await new Promise(resolve => db.run('COMMIT', resolve));
        stmt.finalize();
      } catch (error) {
        // Rollback on error
        await new Promise(resolve => db.run('ROLLBACK', resolve));
        logger.error('Error updating thread admins:', error);
        return false;
      } finally {
        // Close database
        await new Promise(resolve => db.close(resolve));
      }
      
      logger.info(`Refreshed admin cache for thread ${threadId}: ${adminMap.size} admins`);
      return true;
    } catch (error) {
      logger.error(`Error refreshing thread admins: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Get all thread admins for a specific thread
   * @param {Object} api - Facebook API
   * @param {string} threadId - Thread ID
   * @returns {Promise<Array>} List of admin user IDs
   */
  async function getThreadAdmins(api, threadId) {
    try {
      // Try refreshing from API first
      await refreshThreadAdmins(api, threadId);
      
      // Get from database
      const db = await getDatabase();
      
      const admins = await new Promise((resolve, reject) => {
        db.all('SELECT user_id FROM thread_admins WHERE thread_id = ?', [threadId], (err, rows) => {
          db.close();
          if (err) reject(err);
          else resolve(rows.map(row => row.user_id));
        });
      });
      
      return admins;
    } catch (error) {
      logger.error(`Error getting thread admins: ${error.message}`);
      return [];
    }
  }
  
  /**
   * Clear all caches
   */
  function clearCache() {
    userRoleCache.clear();
    threadAdminCache.clear();
  }
  
  return {
    initialize,
    getUserRole,
    setUserRole,
    isThreadAdmin,
    refreshThreadAdmins,
    getThreadAdmins,
    clearCache
  };
};
