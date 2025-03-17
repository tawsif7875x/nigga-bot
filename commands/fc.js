const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');

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
            async function drawTheme(ctx, themeUrl, h) {
                const img = await loadImage(themeUrl);
                const width = 1000;
                const height = h;
                const startX = (img.width - width) / 2;
                const startY = (img.height - height) / 2;

                ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                ctx.canvas.height = height;

                ctx.drawImage(img, startX, startY, width, height, 0, 0, width, height);
            }

            function drawChatBubble(ctx, text, x, y, reduce, zoomFactor, leftCornerTopRadius = 28 * 2, leftCornerBottomRadius = 28 * 2) {
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
                const textStartY = y + padding;

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
                const startY = (avatar.height - squareSize) / 2;

                ctx.save();
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.clip();

                ctx.drawImage(avatar, startX, startY, squareSize, squareSize, x - radius, y - radius, size, size);
                ctx.restore();
            }

            function drawMultipleChatBubbles(ctx, texts, x, startY, reduce, zoomFactor = 1) {
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
                    const bubbleHeight = drawChatBubble(ctx, text, x, currentY, reduce, zoomFactor, TCR, BCR);
                    currentY += bubbleHeight + 6;
                    totalHeight += bubbleHeight;
                });

                return totalHeight;
            }

            async function generateChatImage() {
                const canvas = createCanvas(1000, 600);
                const ctx = canvas.getContext('2d');
                const texts = ["Hello", "bro", "I'm gay", "hhhh I'm not kidding"];
                const themeUrl = "https://i.imgur.com/bi4AF7I.png"; // Updated to URL

                const avatarUrl = `https://graph.facebook.com/100063840894133/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
                const name = (await api.getUserInfo(100063840894133))[100063840894133].name;
                const totalBubbleHeight = drawMultipleChatBubbles(ctx, texts, 140, 50, null, 2);
                const h = totalBubbleHeight + 130;

                await drawTheme(ctx, themeUrl, h);
                drawMultipleChatBubbles(ctx, texts, 140, 50, null, 2);

                const profileY = h - 75;
                await drawProfile(ctx, avatarUrl, 80, profileY, 80);

                ctx.font = "35px sans-serif";
                ctx.fillStyle = "#848482";
                ctx.fillText(name.split(" ")[0], 180, 10);

                const buffer = canvas.toBuffer('image/png');
                fs.writeFileSync("./fc.png", buffer);

                await api.sendMessage({ 
                    attachment: fs.createReadStream("./fc.png")
                }, event.threadID);
            }

            generateChatImage();

        } catch (error) {
            console.error(error);
            api.sendMessage("❌ | " + error.message, event.threadID);
        }
    }
};
