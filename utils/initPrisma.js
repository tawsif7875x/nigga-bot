const logger = require('./logger');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Initialize Prisma database without relying on .env file
 */
async function initPrisma() {
  try {
    logger.info('Initializing Prisma database...');
    
    // Create database directory if not exists
    const dbDir = path.join(__dirname, '../database');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    // Run prisma generate with direct database path
    execSync('npx prisma generate', {
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '..')
    });

    logger.info('Prisma client generated successfully!');
    return true;
  } catch (error) {
    logger.error('Failed to initialize Prisma database:', error);
    return false;
  }
}

module.exports = { initPrisma };
