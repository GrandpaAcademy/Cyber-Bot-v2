let activeCmd = false;

module.exports = function ({ api, models, Users, Threads, Currencies, ...rest }) {
  const stringSimilarity = require("string-similarity");
  const moment = require("moment-timezone");
  const logger = require("../../utils/log");

  return async function ({ event, ...rest2 }) {
    if (activeCmd) {
      return;
    }

    const dateNow = Date.now();
    const time = moment.tz("Asia/Dhaka").format("HH:MM:ss DD/MM/YYYY");
    const { allowInbox, PREFIX, ADMINBOT, DeveloperMode, adminOnly } = global.config;
    const { userBanned, threadBanned, threadInfo, commandBanned } = global.data;
    const { commands } = global.client;

    var { body, senderID, threadID, messageID } = event;
    var senderID = String(senderID),
      threadID = String(threadID);

    // Parse the body for commands (both with and without prefix)
    let bodyTrimmed = (body || "").trim();
    let commandName;
    let args;
    let wasPrefixed = false;

    if (bodyTrimmed.startsWith(PREFIX)) {
      // Handle prefixed commands: "?uptime" or "? uptime"
      const afterPrefix = bodyTrimmed.slice(PREFIX.length);
      const afterPrefixTrimmed = afterPrefix.trim();
      if (afterPrefixTrimmed) {
        const parts = afterPrefixTrimmed.split(/ +/);
        commandName = parts.shift()?.toLowerCase();
        args = parts;
        wasPrefixed = true;
      } else {
        commandName = null;
        args = [];
        wasPrefixed = true;
      }
    } else {
      // Handle non-prefixed commands
      const parts = bodyTrimmed.split(/ +/);
      commandName = parts.shift()?.toLowerCase();
      args = parts;
      wasPrefixed = false;
    }

    // Only process commands that exist in goat commands directory
    var command = commands.get(commandName);

    // Check if this is a goat command (by file path)
    if (command && command.config && command.config.__filename && command.config.__filename.includes('goat/')) {
      // Apply default configuration values if needed
      if (command) {
        const defaultConfig = global.config.defaultCommandConfig || {};
        const path = require('path');

        // Use filename as command name if not specified
        if (!command.config.name) {
          const filePath = command.config.__filename || '';
          command.config.name = path.basename(filePath, path.extname(filePath));
        }

        // Set GoatBot-specific defaults for missing keys
        const goatDefaults = {
          role: 0,
          usePrefix: true,
          countDown: 5,
          description: "No description provided",
          commandCategory: "uncategorized",
          guide: "{pn}",
          author: "Unknown",
          version: "1.0"
        };

        // Apply defaults only for missing keys
        for (const [key, value] of Object.entries(goatDefaults)) {
          if (typeof command.config[key] === 'undefined') {
            command.config[key] = value;
          }
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
      }

      const replyAD = "[ MODE ] - Only bot admin can use bot";

      if (
        command &&
        !ADMINBOT.includes(senderID) &&
        adminOnly &&
        senderID !== api.getCurrentUserID()
      ) {
        return api.sendMessage(replyAD, threadID, messageID);
      }

      if (
        typeof body === "string" &&
        body.startsWith(PREFIX) &&
        !ADMINBOT.includes(senderID) &&
        adminOnly &&
        senderID !== api.getCurrentUserID()
      ) {
        return api.sendMessage(replyAD, threadID, messageID);
      }

      if (
        userBanned.has(senderID) ||
        threadBanned.has(threadID) ||
        (allowInbox == ![] && senderID == threadID)
      ) {
        if (!ADMINBOT.includes(senderID.toString())) {
          if (userBanned.has(senderID)) {
            const { reason, dateAdded } = userBanned.get(senderID) || {};
            return api.sendMessage(
              global.getText("handleCommand", "userBanned", reason, dateAdded),
              threadID,
              async (err, info) => {
                await new Promise((resolve) => setTimeout(resolve, 5 * 1000));
                return api.unsendMessage(info.messageID);
              },
              messageID,
            );
          } else {
            if (threadBanned.has(threadID)) {
              const { reason, dateAdded } = threadBanned.get(threadID) || {};
              return api.sendMessage(
                global.getText(
                  "handleCommand",
                  "threadBanned",
                  reason,
                  dateAdded,
                ),
                threadID,
                async (_, info) => {
                  await new Promise((resolve) => setTimeout(resolve, 5 * 1000));
                  return api.unsendMessage(info.messageID);
                },
                messageID,
              );
            }
          }
        }
      }

      // Auto-set usePrefix for commands without prefix/usePrefix configuration
      if (command && command.config && typeof command.config.usePrefix === "undefined" && typeof command.config.prefix === "undefined") {
        command.config.usePrefix = true;
      }

      // Apply legacy prefix compatibility
      if (command && command.config && command.config.prefix !== undefined) {
        command.config.usePrefix = command.config.prefix;
      }

      if (command && command.config) {
        if (
          command.config.usePrefix === false &&
          commandName.toLowerCase() !== command.config.name.toLowerCase() &&
          !command.config.allowPrefix
        ) {
          api.sendMessage(
            global.getText("handleCommand", "notMatched", command.config.name),
            event.threadID,
            event.messageID,
          );
          return;
        }
        if (command.config.usePrefix === true && !wasPrefixed) {
          return;
        }
        if (command.config.usePrefix === false && wasPrefixed) {
          return;
        }
      }

      if (
        command &&
        command.config &&
        command.config.commandCategory &&
        command.config.commandCategory.toLowerCase() === "nsfw" &&
        !global.data.threadAllowNSFW.includes(threadID) &&
        !ADMINBOT.includes(senderID)
      )
        return api.sendMessage(
          global.getText("handleCommand", "threadNotAllowNSFW"),
          threadID,
          async (_, info) => {
            await new Promise((resolve) => setTimeout(resolve, 5 * 1000));
            return api.unsendMessage(info.messageID);
          },
          messageID,
        );

      var threadInfo2;
      if (event.isGroup == !![])
        try {
          threadInfo2 =
            threadInfo.get(threadID) || (await Threads.getInfo(threadID));
          if (Object.keys(threadInfo2).length == 0) throw new Error();
        } catch (err) {
          logger.log(
            global.getText("handleCommand", "cantGetInfoThread", "error"),
          );
        }

      var permssion = 0;
      var threadInfoo =
        threadInfo.get(threadID) || (await Threads.getInfo(threadID));
      const find = threadInfoo.adminIDs.find((el) => el.id == senderID);
      if (ADMINBOT.includes(senderID.toString())) permssion = 2;
      else if (!ADMINBOT.includes(senderID) && find) permssion = 1;
      if (
        command &&
        command.config &&
        command.config.hasPermssion &&
        command.config.hasPermssion > permssion
      ) {
        return api.sendMessage(
          global.getText(
            "handleCommand",
            "permissionNotEnough",
            command.config.name,
          ),
          event.threadID,
          event.messageID,
        );
      }

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
      )
        return api.setMessageReaction(
          "⏳",
          event.messageID,
          (err) =>
            err
              ? logger.log(
                  "An error occurred while executing setMessageReaction",
                  2,
                )
              : "",
          !![],
        );

      var getText2;
      if (
        command &&
        command.languages &&
        typeof command.languages === "object" &&
        command.languages.hasOwnProperty(global.config.language)
      )
        getText2 = (...values) => {
          var lang = command.languages[global.config.language][values[0]] || "";
          for (var i = values.length; i > 0x2533 + 0x1105 + -0x3638; i--) {
            const expReg = RegExp("%" + i, "g");
            lang = lang.replace(expReg, values[i]);
          }
          return lang;
        };
      else getText2 = () => {};

      try {
        // Create a message object for goat commands
        const messageObj = {
          send: (data, callback) => {
            if (typeof data === 'object' && data !== null) {
              if (data.attachment) {
                api.sendMessage({
                  body: data.body || "",
                  attachment: data.attachment
                }, threadID, callback || null, messageID);
              } else if (data.body) {
                api.sendMessage(data.body, threadID, callback || null, messageID);
              } else {
                api.sendMessage(data, threadID, callback || null, messageID);
              }
            } else {
              api.sendMessage(data || "", threadID, callback || null, messageID);
            }
          },
          reply: (data, callback) => {
            if (typeof data === 'object' && data !== null) {
              if (data.attachment) {
                api.sendMessage({
                  body: data.body || "",
                  attachment: data.attachment
                }, threadID, callback || null, messageID);
              } else if (data.body) {
                api.sendMessage(data.body, threadID, callback || null, messageID);
              } else {
                api.sendMessage(data, threadID, callback || null, messageID);
              }
            } else {
              api.sendMessage(data || "", threadID, callback || null, messageID);
            }
          },
          SyntaxError: () => {
            api.sendMessage("❌ Wrong syntax! Please check command usage.", threadID, null, messageID);
          }
        };

        // Map parameters to goat command format
        const Obj = {
          ...rest,
          ...rest2,
          api: api,
          event: event,
          args: args,
          message: messageObj,
          // Map to goat command expected parameters
          usersData: {
            getName: async (userId) => {
              const userData = await Users.getNameUser(userId);
              return userData || "Unknown User";
            },
            get: async (userId) => {
              const userData = await Users.getData(userId);
              return { 
                name: userData?.name || "Unknown User",
                gender: userData?.data?.gender || 0 
              };
            }
          },
          threadsData: {
            get: async (threadId) => {
              const threadData = await Threads.getData(threadId);
              return threadData || {};
            }
          },
          models: models,
          Users: Users,
          Threads: Threads,
          Currencies: Currencies,
          permssion: permssion,
          getText: getText2,
          role: permssion,
          commandName: command.config.name,
          getLang: getText2
        };

        // Check if command has onStart function (goat commands pattern)
        if (command && typeof command.onStart === "function") {
          console.log(`DEBUG: Executing GOAT command: ${commandName} with args: ${JSON.stringify(args)}`);
          
          // For goat commands, call onStart
          const result = await command.onStart(Obj);
          
          if (timestamps) timestamps.set(senderID, dateNow);

          if (DeveloperMode == !![]) {
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
          console.log(`DEBUG: GOAT Command executed successfully`);
          return;
        } else {
          console.log(`DEBUG: No valid GOAT command found - command: ${command ? 'found' : 'not found'}, has onStart function: ${command && typeof command.onStart === 'function' ? 'yes' : 'no'}`);
        }
      } catch (e) {
        console.log(`DEBUG: Error executing GOAT command: ${e.message}`);
        return api.sendMessage(
          global.getText("handleCommand", "commandError", commandName, e),
          threadID,
        );
      }
      activeCmd = false;
    }
  };
};