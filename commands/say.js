const axios = require('axios');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

module.exports = {
  config: {
    name: "say",
    aliases: ["tts", "speak"],
    version: "1.0.0",
    author: "Nexus Team",
    countDown: 5,
    role: 0,
    shortDescription: "Convert text to speech",
    longDescription: "Convert text to speech using Google TTS",
    category: "utility",
    guide: "{prefix}say [language] [text]\nLanguages: en, vi, ja, ko, ru"
  },

  execute: async function({ api, event, args }) {
    const { threadID, messageID } = event;

    // Show help if no arguments
    if (args.length === 0) {
      return api.sendMessage(
        "🎯 Usage Guide:\n\n" +
        "!say [lang] [text]\n" +
        "Languages:\n" +
        "- en: English 🇺🇸\n" +
        "- vi: Vietnamese 🇻🇳\n" +
        "- ja: Japanese 🇯🇵\n" +
        "- ko: Korean 🇰🇷\n" +
        "- ru: Russian 🇷🇺\n\n" +
        "Example: !say ja こんにちは", 
        threadID, messageID
      );
    }

    try {
      // Parse language and text
      let lang = 'en';
      let text = args.join(" ");
      
      // Check if first argument is a language code
      const validLangs = ['en', 'vi', 'ja', 'ko', 'ru'];
      if (validLangs.includes(args[0].toLowerCase())) {
        lang = args[0].toLowerCase();
        text = args.slice(1).join(" ");
      }

      if (!text) {
        return api.sendMessage("❌ Please provide text to speak", threadID, messageID);
      }

      // Download audio file
      const response = await axios({
        method: 'get',
        url: `https://translate.google.com/translate_tts`,
        params: {
          ie: 'UTF-8',
          q: text,
          tl: lang,
          client: 'tw-ob'
        },
        responseType: 'arraybuffer'
      });

      // Save to cache folder
      const cacheDir = path.join(__dirname, '..', 'cache');
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }

      const audioPath = path.join(cacheDir, `tts_${Date.now()}.mp3`);
      fs.writeFileSync(audioPath, Buffer.from(response.data));

      // Send audio message
      await api.sendMessage(
        {
          attachment: fs.createReadStream(audioPath),
          body: `🗣️ ${lang.toUpperCase()}: ${text}`
        },
        threadID,
        async () => {
          // Cleanup
          try {
            fs.unlinkSync(audioPath);
          } catch (e) {
            logger.error("Cleanup error:", e);
          }
        },
        messageID
      );

    } catch (error) {
      logger.error('Text-to-speech error:', error);
      return api.sendMessage('❌ Failed to convert text to speech. Please try again later.', threadID, messageID);
    }
  }
};
