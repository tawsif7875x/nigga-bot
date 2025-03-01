const os = require('os');

module.exports = {
  config: {
    name: "info",
    aliases: ["botinfo", "status"],
    version: "2.0.0",
    author: "NexusTeam",
    countDown: 5,
    role: 0,
    shortDescription: "Show bot information",
    longDescription: "Display detailed information about the bot, system and configuration",
    category: "system",
    guide: "{prefix}info"
  },

  async execute({ api, event, Utils }) {
    const { threadID } = event;
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);

    const stats = {
      os: `${os.type()} ${os.release()}`,
      arch: os.arch(),
      cpu: os.cpus()[0].model,
      memory: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}/${Math.round(os.totalmem() / 1024 / 1024)} MB`,
      nodejs: process.version,
      uptime: `${hours}h ${minutes}m ${seconds}s`
    };

    return api.sendMessage({
      body: `📱 𝗡𝗘𝗫𝗨𝗦 𝗕𝗢𝗧 𝗜𝗡𝗙𝗢\n\n` +
            `Name: ${global.config.botName}\n` +
            `Version: ${this.config.version}\n` +
            `Author: ${this.config.author}\n\n` +
            `📊 𝗦𝗬𝗦𝗧𝗘𝗠 𝗜𝗡𝗙𝗢\n\n` +
            `OS: ${stats.os}\n` +
            `CPU: ${stats.cpu}\n` +
            `Memory: ${stats.memory}\n` +
            `Node.js: ${stats.nodejs}\n` +
            `Uptime: ${stats.uptime}\n\n` +
            `⚙️ 𝗖𝗢𝗡𝗙𝗜𝗚𝗨𝗥𝗔𝗧𝗜𝗢𝗡\n\n` +
            `Safe Mode: ${global.config.safeMode.enabled ? '✅' : '❌'}\n` +
            `Prefix: ${global.config.prefix}\n` +
            `Commands: ${api.commands.size}\n` +
            `Language: ${global.config.language}\n\n` +
            `Type ${global.config.prefix}help for commands list.`
    }, threadID);
  }
};
