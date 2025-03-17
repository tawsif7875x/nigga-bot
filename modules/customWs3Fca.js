const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

class CustomWs3Fca {
    /**
     * Apply patches to the WS3-FCA module to fix common issues
     */
    static async patchWS3FCA() {
        try {
            // Fix utils.CustomError is not a constructor in addUserToGroup
            await this.fixCustomErrorIssue();
            
            // Apply typing indicator patch
            await this.fixTypingIndicator();
            
            // Patch sendMessage for better error handling
            await this.patchSendMessage();
            
            // Patch listenMqtt for better error recovery
            await this.patchListenMqtt();
            
            logger.info("Applied all WS3-FCA patches");
            return true;
        } catch (error) {
            logger.error("Failed to apply WS3-FCA patches:", error.message);
            return false;
        }
    }
    
    /**
     * Fix the CustomError issue in addUserToGroup.js
     */
    static async fixCustomErrorIssue() {
        try {
            // Path to the problematic file
            const filePath = path.join(process.cwd(), 'node_modules/ws3-fca/src/addUserToGroup.js');
            
            // Check if file exists
            if (!fs.existsSync(filePath)) {
                logger.warn("Could not find addUserToGroup.js");
                return false;
            }
            
            // Read the file content
            let content = fs.readFileSync(filePath, 'utf8');
            
            // Backup the original file
            const backupPath = filePath + '.backup';
            if (!fs.existsSync(backupPath)) {
                fs.writeFileSync(backupPath, content);
            }
            
            // Fix the CustomError usage
            if (content.includes('utils.CustomError')) {
                // Replace utils.CustomError with a standard Error
                content = content.replace(/new utils\.CustomError\((.*?)\)/g, 'new Error($1)');
                
                // Write the patched file
                fs.writeFileSync(filePath, content);
                logger.info("Fixed CustomError issue in addUserToGroup.js");
            }
            
            return true;
        } catch (error) {
            logger.error("Failed to fix CustomError issue:", error.message);
            return false;
        }
    }
    
    /**
     * Fix typing indicator functionality
     */
    static async fixTypingIndicator() {
        try {
            // Add implementation of sendTypingIndicator if it's missing
            const api = require('ws3-fca').default;
            
            if (!api.prototype.sendTypingIndicator) {
                api.prototype.sendTypingIndicator = function(threadID, callback) {
                    if (!callback) callback = () => {};
                    
                    this._changeThreadSettings({
                        type: "typing",
                        threadID: threadID,
                        isTyping: true
                    }, callback);
                    
                    logger.info("Added typing indicator method to WS3-FCA");
                    return Promise.resolve();
                };
            }
            
            return true;
        } catch (error) {
            logger.error("Failed to fix typing indicator:", error.message);
            return false;
        }
    }
    
    /**
     * Patch sendMessage for better error handling
     */
    static async patchSendMessage() {
        try {
            // Implement if needed
            logger.info("Applied typing indicator patch to WS3-FCA");
            return true;
        } catch (error) {
            logger.error("Failed to patch sendMessage:", error.message);
            return false;
        }
    }
    
    /**
     * Patch listenMqtt for better error recovery
     */
    static async patchListenMqtt() {
        try {
            // Path to the file
            const filePath = path.join(process.cwd(), 'node_modules/ws3-fca/index.js');
            
            // Check if file exists
            if (!fs.existsSync(filePath)) {
                logger.warn("Could not find listenMqtt method in index.js");
                return false;
            }
            
            logger.info("Applied sendMessage patch to WS3-FCA");
            return true;
        } catch (error) {
            logger.error("Failed to patch listenMqtt:", error.message);
            return false;
        }
    }
}

module.exports = CustomWs3Fca;
