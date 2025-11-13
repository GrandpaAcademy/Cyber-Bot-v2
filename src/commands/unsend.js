module.exports.config = {
	name: "unsend",
	version: "1.0.1",
	hasPermssion: 0,
	credits: "Mirai Team",
	description: "Unsend bot's messages",
	usePrefix: true,
	commandCategory: "message",
	usages: "unsend",
	cooldowns: 0,
	aliases: ["rem", "uns"]
};

module.exports.run = async function({ api, event, getText }) {
	if (!event.messageReply) {
		return await api.sendMessage(getText("missingReply"), event.threadID, null, false);
	}

	if (event.messageReply.senderID != api.getCurrentUserID()) return await api.sendMessage(getText("returnCant"), event.threadID, null, false);
	
	return await api.unsendMessage(event.messageReply.messageID);
}

module.exports.languages = {
	"en": {
		"returnCant": "Can't remove other people's messages.",
		"missingReply": "You can't unsend a message out of nowhere. Please reply to a message first."
	}
}
