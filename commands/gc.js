const axios = require('axios');
const fs = require('fs');
module.exports = {
config: {
	name: "gc",
	author: "Tawsif~",
	category: "image",
	countDown: 5,
	role: 0,
	guide: "<text> ++ <text> | reply | --user <uid> | --theme <theme number> | blank"
},
async execute({ api, event, args }) {
const prompt = args.join(" ");
if (!prompt) { return api.sendMessage("❌ | provide a prompt", event.threadID);
} 
let id = event.senderID;
if (event.messageReply) { id = event.messageReply.senderID;
} else if (prompt.match(/--user/)) { id = prompt.split("--user ")[1];
prompt = prompt.split("--user ")[0];
}
const name = (await api.getUserInfo(id))[id].name;
const avatarUrl = `https://graph.facebook.com/${id}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
let replyImage;
	api.setMessageReactionMqtt("⏳", event.messageID, event.threadID);
try {
		let url = `https://tawsifs-fakechat.onrender.com/image?theme=1&name=${encodeURIComponent(name)}&avatar=${encodeURIComponent(avatarUrl)}&text=${encodeURIComponent(prompt)}`;
if (event?.messageReply?.attachments[0]) { replyImage = event.messageReply.attachments[0].url;
url = `https://tawsifs-fakechat.onrender.com/image?theme=1&name=${encodeURIComponent(name)}&avatar=${encodeURIComponent(avatarUrl)}&text=${encodeURIComponent(prompt)}&replyImageUrl=${encodeURIComponent(replyImage)}`;
}
const response = await axios.get(url, { responseType: 'arraybuffer'});
const w = fs.writeFileSync('./fc.png', Buffer.from(response.data, 'binary'));

await api.sendMessage({
attachment: fs.createReadStream('./fc.png')
}, event.threadID, event.messageID);
	api.setMessageReactionMqtt("✅", event.messageID, event.threadID);
} catch (error) { api.sendMessage("❌ | " + error.message, event.threadID);
		}
	}
}
