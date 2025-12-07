module.exports = {
  config: {
    name: "pair2",
    version: "1.0",
    author: "ST | Sheikh Tamim",
    countDown: 5,
    role: 0,
    description: "Pair with someone special with beautiful design",
    commandCategory: "fun",
    usePrefix:true,
    guide: "{pn} @mention\n{pn} reply\n{pn} (random pair)"
  },
  onStart: async function({ message, args, event, api, usersData, threadsData }) {
    const { createCanvas, loadImage } = require('canvas');
    const fs = require('fs-extra');
    const path = require('path');
    const axios = require('axios');

    try {
      let targetUID;
      let targetName;
      let senderUID = event.senderID;
      let senderName = await usersData.getName(senderUID);

      if (Object.keys(event.mentions).length > 0) {
        targetUID = Object.keys(event.mentions)[0];
        targetName = event.mentions[targetUID];
      }
      else if (event.messageReply) {
        targetUID = event.messageReply.senderID;
        targetName = await usersData.getName(targetUID);
      }
      else {
        const threadInfo = await threadsData.get(event.threadID);
        const participantIDs = threadInfo.members.map(member => member.userID).filter(id => id !== senderUID);
        
        if (participantIDs.length === 0) {
          return message.reply("❌ No other members in this group to pair with!");
        }
        
        targetUID = participantIDs[Math.floor(Math.random() * participantIDs.length)];
        targetName = await usersData.getName(targetUID);
      }

      if (targetUID === senderUID) {
        return message.reply("❌ You cannot pair with yourself! 😅");
      }

      const lovePercent = Math.floor(Math.random() * 101);
      
      let loveMessage;
      if (lovePercent >= 90) {
        loveMessage = "They Love Forever! 💖✨";
      } else if (lovePercent >= 70) {
        loveMessage = "They Love Forever! 💕";
      } else if (lovePercent >= 50) {
        loveMessage = "They Love Forever! 💗";
      } else if (lovePercent >= 30) {
        loveMessage = "They Love Forever! 💓";
      } else {
        loveMessage = "They Love Forever! 💙";
      }

      const senderAvatarUrl = `https://graph.facebook.com/${senderUID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
      const targetAvatarUrl = `https://graph.facebook.com/${targetUID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

      const cachePath = path.join(__dirname, '..', '..', 'cache');
      await fs.ensureDir(cachePath);

      const senderAvatarPath = path.join(cachePath, `sender_${Date.now()}.png`);
      const targetAvatarPath = path.join(cachePath, `target_${Date.now()}.png`);

      const senderAvatar = await axios.get(senderAvatarUrl, { responseType: 'arraybuffer' });
      const targetAvatar = await axios.get(targetAvatarUrl, { responseType: 'arraybuffer' });

      await fs.writeFile(senderAvatarPath, Buffer.from(senderAvatar.data));
      await fs.writeFile(targetAvatarPath, Buffer.from(targetAvatar.data));

      const designType = Math.floor(Math.random() * 15) + 1;

      const canvas = createCanvas(1200, 700);
      const ctx = canvas.getContext('2d');

      const senderImg = await loadImage(senderAvatarPath);
      const targetImg = await loadImage(targetAvatarPath);

      if (designType === 1) {
        const gradient = ctx.createLinearGradient(0, 0, 1200, 700);
        gradient.addColorStop(0, '#ff9a9e');
        gradient.addColorStop(0.5, '#fad0c4');
        gradient.addColorStop(1, '#ffecd2');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1200, 700);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        for (let i = 0; i < 20; i++) {
          const x = Math.random() * 1200;
          const y = Math.random() * 700;
          const size = Math.random() * 30 + 10;
          ctx.font = `${size}px Arial`;
          ctx.fillText('💕', x, y);
        }

        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 20;
        ctx.fillRect(100, 80, 1000, 540);
        ctx.shadowBlur = 0;

        const headerGradient = ctx.createLinearGradient(100, 80, 1100, 120);
        headerGradient.addColorStop(0, '#ff6b6b');
        headerGradient.addColorStop(1, '#ee5a6f');
        ctx.fillStyle = headerGradient;
        ctx.fillRect(100, 80, 1000, 80);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('💝 LOVE PAIR METER 💝', 600, 135);
      }
      else if (designType === 2) {
        const gradient = ctx.createLinearGradient(0, 0, 1200, 700);
        gradient.addColorStop(0, '#4a00e0');
        gradient.addColorStop(0.5, '#8e2de2');
        gradient.addColorStop(1, '#da22ff');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1200, 700);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        for (let i = 0; i < 30; i++) {
          ctx.beginPath();
          ctx.arc(Math.random() * 1200, Math.random() * 700, Math.random() * 3, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.shadowColor = 'rgba(138, 43, 226, 0.5)';
        ctx.shadowBlur = 30;
        ctx.fillRect(100, 80, 1000, 540);
        ctx.shadowBlur = 0;

        const headerGradient = ctx.createLinearGradient(100, 80, 1100, 120);
        headerGradient.addColorStop(0, '#8e2de2');
        headerGradient.addColorStop(1, '#4a00e0');
        ctx.fillStyle = headerGradient;
        ctx.fillRect(100, 80, 1000, 80);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('💜 ETERNAL LOVE 💜', 600, 135);
      }
      else if (designType === 3) {
        const gradient = ctx.createLinearGradient(0, 0, 1200, 700);
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(0.5, '#764ba2');
        gradient.addColorStop(1, '#f093fb');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1200, 700);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        for (let i = 0; i < 15; i++) {
          ctx.font = `${Math.random() * 40 + 20}px Arial`;
          ctx.fillText('💙', Math.random() * 1200, Math.random() * 700);
        }

        ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
        ctx.shadowColor = 'rgba(102, 126, 234, 0.4)';
        ctx.shadowBlur = 25;
        ctx.fillRect(100, 80, 1000, 540);
        ctx.shadowBlur = 0;

        const headerGradient = ctx.createLinearGradient(100, 80, 1100, 120);
        headerGradient.addColorStop(0, '#667eea');
        headerGradient.addColorStop(1, '#764ba2');
        ctx.fillStyle = headerGradient;
        ctx.fillRect(100, 80, 1000, 80);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('💙 SOULMATES 💙', 600, 135);
      }
      else if (designType === 4) {
        const gradient = ctx.createLinearGradient(0, 0, 1200, 700);
        gradient.addColorStop(0, '#fa709a');
        gradient.addColorStop(0.5, '#fee140');
        gradient.addColorStop(1, '#fa709a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1200, 700);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
        for (let i = 0; i < 25; i++) {
          ctx.font = `${Math.random() * 35 + 15}px Arial`;
          ctx.fillText('🧡', Math.random() * 1200, Math.random() * 700);
        }

        ctx.fillStyle = 'rgba(255, 255, 255, 0.93)';
        ctx.shadowColor = 'rgba(250, 112, 154, 0.45)';
        ctx.shadowBlur = 22;
        ctx.fillRect(100, 80, 1000, 540);
        ctx.shadowBlur = 0;

        const headerGradient = ctx.createLinearGradient(100, 80, 1100, 120);
        headerGradient.addColorStop(0, '#fa709a');
        headerGradient.addColorStop(1, '#fee140');
        ctx.fillStyle = headerGradient;
        ctx.fillRect(100, 80, 1000, 80);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🧡 TRUE LOVE 🧡', 600, 135);
      }
      else if (designType === 5) {
        const gradient = ctx.createLinearGradient(0, 0, 1200, 700);
        gradient.addColorStop(0, '#a8edea');
        gradient.addColorStop(0.5, '#fed6e3');
        gradient.addColorStop(1, '#a8edea');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1200, 700);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        for (let i = 0; i < 18; i++) {
          ctx.font = `${Math.random() * 38 + 18}px Arial`;
          ctx.fillText('💚', Math.random() * 1200, Math.random() * 700);
        }

        ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
        ctx.shadowColor = 'rgba(168, 237, 234, 0.5)';
        ctx.shadowBlur = 28;
        ctx.fillRect(100, 80, 1000, 540);
        ctx.shadowBlur = 0;

        const headerGradient = ctx.createLinearGradient(100, 80, 1100, 120);
        headerGradient.addColorStop(0, '#a8edea');
        headerGradient.addColorStop(1, '#fed6e3');
        ctx.fillStyle = headerGradient;
        ctx.fillRect(100, 80, 1000, 80);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('💚 PERFECT MATCH 💚', 600, 135);
      }
      else if (designType === 6) {
        const gradient = ctx.createLinearGradient(0, 0, 1200, 700);
        gradient.addColorStop(0, '#eb3349');
        gradient.addColorStop(0.5, '#f45c43');
        gradient.addColorStop(1, '#eb3349');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1200, 700);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.32)';
        for (let i = 0; i < 22; i++) {
          ctx.font = `${Math.random() * 36 + 16}px Arial`;
          ctx.fillText('❤️', Math.random() * 1200, Math.random() * 700);
        }

        ctx.fillStyle = 'rgba(255, 255, 255, 0.96)';
        ctx.shadowColor = 'rgba(235, 51, 73, 0.42)';
        ctx.shadowBlur = 24;
        ctx.fillRect(100, 80, 1000, 540);
        ctx.shadowBlur = 0;

        const headerGradient = ctx.createLinearGradient(100, 80, 1100, 120);
        headerGradient.addColorStop(0, '#eb3349');
        headerGradient.addColorStop(1, '#f45c43');
        ctx.fillStyle = headerGradient;
        ctx.fillRect(100, 80, 1000, 80);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('❤️ FOREVER LOVE ❤️', 600, 135);
      }
      else if (designType === 7) {
        const gradient = ctx.createLinearGradient(0, 0, 1200, 700);
        gradient.addColorStop(0, '#fc5c7d');
        gradient.addColorStop(0.5, '#6a82fb');
        gradient.addColorStop(1, '#fc5c7d');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1200, 700);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.27)';
        for (let i = 0; i < 20; i++) {
          ctx.font = `${Math.random() * 32 + 14}px Arial`;
          ctx.fillText('💟', Math.random() * 1200, Math.random() * 700);
        }

        ctx.fillStyle = 'rgba(255, 255, 255, 0.91)';
        ctx.shadowColor = 'rgba(252, 92, 125, 0.48)';
        ctx.shadowBlur = 26;
        ctx.fillRect(100, 80, 1000, 540);
        ctx.shadowBlur = 0;

        const headerGradient = ctx.createLinearGradient(100, 80, 1100, 120);
        headerGradient.addColorStop(0, '#fc5c7d');
        headerGradient.addColorStop(1, '#6a82fb');
        ctx.fillStyle = headerGradient;
        ctx.fillRect(100, 80, 1000, 80);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('💟 DESTINED HEARTS 💟', 600, 135);
      }
      else if (designType === 8) {
        const gradient = ctx.createLinearGradient(0, 0, 1200, 700);
        gradient.addColorStop(0, '#f093fb');
        gradient.addColorStop(0.5, '#f5576c');
        gradient.addColorStop(1, '#f093fb');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1200, 700);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.29)';
        for (let i = 0; i < 24; i++) {
          ctx.font = `${Math.random() * 34 + 16}px Arial`;
          ctx.fillText('💖', Math.random() * 1200, Math.random() * 700);
        }

        ctx.fillStyle = 'rgba(255, 255, 255, 0.93)';
        ctx.shadowColor = 'rgba(240, 147, 251, 0.44)';
        ctx.shadowBlur = 23;
        ctx.fillRect(100, 80, 1000, 540);
        ctx.shadowBlur = 0;

        const headerGradient = ctx.createLinearGradient(100, 80, 1100, 120);
        headerGradient.addColorStop(0, '#f093fb');
        headerGradient.addColorStop(1, '#f5576c');
        ctx.fillStyle = headerGradient;
        ctx.fillRect(100, 80, 1000, 80);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('💖 LOVE BIRDS 💖', 600, 135);
      }
      else if (designType === 9) {
        const gradient = ctx.createLinearGradient(0, 0, 1200, 700);
        gradient.addColorStop(0, '#ff6a00');
        gradient.addColorStop(0.5, '#ee0979');
        gradient.addColorStop(1, '#ff6a00');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1200, 700);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.31)';
        for (let i = 0; i < 19; i++) {
          ctx.font = `${Math.random() * 37 + 17}px Arial`;
          ctx.fillText('💞', Math.random() * 1200, Math.random() * 700);
        }

        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.shadowColor = 'rgba(255, 106, 0, 0.46)';
        ctx.shadowBlur = 27;
        ctx.fillRect(100, 80, 1000, 540);
        ctx.shadowBlur = 0;

        const headerGradient = ctx.createLinearGradient(100, 80, 1100, 120);
        headerGradient.addColorStop(0, '#ff6a00');
        headerGradient.addColorStop(1, '#ee0979');
        ctx.fillStyle = headerGradient;
        ctx.fillRect(100, 80, 1000, 80);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('💞 TWIN FLAMES 💞', 600, 135);
      }
      else if (designType === 10) {
        const gradient = ctx.createLinearGradient(0, 0, 1200, 700);
        gradient.addColorStop(0, '#30cfd0');
        gradient.addColorStop(0.5, '#330867');
        gradient.addColorStop(1, '#30cfd0');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1200, 700);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.26)';
        for (let i = 0; i < 21; i++) {
          ctx.font = `${Math.random() * 33 + 15}px Arial`;
          ctx.fillText('💝', Math.random() * 1200, Math.random() * 700);
        }

        ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
        ctx.shadowColor = 'rgba(48, 207, 208, 0.47)';
        ctx.shadowBlur = 25;
        ctx.fillRect(100, 80, 1000, 540);
        ctx.shadowBlur = 0;

        const headerGradient = ctx.createLinearGradient(100, 80, 1100, 120);
        headerGradient.addColorStop(0, '#30cfd0');
        headerGradient.addColorStop(1, '#330867');
        ctx.fillStyle = headerGradient;
        ctx.fillRect(100, 80, 1000, 80);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('💝 ENDLESS LOVE 💝', 600, 135);
      }
      else if (designType === 11) {
        const gradient = ctx.createLinearGradient(0, 0, 1200, 700);
        gradient.addColorStop(0, '#ff0844');
        gradient.addColorStop(0.5, '#ffb199');
        gradient.addColorStop(1, '#ff0844');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1200, 700);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.33)';
        for (let i = 0; i < 23; i++) {
          ctx.font = `${Math.random() * 34 + 16}px Arial`;
          ctx.fillText('❣️', Math.random() * 1200, Math.random() * 700);
        }

        ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
        ctx.shadowColor = 'rgba(255, 8, 68, 0.44)';
        ctx.shadowBlur = 26;
        ctx.fillRect(100, 80, 1000, 540);
        ctx.shadowBlur = 0;

        const headerGradient = ctx.createLinearGradient(100, 80, 1100, 120);
        headerGradient.addColorStop(0, '#ff0844');
        headerGradient.addColorStop(1, '#ffb199');
        ctx.fillStyle = headerGradient;
        ctx.fillRect(100, 80, 1000, 80);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('❣️ PASSIONATE LOVE ❣️', 600, 135);
      }
      else if (designType === 12) {
        const gradient = ctx.createLinearGradient(0, 0, 1200, 700);
        gradient.addColorStop(0, '#2193b0');
        gradient.addColorStop(0.5, '#6dd5ed');
        gradient.addColorStop(1, '#2193b0');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1200, 700);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
        for (let i = 0; i < 17; i++) {
          ctx.font = `${Math.random() * 36 + 18}px Arial`;
          ctx.fillText('💙', Math.random() * 1200, Math.random() * 700);
        }

        ctx.fillStyle = 'rgba(255, 255, 255, 0.93)';
        ctx.shadowColor = 'rgba(33, 147, 176, 0.46)';
        ctx.shadowBlur = 24;
        ctx.fillRect(100, 80, 1000, 540);
        ctx.shadowBlur = 0;

        const headerGradient = ctx.createLinearGradient(100, 80, 1100, 120);
        headerGradient.addColorStop(0, '#2193b0');
        headerGradient.addColorStop(1, '#6dd5ed');
        ctx.fillStyle = headerGradient;
        ctx.fillRect(100, 80, 1000, 80);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('💙 OCEAN LOVE 💙', 600, 135);
      }
      else if (designType === 13) {
        const gradient = ctx.createLinearGradient(0, 0, 1200, 700);
        gradient.addColorStop(0, '#d53369');
        gradient.addColorStop(0.5, '#daae51');
        gradient.addColorStop(1, '#d53369');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1200, 700);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.30)';
        for (let i = 0; i < 20; i++) {
          ctx.font = `${Math.random() * 35 + 17}px Arial`;
          ctx.fillText('💛', Math.random() * 1200, Math.random() * 700);
        }

        ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
        ctx.shadowColor = 'rgba(213, 51, 105, 0.45)';
        ctx.shadowBlur = 25;
        ctx.fillRect(100, 80, 1000, 540);
        ctx.shadowBlur = 0;

        const headerGradient = ctx.createLinearGradient(100, 80, 1100, 120);
        headerGradient.addColorStop(0, '#d53369');
        headerGradient.addColorStop(1, '#daae51');
        ctx.fillStyle = headerGradient;
        ctx.fillRect(100, 80, 1000, 80);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('💛 GOLDEN LOVE 💛', 600, 135);
      }
      else if (designType === 14) {
        const gradient = ctx.createLinearGradient(0, 0, 1200, 700);
        gradient.addColorStop(0, '#b92b27');
        gradient.addColorStop(0.5, '#1565c0');
        gradient.addColorStop(1, '#b92b27');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1200, 700);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.29)';
        for (let i = 0; i < 22; i++) {
          ctx.font = `${Math.random() * 33 + 15}px Arial`;
          ctx.fillText('💜', Math.random() * 1200, Math.random() * 700);
        }

        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.shadowColor = 'rgba(185, 43, 39, 0.47)';
        ctx.shadowBlur = 27;
        ctx.fillRect(100, 80, 1000, 540);
        ctx.shadowBlur = 0;

        const headerGradient = ctx.createLinearGradient(100, 80, 1100, 120);
        headerGradient.addColorStop(0, '#b92b27');
        headerGradient.addColorStop(1, '#1565c0');
        ctx.fillStyle = headerGradient;
        ctx.fillRect(100, 80, 1000, 80);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('💜 ROYAL LOVE 💜', 600, 135);
      }
      else {
        const gradient = ctx.createLinearGradient(0, 0, 1200, 700);
        gradient.addColorStop(0, '#e43a15');
        gradient.addColorStop(0.5, '#e65245');
        gradient.addColorStop(1, '#e43a15');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1200, 700);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.31)';
        for (let i = 0; i < 24; i++) {
          ctx.font = `${Math.random() * 37 + 19}px Arial`;
          ctx.fillText('🔥', Math.random() * 1200, Math.random() * 700);
        }

        ctx.fillStyle = 'rgba(255, 255, 255, 0.96)';
        ctx.shadowColor = 'rgba(228, 58, 21, 0.48)';
        ctx.shadowBlur = 28;
        ctx.fillRect(100, 80, 1000, 540);
        ctx.shadowBlur = 0;

        const headerGradient = ctx.createLinearGradient(100, 80, 1100, 120);
        headerGradient.addColorStop(0, '#e43a15');
        headerGradient.addColorStop(1, '#e65245');
        ctx.fillStyle = headerGradient;
        ctx.fillRect(100, 80, 1000, 80);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🔥 BURNING LOVE 🔥', 600, 135);
      }

      function drawCircularImage(img, x, y, radius) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img, x - radius, y - radius, radius * 2, radius * 2);
        ctx.restore();
        
        ctx.strokeStyle = '#ff6b6b';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.stroke();
      }

      drawCircularImage(senderImg, 300, 330, 100);
      drawCircularImage(targetImg, 900, 330, 100);

      ctx.font = 'bold 80px Arial';
      ctx.fillStyle = '#ff6b6b';
      ctx.textAlign = 'center';
      ctx.fillText('❤️', 600, 350);

      ctx.font = 'bold 28px Arial';
      ctx.fillStyle = '#333333';
      ctx.textAlign = 'center';
      
      const truncateName = (name) => name.length > 15 ? name.substring(0, 15) + '...' : name;
      
      ctx.fillText(truncateName(senderName), 300, 470);
      ctx.fillText(truncateName(targetName), 900, 470);

      const percentGradient = ctx.createLinearGradient(400, 500, 800, 580);
      percentGradient.addColorStop(0, '#ff6b6b');
      percentGradient.addColorStop(1, '#ee5a6f');
      ctx.fillStyle = percentGradient;
      ctx.fillRect(400, 500, 400, 80);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 42px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${lovePercent}%`, 600, 550);

      ctx.fillStyle = '#ff6b6b';
      ctx.font = 'bold 32px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(loveMessage, 600, 245);

      ctx.fillStyle = 'rgba(255, 107, 107, 0.1)';
      ctx.fillRect(100, 620, 1000, 80);
      
      ctx.fillStyle = '#ff6b6b';
      ctx.font = 'italic 22px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('💕 Developed by Rana Babu 💕', 600, 670);

      ctx.fillStyle = '#ff6b6b';
      const cornerSize = 40;
      
      ctx.beginPath();
      ctx.moveTo(100, 80);
      ctx.lineTo(100 + cornerSize, 80);
      ctx.lineTo(100, 80 + cornerSize);
      ctx.fill();
      
      ctx.beginPath();
      ctx.moveTo(1100, 80);
      ctx.lineTo(1100 - cornerSize, 80);
      ctx.lineTo(1100, 80 + cornerSize);
      ctx.fill();
      
      ctx.beginPath();
      ctx.moveTo(100, 620);
      ctx.lineTo(100 + cornerSize, 620);
      ctx.lineTo(100, 620 - cornerSize);
      ctx.fill();
      
      ctx.beginPath();
      ctx.moveTo(1100, 620);
      ctx.lineTo(1100 - cornerSize, 620);
      ctx.lineTo(1100, 620 - cornerSize);
      ctx.fill();

      const imagePath = path.join(cachePath, `pair_${Date.now()}.png`);
      const buffer = canvas.toBuffer('image/png');
      await fs.writeFile(imagePath, buffer);

      await message.reply({
        body: `💝 Love Pair Result!\n\n👤 ${senderName}\n💕 Paired with\n👤 ${targetName}\n\n💖 Love Score: ${lovePercent}%\n✨ ${loveMessage}\n\n━━━━━━━━━━━━━━━`,
        attachment: fs.createReadStream(imagePath)
      });

      await fs.unlink(imagePath);
      await fs.unlink(senderAvatarPath);
      await fs.unlink(targetAvatarPath);

    } catch (error) {
      message.reply(`❌ Error: ${error.message}`);
    }
  }
};