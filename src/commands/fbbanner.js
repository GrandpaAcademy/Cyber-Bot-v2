const { createCanvas } = require('canvas');

module.exports.config = {
  name: "fbbanner",
  version: "1.0.0",
  hasPermission: 0,
  credits: "Grandpa EJ",
  description: "Create Facebook banner with custom text",
  usePrefix: true,
  commandCategory: "utility",
  usages: '"name surname" -mail email -number phone -slog slogan',
  cooldowns: 10
};

module.exports.run = async function({ api, event, args }) {
  try {
    // Parse arguments
    let name = "";
    let email = "";
    let phone = "";
    let slogan = "";

    const input = args.join(" ");

    // Parse quoted name
    const nameMatch = input.match(/"([^"]+)"/);
    if (nameMatch) {
      name = nameMatch[1];
    }

    // Parse other parameters
    const emailMatch = input.match(/-mail\s+([^\s-]+)/);
    if (emailMatch) {
      email = emailMatch[1];
    }

    const phoneMatch = input.match(/-number\s+([^\s-]+)/);
    if (phoneMatch) {
      phone = phoneMatch[1];
    }

    const sloganMatch = input.match(/-slog\s+(.+)/);
    if (sloganMatch) {
      slogan = sloganMatch[1];
    }

    if (!name) {
      return api.sendMessage("Please provide a name in quotes. Usage: ?fbbanner \"name surname\" -mail email -number phone -slog slogan", event.threadID, event.messageID);
    }

    // Create banner image (Facebook banner size: 851x315)
    const width = 851;
    const height = 315;

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Set background
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(0, 0, width, height);

    // Add gradient overlay
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.3)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Add text elements
    const centerX = width / 2;
    let currentY = 80; // Adjusted for baseline

    // Name (large, centered)
    ctx.font = '64px sans-serif';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.fillText(name, centerX, currentY);
    currentY += 80;

    // Email
    if (email) {
      ctx.font = '32px sans-serif';
      ctx.fillText(`📧 ${email}`, centerX, currentY);
      currentY += 50;
    }

    // Phone
    if (phone) {
      ctx.fillText(`📱 ${phone}`, centerX, currentY);
      currentY += 50;
    }

    // Slogan
    if (slogan) {
      ctx.font = '24px sans-serif';
      ctx.fillText(slogan, centerX, currentY);
    }

    // Add some decorative elements
    // Top border
    ctx.fillStyle = 'rgba(255,255,255,0.39)';
    ctx.fillRect(0, 0, width, 2);

    // Bottom border
    ctx.fillRect(0, height - 2, width, 2);

    // Save and send
    const imagePath = `${__dirname}/../../cache/banner_${event.senderID}_${Date.now()}.png`;
    const buffer = canvas.toBuffer('image/png');
    const fs = require('fs');
    await fs.promises.writeFile(imagePath, buffer);
    const stream = fs.createReadStream(imagePath);

    stream.on('close', () => {
      fs.unlinkSync(imagePath);
    });

    api.sendMessage({
      body: `🎨 Facebook Banner created for ${name}!`,
      attachment: stream
    }, event.threadID, event.messageID);

  } catch (error) {
    console.error('Error creating banner:', error);
    api.sendMessage("An error occurred while creating the banner. Please try again.", event.threadID, event.messageID);
  }
};