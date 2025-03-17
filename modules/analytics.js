const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const logger = require('../utils/logger');

const analyticsDb = new sqlite3.Database(
  path.join(__dirname, '../database/analytics.sqlite')
);

// Initialize analytics tables
analyticsDb.serialize(() => {
  // Command usage analytics
  analyticsDb.run(`CREATE TABLE IF NOT EXISTS command_usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    command TEXT,
    user_id TEXT,
    thread_id TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    execution_time INTEGER,
    success BOOLEAN
  )`);

  // User activity analytics
  analyticsDb.run(`CREATE TABLE IF NOT EXISTS user_activity (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    thread_id TEXT,
    activity_type TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    details TEXT
  )`);

  // Error tracking
  analyticsDb.run(`CREATE TABLE IF NOT EXISTS error_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    error_type TEXT,
    error_message TEXT,
    stack_trace TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    additional_data TEXT
  )`);
});

class Analytics {
  static async logCommand(command, userId, threadId, executionTime, success) {
    return new Promise((resolve, reject) => {
      analyticsDb.run(
        `INSERT INTO command_usage (command, user_id, thread_id, execution_time, success) 
         VALUES (?, ?, ?, ?, ?)`,

        [command, userId, threadId, executionTime, success ? 1 : 0],
        (err) => err ? reject(err) : resolve()
      );
    });
  }

  static async logUserActivity(userId, threadId, activityType, details = {}) {
    return new Promise((resolve, reject) => {
      analyticsDb.run(
        `INSERT INTO user_activity (user_id, thread_id, activity_type, details) 
         VALUES (?, ?, ?, ?)`,

        [userId, threadId, activityType, JSON.stringify(details)],
        (err) => err ? reject(err) : resolve()
      );
    });
  }

  static async logError(errorType, errorMessage, stackTrace, additionalData = {}) {
    return new Promise((resolve, reject) => {
      analyticsDb.run(
        `INSERT INTO error_logs (error_type, error_message, stack_trace, additional_data) 
         VALUES (?, ?, ?, ?)`,

        [errorType, errorMessage, stackTrace, JSON.stringify(additionalData)],
        (err) => err ? reject(err) : resolve()
      );
    });
  }

  static async getCommandStats(timeRange = '24h') {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT command, COUNT(*) as usage_count, 
               AVG(execution_time) as avg_execution_time,
               SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as success_count
        FROM command_usage
        WHERE timestamp >= datetime('now', '-${timeRange}')
        GROUP BY command
        ORDER BY usage_count DESC`;

      analyticsDb.all(query, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  static async getUserActivityStats(userId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT activity_type, COUNT(*) as count,
               MAX(timestamp) as last_activity
        FROM user_activity
        WHERE user_id = ?
        GROUP BY activity_type`;

      analyticsDb.all(query, [userId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  static async getPerformanceStats(timeRange = '24h') {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          strftime('%Y-%m-%d %H:00:00', timestamp) as hour,
          AVG(execution_time) as avg_response_time,
          COUNT(*) as request_count
        FROM command_usage
        WHERE timestamp >= datetime('now', '-${timeRange}')
        GROUP BY hour
        ORDER BY hour DESC`;

      analyticsDb.all(query, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  static async getErrorStats(timeRange = '24h') {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          error_type,
          COUNT(*) as count,
          MAX(timestamp) as last_occurrence
        FROM error_logs
        WHERE timestamp >= datetime('now', '-${timeRange}')
        GROUP BY error_type
        ORDER BY count DESC`;

      analyticsDb.all(query, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  static async getDailyStats() {
    const today = new Date().toISOString().split('T')[0];
    
    return new Promise((resolve, reject) => {
      const query = `
        SELECT
          COUNT(DISTINCT user_id) as unique_users,
          COUNT(*) as total_commands,
          AVG(execution_time) as avg_response_time
        FROM command_usage
        WHERE date(timestamp) = date('${today}')`;

      analyticsDb.get(query, [], (err, stats) => {
        if (err) reject(err);
        else resolve(stats);
      });
    });
  }
}

module.exports = Analytics;
