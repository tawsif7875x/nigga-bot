const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');
const { applyFixes } = require('../utils/apiFixes');

// Fallback retries
const MAX_LOGIN_ATTEMPTS = 3;
const RETRY_DELAY = 5000;

/**
 * Login to Facebook using environment variables or config
 */
async function login() {
  try {
    // Load appstate
    const appstatePath = path.join(process.cwd(), 'appstate.json');

    if (!fs.existsSync(appstatePath)) {
      throw new Error("Appstate file not found. Please create an appstate.json file.");
    }

    const appstate = JSON.parse(fs.readFileSync(appstatePath, 'utf8'));
    logger.info('Loaded AppState successfully');
    
    // Load the ws3-fca module
    const ws3fca = require('ws3-fca');
    
    // Login with the original login function first
    const api = await new Promise((resolve, reject) => {
      ws3fca({
        appState: appstate,
        logLevel: "silent", // Don't spam the console
        selfListen: true,
        listenEvents: true,
        forceLogin: true
      }, (err, api) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(api);
      });
    });
    
    // Apply our fixes to the API object
    const fixedApi = applyFixes(api);
    
    logger.info('Facebook login successful');
    return fixedApi;
  } catch (error) {
    logger.error('Facebook login failed:', error.message || error);
    throw error;
  }
}

/**
 * Login with retry mechanism
 */
async function loginWithRetry() {
  let attempts = 0;

  while (attempts < MAX_LOGIN_ATTEMPTS) {
    try {
      return await login();
    } catch (error) {
      attempts++;

      if (attempts >= MAX_LOGIN_ATTEMPTS) {
        logger.error(`Failed to login after ${MAX_LOGIN_ATTEMPTS} attempts`);
        throw error;
      }
      
      logger.warn(`Login attempt ${attempts} failed. Retrying in ${RETRY_DELAY/1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    }
  }
}

/**
 * Refresh Facebook connection without full relogin
 * @param {Object} api - Current API instance
 */
async function refreshConnection(api) {
  try {
    // Ping Facebook to check if the connection is still active
    await api.getAppState();
    logger.info("Facebook connection still active");
    return api; // Connection is still good
  } catch (error) {
    logger.warn("Facebook connection lost, attempting to refresh");
    
    try {
      // Try relogging in
      const newApi = await loginWithRetry();
      
      // Copy over event listeners and other important properties
      Object.assign(api, newApi);
      
      logger.info("Facebook connection refreshed successfully");
      return api;
    } catch (refreshError) {
      logger.error("Failed to refresh Facebook connection:", refreshError);
      throw refreshError;
    }
  }
}

module.exports = {
  login,
  loginWithRetry,
  refreshConnection
};
