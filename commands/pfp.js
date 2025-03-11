const axios = require('axios');
module.exports = {
config: {
	name: "pfp",
	author: "Tawsif~",
	role: 0,
	guide: "pfp <blank> | <reply> | <uid>"
},
async execute({ api, event, args }) {
const text = args[0];
let user = event.senderID;
if (!text) {
if (event.messageReply) {
user = event.messageReply.senderID;
	} 
} else { user = text;}
	try {
const avatar = `https://graph.facebook.com/${user}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
const response = await axios.get(avatar, {responseType: 'stream'});
await api.sendMessage({attachment: response.data }, event.threadID, event.messageID);
} catch (error) {
api.sendMessage("❌ | " + error.message, event.threadID, event.messageID);
		}
	}
}
