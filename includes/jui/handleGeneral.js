const config = require("../../config.json");

module.exports = function ({ api, models, Users, Threads, Currencies, ...rest }) {
  return async function ({ event, ...rest2 }) {
    const { body, senderID, threadID, messageID, messageReply, mentions } = event;

    if (!body || typeof body !== "string" || body.trim() === "") {
      return;
    }

    // Check if the message is directed to the bot
    const botID = api.getCurrentUserID();
    const isReplyToBot = messageReply && messageReply.senderID === botID;
    const isMentioned = mentions && Object.keys(mentions).includes(botID);

    if (!isReplyToBot && !isMentioned) {
      // Not directed to bot, ignore
      return;
    }

    const axios = require('axios');
    try {
      const response = await axios.post(`${config.BELAAI_API_URL}/bela/chat`, {
        message: body.trim(),
        userID: senderID
      });

      const aiResponse = response.data.response;

      // Send the AI response
      api.sendMessage(`🤖 ${aiResponse}`, threadID, messageID);
    } catch (e) {
      console.error("Error calling chat API:", e);
      api.sendMessage("Sorry, I couldn't process that right now.", threadID, messageID);
    }
  };
};