# Event System Guide

## Event Structure
```javascript
module.exports = {
  config: {
    name: "eventName",
    version: "1.0.0",
    author: "YourName",
    description: "Event description"
  },

  execute: async function({ api, event }) {
    // Your event code here
  }
}
```

## Available Events

### Message Events
- `messageEvent`: Regular messages
- `message_reaction`: Message reactions
- `message_unsend`: Deleted messages
- `message_reply`: Message replies

### Group Events
- `log:subscribe`: New member joins
- `log:unsubscribe`: Member leaves
- `log:thread-name`: Group name changes
- `log:thread-icon`: Icon changes
- `log:thread-color`: Theme color changes
- `log:thread-call`: Voice call events

### User Events
- `presence`: Online/offline status
- `typ`: Typing status
- `read_receipt`: Message read status

## Example Events

### Welcome Message Event
```javascript
module.exports = {
  config: {
    name: "welcome",
    version: "1.0"
  },
  execute: async function({ api, event }) {
    const { logMessageData, threadID } = event;
    
    if (event.logMessageType === "log:subscribe") {
      const newMembers = logMessageData.addedParticipants;
      for (const member of newMembers) {
        api.sendMessage(
          `Welcome ${member.fullName} to the group! 👋`,
          threadID
        );
      }
    }
  }
}
```

### Message Reaction Event
```javascript
module.exports = {
  config: {
    name: "reaction"
  },
  execute: async function({ api, event }) {
    const { reaction, messageID, threadID } = event;
    // Handle reaction
  }
}
```

## Event Properties
| Property | Description |
|----------|-------------|
| type | Event type |
| threadID | Group/Chat ID |
| messageID | Message ID |
| senderID | User ID |
| logMessageType | Group event type |
| logMessageData | Event data |

## Best Practices
1. Always validate event data
2. Handle errors gracefully
3. Use try-catch blocks
4. Log important events
5. Optimize for performance
6. Follow security guidelines
