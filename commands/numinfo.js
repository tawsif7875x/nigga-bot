const dipto = "https://www.noobs-api.rf.gd/dipto";
const axios = require("axios");

module.exports = {
  config: {
    name: "numinfo",
    author: "Dipto",
    role: 0,
    category: "Ai",
    guide: "numinfo <number>",
    version: "1.0.0"
  },

  async execute({ api, event, args }) {
    if (!args[0]) return api.sendMessage("⚠️  provide a number", event.threadID, event.messageID);

    let number = args[0]?.startsWith("01") ? "88" + args[0] : args[0];

    api.setMessageReactionMqtt("⌛", event.messageID, event.threadID);

    try {
      let { data } = await axios.get(`${dipto}/numinfo?number=${number}`);
      let msg = { body: data.info.map(i => `Name: ${i.name} \nType: ${i.type || "Not found"}`).join("\n") };

      if (data.image) 
        msg.attachment = (await axios.get(data.image, { responseType: "stream" })).data;

      api.sendMessage(msg, event.threadID, event.messageID);
api.setMessageReactionMqtt("✅", event.messageID, event.threadID);
    } catch (e) {
      api.sendMessage(`❌ Error: ${e.message}`, event.threadID, event.messageID);
      console.log(e);
    }
  }
};
