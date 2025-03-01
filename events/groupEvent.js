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

  async execute({ api, event }) {
    if (!event || typeof event !== 'object') {
      logger.warn('Received invalid group event');
      return;
    }

    try {
      // Safely destructure with default values
      const {
        type = '',
        logMessageType = '',
        logMessageData = {},
        threadID = '',
        participantIDs = [],
        author = ''
      } = event;

      // Handle different event types
      switch (logMessageType || type) {
        case 'log:subscribe':
          if (!threadID || !logMessageData.addedParticipants) break;
          
          try {
            const threadInfo = await api.getThreadInfo(threadID);
            await dbManager.createGroup(threadID, threadInfo.threadName);

            for (const participant of logMessageData.addedParticipants) {
              await dbManager.createUser(participant.userFbId, participant.fullName);
              api.sendMessage({
                body: `Welcome ${participant.fullName} to the group! 👋`,
                mentions: [{
                  tag: participant.fullName,
                  id: participant.userFbId
                }]
              }, threadID);
            }
          } catch (err) {
            logger.error('Error handling new member:', err);
          }
          break;

        case 'log:unsubscribe':
          if (!threadID || !logMessageData.leftParticipantFbId) break;
          
          try {
            const userInfo = await api.getUserInfo(logMessageData.leftParticipantFbId);
            const name = userInfo[logMessageData.leftParticipantFbId]?.name || 'Member';
            api.sendMessage(`Goodbye ${name}! 👋`, threadID);
          } catch (err) {
            logger.error('Error handling member leave:', err);
          }
          break;

        case 'log:thread-name':
          if (!threadID || !logMessageData.name) break;
          
          try {
            await dbManager.updateGroupInfo(threadID, { name: logMessageData.name });
            api.sendMessage(`Group name changed to: ${logMessageData.name}`, threadID);
          } catch (err) {
            logger.error('Error handling name change:', err);
          }
          break;

        case 'log:thread-icon':
          if (!threadID) break;
          api.sendMessage(`Group icon has been updated! 🖼️`, threadID);
          break;

        case 'log:thread-color':
          if (!threadID) break;
          api.sendMessage(`Chat theme color has been changed! 🎨`, threadID);
          break;

        case 'log:thread-call':
          if (!threadID || !logMessageData.event) break;
          
          const callMessage = logMessageData.event === 'group_call_started' 
            ? `A group call has started! 📞`
            : `The group call has ended! 📞`;
          api.sendMessage(callMessage, threadID);
          break;
      }
    } catch (error) {
      logger.error('[GROUP EVENT ERROR]:', error);
    }
  }
};
