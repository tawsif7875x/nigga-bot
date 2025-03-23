const axios = require('axios');
module.exports = {
config: {
	name: "-4k",
	author: "Tawsif~",
	role: 0,
	guide: "-4k <reply>"
},
async execute({ api, event }) {
try {
let imageUrl;
if (event?.messageReply?.attachments[0]?.thumbnailUrl) { imageUrl = event.messageReply.attachments[0].thumbnailUrl;
} else { return api.sendMessage("reply to an image", event.threadID);
}
api.setMessageReactionMqtt("⏳", event.messageID, event.threadID);
const response = await axios.get(imageUrl, {responseType: 'stream'});
await api.sendMessage({body: "✅ | Here's your -4k image✨", attachment: response.data }, event.threadID, event.messageID);
} catch (error) {
api.sendMessage("❌ | " + error.message, event.threadID, event.messageID);
		}
	}
}
