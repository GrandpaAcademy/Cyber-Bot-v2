module.exports.config = {
  name: "gm",
  version: "1.0.0",
  hasPermssion: 1,
  credits: "GrandpaEJ",
  description: "Complete Group Management Command",
  usePrefix: true,
  commandCategory: "group",
  usages: [
    "emoji [new emoji]",
    "name [new name]",
    "setpic (reply to image)",
    "getpic",
    "theme [theme code]",
    "info",
    "notify [on/off]",
    "inbox [on/off]",
    "approval [on/off]",
    "admin [add/remove] [@tag]"
  ],
  cooldowns: 5,
  dependencies: {
    "fs-extra": "",
    "axios": "",
    "path": ""
  }
};

module.exports.run = async function({ api, event, args, Threads }) {
  const { threadID, messageID, messageReply, senderID } = event;
  const fs = require("fs-extra");
  const axios = require("axios");
  const path = require("path");

  // Check if user has admin permissions
  const threadInfo = await api.getThreadInfo(threadID);
  const isAdmin = threadInfo.adminIDs.some(e => e.id === senderID);
  if (!isAdmin) return api.sendMessage("⚠️ You need to be a group admin to use this command.", threadID, messageID);

  if (args.length === 0) {
    return api.sendMessage(
      "📝 𝗚𝗥𝗢𝗨𝗣 𝗠𝗔𝗡𝗔𝗚𝗘𝗥 𝗛𝗘𝗟𝗣\n\n" +
      "1. gm emoji [new emoji] - Change group emoji\n" +
      "2. gm name [new name] - Change group name\n" +
      "3. gm setpic - Set group photo (reply to image)\n" +
      "4. gm getpic - Get group photo\n" +
      "5. gm theme [theme code] - Change chat theme\n" +
      "6. gm info - Get group information\n" +
      "7. gm notify [on/off] - Toggle notifications\n" +
      "8. gm inbox [on/off] - Toggle message requests\n" +
      "9. gm approval [on/off] - Toggle approval mode\n" +
      "10. gm admin [add/remove] [@tag] - Manage admins\n\n" +
      "Example: gm emoji 🎮",
      threadID, messageID
    );
  }

  const command = args[0].toLowerCase();
  const params = args.slice(1).join(" ");

  try {
    switch (command) {
      case "emoji": {
        if (!params) return api.sendMessage("⚠️ Please provide a new emoji!", threadID, messageID);
        await api.changeThreadEmoji(params, threadID);
        break;
      }

      case "name": {
        if (!params) return api.sendMessage("⚠️ Please provide a new group name!", threadID, messageID);
        await api.setTitle(params, threadID);
        break;
      }

      case "setpic": {
        if (!messageReply || !messageReply.attachments || !messageReply.attachments[0]) {
          return api.sendMessage("⚠️ Please reply to an image!", threadID, messageID);
        }
        
        const imgUrl = messageReply.attachments[0].url;
        const imgResponse = await axios.get(imgUrl, { responseType: "arraybuffer" });
        fs.writeFileSync(__dirname + "/cache/group_pic.png", Buffer.from(imgResponse.data));
        
        await api.changeGroupImage(fs.createReadStream(__dirname + "/cache/group_pic.png"), threadID);
        fs.unlinkSync(__dirname + "/cache/group_pic.png");
        break;
      }

      case "getpic": {
        const threadInfo = await api.getThreadInfo(threadID);
        if (!threadInfo.imageSrc) return api.sendMessage("⚠️ This group doesn't have a photo!", threadID, messageID);
        
        const imgResponse = await axios.get(threadInfo.imageSrc, { responseType: "arraybuffer" });
        fs.writeFileSync(__dirname + "/cache/group_pic.png", Buffer.from(imgResponse.data));
        
        await api.sendMessage(
          { 
            body: "🖼️ Current group photo:",
            attachment: fs.createReadStream(__dirname + "/cache/group_pic.png")
          },
          threadID,
          () => fs.unlinkSync(__dirname + "/cache/group_pic.png")
        );
        break;
      }

      case "theme": {
        if (!params) return api.sendMessage("⚠️ Please provide a theme code!", threadID, messageID);
        await api.changeThreadColor(params, threadID);
        break;
      }

      case "info": {
        const threadInfo = await api.getThreadInfo(threadID);
        const adminList = threadInfo.adminIDs.map(admin => `→ ${threadInfo.nicknames[admin.id] || "Facebook User"}`).join("\\n");
        
        const info = 
          "📊 𝗚𝗥𝗢𝗨𝗣 𝗜𝗡𝗙𝗢𝗥𝗠𝗔𝗧𝗜𝗢𝗡\n\n" +
          `Name: ${threadInfo.threadName}\n` +
          `ID: ${threadInfo.threadID}\n` +
          `Members: ${threadInfo.participantIDs.length}\n` +
          `Admins: ${threadInfo.adminIDs.length}\n` +
          `Emoji: ${threadInfo.emoji}\n` +
          `Message Count: ${threadInfo.messageCount}\n` +
          `Approval Mode: ${threadInfo.approvalMode ? "On" : "Off"}\n\n` +
          "👑 𝗔𝗗𝗠𝗜𝗡 𝗟𝗜𝗦𝗧:\n" + adminList;

        await api.sendMessage(info, threadID, messageID);
        break;
      }

      case "notify": {
        const state = params.toLowerCase();
        if (state !== "on" && state !== "off") {
          return api.sendMessage("⚠️ Please specify either 'on' or 'off'!", threadID, messageID);
        }
        await api.changeGroupNotifications(threadID, state === "on");
        break;
      }

      case "inbox": {
        const state = params.toLowerCase();
        if (state !== "on" && state !== "off") {
          return api.sendMessage("⚠️ Please specify either 'on' or 'off'!", threadID, messageID);
        }
        await api.changeGroupMessageSettings(threadID, state === "on" ? "INBOX" : "MESSAGE_REQUESTS");
        break;
      }

      case "approval": {
        const state = params.toLowerCase();
        if (state !== "on" && state !== "off") {
          return api.sendMessage("⚠️ Please specify either 'on' or 'off'!", threadID, messageID);
        }
        await api.changeGroupApprovalMode(threadID, state === "on");
        break;
      }

      case "admin": {
        const action = args[1]?.toLowerCase();
        const mentions = Object.keys(event.mentions);

        if (!action || !mentions.length || (action !== "add" && action !== "remove")) {
          return api.sendMessage("⚠️ Please specify action (add/remove) and tag the user!", threadID, messageID);
        }

        for (const userID of mentions) {
          await api.changeAdminStatus(threadID, userID, action === "add");
        }
        break;
      }

      default:
        return api.sendMessage("⚠️ Invalid command! Use 'gm' to see available commands.", threadID, messageID);
    }

    // Success message
    if (command !== "info" && command !== "getpic") {
      api.sendMessage(`✅ Successfully executed: gm ${command}`, threadID, messageID);
    }

  } catch (error) {
    console.error(error);
    api.sendMessage(
      `❌ Error executing command: ${error.message}\n` +
      "Please check your permissions and try again.",
      threadID, messageID
    );
  }
};
