const fs = require('fs');
const path = require('path');
const ws3fca = require('ws3-fca');
const logger = require('../utils/logger');
const dbManager = require('./dbManager');

async function loadAppState() {
  const appStatePath = path.join(__dirname, '../appstate.json');
  try {
    const appState = JSON.parse(fs.readFileSync(appStatePath, 'utf8'));
    logger.info('Loaded AppState successfully');
    return appState;
  } catch (error) {
    logger.warn('AppState not found, please check your cookie');
    throw error;
  }
}

async function loginWithRetry(retries = 3) {
  const appState = await loadAppState();
  const options = { appState };

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const api = await ws3fca(options);
      logger.info('Logged in successfully on attempt', attempt);
      return api;
    } catch (error) {
      logger.error(`Login attempt ${attempt} failed:`, error.message);
      if (attempt === retries) {
        throw new Error('Max login attempts reached');
      }
      await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
    }
  }
}

async function checkPermissions(userId) {
  const user = await dbManager.getUser(userId);
  if (!user) {
    logger.warn(`User ${userId} not found`);
    return false;
  }
  return user.role >= 2; // 2 represents botAdmin
}

module.exports = { loadAppState, loginWithRetry, checkPermissions };
