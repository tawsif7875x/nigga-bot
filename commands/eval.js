const config = require('../config.json');
module.exports = {
  config: {
    name: "prefix",
    aliases: [],
    author: "Tawsif~",
    role: 0,
    category: "no prefix",
    guide: "prefix"
  },
  onChat: async function execute({ api, event, args }) {
    if (event.body.match(/prefix/)) {
      api.sendMessage(`🌐 System prefix: ${config.prefix}\n🛸 Your box chat prefix: ${config.prefix}`, event.threadID);
    }
  }
}
