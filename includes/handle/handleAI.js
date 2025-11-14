async function classifyInput(userInput) {
  const axios = require('axios');
  try {
    console.log(`???????? ${global.config.BELAAI_API_URL}/bela/classify`)
    const response = await axios.post(`${global.config.BELAAI_API_URL}/bela/classify`, { input: userInput });
    return response.data;
  } catch (error) {
    console.error('Error calling classification API:', error.message);
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
        // Special handling for help commands with arguments
        if (matchedCommand === "help" && words.length > 1) {
          // For "help ping", construct "?help ping"
          const helpArg = words.slice(1).join(" ");
          const modifiedEvent = { ...event, body: global.config.PREFIX + "help " + helpArg };
          handleCommand({ event: modifiedEvent, ...rest2 });
        } else if (matchedCommand === words[0]) {
          // If the matched command is the first word, construct command with all remaining args
          const remainingArgs = words.slice(1).join(" ");
          const commandBody = remainingArgs ? global.config.PREFIX + matchedCommand + " " + remainingArgs : global.config.PREFIX + matchedCommand;
          const modifiedEvent = { ...event, body: commandBody };
          handleCommand({ event: modifiedEvent, ...rest2 });
        } else {
          // Command found but not first word - might be part of conversation
          console.log(`🤔 Command "${matchedCommand}" found but not primary intent, routing to general chat`);
          handleGeneral({ event, ...rest2 });
        }
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