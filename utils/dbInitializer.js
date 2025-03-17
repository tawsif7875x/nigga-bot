const fs = require('fs');
const path = require('path');
const logger = require('./logger');
const sqlite3 = require('sqlite3').verbose();
const { syncDatabaseBackup } = require('./githubSync');

class DatabaseInitializer {
  /**
   * Initialize the database
   */
  static async initialize() {
    try {
      // Ensure database directory exists
      const dbDir = path.join(process.cwd(), 'database');
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }
      
      // Database path
      const dbPath = path.join(dbDir, 'data.db');
      
      // Connect to database
      const db = await this.openDatabase(dbPath);
      
      // Initialize tables
      await this.initializeUsers(db);
      await this.initializeGroups(db);
      await this.initializeThreadPrefixes(db);
      await this.initializePermissions(db);
      await this.initializeCustomKeywords(db);
      
      // Close database connection
      await this.closeDatabase(db);
      
      logger.info('Database initialized successfully');
      return true;
    } catch (error) {
      logger.error('Error initializing database:', error.message);
      throw error;
    }
  }
  
  /**
   * Open database connection
   * @param {string} dbPath - Path to database
   * @returns {Promise<sqlite3.Database>} - Database connection
   */
  static async openDatabase(dbPath) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          logger.error('Error opening database:', err.message);
          reject(err);
        } else {
          logger.info(`Connected to SQLite database at ${dbPath}`);
          resolve(db);
        }
      });
    });
  }
  
  /**
   * Close database connection
   * @param {sqlite3.Database} db - Database connection
   * @returns {Promise<void>}
   */
  static async closeDatabase(db) {
    return new Promise((resolve, reject) => {
      db.close((err) => {
        if (err) {
          logger.error('Error closing database:', err.message);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
  
  /**
   * Initialize users table
   * @param {sqlite3.Database} db - Database connection
   * @returns {Promise<void>}
   */
  static async initializeUsers(db) {
    return new Promise((resolve, reject) => {
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT,
        exp INTEGER DEFAULT 0,
        money INTEGER DEFAULT 0,
        role INTEGER DEFAULT 0,
        banned INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`, (err) => {
        if (err) {
          logger.error('Error creating users table:', err.message);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
  
  /**
   * Initialize groups table
   * @param {sqlite3.Database} db - Database connection
   * @returns {Promise<void>}
   */
  static async initializeGroups(db) {
    return new Promise((resolve, reject) => {
      db.run(`CREATE TABLE IF NOT EXISTS groups (
        id TEXT PRIMARY KEY,
        name TEXT,
        settings TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`, (err) => {
        if (err) {
          logger.error('Error creating groups table:', err.message);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
  
  /**
   * Initialize thread_prefixes table
   * @param {sqlite3.Database} db - Database connection
   * @returns {Promise<void>}
   */
  static async initializeThreadPrefixes(db) {
    return new Promise((resolve, reject) => {
      db.run(`CREATE TABLE IF NOT EXISTS thread_prefixes (
        thread_id TEXT PRIMARY KEY,
        prefix TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`, (err) => {
        if (err) {
          logger.error('Error creating thread_prefixes table:', err.message);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
  
  /**
   * Initialize permissions tables
   * @param {sqlite3.Database} db - Database connection
   * @returns {Promise<void>}
   */
  static async initializePermissions(db) {
    try {
      // Create thread admins table
      await new Promise((resolve, reject) => {
        db.run(`CREATE TABLE IF NOT EXISTS thread_admins (
          thread_id TEXT,
          user_id TEXT,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (thread_id, user_id)
        )`, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      
      // Create user roles table if it doesn't exist in users table
      await new Promise((resolve, reject) => {
        db.run(`CREATE TABLE IF NOT EXISTS user_roles (
          user_id TEXT PRIMARY KEY,
          role INTEGER DEFAULT 0,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      
      logger.info('Permissions tables initialized');
      return true;
    } catch (error) {
      logger.error('Error creating permissions tables:', error.message);
      throw error;
    }
  }
  
  /**
   * Initialize custom keywords table
   * @param {sqlite3.Database} db - Database connection
   * @returns {Promise<void>}
   */
  static async initializeCustomKeywords(db) {
    return new Promise((resolve, reject) => {
      db.run(`CREATE TABLE IF NOT EXISTS keywords (
        id TEXT PRIMARY KEY,
        trigger_word TEXT NOT NULL,
        response TEXT NOT NULL,
        created_by TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`, (err) => {
        if (err) {
          logger.error('Error creating keywords table:', err.message);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
  
  /**
   * Migrate data from JSON files to database
   * @returns {Promise<void>}
   */
  static async migrateDataFromFiles() {
    try {
      const dbPath = path.join(process.cwd(), 'database', 'data.db');
      const db = await this.openDatabase(dbPath);
      
      // Check if migration is needed
      const needsMigration = await this.checkIfMigrationNeeded();
      
      if (needsMigration) {
        // Migrate prefixes
        await this.migratePrefixesFromFile(db);
        
        // Migrate permissions
        await this.migratePermissionsFromFile(db);
        
        // Migrate keywords
        await this.migrateKeywordsFromFile(db);
      } else {
        logger.info('No migration needed - using database');
      }
      
      // Close database
      await this.closeDatabase(db);
      
      return true;
    } catch (error) {
      logger.error('Error during migration:', error.message);
      return false;
    }
  }
  
  /**
   * Check if migration is needed by looking for JSON files
   * @returns {Promise<boolean>} True if migration is needed
   */
  static async checkIfMigrationNeeded() {
    const prefixPath = path.join(process.cwd(), 'database', 'prefixes.json');
    const permissionsPath = path.join(process.cwd(), 'database', 'permissions.json');
    const keywordsPath = path.join(process.cwd(), 'database', 'keywords.json');
    
    return fs.existsSync(prefixPath) || 
           fs.existsSync(permissionsPath) || 
           fs.existsSync(keywordsPath);
  }
  
  /**
   * Migrate prefixes from JSON file to database
   * @param {sqlite3.Database} db - Database connection
   * @returns {Promise<void>}
   */
  static async migratePrefixesFromFile(db) {
    const prefixPath = path.join(process.cwd(), 'database', 'prefixes.json');
    
    if (!fs.existsSync(prefixPath)) {
      return; // No file to migrate
    }
    
    try {
      // Read file
      const prefixData = JSON.parse(fs.readFileSync(prefixPath, 'utf8'));
      
      // Begin transaction
      await new Promise(resolve => db.run('BEGIN TRANSACTION', resolve));
      
      try {
        // Prepare statement
        const stmt = db.prepare('INSERT OR REPLACE INTO thread_prefixes (thread_id, prefix) VALUES (?, ?)');
        
        // Insert prefixes
        let count = 0;
        Object.entries(prefixData).forEach(([threadId, prefix]) => {
          stmt.run(threadId, prefix);
          count++;
        });
        
        stmt.finalize();
        
        // Commit transaction
        await new Promise(resolve => db.run('COMMIT', resolve));
        
        logger.info(`Migrated ${count} thread prefixes to database`);
        
        // Rename original file as backup
        fs.renameSync(prefixPath, `${prefixPath}.bak`);
      } catch (error) {
        // Rollback on error
        await new Promise(resolve => db.run('ROLLBACK', resolve));
        throw error;
      }
    } catch (error) {
      logger.error('Error migrating prefixes:', error.message);
    }
  }
  
  /**
   * Migrate permissions from JSON file to database
   * @param {sqlite3.Database} db - Database connection
   * @returns {Promise<void>}
   */
  static async migratePermissionsFromFile(db) {
    const permissionsPath = path.join(process.cwd(), 'database', 'permissions.json');
    
    if (!fs.existsSync(permissionsPath)) {
      return; // No file to migrate
    }
    
    try {
      // Read file
      const permissionsData = JSON.parse(fs.readFileSync(permissionsPath, 'utf8'));
      
      // Begin transaction
      await new Promise(resolve => db.run('BEGIN TRANSACTION', resolve));
      
      try {
        // Prepare statements
        const userStmt = db.prepare('INSERT OR IGNORE INTO users (id, role) VALUES (?, ?)');
        const adminStmt = db.prepare('INSERT OR REPLACE INTO thread_admins (thread_id, user_id) VALUES (?, ?)');
        
        // Insert user roles
        let userCount = 0;
        if (permissionsData.users) {
          Object.entries(permissionsData.users).forEach(([userId, role]) => {
            userStmt.run(userId, role);
            userCount++;
          });
        }
        
        // Insert thread admins
        let adminCount = 0;
        if (permissionsData.threadAdmins) {
          Object.entries(permissionsData.threadAdmins).forEach(([threadId, admins]) => {
            Object.keys(admins).forEach(userId => {
              adminStmt.run(threadId, userId);
              adminCount++;
            });
          });
        }
        
        userStmt.finalize();
        adminStmt.finalize();
        
        // Commit transaction
        await new Promise(resolve => db.run('COMMIT', resolve));
        
        logger.info(`Migrated ${userCount} user roles and ${adminCount} thread admins to database`);
        
        // Rename original file as backup
        fs.renameSync(permissionsPath, `${permissionsPath}.bak`);
      } catch (error) {
        // Rollback on error
        await new Promise(resolve => db.run('ROLLBACK', resolve));
        throw error;
      }
    } catch (error) {
      logger.error('Error migrating permissions:', error.message);
    }
  }
  
  /**
   * Migrate keywords from JSON file to database
   * @param {sqlite3.Database} db - Database connection
   * @returns {Promise<void>}
   */
  static async migrateKeywordsFromFile(db) {
    const keywordsPath = path.join(process.cwd(), 'database', 'keywords.json');
    
    if (!fs.existsSync(keywordsPath)) {
      return; // No file to migrate
    }
    
    try {
      // Read file
      const keywordsData = JSON.parse(fs.readFileSync(keywordsPath, 'utf8'));
      
      // Begin transaction
      await new Promise(resolve => db.run('BEGIN TRANSACTION', resolve));
      
      try {
        // Prepare statement
        const stmt = db.prepare('INSERT OR REPLACE INTO keywords (id, trigger_word, response) VALUES (?, ?, ?)');
        
        // Insert keywords
        let count = 0;
        Object.entries(keywordsData).forEach(([id, keyword]) => {
          if (keyword.triggers && keyword.triggers.length > 0 && keyword.response) {
            // Use the first trigger as primary trigger_word
            stmt.run(id, keyword.triggers[0], keyword.response);
            count++;
          }
        });
        
        stmt.finalize();
        
        // Commit transaction
        await new Promise(resolve => db.run('COMMIT', resolve));
        
        logger.info(`Migrated ${count} keywords to database`);
        
        // Rename original file as backup
        fs.renameSync(keywordsPath, `${keywordsPath}.bak`);
      } catch (error) {
        // Rollback on error
        await new Promise(resolve => db.run('ROLLBACK', resolve));
        throw error;
      }
    } catch (error) {
      logger.error('Error migrating keywords:', error.message);
    }
  }
}

async function backupDatabase() {
  try {
    const backupPath = path.join(__dirname, '../database/backup.db');
    // ...existing backup code...
    
    // Sync to GitHub if enabled
    if (global.config?.github?.enabled) {
      await syncDatabaseBackup(backupPath);
    }
  } catch (error) {
    logger.error('Database backup failed:', error);
  }
}

module.exports = DatabaseInitializer;
