const ws3fca = require('ws3-fca');
const auth = require('./modules/auth');
const logger = require('./utils/logger');
const gradient = require('gradient-string');
const { loadCommands, commands, handleCommand, initializeCommandWatcher } = require('./core/commandHandler');
const { loadEvents, handleEvent } = require('./core/eventHandler');
const fs = require('fs');
const path = require('path');
const { initGithub } = require('./utils/githubSync');
const AutoRecovery = require('./utils/autoRecovery');

// Import centralized configuration
const configLoader = require('./utils/configLoader');
// Load configuration early to ensure it's available
const config = configLoader.load();

// Custom gradient colors 
const mainGradient = gradient(['#FF6B6B', '#4ECDC4']);
const titleGradient = gradient(['#A8E6CF', '#DCEDC1']);
const infoGradient = gradient(['#FFD93D', '#FF6B6B']);

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

const logo = `
╔═════════════════════════════════════════╗
║                                         ║
║   ███╗   ██╗███████╗██╗  ██╗██╗   ██╗  ║
║   ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║  ║
║   ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║  ║
║   ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║  ║
║   ██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝  ║
║   ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝   ║
║                                         ║
╚═════════════════════════════════════════╝`;

// Define a set of professional boot phases for organized startup
const BOOT_PHASES = {
  INIT: '📋 INITIALIZATION',
  DATABASE: '🗄️ DATABASE',
  SYSTEM: '⚙️ SYSTEM',
  MODULES: '🧩 MODULES',
  COMMANDS: '🔧 COMMANDS',
  NETWORK: '🌐 NETWORK',
  READY: '✅ READY'
};

// Custom log format for startup phases
function logPhase(phase, message) {
  console.log(`\n${highlightGradient(phase)}`);
  console.log(`${infoGradient('┃')} ${message}`);
}

function logStep(icon, message, status = null) {
  const statusIcons = {
    success: successGradient(' ✓ '),
    warning: gradient(['#FCD34D', '#F59E0B'])(' ⚠ '),
    error: gradient(['#DC2626', '#EF4444'])(' ✗ '),
    info: infoGradient(' ℹ')
  };
  console.log(`${icon} ${message}${status ? statusIcons[status] : ''}`);
}

// Loading animation frames with cyan color
const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
let frameIndex = 0;

function displayLoadingAnimation(message) {
  process.stdout.write('\r' + infoGradient(frames[frameIndex]) + ' ' + message);
  frameIndex = (frameIndex + 1) % frames.length;
}

