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
if (!prompt) { return api.sendMessage(" provide a prompt 🐧", event.threadID);
}
try {
const url = `https://tawsif-fluxs.onrender.com/flux?prompt=${encodeURIComponent(prompt)}`;
const response = await axios.get(url, { responseType: 'stream' });
await api.sendMessage({ body: "✅ | image generated successfully",
attachment: response.data
}, event.threadID, event.messageID);
} catch (error) { api.sendMessage("❌ | " + error.message, event.threadID);
		}
	}
}
