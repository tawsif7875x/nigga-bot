module.exports = {
  config: {
    name: "example",
    version: "1.0",
    author: "YourName",
    description: "Example event handler",
    envConfig: {
      // Environment variables for this event
      delayBetweenMessages: 1000
    }
  },

  languages: {
    "en": {
      "welcomeMessage": "Welcome to the group!",
      "leaveMessage": "Goodbye!"
    },
    "bn": {
      "welcomeMessage": "গ্রুপে স্বাগতম!",
      "leaveMessage": "বিদায়!"
    }
  },

  onLoad: async function({ api, Threads, Users }) {
    // Optional: Run when event is loaded
    // Example: Set up event listeners, initialize data
  },

  execute: async function({ api, event, Threads, Users, getLang }) {
    const { threadID, author, logMessageData } = event;
    try {
      // Your event handling code here
      
    } catch (error) {
      console.error(`Error in ${this.config.name} event:`, error);
    }
  }
};
