# Auto-Recovery System

Nexus Bot includes a robust auto-recovery system that keeps the bot running even in challenging circumstances. This document describes how it works and how to configure it.

## Key Features

1. **Memory Monitoring**: Automatically restarts when memory usage gets too high
2. **Error Rate Tracking**: Restarts when too many errors occur in a short time
3. **Scheduled Restarts**: Performs periodic restarts to maintain performance
4. **Safe Shutdown**: Gracefully handles restarts to prevent data loss
5. **Recovery Markers**: Stores information about restarts for diagnostics

## How It Works

The auto-recovery system constantly monitors the bot's health and can trigger restarts in several ways:

### Memory-Based Recovery

The system regularly checks memory usage:

```javascript
static checkMemoryUsage() {
  const memUsage = process.memoryUsage();
  const rssMB = Math.round(memUsage.rss / 1024 / 1024);
  
  // Get configured memory threshold
  const threshold = config?.system?.autoRestart?.memoryThreshold || 500;
  
  // If we've exceeded our threshold, restart
  if (rssMB > threshold) {
    global.AutoRecovery.initiateRestart(
      'memory-limit', 
      `Memory usage (${rssMB}MB) exceeded threshold (${threshold}MB)`
    );
  }
}
```

### Error-Based Recovery

The system counts errors and restarts if too many occur:

```javascript
static trackError() {
  this.errorCount++;
  
  // Check if we need to restart due to errors
  const maxErrors = config?.system?.autoRestart?.maxErrorsBeforeRestart || 50;
  
  if (this.errorCount >= maxErrors) {
    global.AutoRecovery.initiateRestart(
      'error-threshold', 
      `${this.errorCount} errors triggered auto-restart`
    );
  }
}
```

### Scheduled Recovery

The system can perform regular scheduled restarts:

```javascript
static schedulePeriodicRestart() {
  const autoRestartConfig = config?.system?.autoRestart;
  
  if (autoRestartConfig?.enabled && autoRestartConfig?.interval) {
    const interval = autoRestartConfig.interval;
    
    setInterval(() => {
      this.initiateRestart('scheduled', 'Periodic scheduled restart');
    }, interval);
  }
}
```

## Restart Process

When a restart is triggered:

1. A restart marker file is created with details about the restart
2. Pre-restart tasks are performed (cache clearing, database backup)
3. Admin is notified about the restart with reason and details
4. The process exits with a special code
5. Process manager (or startup script) restarts the bot
6. On startup, the bot detects the restart marker and sends a recovery notification

## Configuration

Configure the auto-recovery system in the `config.json` file:

```json
"system": {
  "autoRestart": {
    "enabled": true,               // Master switch for auto-restart
    "memoryThreshold": 500,        // Memory threshold in MB
    "interval": 21600000,          // Restart every 6 hours (in ms)
    "type": "soft",                // Restart type (soft/hard)
    "refreshConnection": true,     // Refresh API connection on restart
    "reloadPermissions": true,     // Reload permissions on restart
    "clearCache": true,            // Clear cache before restart
    "backupDatabase": false,       // Backup database before restart
    "timeout": 3000,               // Wait time before restart (ms)
    "autoRestartOnError": true,    // Enable error-based restart
    "maxErrorsBeforeRestart": 20,  // Error threshold
    "errorResetInterval": 3600000  // Reset error count every hour
  }
}
```

## Notifications

The system notifies admins about restarts:

1. **Before restart**: Details about why the restart is happening
2. **After restart**: Confirmation that the bot is back online with downtime stats

Example notification:

```
✅ BOT RESTARTED SUCCESSFULLY

🔸 Downtime: 8 seconds
🔸 Restart type: soft
🔸 Reason: memory-limit
🔸 Details: Memory usage (520MB) exceeded threshold (500MB)

Bot is now back online and ready!
```

## Best Practices

1. **Set appropriate thresholds**: Too low memory thresholds cause frequent restarts
2. **Balance error sensitivity**: Too few allowed errors can cause excessive restarts
3. **Schedule restarts during low-usage times**: Minimize disruption
4. **Monitor recovery patterns**: Frequent restarts may indicate underlying issues
5. **Use database backup with caution**: It adds time to the restart process

## Troubleshooting

If the auto-recovery system isn't working correctly:

1. **Check logs for errors**: Look for issues in the auto-recovery system itself
2. **Verify process manager configuration**: Make sure it's set to restart the process
3. **Check file permissions**: Ensure the bot can create and read marker files
4. **Try manual restart**: Test if manual restarts work properly
5. **Check notifications**: Make sure admin IDs are correctly configured
