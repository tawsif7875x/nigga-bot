const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');async function loadFetch() {
  const { default: fetch } = await import('node-fetch');
  return fetch;
}

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
        const fetch = await loadFetch();
        try {
            async function drawTheme(ctx, themeUrl, h) {
                const img = await loadImage(themeUrl);
                const width = 1000;
                const height = h;

                ctx.canvas.width = width;
                ctx.canvas.height = height;

                ctx.clearRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0, width, height);
            }

            function drawChatBubble(ctx, text, x, y, zoomFactor, leftCornerTopRadius = 28 * 2, leftCornerBottomRadius = 28 * 2) {
                const padding = 13 * zoomFactor;
                const lineHeight = 60;
                let bubbleRadius = 28 * zoomFactor;

                if (text.length <= 8) {
                    bubbleRadius -= 5;
                }

                const fontSize = 24 * zoomFactor;
                ctx.font = `${fontSize}px sans-serif`;

                const maxWidth = ctx.canvas.width * 0.6;
                const words = text.split(' ');
                let lines = [];
                let currentLine = "";

                words.forEach(word => {
                    const testLine = currentLine + word + " ";
                    const testWidth = ctx.measureText(testLine).width;
                    if (testWidth > maxWidth && currentLine !== "") {
                        lines.push(currentLine);
                        currentLine = word + " ";
                    } else {
                        currentLine = testLine;
                    }
                });
                lines.push(currentLine.trim());

                const bubbleWidth = Math.max(
                    ctx.measureText(lines.reduce((longest, line) => longest.length > line.length ? longest : line)).width + padding * 2,
                    150
                );
                const bubbleHeight = lines.length * lineHeight + padding * 1.6;

                const textStartX = x + padding;
                const textStartY = y + padding + fontSize;

                ctx.beginPath();
                ctx.moveTo(x + bubbleRadius, y);
                ctx.lineTo(x + bubbleWidth - bubbleRadius, y);
                ctx.quadraticCurveTo(x + bubbleWidth, y, x + bubbleWidth, y + bubbleRadius);
                ctx.lineTo(x + bubbleWidth, y + bubbleHeight - bubbleRadius);
                ctx.quadraticCurveTo(x + bubbleWidth, y + bubbleHeight, x + bubbleWidth - bubbleRadius, y + bubbleHeight);
                ctx.lineTo(x + leftCornerBottomRadius, y + bubbleHeight);
                ctx.quadraticCurveTo(x, y + bubbleHeight, x, y + bubbleHeight - leftCornerBottomRadius);
                ctx.lineTo(x, y + leftCornerTopRadius);
                ctx.quadraticCurveTo(x, y, x + leftCornerTopRadius, y);
                ctx.closePath();

                ctx.fillStyle = "#27221C";
                ctx.fill();

                ctx.fillStyle = "#ffffff";
                ctx.textBaseline = "top";

                lines.forEach((line, i) => {
                    ctx.fillText(line, textStartX, textStartY + i * lineHeight);
                });

                return bubbleHeight;
            }

            async function drawProfile(ctx, avatarUrl, x, y, size) {
                const avatar = await loadImage(avatarUrl);
                const squareSize = Math.min(avatar.width, avatar.height);
                const radius = size / 2;

                const startX = (avatar.width - squareSize) / 2;
                const startROY = (avatar.height - squareSize) / 2;

                ctx.save();
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.clip();
                ctx.drawImage(avatar, startX, startROY, squareSize, squareSize, x - radius, y - radius, size, size);
                ctx.restore();
            }

            function drawMultipleChatBubbles(ctx, texts, x, startY, zoomFactor = 1) {
                let currentY = startY;
                let totalHeight = 0;

                texts.forEach((text, index) => {
                    const isSingleBubble = texts.length < 2;
                    let firstBubble = 0;
                    let lastBubble = texts.length - 1;

                    let TCR = 28 * 2;
                    let BCR = 28 * 2;
                    if (!isSingleBubble && index === firstBubble) {
                        BCR = 5;
                    } else if (!isSingleBubble && index === lastBubble) {
                        TCR = 5;
                    } else if (!isSingleBubble) {
                        TCR = 5;
                        BCR = 5;
                    }
                    const bubbleHeight = drawChatBubble(ctx, text, x, currentY, zoomFactor, TCR, BCR);
                    currentY += bubbleHeight + 6;
                    totalHeight += bubbleHeight;
                });

                return totalHeight;
            }

            async function generateChatImage() {
                // Use input text if provided, otherwise use default
                const texts = args.length > 0 ? args.join(" ").split("\n") : ["Hello", "bro", "I'm gay", "hhhh I'm not kidding"];
                
                const canvas = createCanvas(1000, 600);
                const ctx = canvas.getContext('2d');
                const themeUrl = "https://scontent.xx.fbcdn.net/v/t1.15752-9/462575554_612936921379498_6099596879036887576_n.jpg?_nc_cat=107&ccb=1-7&_nc_sid=9f807c&_nc_ohc=Rd6cbF-pwTwQ7kNvgEw5bbt&_nc_oc=AdiGt1cF3eErpQUzIL-V-fpzqA1tfnl49-3EXU-GfkDdYAu1tdxzAO0kdoPRbDHr3GE&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=scontent.xx&oh=03_Q7cD1wHrDwE6qS52fZi9LrZ7EoZsaZH9C8X0LyFOFFw4m0Ev4g&oe=680095F5";
                

                const userID = event.senderID || "100063840894133";
                const avatarUrl = `https://graph.facebook.com/${userID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
                
                let name = "User";
                try {
                    const userInfo = await api.getUserInfo(userID);
                    name = userInfo[userID]?.name || "User";
                } catch (error) {
                    console.error("Failed to fetch user info:", error);
                }

                const totalBubbleHeight = drawMultipleChatBubbles(ctx, texts, 140, 50, 2);
                const h = totalBubbleHeight + 130;

                await drawTheme(ctx, themeUrl, h);
                const profileY = h - 75;
                await drawProfile(ctx, avatarUrl, 80, profileY, 80);

                ctx.font = "35px sans-serif";
                ctx.fillStyle = "#848482";
                ctx.fillText(name.split(" ")[0], 180, 10);

                const outputPath = path.resolve(__dirname, "fc.png");
                const buffer = canvas.toBuffer('image/png');
                fs.writeFileSync(outputPath, buffer);

                await api.sendMessage({ 
                    body: "Here's your generated image:",
                    attachment: fs.createReadStream(outputPath)
                }, event.threadID, () => {
                    // Clean up file after sending
                    fs.unlinkSync(outputPath);
                });
            }

            await generateChatImage();

        } catch (error) {
            console.error("Error generating image:", error.stack);
            await api.sendMessage(`❌ | Error: ${error.message}`, event.threadID);
        }
    }
};
