const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const config = require('../config.json');
const FileWatcher = require('../utils/fileWatcher');

const commands = new Map();
const cooldowns = new Map();

function loadCommands() {
  const commandFiles = fs.readdirSync(path.join(__dirname, '../commands'))
    .filter(file => file.endsWith('.js'));

  commands.clear(); // Clear existing commands first

  for (const file of commandFiles) {
    try {
      delete require.cache[require.resolve(`../commands/${file}`)]; // Clear require cache
      const command = require(`../commands/${file}`);
      
      // Only add command if it's not already registered
      if (!commands.has(command.config.name)) {
        commands.set(command.config.name, command);
        logger.info(`Loaded command: ${command.config.name} [${command.config.category}]`);
      }
    } catch (error) {
      logger.error(`Failed to load command ${file}:`+ error.message, error);
    }
  }

  return commands;
}

// Add new function to reload specific command
async function reloadCommand(filename) {
  try {
    const commandPath = path.join(__dirname, '../commands', filename);
    
    // Clear require cache
    try {
      delete require.cache[require.resolve(commandPath)];
    } catch (cacheError) {
      logger.error(`Failed to clear cache for ${filename}:`, cacheError);
      throw new Error(`Cache clear error: ${cacheError.message}`);
    }
    
    // Require the updated command
    let command;
    try {
      command = require(commandPath);
    } catch (requireError) {
      logger.error(`Failed to require command ${filename}:`, requireError);
      notifyAdmin(`⚠️ Failed to reload command "${filename}": ${requireError.message}`);
      throw new Error(`Require error: ${requireError.message}`);
    }
    
    // Check if the command has the needed structure
    if (!command || !command.config || !command.config.name) {
      const errorMsg = `Invalid command format: ${filename} is missing config or name property`;
      logger.error(errorMsg);
      notifyAdmin(`⚠️ ${errorMsg}`);
      throw new Error(errorMsg);
    }
    
    // Add command to commands map
    commands.set(command.config.name, command);
    logger.info(`🔄 Reloaded command: ${command.config.name}`);
    
    // Notify admin about the successful update
    notifyAdmin(`🔄 Command "${command.config.name}" has been updated and reloaded successfully.`);
    
    return command;
  } catch (error) {
    logger.error(`Failed to reload command ${filename}:`, error);
    return null;
  }
}

/**
 * Helper function to safely notify the admin with multiple fallbacks
 * @param {string} message - The message to send
 */
function notifyAdmin(message) {
  // Track notification issues to prevent repeated errors
  if (global.notificationDisabled) {
    logger.debug("Admin notifications are temporarily disabled due to previous errors");
    console.log(`[Admin notification] ${message}`);
    return;
  }

  // Log the message as fallback
  logger.info(`Admin message: ${message}`);
  console.log(`[Admin notification] ${message}`);
  
  // Exit early if API is not available
  if (!global.api) {
    logger.debug("Can't notify admin: API not available");
    return;
  }
  
  // Get admin IDs with maximum safety
  let adminId = null;
  try {
    const config = global.config || require('../config.json');
    
    // Try owner first (highest permission)
    if (config.owner) {
      adminId = config.owner;
    }
    // Then try regular admins
    else if (config.admins && Array.isArray(config.admins) && config.admins.length > 0) {
      // Get the first valid admin ID
      for (const id of config.admins) {
        if (id && typeof id === 'string' && id.length > 5) {
          adminId = id;
          break;
        }
      }
    }
  } catch (error) {
    logger.error("Error getting admin IDs:", error.message);
  }
  
  // If we still don't have an admin ID, give up
  if (!adminId) {
    logger.debug("No valid admin IDs found for notification");
    return;
  }
  
  // Try to send to user's inbox instead of thread
  try {
    global.api.sendMessage(message, adminId)
      .then(() => {
        logger.debug(`Admin notification sent to ${adminId}`);
      })
      .catch(error => {
        const errorMsg = error.message || 'Unknown error';
        logger.error(`Failed to notify admin ${adminId}: ${errorMsg}`);
        
        // Disable notifications temporarily if we're getting consistent errors
        if (errorMsg.includes('Thread is disabled') || 
            errorMsg.includes('Not logged in') || 
            errorMsg.includes('Permission denied')) {
          logger.warn('Admin notifications disabled for this session due to persistent errors');
          global.notificationDisabled = true;
        }
      });
  } catch (outerError) {
    logger.error('Exception sending admin notification:', outerError);
  }
}

// Initialize file watcher when commands are first loaded
function initializeCommandWatcher() {
  const commandsDir = path.join(__dirname, '../commands');
  const watcher = new FileWatcher(commandsDir, reloadCommand);
  watcher.start();
}

