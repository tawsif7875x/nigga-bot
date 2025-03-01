const dbManager = require('../modules/dbManager');
const config = require('../config.json');
const logger = require('../utils/logger');

module.exports = {
  config: {
    name: "adminNoti",
    version: "1.0.0",
    author: "NexusTeam",
    description: "Notify admin about new groups and users"
  },

  async execute({ api, event, Users, Threads }) {
    const { threadID, logMessageData } = event;
    try {
      // Get thread info
      const threadInfo = await Threads.getData(threadID);
      const threadName = threadInfo.name || "Unnamed Group";

      // Process added participants
      const participants = logMessageData.addedParticipants;
      for (const participant of participants) {
        const userId = participant.userFbId;
        const userName = participant.fullName;
        const role = participant.isGroupAdmin ? 1 : 0;

        // Add user to database
        await Users.addUser(userId, userName, role);
      }

      // Notify admin
      const adminMessage = {
        body: `📢 𝗡𝗘𝗪 𝗚𝗥𝗢𝗨𝗣 𝗔𝗗𝗗𝗘𝗗\n\n` +
              `Name: ${threadName}\n` +
              `ID: ${threadID}\n` +
              `Members: ${participants.length}\n\n` +
              `New users have been added to database.`
      };

      await api.sendMessage(adminMessage, global.config.botAdminUID);

      // Set bot nickname
      await api.changeNickname(
        global.config.botName,
        threadID,
        api.getCurrentUserID()
      );

    } catch (error) {
      console.error('Admin notification error:', error);
    }
  }
};
