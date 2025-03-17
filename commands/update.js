const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const AdmZip = require('adm-zip');
const logger = require('../utils/logger');
const { notifyAdmin } = require('../core/commandHandler');

module.exports = {
  config: {
    name: "update",
    aliases: ["upgrade", "pull"],
    version: "1.0.0",
    author: "NexusTeam",
    countDown: 10,
    role: 2,
    shortDescription: "Update the bot from GitHub",
    longDescription: "Check for updates from GitHub repository and update the bot files",
    category: "admin",
    guide: "{prefix}update [check/install/force]"
  },

  async execute({ api, event, args }) {
    const { threadID, messageID } = event;
    const option = args[0]?.toLowerCase();
    
    try {
      // Create simple version check
      let currentVersion = "0.0.0";
      try {
        const packageJson = require('../package.json');
        currentVersion = packageJson.version;
      } catch (e) {
        logger.error("Could not read package.json:", e);
      }

      // Get latest version from GitHub
      api.sendMessage("🔍 Checking for updates...", threadID);
      
      const repoOwner = global.config?.github?.owner || 'Nexus-016';
      const repoName = global.config?.github?.repo || 'Nexus-Bot';

      const response = await axios.get(
        `https://raw.githubusercontent.com/${repoOwner}/${repoName}/main/package.json`,
        { headers: { 'User-Agent': 'NexusBot-Updater' } }
      );

      const latestVersion = response.data.version;
      
      // Compare versions properly
      const needsUpdate = isNewerVersion(latestVersion, currentVersion);

      if (!needsUpdate && option !== 'force') {
        return api.sendMessage(
          `✅ Bot is up to date!\nCurrent version: ${currentVersion}`, 
          threadID
        );
      }

      // Show update message
      const updateMsg = `📥 Update available!\n\n` +
        `Current version: ${currentVersion}\n` +
        `Latest version: ${latestVersion}\n\n` +
        `Do you want to update? Reply with "yes" to update.`;

      return api.sendMessage(updateMsg, threadID, (err, info) => {
        if (err) return logger.error("Error sending update message:", err);
        
        global.client.handleReply.push({
          name: this.config.name,
          messageID: info.messageID,
          author: event.senderID,
          type: "update_confirm",
          data: { repoOwner, repoName, currentVersion, latestVersion }
        });
      });

    } catch (error) {
      logger.error("Update check error:", error);
      return api.sendMessage(
        `❌ Error checking for updates: ${error.message}`, 
        threadID
      );
    }
  },

  handleReply: async function({ api, event, handleReply }) {
    const { threadID, messageID, senderID, body } = event;
    
    // Check if this is the original author
    if (senderID !== handleReply.author) return;
    
    // Process user's response
    const response = body.toLowerCase().trim();
    
    if (response === "yes") {
      const { repoOwner, repoName, currentVersion, latestVersion } = handleReply.data;
      return await performUpdate(api, threadID, repoOwner, repoName, currentVersion, latestVersion);
    } 
    else if (response === "no") {
      return api.sendMessage("✅ Update canceled. The bot will continue running on the current version.", threadID);
    } 
    else {
      return api.sendMessage("⚠️ Invalid response. Please reply with 'yes' or 'no'.", threadID);
    }
  }
};

// Add this new helper function for better version comparison
function isNewerVersion(latest, current) {
  const latest_parts = latest.split('.').map(Number);
  const current_parts = current.split('.').map(Number);
  
  for (let i = 0; i < 3; i++) {
    if (latest_parts[i] > current_parts[i]) return true;
    if (latest_parts[i] < current_parts[i]) return false;
  }
  
  return false;
}

/**
 * Gets the latest release from GitHub API
 */
