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
    const scaleFactor = 2; // Double the resolution
    
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
    let background = ["https://raw.githubusercontent.com/tawsif7875x/nigga-bot/refs/heads/main/1742466954445.png", "https://raw.githubusercontent.com/tawsif7875x/nigga-bot/refs/heads/main/1742642829480.png", "https://raw.githubusercontent.com/tawsif7875x/nigga-bot/refs/heads/main/1742644074382-01.png"];
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

    // Create high-resolution canvas
    const createHiResCanvas = (width, height) => {
      const scaledWidth = width * scaleFactor;
      const scaledHeight = height * scaleFactor;
      const canvas = createCanvas(scaledWidth, scaledHeight);
      const ctx = canvas.getContext("2d");
      ctx.scale(scaleFactor, scaleFactor);
      ctx.imageSmoothingEnabled = false; // Disable anti-aliasing for crisp edges
      return { canvas, ctx };
    };

    // Create a temporary canvas to measure text dimensions
    let tempCanvas = createCanvas(1, 1);
    let tempCtx = tempCanvas.getContext("2d");
    tempCtx.font = "530 25px Arial";

    // Measure the comment text
    const commentMaxWidth = 450;
    const commentLines = await this.wrapText(tempCtx, commentText, commentMaxWidth);

    // Split the comment text into multiple bubbles based on "++"
    const bubbleTexts = commentText.split("++");

    // Calculate the total height required for all bubbles
    let totalBubbleHeight = 0;
    for (let i = 0; i < bubbleTexts.length; i++) {
      const bubbleText = bubbleTexts[i].trim();
      if (!bubbleText) continue;

      const bubbleLines = await this.wrapText(tempCtx, bubbleText, commentMaxWidth);
      const bubblePadding = 18;
      const bubbleHeight = bubbleLines.length * 28 + bubblePadding * 2;
      totalBubbleHeight += bubbleHeight + 10;
    }

    // Original dimensions calculation
    const canvasWidth = commentMaxWidth + 200;
    const canvasHeight = totalBubbleHeight + 160 + 40;

    // Create high-res canvas
    const { canvas, ctx } = createHiResCanvas(canvasWidth, canvasHeight);
    const scaled = value => value / scaleFactor;

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
    ctx.drawImage(
      baseImage,
      scaled(bgX),
      scaled(bgY),
      scaled(bgWidth),
      scaled(bgHeight)
    );

    // Get the current time in Dhaka timezone
    const t = new Date().toLocaleTimeString([], { timeZone: 'Asia/Dhaka', hour: '2-digit', minute: '2-digit', hour12: true });

    // Draw the time at the top-middle of the canvas
    ctx.font = "530 17px sans-serif";
    ctx.fillStyle = "#FFFFFF";
    const timeTextWidth = ctx.measureText(t).width;
    const timeX = (canvasWidth - timeTextWidth) / 2;
    const timeY = 40;
    ctx.fillText(t, scaled(timeX), scaled(timeY));

    const commentX = 125;
    const commentY = 140;

    const nameMaxWidth = canvas.width - 40;
    const nameX = 115;
    const nameY = 85;
    ctx.font = "530 25px Arial";
    ctx.fillStyle = "#FFFFFF";

    const nameLines = await this.wrapText(ctx, mentionedName, nameMaxWidth);

    // Draw each bubble separately
    let bubbleYOffset = 0;
    for (let i = 0; i < bubbleTexts.length; i++) {
      const bubbleText = bubbleTexts[i].trim();
      if (!bubbleText) continue;

      const bubbleLines = await this.wrapText(ctx, bubbleText, commentMaxWidth);

      // Calculate the dimensions of the speech bubble
      const bubblePadding = 18;
      const bubbleMaxWidth = commentMaxWidth + 35;
      const longestLineWidth = Math.max(...bubbleLines.map(line => ctx.measureText(line).width));
      const bubbleWidth = Math.min(longestLineWidth + 45, bubbleMaxWidth);
      const bubbleHeight = bubbleLines.length * 28 + bubblePadding * 2;

      // Adjust the bubble's horizontal position without affecting the text
      const bubbleX = commentX - 24;
      let bubbleY = commentY - 20 + bubbleYOffset;

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

      // Adjust the border radius based on the bubble position
      if (bubbleTexts.length === 1) {
        ctx.roundRect(scaled(bubbleX), scaled(bubbleY - bubblePadding), scaled(bubbleWidth), scaled(bubbleHeight), [33, 33, 33, 33]);
      } else if (i === 0) {
        ctx.roundRect(scaled(bubbleX), scaled(bubbleY - bubblePadding), scaled(bubbleWidth), scaled(bubbleHeight), [33, 33, 33, 8]);
      } else if (i === bubbleTexts.length - 1) {
        ctx.roundRect(scaled(bubbleX), scaled(bubbleY - bubblePadding), scaled(bubbleWidth), scaled(bubbleHeight), [8, 33, 33, 33]);
      } else {
        ctx.roundRect(scaled(bubbleX), scaled(bubbleY - bubblePadding), scaled(bubbleWidth), scaled(bubbleHeight), [8, 33, 33, 8]);
      }

      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Draw the comment text inside the bubble
      ctx.fillStyle = "#FFFFFF";
      bubbleLines.forEach((line, index) => {
        ctx.fillText(line, scaled(commentX), scaled(commentY + index * 28 + bubbleYOffset));
      });

      bubbleYOffset += bubbleHeight + 4;
    }

    // Draw the name text
    ctx.font = "400 19px Arial";
    ctx.fillStyle = "#FFFFFF";
    nameLines.forEach((line, index) => {
      ctx.fillText(line, scaled(nameX), scaled(nameY + index * 28));
    });

    // Draw the avatar on the left side
    const drawHiResAvatar = (image, x, y, size) => {
      ctx.save();
      ctx.beginPath();
      ctx.arc(
        scaled(x + size/2),
        scaled(y + size/2),
        scaled(size/2),
        0,
        Math.PI * 2
      );
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(
        image,
        scaled(x),
        scaled(y),
        scaled(size),
        scaled(size)
      );
      ctx.restore();
    };

    drawHiResAvatar(baseAvt1, 20, canvasHeight - 170, 50);
    drawHiResAvatar(baseAvt2, canvasWidth - 40, canvasHeight - 125, 25);

    const imageBuffer = canvas.toBuffer();
    fs.writeFileSync(pathImg, imageBuffer);
    return api.sendMessage({ attachment: fs.createReadStream(pathImg) },
      event.threadID, event.messageID);
  },
};
