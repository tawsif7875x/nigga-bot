const axios = require('axios');
module.exports = {
    config: {
        name: "4k",
        author: "Tawsif~ & Fahim APIs",
        category: "image",
        countDown: 5,
        role: 0,
        guide: "4k"
    },
    async execute({ api, event }) {
        if (!event.messageReply) {
            return api.sendMessage("Please reply to a message with an image.", event.threadID);
        }

        const imgUrl = event.messageReply.attachments[0].url;
        
        api.setMessageReactionMqtt("⏳", event.messageID, event.threadID);
        try {
            const t = new Date().getTime();
            const url = `https://smfahim.onrender.com/4k?url=${encodeURIComponent(imgUrl)}`;
            const response = await axios.get(url);
            const imageUrl = response.data.image;

            const response2 = await axios.get(imageUrl, { responseType: 'stream' });
            
            const t2 = new Date().getTime();
            await api.sendMessage({
                body: `✅ | Here's your image ✨\n🕔 | Time taken: ${(t2 - t) / 1000} seconds\nModel: ${response.data.modelName}`,
                attachment: response2.data
            }, event.threadID, event.messageID);
            api.setMessageReactionMqtt("✅", event.messageID, event.threadID);
        } catch (error) {
            console.error("Error occurred:", error);
            api.sendMessage("❌ | " + error.message, event.threadID);
        }
    }
}
