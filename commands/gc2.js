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
  async execute({ args, usersData, threadsData, api, event }) {
    let pathImg = __dirname + "/cache/background.png";
    let pathAvt1 = __dirname + "/cache/Avtmot.png";
    let mentionedID = Object.keys(event.mentions)[0] || event.senderID;
    let mentionedName = (await api.getUserInfo(mentionedID))[mentionedID].name;
    let ThreadInfo = await api.getThreadInfo(event.threadID);
    let background = ["https://i.postimg.cc/6pyLxmTV/IMG-20230630-235606.jpg"];
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
    let canvas = createCanvas(baseImage.width, baseImage.height);
    let ctx = canvas.getContext("2d");
    ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);
    const commentMaxWidth = canvas.width - 200;
    const commentX = 145;
    const commentY = 100;

    const nameMaxWidth = canvas.width - 40;
    const nameX = 135;
    const nameY = 45;
    ctx.font = "500 25px Arial";
    ctx.fillStyle = "#FFFFFF";
    const userInput = args.join(" ");
    let mentionText = userInput.split("|").map(text => text.trim());
    let commentText = mentionText.join(" "); // Join the array into a single string
    const commentLines = await this.wrapText(ctx, commentText, commentMaxWidth);
    const nameLines = await this.wrapText(ctx, mentionedName, nameMaxWidth);

    // Calculate the dimensions of the speech bubble
    const bubblePadding = 10;
    const bubbleMaxWidth = commentMaxWidth + bubblePadding * 2;
    const bubbleWidth = Math.min(ctx.measureText(commentText).width + bubblePadding * 2, bubbleMaxWidth);
    const bubbleHeight = commentLines.length * 28 + bubblePadding * 2;

    // Draw the speech bubble
    ctx.fillStyle = "#FFFFFF";
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(commentX - bubblePadding, commentY - bubblePadding, bubbleWidth, bubbleHeight, 20);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Draw the comment text inside the bubble
    ctx.fillStyle = "#000000";
    commentLines.forEach((line, index) => {
      ctx.fillText(line, commentX, commentY + index * 28);
    });

    // Draw the name text
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

    const imageBuffer = canvas.toBuffer();
    fs.writeFileSync(pathImg, imageBuffer);
    return api.sendMessage({ attachment: fs.createReadStream(pathImg) },
      event.threadID, event.messageID);
  },
};