async function getLatestRelease(owner, repo) {
  try {
    logger.info(`Checking for releases from ${owner}/${repo}`);
    const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/releases/latest`, {
      headers: { 'User-Agent': 'NexusBot-UpdateChecker' },
      validateStatus: status => status < 500 // Don't reject on 404
    });
    
    if (response.status === 200) {
      return response.data;
    } else if (response.status === 404) {
      // Repository or releases not found - this is expected for new repos
      logger.info(`No releases found for ${owner}/${repo}. Repository might be new or private.`);
      return null;
    } else {
      logger.warn(`Unexpected status code ${response.status} when checking releases`);
      return null;
    }
  } catch (error) {
    logger.error("Error fetching latest release:", error.message);
    return null;
  }
}

/**
 * Gets the latest commits if we can't get release information
 */
async function checkUpdatesWithCommits(api, event, owner, repo, packageJson, option) {
  const { threadID, senderID } = event;
  const currentVersion = packageJson.version;
  
  try {
    logger.info(`Falling back to commits API for ${owner}/${repo}`);
    // Notify user about releases not being found
    api.sendMessage(`ℹ️ No releases found for ${owner}/${repo}. Checking for updates using commits instead...`, threadID);
    
    // Get latest commit from the default branch
    const commitsResponse = await axios.get(`https://api.github.com/repos/${owner}/${repo}/commits`, {
      headers: { 'User-Agent': 'NexusBot-UpdateChecker' },
      validateStatus: status => status < 500 // Don't reject on 4xx
    });
    
    if (commitsResponse.status !== 200) {
      if (commitsResponse.status === 404) {
        return api.sendMessage(`❌ Repository ${owner}/${repo} not found. Please check your GitHub configuration.`, threadID);
      } else {
        return api.sendMessage(`❌ Unable to check repository: ${commitsResponse.status} ${commitsResponse.statusText}`, threadID);
      }
    }
    
    if (!commitsResponse.data.length) {
      return api.sendMessage("❌ No commits found in repository. Is this a new or empty repository?", threadID);
    }
    
    const latestCommit = commitsResponse.data[0];
    const commitDate = new Date(latestCommit.commit.author.date);
    const formattedDate = commitDate.toLocaleString();
    
    // Get local version timestamp
    const localDateTime = new Date(packageJson.lastUpdate || "1970-01-01");
    
    // If local is newer than remote, we're up to date (unless force update)
    if (localDateTime >= commitDate && option !== 'force') {
      return api.sendMessage(`✅ Your bot is already up-to-date!\n\nCurrent version: ${currentVersion}\nLatest update: ${localDateTime.toLocaleString()}`, threadID);
    }
    
    // New commits are available - show information
    const updateMsg = `📥 Updates available!\n\n` +
                  `Current version: ${currentVersion}\n` +
                  `Latest commit: ${latestCommit.sha.substring(0, 7)}\n` +
                  `Date: ${formattedDate}\n\n` +
                  `Commit message: ${latestCommit.commit.message}\n\n` + 
                  `Do you want to update now? Reply with "yes" or "no".`;
    
    // If option is 'install' or 'force', skip confirmation
    if (option === 'install' || 'force') {
      return await performUpdate(api, threadID, owner, repo, currentVersion, currentVersion);
    }
    
    return api.sendMessage(updateMsg, threadID, (err, info) => {
      if (err) return logger.error("Error sending update message:", err);
      
      // Store messageID for response
      global.client = global.client || {};
      global.client.handleReply = global.client.handleReply || [];
      global.client.handleReply.push({
        name: "update",
        messageID: info.messageID,
        author: senderID,
        type: "update_confirm",
        data: { repoOwner: owner, repoName: repo, currentVersion, latestVersion: currentVersion }
      });
    });
  } catch (error) {
    logger.error("Error checking commits:", error);
    return api.sendMessage(`❌ Error checking for updates: ${error.message}`, threadID);
  }
}

/**
 * Download repository as zip and update files
 */
