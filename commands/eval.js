module.exports = {
	config: {
		name: "eval",
		version: "1.7",
		author: "NTKhang & Tawsif~",
		countDown: 5,
		role: 2,
		shortDescription: "Test code quickly",
		category: "owner",
		guide:"{pn} <code to test>"
	},
	async execute({ api, args, event, Users, Threads, commands }) {
		let a = args.join(" ");
		if (a.match(/out/)) {
			a = a.replace(/out/g, "api.sendMessage(`${") + "}`, event.threadID);";
		} else { a = args.join(" ");
		       }
		const cmd = `
			(async () => {
				try {
					${a}
				} catch (error) {
					api.sendMessage("error: " + error.message, event.threadID);
				}
			})()`;
			eval(cmd);
		}
	}
};
