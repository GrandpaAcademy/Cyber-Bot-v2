module.exports.config = {
  name: "adminNoti",
  eventType: [
    "log:thread-admins",
    "log:thread-name",
    "log:user-nickname",
    "log:thread-call",
    "log:thread-icon",
    "log:thread-color",
    "log:link-status",
    "log:magic-words",
    "log:thread-approval-mode",
    "log:thread-poll"
  ],
  version: "2.0.0",
  credits: "GrandpaEJ",
  description: "Enhanced Group Activity Notifications",
  envConfig: {
    autoUnsend: true,
    sendNoti: true,
    timeToUnsend: 10
  }
};

module.exports.run = async function({ event, api, Threads, Users }) {
  const { author, threadID, logMessageType, logMessageData, logMessageBody } = event;
  const { setData, getData } = Threads;
  const fs = require("fs");
  const iconPath = __dirname + "/cache/emoji.json";
  if (!fs.existsSync(iconPath)) fs.writeFileSync(iconPath, JSON.stringify({}));
  if (author === threadID) return;

  const sendGroupUpdate = async (message) => {
    return api.sendMessage(
      `━━━ 𝗚𝗥𝗢𝗨𝗣 𝗨𝗣𝗗𝗔𝗧𝗘 ━━━\n\n${message}`, 
      threadID, 
      async (error, info) => {
        if (error) return console.error(error);
        if (global.configModule[this.config.name].autoUnsend) {
          await new Promise(resolve => setTimeout(resolve, global.configModule[this.config.name].timeToUnsend * 1000));
          return api.unsendMessage(info.messageID);
        }
      }
    );
  };

  try {
    let dataThread = (await getData(threadID)).threadInfo;

    switch (logMessageType) {
      case "log:thread-admins": {
        if (logMessageData.ADMIN_EVENT === "add_admin") {
          dataThread.adminIDs.push({ id: logMessageData.TARGET_ID });
          const userName = await Users.getNameUser(logMessageData.TARGET_ID);
          await sendGroupUpdate(`👑 𝗡𝗘𝗪 𝗔𝗗𝗠𝗜𝗡\n\n➤ ${userName} has been promoted to admin`);
        } else if (logMessageData.ADMIN_EVENT === "remove_admin") {
          dataThread.adminIDs = dataThread.adminIDs.filter(item => item.id !== logMessageData.TARGET_ID);
          const userName = await Users.getNameUser(logMessageData.TARGET_ID);
          await sendGroupUpdate(`👤 𝗔𝗗𝗠𝗜𝗡 𝗥𝗘𝗠𝗢𝗩𝗘𝗗\n\n➤ ${userName} is no longer an admin`);
        }
        break;
      }
      case "log:user-nickname": {
        const { participant_id, nickname } = logMessageData;
        if (participant_id && nickname) {
          dataThread.nicknames = dataThread.nicknames || {};
          dataThread.nicknames[participant_id] = nickname;
          const participantName = await Users.getNameUser(participant_id);
          const formattedNickname = nickname || "❌ removed";
          await sendGroupUpdate(`📝 𝗡𝗜𝗖𝗞𝗡𝗔𝗠𝗘 𝗨𝗣𝗗𝗔𝗧𝗘\n\n➤ User: ${participantName}\n➤ New nickname: ${formattedNickname}`);
        }
        break;
      }
      case "log:thread-name": {
        dataThread.threadName = logMessageData.name || null;
        const newName = dataThread.threadName ? `➤ New name: ${dataThread.threadName}` : '➤ Group name has been cleared';
        await sendGroupUpdate(`✏️ 𝗚𝗥𝗢𝗨𝗣 𝗡𝗔𝗠𝗘 𝗖𝗛𝗔𝗡𝗚𝗘𝗗\n\n${newName}`);
        break;
      }
      case "log:thread-icon": {
        const preIcon = JSON.parse(fs.readFileSync(iconPath));
        dataThread.threadIcon = logMessageData.thread_icon || "👍";
        if (global.configModule[this.config.name].sendNoti) {
          const update = `🎭 𝗚𝗥𝗢𝗨𝗣 𝗜𝗖𝗢𝗡 𝗖𝗛𝗔𝗡𝗚𝗘𝗗\n\n➤ New icon: ${dataThread.threadIcon}\n➤ Previous: ${preIcon[threadID] || "❓ unknown"}`;
          await sendGroupUpdate(update);
          preIcon[threadID] = dataThread.threadIcon;
          fs.writeFileSync(iconPath, JSON.stringify(preIcon));
        }
        break;
      }
      case "log:thread-call": {
        if (logMessageData.event === "group_call_started") {
          const name = await Users.getNameUser(logMessageData.caller_id);
          await sendGroupUpdate(`📞 𝗚𝗥𝗢𝗨𝗣 𝗖𝗔𝗟𝗟 𝗦𝗧𝗔𝗥𝗧𝗘𝗗\n\n➤ Started by: ${name}\n➤ Type: ${(logMessageData.video) ? '📹 Video' : '🎤 Voice'} call`);
        } else if (logMessageData.event === "group_call_ended") {
          const callDuration = logMessageData.call_duration;
          const hours = Math.floor(callDuration / 3600).toString().padStart(2, '0');
          const minutes = Math.floor((callDuration % 3600) / 60).toString().padStart(2, '0');
          const seconds = (callDuration % 60).toString().padStart(2, '0');
          const timeFormat = `${hours}:${minutes}:${seconds}`;
          await sendGroupUpdate(`📞 𝗚𝗥𝗢𝗨𝗣 𝗖𝗔𝗟𝗟 𝗘𝗡𝗗𝗘𝗗\n\n➤ Type: ${(logMessageData.video) ? '📹 Video' : '🎤 Voice'} call\n➤ Duration: ${timeFormat}`);
        } else if (logMessageData.joining_user) {
          const name = await Users.getNameUser(logMessageData.joining_user);
          await sendGroupUpdate(`📞 𝗖𝗔𝗟𝗟 𝗝𝗢𝗜𝗡𝗘𝗗\n\n➤ ${name} joined the ${(logMessageData.group_call_type == '1') ? '📹 video' : '🎤 voice'} call`);
        }
        break;
      }
      case "log:link-status": {
        const status = logMessageBody.includes("disabled") ? "❌ 𝗗𝗜𝗦𝗔𝗕𝗟𝗘𝗗" : "✅ 𝗘𝗡𝗔𝗕𝗟𝗘𝗗";
        await sendGroupUpdate(`🔗 𝗚𝗥𝗢𝗨𝗣 𝗟𝗜𝗡𝗞 𝗦𝗧𝗔𝗧𝗨𝗦\n\n➤ Status: ${status}`);
        break;
      }
      case "log:magic-words": {
        await sendGroupUpdate(
          `✨ 𝗠𝗔𝗚𝗜𝗖 𝗪𝗢𝗥𝗗𝗦 𝗨𝗣𝗗𝗔𝗧𝗘\n\n` +
          `➤ Theme: ${logMessageData.theme_name}\n` +
          `➤ Word: ${logMessageData.magic_word}\n` +
          `➤ Emoji: ${logMessageData.emoji_effect || "❌ None"}\n` +
          `➤ Total effects: ${logMessageData.new_magic_word_count}`
        );
        break;
      }
      case "log:thread-poll": {
        if (logMessageData.event_type === "question_creation" || logMessageData.event_type === "update_vote") {
          const poll = JSON.parse(logMessageData.question_json);
          await sendGroupUpdate(
            `📊 𝗚𝗥𝗢𝗨𝗣 𝗣𝗢𝗟𝗟 𝗨𝗣𝗗𝗔𝗧𝗘\n\n` +
            `➤ Event: ${logMessageData.event_type === "question_creation" ? "New poll created" : "Vote updated"}\n` +
            `➤ Question: ${poll.text || "No question"}`
          );
        }
        break;
      }
      case "log:thread-approval-mode": {
        const mode = logMessageBody.includes("enabled") ? "✅ Enabled" : "❌ Disabled";
        await sendGroupUpdate(`👥 𝗚𝗥𝗢𝗨𝗣 𝗔𝗣𝗣𝗥𝗢𝗩𝗔𝗟 𝗠𝗢𝗗𝗘\n\n➤ Status: ${mode}`);
        break;
      }
      case "log:thread-color": {
        dataThread.threadColor = logMessageData.thread_color || "🌤";
        if (global.configModule[this.config.name].sendNoti) {
          await sendGroupUpdate(`🎨 𝗚𝗥𝗢𝗨𝗣 𝗖𝗢𝗟𝗢𝗥 𝗨𝗣𝗗𝗔𝗧𝗘\n\n➤ New color theme: ${dataThread.threadColor}`);
        }
        break;
      }
    }

    await setData(threadID, { threadInfo: dataThread });
  } catch (error) {
    console.log(error);
  }
};