async function handleCommand(api, event) {
  const { body, senderID, threadID, messageID } = event;
  
  // Get thread-specific prefix if available
  const threadPrefix = global.threadPrefixes?.get(threadID);
  const defaultPrefix = global.config?.prefix || '!';
  
  // Check if message starts with thread-specific prefix OR global prefix
  let usedPrefix = null;
  let messageContent = '';
  
  if (threadPrefix && body.startsWith(threadPrefix)) {
    usedPrefix = threadPrefix;
    messageContent = body.slice(threadPrefix.length).trim();
  } else if (body.startsWith(defaultPrefix)) {
    usedPrefix = defaultPrefix;
    messageContent = body.slice(defaultPrefix.length).trim();
  }
  
  // If no valid prefix was found at the start, exit
  if (!usedPrefix) return;
  
  // If the message is exactly the prefix, suggest help
  if (messageContent === '') {
    return api.sendMessage(`the command you’re using doesn’t exist. type ${usedPrefix}help to see all available commands`, threadID, messageID);
  }
  
  const args = messageContent.split(/ +/);
  const commandName = args.shift().toLowerCase();

  // Check if command exists (including aliases)
  let command = commands.get(commandName);
  
  // If command not found by name, check aliases
  if (!command) {
    for (const [name, cmd] of commands.entries()) {
      if (cmd.config.aliases && Array.isArray(cmd.config.aliases) && 
          cmd.config.aliases.includes(commandName)) {
        command = cmd;
        break;
      }
    }
  }
  
  // If command still doesn't exist, suggest help
  if (!command) {
    return api.sendMessage(`❌ Command "${commandName}" not found. Use ${usedPrefix}help to see available commands.`, threadID, messageID);
  }

  // Check user permissions using permission manager
  if (command.config.role > 0) {
    try {
      let hasPermission = false;
      
      // Check if permission manager is available
      if (global.permissionManager) {
        // Get user's global permission level
        const permissionLevel = await global.permissionManager.getUserRole(senderID);
        
        // If the user has bot admin or owner permissions, always allow
        if (permissionLevel >= command.config.role) {
          hasPermission = true;
        }
        // For thread admin permissions, check thread-specific admin status
        else if (command.config.role === 1) {
          const isThreadAdmin = await global.permissionManager.isThreadAdmin(api, senderID, threadID);
          if (isThreadAdmin) {
            hasPermission = true;
          }
        }
      }
      // Fallback permission check
      else {
        hasPermission = await fallbackPermissionCheck(api, senderID, threadID, command.config.role);
      }
      
      // If no permission, send error message
      if (!hasPermission) {
        const roleNames = ["Member", "Group Admin", "Bot Admin", "Bot Owner"];
        const requiredRole = roleNames[command.config.role] || "Unknown Role";
        return api.sendMessage(`⚠️ This command requires ${requiredRole} permissions.`, threadID);
      }
    } catch (error) {
      logger.error(`Permission check error:`, error);
      return api.sendMessage("❌ An error occurred while checking permissions.", threadID);
    }
  }

  // Check cooldown
  const timestamps = cooldowns.get(command.config.name);
  if (timestamps) {
    const now = Date.now();
    const cooldownAmount = (command.config.countDown || 3) * 1000;
    const timestamp = timestamps.get(senderID);

    if (timestamp) {
      const expirationTime = timestamp + cooldownAmount;
      if (now < expirationTime) {
        const timeLeft = (expirationTime - now) / 1000;
        return api.sendMessage(
          `⏳ Please wait ${timeLeft.toFixed(1)} more seconds before using ${command.config.name} again.`,
          threadID
        );
      }
    }
  } else {
    cooldowns.set(command.config.name, new Map());
  }

  // Set cooldown
  cooldowns.get(command.config.name).set(senderID, Date.now());

  // Track command usage before executing
  if (global.trackCommand) {
    global.trackCommand(
      commandName,
      senderID,
      senderID // You can replace this with actual user name if available
    );
  }

  // Execute command with the actual prefix used
  try {
    await command.execute({
      api,
      event,
      args,
      commands,
      prefix: usedPrefix, // Pass the prefix that was actually used
      Users: global.Users,
      Threads: global.Threads
    });

    // Track command usage
    if (typeof global.commandAnalytics === 'function') {
      await global.commandAnalytics(
        command.config.name,
        command.config.category
      );
    }
  } catch (error) {
    logger.error(`Error executing ${command.config.name}:`, error);
    api.sendMessage("❌ | " + error.message, threadID);
  }
}

/**
 * Fallback permission check when permission manager is unavailable
 * @param {Object} api - Facebook API 
 * @param {String} userId - User ID
 * @param {String} threadId - Thread ID
 * @param {Number} requiredRole - Required role level
 * @returns {Promise<boolean>} Whether user has permission
 */
async function fallbackPermissionCheck(api, userId, threadId, requiredRole) {
  try {
    // Load config directly as fallback
    const config = global.config || require('../config.json');
    
    // Check for bot owner (role 3)
    if (config.owner === userId) {
      return true;
    }
    
    // Check for bot admin (role 2)
    if (requiredRole <= 2 && Array.isArray(config.admins) && config.admins.includes(userId)) {
      return true;
    }
    
    // Check for thread admin (role 1)
    if (requiredRole <= 1) {
      try {
        // Get thread info to check admin status
        const threadInfo = await new Promise((resolve, reject) => {
          api.getThreadInfo(threadId, (err, info) => {
            if (err) reject(err);
            else resolve(info);
          });
        });
        
        // Check if user is admin of the thread
        if (threadInfo && 
            Array.isArray(threadInfo.adminIDs) && 
            threadInfo.adminIDs.some(admin => admin.id === userId)) {
          return true;
        }
      } catch (threadError) {
        logger.error("Error checking thread admin status:", threadError);
      }
    }
    
    // User doesn't have the required permission
    return false;
  } catch (error) {
    logger.error("Error in fallback permission check:", error);
    return false;
  }
}

// Modify module exports to include the new functionality
module.exports = { 
  loadCommands, 
  handleCommand, 
  commands,
  initializeCommandWatcher,
  notifyAdmin
};
