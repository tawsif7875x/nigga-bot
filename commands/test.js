module.exports = {
  config: {
    name: "test",
    aliases: ["ping", "pong"],
    version: "1.1.0",
    author: "NexusTeam",
    countDown: 5,
    role: 0,
    shortDescription: "Test if the bot is working",
    longDescription: "Send a test message to verify the bot's functionality",
    category: "system",
    guide: "{prefix}test"
  },

  execute: async function({ api, event, args }) {
    const { threadID, messageID, senderID } = event;
    
    try {
      // First, try using the sendMessage method directly
      await new Promise((resolve, reject) => {
        api.sendMessage("🔄 Testing bot response...", threadID, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      
      // Wait a moment before sending the second message
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Test a more complex message with callback
      api.sendMessage({
        body: "✅ Bot is working correctly!\n\n" +
              "• Command system: ✓\n" +
              "• Message sending: ✓\n" +
              "• Thread ID: " + threadID + "\n" +
              "• Your ID: " + senderID,
        mentions: [{
          tag: '@User',
          id: senderID,
          fromIndex: 0
        }]
      }, threadID, (err, info) => {
        if (err) {
          console.error("Error in test command:", err);
        } else {
          console.log("Test message sent successfully, messageID:", info.messageID);
        }
      }, messageID);
      
    } catch (error) {
      console.error("Test command failed:", error);
      
      // Try one more time with a simpler method
      try {
        await new Promise((resolve, reject) => {
          api.sendMessage("❌ Test failed with error: " + error.message, threadID, (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      } catch (secondError) {
        console.error("Second attempt also failed:", secondError);
      }
    }
  }
};
