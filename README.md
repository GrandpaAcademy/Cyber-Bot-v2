<div align="center">
  <img src="./assets/logo-16x9.svg" alt="CyberBot Logo" width="400">
  <h1>CyberBot 🤖</h1>
  <p><strong>A Modern Facebook Messenger Bot with Advanced Features</strong></p>
</div>

<p align="center">
  <strong>English</strong> |
  <a href="README_bn.md">বাংলা</a>
</p>

<p align="center">
  <a href="https://github.com/GrandpaAcademy/Cyber-Bot-v2/stargazers"><img src="https://img.shields.io/github/stars/GrandpaAcademy/Cyber-Bot-v2?style=flat-square" alt="Stars"></a>
  <a href="https://github.com/GrandpaAcademy/Cyber-Bot-v2/network/members"><img src="https://img.shields.io/github/forks/GrandpaAcademy/Cyber-Bot-v2?style=flat-square" alt="Forks"></a>
  <img src="https://img.shields.io/badge/version-2.0.0-blue?style=flat-square" alt="Version">
  <img src="https://img.shields.io/badge/Node.js-20.x-brightgreen?style=flat-square" alt="Node.js">
  <a href="LICENSE"><img src="https://img.shields.io/github/license/GrandpaAcademy/Cyber-Bot-v2?style=flat-square" alt="License"></a>
</p>

<p align="center">
  <a href="https://www.youtube.com/@Grandpa_Academy"><img src="https://img.shields.io/badge/-YouTube-red?style=social"></a>
  <a href="https://t.me/Grandpa_Academy"><img src="https://img.shields.io/badge/-Telegram-blue?style=social"></a>
  <a href="https://www.facebook.com/GrandpaEJ"><img src="https://img.shields.io/badge/-Facebook-blue?style=social"></a>
</p>

## 📚 Table of Contents
- [Features](#-features)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Command Creation](#-command-creation)
- [Security](#-security)
- [Updates](#-updates)
- [Support](#-support)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

- 🚀 **Modern Architecture**: Built on Node.js 20.x
- 🌍 **Multi-language Support**: English and Bengali included
- 🔒 **Enhanced Security**: Built-in appstate encryption
- ⚡ **Fast & Efficient**: Optimized for performance
- 🎯 **Easy to Extend**: Simple command creation system
- 🛠 **Customizable**: Flexible configuration options
- 👥 **Group Management**: Advanced group features
- 🔍 **Command Aliases**: Multiple ways to trigger commands
- ⏱ **Cooldown System**: Prevent command spam
- 🔐 **Permission Levels**: User, Admin, and Bot Owner controls

## 📋 Prerequisites

- Node.js 20.x or higher
- NPM or Yarn
- Git
- Facebook Account

## 📝 Command Creation

CyberBot makes it easy to add new features! Use the template below to create your own commands:

```js
module.exports.config = {
  name: "yourcommand",
  version: "1.0.0",
  hasPermission: 0, // 0: user, 1: group admin, 2: bot admin
  credits: "Your Name",
  description: "Describe what your command does",
  usePrefix: true,
  commandCategory: "category",
  usages: "[usage details]",
  cooldowns: 5,
  aliases: ["alias1", "alias2"]
};

module.exports.run = async function({ api, event, args, getText }) {
  // Your command logic here
  api.sendMessage("Hello from yourcommand!", event.threadID, event.messageID);
};

module.exports.languages = {
  en: {
    example: "This is an example message."
  }
};
```

**How to use:**
- Copy the template above into a new file in `src/commands/`
- Update the config and logic as needed
- Restart the bot to load your new command

**Features supported:**
- Aliases for commands
- Permission levels (user, group admin, bot admin)
- Cooldowns
- Multi-language support
- Custom categories



## ⚙️ Configuration

### Language Settings
```json
{
  "language": "en",  // "en" for English, "bn" for Bengali
  "PREFIX": "!",     // Command prefix
  "adminOnly": false // Set to true to restrict bot to admins only
}
```

### Security Settings
```json
{
  "encryptSt": true,  // Enable appstate encryption
  "ADMINBOT": ["YOUR_FACEBOOK_UID"]  // Admin UIDs
}
```

## 🔒 Security

- Enable `encryptSt` in config.json for enhanced security
- Keep your `appstate.json` private
- Regularly update your bot and dependencies
- Use environment variables for sensitive data

## 🔄 Latest Updates

- Upgraded to W3S-FCA for improved stability
- Enhanced security features
- Added command aliases support
- Improved error handling
- Bug fixes and performance improvements

## 💬 Support

- [Join our Telegram](https://t.me/Grandpa_Academy)
- [Subscribe on YouTube](https://www.youtube.com/@Grandpa_Academy)
- [Follow on Facebook](https://www.facebook.com/ebtisam.jubair)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

Please read our [Contributing Guidelines](CONTRIBUTING.md) for details.

---

## How To Use?
1. Clone this repo:
   ```bash
   git clone https://github.com/GrandpaAcademy/Cyber-Bot-v2.git

   cd Cyber-Bot-v2
   ```
2. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```
3. Run the bot:
   ```bash
   node index.js

   #or

   npm start
   ```
## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<p align="center">Made with 💖 by <a href="https://github.com/GrandpaAcademy">Grandpa Academy</a></p>

<p align="center">
  Copyright © 2025 
  <a href="https://github.com/GrandpaAcademy">Grandpa Academy</a> |
  <a href="https://github.com/GrandpaAcademy/Cyber-Bot-v2">Cyber Bot</a>
</p>
