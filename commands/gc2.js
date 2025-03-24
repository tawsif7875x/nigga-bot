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
  // New function to apply sharpening effect
  sharpenImage: function(ctx, canvas) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const width = canvas.width;
    const height = canvas.height;
    
    // Create a temporary copy of the image data
    const tempData = new Uint8ClampedArray(data);
    
    // Apply simple sharpening kernel
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        for (let c = 0; c < 3; c++) {
          const idx = (y * width + x) * 4 + c;
          // Sharpening kernel (approximation of unsharp masking)
          data[idx] = Math.min(255, Math.max(0, 
            tempData[idx] * 1.8 - 
            tempData[(y * width + (x-1)) * 4 + c] * 0.2 -
            tempData[(y * width + (x+1)) * 4 + c] * 0.2 -
            tempData[((y-1) * width + x) * 4 + c] * 0.2 -
            tempData[((y+1) * width + x) * 4 + c] * 0.2
          ));
        }
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
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

    // Create a temporary canvas to measure text dimensions
    let tempCanvas = createCanvas(1, 1);
    let tempCtx = tempCanvas.getContext("2d");
    tempCtx.font = "530 25px Arial";

    // Measure the comment text
    const commentMaxWidth = 450; // Set a max width for the comment
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
      totalBubbleHeight += bubbleHeight + 10; // Add some spacing between bubbles
    }

    // Calculate canvas dimensions based on the total height of all bubbles
    const canvasWidth = commentMaxWidth + 200;
    const canvasHeight = totalBubbleHeight + 160 + 40; // Add extra 50 pixels to the top

    let canvas = createCanvas(canvasWidth, canvasHeight);
    let ctx = canvas.getContext("2d");

    // Enable image smoothing for better quality
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

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

    // Get the current time in Dhaka timezone
    const t = new Date().toLocaleTimeString([], { timeZone: 'Asia/Dhaka', hour: '2-digit', minute: '2-digit', hour12: true });

    // Draw the time at the top-middle of the canvas
    ctx.font = "530 17px sans-serif";
    ctx.fillStyle = "#FFFFFF";
    const timeTextWidth = ctx.measureText(t).width;
    const timeX = (canvasWidth - timeTextWidth) / 2; // Center the time text
    const timeY = 40; // Position at the top (increased by 20 pixels)
    ctx.fillText(t, timeX, timeY);

    const commentX = 125;
    const commentY = 140; // Increased by 50 pixels to shift content downward

    const nameMaxWidth = canvas.width - 40;
    const nameX = 115;
    const nameY = 85; // Increased by 50 pixels to shift content downward
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
      const bubbleX = commentX - 24; // Move the bubble to the left
      let bubbleY = commentY - 20 + bubbleYOffset;

      let fills = "rgba(51, 51, 51, 1.0)";
      let strokes = "rgba(51, 51, 51, 1.0)";
      if (bn === 1) { 
        fills = "rgba(51, 34, 17, 1)";
        strokes = "rgba(51, 34, 17, 1)";
      }
      ctx.fillStyle = fills; // 85% opacity
      ctx.strokeStyle = strokes; // 85% opacity
      ctx.lineWidth = 0;
      ctx.beginPath();

      // Adjust the border radius based on the bubble position
      if (bubbleTexts.length === 1) {
        // Only one bubble: all borders rounded
        ctx.roundRect(bubbleX, bubbleY - bubblePadding, bubbleWidth, bubbleHeight, [33, 33, 33, 33]);
      } else if (i === 0) {
        // First bubble: down-left border not rounded
        ctx.roundRect(bubbleX, bubbleY - bubblePadding, bubbleWidth, bubbleHeight, [33, 33, 33, 8]);
      } else if (i === bubbleTexts.length - 1) {
        // Last bubble: up-left border not rounded
        ctx.roundRect(bubbleX, bubbleY - bubblePadding, bubbleWidth, bubbleHeight, [8, 33, 33, 33]);
      } else {
        // Middle bubbles: all borders rounded
        ctx.roundRect(bubbleX, bubbleY - bubblePadding, bubbleWidth, bubbleHeight, [8, 33, 33, 8]);
      }

      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Draw the comment text inside the bubble
      ctx.fillStyle = "#FFFFFF";
      bubbleLines.forEach((line, index) => {
        ctx.fillText(line, commentX, commentY + index * 28 + bubbleYOffset); // Keep the comment text position unchanged
      });

      // Update the Y offset for the next bubble
      bubbleYOffset += bubbleHeight + 4;// Add some spacing between bubbles
    }

    // Draw the name text
    ctx.font = "400 19px Arial";
    ctx.fillStyle = "#FFFFFF";
    nameLines.forEach((line, index) => {
      ctx.fillText(line, nameX, nameY + index * 28);
    });

    // Draw the avatar on the left side
    const avatarX = 20;
    const avatarY = canvasHeight - 170; // Adjusted to align with the new canvas height
    const avatarWidth = 50;
    const avatarHeight = 50;

    ctx.save(); // Save the current context state
    ctx.beginPath();
    ctx.arc(avatarX + avatarWidth / 2, avatarY + avatarHeight / 2, avatarWidth / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(baseAvt1, avatarX, avatarY, avatarWidth, avatarHeight);
    ctx.restore(); // Restore the context state

    // Draw the cloned avatar on the right side with a smaller size
    const clonedAvatarX = canvasWidth - 40; // Adjust the X position for the right side
    const clonedAvatarY = canvasHeight - 125; // Adjusted to align with the new canvas height
    const clonedAvatarWidth = 25; // Smaller size
    const clonedAvatarHeight = 25; // Smaller size

    ctx.save(); // Save the current context state
    ctx.beginPath();
    ctx.arc(clonedAvatarX + clonedAvatarWidth / 2, clonedAvatarY + clonedAvatarHeight / 2, clonedAvatarWidth / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(baseAvt2, clonedAvatarX, clonedAvatarY, clonedAvatarWidth, clonedAvatarHeight);
    ctx.restore(); // Restore the context state

    // Apply sharpening effect to the entire canvas
    this.sharpenImage(ctx, canvas);

    const imageBuffer = canvas.toBuffer('image/png', { compressionLevel: 0, filters: canvas.PNG_FILTER_NONE });
    fs.writeFileSync(pathImg, imageBuffer);
    return api.sendMessage({ attachment: fs.createReadStream(pathImg) },
      event.threadID, event.messageID);
  },
};
