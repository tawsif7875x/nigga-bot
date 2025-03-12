const axios = require('axios');
const fs = require('fs');
module.exports = {
config: {
	name: "fx",
	author: "Tawsif~ & API unknown",
	category: "image",
	countDown: 5,
	role: 0,
	guide: "fx <index num> | <reply>"
},
async execute({ api, event, args }) {
const imgUrl = event.messageReply.attachments[0].url;
if (!event.messageReply) { return api.sendMessage("❌ | reply to an image", event.threadID);
}
let modelNum = parseInt(args[0]);
if (!modelNum) { modelNum = 1;
} else if (modelNum < 1 || modelNum > 41) { return api.sendMessage("❌ | invalid effect index number", event.threadID);
}
	api.setMessageReactionMqtt("⏳", event.messageID, event.threadID);
try {
const t = new Date().getTime();
		const url = `https://www.arch2devs.ct.ws/api/imageFx?effectIndex=${modelNum}&imageUrl=${encodeURIComponent(imgUrl)}`;
const response = await axios.get(url);
	const imageUrl = response.data.imageUrl;
const response2 = await axios.get(imageUrl, { responseType: 'arraybuffer'});
const w = fs.writeFileSync('./art.png', Buffer.from(response2.data, 'binary'));

const t2 = new Date().getTime();

await api.sendMessage({ body: `✅ | Here's your image ✨\n🕔 | Time taken: ${(t2-t)/1e3} seconds\nurl: ${imageUrl}`,
attachment: fs.createReadStream('./art.png')
}, event.threadID, event.messageID);
	api.setMessageReactionMqtt("✅", event.messageID, event.threadID);
} catch (error) { api.sendMessage("❌ | " + error.message, event.threadID);
		}
	}
}
