module.exports = {
  config: {
    name: "test",
    aliases: ["t", "ping"],
    version: "1.0.0",
    author: "NexusTeam",
    countDown: 5,
    role: 0,
    shortDescription: "Test bot response",
    longDescription: "Test if the bot is responding and check response time",
    category: "system",
    guide: "{prefix}test"
  },

  async execute({ api, event }) {
    const { threadID, messageID } = event;
    const start = Date.now();
    
    return api.sendMessage("Testing bot response...", threadID, (err, info) => {
      if (err) return console.error(err);
      
      const ping = Date.now() - start;
      api.sendMessage(`✅ Bot is working!\nResponse time: ${ping}ms`, threadID, messageID);
    });
  }
};
