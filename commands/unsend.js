module.exports = {
config: {
	name: "unsend",
	author: "Tawsif~",
	category: "box chat",
	role: 0,
},
async execute({ api, event }) {
const botID = api.getCurrentUserID();
if (event.messageReply && event.messageReply.senderID === botID ) { api.unsendMessage(event.messageReply.messageID);
} else { api.sendMessage("reply to the message you want to unsend", event.threadID);}
	}
}
