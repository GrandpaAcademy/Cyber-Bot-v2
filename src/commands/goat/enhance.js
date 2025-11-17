const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "cutouthd",
    aliases: ["enhance", "hdphoto"],
    version: "1.0",
    role: 0,
    author: "Chitron Bhattacharjee",
    commandCategory: "image",
    usePrefix: true,
    cooldowns: 10,
    shortDescription: {
      en: "Enhance image quality (unblur + upscale)",
    },
    longDescription: {
      en: "Uses Cutout Pro API to enhance photo quality and resolution",
    },
    guide: {
      en: "Reply to an image or provide URL with +cutouthd [output format (optional)]\nExample: +cutouthd jpg_90",
    },
  },

  onStart: async ({ api, event, args }) => {
    try {
      let imageUrl;
      const outputFormat = args[0] || "png"; // Default: png

      // Check for image source
      if (event.messageReply?.attachments?.[0]?.type === "photo") {
        imageUrl = event.messageReply.attachments[0].url;
      } else if (args[0]?.match(/^https?:\/\/.+\.(jpe?g|png|gif|bmp)/i)) {
        imageUrl = args[0];
      } else {
        return api.sendMessage(
          "🔍 Please reply to an image or provide an image URL",
          event.threadID
        );
      }

      // Download image
      const imageBuffer = (
        await axios.get(imageUrl, {
          responseType: "arraybuffer",
        })
      ).data;

      // Prepare API request
      const form = new FormData();
      form.append("file", imageBuffer, {
        filename: "input.jpg",
        contentType: "image/jpeg",
      });
      const apiUrl = `https://www.cutout.pro/api/v1/photoEnhance${
        outputFormat ? `?outputFormat=${outputFormat}` : ""
      }`;

      // Call API
      const { data } = await axios.post(apiUrl, form, {
        headers: {
          APIKEY: "db95b47632c54582b5bb24271de428bc",
          ...form.getHeaders(),
        },
        responseType: "arraybuffer",
      });

      // Ensure tmp directory exists
      const tmpDir = path.join(__dirname, "tmp");
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }

      // Save to tmp directory
      const outputPath = path.join(tmpDir, `enhanced_${Date.now()}.${outputFormat === "png" ? "png" : "jpg"}`);
      fs.writeFileSync(outputPath, data);

      // Verify image is valid
      const stats = fs.statSync(outputPath);
      if (stats.size === 0) {
        fs.unlinkSync(outputPath);
        throw new Error("Enhanced image is empty or damaged");
      }

      // Send result
      await api.sendMessage(
        {
          body: "🖼️ Enhanced HD Image",
          attachment: fs.createReadStream(outputPath),
        },
        event.threadID,
        event.messageID
      );

      // Clean up file after sending
      setTimeout(() => {
        try {
          if (fs.existsSync(outputPath)) {
            fs.unlinkSync(outputPath);
          }
        } catch (err) {
          console.error("Error cleaning up enhanced image:", err);
        }
      }, 10000);
    } catch (error) {
      console.error(error);
      let errorMsg = "❌ Error enhancing image";

      if (error.response?.status === 429) {
        errorMsg = "⚠️ API limit reached (try again later)";
      } else if (error.message.includes("timeout")) {
        errorMsg = "⌛ Processing took too long (try smaller image)";
      }

      api.sendMessage(errorMsg, event.threadID);
    }
  },
};
