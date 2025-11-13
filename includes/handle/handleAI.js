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

// Model Configuration for Classification
const CLASSIFICATION_MODELS = ["gemini-2.5-flash-lite", "gemma-3-27b-it", "gemini-2.5-flash", "gemini-2.0-flash-lite", "gemini-2.0-flash"];

// System prompt for classification
const CLASSIFICATION_PROMPT = `
You are a classifier that categorizes user input into two types:

1. "command" - When user input is a specific request for actions like:
   - Getting time ("time now", "what time is it")
   - Requesting images ("show me anime", "get waifu pics")
   - Weather requests ("weather in Dhaka", "temperature")
   - Jokes ("tell me a joke", "make me laugh")
   - Searches ("search for cats", "find information about...")
   - Bot commands ("help", "ping", "info", "unsend", etc.)
   - Moderation actions ("ban @user", "kick someone", "warn user", "remove member")
   - Requests to perform actions on users, even in other languages (e.g., "ban kor" in Bengali means "do ban")

2. "general" - When user input is normal conversation like:
   - Greetings ("hello", "hi", "good morning")
   - Questions about AI ("what are you", "how do you work")
   - Casual chat ("how are you", "what's up")
   - Explanations ("explain quantum physics", "tell me about dogs")
   - Opinions ("what do you think about AI")

Respond with ONLY a JSON object: {"type":"command","input":"user input"} or {"type":"general","input":"user input"}.
`;

// Initialize classification models
let classifierModels = [];
try {
  for (const modelName of CLASSIFICATION_MODELS) {
    classifierModels.push({
      name: modelName,
      model: genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: CLASSIFICATION_PROMPT
      })
    });
  }
} catch (e) {
  console.error("Error initializing classification models:", e);
  module.exports = null;
  return;
}

async function classifyInput(userInput) {
  for (const { name, model } of classifierModels) {
    try {
      console.log(`Trying classification model: ${name}`);
      const result = await model.generateContent(userInput);
      const response = result.response;
      const text = response.text().trim();

      // Parse JSON response
      const classification = JSON.parse(text);

      if (classification.type === "command" || classification.type === "general") {
        return classification;
      } else {
        return { type: "general", input: userInput }; // fallback
      }
    } catch (e) {
      console.error(`Error with model ${name}:`, e.message);
      if (e.message.includes('429') || e.message.includes('quota') || e.message.includes('rate limit')) {
        console.log(`Rate limit or quota exceeded for ${name}, trying next model...`);
        continue;
      } else {
        // For other errors, try next model
        continue;
      }
    }
  }
  // If all models fail, fallback
  console.error("All classification models failed, using fallback.");
  return { type: "general", input: userInput };
}

module.exports = function ({ api, models, Users, Threads, Currencies, ...rest }) {
  const handleCommand = require("./handleCommand")({ api, models, Users, Threads, Currencies, ...rest });
  const handleGeneral = require("../jui/handleGeneral")({ api, models, Users, Threads, Currencies, ...rest });

  return async function ({ event, ...rest2 }) {
    const { body, senderID, threadID, messageID } = event;

    if (!body || typeof body !== "string" || body.trim() === "") {
      return;
    }

    // Check if message already starts with prefix - use legacy handler
    if (body.trim().startsWith(global.config.PREFIX)) {
      console.log(`🔄 Legacy Handler: Prefixed message detected - "${body.trim()}"`);
      handleCommand({ event, ...rest2 });
      return;
    }

    // Classify the input
    const classification = await classifyInput(body.trim());

    if (classification.type === "command") {
      // Treat as command, proceed with command handling
      console.log(`🤖 AI Classification: Command - "${classification.input}"`);

      // Extract command name from input by matching with available commands
      const input = classification.input.toLowerCase();
      const commands = global.client.commands;
      let matchedCommand = null;

      // Check for exact command matches or aliases (word-based)
      const words = input.split(/\s+/);
      for (const [name, cmd] of commands) {
        if (words.includes(name.toLowerCase())) {
          matchedCommand = name;
          break;
        }
        // Check aliases
        if (cmd.config.aliases) {
          for (const alias of cmd.config.aliases) {
            if (words.includes(alias.toLowerCase())) {
              matchedCommand = name;
              break;
            }
          }
          if (matchedCommand) break;
        }
      }

      if (matchedCommand) {
        // Construct proper command message
        const modifiedEvent = { ...event, body: global.config.PREFIX + matchedCommand };
        handleCommand({ event: modifiedEvent, ...rest2 });
      } else {
        // No command matched, treat as general
        console.log(`❓ No command matched in input, routing to general chat`);
        handleGeneral({ event, ...rest2 });
      }
    } else {
      // General conversation
      console.log(`💬 AI Classification: General - "${classification.input}"`);
      handleGeneral({ event, ...rest2 });
    }
  };
};