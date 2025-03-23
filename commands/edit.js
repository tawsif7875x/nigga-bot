module.exports = {
config: {
	name: "edit",
	author: "Tawsif~",
	category: "box chat",
	role: 0,
guide: "{prefix}edit <text> | reply "
},
async execute({ api, event, args }) {
const text = args.join(" ");
const botID = api.getCurrentUserID();
if (event.messageReply && event.messageReply.senderID === botID ) { api.editMessage(`${text}`, event.messageReply.messageID);
} else { api.sendMessage("reply to the message you want to edit", event.threadID);}
	}
}
