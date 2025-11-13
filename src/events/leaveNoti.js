module.exports.config = {
  name: "leave",
  eventType: ["log:unsubscribe"],
  version: "2.0.0",
  credits: "GrandpaEJ",
  description: "Notifies when members leave the group"
};

const fs = require('fs-extra');
const path = require('path');
const moment = require('moment-timezone');

module.exports.run = async function({ api, event, Users }) {
  const { threadID } = event;
  const { logMessageData } = event;
  
  try {
    // Get thread info
    const threadInfo = await api.getThreadInfo(threadID);
    const leftParticipantFbId = logMessageData.leftParticipantFbId;
    
    // Get user name
    const name = global.data.userName.get(leftParticipantFbId) || await Users.getNameUser(leftParticipantFbId);
    const isKicked = event.author != leftParticipantFbId;
    
    // Get time info
    const timeNow = moment.tz("Asia/Dhaka").format("HH:mm:ss");
    const dateNow = moment.tz("Asia/Dhaka").format("DD/MM/YYYY");
    const weekDay = moment.tz("Asia/Dhaka").format("dddd");
    
    // Create message based on leave type
    const headerText = isKicked ? "𝗠𝗘𝗠𝗕𝗘𝗥 𝗞𝗜𝗖𝗞𝗘𝗗" : "𝗠𝗘𝗠𝗕𝗘𝗥 𝗟𝗘𝗙𝗧";
    const actionText = isKicked ? "was removed from" : "left";
    const emoji = isKicked ? "🚫" : "⚠️";
    
    const leaveMsg = `╔═══════════════╗\n` +
                    `  ${emoji} ${headerText} ${emoji}\n` +
                    `╚═══════════════╝\n\n` +
                    `👤 ${name} has ${actionText} the group\n\n` +
                    `━━━━━━━━━━━━━\n` +
                    `📝 Group: ${threadInfo.threadName}\n` +
                    `👥 Remaining members: ${threadInfo.participantIDs.length}\n` +
                    `🕒 Time: ${timeNow}\n` +
                    `📅 Date: ${dateNow} (${weekDay})\n` +
                    `━━━━━━━━━━━━━`;

    // Choose GIF based on whether member was kicked or left
    const gifName = isKicked ? 'kicked.gif' : 'leave.gif';
    const gifPath = path.join(__dirname, '..', '..', 'assets','gifs', gifName);
    
    // Check if GIF exists
    if (fs.existsSync(gifPath)) {
      return await api.sendMessage(
        {
          body: leaveMsg,
          attachment: fs.createReadStream(gifPath)
        },
        threadID,
        null,
        false
      );
    } else {
      // Send message without GIF if file doesn't exist
      return await api.sendMessage(leaveMsg, threadID, null, false);
    }

  } catch (error) {
    console.error('Leave message error:', error.message);
    
    // Try to send a minimal message if the fancy one fails
    try {
      const name = leftParticipantFbId;
      const simpleMsg = `Member ${name} has ${event.author != leftParticipantFbId ? "been removed from" : "left"} the group.`;
      return await api.sendMessage(simpleMsg, threadID, null, false);
    } catch (err) {
      return await api.sendMessage("⚠️ A member has left the group.", threadID, null, false);
    }
  }
};