// Clear console and show banner
async function displayStartup() {
  console.clear();
  console.log(mainGradient(logo));
  console.log(titleGradient('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log(highlightGradient(' Author: ') + 'NexusTeam');
  console.log(highlightGradient(' Version: ') + require('./package.json').version);
  console.log(titleGradient('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
}

// Initialize and run the bot
async function initBot() {
  try {
    // 1. First initialize logger and error tracking
    logger.info('Starting Nexus Bot initialization...');
    
    // 2. Load critical configuration first
    logPhase(BOOT_PHASES.INIT, 'Loading critical configuration...');
    if (!configLoader.load()) {
      throw new Error('Failed to load critical configuration');
    }

    // 3. Initialize optimization and monitoring early
    logPhase(BOOT_PHASES.SYSTEM, 'Initializing safety systems...');
    const Optimization = require('./utils/optimization');
    global.Optimization = Optimization;
    await Optimization.initErrorTracking();
    await Optimization.startMemoryMonitor();

    // 4. Initialize database connection and safety checks
    logPhase(BOOT_PHASES.DATABASE, 'Initializing database...');
    const dbInitializer = require('./utils/dbInitializer');
    const dbSuccess = await dbInitializer.initialize();
    if (!dbSuccess) {
      logger.warn('Database initialization failed, running in fallback mode');
    }

    // 5. Initialize permission system (critical for security)
    logPhase(BOOT_PHASES.SYSTEM, 'Initializing permission system...');
    const permissionManager = require('./utils/permissionManager')(config);
    global.permissionManager = permissionManager;
    const permSuccess = await permissionManager.initialize();
    if (!permSuccess) {
      throw new Error('Failed to initialize permission system');
    }

    // 6. Initialize safety limiters and rate limits
    logPhase(BOOT_PHASES.SYSTEM, 'Setting up safety limits...');
    global.messageRateLimit = new Map();
    global.commandCooldowns = new Map();

    // Only after safety systems are ready, load remaining components
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
      
      // First initialize the database before anything else
      logPhase(BOOT_PHASES.DATABASE, 'Initializing database...');
      let dbInitialized = false;
      try {
        const dbInitializer = require('./utils/dbInitializer');
        await dbInitializer.initialize();
        dbInitialized = true;
        
        // Attempt to migrate data from JSON files if needed
        await dbInitializer.migrateDataFromFiles();
      } catch (dbError) {
        logger.warn('Database initialization issue:', dbError.message);
        logger.info('Continuing with limited database functionality');
      }
      
      // Now initialize global system components AFTER database is ready
      logPhase(BOOT_PHASES.INIT, 'Initializing system...');
      const InitSystem = require('./core/initSystem');
      if (dbInitialized) {
        // Load from database if it was initialized successfully
        await InitSystem.initialize();
      } else {
        // Fall back to loading from JSON files
        await InitSystem.initializeFromFiles();
      }
      
      // Apply WS3-FCA patches to fix issues
      logPhase(BOOT_PHASES.SYSTEM, 'Applying WS3-FCA patches...');
      try {
        const customWs3Fca = require('./modules/customWs3Fca');
        await customWs3Fca.patchWS3FCA();
      } catch (patchError) {
        logger.warn('WS3-FCA patch warning:', patchError.message);
        logger.info('Continuing with unpatched WS3-FCA');
      }
      
      // Load commands and events before login
      logPhase(BOOT_PHASES.COMMANDS, 'Loading commands...');
      loadCommands();
      
      logPhase(BOOT_PHASES.COMMANDS, 'Initializing command watcher...');
      initializeCommandWatcher();
      
      logPhase(BOOT_PHASES.COMMANDS, 'Loading events...');
      loadEvents();
      
      // Set up global notification state tracking
      global.notificationDisabled = false;
      global.notificationFailCount = 0;
      
      // Initialize permission manager
      logPhase(BOOT_PHASES.SYSTEM, 'Initializing permission system...');
      const permissionManager = require('./utils/permissionManager')(config);
      global.permissionManager = permissionManager;
      await permissionManager.initialize();

      // Use optional chaining for all config accesses to prevent 'undefined' errors
      if (config?.github?.enabled) {
        logPhase(BOOT_PHASES.MODULES, 'Initializing GitHub integration...');
        initGithub(config.github);
      }

      // Make optimizations available globally
      const Optimization = require('./utils/optimization');
      global.Optimization = Optimization;
      
      // Create a global cache that can be cleared during optimization
      const cache = require('./utils/cache');
      global.messageCache = cache;
      
      // Initialize error tracking and memory monitoring
      Optimization.initErrorTracking();
      
      // Start memory monitoring
      Optimization.startMemoryMonitor();
      
      // Make config available globally using the configLoader instance
      global.configLoader = configLoader;
      global.config = config;
      
      // Initialize global message counter
      global.messageCount = 0;
      
      // Initialize thread prefixes map if not exists
      if (!global.threadPrefixes) {
        global.threadPrefixes = new Map();
        
        // Load saved prefixes
        try {
          const prefixPath = path.join(__dirname, 'database/prefixes.json');
          if (fs.existsSync(prefixPath)) {
            const prefixes = JSON.parse(fs.readFileSync(prefixPath, 'utf8'));
            Object.entries(prefixes).forEach(([threadID, prefix]) => {
              global.threadPrefixes.set(threadID, prefix);
            });
            logger.info(`Loaded ${global.threadPrefixes.size} custom thread prefixes`);
          }
        } catch (error) {
          logger.error("Error loading thread prefixes:", error);
        }
      }
      
      // Login to Facebook with more robust error handling
      logPhase(BOOT_PHASES.NETWORK, 'Logging in to Facebook...');
      let api;
      try {
        api = await auth.loginWithRetry();
        global.api = api; // Make API globally available
      } catch (loginError) {
        logger.error('Fatal login error:', loginError.message);
        throw new Error(`Failed to login: ${loginError.message}`);
      }
      
      // Check for restart markers and handle recovery
      await AutoRecovery.checkRestartMarker(api);
      
      const userInfo = await api.getCurrentUserID();
      const userName = (await api.getUserInfo(userInfo))[userInfo].name;

      // Add commands to api object
      api.commands = commands;

      // Success message
      await displayStartup();
      console.log(successGradient(' Status: ') + 'Online ✓');
      console.log(highlightGradient(' Account: ') + userName);
      console.log(highlightGradient(' UID: ') + userInfo);
      console.log(highlightGradient(' Prefix: ') + config.prefix);
      console.log(highlightGradient(' Commands: ') + commands.size);
      if (global.threadPrefixes && global.threadPrefixes.size > 0) {
        console.log(highlightGradient(' Custom Thread Prefixes: ') + global.threadPrefixes.size);
      }
      console.log(separatorGradient('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

      // Start listening with improved error handling
      api.listenMqtt((err, message) => {
        if (err) {
          logger.error("MQTT Error:", err);
          Optimization.trackError(err);
          return;
        }
        
        // Log incoming messages for debugging
        if (message && message.type === "message" && message.body) {
          logger.debug(`Received message: "${message.body}" from ${message.senderID} in ${message.threadID}`);
        }
        
        // Process commands with robust error handling
        try {
          if (message && message.body && message.body.startsWith(config.prefix || '!')) {
            // Get delay configuration with fallbacks
            const min = config?.system?.performance?.commandDelay?.min || 500;
            const max = config?.system?.performance?.commandDelay?.max || 2000;
            const delay = Math.floor(Math.random() * (max - min + 1)) + min;
            
            logger.debug(`Processing command: ${message.body}`);
            
            setTimeout(() => {
              try {
                handleCommand(api, message);
              } catch (cmdError) {
                logger.error("Command processing error:", cmdError);
              }
            }, delay);
          }
          
          // Process events with separate error handling
          try {
            handleEvent(api, message);
          } catch (eventError) {
            logger.error("Event processing error:", eventError);
          }
        } catch (error) {
          logger.error("Message handling error:", error);
          Optimization.trackError(error);
        }
      });

    } catch (error) {
      // Track error for potential auto-restart using the Optimization module
      if (global.Optimization) {
        global.Optimization.trackError(error);
      }
      
      clearInterval(loadingInterval);
      console.log(gradient(['#DC2626', '#EF4444'])('\n❌ Error: ') + error.message);
      
    }
  } catch (error) {
    logger.error('Critical initialization error:', error);
    
  }
}

// Add safety checks for process termination
process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM signal');
  await cleanup();
  
});

// Add cleanup function
async function cleanup() {
  try {
    // Clean up database connections
    if (global.db) await global.db.close();
    
    // Save any pending data
    if (global.threadPrefixes) {
      // Save thread prefixes
      await saveThreadPrefixes();
    }
    
    logger.info('Cleanup completed successfully');
  } catch (error) {
    logger.error('Error during cleanup:', error);
  }
}

initBot();

// Handle exit
process.on('SIGINT', () => {
  console.log(successGradient('\n\nShutting down Nexus Bot...\n'));
  
});

// Handle different exit codes
process.on('exit', (code) => {
  if (code === 1) {
    logger.info('Exiting for restart...');
  } else if (code === 2) {
    logger.info('Exiting after update...');
  }
});

// Handle uncaught exceptions for auto-restart
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  if (global.AutoRecovery) {
    AutoRecovery.trackError(error);
  }
});

// Handle unhandled promise rejections for auto-restart
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection:', reason);
  if (global.AutoRecovery) {
    AutoRecovery.trackError(new Error(String(reason)));
  }
});
