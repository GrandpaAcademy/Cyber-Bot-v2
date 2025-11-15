module.exports.config = {
  name: "reload",
  version: "1.0.0",
  hasPermission: 2,
  credits: "Kilo Code",
  description: "Reload all commands without restarting the bot",
  usePrefix: true,
  commandCategory: "admin",
  usages: "",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
  const { senderID, threadID, messageID } = event;
  const fs = require("fs-extra");
  const path = require('path');
  const { execSync } = require('child_process');
  const chalk = require("chalk");
  const listPackage = JSON.parse(fs.readFileSync('./package.json')).dependencies;

  // Check if bot admin
  if (!global.config.ADMINBOT.includes(senderID)) {
    return api.sendMessage("You don't have permission to use this command.", threadID, messageID);
  }

  try {
    const commandsPath = `${global.client.mainPath}/src/commands`;
    
    // Load commands from main directory
    const listCommand = fs.readdirSync(commandsPath).filter(command => command.endsWith('.js') && !command.includes('example') && !global.config.commandDisabled.includes(command));
    
    // Load commands from subdirectories (like goat)
    const subdirs = fs.readdirSync(commandsPath, { withFileTypes: true }).filter(dirent => dirent.isDirectory()).map(dirent => dirent.name);
    for (const subdir of subdirs) {
      const subdirPath = path.join(commandsPath, subdir);
      const subdirCommands = fs.readdirSync(subdirPath).filter(command => command.endsWith('.js') && !command.includes('example') && !global.config.commandDisabled.includes(command));
      for (const command of subdirCommands) {
        listCommand.push(path.join(subdir, command));
      }
    }

    // Clear existing commands
    global.client.commands.clear();

    console.log("Reloading commands...");

    for (const command of listCommand) {
      try {
        // Clear require cache for the command
        delete require.cache[require.resolve(`${commandsPath}/${command}`)];
        const module = require(`${commandsPath}/${command}`);
        const { config } = module;

        if (!config?.name) {
          console.log(chalk.red(`[ COMMAND ] ${command} command has no name property or empty!`));
          continue;
        }
        if (!config?.commandCategory) {
          console.log(chalk.red(`[ COMMAND ] ${command} commandCategory is empty!`));
          continue;
        }

        if (!config?.hasOwnProperty('usePrefix')) {
          console.log(`Command ${command} does not have the "usePrefix" property.`);
          continue;
        }

        if (global.client.commands.has(config.name || '')) {
          console.log(chalk.red(`[ COMMAND ] ${command} Module is already loaded!`));
          continue;
        }
        const { dependencies, envConfig } = config;
        if (dependencies) {
          Object.entries(dependencies).forEach(([reqDependency, _]) => {
            if (listPackage[reqDependency]) return;
            try {
              execSync(`npm --package-lock false --save install ${reqDependency}`, {
                stdio: 'inherit',
                env: process.env,
                shell: true,
                cwd: path.join(__dirname, '../../node_modules')
              });
              Object.keys(require.cache).forEach(key => delete require.cache[key]);
            } catch (error) {
              console.log(chalk.red(`[PACKAGE] Failed to install package ${reqDependency} for module`));
            }
          });
        }

        if (envConfig) {
          const moduleName = config.name;
          global.configModule[moduleName] = global.configModule[moduleName] || {};
          global.config[moduleName] = global.config[moduleName] || {};
          for (const envConfigKey in envConfig) {
            global.configModule[moduleName][envConfigKey] = global.config[moduleName][envConfigKey] ?? envConfig[envConfigKey];
            global.config[moduleName][envConfigKey] = global.config[moduleName][envConfigKey] ?? envConfig[envConfigKey];
          }
          // Removed auto-writing to config.json to prevent overwriting manual edits
          // var configPath = require('./../../config.json');
          // configPath[moduleName] = envConfig;
          // fs.writeFileSync(global.client.configPath, JSON.stringify(configPath, null, 4), 'utf-8');
        }

        if (module.onLoad) {
          const moduleData = {
            api: api
          };
          try {
            module.onLoad(moduleData);
          } catch (error) {
            console.log("Unable to load the onLoad function of the module.");
          }
        }

        if (module.handleEvent) global.client.eventRegistered.push(config.name);

        // Store filename in config for fallback name
        module.config.__filename = command;

        global.client.commands.set(config.name || path.basename(command, '.js'), module);

        // Register aliases if they exist
        if (config.aliases && Array.isArray(config.aliases)) {
          for (const alias of config.aliases) {
            const aliasModule = {...module};
            aliasModule.config = {...module.config};
            global.client.commands.set(alias, aliasModule);
          }
        }

        console.log(`Loaded command: ${config.name}`);
      } catch (error) {
        console.log(`Failed to load command ${command}: ${error.message}`);
      }
    }

    api.sendMessage(`Reloaded ${global.client.commands.size} commands successfully.`, threadID, messageID);
  } catch (error) {
    api.sendMessage(`Error reloading commands: ${error.message}`, threadID, messageID);
  }
};