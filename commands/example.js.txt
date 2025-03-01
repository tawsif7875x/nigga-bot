module.exports = {
  config: {
    name: "example",
    aliases: ["ex", "test"],
    version: "1.0",
    author: "YourName",
    role: 0, // 0: everyone, 1: admin, 2: bot admin
    cooldown: 5, // cooldown in seconds
    description: "Example command description",
    usage: "{prefix}example [option]",
    category: "general"
  },

  languages: {
    "en": {
      "success": "Command executed successfully!",
      "error": "An error occurred: %1"
    },
    "bn": {
      "success": "কমান্ড সফলভাবে চালানো হয়েছে!",
      "error": "একটি ত্রুটি ঘটেছে: %1"
    }
  },

  onLoad: async function() {
    // Optional: Run when command is loaded
    // Example: Create database tables, load resources
  },

  execute: async function({ api, event, args, Currencies, Users, Threads, getLang }) {
    const { threadID, messageID, senderID } = event;
    try {
      // Your command code here
      return api.sendMessage(getLang("success"), threadID, messageID);
    } catch (error) {
      return api.sendMessage(getLang("error", error.message), threadID, messageID);
    }
  }
};
