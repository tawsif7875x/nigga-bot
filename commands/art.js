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
        if (!event.messageReply) {
            return api.sendMessage("Please reply to a message with an image.", event.threadID);
        }

        const imgUrl = event.messageReply.attachments[0].url;
        let modelNum = parseInt(args[0]) || 1;

        if (modelNum < 1 || modelNum > 19) {
            return api.sendMessage("Invalid model number. Please choose between 1 and 19", event.threadID);
        }

        api.setMessageReactionMqtt("⏳", event.messageID, event.threadID);
        try {
            const t = new Date().getTime();
            const url = `https://simo-aiart.onrender.com/generate?imageUrl=${encodeURIComponent(imgUrl)}&modelNumber=${encodeURIComponent(modelNum)}`;
            const response = await axios.get(url);
            const imageUrl = response.data.imageUrl;

            const response2 = await axios.get(imageUrl, { responseType: 'arraybuffer' });
            fs.writeFileSync('./art.png', Buffer.from(response2.data, 'binary'));

            const t2 = new Date().getTime();
            await api.sendMessage({
                body: `✅ | Here's your image ✨\n🕔 | Time taken: ${(t2 - t) / 1000} seconds\nModel: ${response.data.modelName}`,
                attachment: fs.createReadStream('./art.png')
            }, event.threadID, event.messageID);
            api.setMessageReactionMqtt("✅", event.messageID, event.threadID);
        } catch (error) {
            console.error("Error occurred:", error);
            api.sendMessage("❌ | " + error.message, event.threadID);
        }
    }
}
