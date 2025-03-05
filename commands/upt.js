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
const u = process.uptime();
const h = Math.floor(u/3600);
const m = Math.floor((u/60) % 60);
const s = Math.floor(u % 60);
api.sendMessage(`${h} Hrs ${m} Min ${s} Sec`, event.threadID);
}
}
