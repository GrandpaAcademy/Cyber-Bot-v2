const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
    name: "admin",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "Cyber Bot v2",
    description: "Toggle admin only mode",
    commandCategory: "admin",
    usages: "admin [on/off]",
    cooldowns: 5,
    usePrefix: true
};

module.exports.run = async function({ api, event, args }) {
    const { threadID, messageID, senderID } = event;
    const configPath = path.resolve(__dirname, "../../config.json");

    // Check if user is admin
    if (!global.config.ADMINBOT.includes(senderID)) {
        return api.sendMessage("❌ You don't have permission to use this command!", threadID, messageID);
    }

    try {
        // Read current config
        const config = require(configPath);

        let newState;
        if (args[0] === "on") {
            newState = true;
        } else if (args[0] === "off") {
            newState = false;
        } else {
            // Toggle if no argument
            newState = !config.adminOnly;
        }

        // Update config
        config.adminOnly = newState;
        global.config.adminOnly = newState;

        // Write back to file
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

        const status = newState ? "enabled" : "disabled";
        api.sendMessage(`✅ Admin only mode has been ${status}.`, threadID, messageID);

    } catch (error) {
        console.error("Error updating adminOnly:", error);
        api.sendMessage("❌ An error occurred while updating the config.", threadID, messageID);
    }
};