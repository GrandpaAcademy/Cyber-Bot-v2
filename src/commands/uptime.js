module.exports.config = {
  name: "uptime",
  version: "1.0.0",
  hasPermission: 0,
  credits: "Grandpa EJ",
  description: "Check bot uptime",
  usePrefix: true,
  commandCategory: "utility",
  usages: "",
  cooldowns: 5
};

module.exports.run = async function({ api, event }) {
  const uptime = Date.now() - global.client.timeStart;
  const seconds = Math.floor(uptime / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  const uptimeString = `${days}d ${hours % 24}h ${minutes % 60}m ${seconds % 60}s`;
  api.sendMessage(`Bot has been running for: ${uptimeString}`, event.threadID, event.messageID);
};