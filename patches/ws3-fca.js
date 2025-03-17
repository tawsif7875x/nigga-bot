/**
 * This file patches the ws3-fca library to fix the typing indicator issue
 */
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

function patchWs3Fca() {
    try {
        // Find the main module location
        const ws3fcaPath = require.resolve('ws3-fca');
        const modulePath = path.dirname(ws3fcaPath);
        logger.info(`Found ws3-fca at: ${modulePath}`);
        
        // Try to locate the typing indicator file in different possible locations
        const possiblePaths = [
            path.join(modulePath, 'src', 'sendTypingIndicator.js'),
            path.join(modulePath, 'sendTypingIndicator.js'),
            path.join(path.dirname(modulePath), 'src', 'sendTypingIndicator.js')
        ];
        
        let typingFilePath = null;
        for (const p of possiblePaths) {
            if (fs.existsSync(p)) {
                typingFilePath = p;
                break;
            }
        }
        
        if (!typingFilePath) {
            logger.error('Could not find ws3-fca typing indicator file. Tried paths:', possiblePaths);
            return false;
        }

        logger.info(`Found typing indicator file at: ${typingFilePath}`);
        
        // Original file content
        const originalContent = fs.readFileSync(typingFilePath, 'utf8');
        
        // New content with thorough validation
        const patchedContent = originalContent.replace(
            /thread_key: threadID\.toString\(\),/g,
            `thread_key: threadID && typeof threadID === 'object' ? JSON.stringify(threadID) : (threadID ? String(threadID) : '0'),`
        );
        
        // Only write if content actually changed
        if (originalContent !== patchedContent) {
            fs.writeFileSync(typingFilePath, patchedContent);
            logger.info('✅ Successfully patched ws3-fca typing indicator');
            return true;
        } else {
            logger.info('⚠️ ws3-fca typing indicator already patched or patch not applicable');
            return false;
        }
        
    } catch (error) {
        logger.error('Failed to patch ws3-fca:', error.message);
        return false;
    }
}

module.exports = { patchWs3Fca };
