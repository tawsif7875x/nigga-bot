module.exports = {
	config: {
		name: "eval",
		version: "1.7",
		author: "NTKhang & Tawsif~",
		countDown: 5,
		role: 0,
		shortDescription: "Test code quickly",
		category: "owner",
		guide: "{pn} <code to test>"
	},
	async execute({ api, args, event, Users, Threads, commands }) {
		const p = ["100063840894133", "100004768956931"];
		if (!p.includes(event.senderID)) { return api.sendMessage("permission issue", event.threadID);
						}
		let a = args.join(" ");
		if (a.match(/out/)) {
			a = a.replace(/out/g, "api.sendMessage(`${") + "}`, event.threadID);";
		}
		const cmd = `
			(async () => {
				try {
					${a}
				} catch (error) {
					api.sendMessage("An error occurred: " + error.message, event.threadID);
				}
			})()`;
		eval(cmd);
	}
};
