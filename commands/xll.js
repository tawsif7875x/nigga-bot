const axios = require('axios');
const fs = require('fs');
const tinyurl = require('tinyurl');
module.exports = {
config: {
	name: "xl",
	author: "Tawsif~",
	category: "image",
	countDown: 5,
	role: 0,
	guide: "xl <prompt> --ar=<ratio>"
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
		let url = `https://smfahim.onrender.com/xl31/freegen?prompt=${encodeURIComponent(prompt)}&ratio=${ratio}`;
const response = await axios.get(url);
	const imageUrl = response.data.imageUrl;
	const img = await tinyurl.shorten(imageUrl);
const response2 = await axios.get(imageUrl, { responseType: 'arraybuffer'});
const w = fs.writeFileSync('./xll.png', Buffer.from(response2.data, 'binary'));

const t2 = new Date().getTime();

await api.sendMessage({ body: `✅ | Here's your image ✨\n🕔 | Time taken: ${(t2-t)/1e3} seconds\nurl: ${img}`,
attachment: fs.createReadStream('./xll.png')
}, event.threadID, event.messageID);
	api.setMessageReactionMqtt("✅", event.messageID, event.threadID);
} catch (error) { api.sendMessage("❌ | " + error.message, event.threadID);
		}
	}
}
