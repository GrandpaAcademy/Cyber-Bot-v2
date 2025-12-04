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

    var command = commands.get(commandName);
    
    // Apply default configuration values if needed
    if (command) {
      const defaultConfig = global.config.defaultCommandConfig || {};
      const path = require('path');

      // Use filename as command name if not specified
      if (!command.config.name) {
        const filePath = command.config.__filename || '';
        command.config.name = path.basename(filePath, path.extname(filePath));
      }

      // Set Mirai-specific defaults for missing keys
      const miraiDefaults = {
        hasPermission: 0,
        usePrefix: true,
        cooldowns: 5,
        description: "No description provided",
        commandCategory: "uncategorized",
        usages: "",
        credits: "Unknown",
        version: "1.0"
      };

      // Apply defaults only for missing keys
      for (const [key, value] of Object.entries(miraiDefaults)) {
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

    // Check for aliases if command not found
    if (!command) {
      for (const [name, cmd] of commands) {
        if (cmd.config.aliases && Array.isArray(cmd.config.aliases)) {
          if (cmd.config.aliases.includes(commandName)) {
            command = cmd;
            break;
          }
        }
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

    if (commandName.startsWith(PREFIX)) {
      if (!command) {
        const allCommandName = Array.from(commands.keys());
        const checker = stringSimilarity.findBestMatch(
          commandName,
          allCommandName,
        );
        if (checker.bestMatch.rating >= 0.5) {
          command = commands.get(checker.bestMatch.target);
        } else {
          return api.sendMessage(
            global.getText(
              "handleCommand",
              "commandNotExist",
              checker.bestMatch.target,
            ),
            threadID,
          );
        }
      }
    }

    if (commandBanned.get(threadID) || commandBanned.get(senderID)) {
      if (!ADMINBOT.includes(senderID)) {
        const banThreads = commandBanned.get(threadID) || [],
          banUsers = commandBanned.get(senderID) || [];
        if (banThreads.includes(command.config.name))
          return api.sendMessage(
            global.getText(
              "handleCommand",
              "commandThreadBanned",
              command.config.name,
            ),
            threadID,
            async (_, info) => {
              await new Promise((resolve) => setTimeout(resolve, 5 * 1000));
              return api.unsendMessage(info.messageID);
            },
            messageID,
          );
        if (banUsers.includes(command.config.name))
          return api.sendMessage(
            global.getText(
              "handleCommand",
              "commandUserBanned",
              command.config.name,
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
      !client.cooldowns.has(command.config.name)
    ) {
      client.cooldowns.set(command.config.name, new Map());
    }

    const timestamps =
      command && command.config
        ? client.cooldowns.get(command.config.name)
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
      const Obj = {
        ...rest,
        ...rest2,
        api: api,
        event: event,
        args: args,
        models: models,
        Users: Users,
        Threads: Threads,
        Currencies: Currencies,
        permssion: permssion,
        getText: getText2,
      };

      if (command && typeof command.run === "function") {
        console.log(`DEBUG: Executing command: ${commandName} with args: ${JSON.stringify(args)}`);
        command.run(Obj);
        timestamps.set(senderID, dateNow);

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
        console.log(`DEBUG: Command executed successfully`);
        return;
      } else {
        console.log(`DEBUG: No valid command found - command: ${command ? 'found' : 'not found'}, has run function: ${command && typeof command.run === 'function' ? 'yes' : 'no'}`);
      }
    } catch (e) {
      console.log(`DEBUG: Error executing command: ${e.message}`);
      return api.sendMessage(
        global.getText("handleCommand", "commandError", commandName, e),
        threadID,
      );
    }
    activeCmd = false;
  };
};