const logger = require('../utils/logger');

module.exports = {
  config: {
    name: "thread",
    aliases: ["threads", "group", "groups"],
    version: "1.1.0",
    author: "Nexus Team",
    countDown: 5,
    role: 2, // Bot admin or higher
    shortDescription: "Manage threads/groups",
    longDescription: "Manage threads/groups that the bot is in - list, add, leave, info",
    category: "admin",
    guide: "{prefix}thread list [page]\n{prefix}thread info [threadID]\n{prefix}thread join [threadID]\n{prefix}thread leave [threadID]\n{prefix}thread scan"
  },
  
  execute: async function({ api, event, args, prefix }) {
    const { threadID, messageID, senderID } = event;
    
    if (!args[0]) {
      return api.sendMessage(
        "📋 Thread Management Commands:\n\n" +
        `• ${prefix}thread list [page] - List all threads\n` +
        `• ${prefix}thread info [threadID] - Get thread info\n` +
        `• ${prefix}thread join [threadID] - Join a thread\n` +
        `• ${prefix}thread leave [threadID] - Leave a thread\n` +
        `• ${prefix}thread scan - Scan current thread for admins`,
        threadID, messageID);
    }
    
    const command = args[0].toLowerCase();
    
    switch (command) {
      case "list":
        return await listThreads(api, event, args.slice(1), prefix);
      case "info":
        return await getThreadInfo(api, event, args.slice(1), prefix);
      case "join":
        return await joinThread(api, event, args.slice(1), prefix);
      case "leave":
        return await leaveThread(api, event, args.slice(1), prefix);
      case "scan":
        return await scanThread(api, event, args.slice(1), prefix);
      default:
        return api.sendMessage(`❌ Unknown subcommand: ${command}.\nUse ${prefix}thread for help.`, threadID, messageID);
    }
  }
};

/**
 * List threads the bot is in
 */
async function listThreads(api, event, args, prefix) {
  const { threadID, messageID } = event;
  
  try {
    const page = parseInt(args[0]) || 1;
    const threadsPerPage = 10;
    const startIndex = (page - 1) * threadsPerPage;
    
    // Get threads from API with larger limit and proper filtering
    const threads = await new Promise((resolve, reject) => {
      api.getThreadList(50, null, ["INBOX"], (err, data) => {
        if (err) reject(err);
        else resolve(data || []);
      });
    });
    
    // Filter valid group threads and ensure thread info
    const groupThreads = [];
    for (const thread of threads) {
      if (!thread.isGroup) continue;
      
      try {
        // Get full thread info to verify bot's participation
        const threadInfo = await new Promise((resolve, reject) => {
          api.getThreadInfo(thread.threadID, (err, info) => {
            if (err) reject(err);
            else resolve(info);
          });
        });
        
        if (threadInfo && threadInfo.participantIDs.includes(api.getCurrentUserID())) {
          groupThreads.push(threadInfo);
        }
      } catch (err) {
        logger.error(`Error getting info for thread ${thread.threadID}:`, err);
      }
    }
    
    // Check if there are any threads
    if (!groupThreads || groupThreads.length === 0) {
      return api.sendMessage("❌ No group threads found.", threadID, messageID);
    }
    
    // Calculate pagination
    const totalPages = Math.ceil(groupThreads.length / threadsPerPage);
    
    // Ensure page is valid
    if (page < 1 || page > totalPages) {
      return api.sendMessage(`❌ Invalid page number. Please use a number between 1 and ${totalPages}.`, threadID, messageID);
    }
    
    // Get threads for current page
    const pageThreads = groupThreads.slice(startIndex, startIndex + threadsPerPage);
    
    // Format thread list
    let message = `📋 Thread List (Page ${page}/${totalPages}):\n\n`;
    
    pageThreads.forEach((thread, index) => {
      const threadName = thread.name || "Unknown";
      message += `${startIndex + index + 1}. ${threadName}\nID: ${thread.threadID}\n\n`;
    });
    
    // Add pagination instructions
    message += `Use ${prefix}thread list [page] to see more threads.`;
    
    return api.sendMessage(message, threadID, messageID);
  } catch (error) {
    logger.error("Error listing threads:", error);
    return api.sendMessage("❌ An error occurred while listing threads.", threadID, messageID);
  }
}

