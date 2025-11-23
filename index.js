const { exec } = require("child_process");
const chalk = require("chalk");
const check = require("get-latest-version");
const fs = require("fs");
const semver = require("semver");
const path = require("path");
const express = require("express");
const parser = require("body-parser");
const app = express();

// Import utilities
global.loading = require("./utils/log.js");

// Configuration
let configJson;
let packageJson;
const sign = "(›^-^)›";
const fbstate = "appstate.json";
const PORT = process.env.PORT || 2024; // Use environment port or default to 2024

// Load configuration files
try {
  configJson = require("./config.json");
} catch (error) {
  console.error("Error loading config.json:", error);
  console.log("Using environment variables or default configuration...");
  configJson = {
    UPDATE: { Package: false, EXCLUDED: [] },
    removeSt: false,
    language: "en"
  };
}

const delayedLog = async (message) => {
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  for (const char of message) {
    process.stdout.write(char);
    await delay(50);
  }

  console.log();
};

const showMessage = async () => {
  const message =
    chalk.yellow(" ") +
    `The "removeSt" property is set true in the config.json. Therefore, the Appstate was cleared effortlessly! You can now place a new one in the same directory.`;

  await delayedLog(message);
};

if (configJson.removeSt) {
  fs.writeFileSync(fbstate, sign, { encoding: "utf8", flag: "w" });
  showMessage();
  configJson.removeSt = false;
  fs.writeFileSync(
    "./config.json",
    JSON.stringify(configJson, null, 2),
    "utf8",
  );
  setTimeout(() => {
    process.exit(0);
  }, 10000);
  return;
}

// # Please note that sometimes this function is the reason the bot will auto-restart, even if your custom.js auto-restart is set to false. This is because the port switches automatically if it is unable to connect to the current port. ↓↓↓↓↓↓

const excluded = configJson.UPDATE.EXCLUDED || [];

try {
  packageJson = require("./package.json");
} catch (error) {
  console.error("Error loading package.json:", error);
  return;
}

function nv(version) {
  return version.replace(/^\^/, "");
}

async function updatePackage(dependency, currentVersion, latestVersion) {
  if (!excluded.includes(dependency)) {
    const ncv = nv(currentVersion);

    if (semver.neq(ncv, latestVersion)) {
      console.log(
        chalk.bgYellow.bold(` UPDATE `),
        `There is a newer version ${chalk.yellow(`(^${latestVersion})`)} available for ${chalk.yellow(dependency)}. Updating to the latest version...`,
      );

      packageJson.dependencies[dependency] = `^${latestVersion}`;

      fs.writeFileSync("./package.json", JSON.stringify(packageJson, null, 2));

      console.log(
        chalk.green.bold(`UPDATED`),
        `${chalk.yellow(dependency)} updated to ${chalk.yellow(`^${latestVersion}`)}`,
      );

      exec(`npm install ${dependency}@latest`, (error, stdout, stderr) => {
        if (error) {
          console.error("Error executing npm install command:", error);
          return;
        }
        console.log("npm install output:", stdout);
      });
    }
  }
}

async function checkAndUpdate() {
  if (configJson.UPDATE && configJson.UPDATE.Package) {
    try {
      for (const [dependency, currentVersion] of Object.entries(
        packageJson.dependencies,
      )) {
        const latestVersion = await check(dependency);
        await updatePackage(dependency, currentVersion, latestVersion);
      }
    } catch (error) {
      console.error("Error checking and updating dependencies:", error);
    }
  } else {
    console.log(
      chalk.yellow(""),
      "Update for packages is not enabled in config.json",
    );
  }
}

// Do not remove anything if you don't know what you're doing!

setTimeout(() => {
  checkAndUpdate();
}, 20000);

// Express middleware and routes
app.use(parser.json());

// Serve all static files from the whole project
app.use(express.static(path.join(__dirname, "includes/cover")));

// Health check endpoint for cloud platforms
app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "OK", 
    timestamp: new Date().toISOString(),
    port: PORT 
  });
});

// Route to serve config.json (themes)
app.get("/themes", (req, res) => {
  res.sendFile(path.join(__dirname, "includes/cover/html.json"));
});

// Serve index.html from includes/cover
app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "includes/cover/index.html"));
});

// Start bot if in bot mode or cloud deployment
async function startBot() {
  try {
    const { spawn } = require('child_process');
    const child = spawn("node", ["--trace-warnings", "--async-stack-traces", "main.js"], {
      cwd: __dirname,
      stdio: "inherit",
      shell: true,
      env: { ...process.env, BOT_MODE: 'true' }
    });

    child.on("close", (codeExit) => {
      if (codeExit !== 0 && !process.env.BOT_MODE) {
        console.log(chalk.red("Bot process exited with code:", codeExit));
        startBot(); // Restart bot if it crashes (only in non-bot mode)
      }
    });

    child.on("error", (error) => {
      console.log(chalk.yellow(``), `An error occurred while starting the bot process: ${error}`);
    });

  } catch (error) {
    console.error("Error starting bot:", error);
  }
}

// Start server and bot
const server = app.listen(PORT, async () => {
  global.loading.log(
    `Web server running on port: ${PORT}`,
    "SYSTEM",
  );
  
  // Log deployment platform info
  if (process.env.RENDER) {
    console.log(chalk.blue("🚀 Running on Render"));
  } else if (process.env.HEROKU_APP_NAME) {
    console.log(chalk.blue("🚀 Running on Heroku"));
  } else if (process.env.RAILWAY_ENVIRONMENT) {
    console.log(chalk.blue("🚀 Running on Railway"));
  } else {
    console.log(chalk.yellow("🔧 Running locally"));
  }

  // Start the bot process for cloud deployment or if explicitly requested
  if (process.env.RENDER || process.env.HEROKU_APP_NAME || process.env.RAILWAY_ENVIRONMENT || process.env.START_BOT === 'true') {
    console.log(chalk.blue("🤖 Starting bot process..."));
    setTimeout(() => startBot(), 2000); // Delay bot start to let server initialize
  }
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log(chalk.yellow('SIGTERM received, shutting down gracefully'));
  server.close(() => {
    console.log(chalk.yellow('Web server terminated'));
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log(chalk.yellow('SIGINT received, shutting down gracefully'));
  server.close(() => {
    console.log(chalk.yellow('Web server terminated'));
    process.exit(0);
  });
});

// Export app for testing or external use
module.exports = app;

