# Nexus Bot Configuration Guide

## Basic Configuration
| Setting | Description | Default |
|---------|-------------|---------|
| `botName` | Name of the bot | NexusBot |
| `prefix` | Command prefix | ! |
| `botAdminUID` | Admin user ID | 100087550592244 |

## Safe Mode Settings
- `enabled`: Enable/disable safe mode
- `maxDailyMessages`: Maximum messages per day (1000)
- `minMessageInterval`: Minimum delay between messages (2000ms)
- `maxMessageInterval`: Maximum delay between messages (5000ms)
- `contentFilter`: List of filtered content types ["spam", "abuse", "nsfw"]

## Bot Behavior
### Typing Simulation
- `enabled`: Enable/disable typing simulation
- `minSpeed`: Minimum typing speed (50)
- `maxSpeed`: Maximum typing speed (100)

### Active Hours
- `start`: Start hour (8)
- `end`: End hour (22)

### Auto Breaks
- `enabled`: Enable/disable auto breaks
- `minDuration`: Minimum break duration (300000ms)
- `maxDuration`: Maximum break duration (900000ms)

## Database
- `backupEnabled`: Enable automatic backups
- `backupInterval`: Backup interval in ms (3600000)

## Moderation
- `enabled`: Enable moderation features
- `maxWarns`: Maximum warnings before action (3)
- `bannedWords`: List of banned words
- `spamProtection`: Enable spam protection

## GitHub Integration
- `enabled`: Enable GitHub features
- `owner`: GitHub username
- `repo`: Repository name
- `branch`: Branch name (main)
- `autoSync`: Enable auto sync
- `syncInterval`: Sync interval in ms (3600000)
- `backupRetention`: Days to retain backups (7)

## Performance Settings
### Cache
- `cacheEnabled`: Enable caching
- `cacheTimeout`: Cache timeout in ms (300000)
- `maxConcurrentCommands`: Max simultaneous commands (5)
- `commandQueueSize`: Command queue size (100)

### Rate Limiting
- `enabled`: Enable rate limiting
- `windowMs`: Time window for rate limit (60000ms)
- `max`: Maximum requests per window (10)

### Memory Management
- `autoCleanup`: Enable auto memory cleanup
- `cleanupInterval`: Cleanup interval in ms (3600000)
- `maxCacheSize`: Maximum cache entries (100)

### Command Processing
- `commandDelay.min`: Minimum command delay (500ms)
- `commandDelay.max`: Maximum command delay (2000ms)
- `messageQueue.size`: Message queue size (50)
- `messageQueue.processInterval`: Processing interval (1000ms)

### Auto Restart
- `enabled`: Enable auto restart
- `interval`: Restart interval (21600000ms)
- `memoryThreshold`: Memory threshold in MB (500)
- `uptimeThreshold`: Uptime threshold (43200000ms)

## Maintenance
- `cleanup.enabled`: Enable auto cleanup
- `cleanup.interval`: Cleanup interval (86400000ms)

## Usage Example
```json
{
  "botName": "NexusBot",
  "prefix": "!",
  "safeMode": {
    "enabled": true,
    "maxDailyMessages": 1000
  }
  // ... other settings ...
}
```

For detailed implementation, refer to the main config.json file.
