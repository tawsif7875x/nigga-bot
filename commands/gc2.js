const { loadImage, createCanvas } = require("canvas");
const fs = require("fs");
const axios = require("axios");

module.exports = {
  config: {
    name: "gc2",
    aliases: ["gc"],
    author: "Tawsif",
    countDown: 5,
    role: 0,
    category: "fun",
    shortDescription: "Generate a fake chat image",
  },
  utils: {
    wrapText: async (ctx, text, maxWidth) => {
      const words = text.split(" ");
      const lines = [];
      let line = "";
      for (const word of words) {
        const currentLine = `${line}${word} `;
        const currentLineWidth = ctx.measureText(currentLine).width;
        if (currentLineWidth <= maxWidth) {
          line = currentLine;
        } else {
          lines.push(line.trim());
          line = `${word} `;
        }
      }
      lines.push(line.trim());
      return lines;
    },
    drawBubble: (ctx, x, y, width, height, radius, color) => {
      ctx.save();
      ctx.globalCompositeOperation = "source-over";
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.arcTo(x + width, y, x + width, y + radius, radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
      ctx.lineTo(x + radius, y + height);
      ctx.arcTo(x, y + height, x, y + height - radius, radius);
      ctx.lineTo(x, y + radius);
      ctx.arcTo(x, y, x + radius, y, radius);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      ctx.restore();
    },
    fetchImage: async (url, path) => {
      const response = await axios.get(url, { responseType: "arraybuffer" });
      fs.writeFileSync(path, Buffer.from(response.data, "binary"));
    },
  },
  async execute({ args, api, event }) {
    const cacheDir = __dirname + "/cache";
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir);
    }

    const backgroundPath = `${cacheDir}/background.png`;
    const avatarPath = `${cacheDir}/avatar.png`;

    const mentionedID = Object.keys(event.mentions)[0] || event.senderID;
    const mentionedName = (await api.getUserInfo(mentionedID))[mentionedID].name;
    const [mentionText, userText] = args.join(" ").split("|").map(text => text.trim());

    const backgroundURL = "https://i.postimg.cc/6pyLxmTV/IMG-20230630-235606.jpg";
    const avatarURL = `https://graph.facebook.com/${mentionedID}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

    await this.utils.fetchImage(backgroundURL, backgroundPath);
    await this.utils.fetchImage(avatarURL, avatarPath);

    const baseImage = await loadImage(backgroundPath);
    const avatarImage = await loadImage(avatarPath);

    const canvas = createCanvas(baseImage.width, baseImage.height);
    const ctx = canvas.getContext("2d");

    ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);

    const commentMaxWidth = canvas.width - 200;
    const commentX = 145;
    const commentY = 100;

    const nameMaxWidth = canvas.width - 40;
    const nameX = 135;
    const nameY = 45;

    ctx.font = "500 25px Arial";
    ctx.fillStyle = "#FFFFFF";

    const commentLines = await this.utils.wrapText(ctx, mentionText, commentMaxWidth);
    const nameLines = await this.utils.wrapText(ctx, mentionedName, nameMaxWidth);

    const bubbleMaxWidth = canvas.width - 50;
    const bubbleX = commentX - 20;
    const bubbleY = commentY - 35;

    const bubbleWidth = Math.min(Math.max(ctx.measureText(mentionText).width, ctx.measureText(userText || "").width) + 38, bubbleMaxWidth);
    const bubbleHeight = (commentLines.length + (userText ? 1 : 0)) * 35 + 20;
    const bubbleRadius = 28;
    const bubbleColor = "#333";

    this.utils.drawBubble(ctx, bubbleX, bubbleY, bubbleWidth, bubbleHeight, bubbleRadius, bubbleColor);

    commentLines.forEach((line, index) => {
      ctx.fillText(line, commentX, commentY + index * 28);
    });

    if (userText) {
      ctx.fillText(userText, commentX, commentY + commentLines.length * 28 + 20);
    }

    ctx.font = "400 19px Arial";
    ctx.fillStyle = "#808080";
    nameLines.forEach((line, index) => {
      ctx.fillText(line, nameX, nameY + index * 28);
    });

    const avatarX = 30;
    const avatarY = 60;
    const avatarSize = 60;

    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatarImage, avatarX, avatarY, avatarSize, avatarSize);

    const outputPath = `${cacheDir}/output.png`;
    fs.writeFileSync(outputPath, canvas.toBuffer());

    return api.sendMessage({ attachment: fs.createReadStream(outputPath) }, event.threadID, event.messageID);
  },
};  let [mentionText, userText] = userInput.split("|").map(text => text.trim());

  let commentText = mentionText || "";
  let ownText = userText || "";
  const commentLines = await this.wrapText(ctx, commentText, commentMaxWidth);
  const nameLines = await this.wrapText(ctx, mentionedName, nameMaxWidth);
  const bubbleMaxWidth = canvas.width - 50; 
  const bubbleX = commentX - 20;
  const bubbleY = commentY - 35;
  
  // Calculate the bubble width, ensuring it does not exceed bubbleMaxWidth
  const bubbleWidth = Math.min(Math.max(ctx.measureText(commentText).width, ctx.measureText(ownText).width) + 38, bubbleMaxWidth);
  
  // Calculate the bubble height based on the number of lines
  const bubbleHeight = (commentLines.length + (ownText ? 1 : 0)) * 35 + 20;
  
  const bubbleRadius = 28;
  const bubbleColor = "#333";
  
  // Draw the bubble
  this.drawBubbleLayer(ctx, bubbleX, bubbleY, bubbleWidth, bubbleHeight, bubbleRadius, bubbleColor);
  
  // Draw the text inside the bubble
  commentLines.forEach((line, index) => {
   ctx.fillText(line, commentX, commentY + index * 28);
  });
  
  if (ownText) {
   ctx.fillText(ownText, commentX, commentY + commentLines.length * 28 + 20);
  }
  
  // Draw the name
  ctx.font = "400 19px Arial";
  ctx.fillStyle = "#808080";
  nameLines.forEach((line, index) => {
   ctx.fillText(line, nameX, nameY + index * 28);
  });
  
  // Draw the avatar
  const avatarX = 30;
  const avatarY = 60;
  const avatarWidth = 60;
  const avatarHeight = 60;

  ctx.beginPath();
  ctx.arc(avatarX + avatarWidth / 2, avatarY + avatarHeight / 2, avatarWidth / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(baseAvt1, avatarX, avatarY, avatarWidth, avatarHeight);
  
  // Save the image
  const imageBuffer = canvas.toBuffer();
  fs.writeFileSync(pathImg, imageBuffer);
  
  // Send the image
  return api.sendMessage({attachment: fs.createReadStream(pathImg)},
   event.threadID, event.messageID);
 },
};
