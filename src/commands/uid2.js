module.exports.config = {
 name: "uid2",
 version: "1.0.0",
 hasPermssion: 0,
 credits: "MAHBUB SHAON × Ullash",
 description: "Get Facebook UID, inbox and profile link",
 commandCategory: "UID",
 cooldowns: 0
};

module.exports.run = async function({ event, api, args, client, Currencies, Users, utils, __GLOBAL }) {
 const fs = global.nodemodule["fs-extra"];
 const request = global.nodemodule["request"];
 const axios = global.nodemodule['axios']; 
 let uid;

 if (event.type == "message_reply") { 
 uid = event.messageReply.senderID;
 }

 else if (args.join().indexOf('@') !== -1) {
 uid = Object.keys(event.mentions)[0];
 }

 else if (args[0] && args[0].indexOf(".com/") !== -1) {
 uid = await api.getUID(args[0]);
 }

 else if (!args[0]) {
 uid = event.senderID;
 }

 const imagePath = `${__dirname}/cache/1.png`;
 const imageURL = `https://graph.facebook.com/${uid}/picture?height=1500&width=1500&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

 const callback = () => {
 api.sendMessage({
 body: `•┄┅════❁🌺❁════┅┄•\n\nAssalamu Alaikum!!🖤💫\n•—»✨User ID is: ${uid}\n\n•—»✨You can message them using this link: m.me/${uid}\n\n•—»✨Here is the Facebook profile link: https://www.facebook.com/profile.php?id=${uid}\n\n•┄┅════❁🌺❁════┅┄•`, 
 attachment: fs.createReadStream(imagePath)
 }, event.threadID, () => fs.unlinkSync(imagePath), event.messageID);
 };

 request(encodeURI(imageURL)).pipe(fs.createWriteStream(imagePath)).on('close', callback);
}
