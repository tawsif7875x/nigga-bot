const fs = require('fs');
module.exports = {
config: {
	name: "restart",
	author: "Tawsif~",
	role: 0,
},
 onLoad: function ({ api, event }) {
		const pathFile = `./restart.txt`;
		if (fs.existsSync(pathFile)) {
			const [tid, time] = fs.readFileSync(pathFile, "utf-8").split(" ");
			api.sendMessage(`✅ | Bot restarted\n⏰ | Time: ${(Date.now() - time) / 1000}s`, event.threadID);
			fs.unlinkSync(pathFile);
		}
	},

	execute: async exexute({ message, event, getLang }) {
		const pathFile = `./restart.txt`;
		fs.writeFileSync(pathFile, `${event.threadID} ${Date.now()}`);
		await api.sendMessage("🔄 | restarting", event.threadID);
		process.exit(2);
	}
};
