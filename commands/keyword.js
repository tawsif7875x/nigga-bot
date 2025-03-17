const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

// Initialize custom keywords map if not already done
if (!global.customKeywords) {
  global.customKeywords = new Map();
  
  // Load saved keywords
  try {
    const keywordPath = path.join(__dirname, '../database/keywords.json');
    if (fs.existsSync(keywordPath)) {
      const keywords = JSON.parse(fs.readFileSync(keywordPath, 'utf8'));
      Object.entries(keywords).forEach(([id, keyword]) => {
        global.customKeywords.set(id, keyword);
      });
      logger.info(`Loaded ${global.customKeywords.size} custom keywords`);
    }
  } catch (error) {
    logger.error("Error loading custom keywords:", error);
  }
}

// Save keywords to file
function saveKeywords() {
  try {
    const keywordPath = path.join(__dirname, '../database/keywords.json');
    const keywords = {};
    
    // Convert Map to regular object for JSON serialization
    global.customKeywords.forEach((keyword, id) => {
      keywords[id] = keyword;
    });
    
    fs.writeFileSync(keywordPath, JSON.stringify(keywords, null, 2));
    return true;
  } catch (error) {
    logger.error("Error saving custom keywords:", error);
    return false;
  }
}

module.exports = {
  config: {
    name: "keyword",
    aliases: ["keywords", "addkey", "key"],
    version: "1.0.0",
    author: "Nexus Team",
    countDown: 5,
    role: 2,  // Admin only
    shortDescription: "Manage bot response keywords",
    longDescription: "Add, remove or list keywords that the bot will respond to without a prefix",
    category: "system",
    guide: "{prefix}keyword add <trigger> => <response>\n{prefix}keyword remove <id>\n{prefix}keyword list"
  },
  
  execute: async function({ api, event, args }) {
    const { threadID, messageID } = event;
    
    // Show help if no arguments
    if (args.length === 0) {
      return api.sendMessage(
        `🔑 Keyword Manager\n\n` +
        `Commands:\n` +
        `➤ add <trigger> => <response>\n` +
        `➤ remove <id>\n` +
        `➤ list\n\n` +
        `Example: keyword add hello => Hello there!`,
        threadID, messageID
      );
    }
    
    const action = args[0].toLowerCase();
    
    // List all keywords
    if (action === "list") {
      if (global.customKeywords.size === 0) {
        return api.sendMessage("No custom keywords found.", threadID, messageID);
      }
      
      let message = "📋 Custom Keywords:\n\n";
      
      global.customKeywords.forEach((keyword, id) => {
        message += `ID: ${id}\n`;
        message += `Triggers: ${keyword.triggers.join(", ")}\n`;
        message += `Response: ${keyword.response}\n\n`;
      });
      
      return api.sendMessage(message, threadID, messageID);
    }
    
    // Add a keyword
    if (action === "add") {
      // Get everything after "add "
      const keywordText = args.slice(1).join(" ");
      
      // Check for the "=>" separator
      if (!keywordText.includes("=>")) {
        return api.sendMessage(
          "❌ Invalid format. Use:\n" +
          "keyword add <trigger> => <response>",
          threadID, messageID
        );
      }
      
      // Split into trigger and response
      const [triggerText, responseText] = keywordText.split("=>").map(text => text.trim());
      
      // Validate inputs
      if (!triggerText || !responseText) {
        return api.sendMessage("❌ Both trigger and response are required.", threadID, messageID);
      }
      
      // Generate unique ID
      const id = Date.now().toString();
      
      // Add to custom keywords
      global.customKeywords.set(id, {
        triggers: [triggerText],
        response: responseText
      });
      
      saveKeywords();
      
      return api.sendMessage(`✅ Added keyword:\nTrigger: ${triggerText}\nResponse: ${responseText}`, threadID, messageID);
    }
    
    // Remove a keyword
    if (action === "remove") {
      const id = args[1];
      
      if (!id) {
        return api.sendMessage("❌ You must specify an ID to remove.", threadID, messageID);
      }
      
      if (!global.customKeywords.has(id)) {
        return api.sendMessage("❌ Keyword ID not found.", threadID, messageID);
      }
      
      const keyword = global.customKeywords.get(id);
      global.customKeywords.delete(id);
      saveKeywords();
      
      return api.sendMessage(`✅ Removed keyword:\nTriggers: ${keyword.triggers.join(", ")}\nResponse: ${keyword.response}`, threadID, messageID);
    }
    
    // Invalid action
    return api.sendMessage(`❌ Unknown action: ${action}\nUse: list, add, remove`, threadID, messageID);
  }
};
