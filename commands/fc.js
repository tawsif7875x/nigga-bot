const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

module.exports = {
    config: {
        name: "fc",
        aliases: [],
        author: "Tawsif~",
        role: 0,
        category: "system",
        guide: `fc text`
    },
    async execute({ api, event, args }) {
        try {
            async function loadImageWithErrorHandling(imagePath) {
                try {
                    return await loadImage(imagePath);
                } catch (error) {
                    console.error(`Error loading image: ${imagePath}`, error);
                    throw new Error("Failed to load image.");
                }
            }

            async function drawTheme(ctx, themePath, h) {
                const img = await loadImageWithErrorHandling(themePath);
                // Drawing logic remains unchanged...
            }

            // Other functions remain unchanged...

            async function generateChatImage() {
                const canvas = createCanvas(1000, 600);
                const ctx = canvas.getContext('2d');
                const texts = ["Hello", "bro", "I'm gay", "hhhh I'm not kidding"];
                const themePath = path.join(__dirname, "pizza.png");

                const avatarUrl = await usersData.getAvatarUrl(event.messageReply.senderID);
                const name = await usersData.getName(event.messageReply.senderID);
                const totalBubbleHeight = drawMultipleChatBubbles(ctx, texts, 140, 50, null, 2);
                const h = totalBubbleHeight + 130;

                await drawTheme(ctx, themePath, h);
                drawMultipleChatBubbles(ctx, texts, 140, 50, null, 2);

                const profileY = h - 75;
                await drawProfile(ctx, avatarUrl, 80, profileY, 80);

                ctx.font = "35px sans-serif";
                ctx.fillStyle = "#848482";
                ctx.fillText(name.split(" ")[0], 180, 10);

                const pngStream = canvas.createPNGStream();
                pngStream.path = "fc.png";
                api.sendMessage({ attachment: pngStream }, event.threadID);
            }

            generateChatImage();
        } catch (error) {
            console.error(error);
            api.sendMessage("❌ | " + error.message, event.threadID);
        }
    }
};
