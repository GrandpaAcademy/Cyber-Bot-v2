module.exports.config = {
  name: "info",
  version: "2.0.0",
  hasPermission: 0,
  credits: "Grandpa EJ",
  description: "Get user information with modern async patterns",
  usePrefix: true,
  commandCategory: "utility",
  usages: "[@mention or reply]",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
  const { senderID, threadID, messageID, messageReply, mentions } = event;

  let targetID = senderID; // Default to sender

  if (messageReply) {
    targetID = messageReply.senderID;
  } else if (Object.keys(mentions).length > 0) {
    targetID = Object.keys(mentions)[0]; // First mentioned
  }

  try {
    const userInfo = await api.getUserInfo(targetID);
    const user = userInfo[targetID];

    if (!user) {
      return await api.sendMessage("❌ User not found.", threadID, null, false);
    }

    const name = user.name || "Unknown";
    const uid = user.id || targetID;
    const bio = user.bio || "No bio available";

    // Get profile picture with improved error handling
    const dpUrl = `https://graph.facebook.com/${uid}/picture?height=720&width=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
    const fs = require('fs');
    const path = require('path');
    const https = require('https');
    const tempDir = path.join(__dirname, '../../cache/temp');
    
    // Ensure temp directory exists
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const tempFile = path.join(tempDir, `dp_${uid}_${Date.now()}.jpg`);

    // Download profile picture
    const downloadProfilePicture = () => {
      return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(tempFile);
        
        https.get(dpUrl, (res) => {
          if (res.statusCode !== 200) {
            file.close();
            fs.unlinkSync(tempFile);
            resolve(null); // Return null if no valid image
            return;
          }
          
          res.pipe(file);
          file.on('finish', () => {
            file.close();
            resolve(tempFile);
          });
        }).on('error', (err) => {
          console.error("Error downloading DP:", err);
          file.close();
          if (fs.existsSync(tempFile)) {
            fs.unlinkSync(tempFile);
          }
          resolve(null); // Return null on error
        });
      });
    };

    const picturePath = await downloadProfilePicture();

    // Clean up old temp files (keep only recent ones)
    try {
      const files = fs.readdirSync(tempDir);
      const currentTime = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      
      files.forEach(file => {
        const filePath = path.join(tempDir, file);
        const stats = fs.statSync(filePath);
        if (currentTime - stats.mtime.getTime() > maxAge) {
          fs.unlinkSync(filePath);
        }
      });
    } catch (cleanupError) {
      console.error("Error cleaning up temp files:", cleanupError);
    }

    // Create message with or without picture
    const createMessage = () => {
      const messageParts = [
        `👤 **Name:** ${name}`,
        `🆔 **UID:** ${uid}`,
        `📝 **Bio:** ${bio}`
      ];

      if (picturePath && fs.existsSync(picturePath)) {
        messageParts.push("📷 **Profile Picture:**");
        return {
          body: messageParts.join('\n'),
          attachment: [fs.createReadStream(picturePath)]
        };
      } else {
        messageParts.push("📷 **Profile Picture:** Not available");
        return {
          body: messageParts.join('\n')
        };
      }
    };

    const message = createMessage();
    
    // Send message and handle cleanup
    try {
      await api.sendMessage(message, threadID, null, false);
      
      // Clean up file after sending with delay
      setTimeout(() => {
        try {
          if (picturePath && fs.existsSync(picturePath)) {
            fs.unlink(picturePath, (err) => {
              if (err && !err.code?.includes('ENOENT')) {
                console.error("Error deleting temp file:", err);
              }
            });
          }
        } catch (cleanupError) {
          console.error("Error during file cleanup:", cleanupError);
        }
      }, 10000); // Increased delay to 10 seconds
    } catch (sendError) {
      console.error("Error sending info message:", sendError);
      // Still clean up the file even if sending failed
      if (picturePath && fs.existsSync(picturePath)) {
        try {
          fs.unlinkSync(picturePath);
        } catch (cleanupError) {
          console.error("Error cleaning up file:", cleanupError);
        }
      }
    }

  } catch (error) {
    console.error("Error in info command:", error);
    const errorMessage = `❌ **Error retrieving user information**

**Details:** ${error.message || "Unknown error occurred"}
**Target ID:** ${targetID}

Please try again or contact an administrator if the issue persists.`;

    await api.sendMessage(errorMessage, threadID, null, false);
  }
};