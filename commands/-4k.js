const axios = require('axios');
module.exports = {
config: {
	name: "-4k",
	author: "Tawsif~",
	role: 0,
	guide: "-4k <reply>"
},
async execute({ api, event }) {
const imageUrl = event.messageReply.attachments[0].thumbnailUrl;
if (!event?.messageReply?.attachments[0]?.thumbnailUrl) { return api.sendMessage("reply to an image", event.threadID);
}
api.setMessageReactionMqtt("⏳", event.messageID, event.threadID);
setTimeout(() => {
const response = await axios.get(imageUrl, {responseType: 'stream'});
await api.sendMessage({body: "✅ | Here's your image✨", attachment: response.data }, event.threadID, event.messageID);
}, 5000);
} catch (error) {
api.sendMessage("❌ | " + error.message, event.threadID, event.messageID);
		}
	}
}
