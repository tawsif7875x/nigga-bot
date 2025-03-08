const axios = require('axios');
const fs = require('fs');
module.exports = {
config: {
	name: "art",
	author: "Tawsif~ & Siam APIs",
	category: "image",
	countDown: 5,
	role: 0,
	guide: "art <model num>"
},
async execute({ api, event, args }) {
const imgUrl = event.messageReply.attachments[0].url;
if (!event.messageReply) { return api.sendMessage("reply something", event.threadID);
}
let modelNum = args[0];
if (!modelNum) { modelNum = 1;}
} else if ((modelNum < 1) && (modelNum > 3)) { return api.sendMessage("invalid model number", event.threadID);
}
	api.setMessageReactionMqtt("⏳", event.messageID, event.threadID);
try {
const t = new Date().getTime();
		const url = `https://simo-aiart.onrender.com/generate?imageUrl=${encodeURIComponent(imgUrl)}&modelNumber=${encodeURIComponent(modelNum)}`;
const response = await axios.get(url);
	const imageUrl = response.data.imageUrl;
const response2 = await axios.get(imageUrl, { responseType: 'arraybuffer'});
const w = fs.writeFileSync('./art.png', Buffer.from(response2.data, 'binary'));

const t2 = new Date().getTime();

await api.sendMessage({ body: `✅ | Here's your image ✨\n🕔 | Time taken: ${(t2-t)/1e3} seconds\nurl: ${imageUrl}`,
attachment: fs.createReadStream('./art.png')
}, event.threadID, event.messageID);
	api.setMessageReactionMqtt("✅", event.messageID, event.threadID);
} catch (error) { api.sendMessage("❌ | " + error.message, event.threadID);
		}
	}
}
