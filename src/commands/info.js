module.exports.config = {
  name: "info",
  version: "1.0.0",
  hasPermission: 0,
  credits: "Grandpa EJ",
  description: "Show user information",
  usePrefix: true,
  commandCategory: "utility",
  usages: "[own/@mention/reply]",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
  let userID;

  if (event.messageReply) {
    userID = event.messageReply.senderID;
  } else if (Object.keys(event.mentions).length > 0) {
    userID = Object.keys(event.mentions)[0];
  } else if (args[0] && args[0].toLowerCase() === "own") {
    userID = event.senderID;
  } else if (args[0]) {
    // Assume it's a user ID
    userID = args[0];
  } else {
    userID = event.senderID;
  }

  try {
    const userInfo = await api.getUserInfo(userID);
    const user = userInfo[userID];

    if (!user) {
      return api.sendMessage("Unable to get user information.", event.threadID, event.messageID);
    }

    const genderText = user.gender === 1 ? "Female" : user.gender === 2 ? "Male" : "Unknown";
    const isFriendText = user.isFriend ? "Yes" : "No";

    const dpUrl = `https://graph.facebook.com/${userID}/picture?height=720&width=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

    const infoMessage = `╭━━━━━━━━━━━━━━━━━━━━╮
┃   👤 USER INFO   ┃
╰━━━━━━━━━━━━━━━━━━━━╯

👤 Name: ${user.name}
🔗 Profile: ${user.profileUrl || "N/A"}
🎂 Birthday: ${user.isBirthday ? "Today!" : "Not today"}
👫 Gender: ${genderText}
🤝 Friend: ${isFriendText}
🆔 ID: ${userID}

╰━━━━━━━━━━━━━━━━━━━━╯`;

    const axios = require("axios");
    const response = await axios.get(dpUrl, { responseType: 'stream' });

    api.sendMessage({
      body: infoMessage,
      attachment: response.data
    }, event.threadID, event.messageID);
  } catch (error) {
    console.error(error);
    api.sendMessage("An error occurred while fetching user information.", event.threadID, event.messageID);
  }
};