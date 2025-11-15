const axios = require("axios");
const fs = require("fs-extra");

module.exports.config = {
  name: "waifu",
  version: "1.0",
  haspermission: 0,
  credit: "Cyber Bot v2",
  cooldown: 5,
  description: "Get random waifu images",
  commandCategory: "image",
  usePrefix: true,
  usage: "waifu [number 1-30]",
  dependencies: {
    axios: "",
  },
};

module.exports.run = async function ({ api, event, args }) {
  try {
    let amount = parseInt(args[0]);
    if (isNaN(amount) || amount < 1) amount = 5;
    amount = Math.min(amount, 30);

    const { data } = await axios.post(
      "https://api.waifu.pics/many/sfw/waifu",
      { exclude: [], amount: amount }
    );
    const allImages = [];
    for (let i = 0; i < Math.min(data.files.length, amount); i++) {
      const img = await axios.get(data.files[i], { responseType: "arraybuffer" });
      const filePath = __dirname + `/cache/waifu_${i}.png`;
      fs.writeFileSync(filePath, Buffer.from(img.data));
      allImages.push(fs.createReadStream(filePath));
    }

    const msg = `Here are your ${allImages.length} waifu images`;
    return api.sendMessage(
      {
        body: msg,
        attachment: allImages,
      },
      event.threadID,
      () => {
        // Clean cache files
        for (let i = 0; i < allImages.length; i++) {
          try {
            fs.unlinkSync(__dirname + `/cache/waifu_${i}.png`);
          } catch (err) {
            console.error('Error deleting cache file:', err);
          }
        }
      },
      event.messageID
    );
  } catch (error) {
    console.error(error);
    api.sendMessage("Error fetching waifu images. Please try again later.", event.threadID, event.messageID);
  }
};
