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
    const words = text.split(" ");
    let line = "";
    const lines = [];
    
    for (const word of words) {
      const currentLine = line ? `${line} ${word}` : word;
      const currentLineWidth = ctx.measureText(currentLine).width;
      
      if (currentLineWidth <= maxWidth) {
        line = currentLine;
      } else {
        lines.push(line);
        line = word;
      }
    }
    
    if (line) {
      lines.push(line);
    }
    
    return lines;
  },
  async execute({ args, usersData, threadsData, api, event }) {
    try {
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
      
      // Get higher resolution profile picture
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
      tempCtx.font = `530 100px Arial`;

      // Split the comment text into multiple bubbles based on "++"
      const bubbleTexts = commentText.split("++").filter(text => text.trim());

      // Calculate the total height required for all bubbles
      let totalBubbleHeight = 0;
      for (const bubbleText of bubbleTexts) {
        const bubbleLines = await this.wrapText(tempCtx, bubbleText.trim(), 1800);
        const bubblePadding = 72;
        const bubbleHeight = bubbleLines.length * 112 + bubblePadding * 2;
        totalBubbleHeight += bubbleHeight + 40;
      }

      // Calculate canvas dimensions
      const canvasWidth = 2600;
      const canvasHeight = Math.max(3200, totalBubbleHeight + 800); // Ensure minimum height

      let canvas = createCanvas(canvasWidth, canvasHeight);
      let ctx = canvas.getContext("2d");
      
      // Set quality parameters
      ctx.quality = 'best';
      ctx.patternQuality = 'best';
      ctx.textDrawingMode = 'path';
      ctx.antialias = 'default';

      // Draw background
      ctx.drawImage(baseImage, 0, 0, canvasWidth, canvasHeight);

      // Get the current time in Dhaka timezone
      const t = new Date().toLocaleTimeString([], { timeZone: 'Asia/Dhaka', hour: '2-digit', minute: '2-digit', hour12: true });

      // Draw the time at the top-middle of the canvas
      ctx.font = `530 68px sans-serif`;
      ctx.fillStyle = "#FFFFFF";
      const timeTextWidth = ctx.measureText(t).width;
      const timeX = (canvasWidth - timeTextWidth) / 2;
      const timeY = 160;
      ctx.fillText(t, timeX, timeY);

      const commentX = 500;
      let commentY = 560;

      const nameMaxWidth = canvas.width - 160;
      const nameX = 460;
      const nameY = 340;
      ctx.font = `530 100px Arial`;
      ctx.fillStyle = "#FFFFFF";

      const nameLines = await this.wrapText(ctx, mentionedName, nameMaxWidth);

      // Draw each bubble separately
      for (let i = 0; i < bubbleTexts.length; i++) {
        const bubbleText = bubbleTexts[i].trim();
        const bubbleLines = await this.wrapText(ctx, bubbleText, 1800);

        // Calculate bubble dimensions
        const bubblePadding = 72;
        const longestLineWidth = Math.max(...bubbleLines.map(line => ctx.measureText(line).width);
        const bubbleWidth = Math.min(longestLineWidth + 180, 1940);
        const bubbleHeight = bubbleLines.length * 112 + bubblePadding * 2;

        // Bubble position
        const bubbleX = commentX - 96;
        const bubbleY = commentY - 80;

        let fills = "rgba(51, 51, 51, 1.0)";
        let strokes = "rgba(51, 51, 51, 1.0)";
        if (bn === 1) { 
          fills = "rgba(51, 34, 17, 1.0)";
          strokes = "rgba(51, 34, 17, 1.0)";
        }
        
        ctx.fillStyle = fills;
        ctx.strokeStyle = strokes;
        ctx.lineWidth = 0;
        ctx.beginPath();

        // Draw bubble with appropriate rounded corners
        const borderRadius = 132;
        if (bubbleTexts.length === 1) {
          ctx.roundRect(bubbleX, bubbleY, bubbleWidth, bubbleHeight, [borderRadius, borderRadius, borderRadius, borderRadius]);
        } else if (i === 0) {
          ctx.roundRect(bubbleX, bubbleY, bubbleWidth, bubbleHeight, [borderRadius, borderRadius, borderRadius, 32]);
        } else if (i === bubbleTexts.length - 1) {
          ctx.roundRect(bubbleX, bubbleY, bubbleWidth, bubbleHeight, [32, borderRadius, borderRadius, borderRadius]);
        } else {
          ctx.roundRect(bubbleX, bubbleY, bubbleWidth, bubbleHeight, [32, borderRadius, borderRadius, 32]);
        }

        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Draw text in bubble
        ctx.fillStyle = "#FFFFFF";
        bubbleLines.forEach((line, index) => {
          ctx.fillText(line, commentX, commentY + index * 112);
        });

        // Update Y position for next bubble
        commentY += bubbleHeight + 40;
      }

      // Draw the name text
      ctx.font = `400 76px Arial`;
      ctx.fillStyle = "#FFFFFF";
      nameLines.forEach((line, index) => {
        ctx.fillText(line, nameX, nameY + index * 112);
      });

      // Draw the avatar on the left side
      const avatarX = 80;
      const avatarY = canvasHeight - 680;
      const avatarWidth = 200;
      const avatarHeight = 200;

      ctx.save();
      ctx.beginPath();
      ctx.arc(avatarX + avatarWidth / 2, avatarY + avatarHeight / 2, avatarWidth / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(baseAvt1, avatarX, avatarY, avatarWidth, avatarHeight);
      ctx.restore();

      // Draw the cloned avatar on the right side
      const clonedAvatarX = canvasWidth - 160;
      const clonedAvatarY = canvasHeight - 500;
      const clonedAvatarWidth = 100;
      const clonedAvatarHeight = 100;

      ctx.save();
      ctx.beginPath();
      ctx.arc(clonedAvatarX + clonedAvatarWidth / 2, clonedAvatarY + clonedAvatarHeight / 2, clonedAvatarWidth / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(baseAvt2, clonedAvatarX, clonedAvatarY, clonedAvatarWidth, clonedAvatarHeight);
      ctx.restore();

      // Save the image
      const imageBuffer = canvas.toBuffer('image/png', { compressionLevel: 0, filters: canvas.PNG_FILTER_NONE });
      fs.writeFileSync(pathImg, imageBuffer);
      
      return api.sendMessage({ attachment: fs.createReadStream(pathImg) },
        event.threadID, event.messageID);
    } catch (error) {
      console.error("Error in gc2 command:", error);
      return api.sendMessage("An error occurred while processing your request.", event.threadID, event.messageID);
    }
  },
};
