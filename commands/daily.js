module.exports = {
  config: {
    name: "daily",
    aliases: ["dailyreward"],
    version: "1.0.0",
    author: "NexusTeam",
    countDown: 86400,
    role: 0,
    shortDescription: "Get daily rewards",
    longDescription: "Collect your daily rewards and maintain your streak",
    category: "economy",
    guide: "{prefix}daily"
  },

  async execute({ api, event, Users }) {
    const { threadID, senderID } = event;
    try {
      const user = await Users.getData(senderID);
      const lastDaily = new Date(user.last_daily || 0);
      const now = new Date();
      const streak = now.getDate() === lastDaily.getDate() + 1 ? (user.daily_streak || 0) + 1 : 1;
      
      const reward = 100 * (1 + (streak * 0.1));
      await Users.updateMoney(senderID, reward);
      await Users.setData(senderID, {
        daily_streak: streak,
        last_daily: now
      });

      return api.sendMessage({
        body: `💰 Daily Reward Collected!\n\n` +
              `➤ Amount: $${reward}\n` +
              `➤ Streak: ${streak} days\n` +
              `➤ Bonus: +${(streak * 10)}%`,
        attachment: null
      }, threadID);
    } catch (error) {
      console.error(error);
      return api.sendMessage("❌ An error occurred.", threadID);
    }
  }
};
