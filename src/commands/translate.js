const axios = require('axios');
const config = require('../../config.json');

module.exports.config = {
  name: "translate",
  version: "1.0.0",
  hasPermission: 0,
  usePrefix: true,
  credits: "GrandpaEJ",
  description: "Translate text to any language",
  commandCategory: "utility",
  usages: [
    "translate <text> -<language code>",
    "translate -<language code> <text>",
    "Reply to a message: translate -<language code>"
  ],
  cooldowns: 5,
  aliases: ["trans", "dub"]
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, messageReply } = event;
  
  try {
    let langCode = config.translation?.defaultLang || "en"; // Get default language from config
    let textToTranslate = "";
    
    // Handle language code and text extraction
    if (args.length === 0 && !messageReply) {
      return api.sendMessage(
        "❌ Please provide text to translate or reply to a message!\n\n" +
        "Usage:\n" +
        "1. translate <text> -<language code>\n" +
        "2. translate -<language code> <text>\n" +
        "3. Reply to message: translate -<language code>\n\n" +
        "Example:\n" +
        "translate hello world -bn\n" +
        "translate -hi how are you\n" +
        "Reply + translate -ja",
        threadID, messageID
      );
    }

    // Check if replying to a message
    if (messageReply) {
      textToTranslate = messageReply.body;
      // Get language code from args if provided
      if (args[0] && args[0].startsWith('-')) {
        langCode = args[0].slice(1);
      }
    } else {
      // Check if first argument is language code
      if (args[0].startsWith('-')) {
        langCode = args[0].slice(1);
        textToTranslate = args.slice(1).join(" ");
      } else {
        // Check if last argument is language code
        const lastArg = args[args.length - 1];
        if (lastArg.startsWith('-')) {
          langCode = lastArg.slice(1);
          textToTranslate = args.slice(0, -1).join(" ");
        } else {
          textToTranslate = args.join(" ");
        }
      }
    }

    // Validate we have text to translate
    if (!textToTranslate) {
      return api.sendMessage("❌ Please provide text to translate!", threadID, messageID);
    }

    // Perform translation using API from config
    const encodedText = encodeURIComponent(textToTranslate);
    const apiURL = config.translation?.apiURL || "http://localhost:8080/api/translate";
    const response = await axios.get(`${apiURL}?text=${encodedText}&lang=${langCode}`);
    
    // Extract just the translated text from response
    const translatedText = typeof response.data === 'string' 
      ? response.data 
      : response.data.translated_text 
        ? response.data.translated_text
        : response.data.translation 
          ? response.data.translation 
          : response.data.text 
            ? response.data.text 
            : JSON.stringify(response.data);

    // For reply messages, send as reply to the original message
    if (messageReply) {
      try {
        return api.sendMessage({
          body: translatedText,
          mentions: messageReply.mentions,
          attachment: messageReply.attachments,
          callback: messageReply.callback,
          attachment_info: messageReply.attachment_info,
          reply: {
            messageID: messageReply.messageID,
            senderID: messageReply.senderID,
            body: messageReply.body
          }
        }, threadID, null, messageID);
      } catch (replyError) {
        console.error("Reply error:", replyError);
        // Fallback to sending without reply if reply fails
        return api.sendMessage(translatedText, threadID, messageID);
      }
    }

    // For direct messages, just send the translation
    return api.sendMessage(translatedText, threadID, messageID);

  } catch (error) {
    console.error("Translation error:", error);
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      return api.sendMessage(
        "❌ Translation server error: " + (error.response.data.error || "Unknown error"),
        threadID, messageID
      );
    } else if (error.request) {
      // The request was made but no response was received
      return api.sendMessage(
        "❌ Cannot connect to translation server. Please make sure it's running.",
        threadID, messageID
      );
    } else {
      // Something happened in setting up the request
      return api.sendMessage(
        "❌ An error occurred while translating.\n" +
        "Please check your language code and try again.",
        threadID, messageID
      );
    }
  }
};
