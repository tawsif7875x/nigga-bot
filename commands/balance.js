module.exports = {
  config: {
    name: "balance",
    aliases: ["bal", "money", "wallet"],
    version: "1.0.0",
    author: "NexusTeam",
    countDown: 5,
    role: 0,
    shortDescription: "Check your balance",
    longDescription: "View your current balance, experience, and level",
    category: "economy",
    guide: "{prefix}balance [@mention]"
  },

  async execute({ api, event, Users, args }) {
    const { threadID, senderID, mentions } = event;
    try {
      const targetID = Object.keys(mentions)[0] || senderID;
      const user = await Users.getData(targetID);
      const balance = user.money || 0;
      const exp = user.exp || 0;
      const level = Math.floor(Math.sqrt(exp / 100));

      return api.sendMessage({
        body: `💳 Balance Info\n\n` +
              `➤ User: ${user.name}\n` +
              `➤ Money: $${balance.toLocaleString()}\n` +
              `➤ Experience: ${exp.toLocaleString()}\n` +
              `➤ Level: ${level}`,
        attachment: null
      }, threadID);
    } catch (error) {
      console.error(error);
      return api.sendMessage("❌ An error occurred.", threadID);
    }
  }
};
