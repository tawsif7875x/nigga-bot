module.exports = {
config: {
	name: "uid",
	author: "Tawsif~",
	role: 0,
},
async execute({ api, event }) {
let t = event.senderID;
if (event.messageReply) { t = event.messageReply.senderID; }
api.sendMessage(t, event.threadID, event.messageID);
	}
}
