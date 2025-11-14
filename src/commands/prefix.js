module.exports.config = {
    name: "prefix",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "Grandpa EJ",
    description: "Show current prefix",
    commandCategory: "info",
    usages: "",
    cooldowns: 5,
    usePrefix: false
};

module.exports.run = async function({ api, event }) {
    const currentPrefix = global.config.PREFIX;
    api.sendMessage(`Current prefix is: ${currentPrefix}`, event.threadID, event.messageID);
};