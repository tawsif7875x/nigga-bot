# ws3-fca API Reference

ws3-fca is a Facebook Chat API wrapper that allows developers to build automation on top of Facebook Messenger. This document details the available methods and their usage.

## Installation

```bash
npm install ws3-fca
```

## Methods

### Authentication

#### `login`

Logs in to Facebook and returns a promise that resolves with the API object.

```javascript
const ws3fca = require('ws3-fca');

ws3fca.login({
  email: 'user@example.com',
  password: 'password'
}, (err, api) => {
  if (err) return console.error(err);
  
  // API is now ready to use
});
```

#### `login` with appstate

```javascript
const ws3fca = require('ws3-fca');
const fs = require('fs');

const appstate = JSON.parse(fs.readFileSync('appstate.json', 'utf8'));

ws3fca.login({appState: appstate}, (err, api) => {
  if (err) return console.error(err);
  
  // API is now ready to use
  // Save new appstate for future use
  fs.writeFileSync('appstate.json', JSON.stringify(api.getAppState()));
});
```

### Message Functions

#### `sendMessage`

Sends a message to a user or group chat.

```javascript
api.sendMessage('Hello, world!', '123456789', (err, messageInfo) => {
  if (err) return console.error(err);
  
  console.log(`Message sent with ID: ${messageInfo.messageID}`);
});
```

**Advanced Message Options:**

```javascript
api.sendMessage({
  body: 'This message has an attachment',
  attachment: fs.createReadStream('image.jpg')
}, '123456789');
```

```javascript
api.sendMessage({
  body: 'This message mentions someone',
  mentions: [{
    tag: '@John',
    id: '123456789',
    fromIndex: 19 // position in the message where the mention appears
  }]
}, '123456789');
```

#### `sendTypingIndicator`

Shows a typing indicator in a conversation.

```javascript
api.sendTypingIndicator('123456789', (err) => {
  if (err) return console.error(err);
});
```

#### `markAsRead`

Marks a conversation as read.

```javascript
api.markAsRead('123456789', (err) => {
  if (err) return console.error(err);
});
```

#### `unsendMessage`

Unsends/removes a message.

```javascript
api.unsendMessage('message_id', (err) => {
  if (err) return console.error(err);
});
```

#### `setMessageReaction`

Sets a reaction to a message.

```javascript
// Available reactions: 😍, 😆, 😮, 😢, 😠, 👍, 👎
api.setMessageReaction('😍', 'message_id', (err) => {
  if (err) return console.error(err);
});
```

### Thread/Group Management

#### `getThreadInfo`

Gets information about a thread (direct message or group chat).

```javascript
api.getThreadInfo('123456789', (err, threadInfo) => {
  if (err) return console.error(err);
  
  console.log(threadInfo);
  /*
  {
    threadID: '123456789',
    participantIDs: ['123', '456', '789'],
    name: 'Group chat name',
    nicknames: {},
    emoji: '😀',
    color: '#0084ff',
    adminIDs: [{id: '123'}],
    // ... other fields
  }
  */
});
```

#### `getThreadList`

Gets a list of threads.

```javascript
api.getThreadList(20, null, [], (err, threadList) => {
  if (err) return console.error(err);
  
  console.log(threadList);
});
```

#### `addUserToGroup`

Adds a user to a group chat.

```javascript
api.addUserToGroup('user_id', 'thread_id', (err) => {
  if (err) return console.error(err);
});
```

#### `removeUserFromGroup`

Removes a user from a group chat.

```javascript
api.removeUserFromGroup('user_id', 'thread_id', (err) => {
  if (err) return console.error(err);
});
```

#### `changeThreadName`

Changes the name of a group chat.

```javascript
api.changeThreadName('New Name', 'thread_id', (err) => {
  if (err) return console.error(err);
});
```

#### `changeThreadEmoji`

Changes the emoji of a group chat.

```javascript
api.changeThreadEmoji('🚀', 'thread_id', (err) => {
  if (err) return console.error(err);
});
```

#### `changeThreadColor`

Changes the color theme of a thread.

```javascript
api.changeThreadColor('#AABBCC', 'thread_id', (err) => {
  if (err) return console.error(err);
});
```

#### `changeAdminStatus`

Makes a user an admin or removes their admin status.

```javascript
api.changeAdminStatus('thread_id', 'user_id', true, (err) => {
  if (err) return console.error(err);
});
```

### User Information

#### `getUserInfo`

Gets information about one or more users.

```javascript
api.getUserInfo(['user_id_1', 'user_id_2'], (err, userInfo) => {
  if (err) return console.error(err);
  
  console.log(userInfo);
  /*
  {
    'user_id_1': {
      name: 'User 1',
      firstName: 'User',
      vanity: 'user1',
      profileUrl: 'https://facebook.com/user1',
      gender: 1, // 1 for female, 2 for male
      type: 'user',
      isFriend: true,
      // ... other fields
    },
    'user_id_2': {
      // ... similar fields
    }
  }
  */
});
```

