const ws3fca = require('ws3-fca');
const auth = require('./modules/auth');
const config = require('./config.json');
const logger = require('./utils/logger');
const gradient = require('gradient-string');
const { loadCommands, commands, handleCommand } = require('./core/commandHandler');
const { loadEvents, handleEvent } = require('./core/eventHandler');
const fs = require('fs');
const path = require('path');
const { initGithub } = require('./utils/githubSync');

// Custom gradients with refined colors
const titleGradient = gradient([
  '#4F46E5', // indigo
  '#3B82F6', // blue
  '#0EA5E9'  // sky blue
]);

const infoGradient = gradient([
  '#0D9488', // teal
  '#059669'  // emerald
]);

const successGradient = gradient([
  '#059669', // emerald
  '#10B981'  // green
]);

const highlightGradient = gradient([
  '#2563EB', // blue
  '#3B82F6'  // lighter blue
]);

const separatorGradient = gradient([
  '#3B82F6', // blue
  '#60A5FA'  // lighter blue
]);

// ASCII Art Banner
const banner = `
███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗
████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝
██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗
██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║
██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║
╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝
`;

// Loading animation frames with cyan color
const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
let frameIndex = 0;

function displayLoadingAnimation(message) {
  process.stdout.write('\r' + infoGradient(frames[frameIndex]) + ' ' + message);
  frameIndex = (frameIndex + 1) % frames.length;
}

// Clear console and show banner
console.clear();
console.log(titleGradient(banner));
console.log(separatorGradient('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
console.log(highlightGradient(' Author: ') + 'NexusTeam');
console.log(highlightGradient(' Version: ') + require('./package.json').version);
console.log(separatorGradient('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

// Initialize and run the bot
async function initBot() {
  const loadingInterval = setInterval(() => {
    displayLoadingAnimation('Initializing Nexus Bot...');
  }, 100);

  try {
    // Create required directories
    ['logs', 'database', 'commands', 'events'].forEach(dir => {
      const dirPath = path.join(__dirname, dir);
      !fs.existsSync(dirPath) && fs.mkdirSync(dirPath);
    });

    // Initialize components with loading animation
    clearInterval(loadingInterval);
    
    process.stdout.write('\n');
    
    // Load commands and events before login
    console.log(infoGradient('➜ ') + 'Loading commands...');
    loadCommands();
    
    console.log(infoGradient('➜ ') + 'Loading events...');
    loadEvents();

    if (config.github.enabled) {
      console.log(infoGradient('➜ ') + 'Initializing GitHub sync...');
      initGithub();
    }

    // Login to Facebook
    console.log(infoGradient('➜ ') + 'Logging in to Facebook...');
    const api = await auth.loginWithRetry();
    const userInfo = await api.getCurrentUserID();
    const userName = (await api.getUserInfo(userInfo))[userInfo].name;

    // Add commands to api object
    api.commands = commands;

    // Success message
    console.clear();
    console.log(titleGradient(banner));
    console.log(separatorGradient('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(successGradient(' Status: ') + 'Online ✓');
    console.log(highlightGradient(' Account: ') + userName);
    console.log(highlightGradient(' UID: ') + userInfo);
    console.log(highlightGradient(' Prefix: ') + config.prefix);
    console.log(highlightGradient(' Commands: ') + commands.size);
    console.log(separatorGradient('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

    // Start listening
    api.listenMqtt(async (err, message) => {
      if (err) return logger.error(err);
    });
    
  } catch (error) {
    clearInterval(loadingInterval);
    console.log(gradient(['#DC2626', '#EF4444'])('\n❌ Error: ') + error.message);
    process.exit(1);
  }
}

initBot();

// Handle exit
process.on('unhandledRejection', error => console.log(error));
process.on('uncaughtException', error => console.log(error));
