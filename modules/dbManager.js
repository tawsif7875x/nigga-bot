const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const logger = require('../utils/logger');
const { pushToGithub } = require('../utils/githubSync');
const config = require('../config.json');
const fs = require('fs');

const dbPath = path.join(__dirname, '../database/database.sqlite');

// Ensure database directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    logger.error('Failed to open database:', err.message);
  }
});

// Initialize database tables
db.serialize(() => {
  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT,
    exp INTEGER DEFAULT 0,
    money INTEGER DEFAULT 0,
    daily_streak INTEGER DEFAULT 0,
    last_daily DATETIME,
    role INTEGER DEFAULT 0,
    banned BOOLEAN DEFAULT 0,
    ban_reason TEXT,
    warns INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Groups table
  db.run(`CREATE TABLE IF NOT EXISTS groups (
    id TEXT PRIMARY KEY,
    name TEXT,
    settings TEXT,
    welcome_message TEXT,
    rules TEXT,
    banned BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Transactions table
  db.run(`CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    type TEXT,
    amount INTEGER,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);
});

// User functions
async function getUser(id) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

async function createUser(id, name) {
  return new Promise(async (resolve, reject) => {
    try {
      // First check if user exists
      const existingUser = await getUser(id);
      if (existingUser) {
        resolve(existingUser);
        return;
      }

      // If user doesn't exist, create new
      await db.run(
        'INSERT INTO users (id, name) VALUES (?, ?)',
        [id, name]
      );
      logger.info(`📝 New user added: ${name}`);
      resolve({ id, name });
    } catch (error) {
      reject(error);
    }
  });
}

async function updateExp(id, amount) {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE users SET exp = exp + ? WHERE id = ?',
      [amount, id],
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

async function updateMoney(id, amount) {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE users SET money = money + ? WHERE id = ?',
      [amount, id],
      (err) => {
        if (err) reject(err);
        else resolve();
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

// Group functions
async function createGroup(threadID, name, settings = {}) {
  return new Promise(async (resolve, reject) => {
    try {
      // Check if group exists
      const existingGroup = await getGroup(threadID);
      if (existingGroup) {
        resolve(existingGroup);
        return;
      }

      // If group doesn't exist, create new
      await db.run(
        'INSERT INTO groups (id, name, settings) VALUES (?, ?, ?)',
        [threadID, name, JSON.stringify(settings)]
      );
      logger.info(`📝 New group added: ${name}`);
      resolve({ id: threadID, name, settings });
    } catch (error) {
      reject(error);
    }
  });
}

async function getGroup(threadID) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM groups WHERE id = ?', [threadID], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

async function updateGroupInfo(threadID, info) {
  return new Promise(async (resolve, reject) => {
    try {
      const group = await getGroup(threadID);
      if (!group) {
        // If group doesn't exist, create it
        await createGroup(threadID, info.name || 'Unknown Group', info);
      } else {
        // Update existing group
        const settings = { ...JSON.parse(group.settings || '{}'), ...info };
        await db.run(
          'UPDATE groups SET name = ?, settings = ? WHERE id = ?',
          [info.name || group.name, JSON.stringify(settings), threadID]
        );
        logger.info(`Updated group info: ${info.name} (${threadID})`);
      }
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

// Export all functions
module.exports = {
  db,
  getUser,
  createUser,
  updateExp,
  updateMoney,
  backupDatabase,
  runTransaction,
  cleanupDatabase,
  createGroup,
  getGroup,
  updateGroupInfo
};
