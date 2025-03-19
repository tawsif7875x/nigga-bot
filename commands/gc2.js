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
    shortDescription: "get fakechat image"
  },
  wrapText: async function (ctx, text, maxWidth) {
    const segments = text.split("++"); // Split text by "++"
    const lines = [];
    
    for (const segment of segments) {
      const words = segment.split(" ");
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
    }
    
    return lines;
  },
  async execute({ args, usersData, threadsData, api, event }) {
    let pathImg = __dirname + "/cache/background.png";
    let pathAvt1 = __dirname + "/cache/Avtmot.png";
    let mentionedID = Object.keys(event.mentions)[0] || event.senderID;
    let mentionedName = (await api.getUserInfo(mentionedID))[mentionedID].name;
    let ThreadInfo = await api.getThreadInfo(event.threadID);
    let background = ["https://i.ibb.co.com/8wHXQ1T/1742368191077.png"];
    let rd = background[0];
    let getAvtmot = (await axios.get(
      `https://graph.facebook.com/${mentionedID}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
      { responseType: "arraybuffer" }
    )).data;
    fs.writeFileSync(pathAvt1, Buffer.from(getAvtmot, "binary"));
    let getbackground = (await axios.get(`${rd}`, { responseType: "arraybuffer" })).data;
    fs.writeFileSync(pathImg, Buffer.from(getbackground, "binary"));
    let baseImage = await loadImage(pathImg);
    let baseAvt1 = await loadImage(pathAvt1);

    // Create a temporary canvas to measure text dimensions
    let tempCanvas = createCanvas(1, 1);
    let tempCtx = tempCanvas.getContext("2d");
    tempCtx.font = "500 25px Arial";

    const userInput = args.join(" ");
    let mentionText = userInput.split("|").map(text => text.trim());
    let commentText = mentionText.join(" ");

    // Measure the comment text
    const commentMaxWidth = 450; // Set a max width for the comment
    const commentLines = await this.wrapText(tempCtx, commentText, commentMaxWidth);

    // Calculate canvas dimensions based on the text
    const canvasWidth = commentMaxWidth + 200;
    const canvasHeight = commentLines.length * 28 + 200;

    let canvas = createCanvas(canvasWidth, canvasHeight);
    let ctx = canvas.getContext("2d");

    // Calculate the aspect ratio of the background image
    const bgAspectRatio = baseImage.width / baseImage.height;
    const canvasAspectRatio = canvasWidth / canvasHeight;

    let bgWidth, bgHeight, bgX, bgY;

    if (bgAspectRatio > canvasAspectRatio) {
      // Background is wider than canvas
      bgHeight = canvasHeight;
      bgWidth = bgHeight * bgAspectRatio;
      bgX = (canvasWidth - bgWidth) / 2;
      bgY = 0;
    } else {
      // Background is taller than canvas
      bgWidth = canvasWidth;
      bgHeight = bgWidth / bgAspectRatio;
      bgX = 0;
      bgY = canvasHeight - bgHeight; // Align to the bottom
    }

    // Draw the background image
    ctx.drawImage(baseImage, bgX, bgY, bgWidth, bgHeight);

    const commentX = 145;
    const commentY = 100;

    const nameMaxWidth = canvas.width - 40;
    const nameX = 135;
    const nameY = 45;
    ctx.font = "500 25px Arial";
    ctx.fillStyle = "#FFFFFF";

    const nameLines = await this.wrapText(ctx, mentionedName, nameMaxWidth);

    // Calculate the dimensions of the speech bubble
    const bubblePadding = 18;
    const bubbleMaxWidth = commentMaxWidth + 35;
    const longestLineWidth = Math.max(...commentLines.map(line => ctx.measureText(line).width));
    const bubbleWidth = Math.min(longestLineWidth + 45, bubbleMaxWidth);
    const bubbleHeight = commentLines.length * 28 + bubblePadding * 2;

    // Adjust the bubble's horizontal position without affecting the text
    const bubbleX = commentX - 50; // Move the bubble to the left
    const bubbleY = commentY - 20;

    // Draw the speech bubble
    ctx.fillStyle = "#333333";
    ctx.strokeStyle = "#333333";
    ctx.lineWidth = 0;
    ctx.beginPath();
    ctx.roundRect(bubbleX, bubbleY - bubblePadding, bubbleWidth, bubbleHeight, 30); // Use bubbleX directly
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Draw the comment text inside the bubble
    ctx.fillStyle = "#FFFFFF";
    commentLines.forEach((line, index) => {
      ctx.fillText(line, commentX, commentY + index * 28); // Keep the comment text position unchanged
    });

    // Draw the name text
    ctx.font = "400 19px Arial";
    ctx.fillStyle = "#FFFFFF";
    nameLines.forEach((line, index) => {
      ctx.fillText(line, nameX, nameY + index * 28);
    });

    // Draw the avatar
    const avatarX = 30;
    const avatarY = canvasHeight - 165;
    const avatarWidth = 60;
    const avatarHeight = 60;

    ctx.beginPath();
    ctx.arc(avatarX + avatarWidth / 2, avatarY + avatarHeight / 2, avatarWidth / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(baseAvt1, avatarX, avatarY, avatarWidth, avatarHeight);

    const imageBuffer = canvas.toBuffer();
    fs.writeFileSync(pathImg, imageBuffer);
    return api.sendMessage({ attachment: fs.createReadStream(pathImg) },
      event.threadID, event.messageID);
  },
};
