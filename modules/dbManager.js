const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const logger = require('../utils/logger');
const { pushToGithub } = require('../utils/githubSync');
const config = require('../config.json');
const fs = require('fs');

const dbPath = path.join(__dirname, '../database/database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    logger.error('Failed to open database:', err.message);
  }
});

// Initialize database tables
db.serialize(() => {
  // Users table - store user data and preferences
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT,
    role INTEGER DEFAULT 0,
    exp INTEGER DEFAULT 0,
    money INTEGER DEFAULT 0,
    daily_streak INTEGER DEFAULT 0,
    last_daily TEXT,
    premium BOOLEAN DEFAULT 0,
    banned BOOLEAN DEFAULT 0,
    ban_reason TEXT,
    warns INTEGER DEFAULT 0,
    settings TEXT
  )`);

  // Groups table - store group configurations
  db.run(`CREATE TABLE IF NOT EXISTS groups (
    id TEXT PRIMARY KEY,
    name TEXT,
    settings TEXT,
    welcome_message TEXT,
    goodbye_message TEXT,
    rules TEXT,
    admin_only BOOLEAN DEFAULT 0,
    nsfw_allowed BOOLEAN DEFAULT 0,
    prefix TEXT,
    banned BOOLEAN DEFAULT 0,
    lang TEXT DEFAULT 'en',
    auto_reactions TEXT
  )`);

  // Economy table - store transaction history
  db.run(`CREATE TABLE IF NOT EXISTS economy (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    type TEXT,
    amount INTEGER,
    timestamp TEXT,
    description TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  // Custom commands table
  db.run(`CREATE TABLE IF NOT EXISTS custom_commands (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id TEXT,
    command TEXT,
    response TEXT,
    creator_id TEXT,
    created_at TEXT,
    FOREIGN KEY(group_id) REFERENCES groups(id)
  )`);

  // User interactions table
  db.run(`CREATE TABLE IF NOT EXISTS interactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    target_id TEXT,
    type TEXT,
    count INTEGER DEFAULT 1,
    last_time TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  // Add indexes for better performance
  db.run("CREATE INDEX IF NOT EXISTS idx_users_exp ON users(exp)");
  db.run("CREATE INDEX IF NOT EXISTS idx_users_money ON users(money)");
  db.run("CREATE INDEX IF NOT EXISTS idx_economy_user_id ON economy(user_id)");
  db.run("CREATE INDEX IF NOT EXISTS idx_interactions_user_id ON interactions(user_id)");
});

// User management functions
async function addUser(id, name, role = 0) {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT OR REPLACE INTO users (id, name, role) VALUES (?, ?, ?)',
      [id, name, role],
      (err) => {
        if (err) reject(err);
        resolve();
      }
    );
  });
}

async function updateUserExp(id, exp) {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE users SET exp = exp + ? WHERE id = ?',
      [exp, id],
      (err) => {
        if (err) reject(err);
        resolve();
      }
    );
  });
}

async function updateUserMoney(id, amount) {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE users SET money = money + ? WHERE id = ?',
      [amount, id],
      (err) => {
        if (err) reject(err);
        resolve();
      }
    );
  });
}

// Group management functions
async function addGroup(id, name, settings = {}) {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT OR REPLACE INTO groups (id, name, settings) VALUES (?, ?, ?)',
      [id, name, JSON.stringify(settings)],
      (err) => {
        if (err) reject(err);
        resolve();
      }
    );
  });
}

async function updateGroupSettings(id, settings) {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE groups SET settings = ? WHERE id = ?',
      [JSON.stringify(settings), id],
      (err) => {
        if (err) reject(err);
        resolve();
      }
    );
  });
}

// Economy functions
async function addTransaction(userId, type, amount, description) {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO economy (user_id, type, amount, timestamp, description) VALUES (?, ?, ?, datetime("now"), ?)',
      [userId, type, amount, description],
      (err) => {
        if (err) reject(err);
        resolve();
      }
    );
  });
}

// Custom command functions
async function addCustomCommand(groupId, command, response, creatorId) {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO custom_commands (group_id, command, response, creator_id, created_at) VALUES (?, ?, ?, ?, datetime("now"))',
      [groupId, command, response, creatorId],
      (err) => {
        if (err) reject(err);
        resolve();
      }
    );
  });
}

// Enhanced backup function with GitHub sync
async function backupDatabase() {
  const backupPath = path.join(__dirname, '../database/backup');
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
    if (config.github.enabled) {
      await pushToGithub(backupFile, `Database backup ${timestamp}`);
    }

    // Cleanup old backups
    const files = fs.readdirSync(backupPath)
      .filter(file => file.endsWith('.sqlite'))
      .sort()
      .reverse();

    // Keep only the specified number of backups
    const maxBackups = config.github.backupRetention || 7;
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

// Add transaction support
async function runTransaction(queries) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run("BEGIN TRANSACTION");
      try {
        queries.forEach(query => {
          db.run(query.sql, query.params);
        });
        db.run("COMMIT", resolve);
      } catch (error) {
        db.run("ROLLBACK");
        reject(error);
      }
    });
  });
}

// Add database cleanup routine
async function cleanupDatabase() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const cleanup = [
    {
      sql: "DELETE FROM economy WHERE timestamp < ?",
      params: [thirtyDaysAgo.toISOString()]
    },
    {
      sql: "VACUUM",
      params: []
    }
  ];

  await runTransaction(cleanup);
  logger.info("Database cleanup completed");
}

// Run cleanup daily
setInterval(cleanupDatabase, 24 * 60 * 60 * 1000);

// Add auto-sync interval if enabled
if (config.github.enabled && config.github.autoSync) {
  setInterval(async () => {
    try {
      await backupDatabase();
    } catch (error) {
      logger.error('Auto-sync failed:', error.message);
    }
  }, config.github.syncInterval);
}

// Export all functions
module.exports = {
  addUser,
  updateUserExp,
  updateUserMoney,
  addGroup,
  updateGroupSettings,
  addTransaction,
  addCustomCommand,
  backupDatabase,
  runTransaction,
  cleanupDatabase
};
