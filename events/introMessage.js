const config = require('../config.json');

module.exports = {
  config: {
    name: "introMessage",
    version: "1.0.0",
    author: "NexusTeam",
    description: "Send welcome message when bot joins new group"
  },

  async execute({ api, event, Threads }) {
    const { threadID } = event;
    try {
      const threadInfo = await Threads.getData(threadID);
      const welcomeMessage = {
        body: `👋 𝗛𝗘𝗟𝗟𝗢 𝗘𝗩𝗘𝗥𝗬𝗢𝗡𝗘!\n\n` +
              `I am ${global.config.botName}, your friendly messenger bot.\n` +
              `Type ${global.config.prefix}help to see what I can do!\n\n` +
              `🔰 Some quick commands:\n` +
              `➤ ${global.config.prefix}info - Bot information\n` +
              `➤ ${global.config.prefix}help - Commands list\n` +
              `➤ ${global.config.prefix}rules - Group rules`
      };

      await api.sendMessage(welcomeMessage, threadID);

      // Save thread settings
      await Threads.setData(threadID, {
        settings: {
          sendWelcome: true,
          welcomeMessage: null,
          prefix: global.config.prefix
        }
      });

    } catch (error) {
      console.error('Intro message error:', error);
    }
  }
};
