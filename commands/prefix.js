const config = require('../config.json');
module.exports = {
config: {
name: "prefix",
aliases: [],
author: "Tawsif~",
role: 0,
category: "no prefix",
guide: `prefix`
},
onLoad: async function({ api, event, args }) {
if (args[0] === "prefix") {
api.sendMessage(`🌐 system prefix: ${config.prefix}\n🛸 your box chat prefix: ${config.prefix}`, event.threadID);
}
}
}
