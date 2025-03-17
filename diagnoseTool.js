/**
 * Nexus Bot Diagnostic Tool
 * Run this file to diagnose issues with your bot
 */

const { runDiagnostics } = require('./utils/debug');

// Run diagnostics
runDiagnostics().catch(err => {
  console.error("Diagnostic tool error:", err);
  process.exit(1);
});
