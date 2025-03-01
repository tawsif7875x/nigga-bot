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
    const { type, threadID, attachments, mentions } = message;

    try {
      // Handle attachments
      if (attachments.length > 0) {
        for (const attachment of attachments) {
          switch (attachment.type) {
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
        const currentUserID = api.getCurrentUserID();
        if (mentions[currentUserID]) {
          api.sendMessage("How can I help you?", threadID);
        }
      }

      // Auto reactions based on keywords
      if (message.body) {
        const keywords = {
          'thank': '❤️',
          'good': '👍',
          'wow': '😮',
          'lol': '😄'
        };

        for (const [keyword, reaction] of Object.entries(keywords)) {
          if (message.body.toLowerCase().includes(keyword)) {
            api.setMessageReaction(reaction, message.messageID, null, true);
            break;
          }
        }
      }

      // Add experience for user activity
      if (message.senderID) {
        await Users.updateExp(message.senderID, 1);
      }

    } catch (error) {
      console.error('[MESSAGE EVENT ERROR]:', error);
    }
  }
};
