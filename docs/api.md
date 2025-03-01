# API Reference

## Command API
Commands have access to these objects:
```javascript
{
  api,        // Facebook API methods
  event,      // Message event data
  args,       // Command arguments
  prefix,     // Bot prefix
  Users,      // User database methods  
  Threads     // Thread database methods
}
```

## Event API 
Events receive:
```javascript
{
  api,        // Facebook API methods
  event,      // Event data
  Users,      // User database methods
  Threads     // Thread database methods
}
```

## Database API
```javascript
const db = require('../modules/dbManager');

// Users
await db.getUser(id);
await db.createUser(id, name);
await db.updateExp(id, amount);

// Groups
await db.createGroup(id, name);
await db.getGroup(id);
await db.updateGroupInfo(id, info);
```
