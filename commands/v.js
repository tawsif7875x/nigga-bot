const axios = require('axios');
module.exports = {
config: {
	name: "v",
	author: "Tawsif~",
	category: "Ai",
	countDown: 5,
	role: 0,
},
async execute({ api, event, args }) {
let prompt = args.join(" ");
if (!prompt) { prompt = "hi";
}
let url = `https://gemini-api-v4.onrender.com/gemini/vision?query=${prompt}&url=${encodeURIComponent(event.messageReply.attachments[0].url)}&type=video`;
if (!event.messageReply) { return api.sendMessage("reply to a video", event.threadID);
}
try {
const response = await axios.get(url);
const output = response.data.response;
await api.sendMessage(output, event.threadID, event.messageID);
} catch (error) { api.sendMessage("❌ | " + error.message, event.threadID);
		}
	}
}
