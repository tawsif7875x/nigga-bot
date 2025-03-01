const fs = require('fs');
const path = require('path');

class SessionManager {
  constructor() {
    this.sessions = new Map();
    this.rotationInterval = 3600000; // 1 hour
    this.startRotation();
  }

  startSession(userID) {
    this.sessions.set(userID, {
      startTime: Date.now(),
      messageCount: 0,
      lastActivity: Date.now()
    });
  }

  rotateSession() {
    const now = Date.now();
    this.sessions.forEach((session, userID) => {
      if (now - session.startTime > this.rotationInterval) {
        this.startSession(userID);
      }
    });
  }

  startRotation() {
    setInterval(() => this.rotateSession(), this.rotationInterval);
  }
}

module.exports = new SessionManager();
