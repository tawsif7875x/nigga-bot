const fs = require('fs');
const path = require('path');
const gradient = require('gradient-string');

const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

function log(level, message) {
  const logMessage = `[${level}] ${message}`;
  console.log(gradient.rainbow('[Nexus]'), logMessage);
  
  // Only log to file if it's not a routine message
  if (!message.includes('Loaded AppState') && !message.includes('attempting to log in')) {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(
      path.join(logDir, `${level.toLowerCase()}.log`),
      `[${timestamp}] ${logMessage}\n`
    );
  }
}

module.exports = {
  info: message => log('INFO', message),
  warn: message => log('WARN', message),
  error: message => log('ERROR', message)
};
