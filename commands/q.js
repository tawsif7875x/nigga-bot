const axios = require('axios');
const fs = require('fs');
module.exports = {
  config: {
    name: "q",
    aliases: ["fchat", "fakec"],
    version: "1.0",
    role: 1,
    author: "Tawsif~ & Dipto APIs",
    description: "Get a fake chat of user",
    category: "fun",
    countDown: 10,
  },
  
  async execute({ event, api, args }) {
try {
      const userText = args.join(" ");
      const uid1 = event.senderID;
      let uid;
if (event.messageReply) { uid = event.messageReply.senderID;
} else { uid = uid1;
}

      const avatarUrl = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
      const userName = (await api.getUserInfo(uid))[uid].name;
      const ci = event?.messageReply?.attachments[0]?.url;

      let chatImageUrl = ci 
        ? `https://www.noobs-api.rf.gd/dipto/fbfakechat?name=${userName}&dp=${encodeURIComponent(avatarUrl)}&text=${userText}&chatimg=${encodeURIComponent(ci)}`
        : `https://www.noobs-api.rf.gd/dipto/fbfakechat?name=${userName}&dp=${encodeURIComponent(avatarUrl)}&text=${userText}`;

      const response = await axios.get(chatImageUrl, { responseType: 'arraybuffer' });
     const writer = fs.writeFileSync("./q.png", Buffer.from(response.data, 'binary'));
      await api.sendMessage({ attachment: fs.createReadStream("./q.png")
}, event.threadID, event.messageID);
} catch (error) { 
      api.sendMessage("❌ |" + error.message, event.threadID, event.messageID);
    }
  }
};
