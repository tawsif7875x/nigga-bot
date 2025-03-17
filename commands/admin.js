module.exports = {
  config: {
    name: "admin",
    aliases: ["admincp", "panel"],
    version: "1.0.0",
    author: "NexusTeam",
    countDown: 5,
    role: 3,
    shortDescription: "Admin control panel",
    longDescription: "Access the bot admin control panel with various administrative functions",
    category: "admin",
    guide: "{prefix}admin [option]\n\nOptions:\n- list: Show list of admins\n- add [uid]: Add an admin\n- remove [uid]: Remove an admin\n- status: Show system status"
  },

  execute: async function({ api, event, args }) {
    const { threadID, senderID } = event;
    
    if (!global.permissionManager) {
      return api.sendMessage("❌ Permission system not initialized.", threadID);
    }
    
    const option = args[0]?.toLowerCase();
    const targetID = args[1];
    
    switch (option) {
      case "list":
        await handleListAdmins(api, event);
        break;
        
      case "add":
        if (!targetID) {
          return api.sendMessage("❌ Please specify a user ID to add as admin.", threadID);
        }
        await handleAddAdmin(api, event, targetID);
        break;
        
      case "remove":
        if (!targetID) {
          return api.sendMessage("❌ Please specify a user ID to remove from admin.", threadID);
        }
        await handleRemoveAdmin(api, event, targetID);
        break;
        
      case "status":
        await handleStatus(api, event);
        break;
        
      default:
        return api.sendMessage("⚙️ Admin Control Panel\n\nUsage:\n- admin list: Show admins\n- admin add [uid]: Add admin\n- admin remove [uid]: Remove admin\n- admin status: System status", threadID);
    }
  }
};

async function handleListAdmins(api, event) {
  try {
    const { threadID } = event;
    const config = global.config || {};
    const admins = Array.isArray(config.admins) ? config.admins : [];
    
    if (admins.length === 0) {
      return api.sendMessage("❌ No admins configured.", threadID);
    }
    
    let adminInfo = "👑 Bot Admins:\n\n";
    
    for (const adminID of admins) {
      try {
        const userInfo = await api.getUserInfo(adminID);
        const name = userInfo[adminID]?.name || "Unknown";
        adminInfo += `➜ ${name} (${adminID})\n`;
      } catch (e) {
        adminInfo += `➜ Unknown (${adminID})\n`;
      }
    }
    
    return api.sendMessage(adminInfo, threadID);
  } catch (error) {
    console.error("Error listing admins:", error);
    return api.sendMessage("❌ An error occurred while listing admins.", event.threadID);
  }
}

async function handleAddAdmin(api, event, targetID) {
  try {
    const { threadID } = event;
    
    // Check user exists
    try {
      const userInfo = await api.getUserInfo(targetID);
      if (!userInfo[targetID]) {
        return api.sendMessage(`❌ User with ID ${targetID} not found.`, threadID);
      }
      
      const userName = userInfo[targetID].name;
      
      // Set role to admin (2)
      await global.permissionManager.setUserRole(targetID, 2);
      
      // Update config
      if (!global.config.admins) global.config.admins = [];
      if (!global.config.admins.includes(targetID)) {
        global.config.admins.push(targetID);
      }
      
      return api.sendMessage(`✅ Added ${userName} (${targetID}) as a bot admin.`, threadID);
    } catch (error) {
      return api.sendMessage(`❌ Error adding admin: ${error.message}`, threadID);
    }
  } catch (error) {
    console.error("Error adding admin:", error);
    return api.sendMessage("❌ An error occurred while adding admin.", event.threadID);
  }
}

async function handleRemoveAdmin(api, event, targetID) {
  try {
    const { threadID } = event;
    
    // Check if user is an admin
    const userRole = await global.permissionManager.getUserRole(targetID);
    if (userRole < 2) {
      return api.sendMessage(`❌ User with ID ${targetID} is not an admin.`, threadID);
    }
    
    // Remove admin role
    await global.permissionManager.setUserRole(targetID, 0);
    
    // Update config
    if (global.config.admins && global.config.admins.includes(targetID)) {
      global.config.admins = global.config.admins.filter(id => id !== targetID);
    }
    
    return api.sendMessage(`✅ Removed admin status from user with ID ${targetID}.`, threadID);
  } catch (error) {
    console.error("Error removing admin:", error);
    return api.sendMessage("❌ An error occurred while removing admin.", event.threadID);
  }
}

async function handleStatus(api, event) {
  try {
    const { threadID } = event;
    const config = global.config || {};
    
    const adminCount = Array.isArray(config.admins) ? config.admins.length : 0;
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();
    
    const days = Math.floor(uptime / (24 * 60 * 60));
    const hours = Math.floor((uptime % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((uptime % (60 * 60)) / 60);
    
    const statusMessage = `⚙️ Admin System Status\n\n` +
                          `👥 Admins: ${adminCount}\n` +
                          `🔄 Uptime: ${days}d ${hours}h ${minutes}m\n` +
                          `💾 Memory: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB / ${Math.round(memoryUsage.rss / 1024 / 1024)}MB\n` +
                          `🔐 Permission System: ${global.permissionManager ? '✅ Active' : '❌ Inactive'}`;
    
    return api.sendMessage(statusMessage, threadID);
  } catch (error) {
    console.error("Error showing status:", error);
    return api.sendMessage("❌ An error occurred while showing status.", event.threadID);
  }
}
