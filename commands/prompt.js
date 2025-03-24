const axios = require('axios');

module.exports = {
    config: {
        name: "p",
        author: "Tawsif~ & Fahim Api's",
        category: "image",
        countDown: 5,
        role: 0,
        guide: "Reply to an image to generate a text prompt."
    },
    async execute({ api, event }) {
        if (!event.messageReply || !event.messageReply.attachments || event.messageReply.attachments.length === 0) {
            return api.sendMessage("⚠️ Please reply to a message containing an image.", event.threadID, event.messageID);
        }

        const imgUrl = event.messageReply.attachments[0].url;

        api.setMessageReactionMqtt("⏳", event.messageID, event.threadID);
        try {
            const url = `https://smfahim.onrender.com/prompt?url=${encodeURIComponent(imgUrl)}`;
            const response = await axios.get(url);

            if (!response.data.result) {
                throw new Error("No prompt data found in response.");
            }

            await api.sendMessage({
                body: `${response.data.result}`
            }, event.threadID, event.messageID);

            api.setMessageReactionMqtt("✅", event.messageID, event.threadID);
        } catch (error) {
            console.error("Error occurred:", error);
            api.sendMessage("❌ Error: " + error.message, event.threadID, event.messageID);
            api.setMessageReactionMqtt("⚠️", event.messageID, event.threadID);
        }
    }
};
