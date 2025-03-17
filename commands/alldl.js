const axios = require('axios');
module.exports = {
config: {
	name: "alldl",
	author: "Tawsif~ & Fahim APIs",
	role: 0,
	guide: "alldl <url> | <reply>"
},
async execute({ api, event }) {
try {
let type = "sd";
if ((args[1]).match(/hd/)) { type = "hd";
}
let videoUrl;
if (args[0]) { videoUrl = args[0];
} else if (event.messageReply) { videoUrl = event.messageReply.body;
} else { return api.sendMessage("provide a valid URL", event.threadID);
}
api.setMessageReactionMqtt("⏳", event.messageID, event.threadID);
const apiUrl = `https://smfahim.onrender.com/download?url=${videoUrl}`
const response = (await axios.get(videoUrl)).`${type}`;
const v = await axios.get(response, {responseType: 'stream'});
await api.sendMessage({attachment: v.data }, event.threadID, event.messageID);
} catch (error) {
api.sendMessage("❌ | " + error.message, event.threadID, event.messageID);
		}
	}
}
