const { Octokit } = require('@octokit/rest');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');
const config = require('../config.json');

let octokit = null;

function initGithub() {
  if (!config.github.enabled) return;
  octokit = new Octokit({ auth: config.github.token });
}

async function pushToGithub(filePath, message) {
  if (!octokit) return;
  
  try {
    const content = fs.readFileSync(filePath);
    const contentEncoded = content.toString('base64');
    const fileName = path.basename(filePath);

    // Get current file SHA if it exists
    let fileSha = null;
    try {
      const { data } = await octokit.repos.getContent({
        owner: config.github.owner,
        repo: config.github.repo,
        path: `database/${fileName}`,
      });
      fileSha = data.sha;
    } catch (error) {
      // File doesn't exist yet, that's okay
    }

    // Update or create file
    await octokit.repos.createOrUpdateFileContents({
      owner: config.github.owner,
      repo: config.github.repo,
      path: `database/${fileName}`,
      message: message,
      content: contentEncoded,
      sha: fileSha,
      branch: config.github.branch || 'main'
    });

    logger.info(`Successfully pushed ${fileName} to GitHub`);
  } catch (error) {
    logger.error('GitHub sync failed:', error.message);
  }
}

module.exports = { initGithub, pushToGithub };
