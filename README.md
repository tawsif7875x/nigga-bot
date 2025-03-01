# Nexus Bot

A sophisticated Facebook Messenger bot with automatic GitHub database backup.

## Creating New Commands

To create a new command, follow these steps:

1. **Navigate to the `commands` folder**:
   ```bash
   cd /c:/Users/Administrator/Desktop/Nexus/commands
   ```

2. **Create a new file for your command**:
   ```bash
   touch yourCommandName.js
   ```

3. **Define your command in the new file**:
   ```javascript
   // filepath: /c:/Users/Administrator/Desktop/Nexus/commands/yourCommandName.js
   module.exports = {
     name: "yourCommandName",
     version: "1.0.0",
     author: "YourName",
     countDown: 5,
     role: 0,
     description: "Description of your command",
     execute(api, message) {
       // Your command logic here
       api.sendMessage("Your command executed successfully!", message.threadID);
     }
   };
   ```

4. **Save the file**. Your command is now ready to be used.

## Creating New Events

To create a new event, follow these steps:

1. **Navigate to the `events` folder**:
   ```bash
   cd /c:/Users/Administrator/Desktop/Nexus/events
   ```

2. **Create a new file for your event**:
   ```bash
   touch yourEventName.js
   ```

3. **Define your event in the new file**:
   ```javascript
   // filepath: /c:/Users/Administrator/Desktop/Nexus/events/yourEventName.js
   const config = require('../config.json');
   const logger = require('../utils/logger');

   module.exports = async function(api, message) {
     // Your event logic here
     logger.info("Your event triggered successfully");
   };
   ```

4. **Save the file**. Your event is now ready to be used.

## Loading Commands and Events

The bot automatically loads all commands and events from their respective folders. You do not need to manually load them.

### Example Command

Here is an example command to get you started:

```javascript
// filepath: /c:/Users/Administrator/Desktop/Nexus/commands/test.js
module.exports = {
  name: "test",
  version: "1.0.0",
  author: "NexusTeam",
  countDown: 5,
  role: 0,
  description: "A test command to verify the bot's functionality",
  execute(api, message) {
    api.sendMessage("Test command executed successfully!", message.threadID);
  }
};
```

### Example Event

Here is an example event to get you started:

```javascript
// filepath: /c:/Users/Administrator/Desktop/Nexus/events/introMessage.js
const config = require('../config.json');

module.exports = async function(api, message) {
  const groupId = message.threadID;
  const introMessage = `Hello everyone! I am ${config.botName}. I am here to assist you. Type ${config.prefix}help to see what I can do.`;
  api.sendMessage(introMessage, groupId);
};
```

## Running the Bot

To run the bot, use the following command:

```bash
npm start
```

This will start the bot and it will begin listening for commands and events.

## API for Configuration

You can update the bot's configuration dynamically using the provided API.

### Get Current Configuration

To get the current configuration, send a GET request to:

```
GET /config
```

### Update Configuration

To update the configuration, send a POST request with the new configuration to:

```
POST /config
```

Example request body:

```json
{
  "botName": "NexusBot",
  "prefix": "!",
  "botAdminUID": "100087550592244",
  "safeMode": {
    "enabled": true,
    "maxDailyMessages": 1000,
    "messageInterval": 2000,
    "preventLinks": true,
    "typingSimulation": true,
    "dailyMessageLimit": 100,
    "minInterval": 5000,
    "contentFilter": ["http", "https"]
  },
  "autoRestartMinutes": 60,
  "randomizeUserAgent": true,
  "proxy": {
    "enabled": false,
    "list": [
      "http://proxy1.example.com:8080",
      "http://proxy2.example.com:8080",
      "http://proxy3.example.com:8080"
    ]
  },
  "commandDelay": {
    "min": 500,
    "max": 1000
  },
  "autoPush": {
    "enabled": true,
    "repository": "https://github.com/yourusername/yourrepository.git"
  }
}
```

## GitHub Auto-Push Feature

The bot automatically backs up its database to GitHub for safe keeping and version control.

### Setup Instructions

1. **Create a GitHub Repository**
   - Create a new repository on GitHub
   - Note down your repository name and owner username

2. **Generate GitHub Token**
   - Go to GitHub Settings > Developer settings > Personal access tokens
   - Click "Generate new token (classic)"
   - Select these permissions:
     - `repo` (Full control of private repositories)
   - Copy the generated token

3. **Configure Auto-Push**
   - Open `config.json`
   - Update the GitHub section:
   ```json
   "github": {
     "enabled": true,
     "owner": "your-github-username",
     "repo": "your-repository-name",
     "token": "your-github-token",
     "branch": "main",
     "autoSync": true,
     "syncInterval": 3600000
   }
   ```

### How It Works

- The bot automatically pushes database changes to GitHub when:
  - New users are added
  - New groups are added
  - Database changes are made
  - Periodic sync interval is reached

### Sync Settings

- `autoSync`: Enable/disable automatic syncing
- `syncInterval`: Time between syncs in milliseconds (default: 1 hour)
- Changes are also pushed immediately after important updates

### Manual Database Backup

To manually trigger a database backup:
```bash
!admin backup
```
(Only works for bot administrators)

### Recovering Data

If you need to recover your database:
1. Download `database.sqlite` from your GitHub repository
2. Place it in the `database/` folder
3. Restart the bot

## Note

Make sure to never share your GitHub token. If compromised, immediately revoke it and generate a new one.
