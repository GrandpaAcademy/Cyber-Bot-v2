const axios = require("axios");
const fs = require("fs-extra");

module.exports.config = {
  name: "coupledp",
  version: "1.0",
  haspermission: 0,
  credit: "Loid Butter",
  cooldown: 5,
  description: "couple dp",
  commandCategory: "image",
  userPrefix: true,
  usage: "coupledp @mention",
  dependencies: {
    axios: "",
  },
};

module.exports.run = async function ({ api, event, args }) {
  try {
    const { data } = await axios.get(
      "https://tanjiro-api.onrender.com/cdp?api_key=tanjiro"
    );
    const maleImg = await axios.get(data.male, { responseType: "arraybuffer" });
    fs.writeFileSync(
      __dirname + "/cache/img1.png",
      Buffer.from(maleImg.data, "utf-8")
    );
    const femaleImg = await axios.get(data.female, {
      responseType: "arraybuffer",
    });
    fs.writeFileSync(
      __dirname + "/cache/img2.png",
      Buffer.from(femaleImg.data, "utf-8")
    );

    const msg = "Here is your couple dp";
    const allImages = [
      fs.createReadStream(__dirname + "/cache/img1.png"),
      fs.createReadStream(__dirname + "/cache/img2.png"),
    ];

    return api.sendMessage(
      {
        body: msg,
        attachment: allImages,
      },
      event.threadID,
      event.messageID
    );
  } catch (error) {
    console.error(error);
  }
};
