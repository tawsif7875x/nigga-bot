const os = require('os');
const { exec } = require('child_process');
const logger = require('../utils/logger');

module.exports = {
  config: {
    name: "info",
    version: "1.1.0",
    author: "Nexus Team",
    countDown: 5,
    role: 0,
    shortDescription: "Show bot and system information",
    longDescription: "Display information about the bot, current session, system resources and database stats",
    category: "system",
    guide: "{prefix}info",
    aliases: ["status", "stats", "about"]
  },
  
  execute: async function({ api, event }) {
    const { threadID, messageID } = event;
    
    // Get current thread prefix
    const threadPrefix = global.threadPrefixes?.get(threadID) || global.config?.prefix || '!';
    
    try {
      // Start with basic bot info
      let botInfo = await getBotInfo(api);
      
      // Get system info
      let systemInfo = getSystemInfo();
      
      // Get session info
      let sessionInfo = getSessionInfo();
      
      // Get database stats
      let dbStats = await getDatabaseStats();
      
      // Format all info into a message
      const infoMessage = `🤖 BOT INFORMATION 🤖
      
📝 Name: ${botInfo.name}
👤 Owner: ${botInfo.owner}
⚙️ Prefix: ${threadPrefix}
🧩 Commands: ${botInfo.commands}

📊 SESSION STATS:
🧠 Memory Usage: ${sessionInfo.memory}
⏱️ Uptime: ${sessionInfo.uptime}
📨 Messages: ${sessionInfo.messages}
🧵 Threads: ${dbStats.threads}
👥 Users: ${dbStats.users}

💻 SYSTEM:
🖥️ Platform: ${systemInfo.platform}
💾 OS: ${systemInfo.os}
🔄 CPU: ${systemInfo.cpu}
📏 Memory: ${systemInfo.memory}`;

      // Send the message
      api.sendMessage(infoMessage, threadID, messageID);
      
    } catch (error) {
      logger.error("Error generating info:", error);
      api.sendMessage(`❌ An error occurred while retrieving bot information.`, threadID, messageID);
    }
  }
};

// Helper functions

async function getBotInfo(api) {
  try {
    // Bot name from config or current user info
    const userID = api.getCurrentUserID();
    const userInfo = await new Promise((resolve, reject) => {
      api.getUserInfo(userID, (err, info) => {
        if (err) reject(err);
        else resolve(info);
      });
    });
    
    const name = userInfo[userID].name;
    
    return {
      name: global.config?.name || name || "Nexus Bot",
      owner: global.config?.ownerName || "Nexus Team",
      commands: global.api?.commands?.size || 0
    };
  } catch (error) {
    logger.error("Error getting bot info:", error);
    return {
      name: "Nexus Bot",
      owner: "Nexus Team",
      commands: 0
    };
  }
}

function getSystemInfo() {
  try {
    const platform = os.platform();
    const osType = os.type();
    const osRelease = os.release();
    const cpuModel = os.cpus()[0]?.model || "Unknown CPU";
    const totalMem = Math.round(os.totalmem() / 1024 / 1024);
    const freeMem = Math.round(os.freemem() / 1024 / 1024);
    
    return {
      platform: platform,
      os: `${osType} ${osRelease}`,
      cpu: cpuModel,
      memory: `${freeMem}MB free of ${totalMem}MB`
    };
  } catch (error) {
    logger.error("Error getting system info:", error);
    return {
      platform: "Unknown",
      os: "Unknown",
      cpu: "Unknown",
      memory: "Unknown"
    };
  }
}

function getSessionInfo() {
  try {
    // Get memory usage
    const usedMem = Math.round(process.memoryUsage().rss / 1024 / 1024);
    
    // Calculate uptime
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);
    const uptimeString = `${hours}h ${minutes}m ${seconds}s`;
    
    return {
      memory: `${usedMem}MB`,
      uptime: uptimeString,
      messages: global.messageCount || 0
    };
  } catch (error) {
    logger.error("Error getting session info:", error);
    return {
      memory: "Unknown",
      uptime: "Unknown",
      messages: 0
    };
  }
}

async function getDatabaseStats() {
  try {
    // Try to get stats from database
    const dbManager = require('../modules/dbManager');
    
    // Get thread count and user count from database
    let threadCount = 0;
    let userCount = 0;
    
    try {
      // Use the new count methods
      threadCount = await dbManager.countGroups();
      userCount = await dbManager.countUsers();
    } catch (dbError) {
      // Fallback to counting prefixes and a default user count
      logger.debug("Using fallback for database stats:", dbError.message);
      threadCount = global.threadPrefixes?.size || 0;
      userCount = 0;
    }
    
    return {
      threads: threadCount,
      users: userCount
    };
  } catch (error) {
    logger.error("Error getting database stats:", error);
    return {
      threads: 0,
      users: 0
    };
  }
}
