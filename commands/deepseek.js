const axios = require('axios');
module.exports = {
config: {
	name: "ds",
  aliases: ["deepseek"],
	author: "Tawsif~",
	category: "image",
	countDown: 5,
	role: 0,
},
async execute({ api, event, args }) {
let prompt = args.join(" ");
if (!prompt) { prompt = "hi";
}
	api.setMessageReactionMqtt("⏳", event.messageID, event.threadID);
try {
		const url = `https://tawsifs-deepseek.onrender.com/ai?prompt=${encodeURIComponent(prompt)}`;
const response = await axios.get(url);
const output = response.data.content;

await api.sendMessage(output, event.threadID, event.messageID);
	api.setMessageReactionMqtt("✅", event.messageID, event.threadID);
} catch (error) { api.sendMessage("❌ | " + error.message, event.threadID);
		}
	}
}
