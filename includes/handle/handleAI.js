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
    return { type: "unknown", input: userInput }; // Don't default to general - let logic decide  // Closes #14
  }
}

module.exports = function ({ api, models, Users, Threads, Currencies, ...rest }) {
  const handleCommand = require("./handleCommand")({ api, models, Users, Threads, Currencies, ...rest });

  return async function ({ event, ...rest2 }) {
    const { body, senderID, threadID, messageID, messageReply } = event;

    if (!body || typeof body !== "string" || body.trim() === "") {
      return;
    }

    // Check if message starts with prefix - ALWAYS prioritize prefix commands
    const trimmedBody = body.trim();
    if (trimmedBody.startsWith(global.config.PREFIX)) {
      console.log(`🔄 Legacy Handler: Prefixed message detected - "${trimmedBody}"`);
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
    const classification = await classifyInput(trimmedBody, isReplyToBot);

    // ALWAYS check if first word matches any command name or alias (regardless of AI classification)
    const words = trimmedBody.split(/\s+/);
    const firstWord = words[0].toLowerCase();
    const commands = global.client.commands;
    
    let potentialCommand = null;
    for (const [name, cmd] of commands) {
      if (firstWord === name.toLowerCase()) {
        potentialCommand = name;
        break;
      }
      if (cmd.config && cmd.config.aliases) {
        for (const alias of cmd.config.aliases) {
          if (firstWord === alias.toLowerCase()) {
            potentialCommand = name;
            break;
          }
        }
      }
      if (potentialCommand) break;
    }

    // If we found a potential command by first word, treat as command immediately
    if (potentialCommand) {
      console.log(`🔍 Command detected by first word: "${potentialCommand}" - processing as command`);
      
      // Special handling for help commands with arguments
      if (potentialCommand === "help" && words.length > 1) {
        // For "help ping", construct "?help ping"
        const helpArg = words.slice(1).join(" ");
        const modifiedEvent = { ...event, body: global.config.PREFIX + "help " + helpArg };
        handleCommand({ event: modifiedEvent, ...rest2 });
        return;
      } else if (potentialCommand === firstWord) {
        // Check if this command requires a prefix
        const command = commands.get(potentialCommand);
        
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
          commandBody = remainingArgs ? global.config.PREFIX + potentialCommand + " " + remainingArgs : global.config.PREFIX + potentialCommand;
        } else {
          // Commands that don't require prefix (like baby)
          commandBody = remainingArgs ? potentialCommand + " " + remainingArgs : potentialCommand;
        }
        
        const modifiedEvent = { ...event, body: commandBody };
        handleCommand({ event: modifiedEvent, ...rest2 });
        return;
      }
    }

    // No command found by first word, proceed with AI classification only
    if (classification.type === "command") {
      console.log(`🤖 AI Classification: Command - "${classification.input}"`);
      
      // Try to find command in the classified input
      const input = classification.input.toLowerCase();
      let matchedCommand = null;
      
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
        }
        if (matchedCommand) break;
      }

      if (matchedCommand) {
        console.log(`🎯 AI matched command: "${matchedCommand}"`);
        // Process this as a command (similar logic as above)
        const command = commands.get(matchedCommand);
        let usePrefix = true;
        
        if (command && command.config) {
          if (typeof command.config.usePrefix !== "undefined") {
            usePrefix = command.config.usePrefix;
          } else if (typeof command.config.prefix !== "undefined") {
            usePrefix = command.config.prefix;
          }
        }
        
        const commandBody = usePrefix ? global.config.PREFIX + matchedCommand : matchedCommand;
        const modifiedEvent = { ...event, body: commandBody };
        handleCommand({ event: modifiedEvent, ...rest2 });
      } else {
        console.log(`❓ AI classified as command but no matching command found`);
      }
    } else {
      // General conversation - no action since general chat is removed
      console.log(`💬 AI Classification: ${classification.type} - "${classification.input}" - no general chat handler`);
    }
  };
};