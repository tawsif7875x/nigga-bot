# Nexus Bot

<p align="center">
  <img src="https://drive.google.com/file/d/1CNB3_wp6REYTWlZyjQ7zOnkZpfOsLWZF/view?usp=sharing" alt="Nexus Bot Logo" width="200" height="200">
</p>

<p align="center">
  <b>A Powerful, Optimized Messenger Bot Framework</b>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#installation">Installation</a> •
  <a href="#configuration">Configuration</a> •
  <a href="#usage">Usage</a> •
  <a href="#commands">Commands</a> •
</p>

## 📋 Overview

Nexus is a high-performance framework for building Facebook Messenger bots. It provides a robust infrastructure with automatic recovery, performance optimization, and easy-to-use command and event systems.

## 🆕 Recent Updates

### Nexus The Lab Update

- **New Laboratory Features**
  - Enhanced experimental command testing environment
  - Advanced debugging tools for developers
  - Real-time performance monitoring dashboard

- **System Improvements**
  - Improved thread management system
  - Enhanced security protocols

- **Developer Tools**
  - Added command creation wizard
  - Integrated testing framework
  - New development documentation

### Optimizations & Improvements

- **Memory Management**
  - Added advanced memory monitoring and auto-cleanup
  - Implemented garbage collection triggers for high memory usage
  - Reduced memory leaks with strategic cache clearing

- **Performance Enhancements**
  - Command queue system to prevent rate limiting
  - Optimized event handling with minimal overhead
  - Reduced redundant API calls (typing indicators, message delivery)

- **Error Handling**
  - Enhanced error tracking with automatic recovery
  - Added graceful fallbacks for critical functions
  - Centralized error logging and notification system

- **Configuration Management**
  - Centralized configuration with deep merging
  - Added default values for all settings
  - Improved access with path-based getter

- **Auto-Recovery System**
  - Implemented restart markers for smooth recovery
  - Added periodic restart options for long-term stability
  - Error threshold monitoring for automatic restarts

- **Code Structure**
  - Reduced redundancy across modules
  - Improved modularity with focused responsibilities
  - Better separation of concerns (API, Database, Events)

## ✨ Features

- **Command System**
  - Easy-to-create commands with role-based permissions
  - Hot-reloading for commands during development
  - Command cooldowns and rate limiting

- **Event System**
  - Modular event handling for different message types
  - Customizable event responses
  - Event filtering and prioritization

- **Permission System**
  - Multi-level role-based permissions (User, Admin, Owner)
  - Group-specific permissions
  - Thread administrator detection

- **Database Integration**
  - SQLite database with Prisma ORM
  - Automatic backups and recovery
  - Optional GitHub synchronization

- **API Management**
  - Safe wrapper functions for Facebook API
  - Rate limiting and throttling
  - Error resilience

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Nexus-016/Nexus-Bot.git
   cd nexus-bot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure the bot**
   - Copy `config.example.json` to `config.json`
   - Edit the configuration file with your settings
   - Add your Facebook credentials to `appstate.json`

4. **Start the bot**
   ```bash
   npm start
   ```

## ⚙️ Configuration

Nexus Bot uses a centralized configuration system. The main settings are:

```json
{
  "name": "NexusBot",
  "prefix": "!",
  "admins": ["YOUR_FACEBOOK_ID"],
  "permissions": {
    "owner": "YOUR_FACEBOOK_ID"
  },
  "system": {
    "autoRestart": {
      "enabled": true,
      "memoryThreshold": 500,
      "interval": 21600000
    }
  }
}
```

See the [Configuration Guide](docs/configuration.md) for all available options.

## 📝 Usage

### Creating Commands

1. Create a new file in the `commands` directory:

```javascript
// commands/hello.js
module.exports = {
  config: {
    name: "hello",
    aliases: ["hi", "hey"],
    version: "1.0.0",
    author: "YourName",
    countDown: 5,
    role: 0,
    shortDescription: "Say hello",
    longDescription: "A friendly greeting command",
    category: "general",
    guide: "{prefix}hello [name]"
  },
  execute: async function({ api, event, args }) {
    const name = args[0] || "friend";
    return api.sendMessage(`Hello, ${name}!`, event.threadID);
  }
};
```

### Adding Events

Create a new file in the `events` directory:

```javascript
// events/welcome.js
module.exports = {
  config: {
    name: "welcome",
    version: "1.0.0",
    description: "Welcome new members"
  },
  execute: async function({ api, event, config }) {
    if (event.type === "add_participants") {
      const msg = `Welcome to the group!`;
      return api.sendMessage(msg, event.threadID);
    }
  }
};
```

## 📂 Project Structure

```
nexus-bot/
├── commands/          # Bot commands
├── events/            # Event handlers
├── core/              # Core functionality
├── utils/             # Utility functions
├── database/          # Database files and backups
├── modules/           # Additional modules
├── logs/              # Log files
├── config.json        # Configuration file
├── appstate.json      # Facebook authentication
└── index.js           # Main entry point
```

## 📚 Commands

The bot comes with several built-in commands:

- `help` - Show available commands
- `admin` - Admin control panel
- `info` - Show bot information
- `restart` - Restart the bot
- `update` - Update the bot from GitHub

See the [Commands Guide](docs/commands.md) for more details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgements

- [ws3-fca](https://github.com/VangBanLaNhat/ws3-fca) for the Messenger API
- All the contributors and testers
