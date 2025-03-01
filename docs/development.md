# Development Guide

## Setting Up Development Environment

### Prerequisites
1. Node.js >= 18.0.0
2. Git
3. Code editor (VS Code recommended)
4. Facebook test account

### Installation
```bash
# Clone repository
git clone https://github.com/Nexus-016/nexus-bot.git

# Install dependencies
npm install

# Install development dependencies
npm install -D nodemon eslint prettier
```

### Development Mode
```bash
npm run dev
```

## Project Structure
```
nexus-bot/
├── commands/          # Command modules
│   ├── admin/
│   ├── economy/
│   └── system/
├── core/             # Core functionality
│   ├── commandHandler.js
│   └── eventHandler.js
├── database/         # SQLite database
├── docs/            # Documentation
├── events/          # Event handlers
├── modules/         # Bot modules
├── utils/           # Utility functions
└── config.json      # Bot configuration
```

## Code Style Guide
- Use camelCase for variables and functions
- Use PascalCase for classes
- Use meaningful variable names
- Add comments for complex logic
- Follow ESLint configuration
- Use async/await over callbacks

## Testing
```bash
# Run tests
npm test

# Run linter
npm run lint

# Fix linting issues
npm run lint:fix
```

## Debugging
1. Use logger for debugging:
```javascript
const logger = require('../utils/logger');
logger.debug('Debug message');
logger.info('Info message');
logger.error('Error message');
```

2. Enable debug mode in config:
```json
{
  "debug": {
    "enabled": true,
    "level": "verbose"
  }
}
```

## Performance Tips
1. Use caching when possible
2. Optimize database queries
3. Handle rate limits properly
4. Clean up resources
5. Use proper error handling
6. Monitor memory usage

## Security Considerations
1. Validate all user input
2. Use rate limiting
3. Implement access control
4. Secure sensitive data
5. Follow safe mode guidelines
6. Regular security audits
