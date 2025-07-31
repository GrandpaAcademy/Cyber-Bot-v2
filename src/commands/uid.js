const axios = require("axios");
const cheerio = require("cheerio");


module.exports.config = {
  name: "uid",
  version: "2.0.0",
  hasPermission: 0,
  credits: "Cyber CAT",
  description: "Get the user's Facebook UID.",
  usePrefix: true,
  commandCategory: "other",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
  // If there are mentions, list their UIDs
  if (event.mentions && Object.keys(event.mentions).length > 0) {
    for (const mentionID in event.mentions) {
      const mentionName = event.mentions[mentionID];
      await api.sendMessage(`${mentionName.replace('@', '')}: ${mentionID}`, event.threadID);
    }
    return;
  }

  // If replying to a message, show sender's UID
  if (event.messageReply) {
    const senderID = event.messageReply.senderID;
    await api.sendMessage(`Reply sender UID: ${senderID}`, event.threadID, event.messageID);
    return;
  }

  // If no args or reply, show own UID
  if (!args[0]) {
    await api.sendMessage(`Your UID: ${event.senderID}`, event.threadID, event.messageID);
    return;
  }

  // If a URL is provided, try to fetch UID from Facebook profile
  const url = args[0] || event.messageReply?.attachments?.[0]?.url;
  if (!url) {
    await api.sendMessage(
      "Please provide a Facebook profile URL or reply to a message with an attachment containing the URL.",
      event.threadID,
      event.messageID
    );
    return;
  }

  const userID = await getUserIDFromURL(url);
  if (userID) {
    await api.sendMessage(`User ID: ${userID}`, event.threadID, event.messageID);
  } else {
    await api.sendMessage("Could not retrieve user ID. Please check the URL and try again.", event.threadID, event.messageID);
  }
};

function getUserIDFromURL(url) { // https://www.facebook.com/GrandpaEJ get req to url ar parse html to get uid
  if (!url) return null;
  // "userID":"61575900132985"}," from html
  return axios.get(url)
    .then(response => {
      const $ = cheerio.load(response.data);
      const userID = $('script').html().match(/"userID":"(\d+)"/);
      return userID ? userID[1] : null;
    })
    .catch(error => {
      console.error('Error fetching user ID:', error);
      return null;
    });
}