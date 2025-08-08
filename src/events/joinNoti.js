module.exports.config = {
  name: "join",
  eventType: ['log:subscribe'],
  version: "2.0.0",
  credits: "GrandpaEJ",
  description: "Welcome new members."
};

const fs = require('fs-extra');
const path = require('path');
const moment = require("moment-timezone");

module.exports.run = async function({ api, event, Users }) {
  const { threadID } = event;
  const { commands } = global.client;
  
  // Get thread info
  let threadInfo = await api.getThreadInfo(threadID);
  let threadName = threadInfo.threadName;

  // Check if it's the bot being added
  if (event.logMessageData.addedParticipants && 
      Array.isArray(event.logMessageData.addedParticipants) && 
      event.logMessageData.addedParticipants.some(i => i.userFbId == api.getCurrentUserID())) {
    
    // Bot welcome message
    const gifPath = path.join(__dirname, '..','..','assets','gifs', 'join.gif');
    
    return api.sendMessage(
      {
        body: `⚡️ Connected to: ${threadName}\n\n` +
              `🤖 Bot Status: Online\n` +
              `📚 Commands: ${commands.size}\n` +
              `❯ Prefix: ${global.config.PREFIX}\n` +
              `❯ Version: ${global.config.version}\n\n` +
              `Type ${global.config.PREFIX}help to see commands`,
        attachment: fs.createReadStream(gifPath)
      },
      threadID
    );
  }

  // Handle new member welcome
  try {
    // Get time info
    const timeNow = moment.tz("Asia/Dhaka").format("HH:mm:ss");
    const dateNow = moment.tz("Asia/Dhaka").format("DD/MM/YYYY");
    const weekDay = moment.tz("Asia/Dhaka").format("dddd");
    const session = moment.tz("Asia/Dhaka").hour() < 3 ? "midnight" :
                   moment.tz("Asia/Dhaka").hour() < 8 ? "early morning" :
                   moment.tz("Asia/Dhaka").hour() < 12 ? "morning" :
                   moment.tz("Asia/Dhaka").hour() < 17 ? "afternoon" :
                   moment.tz("Asia/Dhaka").hour() < 23 ? "evening" : "midnight";

    // Get new members info
    const newMembers = event.logMessageData.addedParticipants;
    if (!newMembers || !Array.isArray(newMembers)) return;

    // Create welcome message for each new member
    let mentions = [];
    let welcomeMsg = `╔════ஜ۩۞۩ஜ═══╗\n` +
                    `  ☀ 𝐖𝐄𝐋𝐂𝐎𝐌𝐄 ☀\n` +
                    `╚════ஜ۩۞۩ஜ═══╝\n\n`;

    for (let member of newMembers) {
      const { userFbId, fullName } = member;
      mentions.push({ tag: fullName, id: userFbId });
      welcomeMsg += `🎉 Hello @${fullName}!\n`;
    }

    welcomeMsg += `\n━━━━━━━━━━━━━\n` +
                 `📝 Group: ${threadName}\n` +
                 `👥 Total members: ${threadInfo.participantIDs.length}\n` +
                 `🕒 Time: ${timeNow}\n` +
                 `📅 Date: ${dateNow} (${weekDay})\n` +
                 `⌚ Session: Good ${session}!\n` +
                 `━━━━━━━━━━━━━`;

    // Send welcome message with GIF
    const gifPath = path.join(__dirname, '..','..','assets', 'join.gif');
    
    return api.sendMessage(
      {
        body: welcomeMsg,
        attachment: fs.createReadStream(gifPath),
        mentions
      },
      threadID
    );

  } catch (error) {
    console.error('Welcome message error:', error);
    return api.sendMessage(
      "⚠️ An error occurred while welcoming new members.",
      threadID
    );
  }
};
