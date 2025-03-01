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
          body: `📝 COMMAND INFO\n\n` +
                `Name: ${command.config.name}\n` +
                `Version: ${command.config.version}\n` +
                `Role: ${command.config.role}\n` +
                `Category: ${command.config.category}\n` +
                `Cooldown: ${command.config.countDown}s\n` +
                `Description: ${command.config.longDescription}\n` +
                `Usage: ${command.config.guide}`
        }, threadID);
      }

      // Group commands by category
      const categories = new Map();
      commands.forEach(cmd => {
        const category = cmd.config.category;
        if (!categories.has(category)) {
          categories.set(category, []);
        }
        categories.get(category).push(cmd.config.name);
      });

      let helpMessage = "📚 COMMAND LIST\n\n";
      for (const [category, cmds] of categories) {
        helpMessage += `『 ${category.toUpperCase()} 』\n`;
        helpMessage += cmds.map(cmd => `❯ ${cmd}`).join("\n");
        helpMessage += "\n\n";
      }

      return api.sendMessage(helpMessage, threadID);

    } catch (error) {
      console.error('[HELP COMMAND ERROR]:', error);
      return api.sendMessage("❌ An error occurred!", threadID);
    }
  }
};
