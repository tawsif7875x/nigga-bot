/**
 * Nexus Debug Tool
 * 
 * This script helps diagnose issues with the Nexus bot
 */
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Setup readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Import required modules
const ws3fca = require('ws3-fca');
const logger = require('./utils/logger');

console.log(`
███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗
████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝
██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗
██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║
██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║
╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝

NEXUS DEBUG TOOL
`);

// Main debug function
async function debugBot() {
  try {
    console.log('🔍 Running diagnostics...');
    
    // Check appstate
    console.log('\nChecking appstate.json...');
    const appstatePath = path.join(__dirname, 'appstate.json');
    
    if (!fs.existsSync(appstatePath)) {
      console.log('❌ appstate.json not found. Please create this file first.');
      return;
    }
    
    console.log('✅ appstate.json exists');
    
    // Test parsing the appstate
    try {
      const appstate = JSON.parse(fs.readFileSync(appstatePath, 'utf8'));
      console.log('✅ appstate.json is valid JSON');
      console.log(`ℹ️ Found ${appstate.length} cookies in appstate`);
    } catch (error) {
      console.log(`❌ Failed to parse appstate.json: ${error.message}`);
      return;
    }
    
    // Test login
    console.log('\nTesting login to Facebook...');
    
    let api;
    try {
      const appstate = JSON.parse(fs.readFileSync(appstatePath, 'utf8'));
      
      // Login with ws3-fca
      api = await new Promise((resolve, reject) => {
        ws3fca({
          appState: appstate,
          logLevel: "verbose",
          selfListen: true
        }, (err, api) => {
          if (err) reject(err);
          else resolve(api);
        });
      });
      
      console.log('✅ Successfully logged in to Facebook');
      console.log(`ℹ️ Account ID: ${api.getCurrentUserID()}`);
      
      const userInfo = await new Promise((resolve, reject) => {
        api.getUserInfo(api.getCurrentUserID(), (err, info) => {
          if (err) reject(err);
          else resolve(info);
        });
      });
      
      const name = userInfo[api.getCurrentUserID()].name;
      console.log(`ℹ️ Account Name: ${name}`);
      
    } catch (error) {
      console.log(`❌ Facebook login failed: ${error.message}`);
      return;
    }
    
    // Interactive testing
    console.log('\n📱 Interactive Messaging Test');
    console.log('You can now test sending messages to verify functionality');
    
    // Ask for thread ID
    rl.question('\nEnter a threadID to send test message (or press Enter for your own ID): ', async (threadID) => {
      let targetThread = threadID.trim();
      
      // Use own ID if none provided
      if (!targetThread) {
        targetThread = api.getCurrentUserID();
        console.log(`Using your own ID: ${targetThread}`);
      }
      
      // Test sending a message
      console.log(`\nSending test message to ${targetThread}...`);
      
      try {
        // First try with a simple message
        await new Promise((resolve, reject) => {
          api.sendMessage("🧪 This is a test message from Nexus Debug Tool", targetThread, (err, info) => {
            if (err) reject(err);
            else resolve(info);
          });
        });
        
        console.log('✅ Test message sent successfully!');
        
        // Check if we can test typing indicator
        console.log('\nTesting typing indicator...');
        
        try {
          await new Promise((resolve, reject) => {
            api.sendTypingIndicator(targetThread, (err) => {
              if (err) reject(err);
              else resolve();
            });
          });
          
          console.log('✅ Typing indicator works');
        } catch (typingError) {
          console.log(`❌ Typing indicator failed: ${typingError.message}`);
        }
        
        console.log('\n✅ All tests completed. Your bot should be working properly.');
        console.log('If you are still having issues, check these things:');
        console.log('1. Make sure event handlers are properly implemented');
        console.log('2. Check if commands are properly formatted');
        console.log('3. Verify the Facebook account has no restrictions');
        console.log('4. Try restart.js to restart the bot');
        
      } catch (messageError) {
        console.log(`❌ Failed to send message: ${messageError.message}`);
        console.log('The bot may be having permission issues or the thread might be restricted');
      } finally {
        rl.close();
      }
    });
  } catch (error) {
    console.log(`❌ Debug process failed: ${error.message}`);
    rl.close();
  }
}

debugBot();
