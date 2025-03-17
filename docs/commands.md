# Creating Commands

This guide explains how to create commands for the Nexus Bot system.

## Command Structure

Each command is a JavaScript file in the `commands` directory. A command file has this basic structure:

```javascript
module.exports = {
  config: {
    name: "commandname",
    aliases: ["alias1", "alias2"],
    version: "1.0.0",
    author: "YourName",
    countDown: 5,
    role: 0,
    shortDescription: "Brief description",
    longDescription: "Detailed description of what the command does",
    category: "category",
    guide: "{prefix}commandname [option]"
  },

  execute: async function({ api, event, args, commands, prefix }) {
    // Command implementation goes here
    const { threadID, messageID } = event;
    
    // Example: Send a message
    api.sendMessage("Hello World!", threadID, messageID);
  }
};
```

## Command Configuration

The `config` object contains metadata about your command:

| Property | Description | Required |
|----------|-------------|----------|
| `name` | Command name (used to call the command) | Yes |
| `aliases` | Alternative names for the command | No |
| `version` | Command version | No |
| `author` | Command creator | No |
| `countDown` | Cooldown in seconds between uses | No (defaults to 3) |
| `role` | Permission level required (0-3) | No (defaults to 0) |
| `shortDescription` | Brief description | No |
| `longDescription` | Detailed description | No |
| `category` | Command category | No |
| `guide` | Usage instructions | No |

### Permission Roles

The `role` property determines who can use the command:

- **0**: Everyone
- **1**: Group admins
- **2**: Bot admins
- **3**: Bot owner only

## Command Execution

The `execute` function is called when the command is triggered. It receives an object with these properties:

| Property | Type | Description |
|----------|------|-------------|
| `api` | Object | Facebook API interface |
| `event` | Object | Message event that triggered the command |
| `args` | Array | Command arguments (words after the command) |
| `commands` | Map | Map of all available commands |
| `prefix` | String | Command prefix |
| `Users` | Object | User database interface (if available) |
| `Threads` | Object | Thread database interface (if available) |

### Event Object

The `event` object contains information about the message:

```javascript
{
  threadID: "1234567890",   // Conversation ID
  messageID: "abcdef123",   // Unique message ID
  senderID: "9876543210",   // User ID who sent the message
  body: "!command args",    // Message content
  attachments: [],          // Any attachments
  mentions: {}              // Users mentioned in the message
}
```

## Example Commands

### Simple Command

```javascript
module.exports = {
  config: {
    name: "ping",
    shortDescription: "Check if the bot is responding",
    category: "system"
  },
  
  execute: async function({ api, event }) {
    const { threadID } = event;
    api.sendMessage("Pong! 🏓", threadID);
  }
};
```

### Command with Arguments

```javascript
module.exports = {
  config: {
    name: "echo",
    shortDescription: "Repeat a message",
    guide: "{prefix}echo [message]",
    category: "utility"
  },
  
  execute: async function({ api, event, args }) {
    const { threadID } = event;
    const message = args.join(" ");
    
    if (!message) {
      return api.sendMessage("Please provide a message to echo.", threadID);
    }
    
    api.sendMessage(`You said: ${message}`, threadID);
  }
};
```

### Command with Permissions

```javascript
module.exports = {
  config: {
    name: "ban",
    role: 2,  // Requires admin permission
    shortDescription: "Ban a user",
    guide: "{prefix}ban [userID] [reason]",
    category: "admin"
  },
  
  execute: async function({ api, event, args }) {
    const { threadID } = event;
    const userID = args[0];
    const reason = args.slice(1).join(" ") || "No reason provided";
    
    if (!userID) {
      return api.sendMessage("Please provide a user ID to ban.", threadID);
    }
    
    // Ban implementation...
    api.sendMessage(`Banned user ${userID}. Reason: ${reason}`, threadID);
  }
};
```

## Best Practices

1. **Error Handling**: Always use try/catch blocks
2. **Performance**: Avoid heavy operations that block the main thread
3. **Permissions**: Set appropriate permission levels
4. **Documentation**: Provide clear usage instructions
5. **User Experience**: Give helpful feedback on errors

## Command Lifecycle

When a command file changes:
1. The file watcher detects the change
2. The command is automatically reloaded
3. The updated version becomes available immediately

This allows you to develop and test commands without restarting the bot.
