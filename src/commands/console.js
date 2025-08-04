module.exports.config = {
    name: "console",
    version: "1.0.0",
    hasPermssion: 3,
    credits: "MAHBUB SHAON",
    description: "Make the console more beautiful",
    commandCategory: "Admin-bot system",
    usages: "console ",
    cooldowns: 0
};
module.exports.handleEvent = async function ({ api, args, Users, event, Threads, utils, client }) {
    let { messageID, threadID, senderID, mentions } = event;
    const chalk = require('chalk');
     const moment = require("moment-timezone");
var time= moment.tz("Asia/Kolkata").format("LLLL");   
  const thread = global.data.threadData.get(event.threadID) || {};
  if (typeof thread["console"] !== "undefined" && thread["console"] == true) return;
  if (event.senderID == global.data.botID) return;
  var nameBox = global.data.threadInfo.get(event.threadID).threadName || "Name does not exist";
  var nameUser = await Users.getNameUser(event.senderID)
    var msg = event.body||"Photos, videos or special characters";
    var job = ["FF9900", "FFFF33", "33FFFF", "FF99FF", "FF3366", "FFFF66", "FF00FF", "66FF99", "00CCFF", "FF0099", "FF0066", "7900FF", "93FFD8", "CFFFDC", "FF5B00", "3B44F6", "A6D1E6", "7F5283", "A66CFF", "F05454", "FCF8E8", "94B49F", "47B5FF", "B8FFF9", "42C2FF", "FF7396"];
    var random = 
job[Math.floor(Math.random() * job.length)]      
    var random1 = job[Math.floor(Math.random() * job.length)]
   var random2 = job[Math.floor(Math.random() * job.length)]
  var random3 = job[Math.floor(Math.random() * job.length)]
  var random4 = job[Math.floor(Math.random() * job.length)]
  var random5 = job[Math.floor(Math.random() * job.length)]
  var random6 = job[Math.floor(Math.random() * job.length)]
    console.log(chalk.hex("#" + random)(`[☢️]→ Group name: ${nameBox}`) + `\n` + chalk.hex("#" + random5)(`[🔎]→ Group ID: ${event.threadID}`) + `\n` + chalk.hex("#" + random6)(`[✨]→ User name: ${nameUser}`) + `\n` + chalk.hex("#" + random1)(`[📝]→ User ID: ${event.senderID}`) + `\n` + chalk.hex("#" + random2)(`[📩]→ Content: ${msg}`) + `\n` + chalk.hex("#" + random3)(`[ ${time} ]`) + `\n` + chalk.hex("#" + random4)(`◆━━━━━━━━━◆𝐂𝐘𝐁𝐄𝐑 𝐁𝐎𝐓 𝐕𝟐◆━━━━━━━━◆\n`)); 
}
module.exports.languages = {
  "vi": {"on": "Bật","off": "Tắt","successText": "console thành công",},
  "en": {"on": "on","off": "off","successText": "console success!",}
}

module.exports.run = async function ({ api, event, Threads, getText }) {
  const { threadID, messageID } = event;
  let data = (await Threads.getData(threadID)).data;
  if (typeof data["console"] == "undefined" || data["console"] == true) data["console"] = false;
  else data["console"] = true;
  await Threads.setData(threadID, { data });
  global.data.threadData.set(threadID, data);
  return api.sendMessage(`${(data["console"] == false) ? getText("on") : getText("off")} ${getText("successText")}`, threadID, messageID);
}
