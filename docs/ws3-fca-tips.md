# ws3-fca Troubleshooting Guide

This document contains tips and fixes for common ws3-fca issues, particularly with sending attachments.

## Image Sending Issues

If your bot is having trouble sending images with ws3-fca, try these approaches:

### 1. Basic Image Sending Pattern

Use this pattern for the most reliable image sending:

```javascript
// Single image sending - most reliable pattern
api.sendMessage({ 
    attachment: fs.createReadStream('/path/to/image.jpg') 
}, threadID);
```

### 2. Avoid Complex Messages

Separate text and attachments if having issues:

```javascript
// Step 1: Send attachment only
await api.sendMessage({ 
    attachment: fs.createReadStream('/path/to/image.jpg') 
}, threadID);

// Step 2: Send text separately
await api.sendMessage("Your message text here", threadID);
```

### 3. Resolution for Common ws3-fca Errors

#### TypeError: utils.CustomError is not a constructor

Add this patch to fix the error:

```javascript
// Add this to your bot startup code
const fs = require('fs');
const path = require('path');

try {
  const filePath = path.join(process.cwd(), 'node_modules/ws3-fca/src/addUserToGroup.js');
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/new utils\.CustomError\((.*?)\)/g, 'new Error($1)');
    fs.writeFileSync(filePath, content);
    console.log("Fixed utils.CustomError issue in ws3-fca");
  }
} catch (error) {
  console.error("Failed to patch ws3-fca:", error);
}
```

#### Image Sending Fails Silently

1. **Check File Size**: Ensure the image file is not too large (keep under 5MB)
2. **Verify Path**: Make sure the file exists before sending
3. **Use Stream Instead of Buffer**: Always use createReadStream instead of Buffer
4. **Wait for Stream**: Make sure the stream is fully ready before sending

```javascript
// Reliable way to ensure file exists and is valid
const imagePath = '/path/to/image.jpg';
if (fs.existsSync(imagePath) && fs.statSync(imagePath).size > 0) {
  const stream = fs.createReadStream(imagePath);
  stream.on('ready', () => {
    api.sendMessage({ attachment: stream }, threadID);
  });
} else {
  api.sendMessage("Could not send image: file not found or empty", threadID);
}
```

### 4. Alternative API Methods

For very stubborn cases, try alternative methods:

#### Upload and send URL
```javascript
// Upload to a temporary image service, then send URL
const imgbbUploader = require('imgbb-uploader');
const imageAsBase64 = fs.readFileSync('/path/to/image.jpg', { encoding: 'base64' });

const response = await imgbbUploader({
  apiKey: 'your-imgbb-api-key', 
  base64string: imageAsBase64
});

api.sendMessage({
  body: "Here's your image: " + response.url,
  url: response.url
}, threadID);
```

## Final Tips

1. Always test with a simple direct image path first
2. Avoid complex messages with attachments and text together
3. Add detailed logging for debugging
4. Test with multiple devices/accounts to isolate the issue
5. Consider using a different FCA library if problems persist
