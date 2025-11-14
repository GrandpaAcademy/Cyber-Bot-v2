async function classifyInput(userInput, isReplyToBot = false) {
  const axios = require('axios');
  try {
    // console.log(`???????? ${global.config.BELAAI_API_URL}/bela/classify`)
    // Enhanced prompt for replies to bot messages
    let promptInput = userInput;
    if (isReplyToBot) {
      promptInput = `[REPLY TO BOT] ${userInput} - This user is replying to the bot's message. Classify as "command" if they want to execute a bot command, or "general" for conversation.`;
    }
    
    const response = await axios.post(`${global.config.BELAAI_API_URL}/bela/classify`, { input: promptInput });
    return response.data;
  } catch (error) {
    console.error('Error calling classification API:', error.message);
    return { type: "general", input: userInput }; // fallback
  }
}

module.exports = function ({ api, models, Users, Threads, Currencies, ...rest }) {
  const handleCommand = require("./handleCommand")({ api, models, Users, Threads, Currencies, ...rest });

  return async function ({ event, ...rest2 }) {
    const { body, senderID, threadID, messageID, messageReply } = event;

    if (!body || typeof body !== "string" || body.trim() === "") {
      return;
    }

    // Check if message already starts with prefix - use legacy handler
    if (body.trim().startsWith(global.config.PREFIX)) {
      console.log(`🔄 Legacy Handler: Prefixed message detected - "${body.trim()}"`);
      handleCommand({ event, ...rest2 });
      return;
    }

    // Check if this is a reply to the bot
    const botID = global.client.api.getCurrentUserID();
    const isReplyToBot = messageReply && messageReply.senderID === botID;
    
    if (isReplyToBot) {
      console.log(`🔄 Reply to bot detected - enhancing AI classification`);
    }

    // Classify the input
    const classification = await classifyInput(body.trim(), isReplyToBot);

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
          // Check if this command requires a prefix
          const command = commands.get(matchedCommand);
          
          // Auto-set usePrefix for commands without prefix/usePrefix configuration
          let usePrefix = true;
          if (command && command.config) {
            if (typeof command.config.usePrefix !== "undefined") {
              usePrefix = command.config.usePrefix;
            } else if (typeof command.config.prefix !== "undefined") {
              usePrefix = command.config.prefix;
            } else {
              usePrefix = true; // Default to true for commands without configuration
            }
          }
          
          // Get remaining arguments
          const remainingArgs = words.slice(1).join(" ");
          
          let commandBody;
          if (usePrefix) {
            // Commands that require prefix
            commandBody = remainingArgs ? global.config.PREFIX + matchedCommand + " " + remainingArgs : global.config.PREFIX + matchedCommand;
          } else {
            // Commands that don't require prefix (like baby)
            commandBody = remainingArgs ? matchedCommand + " " + remainingArgs : matchedCommand;
          }
          
          const modifiedEvent = { ...event, body: commandBody };
          handleCommand({ event: modifiedEvent, ...rest2 });
        } else {
          // Command found but not first word - no action for general chat since it's removed
          console.log(`🤔 Command "${matchedCommand}" found but not primary intent - no general chat handler`);
        }
      } else {
        // No command matched - no action for general chat since it's removed
        console.log(`❓ No command matched in input - no general chat handler`);
      }
    } else {
      // General conversation - no action since general chat is removed
      console.log(`💬 AI Classification: General - "${classification.input}" - no general chat handler`);
    }
  };
};