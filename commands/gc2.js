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
    const commentMaxWidth = 1350; // Set a max width for the comment
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
      totalBubbleHeight += bubbleHeight + 30; // Add some spacing between bubbles
    }

    let rh = replyImage? 1200:0; // Increased from 600 to 800 for larger reply image
    // Calculate canvas dimensions based on the total height of all bubbles
    const canvasWidth = commentMaxWidth + 600;
    const canvasHeight = totalBubbleHeight + 480 + 120 + rh; // Add extra space for the image

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

    // Get the current time in Dhaka timezone
    const t = new Date().toLocaleTimeString([], { timeZone: 'Asia/Dhaka', hour: '2-digit', minute: '2-digit', hour12: true });

    // Draw the time at the top-middle of the canvas
    ctx.font = "530 51px sans-serif";
    ctx.fillStyle = "#FFFFFF";
    const timeTextWidth = ctx.measureText(t).width;
    const timeX = (canvasWidth - timeTextWidth) / 2; // Center the time text
    const timeY = 120; // Position at the top (increased by 60 pixels)
    ctx.fillText(t, timeX, timeY);

    // Draw the replied image if it exists
    let contentYOffset = 0;
    if (replyImage) {
      // Calculate dimensions for the replied image (increased size)
      const maxImageWidth = canvasWidth - 100; // Reduced margin for larger image
      const maxImageHeight = 1200; // Increased max height
      let imageWidth = replyImage.width + 900;
      let imageHeight = replyImage.height + 900;
      
      // Maintain aspect ratio
      const aspectRatio = replyImage.width / replyImage.height;
      if (imageWidth > maxImageWidth) {
        imageWidth = maxImageWidth;
        imageHeight = imageWidth / aspectRatio;
      }
      if (imageHeight > maxImageHeight) {
        imageHeight = maxImageHeight;
        imageWidth = imageHeight * aspectRatio;
      }
      
      // Center the image horizontally
      const imageX = 300;
      const imageY = 270; // Position below the time
      
      // Draw rounded rectangle for the image
      const borderRadius = 50; // Corner radius
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(imageX, imageY, imageWidth, imageHeight, borderRadius);
      ctx.closePath();
      ctx.clip();
      
      // Draw the image
      ctx.drawImage(replyImage, imageX, imageY, imageWidth, imageHeight);
      ctx.restore();
      
      // Add to the content offset
      contentYOffset = imageHeight;
    }

    const commentX = 375;
    const commentY = 420; // Adjust position based on image presence

    const nameMaxWidth = canvas.width - 120;
    const nameX = 345;
    const nameY = 240; // Adjust position based on image presence
    ctx.font = "530 75px Arial";
    ctx.fillStyle = "#FFFFFF";

    const nameLines = await this.wrapText(ctx, mentionedName, nameMaxWidth);

    // Draw each bubble separately
    let bubbleYOffset = 0;
    for (let i = 0; i < bubbleTexts.length; i++) {
      const bubbleText = bubbleTexts[i].trim();
      if (!bubbleText) continue;

      const bubbleLines = await this.wrapText(ctx, bubbleText, commentMaxWidth);

      // Calculate the dimensions of the speech bubble
      const bubblePadding = 54;
      const bubbleMaxWidth = commentMaxWidth + 105;
      const longestLineWidth = Math.max(...bubbleLines.map(line => ctx.measureText(line).width));
      const bubbleWidth = Math.min(longestLineWidth + 135, bubbleMaxWidth);
      const bubbleHeight = bubbleLines.length * 84 + bubblePadding + bubblePadding;

      // Adjust the bubble's horizontal position without affecting the text
      const bubbleX = commentX - 72; // Move the bubble to the left
      let bubbleY = commentY - 60 + bubbleYOffset;

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
        ctx.roundRect(bubbleX, bubbleY - bubblePadding, bubbleWidth, bubbleHeight, [99, 99, 99, 99]);
      } else if (i === 0) {
        // First bubble: down-left border not rounded
        ctx.roundRect(bubbleX, bubbleY - bubblePadding, bubbleWidth, bubbleHeight, [99, 99, 99, 24]);
      } else if (i === bubbleTexts.length - 1) {
        // Last bubble: up-left border not rounded
        ctx.roundRect(bubbleX, bubbleY - bubblePadding, bubbleWidth, bubbleHeight, [24, 99, 99, 99]);
      } else {
        // Middle bubbles: all borders rounded
        ctx.roundRect(bubbleX, bubbleY - bubblePadding, bubbleWidth, bubbleHeight, [24, 99, 99, 24]);
      }

      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Draw the comment text inside the bubble
      ctx.fillStyle = "#FFFFFF";
      bubbleLines.forEach((line, index) => {
        ctx.fillText(line, commentX, commentY + index * 84 + bubbleYOffset);
      });

      // Update the Y offset for the next bubble
      bubbleYOffset += bubbleHeight + 12;// Add some spacing between bubbles
    }

    // Draw the name text
    ctx.font = "400 57px Arial";
    ctx.fillStyle = "#FFFFFF";
    nameLines.forEach((line, index) => {
      ctx.fillText(line, nameX, nameY + index * 84);
    });

    // Draw the avatar on the left side
    const avatarX = 60;
    const avatarY = canvasHeight - 510 - (replyImage ? 0 : 0); // Adjust if needed
    const avatarWidth = 150;
    const avatarHeight = 150;

    ctx.save(); // Save the current context state
    ctx.beginPath();
    ctx.arc(avatarX + avatarWidth / 2, avatarY + avatarHeight / 2, avatarWidth / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(baseAvt1, avatarX, avatarY, avatarWidth, avatarHeight);
    ctx.restore(); // Restore the context state

    // Draw the cloned avatar on the right side with a smaller size
    const clonedAvatarX = canvasWidth - 120; // Adjust the X position for the right side
    const clonedAvatarY = canvasHeight - 375 - (replyImage ? 0 : 0); // Adjust if needed
    const clonedAvatarWidth = 75; // Smaller size
    const clonedAvatarHeight = 75; // Smaller size

    ctx.save(); // Save the current context state
    ctx.beginPath();
    ctx.arc(clonedAvatarX + clonedAvatarWidth / 2, clonedAvatarY + clonedAvatarHeight / 2, clonedAvatarWidth / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(baseAvt2, clonedAvatarX, clonedAvatarY, clonedAvatarWidth, clonedAvatarHeight);
    ctx.restore(); // Restore the context state

    const imageBuffer = canvas.toBuffer();
    fs.writeFileSync(pathImg, imageBuffer);
    return api.sendMessage({ attachment: fs.createReadStream(pathImg) },
      event.threadID, event.messageID);
  },
};
