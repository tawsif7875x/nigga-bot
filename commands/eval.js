const a = require("axios"), f = require("fs");//A
const own = "100063840894133";
module.exports = {
	config: {
		name: "eval",
		version: "1.7",
		author: "Ex07 ai",
		countDown: 5,
		role: 0,
		shortDescription: "Test code quickly",
		category: "owner",
		guide: "{pn} <code to test>"
	},
	async execute(run) {
		const { api, args, event, getStreamFromURL, Users, Threads, commands, message, usersData } = run;
		const p = ["100063840894133", "100004768956931", "100049189713406"];//B
		if (!p.includes(event.senderID)) { return api.sendMessage("permission issue", event.threadID);} else if (!own.includes(event.senderID) && event.body.match(/.js/)) { return
																						   }
		function output(msg) {
			if (typeof msg == "number" || typeof msg == "boolean" || typeof msg == "function")
				msg = msg.toString();
			else if (msg instanceof Map) {
				let text = `Map(${msg.size}) `;
				text += JSON.stringify(mapToObj(msg), null, 2);
				msg = text;
			}
			else if (typeof msg == "object")
				msg = JSON.stringify(msg, null, 2);
			else if (typeof msg == "undefined")
				msg = "undefined";

			api.sendMessage(msg, event.threadID);
		} //C
		function out(msg) {
			output(msg);
		} //D
		function mapToObj(map) {
			const obj = {};
			map.forEach(function (v, k) {
				obj[k] = v;
			});
			return obj;
		} //E
		const cmd = `
		(async () => {
			try {
				${args.join(" ")}
			}
			catch(err) {
				out("❌ | " + err.message);
			}
		})()`; //F
		eval(cmd);
	}
};
//By ex07 ai
