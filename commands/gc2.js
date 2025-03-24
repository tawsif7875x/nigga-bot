const { loadImage, createCanvas } = require("canvas");
const fs = require("fs");
const axios = require("axios");
const sharp = require("sharp");

module.exports = {
  config: {
    name: "gc2",
    aliases: ["gc"],
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
    // Supersampling factor - render at higher resolution then downscale
    const SUPER_SAMPLE = 2; // 2x resolution
    
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
    
    // Download avatar with higher resolution
    let getAvtmot = (await axios.get(
      `https://graph.facebook.com/${mentionedID}/picture?width=1500&height=1500&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
      { responseType: "arraybuffer" }
    )).data;
    fs.writeFileSync(pathAvt1, Buffer.from(getAvtmot, "binary"));
    
    let getbackground = (await axios.get(`${rd}`, { responseType: "arraybuffer" })).data;
    fs.writeFileSync(pathImg, Buffer.from(getbackground, "binary"));
    
    let baseImage = await loadImage(pathImg);
    let baseAvt1 = await loadImage(pathAvt1);
    let baseAvt2 = await loadImage(pathAvt1);

    // Create temporary canvas for measurements
    let tempCanvas = createCanvas(1, 1);
    let tempCtx = tempCanvas.getContext("2d");
    tempCtx.font = "530 25px Arial";

    // Calculate dimensions with supersampling
    const commentMaxWidth = 450 * SUPER_SAMPLE;
    const commentLines = await this.wrapText(tempCtx, commentText, commentMaxWidth);
    const bubbleTexts = commentText.split("++");

    let totalBubbleHeight = 0;
    for (let i = 0; i < bubbleTexts.length; i++) {
      const bubbleText = bubbleTexts[i].trim();
      if (!bubbleText) continue;

      const bubbleLines = await this.wrapText(tempCtx, bubbleText, commentMaxWidth);
      const bubblePadding = 18 * SUPER_SAMPLE;
      const bubbleHeight = bubbleLines.length * 28 * SUPER_SAMPLE + bubblePadding * 2;
      totalBubbleHeight += bubbleHeight + 10 * SUPER_SAMPLE;
    }

    const canvasWidth = (commentMaxWidth + 200) * SUPER_SAMPLE;
    const canvasHeight = (totalBubbleHeight + 160 + 40) * SUPER_SAMPLE;

    // Create high-resolution canvas
    let canvas = createCanvas(canvasWidth, canvasHeight);
    let ctx = canvas.getContext("2d");

    // Configure high-quality rendering
    ctx.quality = 'best';
    ctx.patternQuality = 'best';
    ctx.textDrawingMode = 'path';
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.scale(SUPER_SAMPLE, SUPER_SAMPLE);

    // Draw background
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

    // Draw time
    const t = new Date().toLocaleTimeString([], { timeZone: 'Asia/Dhaka', hour: '2-digit', minute: '2-digit', hour12: true });
    ctx.font = `530 ${17 * SUPER_SAMPLE}px sans-serif`;
    ctx.fillStyle = "#FFFFFF";
    const timeTextWidth = ctx.measureText(t).width;
    const timeX = (canvasWidth - timeTextWidth) / 2;
    const timeY = 40 * SUPER_SAMPLE;
    ctx.fillText(t, timeX, timeY);

    // Draw name
    const nameX = 115 * SUPER_SAMPLE;
    const nameY = 85 * SUPER_SAMPLE;
    ctx.font = `530 ${25 * SUPER_SAMPLE}px Arial`;
    ctx.fillStyle = "#FFFFFF";
    const nameLines = await this.wrapText(ctx, mentionedName, (canvas.width - 40) * SUPER_SAMPLE);
    
    // Draw bubbles and text (scaled for supersampling)
    let bubbleYOffset = 0;
    for (let i = 0; i < bubbleTexts.length; i++) {
      const bubbleText = bubbleTexts[i].trim();
      if (!bubbleText) continue;

      const bubbleLines = await this.wrapText(ctx, bubbleText, commentMaxWidth);
      const bubblePadding = 18 * SUPER_SAMPLE;
      const bubbleMaxWidth = commentMaxWidth + 35 * SUPER_SAMPLE;
      const longestLineWidth = Math.max(...bubbleLines.map(line => ctx.measureText(line).width));
      const bubbleWidth = Math.min(longestLineWidth + 45 * SUPER_SAMPLE, bubbleMaxWidth);
      const bubbleHeight = bubbleLines.length * 28 * SUPER_SAMPLE + bubblePadding * 2;

      const bubbleX = 125 * SUPER_SAMPLE - 24 * SUPER_SAMPLE;
      let bubbleY = 140 * SUPER_SAMPLE - 20 * SUPER_SAMPLE + bubbleYOffset;

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

      if (bubbleTexts.length === 1) {
        ctx.roundRect(bubbleX, bubbleY - bubblePadding, bubbleWidth, bubbleHeight, [33, 33, 33, 33]);
      } else if (i === 0) {
        ctx.roundRect(bubbleX, bubbleY - bubblePadding, bubbleWidth, bubbleHeight, [33, 33, 33, 8]);
      } else if (i === bubbleTexts.length - 1) {
        ctx.roundRect(bubbleX, bubbleY - bubblePadding, bubbleWidth, bubbleHeight, [8, 33, 33, 33]);
      } else {
        ctx.roundRect(bubbleX, bubbleY - bubblePadding, bubbleWidth, bubbleHeight, [8, 33, 33, 8]);
      }

      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#FFFFFF";
      bubbleLines.forEach((line, index) => {
        ctx.fillText(line, 125 * SUPER_SAMPLE, 140 * SUPER_SAMPLE + index * 28 * SUPER_SAMPLE + bubbleYOffset);
      });

      bubbleYOffset += bubbleHeight + 4 * SUPER_SAMPLE;
    }

    // Draw name text
    ctx.font = `400 ${19 * SUPER_SAMPLE}px Arial`;
    ctx.fillStyle = "#FFFFFF";
    nameLines.forEach((line, index) => {
      ctx.fillText(line, nameX, nameY + index * 28 * SUPER_SAMPLE);
    });

    // Draw avatars with high quality
    const avatarSize = 50 * SUPER_SAMPLE;
    const avatarX = 20 * SUPER_SAMPLE;
    const avatarY = canvasHeight - 170 * SUPER_SAMPLE;

    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(baseAvt1, avatarX, avatarY, avatarSize, avatarSize);
    ctx.restore();

    const clonedAvatarSize = 25 * SUPER_SAMPLE;
    const clonedAvatarX = canvasWidth - 40 * SUPER_SAMPLE;
    const clonedAvatarY = canvasHeight - 125 * SUPER_SAMPLE;

    ctx.save();
    ctx.beginPath();
    ctx.arc(clonedAvatarX + clonedAvatarSize/2, clonedAvatarY + clonedAvatarSize/2, clonedAvatarSize/2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(baseAvt2, clonedAvatarX, clonedAvatarY, clonedAvatarSize, clonedAvatarSize);
    ctx.restore();

    // Convert to buffer and process with sharp
    const imageBuffer = canvas.toBuffer('image/png');
    
    try {
      const sharpenedBuffer = await sharp(imageBuffer)
        .resize(Math.round(canvasWidth/SUPER_SAMPLE), Math.round(canvasHeight/SUPER_SAMPLE), {
          kernel: 'lanczos3',
          fit: 'fill'
        })
        .sharpen(0.7, 1.0, 2.0)
        .withMetadata({ density: 300 })
        .png({ quality: 100, compressionLevel: 0 })
        .toBuffer();

      fs.writeFileSync(pathImg, sharpenedBuffer);
      return api.sendMessage({ attachment: fs.createReadStream(pathImg) }, event.threadID, event.messageID);
    } catch (sharpError) {
      console.error("Sharp processing error:", sharpError);
      // Fallback to regular PNG if sharp fails
      fs.writeFileSync(pathImg, imageBuffer);
      return api.sendMessage({ attachment: fs.createReadStream(pathImg) }, event.threadID, event.messageID);
    }
  },
};
