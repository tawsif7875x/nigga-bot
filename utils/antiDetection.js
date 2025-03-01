const humanBehavior = {
  typingSpeed: {
    min: 50,  // Characters per minute
    max: 200  // Characters per minute
  },
  readingTime: {
    min: 1000,  // Milliseconds
    max: 5000   // Milliseconds
  },
  replyDelay: {
    min: 2000,  // Milliseconds
    max: 10000  // Milliseconds
  }
};

function simulateHumanTyping(messageLength) {
  const typingSpeed = Math.random() * (humanBehavior.typingSpeed.max - humanBehavior.typingSpeed.min) + humanBehavior.typingSpeed.min;
  return Math.floor((messageLength / typingSpeed) * 60 * 1000);
}

function generateReadDelay() {
  return Math.floor(Math.random() * (humanBehavior.readingTime.max - humanBehavior.readingTime.min) + humanBehavior.readingTime.min);
}

function generateReplyDelay() {
  return Math.floor(Math.random() * (humanBehavior.replyDelay.max - humanBehavior.replyDelay.min) + humanBehavior.replyDelay.min);
}

// Randomize online/offline status
function randomizePresence() {
  return Math.random() > 0.7; // 30% chance to appear offline
}

// Simulate natural breaks in activity
function shouldTakeBreak() {
  return Math.random() > 0.95; // 5% chance to take a break
}

module.exports = {
  simulateHumanTyping,
  generateReadDelay,
  generateReplyDelay,
  randomizePresence,
  shouldTakeBreak
};
