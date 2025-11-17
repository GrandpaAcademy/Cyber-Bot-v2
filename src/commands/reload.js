module.exports.config = {
  name: "reload",
  version: "2.0.0",
  hasPermission: 2,
  credits: "Kilo Code",
  description: "Advanced reload system with selective reloading and enhanced diagnostics",
  usePrefix: true,
  commandCategory: "admin",
  usages: "[all/commands/events/config/aliases] [specific_command]",
  cooldowns: 3,
  aliases: ["r", "refresh", "rl"]
};

module.exports.run = async function({ api, event, args, getText }) {
  const { senderID, threadID, messageID } = event;
  const fs = require("fs-extra");
  const path = require('path');
  const { execSync } = require('child_process');
  const chalk = require("chalk");
  const moment = require('moment-timezone');
  
  // Check if bot admin
  if (!global.config.ADMINBOT.includes(senderID)) {
    return api.sendMessage("❌ You don't have permission to use this command.", threadID, messageID);
  }

  const startTime = Date.now();
  const reloadType = args[0]?.toLowerCase() || 'all';
  const targetCommand = args[1];

  try {
    const commandsPath = `${global.client.mainPath}/src/commands`;
    const eventsPath = `${global.client.mainPath}/src/events`;
    
    let results = {
      loaded: [],
      failed: [],
      skipped: [],
      total: 0,
      duration: 0
    };

    // Clear existing commands for full reload
    if (reloadType === 'all' || reloadType === 'commands') {
      global.client.commands.clear();
      global.client.eventRegistered = [];
    }

    // Enhanced command loading with detailed feedback
    const loadCommands = async () => {
      const commandFiles = [];
      
      // Load commands from main directory
      const mainCommands = fs.readdirSync(commandsPath).filter(command => 
        command.endsWith('.js') && 
        !command.includes('example') && 
        !global.config.commandDisabled.includes(command)
      );
      
      // Load commands from subdirectories
      const subdirs = fs.readdirSync(commandsPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
      
      for (const subdir of subdirs) {
        const subdirPath = path.join(commandsPath, subdir);
        const subdirCommands = fs.readdirSync(subdirPath).filter(command => 
          command.endsWith('.js') && 
          !command.includes('example') && 
          !global.config.commandDisabled.includes(command)
        );
        for (const command of subdirCommands) {
          commandFiles.push(path.join(subdir, command));
        }
      }

      console.log(chalk.blue(`🔄 Starting command reload... Found ${mainCommands.length + commandFiles.length} commands`));
      
      let loadedCount = 0;
      
      // Process main directory commands
      for (const command of mainCommands) {
        await processCommand(command, commandsPath);
      }
      
      // Process subdirectory commands
      for (const command of commandFiles) {
        await processCommand(command, commandsPath);
      }
    };

    const processCommand = async (command, basePath) => {
      try {
        // Check if targeting specific command
        if (targetCommand && !command.includes(targetCommand)) {
          results.skipped.push(command);
          return;
        }

        const fullPath = `${basePath}/${command}`;
        
        // Clear require cache
        delete require.cache[require.resolve(fullPath)];
        const module = require(fullPath);
        const { config } = module;

        // Enhanced validation
        const validation = validateCommand(config, command);
        if (!validation.valid) {
          results.failed.push(`${command}: ${validation.error}`);
          return;
        }

        // Handle dependencies
        await handleDependencies(config);

        // Handle environment configuration
        await handleEnvConfig(config);

        // Execute onLoad if present
        await executeOnLoad(module, api);

        // Register event handlers
        if (module.handleEvent) {
          global.client.eventRegistered.push(config.name);
        }

        // Store metadata
        module.config.__filename = command;
        module.config.__loadedAt = moment().tz("Asia/Dhaka").format();

        // Add command to registry
        global.client.commands.set(config.name, module);

        // Handle aliases
        await registerAliases(config, module);

        results.loaded.push(config.name);
        console.log(chalk.green(`✅ Loaded: ${config.name}`));

      } catch (error) {
        results.failed.push(`${command}: ${error.message}`);
        console.log(chalk.red(`❌ Failed: ${command} - ${error.message}`));
      }
    };

    const validateCommand = (config, filename) => {
      if (!config?.name) return { valid: false, error: 'Missing name property' };
      if (!config?.commandCategory) return { valid: false, error: 'Missing commandCategory' };
      if (!config?.hasOwnProperty('usePrefix')) return { valid: false, error: 'Missing usePrefix property' };
      if (global.client.commands.has(config.name)) return { valid: false, error: 'Command already exists' };
      return { valid: true };
    };

    const handleDependencies = async (config) => {
      const { dependencies } = config;
      if (!dependencies) return;

      const listPackage = JSON.parse(fs.readFileSync('./package.json', 'utf8')).dependencies;
      
      for (const [reqDependency, version] of Object.entries(dependencies)) {
        if (listPackage[reqDependency]) continue;
        
        try {
          console.log(chalk.yellow(`📦 Installing dependency: ${reqDependency}`));
          execSync(`npm install ${reqDependency}@${version} --save`, {
            stdio: 'pipe',
            env: process.env
          });
          
          // Clear all require cache after dependency installation
          Object.keys(require.cache).forEach(key => delete require.cache[key]);
          
        } catch (error) {
          throw new Error(`Failed to install dependency ${reqDependency}: ${error.message}`);
        }
      }
    };

    const handleEnvConfig = async (config) => {
      const { envConfig } = config;
      if (!envConfig) return;

      const moduleName = config.name;
      global.configModule[moduleName] = global.configModule[moduleName] || {};
      global.config[moduleName] = global.config[moduleName] || {};

      for (const envConfigKey in envConfig) {
        global.configModule[moduleName][envConfigKey] = global.config[moduleName][envConfigKey] ?? envConfig[envConfigKey];
        global.config[moduleName][envConfigKey] = global.config[moduleName][envConfigKey] ?? envConfig[envConfigKey];
      }
    };

    const executeOnLoad = async (module, api) => {
      if (!module.onLoad) return;

      try {
        await module.onLoad({ api });
      } catch (error) {
        console.log(chalk.yellow(`⚠️ onLoad failed for module: ${error.message}`));
      }
    };

    const registerAliases = async (config, module) => {
      if (!config.aliases || !Array.isArray(config.aliases)) return;

      for (const alias of config.aliases) {
        const aliasModule = { ...module };
        aliasModule.config = { ...module.config };
        global.client.commands.set(alias, aliasModule);
      }
    };

    // Execute reload based on type
    switch (reloadType) {
      case 'all':
        await loadCommands();
        break;
        
      case 'commands':
        await loadCommands();
        break;
        
      case 'events':
        // Reload event handlers
        await reloadEvents();
        break;
        
      case 'config':
        // Reload configuration
        await reloadConfig();
        break;
        
      case 'aliases':
        // Show alias information
        return showAliasInfo();
        
      default:
        // Check if it's a specific command
        if (targetCommand) {
          await loadCommands();
        } else {
          return api.sendMessage(`❌ Invalid reload type: ${reloadType}\nAvailable types: all, commands, events, config, aliases`, threadID, messageID);
        }
    }

    results.duration = Date.now() - startTime;
    results.total = global.client.commands.size;

    // Generate detailed report
    const report = generateReloadReport(results, reloadType, targetCommand);
    
    api.sendMessage(report, threadID, messageID);

  } catch (error) {
    console.error(chalk.red(`🚨 Reload failed: ${error.message}`));
    api.sendMessage(`❌ Reload failed: ${error.message}\n\nCheck console for detailed error logs.`, threadID, messageID);
  }
};

const reloadEvents = async () => {
  const fs = require('fs-extra');
  const eventsPath = `${global.client.mainPath}/src/events`;
  
  // Clear existing events
  global.client.events.clear();
  
  const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
  
  for (const eventFile of eventFiles) {
    try {
      delete require.cache[require.resolve(`${eventsPath}/${eventFile}`)];
      const eventModule = require(`${eventsPath}/${eventFile}`);
      
      if (eventModule.config?.name) {
        global.client.events.set(eventModule.config.name, eventModule);
        console.log(`🔄 Reloaded event: ${eventModule.config.name}`);
      }
    } catch (error) {
      console.error(`Failed to reload event ${eventFile}:`, error.message);
    }
  }
};

const reloadConfig = async () => {
  try {
    const config = require('../config.json');
    global.config = { ...global.config, ...config };
    console.log('🔄 Configuration reloaded');
  } catch (error) {
    throw new Error(`Failed to reload config: ${error.message}`);
  }
};

const showAliasInfo = () => {
  const aliasMap = new Map();
  
  for (const [name, module] of global.client.commands) {
    if (module.config?.aliases) {
      for (const alias of module.config.aliases) {
        if (!aliasMap.has(alias)) {
          aliasMap.set(alias, name);
        }
      }
    }
  }
  
  let aliasList = '📋 Command Aliases:\n\n';
  for (const [alias, command] of aliasMap) {
    aliasList += `• ${alias} → ${command}\n`;
  }
  
  return aliasList || 'No aliases found.';
};

const generateReloadReport = (results, type, target) => {
  const endTime = moment().tz("Asia/Dhaka").format("HH:mm:ss");
  const duration = (results.duration / 1000).toFixed(2);
  
  let report = `🔄 **Reload Complete**\n`;
  report += `━━━━━━━━━━━━━━━━━━━\n`;
  report += `📊 **Statistics:**\n`;
  report += `• Type: ${type}${target ? ` (target: ${target})` : ''}\n`;
  report += `• Loaded: ✅ ${results.loaded.length}\n`;
  report += `• Failed: ❌ ${results.failed.length}\n`;
  report += `• Skipped: ⏭️ ${results.skipped.length}\n`;
  report += `• Total: 📦 ${results.total}\n`;
  report += `• Duration: ⏱️ ${duration}s\n`;
  report += `• Time: 🕐 ${endTime}\n`;
  
  if (results.loaded.length > 0) {
    report += `\n✅ **Successfully Loaded:**\n`;
    results.loaded.slice(0, 10).forEach(cmd => report += `• ${cmd}\n`);
    if (results.loaded.length > 10) {
      report += `• ... and ${results.loaded.length - 10} more\n`;
    }
  }
  
  if (results.failed.length > 0) {
    report += `\n❌ **Failed to Load:**\n`;
    results.failed.slice(0, 5).forEach(fail => report += `• ${fail}\n`);
    if (results.failed.length > 5) {
      report += `• ... and ${results.failed.length - 5} more\n`;
    }
  }
  
  if (results.failed.length === 0 && results.loaded.length > 0) {
    report += `\n🎉 **All commands loaded successfully!**`;
  }
  
  return report;
};