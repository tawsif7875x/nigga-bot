module.exports = {
  config: {
    name: "hr",
    aliases: [],
    version: "1.0",
    role: 1,
    premium: true,
    author: "none",
    Description: "",
    category: "",
    countDown: 0,
  },
async execute({ args, api, event }) {
const n = await api.sendMessage("hi", event.threadID);
global.client.handleReply.push({
          name: this.config.name,
          messageID: n.messageID,
          author: event.senderID,
          type: "update_confirm",
          data: { repoOwner, repoName, currentVersion, latestVersion }
        });
handleReply: async function({ api, event, handleReply }) {
    const { threadID, messageID, senderID, body } = event;
if (body === "hi") { await api.sendMessage("hello", event.threadID);
} else {  api.sendMessage("segs", event.threadID);
}
}
}
