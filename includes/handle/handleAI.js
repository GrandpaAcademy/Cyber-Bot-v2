const { GoogleGenerativeAI } = require("@google/generative-ai");
const config = require("../../config.json");
const logger = require("../../utils/log");

// Configure API key
const API_KEY = config.GOOGLE_API_KEY || process.env.GOOGLE_API_KEY;
if (!API_KEY) {
  logger.error("Google API key not found in config.json or environment variables");
  module.exports = null;
  return;
}

const genAI = new GoogleGenerativeAI(API_KEY);

// Model Configuration for Classification
const CLASSIFICATION_MODELS = ["gemini-2.5-flash-lite", "gemini-2.5-flash", "gemini-2.0-flash-lite", "gemini-2.0-flash"];

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
  logger.log("AI Classification models initialized successfully", "SUCCESS");
} catch (e) {
  logger.error("Error initializing classification models:", e.message);
  module.exports = null;
  return;
}

async function classifyInput(userInput) {
  // Input validation
  if (!userInput || typeof userInput !== "string" || userInput.trim() === "") {
    return { type: "general", input: userInput || "" };
  }

  const cleanInput = userInput.trim();
  
  for (const { name, model } of classifierModels) {
    try {
      logger.log(`Trying classification model: ${name}`, "DEBUG");
      
      const result = await model.generateContent(cleanInput);
      const response = result.response;
      let text = response.text().trim();

      // Extract JSON from code blocks if present
      if (text.startsWith('```json')) {
        text = text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      }

      // Parse JSON response
      const classification = JSON.parse(text);

      if (classification.type === "command" || classification.type === "general") {
        logger.log(`Classification successful with ${name}: ${classification.type}`, "SUCCESS");
        return classification;
      } else {
        logger.warn(`Invalid classification type from ${name}, using fallback`, "WARNING");
        return { type: "general", input: cleanInput };
      }
    } catch (e) {
      logger.error(`Error with model ${name}:`, e.message);
      
      if (e.message.includes('429') || e.message.includes('quota') || e.message.includes('rate limit')) {
        logger.warn(`Rate limit or quota exceeded for ${name}, trying next model...`, "WARNING");
        continue;
      } else if (e.message.includes('SAFETY')) {
        logger.warn(`Safety filter triggered for ${name}, skipping`, "WARNING");
        continue;
      } else {
        // For other errors, try next model
        continue;
      }
    }
  }
  
  // If all models fail, fallback with better error reporting
  logger.error("All classification models failed, using fallback", "ERROR");
  return { type: "general", input: cleanInput };
}

module.exports = function ({ api, models, Users, Threads, Currencies, ...rest }) {
  const handleCommand = require("./handleCommand")({ api, models, Users, Threads, Currencies, ...rest });
  const handleGeneral = require("../jui/handleGeneral")({ api, models, Users, Threads, Currencies, ...rest });

  return async function ({ event, ...rest2 }) {
    try {
      const { body, senderID, threadID, messageID } = event;

      // Input validation
      if (!body || typeof body !== "string" || body.trim() === "") {
        return;
      }

      const cleanBody = body.trim();
      
      // Check if message already starts with prefix - use legacy handler
      if (cleanBody.startsWith(global.config.PREFIX)) {
        logger.log(`🔄 Legacy Handler: Prefixed message detected - "${cleanBody}"`, "INFO");
        handleCommand({ event, ...rest2 });
        return;
      }

      // Classify the input
      const classification = await classifyInput(cleanBody);

      if (classification.type === "command") {
        // Treat as command, proceed with command handling
        logger.log(`🤖 AI Classification: Command - "${classification.input}"`, "INFO");

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
          if (cmd.config?.aliases && Array.isArray(cmd.config.aliases)) {
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
          logger.log(`✅ Command matched: ${matchedCommand}`, "SUCCESS");
          handleCommand({ event: modifiedEvent, ...rest2 });
        } else {
          // No command matched, treat as general
          logger.log(`❓ No command matched in input, routing to general chat`, "WARNING");
          handleGeneral({ event, ...rest2 });
        }
      } else {
        // General conversation
        logger.log(`💬 AI Classification: General - "${classification.input}"`, "INFO");
        handleGeneral({ event, ...rest2 });
      }
    } catch (error) {
      logger.error("Error in AI handler:", error.message);
      // Fallback to general handler on error
      try {
        const handleGeneral = require("../jui/handleGeneral")({ api, models, Users, Threads, Currencies, ...rest });
        handleGeneral({ event, ...rest2 });
      } catch (fallbackError) {
        logger.error("Fallback handler also failed:", fallbackError.message);
      }
    }
  };
};