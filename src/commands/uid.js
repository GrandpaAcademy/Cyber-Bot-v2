const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "uid",
  version: "2.0.1",
  hasPermission: 0,
  credits: "GrandpaEJ",
  description: "Get the user's Facebook UID.",
  usePrefix: true,
  commandCategory: "other",
  cooldowns: 5
};

function getFacebookCookies() {
  try {
    const appStatePath = path.join(process.cwd(), 'appstate.json');
    if (fs.existsSync(appStatePath)) {
      const appState = JSON.parse(fs.readFileSync(appStatePath, 'utf8'));
      return appState.map(cookie => `${cookie.key}=${cookie.value}`).join('; ');
    }
    return null;
  } catch (error) {
    console.log('Error reading cookies:', error.message);
    return null;
  }
}

async function getUserIDFromURL(url) {
  if (!url) return null;
  
  try {
    let username = url;
    
    // Extract username from Facebook URL
    if (url.includes('facebook.com/')) {
      const urlMatch = url.match(/facebook\.com\/([^/?&]+)/);
      if (urlMatch) {
        username = urlMatch[1];
      }
    }

    // Remove common prefixes
    username = username.replace(/^(profile\.php\?id=|people\/|pg\/|pages\/)/, '');
    
    // If it's already a numeric UID, return it
    if (/^\d{15,}$/.test(username)) {
      return username;
    }

    // Get Facebook cookies - MUST HAVE for authenticated requests
    const cookies = getFacebookCookies();
    
    if (!cookies) {
      console.log('No Facebook cookies found - access will be limited');
      return '__NO_COOKIES__';
    }

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Cache-Control': 'max-age=0',
      'Cookie': cookies
    };

    // Method 1: Try main Facebook with full cookies
    try {
      console.log(`Trying to fetch: https://www.facebook.com/${username}`);
      
      const response = await axios.get(`https://www.facebook.com/${username}`, {
        headers: headers,
        timeout: 20000,
        maxRedirects: 10,
        validateStatus: function (status) {
          return status < 500;
        }
      });

      if (response.status === 200) {
        const html = response.data;
        
        // Enhanced regex patterns for UID extraction
        const patterns = [
          /"variables":\s*{[^}]*"userID":\s*"(\d+)"/,
          /"selectedID":\s*"(\d+)"/,
          /"entity_id":\s*"(\d+)"/,
          /"profile_id":\s*"?(\d+)"?/,
          /"userID":\s*"(\d+)"/,
          /"userID":\s*(\d+)/,
          /"actor_id":\s*"(\d+)"/,
          /"USER_ID":\s*"(\d+)"/,
          /"profileID":\s*"(\d+)"/,
          /profile_id=(\d+)/,
          /entity_id=(\d+)/,
          /"ownerID":\s*"(\d+)"/,
          /"pageID":\s*"(\d+)"/
        ];

        for (const pattern of patterns) {
          const match = html.match(pattern);
          if (match && match[1]) {
            console.log(`Found UID using pattern: ${pattern}`);
            return match[1];
          }
        }

        const $ = cheerio.load(html);
        let foundUID = null;
        
        $('script').each((i, elem) => {
          const scriptContent = $(elem).html();
          if (scriptContent) {
            const patterns = [
              /"userID":"(\d+)"/,
              /"selectedID":"(\d+)"/,
              /"entity_id":"(\d+)"/,
              /"profile_id":"(\d+)"/,
              /"actor_id":"(\d+)"/
            ];
            
            for (const pattern of patterns) {
              const match = scriptContent.match(pattern);
              if (match && match[1]) {
                foundUID = match[1];
                return false;
              }
            }
          }
        });
        
        if (foundUID) {
          console.log(`Found UID in script tags: ${foundUID}`);
          return foundUID;
        }
      }

    } catch (e) {
      console.log('Main Facebook request failed:', e.message);
    }

    // Method 2: Try mobile Facebook
    try {
      console.log(`Trying mobile: https://m.facebook.com/${username}`);
      
      const mobileResponse = await axios.get(`https://m.facebook.com/${username}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cookie': cookies
        },
        timeout: 15000,
        maxRedirects: 10
      });

      if (mobileResponse.status === 200) {
        const html = mobileResponse.data;
        
        const mobilePatterns = [
          /profile\.php\?id=(\d+)/,
          /"userID":"(\d+)"/,
          /"entity_id":"(\d+)"/,
          /user_id=(\d+)/,
          /owner_id=(\d+)/
        ];

        for (const pattern of mobilePatterns) {
          const match = html.match(pattern);
          if (match && match[1]) {
            console.log(`Found UID in mobile: ${match[1]}`);
            return match[1];
          }
        }

        const $ = cheerio.load(html);
        const profileLink = $('a[href*="profile.php?id="]').first().attr('href');
        if (profileLink) {
          const uidMatch = profileLink.match(/id=(\d+)/);
          if (uidMatch) {
            console.log(`Found UID in profile link: ${uidMatch[1]}`);
            return uidMatch[1];
          }
        }
      }

    } catch (e) {
      console.log('Mobile Facebook failed:', e.message);
    }

    // Method 3: Try mbasic Facebook
    try {
      console.log(`Trying mbasic: https://mbasic.facebook.com/${username}`);
      
      const mbasicResponse = await axios.get(`https://mbasic.facebook.com/${username}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Mobile; rv:40.0) Gecko/40.0 Firefox/40.0',
          'Cookie': cookies
        },
        timeout: 10000
      });
      
      if (mbasicResponse.status === 200) {
        const html = mbasicResponse.data;
        const uidMatch = html.match(/profile\.php\?id=(\d+)/);
        if (uidMatch) {
          console.log(`Found UID in mbasic: ${uidMatch[1]}`);
          return uidMatch[1];
        }
      }

    } catch (e) {
      console.log('mbasic Facebook failed:', e.message);
    }

    console.log('All methods failed to extract UID');
    return null;

  } catch (error) {
    console.error('Error fetching user ID:', error.message);
    return null;
  }
}

module.exports.run = async function ({ api, event, args }) {
  try {
    // If there are mentions, list their UIDs
    if (event.mentions && Object.keys(event.mentions).length > 0) {
      let mentionList = "📋 Mentioned Users UIDs:\n\n";
      for (const mentionID in event.mentions) {
        const mentionName = event.mentions[mentionID];
        mentionList += `👤 ${mentionName.replace('@', '')}: ${mentionID}\n`;
      }
      await api.sendMessage(mentionList, event.threadID, event.messageID);
      return;
    }

    // If replying to a message, show sender's UID
    if (event.messageReply) {
      const senderID = event.messageReply.senderID;
      await api.sendMessage(`📨 Reply sender UID: ${senderID}`, event.threadID, event.messageID);
      return;
    }

    // If no args, show own UID
    if (args.length === 0) {
      await api.sendMessage(`🆔 Your UID: ${event.senderID}`, event.threadID, event.messageID);
      return;
    }

    // If args provided, try to fetch UID from Facebook profile
    const input = args.join(" ");
    
    try {
      // Send initial progress message
      const progressMsg = await api.sendMessage("🔍 Starting UID search...", event.threadID, event.messageID);
      const progressMsgId = progressMsg.messageID;
      
      // Update progress as we go
      await api.sendMessage("🔄 Checking Facebook profile...", event.threadID, progressMsgId);
      
      // Attempt to get the UID with progress updates
      const userID = await getUserIDFromURL(input);
      
      if (userID && userID !== '__NO_COOKIES__') {
        let username = input;
        if (input.includes('facebook.com/')) {
          const urlMatch = input.match(/facebook\.com\/([^/?&]+)/);
          if (urlMatch) {
            username = urlMatch[1];
          }
        }
        await api.sendMessage(
          `✅ UID Found!\n\n` +
          `👤 Username/URL: ${username}\n` +
          `🆔 UID: ${userID}\n` +
          `🔗 Profile: https://facebook.com/${userID}`,
          event.threadID,
          progressMsgId
        );
      } else if (userID === '__NO_COOKIES__') {
        await api.sendMessage(
          `❌ Could not retrieve UID.\n\n` +
          `⚠️ Facebook cookies are missing or invalid.\n` +
          `Please make sure your appstate.json is present and up to date.`,
          event.threadID,
          progressMsgId
        );
      } else {
        await api.sendMessage(
          `❌ Could not retrieve UID.\n\n` +
          `📝 Input: ${input}\n` +
          `💡 Make sure:\n` +
          `1. The profile URL/username is correct\n` +
          `2. The profile is publicly accessible\n` +
          `3. Your Facebook cookies are valid`,
          event.threadID,
          progressMsgId
        );
      }
    } catch (searchError) {
      console.error('Error during UID search:', searchError);
      await api.sendMessage(
        `❌ An error occurred while searching.\n\n` +
        `Error: ${searchError.message}\n` +
        `Please try again later.`,
        event.threadID,
        event.messageID
      );
    }
  } catch (error) {
    console.error('UID command error:', error);
    await api.sendMessage(
      `❌ An error occurred while processing your request.\n\n` +
      `Error: ${error.message}`,
      event.threadID,
      event.messageID
    );
  }
};
