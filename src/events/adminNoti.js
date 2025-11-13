const logger = require("../../utils/log");
const fs = require("fs");

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
  
  try {
    // Input validation
    if (!event || !author || !threadID || !logMessageType) {
      logger.warn("Missing required event data in adminNoti", "WARNING");
      return;
    }
    
    // Skip if author is the thread itself (system events)
    if (author === threadID) return;
    
    const iconPath = __dirname + "/cache/emoji.json";
    
    // Ensure icon cache file exists
    try {
      if (!fs.existsSync(iconPath)) {
        fs.writeFileSync(iconPath, JSON.stringify({}));
      }
    } catch (fileError) {
      logger.error("Error creating emoji cache file:", fileError.message);
    }

    const sendGroupUpdate = async (message) => {
      try {
        const config = global.configModule[this.config.name] || this.config.envConfig;
        const timeToUnsend = config.timeToUnsend * 1000;
        
        try {
          const info = await api.sendMessage(
            `━━━ 𝗚𝗥𝗢𝗨𝗣 𝗨𝗣𝗗𝗔𝗧𝗘 ━━━\n\n${message}`,
            threadID,
            null,
            false
          );
          
          if (config.autoUnsend && info?.messageID) {
            try {
              await new Promise(resolve => setTimeout(resolve, timeToUnsend));
              await api.unsendMessage(info.messageID);
            } catch (unsendError) {
              logger.error("Error unsending message:", unsendError.message);
            }
          }
        } catch (sendError) {
          logger.error("Error sending group update message:", sendError);
        }
      } catch (error) {
        logger.error("Error in sendGroupUpdate function:", error.message);
      }
    };

    let dataThread;
    try {
      const threadData = await getData(threadID);
      dataThread = threadData?.threadInfo;
      
      if (!dataThread) {
        logger.warn(`Thread data not found for ${threadID}`, "WARNING");
        return;
      }
    } catch (error) {
      logger.error(`Failed to get thread data for ${threadID}:`, error.message);
      return;
    }

    switch (logMessageType) {
      case "log:thread-admins": {
        try {
          if (logMessageData.ADMIN_EVENT === "add_admin") {
            // Check if admin already exists
            if (!dataThread.adminIDs?.some(admin => admin.id === logMessageData.TARGET_ID)) {
              dataThread.adminIDs.push({ id: logMessageData.TARGET_ID });
              
              try {
                const userName = await Users.getNameUser(logMessageData.TARGET_ID);
                await sendGroupUpdate(`👑 𝗡𝗘𝗪 𝗔𝗗𝗠𝗜𝗡\n\n➤ ${userName} has been promoted to admin`);
              } catch (userError) {
                logger.error(`Error getting user name for ${logMessageData.TARGET_ID}:`, userError.message);
                await sendGroupUpdate(`👑 𝗡𝗘𝗪 𝗔𝗗𝗠𝗜𝗡\n\n➤ User ID: ${logMessageData.TARGET_ID} has been promoted to admin`);
              }
            }
          } else if (logMessageData.ADMIN_EVENT === "remove_admin") {
            dataThread.adminIDs = dataThread.adminIDs.filter(item => item.id !== logMessageData.TARGET_ID);
            
            try {
              const userName = await Users.getNameUser(logMessageData.TARGET_ID);
              await sendGroupUpdate(`👤 𝗔𝗗𝗠𝗜𝗡 𝗥𝗘𝗠𝗢𝗩𝗘𝗗\n\n➤ ${userName} is no longer an admin`);
            } catch (userError) {
              logger.error(`Error getting user name for ${logMessageData.TARGET_ID}:`, userError.message);
              await sendGroupUpdate(`👤 𝗔𝗗𝗠𝗜𝗡 𝗥𝗘𝗠𝗢𝗩𝗘𝗗\n\n➤ User ID: ${logMessageData.TARGET_ID} is no longer an admin`);
            }
          }
        } catch (adminError) {
          logger.error(`Error handling admin event:`, adminError.message);
        }
        break;
      }
      
      case "log:user-nickname": {
        try {
          const { participant_id, nickname } = logMessageData;
          if (participant_id && typeof nickname !== "undefined") {
            dataThread.nicknames = dataThread.nicknames || {};
            dataThread.nicknames[participant_id] = nickname;
            
            try {
              const participantName = await Users.getNameUser(participant_id);
              const formattedNickname = nickname || "❌ removed";
              await sendGroupUpdate(`📝 𝗡𝗜𝗖𝗞𝗡𝗔𝗠𝗘 𝗨𝗣𝗗𝗔𝗧𝗘\n\n➤ User: ${participantName}\n➤ New nickname: ${formattedNickname}`);
            } catch (userError) {
              logger.error(`Error getting participant name for ${participant_id}:`, userError.message);
              await sendGroupUpdate(`📝 𝗡𝗜𝗖𝗞𝗡𝗔𝗠𝗘 𝗨𝗣𝗗𝗔𝗧𝗘\n\n➤ User ID: ${participant_id}\n➤ New nickname: ${nickname || "❌ removed"}`);
            }
          }
        } catch (nicknameError) {
          logger.error("Error handling nickname event:", nicknameError.message);
        }
        break;
      }
      
      case "log:thread-name": {
        try {
          dataThread.threadName = logMessageData?.name || null;
          const newName = dataThread.threadName ? `➤ New name: ${dataThread.threadName}` : '➤ Group name has been cleared';
          await sendGroupUpdate(`✏️ 𝗚𝗥𝗢𝗨𝗣 𝗡𝗔𝗠𝗘 𝗖𝗛𝗔𝗡𝗚𝗘𝗗\n\n${newName}`);
        } catch (nameError) {
          logger.error("Error handling thread name change:", nameError.message);
        }
        break;
      }
      
      case "log:thread-icon": {
        try {
          const preIcon = JSON.parse(fs.readFileSync(iconPath, 'utf8'));
          dataThread.threadIcon = logMessageData?.thread_icon || "👍";
          
          const config = global.configModule[this.config.name] || this.config.envConfig;
          if (config.sendNoti) {
            const update = `🎭 𝗚𝗥𝗢𝗨𝗣 𝗜𝗖𝗢𝗡 𝗖𝗛𝗔𝗡𝗚𝗘𝗗\n\n➤ New icon: ${dataThread.threadIcon}\n➤ Previous: ${preIcon[threadID] || "❓ unknown"}`;
            await sendGroupUpdate(update);
            preIcon[threadID] = dataThread.threadIcon;
            fs.writeFileSync(iconPath, JSON.stringify(preIcon, null, 2));
          }
        } catch (iconError) {
          logger.error("Error handling thread icon change:", iconError.message);
        }
        break;
      }
      
      case "log:thread-call": {
        try {
          if (logMessageData.event === "group_call_started") {
            try {
              const name = await Users.getNameUser(logMessageData.caller_id);
              await sendGroupUpdate(`📞 𝗚𝗥𝗢𝗨𝗣 𝗖𝗔𝗟𝗟 𝗦𝗧𝗔𝗥𝗧𝗘𝗗\n\n➤ Started by: ${name}\n➤ Type: ${(logMessageData.video) ? '📹 Video' : '🎤 Voice'} call`);
            } catch (userError) {
              logger.error(`Error getting caller name for ${logMessageData.caller_id}:`, userError.message);
              await sendGroupUpdate(`📞 𝗚𝗥𝗢𝗨𝗣 𝗖𝗔𝗟𝗟 𝗦𝗧𝗔𝗥𝗧𝗘𝗗\n\n➤ Caller ID: ${logMessageData.caller_id}\n➤ Type: ${(logMessageData.video) ? '📹 Video' : '🎤 Voice'} call`);
            }
          } else if (logMessageData.event === "group_call_ended") {
            const callDuration = logMessageData.call_duration || 0;
            const hours = Math.floor(callDuration / 3600).toString().padStart(2, '0');
            const minutes = Math.floor((callDuration % 3600) / 60).toString().padStart(2, '0');
            const seconds = (callDuration % 60).toString().padStart(2, '0');
            const timeFormat = `${hours}:${minutes}:${seconds}`;
            await sendGroupUpdate(`📞 𝗚𝗥𝗢𝗨𝗣 𝗖𝗔𝗟𝗟 𝗘𝗡𝗗𝗘𝗗\n\n➤ Type: ${(logMessageData.video) ? '📹 Video' : '🎤 Voice'} call\n➤ Duration: ${timeFormat}`);
          } else if (logMessageData.joining_user) {
            try {
              const name = await Users.getNameUser(logMessageData.joining_user);
              await sendGroupUpdate(`📞 𝗖𝗔𝗟𝗟 𝗝𝗢𝗜𝗡𝗘𝗗\n\n➤ ${name} joined the ${(logMessageData.group_call_type == '1') ? '📹 video' : '🎤 voice'} call`);
            } catch (userError) {
              logger.error(`Error getting joining user name for ${logMessageData.joining_user}:`, userError.message);
              await sendGroupUpdate(`📞 𝗖𝗔𝗟𝗟 𝗝𝗢𝗜𝗡𝗘𝗗\n\n➤ User ID: ${logMessageData.joining_user} joined the call`);
            }
          }
        } catch (callError) {
          logger.error("Error handling thread call event:", callError.message);
        }
        break;
      }
      
      case "log:link-status": {
        try {
          const status = (logMessageBody || "").includes("disabled") ? "❌ 𝗗𝗜𝗦𝗔𝗕𝗟𝗘𝗗" : "✅ 𝗘𝗡𝗔𝗕𝗟𝗘𝗗";
          await sendGroupUpdate(`🔗 𝗚𝗥𝗢𝗨𝗣 𝗟𝗜𝗡𝗞 𝗦𝗧𝗔𝗧𝗨𝗦\n\n➤ Status: ${status}`);
        } catch (linkError) {
          logger.error("Error handling link status event:", linkError.message);
        }
        break;
      }
      
      case "log:magic-words": {
        try {
          await sendGroupUpdate(
            `✨ 𝗠𝗔𝗚𝗜𝗖 𝗪𝗢𝗥𝗗𝗦 𝗨𝗣𝗗𝗔𝗧𝗘\n\n` +
            `➤ Theme: ${logMessageData.theme_name || "Unknown"}\n` +
            `➤ Word: ${logMessageData.magic_word || "Unknown"}\n` +
            `➤ Emoji: ${logMessageData.emoji_effect || "❌ None"}\n` +
            `➤ Total effects: ${logMessageData.new_magic_word_count || 0}`
          );
        } catch (magicError) {
          logger.error("Error handling magic words event:", magicError.message);
        }
        break;
      }
      
      case "log:thread-poll": {
        try {
          if (logMessageData.event_type === "question_creation" || logMessageData.event_type === "update_vote") {
            let poll = null;
            try {
              poll = JSON.parse(logMessageData.question_json);
            } catch (parseError) {
              logger.error("Error parsing poll JSON:", parseError.message);
            }
            
            await sendGroupUpdate(
              `📊 𝗚𝗥𝗢𝗨𝗣 𝗣𝗢𝗟𝗟 𝗨𝗣𝗗𝗔𝗧𝗘\n\n` +
              `➤ Event: ${logMessageData.event_type === "question_creation" ? "New poll created" : "Vote updated"}\n` +
              `➤ Question: ${poll?.text || "No question"}`
            );
          }
        } catch (pollError) {
          logger.error("Error handling thread poll event:", pollError.message);
        }
        break;
      }
      
      case "log:thread-approval-mode": {
        try {
          const mode = (logMessageBody || "").includes("enabled") ? "✅ Enabled" : "❌ Disabled";
          await sendGroupUpdate(`👥 𝗚𝗥𝗢𝗨𝗣 𝗔𝗣𝗣𝗥𝗢𝗩𝗔𝗟 𝗠𝗢𝗗𝗘\n\n➤ Status: ${mode}`);
        } catch (approvalError) {
          logger.error("Error handling thread approval mode event:", approvalError.message);
        }
        break;
      }
      
      case "log:thread-color": {
        try {
          dataThread.threadColor = logMessageData?.thread_color || "🌤";
          
          const config = global.configModule[this.config.name] || this.config.envConfig;
          if (config.sendNoti) {
            await sendGroupUpdate(`🎨 𝗚𝗥𝗢𝗨𝗣 𝗖𝗢𝗟𝗢𝗥 𝗨𝗣𝗗𝗔𝗧𝗘\n\n➤ New color theme: ${dataThread.threadColor}`);
          }
        } catch (colorError) {
          logger.error("Error handling thread color event:", colorError.message);
        }
        break;
      }
      
      default:
        logger.debug(`Unhandled event type: ${logMessageType}`, "DEBUG");
        break;
    }

    // Save updated thread data
    try {
      await setData(threadID, { threadInfo: dataThread });
    } catch (saveError) {
      logger.error(`Failed to save thread data for ${threadID}:`, saveError.message);
    }
    
  } catch (error) {
    logger.error('Critical error in adminNoti event:', error.message);
    logger.error('Full error details:', error.stack);
  }
};
