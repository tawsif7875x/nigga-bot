const config = require('../config.json');

module.exports = {
  config: {
    name: "help",
    aliases: ["menu", "h"],
    version: "1.0.0",
    author: "NexusTeam",
    countDown: 5,
    role: 0,
    shortDescription: "Shows command list",
    longDescription: "Display all available commands or get info about a specific command",
    category: "system",
    guide: "{prefix}help [command]"
  },

  async execute({ api, event, args, commands }) {
    const { threadID } = event;
    const commandName = args[0]?.toLowerCase();

    try {
      if (commandName) {
        const command = commands.get(commandName);
        if (!command) {
          return api.sendMessage("❌ Command not found!", threadID);
        }

        return api.sendMessage({
          body: `╭─────༺♢༻─────╮\n` +
                `    📜 Command Info\n` +
                `╰─────༺♢༻─────╯\n\n` +
                `Name: ${command.config.name}\n` +
                `Version: ${command.config.version}\n` +
                `Role: ${command.config.role}\n` +
                `Category: ${command.config.category}\n` +
                `Cooldown: ${command.config.countDown}s\n\n` +
                `Description:\n${command.config.longDescription}\n\n` +
                `Usage:\n${command.config.guide}\n\n` +
                `╭─────༺♢༻─────╮\n` +
                `Author: ${command.config.author}\n` +
                `╰─────༺♢༻─────╯`
        }, threadID);
      }

      // Group commands by category
      const categories = new Map();
      commands.forEach(cmd => {
        const category = cmd.config.category.toUpperCase();
        if (!categories.has(category)) {
          categories.set(category, new Set());
        }
        categories.get(category).add(cmd.config.name);
      });

      let helpMessage = `╭─────༺♢༻─────╮\n`;
      helpMessage += `    📚 Command List\n`;
      helpMessage += `╰─────༺♢༻─────╯\n\n`;

      for (const [category, cmds] of categories) {
        helpMessage += `『 ${category} 』\n`;
        cmds.forEach(cmd => {
          helpMessage += `❯ ${cmd}\n`;
        });
        helpMessage += '\n';
      }

      helpMessage += `╭─────༺♢༻─────╮\n`;
      helpMessage += `Total Commands: ${commands.size}\n`;
      helpMessage += `Type ${config.prefix}help [cmd] for details\n`;
      helpMessage += `╰─────༺♢༻─────╯`;

      return api.sendMessage(helpMessage, threadID);

    } catch (error) {
      console.error('[HELP COMMAND ERROR]:', error);
      return api.sendMessage("❌ An error occurred!", threadID);
    }
  }
};
