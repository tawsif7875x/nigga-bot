const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const axios = require("axios");

module.exports = {
  // Wrap text to fit within a maximum width
  wrapText: async function (ctx, text, maxWidth) {
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

  // Draw a rounded rectangle for chat bubbles
  drawBubbleLayer: function (ctx, x, y, width, height, radius, color) {
    ctx.save();
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

  // Main command function
  async execute({ args, api, event }) {
    const pathImg = __dirname + "/cache/background.png";
    const pathAvt1 = __dirname + "/cache/Avtmot.png";
    const mentionedID = Object.keys(event.mentions)[0] || event.senderID;
    const userInfo = await api.getUserInfo(mentionedID);
    const mentionedName = userInfo[mentionedID].name;
    const background = ["https://i.postimg.cc/6pyLxmTV/IMG-20230630-235606.jpg"];
    const rd = background[Math.floor(Math.random() * background.length)];

    try {
      // Ensure cache directory exists
      if (!fs.existsSync(__dirname + "/cache")) {
        fs.mkdirSync(__dirname + "/cache");
      }

      // Fetch the mentioned user's avatar
      const avatarResponse = await axios.get(
        `https://graph.facebook.com/${mentionedID}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
        { responseType: "arraybuffer" }
      );
      fs.writeFileSync(pathAvt1, Buffer.from(avatarResponse.data));

      // Fetch the background image
      const bgResponse = await axios.get(rd, { responseType: "arraybuffer" });
      fs.writeFileSync(pathImg, Buffer.from(bgResponse.data));

      // Load images
      const baseImage = await loadImage(pathImg);
      const baseAvt1 = await loadImage(pathAvt1);

      // Create canvas with background dimensions
      const canvas = createCanvas(baseImage.width, baseImage.height);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);

      // Adjust dimensions for text and bubble
      const commentMaxWidth = canvas.width - 200;
      const commentX = 145;
      const commentY = 100;
      const nameMaxWidth = canvas.width - 40;
      const nameX = 135;
      const nameY = 45;

      // Set font and color
      ctx.font = "bold 25px Arial";
      ctx.fillStyle = "#FFFFFF";

      // Parse user input
      const userInput = args.join(" ");
      const [mentionText, userText] = userInput.split("|").map(text => text ? text.trim() : "");
      const commentText = mentionText || "Hey!";
      const ownText = userText || "";

      // Wrap text
      const commentLines = await this.wrapText(ctx, commentText, commentMaxWidth);
      const nameLines = await this.wrapText(ctx, mentionedName, nameMaxWidth);

      // Calculate bubble dimensions
      const bubbleMaxWidth = canvas.width - 50;
      const bubbleX = commentX - 20;
      const bubbleY = commentY - 35;
      const bubbleWidth = Math.max(
        ...commentLines.map(line => ctx.measureText(line).width),
        ownText ? ctx.measureText(ownText).width : 0
      ) + 38;
      const bubbleHeight = (commentLines.length + (ownText ? 1 : 0)) * 35 + 20;
      const bubbleRadius = 28;

      // Draw bubble with Messenger-like color
      this.drawBubbleLayer(ctx, bubbleX, bubbleY, bubbleWidth, bubbleHeight, bubbleRadius, "rgba(0, 132, 255, 0.9)");

      // Draw comment text
      ctx.fillStyle = "#FFFFFF"; // White text for blue bubble
      commentLines.forEach((line, index) => {
        ctx.fillText(line, commentX, commentY + index * 28);
      });

      // Draw user's own text if provided
      if (ownText) {
        ctx.fillText(ownText, commentX, commentY + commentLines.length * 28 + 20);
      }

      // Draw name
      ctx.font = "400 19px Arial";
      ctx.fillStyle = "#808080";
      nameLines.forEach((line, index) => {
        ctx.fillText(line, nameX, nameY + index * 28);
      });

      // Draw avatar (circular)
      const avatarX = 30;
      const avatarY = 60;
      const avatarSize = 60;
      ctx.save();
      ctx.beginPath();
      ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(baseAvt1, avatarX, avatarY, avatarSize, avatarSize);
      ctx.restore();

      // Save and send the image
      const imageBuffer = canvas.toBuffer("image/png");
      fs.writeFileSync(pathImg, imageBuffer);

      return api.sendMessage(
        {
          body: " ",
          attachment: fs.createReadStream(pathImg),
        },
        event.threadID,
        () => {
          fs.unlinkSync(pathImg);
          fs.unlinkSync(pathAvt1);
        },
        event.messageID
      );
    } catch (error) {
      console.error("Error generating chat image:", error);
      api.sendMessage("Failed to generate the image.", event.threadID, event.messageID);
    }
  },

  // Command metadata (optional, adjust as needed)
  config: {
    name: "chatimage",
    version: "1.0",
    author: "YourName",
    countDown: 5,
    role: 0,
    shortDescription: "Generate a chat image",
    longDescription: "Generate a chat image with a mentioned user's avatar and custom text",
    category: "fun",
    guide: "{pn} [mention text] | [your text]"
  }
};
