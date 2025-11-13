let activeCmd = false;

module.exports = function ({ api, models, Users, Threads, Currencies, ...rest }) {
  const stringSimilarity = require("string-similarity");
  const moment = require("moment-timezone");
  const logger = require("../../utils/log");

  return async function ({ event, ...rest2 }) {
    try {
      if (activeCmd) {
        return;
      }
      
      activeCmd = true;

      const dateNow = Date.now();
      const time = moment.tz("Asia/Dhaka").format("HH:MM:ss DD/MM/YYYY");
      const { allowInbox, PREFIX, ADMINBOT, DeveloperMode, adminOnly } = global.config;
      const { userBanned, threadBanned, threadInfo, commandBanned } = global.data;
      const { commands } = global.client;

      var { body, senderID, threadID, messageID } = event;
      var senderID = String(senderID);
      var threadID = String(threadID);

      // Input validation
      if (!body || typeof body !== "string") {
        activeCmd = false;
        return;
      }

      const args = body.trim().split(/\s+/);
      const commandName = args.shift()?.toLowerCase();
      
      if (!commandName) {
        activeCmd = false;
        return;
      }
      
      var command = commands.get(commandName);
      
      // Apply default configuration values if needed
      if (command) {
        try {
          const defaultConfig = global.config.defaultCommandConfig || {};
          const path = require('path');
          
          // Use filename as command name if not specified
          if (!command.config.name) {
            const filePath = command.config.__filename || '';
            command.config.name = path.basename(filePath, path.extname(filePath));
          }
          
          // Apply force credit if enabled
          if (global.config.forceCredit === true) {
            command.config = {
              ...defaultConfig,
              ...command.config,
              credits: global.config.defaultCredit || defaultConfig.credits
            };
          } else {
            command.config = {
              ...defaultConfig,
              ...command.config
            };
          }
        } catch (configError) {
          logger.error(`Error applying command config for ${commandName}:`, configError.message);
        }
      }

      // Check for aliases if command not found
      if (!command) {
        for (const [name, cmd] of commands) {
          if (cmd.config?.aliases && Array.isArray(cmd.config.aliases)) {
            if (cmd.config.aliases.includes(commandName)) {
              command = cmd;
              break;
            }
          }
        }
      }
      
      const replyAD = "[ MODE ] - Only bot admin can use bot";

      // Admin-only check
      if (
        command &&
        command.config?.name?.toLowerCase() === commandName.toLowerCase() &&
        !ADMINBOT.includes(senderID) &&
        adminOnly &&
        senderID !== api.getCurrentUserID()
      ) {
        activeCmd = false;
        return await api.sendMessage(replyAD, threadID, null, false);
      }

      if (
        typeof body === "string" &&
        body.startsWith(PREFIX) &&
        !ADMINBOT.includes(senderID) &&
        adminOnly &&
        senderID !== api.getCurrentUserID()
      ) {
        activeCmd = false;
        return await api.sendMessage(replyAD, threadID, null, false);
      }

      // Banned user/thread check
      if (
        userBanned.has(senderID) ||
        threadBanned.has(threadID) ||
        (allowInbox === false && senderID === threadID)
      ) {
        if (!ADMINBOT.includes(senderID.toString())) {
          if (userBanned.has(senderID)) {
            const { reason, dateAdded } = userBanned.get(senderID) || {};
            try {
              const info = await api.sendMessage(
                global.getText("handleCommand", "userBanned", reason, dateAdded),
                threadID,
                null,
                false
              );
              await new Promise((resolve) => setTimeout(resolve, 5 * 1000));
              await api.unsendMessage(info.messageID);
            } catch (err) {
              logger.error("Error handling banned user message:", err);
            }
          } else {
            if (threadBanned.has(threadID)) {
              const { reason, dateAdded } = threadBanned.get(threadID) || {};
              try {
                const info = await api.sendMessage(
                  global.getText(
                    "handleCommand",
                    "threadBanned",
                    reason,
                    dateAdded,
                  ),
                  threadID,
                  null,
                  false
                );
                await new Promise((resolve) => setTimeout(resolve, 5 * 1000));
                await api.unsendMessage(info.messageID);
              } catch (err) {
                logger.error("Error handling banned thread message:", err);
              }
            }
          }
        }
      }

      // Command similarity check
      if (commandName.startsWith(PREFIX)) {
        if (!command) {
          try {
            const allCommandName = Array.from(commands.keys());
            const checker = stringSimilarity.findBestMatch(
              commandName,
              allCommandName,
            );
            if (checker.bestMatch.rating >= 0.5) {
              command = commands.get(checker.bestMatch.target);
            } else {
              activeCmd = false;
              return await api.sendMessage(
                global.getText(
                  "handleCommand",
                  "commandNotExist",
                  checker.bestMatch.target,
                ),
                threadID,
                null,
                false
              );
            }
          } catch (similarityError) {
            logger.error('Error in command similarity check:', similarityError.message);
          }
        }
      }

      // Command ban check
      if (commandBanned.get(threadID) || commandBanned.get(senderID)) {
        if (!ADMINBOT.includes(senderID)) {
          try {
            const banThreads = commandBanned.get(threadID) || [];
            const banUsers = commandBanned.get(senderID) || [];
            
            if (banThreads.includes(command?.config?.name)) {
              activeCmd = false;
              try {
                const info = await api.sendMessage(
                  global.getText(
                    "handleCommand",
                    "commandThreadBanned",
                    command.config.name,
                  ),
                  threadID,
                  null,
                  false
                );
                await new Promise((resolve) => setTimeout(resolve, 5 * 1000));
                await api.unsendMessage(info.messageID);
              } catch (err) {
                logger.error("Error handling banned thread command:", err);
              }
            }
            
            if (banUsers.includes(command?.config?.name)) {
              activeCmd = false;
              try {
                const info = await api.sendMessage(
                  global.getText(
                    "handleCommand",
                    "commandUserBanned",
                    command.config.name,
                  ),
                  threadID,
                  null,
                  false
                );
                await new Promise((resolve) => setTimeout(resolve, 5 * 1000));
                await api.unsendMessage(info.messageID);
              } catch (err) {
                logger.error("Error handling banned user command:", err);
              }
            }
          } catch (banError) {
            logger.error('Error in command ban check:', banError.message);
          }
        }
      }

      // Prefix validation
      if (command && command.config) {
        if (command.config.usePrefix !== undefined) {
          command.config.usePrefix = command.config.usePrefix ?? true;
        }

        if (
          command.config.usePrefix === false &&
          commandName.toLowerCase() !== command.config.name.toLowerCase() &&
          !command.config.allowPrefix
        ) {
          activeCmd = false;
          await api.sendMessage(
            global.getText("handleCommand", "notMatched", command.config.name),
            event.threadID,
            null,
            false
          );
          return;
        }
        
        if (command.config.usePrefix === true && !body.startsWith(PREFIX)) {
          activeCmd = false;
          return;
        }

        if (typeof command.config.usePrefix === "undefined") {
          command.config.usePrefix = true;
        }
      }

      // NSFW check
      if (
        command &&
        command.config?.commandCategory &&
        command.config.commandCategory.toLowerCase() === "nsfw" &&
        !global.data.threadAllowNSFW.includes(threadID) &&
        !ADMINBOT.includes(senderID)
      ) {
        activeCmd = false;
        try {
          const info = await api.sendMessage(
            global.getText("handleCommand", "threadNotAllowNSFW"),
            threadID,
            null,
            false
          );
          await new Promise((resolve) => setTimeout(resolve, 5 * 1000));
          await api.unsendMessage(info.messageID);
        } catch (err) {
          logger.error("Error handling NSFW command:", err);
        }
      }

      // Thread info validation
      let threadInfo2;
      if (event.isGroup === true) {
        try {
          threadInfo2 =
            threadInfo.get(threadID) || (await Threads.getInfo(threadID));
          if (Object.keys(threadInfo2 || {}).length === 0) throw new Error();
        } catch (err) {
          logger.log(
            global.getText("handleCommand", "cantGetInfoThread", "error"),
          );
        }
      }

      // Permission check
      let permssion = 0;
      let threadInfoo;
      try {
        threadInfoo =
          threadInfo.get(threadID) || (await Threads.getInfo(threadID));
        const find = threadInfoo?.adminIDs?.find((el) => el.id == senderID);
        if (ADMINBOT.includes(senderID.toString())) permssion = 2;
        else if (!ADMINBOT.includes(senderID) && find) permssion = 1;
      } catch (permError) {
        logger.error('Error checking permissions:', permError.message);
      }

      if (
        command &&
        command.config?.hasPermssion &&
        command.config.hasPermssion > permssion
      ) {
        activeCmd = false;
        return await api.sendMessage(
          global.getText(
            "handleCommand",
            "permissionNotEnough",
            command.config.name,
          ),
          event.threadID,
          null,
          false
        );
      }

      // Cooldown management
      if (
        command &&
        command.config &&
        !global.client.cooldowns.has(command.config.name)
      ) {
        global.client.cooldowns.set(command.config.name, new Map());
      }

      const timestamps =
        command && command.config
          ? global.client.cooldowns.get(command.config.name)
          : undefined;

      const expirationTime =
        ((command && command.config && command.config.cooldowns) || 1) * 1000;

      if (
        timestamps &&
        timestamps instanceof Map &&
        timestamps.has(senderID) &&
        dateNow < timestamps.get(senderID) + expirationTime
      ) {
        activeCmd = false;
        try {
          await api.setMessageReaction("⏳", event.messageID);
        } catch (err) {
          logger.log("An error occurred while executing setMessageReaction", 2);
        }
      }

      // Text localization
      const getText2 = (...values) => {
        try {
          if (
            command &&
            command.languages &&
            typeof command.languages === "object" &&
            command.languages.hasOwnProperty(global.config.language)
          ) {
            let lang = command.languages[global.config.language][values[0]] || "";
            for (let i = values.length; i > 1; i--) {
              const expReg = new RegExp("%" + i, "g");
              lang = lang.replace(expReg, values[i]);
            }
            return lang;
          }
        } catch (textError) {
          logger.error('Error in getText function:', textError.message);
        }
        return "";
      };

      try {
        const Obj = {
          ...rest,
          ...rest2,
          api,
          event,
          args,
          models,
          Users,
          Threads,
          Currencies,
          permssion,
          getText: getText2,
        };

        if (command && typeof command.run === "function") {
          await command.run(Obj);
          
          if (timestamps) {
            timestamps.set(senderID, dateNow);
          }

          if (DeveloperMode === true) {
            logger.log(
              global.getText(
                "handleCommand",
                "executeCommand",
                time,
                commandName,
                senderID,
                threadID,
                args.join(" "),
                Date.now() - dateNow,
              ),
              "DEV MODE",
            );
          }
        }
      } catch (commandError) {
        logger.error(`Error executing command ${commandName}:`, commandError.message);
        activeCmd = false;
        return await api.sendMessage(
          global.getText("handleCommand", "commandError", commandName, commandError.message),
          threadID,
          null,
          false
        );
      }
      
      activeCmd = false;
      
    } catch (error) {
      logger.error('Critical error in handleCommand:', error.message);
      activeCmd = false;
    }
  };
};