async function performUpdate(api, threadID, owner, repo, currentVersion, newVersion) {
  try {
    api.sendMessage("🔄 Starting update process...", threadID);
    
    // Create backup dir
    const backupDir = path.join(process.cwd(), 'backups', `backup-${Date.now()}`);
    if (!fs.existsSync(path.join(process.cwd(), 'backups'))) {
      fs.mkdirSync(path.join(process.cwd(), 'backups'), { recursive: true });
    }
    fs.mkdirSync(backupDir, { recursive: true });
    
    // Backup important files
    api.sendMessage("📦 Creating backup of current files...", threadID);
    const filesToBackup = [
      'package.json',
      'config.json',
      path.join('database', 'data.db')
    ];
    
    for (const file of filesToBackup) {
      const sourcePath = path.join(process.cwd(), file);
      if (fs.existsSync(sourcePath)) {
        const targetDir = path.join(backupDir, path.dirname(file));
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
        fs.copyFileSync(sourcePath, path.join(backupDir, file));
      }
    }
    
    // Download the repository as a zip file
    api.sendMessage("📥 Downloading latest code from GitHub...", threadID);
    const zipUrl = `https://github.com/${owner}/${repo}/archive/refs/heads/main.zip`;
    const zipPath = path.join(process.cwd(), 'update.zip');
    
    const writer = fs.createWriteStream(zipPath);
    
    const response = await axios({
      method: 'get',
      url: zipUrl,
      responseType: 'stream',
      headers: { 'User-Agent': 'NexusBot-Updater' }
    });
    
    response.data.pipe(writer);
    
    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
    
    api.sendMessage("📂 Extracting files...", threadID);
    const zip = new AdmZip(zipPath);
    const tempDir = path.join(process.cwd(), 'temp_update');
    
    // Clear temp dir if it exists
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    
    // Extract zip
    zip.extractAllTo(tempDir, true);
    
    // Get the extracted folder name (it's usually repoName-branchName)
    const extractedDirs = fs.readdirSync(tempDir);
    if (extractedDirs.length === 0) {
      throw new Error("No files extracted from zip");
    }
    
    const extractedDir = path.join(tempDir, extractedDirs[0]);
    
    // Copy files while preserving config and database
    api.sendMessage("📄 Updating bot files...", threadID);
    await copyFiles(extractedDir, process.cwd(), [
      'config.json',
      'appstate.json',
      'database/data.db',
      'node_modules',
      '.git',
      'backups',
      'temp_update',
      'update.zip'
    ]);
    
    // Update package.json version while keeping other custom fields
    const extractedPackageJson = JSON.parse(fs.readFileSync(path.join(extractedDir, 'package.json'), 'utf8'));
    const currentPackageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
    
    // Merge package.json, keeping the new version but preserving custom fields
    const mergedPackageJson = {
      ...currentPackageJson,
      version: newVersion,
      lastUpdate: new Date().toISOString(),
      dependencies: {
        ...currentPackageJson.dependencies,
        ...extractedPackageJson.dependencies
      }
    };
    
    fs.writeFileSync(
      path.join(process.cwd(), 'package.json'),
      JSON.stringify(mergedPackageJson, null, 2)
    );
    
    // Install any new dependencies
    api.sendMessage("📦 Installing dependencies...", threadID);
    try {
      await execAsync('npm install --no-audit --no-fund');
    } catch (depsError) {
      api.sendMessage(`⚠️ Warning: Some dependencies failed to install: ${depsError.message}`, threadID);
    }
    
    // Clean up
    fs.rmSync(tempDir, { recursive: true, force: true });
    fs.unlinkSync(zipPath);
    
    // Send success message
    api.sendMessage("✅ Update completed successfully! Restarting bot in 3 seconds...", threadID);
    
    // Notify admin of the update
    notifyAdmin(`🔄 Bot updated from ${currentVersion} to ${newVersion}`);
    
    // Wait 3 seconds then restart
    setTimeout(() => {
      logger.info("Restarting after update...");
      process.exit(2); // Exit with code 2 to signal update restart
    }, 3000);
    
  } catch (error) {
    logger.error("Error during update:", error);
    return api.sendMessage(`❌ Update failed: ${error.message}\n\nThe bot will continue running on the current version.`, threadID);
  }
}

/**
 * Helper function to execute shell commands
 */
function execAsync(command) {
  return new Promise((resolve, reject) => {
    exec(command, { cwd: process.cwd() }, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}

/**
 * Helper function to recursively copy files
 */
async function copyFiles(source, dest, excludes = []) {
  const files = fs.readdirSync(source);
  
  for (const file of files) {
    // Skip excluded files/folders
    if (excludes.some(exclude => {
      // Handle both exact matches and directory paths
      if (exclude.includes('/') || exclude.includes('\\')) {
        return file === path.dirname(exclude) || file === exclude;
      }
      return file === exclude;
    })) {
      continue;
    }
    
    const sourcePath = path.join(source, file);
    const destPath = path.join(dest, file);
    
    const stats = fs.statSync(sourcePath);
    
    if (stats.isDirectory()) {
      // Create directory if it doesn't exist
      if (!fs.existsSync(destPath)) {
        fs.mkdirSync(destPath, { recursive: true });
      }
      
      // Recursive copy
      await copyFiles(sourcePath, destPath, excludes);
    } else {
      // Copy file
      fs.copyFileSync(sourcePath, destPath);
    }
  }
}

/**
 * Compare semver versions
 * Returns: 1 if v1 > v2, -1 if v1 < v2, 0 if equal
 */
function versionCompare(v1, v2) {
  const v1parts = v1.split('.').map(Number);
  const v2parts = v2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(v1parts.length, v2parts.length); i++) {
    const v1part = v1parts[i] || 0;
    const v2part = v2parts[i] || 0;
    
    if (v1part > v2part) return 1;
    if (v1part < v2part) return -1;
  }
  
  return 0;
}

/**
 * Helper function to check if user is admin
 */
async function isAdminUser(api, userID) {
  // Check global permission manager first
  if (global.permissionManager) {
    try {
      const permissionLevel = await global.permissionManager.getUserRole(userID);
      return permissionLevel >= 2; // Admin role or higher
    } catch (error) {
      logger.error("Error checking permissions:", error);
    }
  }
  
  // Fallback to config.json
  try {
    const config = global.config || require('../config.json');
    return Array.isArray(config.admins) && config.admins.includes(userID);
  } catch (error) {
    logger.error("Error loading config:", error);
    return false;
  }
}
