const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Create logs directory if it doesn't exist
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.printf(info => {
    // Special handling for error objects
    if (info.message instanceof Error) {
      return `${info.timestamp} ${info.level}: ${info.message.stack || info.message.message}`;
    }
    
    // Handle array of values or objects
    if (Array.isArray(info.message) || typeof info.message === 'object') {
      return `${info.timestamp} ${info.level}: ${JSON.stringify(info.message)}`;
    }
    
    return `${info.timestamp} ${info.level}: ${info.message}`;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    // Console output
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({
          format: 'HH:mm:ss'
        }),
        winston.format.printf(info => `[${info.timestamp}${info.level}: ${info.message}`)
      )
    }),
    
    // Info log file
    new winston.transports.File({ 
      filename: path.join(logDir, 'info.log'),
      level: 'info' 
    }),
    
    // Error log file with special formatting for errors
    new winston.transports.File({ 
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.json()
      )
    }),
    
    // Debug log file
    new winston.transports.File({ 
      filename: path.join(logDir, 'debug.log'),
      level: 'debug' 
    })
  ]
});

// Enhance error logging to ensure it's visible in console
const originalError = logger.error;
logger.error = function(...args) {
  // Call the original error method
  originalError.apply(this, args);
  
  // Mirror to console with [ERROR] prefix
  console.error(`[ERROR]`, ...args);
};

module.exports = logger;
