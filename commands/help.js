const config = require('../config.json');

module.exports = {
  config: {
    name: "help",
    aliases: ["menu", "h"],
    version: "1.0.0",
    author: "NexusTeam & Tawsif~",
    countDown: 5,
    role: 0,
    shortDescription: "Shows command list",
    longDescription: "Display all available commands or get info about a specific command",
    category: "system",
    guide: `${config.prefix}help [command]`
  },

  async execute({ api, event, args, commands }) {
    const { threadID } = event;
    const commandName = args[0]?.toLowerCase();

    try {
      const categories = new Map();
      commands.forEach(cmd => {
        const command = commands.get(commandName);
        const category = cmd.config.category;
        if (!categories.has(category)) {
          categories.set(category, new Set());
        }
        categories.get(category).add(cmd.config.name);
      });

      let helpMessage = '';
      for (const [category, cmds] of categories) {
        helpMessage += `╭──『 ${category} 』\n`;
        cmds.forEach(cmd => {
          helpMessage += `│ ♡${cmd}\n`;
        });
        helpMessage += '╰───────────◊';
      }

      helpMessage += `╭──『INFO』\n`;
      helpMessage += `│ Commands: ${commands.size}\n`;
      helpMessage += `│ ${config.prefix}help <cmd> for details\n`;
      helpMessage += `╰───────────◊`;

      // Adding three commands in a single line
      helpMessage += `\nQuick Access: ${commands.slice(0, 3).map(cmd => cmd.config.name).join(', ')}`;

      return api.sendMessage(helpMessage, threadID);
    } catch (error) {
      console.error('[HELP COMMAND ERROR]:', error);
      return api.sendMessage(`${error.message}`, threadID);
    }
  }
};
