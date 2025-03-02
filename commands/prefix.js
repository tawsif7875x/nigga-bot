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
onCall: async function({ api, event, args }) {
  const t = args[0];
if (t === "prefix") {
api.sendMessage(`🌐 System prefix: ${config.prefix}\n🛸 Your box chat prefix: ${config.prefix}`, event.threadID);
}
}
}