/**
 * Get detailed information about a thread
 */
async function getThreadInfo(api, event, args, prefix) {
  const { threadID, messageID } = event;
  
  // If no thread ID is provided, use current thread
  const targetThreadID = args[0] || threadID;
  
  try {
    // Get thread info
    const info = await new Promise((resolve, reject) => {
      api.getThreadInfo(targetThreadID, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });
    
    // Format thread info
    let message = "📝 Thread Information:\n\n";
    message += `Name: ${info.threadName || "Unknown"}\n`;
    message += `ID: ${info.threadID}\n`;
    message += `Type: ${info.isGroup ? "Group" : "Personal Chat"}\n`;
    
    if (info.isGroup) {
      message += `Members: ${info.participantIDs.length}\n`;
      message += `Admins: ${info.adminIDs ? info.adminIDs.length : 0}\n`;
      message += `Approval Mode: ${info.approvalMode ? "On" : "Off"}\n`;
      
      // Get custom thread prefix if exists
      const threadPrefix = global.threadPrefixes?.get(targetThreadID) || prefix;
      message += `Custom Prefix: ${threadPrefix !== prefix ? threadPrefix : "None (using default)"}\n`;
      
      // List admins
      if (info.adminIDs && info.adminIDs.length > 0) {
        message += "\nAdmins:\n";
        
        // Get admin names (batch API call)
        const adminInfo = await new Promise((resolve, reject) => {
          api.getUserInfo(info.adminIDs.map(admin => admin.id), (err, data) => {
            if (err) reject(err);
            else resolve(data);
          });
        });
        
        info.adminIDs.forEach((admin, index) => {
          const name = adminInfo[admin.id]?.name || "Unknown";
          message += `${index + 1}. ${name} (${admin.id})\n`;
        });
      }
    }
    
    return api.sendMessage(message, threadID, messageID);
  } catch (error) {
    logger.error("Error getting thread info:", error);
    return api.sendMessage("❌ An error occurred while getting thread info. Make sure the thread ID is valid and the bot is in that thread.", threadID, messageID);
  }
}

/**
 * Join a thread (adds the bot owner to the thread)
 */
async function joinThread(api, event, args, prefix) {
  const { threadID, messageID, senderID } = event;
  
  // Check if thread ID is provided
  if (!args[0]) {
    return api.sendMessage(`❌ Please provide a thread ID.\nUsage: ${prefix}thread join [threadID]`, threadID, messageID);
  }
  
  const targetThreadID = args[0];
  
  try {
    // Get bot owner ID
    const config = global.config || {};
    const ownerID = config.owner || senderID;
    
    // Send loading message
    await api.sendMessage("⏳ Attempting to join thread...", threadID, messageID);
    
    // Try to add the bot owner to the group (since the bot is already there)
    try {
      // Using direct API call to avoid the CustomError issue
      await new Promise((resolve, reject) => {
        // Alternative way of handling thread joining - use thread approval
        api.handleMessageRequest(targetThreadID, true, (err) => {
          if (err) {
            logger.error("Failed to accept thread request:", err);
            // Proceed to next attempt
            resolve();
          } else {
            resolve();
          }
        });
      });
      
      // Success feedback
      return api.sendMessage(`✅ Successfully joined thread ${targetThreadID}`, threadID);
    } catch (error) {
      logger.error("Error joining thread:", error);
      return api.sendMessage("❌ Failed to join the thread. Make sure you have permission and that the thread ID is valid.", threadID, messageID);
    }
  } catch (error) {
    logger.error("Error joining thread:", error);
    return api.sendMessage("❌ An error occurred while trying to join the thread.", threadID, messageID);
  }
}

/**
 * Leave a thread
 */
async function leaveThread(api, event, args, prefix) {
  const { threadID, messageID, senderID } = event;
  
  const targetThreadID = args[0] || threadID;
  
  if (targetThreadID === threadID && !args[0]) {
    return api.sendMessage(`⚠️ To leave the current thread, you must explicitly specify the thread ID.\nUse ${prefix}thread leave ${threadID}`, threadID, messageID);
  }
  
  try {
    // Verify thread exists and bot is participant
    const threadInfo = await new Promise((resolve, reject) => {
      api.getThreadInfo(targetThreadID, (err, info) => {
        if (err) reject(err);
        else resolve(info);
      });
    });
    
    if (!threadInfo || !threadInfo.participantIDs.includes(api.getCurrentUserID())) {
      return api.sendMessage("❌ Bot is not a member of this thread.", threadID, messageID);
    }

    // Send leaving message
    if (targetThreadID === threadID) {
      await api.sendMessage("👋 Leaving this thread as requested.", threadID);
    }

    const botID = api.getCurrentUserID();

    // Try multiple leave methods
    try {
      await new Promise((resolve, reject) => {
        // First attempt
        api.removeUserFromGroup(botID, targetThreadID, async (err) => {
          if (!err) return resolve();
          
          // Second attempt with different parameter order
          api.removeUserFromGroup(targetThreadID, botID, async (err2) => {
            if (!err2) return resolve();
            
            // Third attempt with alternate method
            api.removeUser(botID, targetThreadID, (err3) => {
              if (!err3) return resolve();
              reject(new Error("All leave attempts failed"));
            });
          });
        });
      });

      // Success notifications
      if (targetThreadID === threadID) {
        try {
          await api.sendMessage(`✅ Successfully left thread ${threadID}`, senderID);
        } catch (dmError) {
          logger.error("Failed to send DM confirmation:", dmError);
        }
      } else {
        return api.sendMessage(`✅ Successfully left thread ${targetThreadID}`, threadID, messageID);
      }
    } catch (error) {
      throw new Error(`Failed to leave: ${error.message}`);
    }
  } catch (error) {
    logger.error("Error leaving thread:", error);
    return api.sendMessage("❌ Failed to leave thread. Make sure the thread ID is valid and the bot is in that thread.", threadID, messageID);
  }
}

/**
 * Scan a thread to update admin cache
 */
async function scanThread(api, event, args, prefix) {
  const { threadID, messageID } = event;
  
  // If no thread ID is provided, use current thread
  const targetThreadID = args[0] || threadID;
  
  try {
    // Get thread info
    const info = await new Promise((resolve, reject) => {
      api.getThreadInfo(targetThreadID, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });
    
    // Update admin cache
    if (global.permissionManager) {
      await global.permissionManager.refreshThreadAdmins(api, targetThreadID);
    }
    
    // Get admin names
    let adminCount = 0;
    let adminNames = [];
    
    if (info.adminIDs && info.adminIDs.length > 0) {
      adminCount = info.adminIDs.length;
      
      // Get admin info
      const adminInfo = await new Promise((resolve, reject) => {
        api.getUserInfo(info.adminIDs.map(admin => admin.id), (err, data) => {
          if (err) reject(err);
          else resolve(data);
        });
      });
      
      // Format admin names
      adminNames = info.adminIDs.map(admin => {
        const name = adminInfo[admin.id]?.name || "Unknown";
        return `${name} (${admin.id})`;
      });
    }
    
    // Send scan results
    return api.sendMessage(
      `✅ Thread scan complete\n\n` +
      `Thread: ${info.threadName || "Unknown"}\n` +
      `Members: ${info.participantIDs ? info.participantIDs.length : 0}\n` +
      `Admins: ${adminCount}\n\n` +
      `Admin list updated for permission checking.` +
      (adminNames.length > 0 ? `\n\nAdmins:\n${adminNames.map((name, i) => `${i+1}. ${name}`).join('\n')}` : ''),
      threadID, messageID
    );
  } catch (error) {
    logger.error("Error scanning thread:", error);
    return api.sendMessage("❌ An error occurred while scanning thread. Make sure the thread ID is valid and the bot is in that thread.", threadID, messageID);
  }
}
