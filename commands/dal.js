const axios = require('axios');
module.exports = {
config: {
	name: "dal",
	author: "Tawsif~ & Mahi APIs",
	category: "image",
	countDown: 5,
	role: 0,
	guide: "xl <prompt> --ar <ratio>"
},
async execute({ api, event, args }) {
let ratio = "1:1";
const prompt = args.join(" ");
if (!prompt) { return api.sendMessage("❌ | provide a prompt", event.threadID);
} else if (prompt.match(/--ar=/)) { ratio = prompt.split("--ar=")[1];
}
	api.setMessageReactionMqtt("⏳", event.messageID, event.threadID);
try {
const t = new Date().getTime();
		let url = `https://mahi-apis.onrender.com/api/daul?prompt=${encodeURIComponent(prompt)}&ratio=${ratio}`;
const response = await axios.get(url, {responseType: 'stream'});
const t2 = new Date().getTime();
await api.sendMessage({ body: `✅ | Here's your image ✨\n🕔 | Time taken: ${(t2-t)/1e3} seconds`,
attachment: response.data
}, event.threadID, event.messageID);
	api.setMessageReactionMqtt("✅", event.messageID, event.threadID);
} catch (error) { api.sendMessage("❌ | " + error.message, event.threadID);
		}
	}
}
