# Nexus Bot API Documentation

This document provides detailed information about the APIs available in Nexus Bot, including both the underlying ws3-fca (Facebook Chat API) and custom APIs developed for the project.

## Table of Contents

1. [Facebook Chat API (ws3-fca)](#facebook-chat-api-ws3-fca)
   - [Message Functions](#message-functions)
   - [Thread Management](#thread-management)
   - [User Information](#user-information)
   - [Event Listening](#event-listening)
   - [Media Functions](#media-functions)

2. [Nexus Bot Custom APIs](#nexus-bot-custom-apis)
   - [Safe API Wrappers](#safe-api-wrappers)
   - [Database API](#database-api)
   - [Permission System](#permission-system)
   - [Optimization Utilities](#optimization-utilities)
   - [Configuration Management](#configuration-management)

3. [Common Use Cases](#common-use-cases)
   - [Command Development](#command-development)
   - [Event Handling](#event-handling)
   - [Admin Operations](#admin-operations)

---

## Facebook Chat API (ws3-fca)

The ws3-fca library provides a wrapper around Facebook's Chat API, enabling programmatic access to Messenger functionality.

### Message Functions

#### `sendMessage`

Sends a message to a thread or user.

```javascript
api.sendMessage(message, threadID, callback, messageID);
```

**Parameters:**
- `message` (String|Object): The message content or an object with message options
- `threadID` (String): ID of the thread to send the message to
- `callback` (Function): Called when the message is sent
- `messageID` (String): Optional ID of a message to reply to

**Object Message Structure:**
```javascript
api.sendMessage({
  body: "Hello world!",               // Text content
  attachment: fs.createReadStream('file.jpg'), // File attachment
  url: "https://example.com/image.jpg", // URL to send
  sticker: "123456789",               // Sticker ID
  mentions: [{                        // Tag users in message
    tag: '@User',
    id: '1234567890',
    fromIndex: 0
  }],
  emoji: '😀',                        // Set emoji for thread
}, threadID);
```

#### `sendTypingIndicator`

Shows typing indicator in a thread.

```javascript
api.sendTypingIndicator(threadID, callback);
```

#### `markAsRead`

Marks messages in a thread as read.

```javascript
api.markAsRead(threadID);
```

#### `unsendMessage`

Unsends/removes a message.

```javascript
api.unsendMessage(messageID, callback);
```

#### `setMessageReaction`

Sets a reaction to a message.

```javascript
api.setMessageReaction("😍", messageID);
```

### Thread Management

#### `getThreadInfo`

Gets information about a thread.

```javascript
api.getThreadInfo(threadID, callback);
```

#### `getThreadList`

Gets a list of threads.

```javascript
api.getThreadList(limit, timestamp, tags, callback);
```

#### `changeThreadName`

Changes the name of a group chat.

```javascript
api.changeThreadName(newName, threadID, callback);
```

#### `addUserToGroup`

Adds a user to a group.

```javascript
api.addUserToGroup(userID, threadID, callback);
```

#### `removeUserFromGroup`

Removes a user from a group.

```javascript
api.removeUserFromGroup(userID, threadID, callback);
```

#### `changeAdminStatus`

Makes a user an admin or removes their admin status.

```javascript
api.changeAdminStatus(threadID, userID, adminStatus, callback);
```

### User Information

#### `getUserInfo`

Gets information about users.

```javascript
api.getUserInfo(userIDs, callback);
```

#### `getCurrentUserID`

Gets the user ID of the current user.

```javascript
api.getCurrentUserID();
```

#### `getFriendsList`

Gets the list of the user's friends.

```javascript
api.getFriendsList(callback);
```

### Event Listening

#### `listenMqtt`

Listens for incoming events from Messenger.

```javascript
api.listenMqtt((err, event) => {
  if (err) return console.error(err);
  
  // Process different event types
  switch (event.type) {
    case "message":
      // Handle new messages
      break;
    case "message_reply":
      // Handle message replies
      break;
    case "message_reaction":
      // Handle message reactions
      break;
    // ... other event types
  }
});
```

### Media Functions

#### `getAttachmentURL`

Gets a URL to download an attachment.

```javascript
api.getAttachmentURL(messageID, attachmentID, callback);
```

#### `sendAttachment`

Sends a file attachment.

```javascript
api.sendAttachment(attachment, threadID, callback);
```

---

## Nexus Bot Custom APIs

Nexus Bot extends the basic Facebook Chat API with additional utilities and wrappers for better functionality and safety.

### Safe API Wrappers

Located in `/utils/apiHelpers.js`, these wrappers provide error-resilient versions of Facebook API functions.

#### `safeApi.sendTypingIndicator`

Safely sends typing indicators without crashing on errors.

```javascript
const safeApi = require('../utils/apiHelpers');
await safeApi.sendTypingIndicator(api, threadID);
```

#### `safeApi.markAsRead`

Safely marks messages as read.

```javascript
await safeApi.markAsRead(api, threadID);
```

#### `safeApi.sendMessage`

Promisified version of sendMessage with better error handling.

```javascript
try {
  const msgInfo = await safeApi.sendMessage(api, "Hello world", threadID);
  console.log("Message sent with ID:", msgInfo.messageID);
} catch (error) {
  console.error("Failed to send message:", error);
}
```

### Database API

The database manager provides easy access to the bot's SQLite database.

#### `getUser`

Retrieves user information from the database.

```javascript
const dbManager = require('../modules/dbManager');
const user = await dbManager.getUser(userID);
```

#### `updateExp`

Updates a user's experience points.

```javascript
await dbManager.updateExp(userID, 10); // Add 10 XP
```

#### `updateMoney`

Updates a user's virtual currency balance.

```javascript
await dbManager.updateMoney(userID, 100); // Add 100 money
```

### Permission System

Manages user roles and permissions.

#### `getUserRole`

Gets a user's permission level.

```javascript
const permissionLevel = await global.permissionManager.getUserRole(userID);
// Returns: 0 (normal user), 1 (group admin), 2 (bot admin), 3 (bot owner)
```

#### `isThreadAdmin`

Checks if a user is an admin in a thread.

```javascript
const isAdmin = await global.permissionManager.isThreadAdmin(api, userID, threadID);
```

#### `setUserRole`

Sets a user's permission level.

```javascript
await global.permissionManager.setUserRole(userID, 2); // Make user a bot admin
```

### Optimization Utilities

The optimization module helps manage memory usage and error tracking.

#### `trackError`

Tracks errors and triggers auto-restart if needed.

```javascript
const Optimization = require('../utils/optimization');
try {
  // Some code
} catch (error) {
  Optimization.trackError(error);
}
```

#### `clearMemory`

Clears caches and triggers garbage collection.

```javascript
Optimization.clearMemory();
```

#### `checkMemoryUsage`

Checks memory usage and takes action if needed.

```javascript
Optimization.checkMemoryUsage();
```

### Configuration Management

The configuration loader manages bot settings.

#### `get`

Gets configuration values with support for paths and default values.

```javascript
const configLoader = require('../utils/configLoader');
const prefix = configLoader.get('prefix', '!');
const typingEnabled = configLoader.get('behavior.typing.enabled', false);
```

#### `update`

Updates configuration values.

```javascript
configLoader.update({
  prefix: '/',
  behavior: {
    typing: {
      enabled: true
    }
  }
});
```

---

## Common Use Cases

### Command Development

Creating a new command in Nexus Bot:

```javascript
// Path: /commands/example.js
module.exports = {
  config: {
    name: "example",
    aliases: ["ex", "demo"],
    version: "1.0.0",
    author: "YourName",
    countDown: 5, // Cooldown in seconds
    role: 0, // Permission level: 0=everyone, 1=group admin, 2=bot admin, 3=owner
    shortDescription: "Example command",
    longDescription: "An example command to demonstrate API usage",
    category: "utility",
    guide: "{prefix}example [argument]"
  },

  execute: async function({ api, event, args, prefix }) {
    const { threadID, senderID, messageID } = event;

    // Send a message
    api.sendMessage("This is an example command", threadID, messageID);

    // Get user info
    const userInfo = await api.getUserInfo(senderID);
    const userName = userInfo[senderID].name;

    // Send response with user name
    api.sendMessage(`Hello, ${userName}!`, threadID);

    // Use database functionality
    const dbManager = require('../modules/dbManager');
    await dbManager.updateExp(senderID, 5); // Award 5 XP

    // Check if user is admin in this thread
    const isAdmin = await global.permissionManager.isThreadAdmin(api, senderID, threadID);
    if (isAdmin) {
      api.sendMessage("You are an admin in this thread!", threadID);
    }
  }
};
```

### Event Handling

Creating a new event handler:

```javascript
// Path: /events/welcomeMessage.js
module.exports = {
  config: {
    name: "welcomeMessage",
    version: "1.0.0",
    description: "Welcomes new members to groups"
  },
  
  execute: async function({ api, event, config }) {
    // Skip events that aren't about adding participants
    if (event.type !== "event" || event.logMessageType !== "log:subscribe") {
      return;
    }
    
    const { threadID } = event;
    const addedParticipants = event.logMessageData.addedParticipants;
    
    // Skip if no participants or if it's the bot being added
    if (!addedParticipants || addedParticipants.some(p => p.userFbId === api.getCurrentUserID())) {
      return;
    }
    
    // Prepare welcome message
    const userNames = addedParticipants.map(user => user.fullName).join(", ");
    const welcomeMessage = `Welcome ${userNames} to the group! We're happy to have you here!`;
    
    // Send welcome message
    api.sendMessage(welcomeMessage, threadID);
    
    // Add user to database
    const dbManager = require('../modules/dbManager');
    for (const user of addedParticipants) {
      await dbManager.createUser(user.userFbId, user.fullName);
    }
  }
};
```

### Admin Operations

Performing administrative tasks:

```javascript
// Ban a user
async function banUser(api, threadID, userID, reason) {
  try {
    // Remove user from group
    await api.removeUserFromGroup(userID, threadID);
    
    // Add to banned users list in database
    const dbManager = require('../modules/dbManager');
    await dbManager.banUser(userID, reason);
    
    // Notify admins
    const adminID = global.config.admins[0];
    api.sendMessage(`User ${userID} banned from ${threadID}\nReason: ${reason}`, adminID);
    
    return true;
  } catch (error) {
    console.error("Failed to ban user:", error);
    return false;
  }
}

// Set thread settings
async function setThreadSettings(api, threadID, settings) {
  try {
    // Set thread name if provided
    if (settings.name) {
      await api.changeThreadName(settings.name, threadID);
    }
    
    // Set thread emoji if provided
    if (settings.emoji) {
      await api.changeThreadEmoji(settings.emoji, threadID);
    }
    
    // Set thread color if provided
    if (settings.color) {
      await api.changeThreadColor(settings.color, threadID);
    }
    
    // Update thread info in database
    const dbManager = require('../modules/dbManager');
    await dbManager.updateGroupInfo(threadID, settings);
    
    return true;
  } catch (error) {
    console.error("Failed to update thread settings:", error);
    return false;
  }
}
```

Remember that all API calls should have proper error handling to prevent the bot from crashing when Facebook API changes or experiences issues.
