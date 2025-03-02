module.exports = {
	config: {
		name: "eval",
		version: "1.6",
		author: "NTKhangn & Tawsif~",
		countDown: 5,
		role: 2,
		description: {
			vi: "Test code nhanh",
			en: "Test code quickly"
		},
		category: "owner",
		guide: {
			vi: "{pn} <đoạn code cần test>",
			en: "{pn} <code to test>"
		}
	},

	langs: {
		vi: {
			error: "❌ Đã có lỗi xảy ra:"
		},
		en: {
			error: "❌ An error occurred:"
		}
	},

	async execute({ api, args, event }) {
		let a = args.join(" ");
		if (a.match(/out/)) {
			a = a.replace(/out/g, "api.sendMessage(`${") + "}`, event.threadID);";
			const cmd = `
			(async () => {
				try {
					${a}
				} catch (error) {
					api.sendMessage("${this.langs.en.error} " + error.message, event.threadID);
				}
			})()`;
			eval(cmd);
		}
	}
};
