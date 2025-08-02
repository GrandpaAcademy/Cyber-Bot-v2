module.exports.config = {
  name: "avatar",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "GrandpaEJ",
  description: "Get profile picture of yourself or mentioned users",
  usePrefix: true,
  commandCategory: "utility",
  usages: "avatar [@mention] or reply to a message",
  cooldowns: 5,
  aliases: ["pp", "avater", "dp"]
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID, mentions } = event;
  
  try {
    let targetUsers = [];
    
    // If replying to a message
    if (event.messageReply) {
      const repliedUserID = event.messageReply.senderID;
      targetUsers.push(repliedUserID);
    }
    // If mentioning users
    else if (Object.keys(mentions).length > 0) {
      targetUsers = Object.keys(mentions);
    }
    // If no mentions or reply, use sender
    else {
      targetUsers.push(senderID);
    }

    // Limit to 5 users to avoid spam
    if (targetUsers.length > 5) {
      return api.sendMessage("❌ Please mention 5 or fewer users at a time.", threadID, messageID);
    }

    let attachments = [];
    let messageText = "📸 PROFILE PICTURES\n";
    messageText += "━━━━━━━━━━━━━━━━━━━━━━━\n";

    for (let i = 0; i < targetUsers.length; i++) {
      const userID = targetUsers[i];
      
      try {
        // Get user info
        const userInfo = await api.getUserInfo(userID);
        const userName = userInfo[userID].name;
        
        // Get profile picture URL
        const avatarUrl = `https://graph.facebook.com/${userID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
        
        messageText += `👤 ${userName} (${userID})\n`;
        
        // Download and attach the image
        const axios = require('axios');
        const fs = require('fs');
        const path = require('path');
        
        const response = await axios({
          method: 'GET',
          url: avatarUrl,
          responseType: 'stream'
        });
        
        const imagePath = path.join(__dirname, 'cache', `avatar_${userID}_${Date.now()}.jpg`);
        
        // Ensure cache directory exists
        const cacheDir = path.join(__dirname, 'cache');
        if (!fs.existsSync(cacheDir)) {
          fs.mkdirSync(cacheDir, { recursive: true });
        }
        
        const writer = fs.createWriteStream(imagePath);
        response.data.pipe(writer);
        
        await new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
        });
        
        attachments.push(fs.createReadStream(imagePath));
        
        // Clean up file after a delay
        setTimeout(() => {
          try {
            if (fs.existsSync(imagePath)) {
              fs.unlinkSync(imagePath);
            }
          } catch (err) {
            console.error("Error cleaning up avatar file:", err);
          }
        }, 10000);
        
      } catch (error) {
        console.error(`Error getting avatar for user ${userID}:`, error);
        messageText += `👤 User ${userID}\n`;
        messageText += `⚠️ Could not fetch profile picture\n`;
      }
      
      if (i < targetUsers.length - 1) {
        messageText += "━━━━━━━━━━━━━━━━━━━━━━━\n";
      }
    }

    // Add usage instructions if no specific target
    if (targetUsers.length === 1 && targetUsers[0] === senderID) {
      messageText += "\n💡 Tip: You can also:\n";
      messageText += "• Reply to someone's message and use this command\n";
      messageText += "• Mention users: avatar @user1 @user2\n";
    }

    const messageData = {
      body: messageText,
      attachment: attachments
    };

    return api.sendMessage(messageData, threadID, messageID);

  } catch (error) {
    console.error("Error in avatar command:", error);
    return api.sendMessage("❌ An error occurred while fetching profile pictures. Please try again later.", threadID, messageID);
  }
};
