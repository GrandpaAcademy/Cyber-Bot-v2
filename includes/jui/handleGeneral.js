const OpenAI = require("openai");
const fs = require("fs");
const path = require("path");
const config = require("../../config.json");

// Configure OpenAI client for llm7.io
const client = new OpenAI({
  baseURL: "https://api.llm7.io/v1",
  apiKey: config.OPENAI_API_KEY || "unused"
});

const MODEL = "gpt-5-mini";

// System prompt for general chat
const SYSTEM_PROMPT = `
You are Bela AI, a helpful and friendly AI assistant. Respond naturally and engagingly to user messages.
Keep responses concise: reply in 1 sentence unless the user specifically requests detailed or multi-line explanations.
Be polite and helpful.
`;

// Cache directory
const CACHE_DIR = path.join(__dirname, "../../cache");
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

// Function to get session file path
function getSessionPath(userID) {
  return path.join(CACHE_DIR, `session_${userID}.json`);
}

// Function to load session history
function loadSession(userID) {
  const filePath = getSessionPath(userID);
  if (fs.existsSync(filePath)) {
    try {
      const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
      return data.history || [];
    } catch (e) {
      console.error("Error loading session:", e);
      return [];
    }
  }
  return [];
}

// Function to save session history (keep last 20 messages)
function saveSession(userID, history) {
  const filePath = getSessionPath(userID);
  const compressedHistory = history.slice(-20); // Keep last 20
  try {
    fs.writeFileSync(filePath, JSON.stringify({ history: compressedHistory }, null, 2));
  } catch (e) {
    console.error("Error saving session:", e);
  }
}

module.exports = function ({ api, models, Users, Threads, Currencies, ...rest }) {
  return async function ({ event, ...rest2 }) {
    const { body, senderID, threadID, messageID } = event;

    if (!body || typeof body !== "string" || body.trim() === "") {
      return;
    }

    try {
      // Load session history
      let history = loadSession(senderID);

      // Add user message to history
      history.push({ role: "user", content: body.trim() });

      // Prepare messages for API
      const messages = [
        { role: "system", content: SYSTEM_PROMPT },
        ...history
      ];

      // Generate AI response
      const completion = await client.chat.completions.create({
        model: MODEL,
        messages: messages,
        max_tokens: 150, // Limit response length
        temperature: 0.7
      });

      const aiResponse = completion.choices[0].message.content.trim();

      // Add AI response to history
      history.push({ role: "assistant", content: aiResponse });

      // Save session
      saveSession(senderID, history);

      // Send the AI response
      api.sendMessage(`🤖 ${aiResponse}`, threadID, messageID);
    } catch (e) {
      console.error("Error generating AI response:", e);
      api.sendMessage("Sorry, I couldn't process that right now.", threadID, messageID);
    }
  };
};