# Configuration Guide

Nexus Bot uses a central configuration system that allows customizing all aspects of the bot's behavior through the `config.json` file.

## Configuration File Structure

The main configuration file is located at `/config.json`. It uses a structured format with the following main sections:

```json
{
  "name": "NexusBot",
  "version": "1.0.0",
  "prefix": "!",
  "language": "en",
  "timezone": "UTC",
  "logLevel": "info",
  "admins": ["YOUR_FACEBOOK_ID_HERE"],
  "permissions": { ... },
  "system": { ... },
  "behavior": { ... },
  "safety": { ... },
  "database": { ... },
  "github": { ... }
}
```

## Core Configuration Options

| Option | Description | Default |
|--------|-------------|---------|
| `name` | Bot name | "NexusBot" |
| `version` | Bot version | "1.0.0" |
| `prefix` | Command prefix | "!" |
| `language` | Bot language | "en" |
| `timezone` | Time zone | "UTC" |
| `logLevel` | Logging level | "info" |
| `admins` | Array of admin Facebook IDs | [] |

## Permissions Configuration

The permissions section configures access control:

```json
"permissions": {
  "owner": "YOUR_FACEBOOK_ID",
  "superAdmins": []
}
```

## System Configuration

Controls system behavior, performance, and auto-restart features:

```json
"system": {
  "autoRestart": {
    "enabled": true,
    "memoryThreshold": 500,
    "interval": 21600000,
    "type": "soft",
    "refreshConnection": true,
    "reloadPermissions": true,
    "clearCache": true,
    "backupDatabase": false,
    "timeout": 3000,
    "autoRestartOnError": true,
    "maxErrorsBeforeRestart": 20,
    "errorResetInterval": 3600000
  },
  "performance": {
    "cacheEnabled": true,
    "cacheTimeout": 300000,
    "maxConcurrentCommands": 5,
    "maxCacheSize": 100,
    "cleanupInterval": 3600000,
    "commandDelay": {
      "min": 500, 
      "max": 2000
    }
  }
}
```

## Behavior Configuration

Controls how the bot interacts with users:

```json
"behavior": {
  "typing": {
    "enabled": false,
    "minSpeed": 50,
    "maxSpeed": 100
  },
  "activeHours": {
    "start": 0,
    "end": 24
  },
  "messageHandling": {
    "enabled": true,
    "autoRead": true,
    "typingIndicator": false,
    "seenIndicator": true,
    "delay": {
      "min": 500,
      "max": 2000
    }
  },
  "adminNotifications": true
}
```

## Safety Configuration

Controls rate limiting and moderation:

```json
"safety": {
  "enabled": true,
  "maxDailyMessages": 1000,
  "rateLimit": {
    "enabled": true,
    "windowMs": 60000,
    "max": 10
  },
  "moderation": {
    "enabled": true,
    "maxWarns": 3,
    "bannedWords": [],
    "spamProtection": true
  }
}
```

## Database Configuration

Controls database behavior:

```json
"database": {
  "backup": {
    "enabled": true,
    "interval": 3600000,
    "retention": 7
  },
  "backupPath": "database/backup",
  "path": "database/data.db"
}
```

## GitHub Integration

Controls GitHub integration for updates and backups:

```json
"github": {
  "enabled": false,
  "owner": "",
  "repo": "",
  "branch": "main",
  "token": "",
  "autoSync": false
}
```

## Using the Configuration Loader

In your code, you can access configuration values using the ConfigLoader:

```javascript
const configLoader = require('./utils/configLoader');
const config = configLoader.load();

// Access specific values with fallbacks
const prefix = configLoader.get("prefix", "!");
const memoryThreshold = configLoader.get("system.autoRestart.memoryThreshold", 500);
```

The `get()` method supports dot notation for accessing nested properties and providing default values.
