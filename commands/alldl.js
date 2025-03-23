const axios = require('axios');
module.exports = {
config: {
	name: "alldl",
	author: "Tawsif~ & Fahim APIs",
	role: 0,
	guide: "alldl <url> <sd/hd> | <reply>"
},
async execute({ api, event, args }) {
try {
let type;
if (!args[1]) { type = "sd";
} else if ((args[1]).match(/hd/)) { type = "hd";
}
let videoUrl;
if (args[0]) { 
if ((args[0]).match(/com/)) { videoUrl = args[0];
} else { return api.sendMessage("provide or reply to a valid URL", event.threadID);
}
} else if (event.messageReply) { videoUrl = event.messageReply.body;
} else { return api.sendMessage("provide or reply to a valid URL", event.threadID);
}
api.setMessageReactionMqtt("⏳", event.messageID, event.threadID);
const apiUrl = `https://smfahim.onrender.com/download?url=${videoUrl}`;
const response = await axios.get(apiUrl);
const vUrl = response.data.links[type];
const v = await axios.get(vUrl, {responseType: 'stream'});
await api.sendMessage({body: `${response.data.title}\nQuality: ${type.toUpperCase()}`, attachment: v.data }, event.threadID, event.messageID);
} catch (error) {
api.sendMessage("❌ | " + error.message, event.threadID, event.messageID);
		}
	}
}
