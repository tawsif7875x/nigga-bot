const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const config = require('../config.json');

const commands = new Map();
const cooldowns = new Map();

function loadCommands() {
  const commandFiles = fs.readdirSync(path.join(__dirname, '../commands'))
    .filter(file => file.endsWith('.js'));

  commands.clear(); // Clear existing commands first

  for (const file of commandFiles) {
    try {
      delete require.cache[require.resolve(`../commands/${file}`)]; // Clear require cache
      const command = require(`../commands/${file}`);
      
      // Only add command if it's not already registered
      if (!commands.has(command.config.name)) {
        commands.set(command.config.name, command);
        logger.info(`Loaded command: ${command.config.name} [${command.config.category}]`);
      }
    } catch (error) {
      logger.error(`Failed to load command ${file}:`+ error.message, error);
    }
  }

  return commands;
}

async function handleCommand(api, event) {
  const { body, senderID, threadID } = event;
  const args = body.slice(config.prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  const command = commands.get(commandName);
  if (!command) return;

  // Check user permissions
  if (command.config.role > 0) {
    const isAdmin = senderID === config.botAdminUID;
    if (!isAdmin) {
      return api.sendMessage("⚠️ You don't have permission to use this command.", threadID);
    }
  }
  const axios = require('axios');
 async function getStreamFromURL(url = "", pathName = "", options = {}) {
	if (!options && typeof pathName === "object") {
		options = pathName;
		pathName = "";
	}
	try {
		if (!url || typeof url !== "string")
			throw new Error(`The first argument (url) must be a string`);
		const response = await axios({
			url,
			method: "GET",
			responseType: "stream",
			...options
		});
		if (!pathName)
			pathName = "n.png"
		response.data.path = pathName;
		return response.data;
	}
	catch (err) {
		throw err;
	}
} 
	function msg(api, event, getStreamFromURL) {     return {         send: async (form, callback) => api.sendMessage(form, event.threadID, callback),         reply: async (form, callback) => api.sendMessage(form, event.threadID, callback, event.messageID),         unsend: async (messageID, callback) => api.unsendMessage(messageID, callback),       
				stream:  async function(text, url, type) {
  if (text.startsWith("http") && !url) {
    return api.sendMessage({ attachment: await getStreamFromURL(text, url || "n.png") }, event.threadID, event.messageID);
  } else if (!url) {
    return api.sendMessage(text, event.threadID, event.messageID);
  } else if (text && url && url.startsWith("http")) {
    return api.sendMessage({ body: text, attachment: await getStreamFromURL(url, type || "n.png") }, event.threadID, event.messageID);
  } else {
    return null; 
  }
			     },        reaction: async (emoji, messageID, callback) => api.setMessageReaction(emoji, messageID, callback, true),         err: async (err) => sendMessageError(err),         error: async (err) => sendMessageError(err)     }; }  const message = msg(api, event, getStreamFromURL);

  // Check cooldown
  const timestamps = cooldowns.get(command.config.name);
  if (timestamps) {
    const now = Date.now();
    const cooldownAmount = (command.config.countDown || 3) * 1000;
    const timestamp = timestamps.get(senderID);

    if (timestamp) {
      const expirationTime = timestamp + cooldownAmount;
      if (now < expirationTime) {
        const timeLeft = (expirationTime - now) / 1000;
        return api.sendMessage(
          `⏳ Please wait ${timeLeft.toFixed(1)} more seconds before using ${command.config.name} again.`,
          threadID
        );
      }
    }
  } else {
    cooldowns.set(command.config.name, new Map());
  }

  // Set cooldown
  cooldowns.get(command.config.name).set(senderID, Date.now());

  // Execute command
  try {
    await command.execute({
      api,
      event,
      args,
      message,
      commands,
      getStreamFromURL,
      prefix: config.prefix,
      Users: global.Users,
      Threads: global.Threads
    });
  } catch (error) {
    logger.error(`Error executing ${command.config.name}:`, error);
    api.sendMessage("❌ | " + error.message, threadID);
  }
}

module.exports = { loadCommands, handleCommand, commands };
