const fs = require('fs');
const path = require('path');
const { exec, spawn } = require('child_process');
const logger = require('../utils/logger');
const { loadCommands, notifyAdmin } = require('../core/commandHandler');
const { loadEvents } = require('../core/eventHandler');
const auth = require('../modules/auth');

module.exports = {
  config: {
    name: "restart",
    aliases: ["reboot", "reload"],
    version: "1.2.0",
    author: "NexusTeam",
    countDown: 10,
    role: 2,
    shortDescription: "Restart the bot",
    longDescription: "Restart the bot components or the whole process",
    category: "admin",
    guide: "{prefix}restart [soft/hard] [reason]"
  },

  execute: async function({ api, event, args }) {
    const { threadID, messageID, senderID } = event;
    
    // Only allow admins to use this command
    try {
      const isAdmin = await isAdminUser(api, senderID);
      if (!isAdmin) {
        return api.sendMessage("⚠️ Only administrators can restart the bot.", threadID, messageID);
      }
    } catch (error) {
      logger.error("Error checking admin status:", error);
      return api.sendMessage("❌ Error checking permissions.", threadID, messageID);
    }
    
    // Parse restart type
    let restartType = "soft";  // Default to soft restart
    let reason = args.join(" ");
    
    if (args[0]?.toLowerCase() === "soft" || args[0]?.toLowerCase() === "hard") {
      restartType = args[0].toLowerCase();
      reason = args.slice(1).join(" ") || "No reason provided";
    } else {
      reason = args.join(" ") || "No reason provided";
    }
    
    // Send initial notification
    const notification = `⚠️ BOT ${restartType.toUpperCase()} RESTART INITIATED\n\n` +
                         `🔸 Initiated by: ${senderID}\n` +
                         `🔸 Type: ${restartType}\n` +
                         `🔸 Reason: ${reason}\n\n` +
                         `Please wait...`;
    
    await api.sendMessage(notification, threadID);
    
    // Log the restart
    logger.info(`Bot ${restartType} restart initiated by ${senderID}. Reason: ${reason}`);
    
    // Perform restart based on type
    if (restartType === "soft") {
      await performSoftRestart(api, threadID);
    } else {
      await performHardRestart(api, threadID, senderID, reason);
    }
  }
};

/**
 * Perform a soft restart - reload components without terminating process
 */
async function performSoftRestart(api, threadID) {
  try {
    await api.sendMessage("🔄 Reloading commands...", threadID);
    const commands = loadCommands();
    
    await api.sendMessage("🔄 Reloading events...", threadID);
    const events = loadEvents();
    
    // Update API references
    if (global.api) {
      global.api.commands = commands;
    }
    
    // Refresh Facebook connection if needed
    if (global.config?.restart?.refreshConnection) {
      await api.sendMessage("🔄 Refreshing Facebook connection...", threadID);
      try {
        await auth.refreshConnection(api);
      } catch (refreshError) {
        logger.error("Error refreshing connection:", refreshError);
      }
    }
    
    // Initialize permission manager if needed
    if (global.config?.restart?.reloadPermissions && global.permissionManager) {
      await api.sendMessage("🔄 Reloading permission system...", threadID);
      try {
        await global.permissionManager.initialize();
      } catch (permissionError) {
        logger.error("Error reloading permissions:", permissionError);
      }
    }
    
    // Clear cache if applicable
    if (global.config?.restart?.clearCache) {
      try {
        const cache = require('../utils/cache');
        cache.flush();
      } catch (cacheError) {
        logger.error("Error clearing cache:", cacheError);
      }
    }
    
    // Send completion message
    setTimeout(async () => {
      await api.sendMessage("✅ Soft restart completed successfully! Bot is ready.", threadID);
      logger.info("Soft restart completed");
    }, 1000);
    
  } catch (error) {
    logger.error("Error during soft restart:", error);
    await api.sendMessage(`❌ Error during restart: ${error.message}`, threadID);
  }
}

/**
 * Perform a hard restart - terminate and restart the process
 */
