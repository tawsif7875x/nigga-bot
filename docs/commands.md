# Command Creation Guide

## Basic Command Structure
```javascript
module.exports = {
  config: {
    name: "commandName",
    aliases: ["alias1", "alias2"],
    version: "1.0.0",
    author: "YourName",
    countDown: 5,
    role: 0,
    shortDescription: "Short command description",
    longDescription: "Detailed command description",
    category: "category",
    guide: "{prefix}commandName [options]"
  },

  languages: {
    "en": {
      "success": "Success message",
      "error": "Error message: %1"
    },
    "vi": {
      "success": "Thành công",
      "error": "Lỗi: %1"
    }
  },

  execute: async function({ api, event, args }) {
    // Your command code here
  }
}
```

## Command Properties
| Property | Type | Description |
|----------|------|-------------|
| name | string | Command name |
| aliases | string[] | Alternative command names |
| version | string | Command version |
| countDown | number | Cooldown in seconds |
| role | number | Required permission level |
| category | string | Command category |

## Role Levels
- 0: Everyone
- 1: Group Admin
- 2: Bot Admin


## Example Commands

### Simple Command
```javascript
module.exports = {
  config: {
    name: "ping",
    category: "system",
    role: 0
  },
  execute: async function({ api, event }) {
    return api.sendMessage("Pong! 🏓", event.threadID);
  }
}
```

### Command with Arguments
```javascript
module.exports = {
  config: {
    name: "echo",
    category: "utility",
    guide: "{prefix}echo <message>"
  },
  execute: async function({ api, event, args }) {
    const message = args.join(" ");
    if (!message) return api.sendMessage("Please provide a message!", event.threadID);
    return api.sendMessage(message, event.threadID);
  }
}
```

### Database Command
```javascript
module.exports = {
  config: {
    name: "profile",
    category: "social"
  },
  execute: async function({ api, event, Users }) {
    const userData = await Users.getData(event.senderID);
    return api.sendMessage(
      `👤 Profile:\nName: ${userData.name}\nExp: ${userData.exp}`, 
      event.threadID
    );
  }
}
```

## Best Practices
1. Always validate user input
2. Include proper error handling
3. Use async/await for database operations
4. Add command documentation
5. Follow naming conventions
6. Include usage examples
