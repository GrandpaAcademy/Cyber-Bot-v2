module.exports.config = {
  name: "ping",
  version: "1.0.0",
  hasPermission: 0,
  credits: "Grandpa EJ",
  description: "Check bot latency",
  usePrefix: true,
  commandCategory: "utility",
  usages: "",
  cooldowns: 5
};

module.exports.run = async function({ api, event }) {
  const latency = Date.now() - event.timestamp;
  api.sendMessage(`Pong! Latency: ${latency}ms`, event.threadID, event.messageID);
};