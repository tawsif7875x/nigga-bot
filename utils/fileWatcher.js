const fs = require('fs');
const path = require('path');
const logger = require('./logger');

class FileWatcher {
  constructor(directory, onChange) {
    this.directory = directory;
    this.onChange = onChange;
    this.watchedFiles = new Map();
  }

  start() {
    fs.watch(this.directory, { recursive: true }, (eventType, filename) => {
      if (!filename || !filename.endsWith('.js')) return;
      
      const fullPath = path.join(this.directory, filename);
      
      // Debounce multiple events
      clearTimeout(this.watchedFiles.get(filename));
      
      this.watchedFiles.set(filename, setTimeout(() => {
        logger.info(`📝 Detected changes in: ${filename}`);
        this.onChange(filename);
      }, 100));
    });

    logger.info(`👀 Watching for changes in: ${this.directory}`);
  }
}

module.exports = FileWatcher;
