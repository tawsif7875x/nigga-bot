const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

const events = new Map();

function loadEvents() {
  const eventFiles = fs.readdirSync(path.join(__dirname, '../events'))
    .filter(file => file.endsWith('.js'));

  events.clear(); // Clear existing events first

  for (const file of eventFiles) {
    try {
      delete require.cache[require.resolve(`../events/${file}`)];
      const event = require(`../events/${file}`);
      if (event.config && event.config.name) {
        events.set(event.config.name, event);
        logger.info(`Loaded event: ${event.config.name}`);
      }
    } catch (error) {
      logger.error(`Failed to load event ${file}: ${error.message}`);
    }
  }
}

async function handleEvent(api, event) {
  try {
    // Use global config if available, or fallback to empty object
    const config = global.config || {};
    
    // Execute each event handler
    for (const [name, handler] of events) {
      try {
        if (handler && typeof handler.execute === 'function') {
          // Wrap execution in try/catch to prevent one handler from breaking others
          await handler.execute({
            api,
            event,
            config
          });
        }
      } catch (handlerError) {
        logger.error(`Error in event handler ${name}:`, handlerError.message);
        // Continue with other handlers despite the error
      }
    }
  } catch (error) {
    logger.error('Error in event system:', error);
  }
}

module.exports = { loadEvents, handleEvent, events };
