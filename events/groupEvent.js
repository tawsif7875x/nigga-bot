const logger = require('../utils/logger');
const dbManager = require('../modules/dbManager');
const config = require('../config.json');

module.exports = {
  config: {
    name: "groupEvent",
    version: "1.0.0",
    author: "NexusTeam",
    description: "Handles all group-related events"
  },

  async execute({ api, event, Users, Threads }) {
    const { logMessageType, logMessageData, threadID } = event;

    try {
      switch (logMessageType) {
        case 'log:subscribe':
          const addedParticipants = logMessageData.addedParticipants;
          for (const participant of addedParticipants) {
            await Users.addUser(participant.userFbId, participant.fullName);
            const welcomeMessage = {
              body: `Welcome ${participant.fullName} to the group! 👋`,
              mentions: [{
                tag: participant.fullName,
                id: participant.userFbId
              }]
            };
            api.sendMessage(welcomeMessage, threadID);
          }
          break;

        case 'log:unsubscribe':
          const leftParticipantFbId = logMessageData.leftParticipantFbId;
          const user = await Users.getData(leftParticipantFbId);
          api.sendMessage(
            `Goodbye ${user.name}! 👋`,
            threadID
          );
          break;

        case 'log:thread-name':
          const newName = logMessageData.name;
          await Threads.updateInfo(threadID, { name: newName });
          api.sendMessage(
            `Group name changed to: ${newName}`,
            threadID
          );
          break;

        case 'log:thread-icon':
          api.sendMessage(
            `Group icon has been updated! 🖼️`,
            threadID
          );
          break;

        case 'log:thread-color':
          api.sendMessage(
            `Chat theme color has been changed! 🎨`,
            threadID
          );
          break;

        case 'log:thread-call':
          if (logMessageData.event === 'group_call_started') {
            api.sendMessage(
              `A group call has started! 📞`,
              threadID
            );
          } else if (logMessageData.event === 'group_call_ended') {
            api.sendMessage(
              `The group call has ended! 📞`,
              threadID
            );
          }
          break;
      }
    } catch (error) {
      console.error('[GROUP EVENT ERROR]:', error);
    }
  }
};
