const axios = require('axios');
const fs = require('fs');
module.exports = {
config: {
	name: "xl",
	author: "Tawsif~",
	category: "image",
	countDown: 5,
	role: 0,
},
async execute({ api, event, args }) {
const prompt = args.join(" ");
if (!prompt) { return api.sendMessage("❌ | provide a prompt", event.threadID);
}
	api.setMessageReactionMqtt("⏳", event.messageID, event.threadID);
try {
const t = new Date().getTime();
		const url = `https://tawsifs-xl.onrender.com/xl?prompt=${encodeURIComponent(prompt)}`;
const response = await axios.get(url);
	const imageUrl = response.data.imageUrl;
const response2 = await axios.get(imageUrl, { responseType: 'arraybuffer'});
const w = fs.writeFileSync('./xl.png', Buffer.from(response2.data, 'binary'));

const t2 = new Date().getTime();

await api.sendMessage({ body: `✅ | Here's your image ✨\n🕔 | Time taken: ${(t2-t)/1e3} seconds`,
attachment: fs.createReadStream('./xl.png')
}, event.threadID, event.messageID);
	api.setMessageReactionMqtt("✅", event.messageID, event.threadID);
} catch (error) { api.sendMessage("❌ | " + error.message, event.threadID);
		}
	}
}
