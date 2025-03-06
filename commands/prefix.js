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
   async execute({ api, event, args }) {
const p = args[0];
     if (!p) { return api.sendMessage("provide a new prefix to change the current one", event.threadID);
             } else { config.prefix = `${p}`; && api.sendMessage(`✅ | successfully changed prefix to: ${p}`, event.threadID);
    }
  }
}
