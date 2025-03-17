# Event System Documentation

The Nexus Bot event system handles various Facebook Messenger events such as messages, user joins/leaves, nickname changes, and more. This guide explains how to create and use event handlers.

## Event Structure

Each event handler is a JavaScript file in the `events` directory with this structure:

```javascript
module.exports = {
  config: {
    name: "eventName",
    version: "1.0.0",
    description: "Handles a specific event"
  },
  
  execute: async function ({ api, event, config }) {
    // Event handling code goes here
    
    // Example: Log when a user joins a group
    if (event.type === 'group-join') {
      console.log(`User ${event.userID} joined group ${event.threadID}`);
    }
  }
};
```

## Event Handler Components

### Configuration Object

The `config` object provides metadata about the event handler:

| Property | Description | Required |
|----------|-------------|----------|
| `name` | Unique event handler name | Yes |
| `version` | Handler version | No |
| `description` | Description of what the handler does | No |

### Execute Function

The `execute` function is called for each applicable event. It receives:

| Parameter | Description |
|-----------|-------------|
| `api` | Facebook API interface |
| `event` | Event data with details about what happened |
| `config` | Bot configuration |

## Event Types

The `event.type` property indicates what kind of event occurred:

| Event Type | Description |
|------------|-------------|
| `message` | A regular message |
| `message_reply` | A reply to a message |
| `add_participants` | New members added to a group |
| `remove_participant` | Member removed from a group |
| `log:thread-name` | Group name was changed |
| `log:unsubscribe` | User left the group |
| `log:subscribe` | User joined the group |
| `log:nickname` | Nickname was changed |
| `reaction` | Message reaction added/removed |

## Example Event Handlers

### Message Event Handler

Handles regular message events:

```javascript
module.exports = {
  config: {
    name: "messageEvent",
    version: "1.0.0",
    description: "Handles message events"
  },

  execute: async function({ api, event, config }) {
    // Skip invalid events quickly
    if (!event || !event.threadID || !event.type || event.type !== 'message') {
      return;
    }

    // Skip commands - they're handled by the command handler
    if (event.body?.startsWith(config?.prefix || '!')) {
      return;
    }

    // Handle the message event
    // For example: Auto-respond to keywords
    if (event.body && event.body.toLowerCase().includes('hello')) {
      api.sendMessage("Hello there!", event.threadID);
    }
  }
};
```

### Admin Notification Event Handler

Sends notifications to admins about important group events:

```javascript
module.exports = {
  config: {
    name: "adminNoti",
    version: "1.0.0",
    description: "Send notifications to admins about important events"
  },
  
  execute: async function({ api, event, config }) {
    try {
      // Skip events that don't need admin notifications
      if (!event || !event.type) return;
      
      // Get admin UIDs from config
      const adminIds = Array.isArray(config?.admins) ? config.admins : [];
      
      if (adminIds.length === 0) return;
      
      // Only process specific event types that need admin attention
      const notifiableEvents = ['add_participants', 'remove_participant', 'log:thread-name'];
      
      if (!notifiableEvents.includes(event.type)) return;
      
      // Get event details and send notification
      let notificationMsg = '';
      
      switch(event.type) {
        case 'add_participants':
          notificationMsg = `👋 New users added to group ${event.threadID}`;
          break;
        case 'remove_participant':
          notificationMsg = `👋 User removed from group ${event.threadID}`;
          break;
        case 'log:thread-name':
          notificationMsg = `✏️ Group ${event.threadID} renamed to "${event.logMessageData?.name}"`;
          break;
        default:
          return;
      }
      
      // Send notification to all admins
      for (const adminId of adminIds) {
        api.sendMessage(`[ADMIN NOTIFICATION]\n${notificationMsg}`, adminId);
      }
    } catch (error) {
      console.error('Admin notification error:', error);
    }
  }
};
```

## Event Handler Best Practices

1. **Early Returns**: Use early returns to skip irrelevant events quickly
2. **Type Checking**: Always check event type before processing
3. **Error Handling**: Use try/catch blocks to prevent one event handler from crashing others
4. **Log Levels**: Use appropriate log levels (debug/info/warn/error)
5. **Performance**: Keep event handlers lightweight to prevent bottlenecks
6. **Debouncing**: For frequent events, implement rate-limiting or debouncing

## Event System Architecture

The event system follows these steps:

1. Events are received from the Facebook API
2. The core event handler (`eventHandler.js`) processes each event
3. Each registered event handler's `execute` function is called
4. Event handlers can process the event independently

This architecture allows multiple handlers to process the same event for different purposes.