async function performHardRestart(api, threadID, senderID, reason) {
  try {
    // Create restart marker file
    const restartMarkerPath = path.join(process.cwd(), 'restart.marker');
    fs.writeFileSync(restartMarkerPath, JSON.stringify({
      time: Date.now(),
      threadID,
      userID: senderID,
      reason,
      type: 'manual'
    }));
    
    await api.sendMessage("⏳ Bot will fully restart in 3 seconds...", threadID);
    
    // Log restart details
    console.log("\n========= RESTARTING BOT =========");
    console.log(`Time: ${new Date().toLocaleString()}`);
    console.log(`Initiated by: ${senderID}`);
    console.log(`Reason: ${reason}`);
    console.log("==================================\n");
    
    // Wait 3 seconds then restart
    setTimeout(() => {
      // Determine how to restart based on OS
      const isWindows = process.platform === "win32";
      
      if (isWindows) {
        // Windows restart method
        try {
          // Create a restart.bat file in the current directory
          const batPath = path.join(process.cwd(), 'restart_bot.bat');
          const currentDir = process.cwd();
          const nodePath = process.execPath; // Path to the Node.js executable
          
          // Create an improved batch script
          const batchContent = 
            `@echo off\r\n` +
            `echo Restarting bot...\r\n` +
            `timeout /t 3 /nobreak > nul\r\n` +
            `cd /d "${currentDir.replace(/\\/g, '\\\\')}" \r\n` +
            `start "" "${nodePath}" index.js\r\n` +
            `exit\r\n`;
          
          fs.writeFileSync(batPath, batchContent);
          
          // Execute the batch file and exit
          const child = spawn('cmd.exe', ['/c', batPath], {
            detached: true,
            stdio: 'ignore',
            windowsHide: true
          });
          child.unref();
          
          // Log success and exit after a short delay
          logger.info("Restart script launched successfully");
          setTimeout(() => process.exit(0), 1000);
          
        } catch (winError) {
          logger.error("Windows restart error:", winError);
          throw new Error(`Restart failed: ${winError.message}`);
        }
      } else {
        // Unix/Linux restart method
        try {
          // Create a restart.sh script
          const scriptPath = path.join(process.cwd(), 'restart_bot.sh');
          const currentDir = process.cwd();
          
          // Write shell script content
          const scriptContent = 
            `#!/bin/bash\n` +
            `echo "Restarting bot..."\n` +
            `sleep 3\n` +
            `cd "${currentDir}"\n` +
            `node index.js &\n`;
          
          fs.writeFileSync(scriptPath, scriptContent);
          fs.chmodSync(scriptPath, 0o755); // Make executable
          
          // Execute script
          const child = spawn('bash', [scriptPath], {
            detached: true,
            stdio: 'ignore'
          });
          child.unref();
          
          // Log success and exit
          logger.info("Restart script launched successfully");
          setTimeout(() => process.exit(0), 1000);
          
        } catch (unixError) {
          logger.error("Unix restart error:", unixError);
          throw new Error(`Restart failed: ${unixError.message}`);
        }
      }
    }, 3000);
    
  } catch (error) {
    logger.error("Critical error during hard restart:", error);
    await api.sendMessage(`❌ Error during restart: ${error.message}`, threadID);
  }
}

/**
 * Alternative restart approach using built-in modules
 * This can be used as a fallback if the script approach fails
 */
function performSimpleRestart() {
  try {
    // Save state before exiting
    logger.info("Performing simple restart");
    
    // Use the process manager to restart the process
    if (process.send) {
      // Running under PM2 or another process manager that supports IPC
      process.send('restart');
      setTimeout(() => process.exit(0), 1000);
    } else {
      // Direct process restart
      const { spawn } = require('child_process');
      const child = spawn(process.argv[0], process.argv.slice(1), {
        detached: true,
        stdio: 'inherit'
      });
      child.unref();
      process.exit(0);
    }
  } catch (error) {
    logger.error("Simple restart failed:", error);
    process.exit(1); // Force exit which may trigger external process manager to restart
  }
}

/**
 * Helper function to check if user is admin
 */
async function isAdminUser(api, userID) {
  // Check global permission manager first
  if (global.permissionManager) {
    try {
      const permissionLevel = await global.permissionManager.getUserRole(userID);
      return permissionLevel >= 2; // Admin role or higher
    } catch (error) {
      logger.error("Error checking permissions:", error);
    }
  }
  
  // Fallback to config.json
  try {
    const config = global.config || require('../config.json');
    return Array.isArray(config.admins) && config.admins.includes(userID);
  } catch (error) {
    logger.error("Error loading config:", error);
    return false;
  }
}
