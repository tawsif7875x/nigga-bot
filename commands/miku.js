const axios = require('axios');
const baseApiUrl = async () => {
  const base = await axios.get('https://raw.githubusercontent.com/Blankid018/D1PT0/main/baseApiUrl.json');
  return base.data.api;
};

module.exports = {
config: {
  name: "miku",
  aliases: ["baby", "bbe", "babe"],
  version: "6.9.0",
  author: "Dipto & Tawsif~",
  countDown: 0,
  role: 0,
  shortDescription: "better then all sim simi",
  category: "chat",
  guide: "miku <text>"
},
async execute({ api, event, args }) {
  const link = `${await baseApiUrl()}/baby`;
  const dipto = args.join(" ");
  const uid = event.senderID;
  try {
    if (!args[0]) {
      const ran = ["Bolo baby", "hum", "type help baby", "type !baby hi"];
      return api.sendMessage(ran[Math.floor(Math.random() * ran.length)], event.threadID, event.messageID);
    }

    const d = (await axios.get(`${link}?text=${dipto}&senderID=${uid}&font=1`)).data.reply;
    await api.sendMessage(d, event.threadID);
  } catch (error) {
    console.log(error.message);
    api.sendMessage("error: " + error.message, event.threadID, event.messageID);
  }
}
}
