module.exports = {
  config: {
    name: "admin",
    aliases: ["admincp"],
    version: "1.0.0",
    author: "NexusTeam",
    countDown: 5,
    role: 2,
    shortDescription: "Bot admin commands",
    longDescription: "Manage bot settings and perform administrative actions",
    category: "admin",
    guide: "{prefix}admin [restart/ban/unban/maintenance/reload]"
  },

  async execute({ api, event, args, Users }) {
    const { threadID, senderID } = event;

    try {
      if (!args[0]) {
        return api.sendMessage("⚠️ Missing command argument!", threadID);
      }

      switch (args[0].toLowerCase()) {
        case "restart":
          await api.sendMessage("🔄 Bot is restarting...", threadID);
          process.exit(1);
          break;

        case "ban":
          const targetID = args[1];
          if (!targetID) {
            return api.sendMessage("⚠️ Please specify a user ID!", threadID);
          }
          await Users.setData(targetID, { banned: true });
          api.sendMessage(`✅ Banned user: ${targetID}`, threadID);
          break;

        case "unban":
          const userID = args[1];
          if (!userID) {
            return api.sendMessage("⚠️ Please specify a user ID!", threadID);
          }
          await Users.setData(userID, { banned: false });
          api.sendMessage(`✅ Unbanned user: ${userID}`, threadID);
          break;

        case "maintenance":
          global.maintenance = !global.maintenance;
          api.sendMessage(
            `🛠️ Maintenance mode: ${global.maintenance ? "ON" : "OFF"}`,
            threadID
          );
          break;

        case "reload":
          await api.sendMessage("🔄 Reloading commands...", threadID);
          global.client.commands.clear();
          global.client.events.clear();
          global.client.loadCommands();
          global.client.loadEvents();
          api.sendMessage("✅ Reloaded all commands and events!", threadID);
          break;

        default:
          api.sendMessage("⚠️ Invalid admin command!", threadID);
      }
    } catch (error) {
      console.error('[ADMIN COMMAND ERROR]:', error);
      return api.sendMessage("❌ An error occurred!", threadID);
    }
  }
};
