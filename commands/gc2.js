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
    try {
      let userInput = args.join(" ");
      // Truncate very long inputs
      if (userInput.length > 2000) {
        userInput = userInput.slice(0, 2000) + "... [TRUNCATED]";
      }

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
      
      // Get profile picture
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

      // Create temp canvas for measurements
      let tempCanvas = createCanvas(1, 1);
      let tempCtx = tempCanvas.getContext("2d");
      tempCtx.font = `530 100px Arial`;

      // Split text into bubbles and calculate dimensions
      const commentMaxWidth = 1800;
      const bubbleTexts = commentText.split("++").filter(t => t.trim());
      
      // Calculate total height with limits
      let totalBubbleHeight = 0;
      const maxCanvasHeight = 6000;
      for (const bubbleText of bubbleTexts) {
        const bubbleLines = await this.wrapText(tempCtx, bubbleText, commentMaxWidth);
        const bubbleHeight = bubbleLines.length * 112 + 144;
        totalBubbleHeight += bubbleHeight + 40;
      }

      const canvasWidth = 2600;
      const canvasHeight = Math.min(
        (totalBubbleHeight + 160 + 80) * 2,
        maxCanvasHeight
      );

      let canvas = createCanvas(canvasWidth, canvasHeight);
      let ctx = canvas.getContext("2d");
      
      // Quality settings
      ctx.quality = 'best';
      ctx.patternQuality = 'best';
      ctx.textDrawingMode = 'path';
      ctx.antialias = 'default';

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
      ctx.font = `530 68px sans-serif`;
      ctx.fillStyle = "#FFFFFF";
      const timeTextWidth = ctx.measureText(t).width;
      ctx.fillText(t, (canvasWidth - timeTextWidth) / 2, 160);

      // Draw name
      ctx.font = `530 100px Arial`;
      ctx.fillStyle = "#FFFFFF";
      const nameLines = await this.wrapText(ctx, mentionedName, canvasWidth - 160);
      nameLines.forEach((line, index) => {
        ctx.fillText(line, 460, 340 + index * 112);
      });

      // Draw message bubbles
      const baseBubbleY = 560;
      let bubbleYOffset = 0;
      
      for (const bubbleText of bubbleTexts) {
        const bubbleLines = await this.wrapText(ctx, bubbleText, commentMaxWidth);
        const bubblePadding = 72;
        const bubbleHeight = bubbleLines.length * 112 + bubblePadding * 2;
        const bubbleWidth = Math.max(...bubbleLines.map(l => ctx.measureText(l).width)) + 180;

        // Bubble positioning
        const bubbleX = 500 - 96;
        const bubbleY = baseBubbleY + bubbleYOffset - 80;

        // Style
        let fills = "rgba(51, 51, 51, 1.0)";
        let strokes = "rgba(51, 51, 51, 1.0)";
        if (bn === 1) { 
          fills = "rgba(51, 34, 17, 1.0)";
          strokes = "rgba(51, 34, 17, 1.0)";
        }

        // Draw bubble
        ctx.fillStyle = fills;
        ctx.strokeStyle = strokes;
        ctx.beginPath();
        ctx.roundRect(bubbleX, bubbleY, bubbleWidth, bubbleHeight, 132);
        ctx.fill();
        ctx.stroke();

        // Draw text
        ctx.fillStyle = "#FFFFFF";
        bubbleLines.forEach((line, index) => {
          ctx.fillText(line, 500, baseBubbleY + bubbleYOffset + index * 112);
        });

        bubbleYOffset += bubbleHeight + 40;
      }

      // Draw avatars
      const drawAvatar = (image, x, y, size) => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x + size/2, y + size/2, size/2, 0, Math.PI*2);
        ctx.clip();
        ctx.drawImage(image, x, y, size, size);
        ctx.restore();
      };
      drawAvatar(baseAvt1, 80, canvasHeight - 680, 200);
      drawAvatar(baseAvt2, canvasWidth - 160, canvasHeight - 500, 100);

      // Save and send
      const imageBuffer = canvas.toBuffer('image/png', { compressionLevel: 0 });
      fs.writeFileSync(pathImg, imageBuffer);
      
      return api.sendMessage({ 
        attachment: fs.createReadStream(pathImg) 
      }, event.threadID, event.messageID);
      
    } catch (err) {
      console.error(err);
      return api.sendMessage("❌ | " + error.message, event.threadID);
    }
  },
};
