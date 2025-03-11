module.exports = {
    config: {
        name: "callad",
        category: "box chat",
        author: "Tawsif~",
        role: 0,
        shortDescription: "sends message to bot owner",
        guide: "callad <text>\nfor owner: callad reply <tid> <text>"
    },
    async execute({ api, event, args }) {
        try {
            const tid = args[1];
            const amsg = args.slice(2).join(" ");
            const msg = args.join(" ");
            if (args[0] === "reply") {
                if (event.senderID === "100063840894133") {
			if (!tid || !amsg) { return api.sendMessage("invalid format. type help callad for guide", event.threadID);
					   } else { api.sendMessage(`REPLY FROM TAWSIF:\n—————————————————\n${amsg}`, tid);
						  }
                } else {
                    api.sendMessage("❌ | You do not have permission to reply.", event.threadID);
                }
            } else if (!msg) { return api.sendMessage("text can't be empty", event.threadID);
			     } else { api.sendMessage(`CALL ADMIN\nUID: ${event.senderID}\nTHREAD ID: ${event.threadID}\nBODY: ${msg}`, 8664093487004091);
				     api.sendMessage("✅ | successfully sent your message to bot admin", event.threadID);
            }
        } catch (error) {
            api.sendMessage("❌ | " + error.message, event.threadID);
        }
    }
}