#### `getCurrentUserID`

Gets the user ID of the account currently logged in.

```javascript
const myUserId = api.getCurrentUserID();
```

#### `getFriendsList`

Gets a list of the user's friends.

```javascript
api.getFriendsList((err, friendList) => {
  if (err) return console.error(err);
  
  console.log(friendList);
  /*
  [{
    userID: '123456789',
    fullName: 'John Doe',
    firstName: 'John',
    // ... other fields
  }]
  */
});
```

### Event Listening

#### `listenMqtt`

Listens for new messages and other events.

```javascript
api.listenMqtt((err, event) => {
  if (err) return console.error(err);
  
  switch (event.type) {
    case 'message':
      console.log(`New message from ${event.senderID}: ${event.body}`);
      break;
    case 'message_reaction':
      console.log(`Reaction ${event.reaction} to message ${event.messageID}`);
      break;
    case 'event':
      console.log(`Event in thread ${event.threadID}: ${event.logMessageBody}`);
      break;
    // ... other event types
  }
});
```

### Media Management

#### `getAttachmentURL`

Gets the URL of an attachment.

```javascript
api.getAttachmentURL('message_id', 'attachment_id', (err, url) => {
  if (err) return console.error(err);
  
  console.log(`Attachment URL: ${url}`);
});
```

#### `sendAttachment`

Sends a file attachment.

```javascript
const attachment = fs.createReadStream('file.jpg');

api.sendAttachment(attachment, 'thread_id', (err, messageInfo) => {
  if (err) return console.error(err);
  
  console.log(`Attachment sent with ID: ${messageInfo.messageID}`);
});
```

### Additional Settings

#### `setOptions`

Sets various options for the API.

```javascript
api.setOptions({
  listenEvents: true,          // Listen for events (e.g., read receipts, typing notifications)
  selfListen: true,            // Listen for own messages
  updatePresence: true,        // Update presence information (online, offline, etc.)
  forceLogin: true,            // Force login even if session is invalid
  autoMarkDelivery: true,      // Automatically mark messages as delivered
  autoMarkRead: false,         // Automatically mark messages as read
  logRecordSize: 100,          // Number of log records to keep
  online: true                 // Set status to online
});
```

## Event Types

The `listenMqtt` method returns different types of events:

### `message`

A new message has been received.

```javascript
{
  type: 'message',
  senderID: '123456789',
  body: 'Hello, world!',
  threadID: '123456789',
  messageID: 'mid.$abcdef123456789',
  attachments: [],
  mentions: {},
  timestamp: 1234567890,
  isGroup: false
}
```

### `message_reply`

A message has been replied to.

```javascript
{
  type: 'message_reply',
  messageReply: {
    threadID: '123456789',
    messageID: 'mid.$abcdef123456789',
    senderID: '123456789',
    body: 'Original message'
  },
  // ... same fields as message
}
```

### `event`

A group chat event has occurred (e.g., adding/removing users, changing name).

```javascript
{
  type: 'event',
  threadID: '123456789',
  logMessageType: 'log:subscribe', // or log:unsubscribe, log:thread-name, etc.
  logMessageData: {
    // Data specific to the event type
  },
  logMessageBody: 'User added User to the group.'
}
```

### `message_reaction`

A reaction has been added to or removed from a message.

```javascript
{
  type: 'message_reaction',
  messageID: 'mid.$abcdef123456789',
  reaction: '😍',
  senderID: '123456789',
  threadID: '123456789',
  timestamp: 1234567890
}
```

### `presence`

A user's online presence has changed.

```javascript
{
  type: 'presence',
  userID: '123456789',
  timestamp: 1234567890,
  statuses: 0 // 0 = idle, 2 = online
}
```

## Error Handling

Most methods support a callback function that receives an error as the first parameter:

```javascript
api.sendMessage('Hello', 'thread_id', (err, messageInfo) => {
  if (err) {
    if (err.error === 'Not logged in.') {
      // Handle login issues
    } else {
      // Handle other errors
    }
    return;
  }
  
  // Message sent successfully
});
```

## Configuration Options

When initializing the API, you can provide several options:

```javascript
ws3fca.login({
  appState: JSON.parse(fs.readFileSync('appstate.json', 'utf8')),
  logLevel: 'silent', // 'silent', 'verbose', or 'debug'
  selfListen: true,   // Listen to your own messages
  listenEvents: true, // Listen to events (not just messages)
  updatePresence: true, // Update presence information
  forceLogin: true,  // Force login even if session is invalid
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.150 Safari/537.36', // Custom user agent
}, (err, api) => {
  if (err) return console.error(err);
  
  // API is ready to use
});
```

## Usage Notes

1. Facebook frequently changes their API, which may cause ws3-fca to break. Always be prepared to handle errors.
2. Avoid sending messages too quickly to prevent getting rate limited or blocked.
3. Using a real Facebook account for bots violates Facebook's Terms of Service. Use at your own risk.
4. Always implement proper error handling in production applications.
