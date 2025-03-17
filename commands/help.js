const fs = require('fs');
const path = require('path');

module.exports = {
  config: {
    name: "help",
    aliases: ["menu", "cmds", "commands"],
    version: "1.1.0",
    author: "NexusTeam",
    countDown: 5,
    role: 0,
    shortDescription: "Display available commands",
    longDescription: "Show all available commands or detailed information about a specific command",
    category: "system",
    guide: "{prefix}help [command]"
  },
  
  execute: async function({ api, event, args, commands, prefix }) {
    try {
      const { threadID } = event;
      const commandName = args[0]?.toLowerCase();
      
      // Get permission level of user
      let permissionLevel = 0;
      try {
        if (global.permissionManager) {
          permissionLevel = await global.permissionManager.getUserRole(event.senderID);
        }
      } catch (err) {
        console.error("Error getting user permission:", err);
      }
      
      // Show details of a specific command
      if (commandName) {
        const command = commands.get(commandName);
        
        if (!command) {
          return api.sendMessage(`❌ Command "${commandName}" not found.\nUse "${prefix}help" to see all available commands.`, threadID);
        }
        
        // Role permission texts
        const roleText = {
          0: "👥 Everyone",
          1: "👑 Group Admin",
          2: "⚙️ Bot Admin",
          3: "⚡ Bot Owner"
        };
        
        // Format command details with fallbacks for undefined values
        const details = `╭─────༺ ❯❯❯ ༻─────╮\n` +
                        `   📝 Command: ${command.config.name}\n` +
                        `╰─────༺ ❮❮❮ ༻─────╯\n\n` +
                        `📋 Description: ${command.config.shortDescription || command.config.longDescription || "No description available"}\n` +
                        `🔧 Usage: ${command.config.guide?.replace(/{prefix}/g, prefix) || `${prefix}${command.config.name}`}\n` +
                        `📁 Category: ${command.config.category || "Uncategorized"}\n` +
                        `🔒 Permission: ${roleText[command.config.role] || roleText[0]}\n` +
                        (command.config.aliases?.length > 0 ? `🔄 Aliases: ${command.config.aliases.join(", ")}\n` : "") +
                        (command.config.countDown > 0 ? `⏳ Cooldown: ${command.config.countDown} seconds\n` : "");
        
        return api.sendMessage(details, threadID);
      }

      if (commandName === "update") {
        // Add detailed help for update command
        const updateUsageDetails = `
╭─────༺ Update Command ༻─────╮

📋 Usage:
  ${prefix}update [check/install/force]
  ${prefix}update from [owner] [repo]

🔍 Examples:
  ${prefix}update - Check for updates
  ${prefix}update force - Force update 
  ${prefix}update from Nexus-016 Nexus-Bot - Update from specific repo

💡 Tips:
  - Make sure your repo is valid
  - Create releases on GitHub for best experience
  - Use 'force' with caution
╰───────────────────────────╯`;

        return api.sendMessage(updateUsageDetails, threadID);
      }
      
      // Display command categories
      const categories = new Map();
      
      commands.forEach(cmd => {
        if (cmd.config.role > permissionLevel) return; // Skip commands the user doesn't have permission for
        
        const category = cmd.config.category?.toLowerCase() || "uncategorized";
        
        if (!categories.has(category)) {
          categories.set(category, []);
        }
        
        categories.get(category).push(cmd.config.name);
      });
      
      let msg = `╭───⋐ 📚 Command List ⋑───╮\n` + 
                `│ Use ${prefix}help <cmd> for details\n` +
                `╰─────────────────────╯\n\n`;
      
      // Sort categories and commands alphabetically
      const sortedCategories = Array.from(categories.keys()).sort();
      
      sortedCategories.forEach(category => {
        const emoji = getCategoryEmoji(category);
        const commands = categories.get(category).sort();
        
        msg += `${emoji} ${capitalizeFirstLetter(category)} (${commands.length}):\n`;
        msg += commands.map(cmd => `  ➜ ${prefix}${cmd}`).join("\n");
        msg += "\n\n";
      });
      
      msg += `⚠️ You can see ${commands.size - getCommandsForPermissionLevel(commands, permissionLevel)} more commands with higher permissions`;
      
      return api.sendMessage(msg, threadID);
    } catch (error) {
      console.error("Help command error:", error);
      return api.sendMessage("❌ An error occurred while processing the help command.", event.threadID);
    }
  }
};

// Helper function to get total commands for permission level
function getCommandsForPermissionLevel(commands, level) {
  let count = 0;
  commands.forEach(cmd => {
    if (cmd.config.role <= level) count++;
  });
  return count;
}

// Helper function to get emoji for category
function getCategoryEmoji(category) {
  const emojis = {
    'admin': '⚙️',
    'fun': '🎮',
    'game': '🎲',
    'group': '👥',
    'image': '🖼️',
    'media': '📷',
    'moderation': '🛡️',
    'money': '💰',
    'owner': '👑',
    'system': '🤖',
    'tool': '🔧',
    'utility': '🛠️',
    'uncategorized': '📁'
  };
  
  return emojis[category] || '📁';
}

// Helper function to capitalize first letter
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
