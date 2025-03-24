module.exports = {
config: {
name: "upt",
aliases: ["up"," uptime"],
author: "Tawsif~",
role: 0,
category: "system",
guide: `upt`
},
async execute({ api, event }) {
      const uptime = process.uptime();

      const hours = Math.floor(uptime / 3600);
      const minutes = Math.floor((uptime / 60) % 60);
      const seconds = Math.floor(uptime % 60);

      const uptimeString = `${hours}Hrs ${minutes}min ${seconds}sec`;
      try {
    const edits = ["🕝","🕟","🕡","🕢",`${uptimeString}`];
let msg = await api.sendMessage("🕧", event.threadID);

edits.forEach((d, i) => setTimeout(() => api.editMessage(`${d}`, msg.messageID), 750 * i));
    } catch (error) {
      console.error(error);
      api.sendMessage("An error occurred while retrieving data.", event.threadID);
    }
  }
};
