const { loadImage, createCanvas } = require("canvas");
const fs = require("fs");
const axios = require("axios");

// Scale factor for high resolution (2x or 3x)
const SCALE_FACTOR = 5;

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
    const segments = text.split("++");
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
    let mentionedID = event.senderID;
    
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
    let background = [
      "https://raw.githubusercontent.com/tawsif7875x/nigga-bot/refs/heads/main/1742466954445.png", 
      "https://raw.githubusercontent.com/tawsif7875x/nigga-bot/refs/heads/main/1742642829480.png", 
      "https://raw.githubusercontent.com/tawsif7875x/nigga-bot/refs/heads/main/1742644074382-01.png"
    ];
    
    let bn = 0;
    if (userInput.match(/--theme/)) { 
      bn = userInput.split("--theme ")[1];
      userInput = userInput.split("--theme ")[0];
    }
    
    let commentText = userInput;
    let rd = background[bn];
    
    // Get higher resolution profile picture (1440x1440)
    let getAvtmot = (await axios.get(
      `https://graph.facebook.com/${mentionedID}/picture?width=1440&height=1440&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
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
    tempCtx.font = `530 ${25 * SCALE_FACTOR}px Arial`;

    // Measure the comment text with scaled dimensions
    const commentMaxWidth = 450 * SCALE_FACTOR;
    const commentLines = await this.wrapText(tempCtx, commentText, commentMaxWidth);

    // Split the comment text into multiple bubbles based on "++"
    const bubbleTexts = commentText.split("++");

    // Calculate the total height required for all bubbles
    let totalBubbleHeight = 0;
    for (let i = 0; i < bubbleTexts.length; i++) {
      const bubbleText = bubbleTexts[i].trim();
      if (!bubbleText) continue;

      const bubbleLines = await this.wrapText(tempCtx, bubbleText, commentMaxWidth);
      const bubblePadding = 18 * SCALE_FACTOR;
      const bubbleHeight = bubbleLines.length * (28 * SCALE_FACTOR) + bubblePadding * 2;
      totalBubbleHeight += bubbleHeight + (10 * SCALE_FACTOR);
    }

    // Calculate canvas dimensions based on the total height of all bubbles (scaled up)
    const canvasWidth = (commentMaxWidth + 200) * 2;
    const canvasHeight = (totalBubbleHeight + 160 + 40) * 2;

    let canvas = createCanvas(canvasWidth, canvasHeight);
    let ctx = canvas.getContext("2d");
    
    // Set quality parameters
    ctx.quality = 'best';
    ctx.patternQuality = 'best';
    ctx.textDrawingMode = 'path';
    ctx.antialias = 'default';

    // Calculate the aspect ratio of the background image
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

    // Draw the background image with high quality
    ctx.drawImage(baseImage, bgX, bgY, bgWidth, bgHeight);

    // Get the current time in Dhaka timezone
    const t = new Date().toLocaleTimeString([], { timeZone: 'Asia/Dhaka', hour: '2-digit', minute: '2-digit', hour12: true });

    // Draw the time at the top-middle of the canvas
    ctx.font = `530 ${17 * SCALE_FACTOR}px sans-serif`;
    ctx.fillStyle = "#FFFFFF";
    const timeTextWidth = ctx.measureText(t).width;
    const timeX = (canvasWidth - timeTextWidth) / 2;
    const timeY = 40 * SCALE_FACTOR;
    ctx.fillText(t, timeX, timeY);

    const commentX = 125 * SCALE_FACTOR;
    const commentY = 140 * SCALE_FACTOR;

    const nameMaxWidth = canvas.width - (40 * SCALE_FACTOR);
    const nameX = 115 * SCALE_FACTOR;
    const nameY = 85 * SCALE_FACTOR;
    ctx.font = `530 ${25 * SCALE_FACTOR}px Arial`;
    ctx.fillStyle = "#FFFFFF";

    const nameLines = await this.wrapText(ctx, mentionedName, nameMaxWidth);

    // Draw each bubble separately
    let bubbleYOffset = 0;
    for (let i = 0; i < bubbleTexts.length; i++) {
      const bubbleText = bubbleTexts[i].trim();
      if (!bubbleText) continue;

      const bubbleLines = await this.wrapText(ctx, bubbleText, commentMaxWidth);

      // Calculate the dimensions of the speech bubble (scaled)
      const bubblePadding = 18 * SCALE_FACTOR;
      const bubbleMaxWidth = commentMaxWidth + (35 * SCALE_FACTOR);
      const longestLineWidth = Math.max(...bubbleLines.map(line => ctx.measureText(line).width));
      const bubbleWidth = Math.min(longestLineWidth + (45 * SCALE_FACTOR), bubbleMaxWidth);
      const bubbleHeight = bubbleLines.length * (28 * SCALE_FACTOR) + bubblePadding * 2;

      // Adjust the bubble's horizontal position without affecting the text
      const bubbleX = commentX - (24 * SCALE_FACTOR);
      let bubbleY = commentY - (20 * SCALE_FACTOR) + bubbleYOffset;

      let fills = "rgba(51, 51, 51, 1.0)";
      let strokes = "rgba(51, 51, 51, 1.0)";
      if (bn === 1) { 
        fills = "rgba(51, 34, 17, 1)";
        strokes = "rgba(51, 34, 17, 1)";
      }
      
      ctx.fillStyle = fills;
      ctx.strokeStyle = strokes;
      ctx.lineWidth = 0;
      ctx.beginPath();

      // Adjust the border radius based on the bubble position (scaled)
      const borderRadius = 33 * SCALE_FACTOR;
      if (bubbleTexts.length === 1) {
        ctx.roundRect(bubbleX, bubbleY - bubblePadding, bubbleWidth, bubbleHeight, [borderRadius, borderRadius, borderRadius, borderRadius]);
      } else if (i === 0) {
        ctx.roundRect(bubbleX, bubbleY - bubblePadding, bubbleWidth, bubbleHeight, [borderRadius, borderRadius, borderRadius, 8 * SCALE_FACTOR]);
      } else if (i === bubbleTexts.length - 1) {
        ctx.roundRect(bubbleX, bubbleY - bubblePadding, bubbleWidth, bubbleHeight, [8 * SCALE_FACTOR, borderRadius, borderRadius, borderRadius]);
      } else {
        ctx.roundRect(bubbleX, bubbleY - bubblePadding, bubbleWidth, bubbleHeight, [8 * SCALE_FACTOR, borderRadius, borderRadius, 8 * SCALE_FACTOR]);
      }

      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Draw the comment text inside the bubble
      ctx.fillStyle = "#FFFFFF";
      bubbleLines.forEach((line, index) => {
        ctx.fillText(line, commentX, commentY + index * (28 * SCALE_FACTOR) + bubbleYOffset);
      });

      // Update the Y offset for the next bubble
      bubbleYOffset += bubbleHeight + (4 * SCALE_FACTOR);
    }

    // Draw the name text
    ctx.font = `400 ${19 * SCALE_FACTOR}px Arial`;
    ctx.fillStyle = "#FFFFFF";
    nameLines.forEach((line, index) => {
      ctx.fillText(line, nameX, nameY + index * (28 * SCALE_FACTOR));
    });

    // Draw the avatar on the left side (scaled up)
    const avatarX = 20 * SCALE_FACTOR;
    const avatarY = canvasHeight - (170 * SCALE_FACTOR);
    const avatarWidth = 50 * SCALE_FACTOR;
    const avatarHeight = 50 * SCALE_FACTOR;

    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX + avatarWidth / 2, avatarY + avatarHeight / 2, avatarWidth / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(baseAvt1, avatarX, avatarY, avatarWidth, avatarHeight);
    ctx.restore();

    // Draw the cloned avatar on the right side with a smaller size (scaled)
    const clonedAvatarX = canvasWidth - (40 * SCALE_FACTOR);
    const clonedAvatarY = canvasHeight - (125 * SCALE_FACTOR);
    const clonedAvatarWidth = 25 * SCALE_FACTOR;
    const clonedAvatarHeight = 25 * SCALE_FACTOR;

    ctx.save();
    ctx.beginPath();
    ctx.arc(clonedAvatarX + clonedAvatarWidth / 2, clonedAvatarY + clonedAvatarHeight / 2, clonedAvatarWidth / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(baseAvt2, clonedAvatarX, clonedAvatarY, clonedAvatarWidth, clonedAvatarHeight);
    ctx.restore();

    // Save the high-quality image
    const imageBuffer = canvas.toBuffer('image/png', { compressionLevel: 0, filters: canvas.PNG_FILTER_NONE });
    fs.writeFileSync(pathImg, imageBuffer);
    
    return api.sendMessage({ attachment: fs.createReadStream(pathImg) },
      event.threadID, event.messageID);
  },
};
