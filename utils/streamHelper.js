const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { promisify } = require('util');
const logger = require('./logger');

/**
 * Helper class for reliable file streaming with ws3-fca
 */
class StreamHelper {
  /**
   * Sends an image with improved reliability
   * @param {Object} api - The ws3-fca API
   * @param {String} imagePath - Path to image file
   * @param {String} threadID - Thread ID
   * @param {String} message - Optional message text
   * @returns {Promise<boolean>} - Success status
   */
  static async sendImage(api, imagePath, threadID, message = null) {
    return new Promise((resolve, reject) => {
      try {
        // Validate file exists
        if (!fs.existsSync(imagePath)) {
          logger.error(`[StreamHelper] File not found: ${imagePath}`);
          reject(new Error(`File not found: ${imagePath}`));
          return;
        }
        
        // Validate file size
        const stats = fs.statSync(imagePath);
        if (stats.size === 0) {
          logger.error(`[StreamHelper] Empty file: ${imagePath}`);
          reject(new Error(`Empty file: ${imagePath}`));
          return;
        }
        
        logger.debug(`[StreamHelper] Sending ${imagePath} (${stats.size} bytes) to ${threadID}`);
        
        // First send image only
        api.sendMessage({
          attachment: fs.createReadStream(imagePath)
        }, threadID, (err) => {
          if (err) {
            logger.error(`[StreamHelper] Failed to send attachment: ${err.message}`);
            reject(err);
            return;
          }
          
          // If there's a message, send it separately
          if (message) {
            api.sendMessage(message, threadID, (msgErr) => {
              if (msgErr) {
                logger.warn(`[StreamHelper] Failed to send follow-up message: ${msgErr.message}`);
                // We still resolve true because the image was sent successfully
              }
              resolve(true);
            });
          } else {
            resolve(true);
          }
        });
      } catch (error) {
        logger.error(`[StreamHelper] Error: ${error.message}`);
        reject(error);
      }
    });
  }
  
  /**
   * Downloads an image and sends it
   * @param {Object} api - The ws3-fca API
   * @param {String} imageUrl - URL of image
   * @param {String} threadID - Thread ID
   * @param {String} message - Optional message text
   * @returns {Promise<boolean>} - Success status
   */
  static async downloadAndSendImage(api, imageUrl, threadID, message = null) {
    try {
      // Create cache directory
      const cacheDir = path.join(__dirname, '../commands/cache');
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }
      
      const imagePath = path.join(cacheDir, `image_${Date.now()}.jpg`);
      
      // Download image to file
      const writer = fs.createWriteStream(imagePath);
      
      const response = await axios({
        method: 'get',
        url: imageUrl,
        responseType: 'stream',
        timeout: 30000
      });
      
      response.data.pipe(writer);
      
      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });
      
      // Send the image
      const result = await this.sendImage(api, imagePath, threadID, message);
      
      // Clean up
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
      
      return result;
    } catch (error) {
      logger.error(`[StreamHelper] Download error: ${error.message}`);
      throw error;
    }
  }
}

module.exports = StreamHelper;
