const logger = require('../utils/logger');
const config = require('../config.json');

module.exports = {
  config: {
    name: "messageEvent",
    version: "1.0.0",
    author: "NexusTeam",
    description: "Handles all message events"
  },

  async execute({ api, message, Users }) {
    if (!message) {
      logger.warn("Received empty message event");
      return;
    }

    try {
      // Safely destructure message properties with defaults
      const {
        type = 'message',
        threadID = '',
        messageID = '',
        body = '',
        senderID = '',
        attachments = [],
        mentions = {}
      } = message;

      // Log message for debugging
      logger.info(`Processing message from ${senderID} in thread ${threadID}`);

      // Handle attachments if they exist
      if (attachments && attachments.length > 0) {
        for (const attachment of attachments) {
          const attachmentType = attachment?.type;
          switch (attachmentType) {
            case 'photo':
              // Process photos
              break;
            case 'video':
              // Process videos
              break;
            case 'audio':
              // Process audio
              break;
            case 'file':
              // Process files
              break;
            case 'share':
              // Process shared links
              break;
          }
        }
      }

      // Handle mentions
      if (mentions && Object.keys(mentions).length > 0) {
        const currentUserID = await api.getCurrentUserID();
        if (mentions[currentUserID]) {
          await api.sendMessage("How can I help you?", threadID, messageID);
        }
      }

      // Auto reactions based on keywords
      if (body) {
        const keywords = {
          'thank': '❤️',
          'good': '👍',
          'wow': '😮',
          'lol': '😄'
        };

        for (const [keyword, reaction] of Object.entries(keywords)) {
          if (body.toLowerCase().includes(keyword)) {
            await api.setMessageReaction(reaction, messageID, null, true);
            break;
          }
        }
      }

      // Add experience for user activity
      if (senderID && Users) {
        await Users.updateExp(senderID, 1);
      }

    } catch (error) {
      logger.error('[MESSAGE EVENT ERROR]:', error.message);
    }
  }
};
