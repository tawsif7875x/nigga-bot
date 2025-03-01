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
    logger.error('Failed to load AppState:', error.message);
    throw error;
  }
}

async function loginWithRetry(retries = 3) {
  const appState = await loadAppState();
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Create login options
      const loginOptions = {
        appState: appState,
        logLevel: "silent",
        forceLogin: true,
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      };

      // Login and await the API object
      const api = await new Promise((resolve, reject) => {
        ws3fca(loginOptions, (err, api) => {
          if (err) return reject(err);
          resolve(api);
        });
      });

      logger.info(`Logged in successfully on attempt ${attempt}`);
      
      // Test the API connection
      const currentUserID = await api.getCurrentUserID();
      if (!currentUserID) throw new Error('Failed to get current user ID');

      return api;

    } catch (error) {
      logger.error(`Login attempt ${attempt} failed:`, error.message);
      if (attempt === retries) throw error;
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
