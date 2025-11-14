const axios = require("axios");
const request = require("request");
const fs = require("fs-extra");
const moment = require("moment-timezone");
var conf = require("../../config.json");

module.exports.config = {
    name: "admin",
    version: "1.0.0",
    hasPermssion: 0,
    credits: `${conf.AuthorName}`,
    description: "Show Owner Info",
    commandCategory: "info",
    usages: "",
    cooldowns: 5,
    usePrefix: true
};

module.exports.run = async function({ api, event }) {
    var time = moment().tz("Asia/Dhaka").format("DD/MM/YYYY hh:mm:ss A");

    var callback = () => api.sendMessage({
        body: `
┏━━━━━━━━━━━━━━━━━━━━━┓
┃      🌟 𝗢𝗪𝗡𝗘𝗥 𝗜𝗡𝗙𝗢 🌟      
┣━━━━━━━━━━━━━━━━━━━━━┫
┃ 👤 𝐍𝐚𝐦𝐞      : ${conf.AuthorName}
┃ 🚹 𝐆𝐞𝐧𝐝𝐞𝐫    :  ${conf.AuthorGender}
┃ ❤️ 𝐑𝐞𝐥𝐚𝐭𝐢𝐨𝐧  : ${conf.AuthorReletionalStatus}
┃ 🎂 𝐀𝐠𝐞        : ${conf.AuthorAge}
┃ 🕌 𝐑𝐞𝐥𝐢𝐠𝐢𝐨𝐧  : ${conf.AuthorReligion}
┃ 🏫 𝐄𝐝𝐮𝐜𝐚𝐭𝐢𝐨𝐧 : None.
┃ 🏡 𝐀𝐝𝐝𝐫𝐞𝐬𝐬  : ${conf.AuthorLocation}
┣━━━━━━━━━━━━━━━━━━━━━┫
┃ 📢 𝐓𝐞𝐥𝐞𝐠𝐫𝐚𝐦 : ${conf.TelegramLink}
┃ 🌐 𝐅𝐚𝐜𝐞𝐛𝐨𝐨𝐤 : ${conf.FacebookLink}
┣━━━━━━━━━━━━━━━━━━━━━┫
┃ 🕒 𝐔𝐩𝐝𝐚𝐭𝐞𝐝 𝐓𝐢𝐦𝐞:  ${time}
┗━━━━━━━━━━━━━━━━━━━━━┛
        `,
        attachment: fs.createReadStream(__dirname + "/cache/1.png")
    }, event.threadID, () => fs.unlinkSync(__dirname + "/cache/1.png"));
  
    return request(encodeURI(`https://graph.facebook.com/${conf.AuthorID}/picture?height=720&width=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`))
        .pipe(fs.createWriteStream(__dirname + '/cache/1.png'))
        .on('close', () => callback());
};
