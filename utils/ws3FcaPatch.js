/**
 * WS3-FCA Patcher
 * 
 * Fixes common issues with the ws3-fca library
 */
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

class WS3FCAFixer {
  /**
   * Fix the typing indicator issue in ws3-fca
   * @returns {boolean} Success status
   */
  static async fixTypingIndicator() {
    try {
      const modulePath = path.join(process.cwd(), 'node_modules', 'ws3-fca');
      
      if (!fs.existsSync(modulePath)) {
        logger.warn('WS3-FCA module not found. Skipping typing indicator fix.');
        return false;
      }
      
      // Try to locate the typing indicator file
      const typingIndicatorPath = path.join(modulePath, 'src', 'sendTypingIndicator.js');
      
      if (!fs.existsSync(typingIndicatorPath)) {
        logger.warn('Typing indicator file not found in ws3-fca. Creating it...');
        
        // Create the directory if it doesn't exist
        const srcDir = path.join(modulePath, 'src');
        if (!fs.existsSync(srcDir)) {
          fs.mkdirSync(srcDir, { recursive: true });
        }
      }
      
      // Always apply the fixed version to ensure it works correctly
      const patchedContent = `// Fixed by NexusBot
module.exports = function(threadID, callback) {
  // Make callback optional
  if (!callback) {
    callback = function() {};
  } else if (typeof callback !== 'function') {
    throw new Error('callback must be a function');
  }

  var resolveFunc = function(){};
  var rejectFunc = function(){};
  var returnPromise = new Promise(function(resolve, reject) {
    resolveFunc = resolve;
    rejectFunc = reject;
  });

  // Verify threadID is valid to prevent errors
  if (!threadID) {
    return callback(new Error("Invalid threadID"));
  }

  try {
    var form = {
      typing: true,
      to: threadID
    };

    this._request("https://www.facebook.com/ajax/messaging/typ.php", form)
      .then(() => {
        callback();
        resolveFunc();
      })
      .catch((err) => {
        callback(err);
        rejectFunc(err);
      });
  } catch (error) {
    callback(error);
    rejectFunc(error);
  }

  return returnPromise;
};`;
      
      // Write the fixed file
      fs.writeFileSync(typingIndicatorPath, patchedContent);
      logger.info('Successfully patched WS3-FCA typing indicator');
      
      return true;
    } catch (error) {
      logger.error('Error patching typing indicator:', error);
      return false;
    }
  }
  
  /**
   * Fix the function context binding in WS3-FCA's index.js
   * This ensures the functions are properly bound to the API object
   * @returns {boolean} Success status
   */
  static async fixFunctionBinding() {
    try {
      const modulePath = path.join(process.cwd(), 'node_modules', 'ws3-fca');
      const indexPath = path.join(modulePath, 'index.js');
      
      if (!fs.existsSync(indexPath)) {
        logger.warn('WS3-FCA index.js not found. Skipping function binding fix.');
        return false;
      }
      
      // Read the current content
      let content = fs.readFileSync(indexPath, 'utf8');
      
      // Check if we already patched it
      if (content.includes('// Function binding fixed by NexusBot')) {
        logger.info('WS3-FCA function binding already patched.');
        return true;
      }
      
      // Fix function binding by explicitly binding each function to the API object
      // We need to replace the function mapping section
      const functionMapSection = `api.addFunctions = function (funcs) {
    for (let func of funcs) {
      if (func == "setOptions") continue; // Skip setOptions
      api[func] = function (...args) {
        return defaultFuncs[func].apply(this, args);
      };
    }
  };`;
      
      const fixedFunctionMap = `// Function binding fixed by NexusBot
  api.addFunctions = function (funcs) {
    for (let func of funcs) {
      if (func == "setOptions") continue; // Skip setOptions
      api[func] = function (...args) {
        // Ensure proper callback handling
        if (func === 'sendTypingIndicator' && (!args[1] || typeof args[1] !== 'function')) {
          args[1] = () => {}; // Default empty callback if not provided
        }
        return defaultFuncs[func].apply(defaultFuncs, args);
      };
    }
  };`;
      
      // Apply the fix
      content = content.replace(functionMapSection, fixedFunctionMap);
      
      // Write back the fixed file
      fs.writeFileSync(indexPath, content);
      logger.info('Successfully patched WS3-FCA function binding');
      
      return true;
    } catch (error) {
      logger.error('Error fixing function binding:', error);
      return false;
    }
  }
  
  /**
   * Create a custom fixed login function to handle errors properly
   * @returns {boolean} Success status
   */
  static async createLoginWrapper() {
    const filePath = path.join(process.cwd(), 'modules', 'ws3fcaWrapper.js');
    
    try {
      const content = `// Custom wrapper for WS3-FCA to handle login issues
const ws3fca = require('ws3-fca');
const logger = require('../utils/logger');

/**
 * Custom login function with proper error handling and retry logic
 * @param {Object} options - Login options
 * @returns {Promise<Object>} - API object
 */
async function login(options) {
  return new Promise((resolve, reject) => {
    ws3fca(options, (err, api) => {
      if (err) {
        reject(err);
        return;
      }
      
      // Override sendTypingIndicator with a fixed version
      const originalSendTyping = api.sendTypingIndicator;
      api.sendTypingIndicator = function(threadID, callback) {
        // Make callback optional
        if (!callback) {
          callback = () => {};
        }
        
        try {
          // Call the original function with proper callback
          return originalSendTyping.call(this, threadID, callback);
        } catch (error) {
          logger.error('Error in sendTypingIndicator:', error);
          // Still call the callback to prevent hanging promises
          callback(error);
          return Promise.reject(error);
        }
      };
      
      resolve(api);
    });
  });
}

module.exports = { login };
`;
      
      // Create modules directory if it doesn't exist
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Write wrapper file
      fs.writeFileSync(filePath, content);
      
      logger.info('Created WS3-FCA wrapper with fixed login function');
      return true;
    } catch (error) {
      logger.error('Error creating WS3-FCA wrapper:', error);
      return false;
    }
  }
  
  /**
   * Apply all patches to WS3-FCA
   */
  static async patchEntireModule() {
    const results = {
      typingIndicator: await this.fixTypingIndicator(),
      functionBinding: await this.fixFunctionBinding(),
      loginWrapper: await this.createLoginWrapper()
    };
    
    const patchCount = Object.values(results).filter(Boolean).length;
    
    if (patchCount > 0) {
      logger.info(`Applied ${patchCount} patches to WS3-FCA`);
      return true;
    } else {
      logger.warn('No patches were applied to WS3-FCA');
      return false;
    }
  }
}

module.exports = WS3FCAFixer;
