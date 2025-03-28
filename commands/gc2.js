const { loadImage, createCanvas } = require("canvas");
const fs = require("fs");
const axios = require("axios");

module.exports = {
  config: {
    name: "gc2",
    aliases: [],
    author: "Tawsif",
    countDown: 5,
    role: 0,
    category: "fun",
    shortDescription: "get fakechat image",
    guide: "<text> ++ <text> | reply | --user <link> or <uid> | --theme <theme number> | blank"
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
    let userInput = args.join(" ");
    let pathImg = __dirname + "/cache/background.png";
    let pathAvt1 = __dirname + "/cache/Avtmot.png";
    let pathReplyImage = __dirname + "/cache/replyImage.png";
    let mentionedID = event.senderID;
    
    // Check if there's a replied message with an image attachment
    let replyImage = null;
    if (event?.messageReply?.attachments[0]?.type === "photo") {
      const imageUrl = event.messageReply.attachments[0].url;
      const imageData = (await axios.get(imageUrl, { responseType: "arraybuffer" })).data;
      fs.writeFileSync(pathReplyImage, Buffer.from(imageData, "binary"));
      replyImage = await loadImage(pathReplyImage);
    }

    if (event?.messageReply?.senderID === "100063840894133") { 
      userInput = "hi guys I'm gay";
    } else if (event.messageReply) { 
      mentionedID = event.messageReply.senderID;
    } else if (userInput.match(/--user /)) {
      if ((userInput.split("--user ")[1]).match(/.com/)) { 
        mentionedID = (await api.getUID(userInput.split("--user ")[1]));
        userInput = userInput.split("--user ")[0];
      } else { 
        mentionedID = userInput.split("--user ")[1];
        userInput = userInput.split("--user ")[0];
      }
    }
    
    let mentionedName = (await api.getUserInfo(mentionedID))[mentionedID].name;
    let background = ["https://raw.githubusercontent.com/tawsif7875x/Miku-Nakano/refs/heads/main/1742466954445.png", "https://raw.githubusercontent.com/tawsif7875x/Miku-Nakano/refs/heads/main/1742642829480.png", "https://raw.githubusercontent.com/tawsif7875x/Miku-Nakano/refs/heads/main/1742644074382-01.png"];
    let bn = 0;
    if (userInput.match(/--theme/)) { 
      bn = userInput.split("--theme ")[1];
      userInput = userInput.split("--theme ")[0];
    }
    
    let commentText = userInput;
    let rd = background[bn];
    let getAvtmot = (await axios.get(
      `https://graph.facebook.com/${mentionedID}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
      { responseType: "arraybuffer" }
    )).data;
    fs.writeFileSync(pathAvt1, Buffer.from(getAvtmot, "binary"));
    let getbackground = (await axios.get(`${rd}`, { responseType: "arraybuffer" })).data;
    fs.writeFileSync(pathImg, Buffer.from(getbackground, "binary"));
    let baseImage = await loadImage(pathImg);
    let baseAvt1 = await loadImage(pathAvt1);
    let baseAvt2 = await loadImage(pathAvt1);

    // Create a temporary canvas to measure text dimensions
    let tempCanvas = createCanvas(1, 1);
    let tempCtx = tempCanvas.getContext("2d");
    tempCtx.font = "530 75px Arial";

    // Measure the comment text
    const commentMaxWidth = 1350;
    const commentLines = await this.wrapText(tempCtx, commentText, commentMaxWidth);

    // Split the comment text into multiple bubbles based on "++"
    const bubbleTexts = commentText.split("++");

    // Calculate the total height required for all bubbles
    let totalBubbleHeight = 0;
    for (let i = 0; i < bubbleTexts.length; i++) {
      const bubbleText = bubbleTexts[i].trim();
      if (!bubbleText) continue;

      const bubbleLines = await this.wrapText(tempCtx, bubbleText, commentMaxWidth);
      const bubblePadding = 54;
      const bubbleHeight = bubbleLines.length * 84 + bubblePadding + bubblePadding;
      totalBubbleHeight += bubbleHeight + 30;
    }

    // Calculate canvas dimensions
    const canvasWidth = commentMaxWidth + 600;
    const canvasHeight = totalBubbleHeight + 480 + 120 + (replyImage ? 800 : 0);

    let canvas = createCanvas(canvasWidth, canvasHeight);
    let ctx = canvas.getContext("2d");

    // Draw the background image
    const bgAspectRatio = baseImage.width / baseImage.height;
    const canvasAspectRatio = canvasWidth / canvasHeight;

    let bgWidth, bgHeight, bgX, bgY;

    if (bgAspectRatio > canvasAspectRatio) {
      bgHeight = canvasHeight;
      bgWidth = bgHeight * bgAspectRatio;
      bgX = (canvasWidth - bgWidth) / 2;
      bgY = 0;
    } else {
      bgWidth = canvasWidth;
      bgHeight = bgWidth / bgAspectRatio;
      bgX = 0;
      bgY = canvasHeight - bgHeight;
    }
    ctx.drawImage(baseImage, bgX, bgY, bgWidth, bgHeight);

    // Draw the time
    const t = new Date().toLocaleTimeString([], { timeZone: 'Asia/Dhaka', hour: '2-digit', minute: '2-digit', hour12: true });
    ctx.font = "530 51px sans-serif";
    ctx.fillStyle = "#FFFFFF";
    const timeTextWidth = ctx.measureText(t).width;
    const timeX = (canvasWidth - timeTextWidth) / 2;
    const timeY = 120;
    ctx.fillText(t, timeX, timeY);

    // Draw the replied image if it exists
    let contentYOffset = 0;
    if (replyImage) {
      const maxImageWidth = 1000;
      const maxImageHeight = 1000;
      const imageAspectRatio = replyImage.width / replyImage.height;
      
      let imageWidth, imageHeight;
      
      if (replyImage.width > replyImage.height) {
        // Landscape image
        imageWidth = Math.min(replyImage.width, maxImageWidth);
        imageHeight = imageWidth / imageAspectRatio;
      } else {
        // Portrait image
        imageHeight = Math.min(replyImage.height, maxImageHeight);
        imageWidth = imageHeight * imageAspectRatio;
      }
      
      const imageX = (canvasWidth - imageWidth) / 2;
      const imageY = 280;
      
      // Draw rounded rectangle
      const borderRadius = [90, 90, 90, 24];
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(imageX, imageY, imageWidth, imageHeight, borderRadius);
      ctx.closePath();
      ctx.clip();
      
      // Draw the image
      ctx.drawImage(replyImage, imageX, imageY, imageWidth, imageHeight);
      ctx.restore();
      
      contentYOffset = imageHeight - 10;
    }

    const commentX = 375;
    const commentY = 420 + contentYOffset;

    const nameMaxWidth = canvas.width - 120;
    const nameX = 345;
    const nameY = 250;
    ctx.font = "530 75px Arial";
    ctx.fillStyle = "#FFFFFF";

    const nameLines = await this.wrapText(ctx, mentionedName, nameMaxWidth);

    // Draw each bubble separately
    let bubbleYOffset = 0;
    for (let i = 0; i < bubbleTexts.length; i++) {
      const bubbleText = bubbleTexts[i].trim();
      if (!bubbleText) continue;

      const bubbleLines = await this.wrapText(ctx, bubbleText, commentMaxWidth);

      const bubblePadding = 54;
      const bubbleMaxWidth = commentMaxWidth + 105;
      const longestLineWidth = Math.max(...bubbleLines.map(line => ctx.measureText(line).width));
      const bubbleWidth = Math.min(longestLineWidth + 135, bubbleMaxWidth);
      const bubbleHeight = bubbleLines.length * 84 + bubblePadding + bubblePadding;

      const bubbleX = commentX - 72;
      let bubbleY = commentY - 60 + bubbleYOffset;

      let fills = "rgba(51, 51, 51, 1.0)";
      let strokes = "rgba(51, 51, 51, 1.0)";
      if (bn === "2") { 
        fills = "rgba(0,0,96,1)";
        strokes = "rgba(0,0,96,1)";
      }
      ctx.fillStyle = fills;
      ctx.strokeStyle = strokes;
      ctx.lineWidth = 0;
      ctx.beginPath();

      if (replyImage) { 
        ctx.roundRect(bubbleX, bubbleY - bubblePadding, bubbleWidth, bubbleHeight, [24, 99, 99, 99]);
      } else if (bubbleTexts.length === 1) {
        ctx.roundRect(bubbleX, bubbleY - bubblePadding, bubbleWidth, bubbleHeight, [99, 99, 99, 99]);
      } else if (i === 0) {
        ctx.roundRect(bubbleX, bubbleY - bubblePadding, bubbleWidth, bubbleHeight, [99, 99, 99, 24]);
      } else if (i === bubbleTexts.length - 1) {
        ctx.roundRect(bubbleX, bubbleY - bubblePadding, bubbleWidth, bubbleHeight, [24, 99, 99, 99]);
      } else {
        ctx.roundRect(bubbleX, bubbleY - bubblePadding, bubbleWidth, bubbleHeight, [24, 99, 99, 24]);
      }

      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#FFFFFF";
      bubbleLines.forEach((line, index) => {
        ctx.fillText(line, commentX, commentY + index * 84 + bubbleYOffset);
      });

      bubbleYOffset += bubbleHeight + 12;
    }

    // Draw the name text
    ctx.font = "400 57px Arial";
    ctx.fillStyle = "#FFFFFF";
    nameLines.forEach((line, index) => {
      ctx.fillText(line, nameX, nameY + index * 84);
    });

    // Draw the avatar on the left side
    const avatarX = 60;
    const avatarY = canvasHeight - 510;
    const avatarWidth = 150;
    const avatarHeight = 150;

    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX + avatarWidth / 2, avatarY + avatarHeight / 2, avatarWidth / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(baseAvt1, avatarX, avatarY, avatarWidth, avatarHeight);
    ctx.restore();

    // Draw the cloned avatar on the right side
    const clonedAvatarX = canvasWidth - 120;
    const clonedAvatarY = canvasHeight - 375;
    const clonedAvatarWidth = 75;
    const clonedAvatarHeight = 75;

    ctx.save();
    ctx.beginPath();
    ctx.arc(clonedAvatarX + clonedAvatarWidth / 2, clonedAvatarY + clonedAvatarHeight / 2, clonedAvatarWidth / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(baseAvt2, clonedAvatarX, clonedAvatarY, clonedAvatarWidth, clonedAvatarHeight);
    ctx.restore();

    const imageBuffer = canvas.toBuffer();
    fs.writeFileSync(pathImg, imageBuffer);
    return api.sendMessage({ attachment: fs.createReadStream(pathImg) },
      event.threadID, event.messageID);
  },
};
