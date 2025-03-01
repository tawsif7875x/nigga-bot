const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const config = require('../config.json');

const events = new Map();

function loadEvents() {
  const eventFiles = fs.readdirSync(path.join(__dirname, '../events'))
    .filter(file => file.endsWith('.js'));

  for (const file of eventFiles) {
    try {
      const event = require(`../events/${file}`);
      if (event.config && event.config.name) {
        events.set(event.config.name, event);
        logger.info(`Loaded event: ${event.config.name}`);
      } else {
        logger.warn(`Skipped event ${file}: Missing config or name`);
      }
    } catch (error) {
      logger.error(`Failed to load event ${file}:`, error);
    }
  }

  return events;
}

async function handleEvent(api, message) {
  try {
    switch (message.type) {
      case 'event':
        handleGroupEvent(api, message);
        break;
      case 'message':
        handleMessageEvent(api, message);
        break;
      case 'message_reaction':
        handleReactionEvent(api, message);
        break;
      case 'presence':
        handlePresenceEvent(api, message);
        break;
      case 'typ':
        handleTypingEvent(api, message);
        break;
      case 'read_receipt':
        handleReadReceiptEvent(api, message);
        break;
    }
  } catch (error) {
    logger.error(`Error handling event: ${error.message}`);
  }
}

function handleGroupEvent(api, message) {
  const event = events.get('groupEvent');
  if (event) event.execute(api, message);
}

function handleMessageEvent(api, message) {
  const event = events.get('messageEvent');
  if (event) event.execute(api, message);
}

function handleReactionEvent(api, message) {
  const event = events.get('reactionEvent');
  if (event) event.execute(api, message);
}

function handlePresenceEvent(api, message) {
  const event = events.get('presenceEvent');
  if (event) event.execute(api, message);
}

function handleTypingEvent(api, message) {
  const event = events.get('typingEvent');
  if (event) event.execute(api, message);
}

function handleReadReceiptEvent(api, message) {
  const event = events.get('readReceiptEvent');
  if (event) event.execute(api, message);
}

module.exports = { loadEvents, handleEvent, events };
