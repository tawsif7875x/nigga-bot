const axios = require('axios');
module.exports = {
config: {
	name: "flux",
	author: "Tawsif~",
	category: "image",
	countDown: 5,
	role: 0,
},
async execute({ api, event, args }) {
const prompt = args.join(" ");
if (!prompt) { return api.sendMessage("provide a prompt 🐧", event.threadID);
}
	api.setMessageReactionMqtt("⏳", event.messageID, event.threadID);
try {
const t = new Date().getTime();
		const url = `https://tawsif-fluxs.onrender.com/flux?prompt=${encodeURIComponent(prompt)}`;
const response = await axios.get(url, { responseType: 'stream' });
const t2 = new Date().getTime();

await api.sendMessage({ body: `✅ | Here's your image ✨\n🕔 | Time taken: ${(t2-t)/1e3} seconds`,
attachment: response.data
}, event.threadID, event.messageID);
	api.setMessageReactionMqtt("✅", event.messageID, event.threadID);
} catch (error) { api.sendMessage("❌ | " + error.message, event.threadID);
		}
	}
}
