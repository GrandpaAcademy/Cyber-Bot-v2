const { createCanvas, loadImage } = require('canvas');
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
    name: "couple",
    version: "2.1.0",
    hasPermssion: 0,
    credits: "𝐂𝐘𝐁𝐄𝐑 ☢️_𖣘 -𝐁𝐎𝐓 ⚠️ 𝑻𝑬𝑨𝑴_ ☢️",
    description: "Couple pic maker",
    commandCategory: "Love",
    usages: "couple [tag] or couple [@mention | user_id]",
    cooldowns: 5,
    usePrefix: true,
    dependencies: {
        "canvas": "",
        "axios": "",
        "fs-extra": "",
        "path": ""
    }
};


async function downloadFile(url, filePath) {
    const response = await axios({
        method: 'GET',
        url: url,
        responseType: 'stream'
    });
    
    return new Promise((resolve, reject) => {
        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);
        
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
}

async function makeImage({ one, two }) {
    const __root = path.resolve(__dirname, "cache");
    const backgroundPath = path.resolve(__dirname, '../../assets/img/couple.jpeg');
    const avatarOnePath = __root + `/avt_${one}.png`;
    const avatarTwoPath = __root + `/avt_${two}.png`;
    const outputPath = __root + `/couple_${one}_${two}_${Date.now()}.png`;
    
    try {
        // Download Facebook profile pictures
        const avatarOneUrl = `https://graph.facebook.com/${one}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
        const avatarTwoUrl = `https://graph.facebook.com/${two}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
        
        const avatarOneResponse = await axios.get(avatarOneUrl, { responseType: 'arraybuffer' });
        const avatarTwoResponse = await axios.get(avatarTwoUrl, { responseType: 'arraybuffer' });
        
        fs.writeFileSync(avatarOnePath, Buffer.from(avatarOneResponse.data));
        fs.writeFileSync(avatarTwoPath, Buffer.from(avatarTwoResponse.data));
        
        // Load images
        const backgroundImg = await loadImage(backgroundPath);
        const avatarOneImg = await loadImage(avatarOnePath);
        const avatarTwoImg = await loadImage(avatarTwoPath);
        
        // Create canvas
        const canvas = createCanvas(1024, 712);
        const ctx = canvas.getContext('2d');
        
        // Draw background
        ctx.drawImage(backgroundImg, 0, 0, 1024, 712);
        
        // Function to draw circular avatar
        function drawCircularAvatar(img, x, y, size) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(x + size/2, y + size/2, size/2, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(img, x, y, size, size);
            ctx.restore();
        }
        
        // Draw avatars in circular shape
        drawCircularAvatar(avatarOneImg, 527, 141, 200); // First avatar position
        drawCircularAvatar(avatarTwoImg, 389, 407, 200); // Second avatar position
        
        // Add decorative elements
        // Draw hearts around the avatars
        drawHeart(ctx, 600, 100, 30);
        drawHeart(ctx, 450, 500, 25);
        drawHeart(ctx, 650, 300, 20);
        
        // Save the result
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(outputPath, buffer);
        
        // Clean up temporary files
        fs.unlinkSync(avatarOnePath);
        fs.unlinkSync(avatarTwoPath);
        
        return outputPath;
        
    } catch (error) {
        console.error('Error creating couple image:', error);
        // Clean up on error
        try {
            if (fs.existsSync(avatarOnePath)) fs.unlinkSync(avatarOnePath);
            if (fs.existsSync(avatarTwoPath)) fs.unlinkSync(avatarTwoPath);
        } catch (cleanupError) {
            console.error('Error cleaning up files:', cleanupError);
        }
        throw error;
    }
}

// Helper function to draw heart shape
function drawHeart(ctx, x, y, size) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(size / 100, size / 100);
    ctx.beginPath();
    ctx.moveTo(50, 35);
    ctx.bezierCurveTo(50, 35, 0, 47, 0, 65);
    ctx.bezierCurveTo(0, 80, 25, 100, 50, 120);
    ctx.bezierCurveTo(75, 100, 100, 80, 100, 65);
    ctx.bezierCurveTo(100, 47, 50, 35, 50, 35);
    ctx.closePath();
    ctx.restore();
}

module.exports.run = async function ({ event, api, args }) {
    const fs = global.nodemodule["fs-extra"];
    const { threadID, messageID, senderID } = event;
    
    try {
        var mention = Object.keys(event.mentions)[0];
        if (!mention) {
            return api.sendMessage("💕 Couple image bananor jonno ekjon ke tag korben!\n\n📝 Use: couple [@mention]", threadID, messageID);
        }
        
        let tag = event.mentions[mention].replace("@", "");
        var one = senderID, two = mention;
        
        // Show loading message
        const loadingMsg = await api.sendMessage("💕 Apnar jonno beautiful couple image banano hocche...", threadID);
        
        return makeImage({ one, two }).then(path => {
            // Delete loading message
            api.unsendMessage(loadingMsg.messageID);
            
            api.sendMessage({
                body: `💕 Apnar Couple Photo!\n\n👤 Tagged: @${tag}`,
                mentions: [{
                    tag: tag,
                    id: mention
                }],
                attachment: fs.createReadStream(path)
            }, threadID, () => {
                fs.unlinkSync(path);
            }, messageID);
        }).catch(error => {
            // Delete loading message on error
            api.unsendMessage(loadingMsg.messageID);
            
            console.error('Couple image creation failed:', error);
            api.sendMessage("❌ Image bananor somoy ekti error hoise. abar try korben!", threadID, messageID);
        });
        
    } catch (error) {
        console.error('Error in couple command:', error);
        return api.sendMessage("❌ Ekti error hoise. abar try korben!", threadID, messageID);
    }
};