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
const ms = (u % 1);

api.sendMessage(`${h} hrs ${m} min ${s}sec ${ms} ms`, event.threadID);
}
}
