const axios = require('axios');
const fs = require('fs');
module.exports = {
config: {
	name: "fx",
	author: "Tawsif~ & ArchDevs APIs",
	category: "image",
	countDown: 5,
	role: 0,
	guide: "fx <effect index> | <reply>"
},
async execute({ api, event, args }) {
if (!event.messageReply) { return api.sendMessage("❌ | reply to an image", event.threadID);
}
const imgUrl = event.messageReply.attachments[0].url;
let modelNum = parseInt(args[0]) || 1;
if (modelNum < 1 || modelNum > 41) { return api.sendMessage("❌ | invalid effect index number", event.threadID);
}
	api.setMessageReactionMqtt("⏳", event.messageID, event.threadID);
try {
const t = new Date().getTime();
		const url = `https://www.arch2devs.ct.ws/api/imageFx?effectIndex=${modelNum}&imageUrl=${imgUrl}`;
const response = await axios.get(url, {responseType: 'arraybuffer'});
	
const w = fs.writeFileSync('./art.png', Buffer.from(response.data, 'binary'));

const t2 = new Date().getTime();

await api.sendMessage({ body: `✅ | Here's your image ✨\n🕔 | Time taken: ${(t2-t)/1e3} seconds`,
attachment: fs.createReadStream('./art.png')
}, event.threadID, event.messageID);
	api.setMessageReactionMqtt("✅", event.messageID, event.threadID);
} catch (error) { api.sendMessage("❌ | " + error.message, event.threadID);
		}
	}
}
