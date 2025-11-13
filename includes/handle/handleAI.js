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
const CLASSIFICATION_MODEL_NAME = "gemini-2.5-flash-lite";

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

2. "general" - When user input is normal conversation like:
   - Greetings ("hello", "hi", "good morning")
   - Questions about AI ("what are you", "how do you work")
   - Casual chat ("how are you", "what's up")
   - Explanations ("explain quantum physics", "tell me about dogs")
   - Opinions ("what do you think about AI")

Respond with ONLY a JSON object: {"type":"command","input":"user input"} or {"type":"general","input":"user input"}.
`;

// Initialize the classification model
let classifierModel;
try {
  classifierModel = genAI.getGenerativeModel({
    model: CLASSIFICATION_MODEL_NAME,
    systemInstruction: CLASSIFICATION_PROMPT
  });
} catch (e) {
  console.error("Error initializing classification model:", e);
  module.exports = null;
  return;
}

async function classifyInput(userInput) {
  try {
    const result = await classifierModel.generateContent(userInput);
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
    console.error("Error classifying input:", e);
    return { type: "general", input: userInput }; // fallback
  }
}

module.exports = function ({ api, models, Users, Threads, Currencies, ...rest }) {
  const handleCommand = require("./handleCommand")({ api, models, Users, Threads, Currencies, ...rest });
  const handleGeneral = require("../jui/handleGeneral")({ api, models, Users, Threads, Currencies, ...rest });

  return async function ({ event, ...rest2 }) {
    const { body, senderID, threadID, messageID } = event;

    if (!body || typeof body !== "string" || body.trim() === "") {
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

      // Check for exact command matches or aliases
      for (const [name, cmd] of commands) {
        if (input.includes(name.toLowerCase())) {
          matchedCommand = name;
          break;
        }
        // Check aliases
        if (cmd.config.aliases) {
          for (const alias of cmd.config.aliases) {
            if (input.includes(alias.toLowerCase())) {
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
      // General conversation - ignore for now, let normal bot behavior continue
      console.log(`💬 AI Classification: General - "${classification.input}" (ignored)`);
      // handleGeneral({ event, ...rest2 }); // Commented out
    }
  };
};