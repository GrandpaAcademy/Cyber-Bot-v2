const { GoogleGenerativeAI } = require("@google/generative-ai");
const config = require("../../config.json");

// Configure API key
const API_KEY = config.GOOGLE_API_KEY || process.env.GOOGLE_API_KEY;
if (!API_KEY) {
  console.error("Google API key not found in config.json or environment variables");
  module.exports = null;
  return;
}

const genAI = new GoogleGenerativeAI(API_KEY);

// Model for general chat
const CHAT_MODEL_NAME = "gemini-2.5-flash-lite";

// System prompt for general chat
const CHAT_PROMPT = `
You are Bela AI, a helpful and friendly AI assistant. Respond naturally and engagingly to user messages.
Keep responses concise but informative. Be polite and helpful.
`;

// Initialize the chat model
let chatModel;
try {
  chatModel = genAI.getGenerativeModel({
    model: CHAT_MODEL_NAME,
    systemInstruction: CHAT_PROMPT
  });
} catch (e) {
  console.error("Error initializing chat model:", e);
  module.exports = null;
  return;
}

module.exports = function ({ api, models, Users, Threads, Currencies, ...rest }) {
  return async function ({ event, ...rest2 }) {
    const { body, senderID, threadID, messageID } = event;

    if (!body || typeof body !== "string" || body.trim() === "") {
      return;
    }

    try {
      // Generate AI response
      const result = await chatModel.generateContent(body.trim());
      const response = result.response;
      const aiResponse = response.text().trim();

      // Send the AI response
      api.sendMessage(`🤖 ${aiResponse}`, threadID, messageID);
    } catch (e) {
      console.error("Error generating AI response:", e);
      api.sendMessage("Sorry, I couldn't process that right now.", threadID, messageID);
    }
  };
};