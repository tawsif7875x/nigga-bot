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
async function({ api, event, args }) {
  try {
  const t = event.body;
if (t.match(/prefix/)) {
api.sendMessage(`🌐 System prefix: ${config.prefix}\n🛸 Your box chat prefix: ${config.prefix}`, event.threadID);
}
  } catch (error) { api.sendMessage(`${error.message}`, event.threadID);
                  }
}
}
