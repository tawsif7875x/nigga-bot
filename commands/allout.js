const logger = require('../utils/logger');

module.exports = {
  config: {
    name: "allout",
    aliases: ["leaveall"],
    version: "1.2.0",
    author: "Nexus Team",
    countDown: 10,
    role: 3,
    shortDescription: "Leave all threads",
    longDescription: "Make the bot leave all threads it's currently in",
    category: "admin",
    guide: "{prefix}allout confirm"
  },

  execute: async function({ api, event, args }) {
    const { threadID, messageID, senderID } = event;
    
    const botID = api.getCurrentUserID();
    
    // Safety check - must be owner
    if (senderID !== global.config?.owner) {
      return api.sendMessage("❌ Only the bot owner can use this command.", threadID, messageID);
    }

    // Require confirmation
    if (!args[0] || args[0].toLowerCase() !== "confirm") {
      return api.sendMessage(
        "⚠️ WARNING: This will make the bot leave ALL threads!\n\n" +
        "To confirm, type: allout confirm", 
        threadID
      );
    }

    try {
      const threads = await new Promise((resolve, reject) => {
        api.getThreadList(100, null, ["INBOX"], (err, data) => {
          if (err) reject(err);
          else resolve(data);
        });
      });

      const groupThreads = threads.filter(t => t.isGroup);
      
      if (!groupThreads.length) {
        return api.sendMessage("❌ No group threads found to leave.", threadID);
      }

      await api.sendMessage(`🔄 Leaving ${groupThreads.length} threads...`, threadID);
      
      let success = 0;
      let failed = 0;

      // Process all threads except current one first
      for (const thread of groupThreads) {
        if (thread.threadID === threadID) continue;
        
        try {
          // Multiple leave attempts for each thread
          await new Promise((resolve, reject) => {
            // First attempt
            api.removeUserFromGroup(botID, thread.threadID, (err1) => {
              if (!err1) return resolve();
              
              // Second attempt with different parameter order
              api.removeUserFromGroup(thread.threadID, botID, (err2) => {
                if (!err2) return resolve();
                
                // Third attempt with alternate method
                api.removeUser(botID, thread.threadID, (err3) => {
                  if (!err3) return resolve();
                  reject(new Error("All leave attempts failed"));
                });
              });
            });
          });
          
          success++;
          await new Promise(resolve => setTimeout(resolve, 1000)); // Delay between leaves
        } catch (err) {
          failed++;
          logger.error(`Failed to leave ${thread.threadID}:`, err);
        }
      }

      // Send final report
      const report = `✅ Results:\n• Successfully left: ${success} threads\n• Failed: ${failed} threads`;
      await api.sendMessage(report, senderID);

      // Finally leave current thread using the same reliable method
      if (threadID !== senderID) {
        await api.sendMessage("👋 Now leaving this thread. Goodbye!", threadID);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await new Promise((resolve, reject) => {
          api.removeUserFromGroup(botID, threadID, (err1) => {
            if (!err1) return resolve();
            
            api.removeUserFromGroup(threadID, botID, (err2) => {
              if (!err2) return resolve();
              
              api.removeUser(botID, threadID, (err3) => {
                if (!err3) return resolve();
                reject(new Error("Failed to leave current thread"));
              });
            });
          });
        });
      }

    } catch (error) {
      logger.error("Error in allout command:", error);
      return api.sendMessage("❌ An error occurred while leaving threads.", threadID);
    }
  }
};
