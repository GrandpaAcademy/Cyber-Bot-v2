const axios = require("axios");

module.exports = {
	config: {
		name: "emojimix",
		version: "1.4",
		author: "NTKhang",
		countDown: 10,
		role: 0,
		description: "𝖼𝖺𝗆𝗉𝗎𝗋𝗄𝖺𝗇 𝖽𝗎𝖺 𝖾𝗆𝗈𝗃𝗂 𝗆𝖾𝗇𝗃𝖺𝖽𝗂 𝖿𝗈𝗍𝗈", 
		guide: { id: "{pn} <𝖾𝗆𝗈𝗍> <𝖾𝗆𝗈𝗍>" }, 
		commandCategory: "GAME",
		usePrefix:true,
	},

	langs: {
		id: {
			error: "𝖬𝖺𝖺𝖿 𝗍𝗎𝖺𝗇, 𝖾𝗆𝗈𝗍 %1 𝖽𝖺𝗇 %2 𝗀𝖺𝗄 𝖻𝗂𝗌𝖺 𝖽𝗂𝗌𝖺𝗍𝗎𝗂𝗇",
			success: "𝖭𝗂𝗁 𝗁𝖺𝗌𝗂𝗅 𝖽𝖺𝗋𝗂 𝖾𝗆𝗈𝗍 %1 𝖽𝖺𝗇 %2"
		}
	},

	onStart: async function ({ message, args, usersData, event }) {
const font = {"1": "𝟭", "2": "𝟮", "3": "𝟯", "4": "𝟰", "5": "𝟱", "6": "𝟲", "7": "𝟳", "8": "𝟴", "9": "𝟵", "0": "𝟬", a: "𝗮", b: "𝗯", c: "𝗰", d: "𝗱", e: "𝗲", f: "𝗳", g: "𝗴", h: "𝗵", i: "𝗶", j: "𝗷", k: "𝗸", l: "𝗹", m: "𝗺", n: "𝗻", o: "𝗼", p: "𝗽", q: "𝗾", r: "𝗿", s: "𝘀", t: "𝘁", u: "𝘂", v: "𝘃", w: "𝘄", x: "𝘅", y: "𝘆", z: "𝘇", A: "𝗔", B: "𝗕", C: "𝗖", D: "𝗗", E: "𝗘", F: "𝗙", G: "𝗚", H: "𝗛", I: "𝗜", J: "𝗝", K: "𝗞", L: "𝗟", M: "𝗠", N: "𝗡", O: "𝗢", P: "𝗣", Q: "𝗤", R: "𝗥", S: "𝗦", T: "𝗧", U: "𝗨", V: "𝗩", W: "𝗪", X: "𝗫", Y: "𝗬", Z: "𝗭"};
const { gender, name } = await usersData.get(event.senderID);
const names = name.split(" ")[0];
const nama = names.split('').map(char => font[char] || char).join('');
let kelamin = "";
if (gender == 1) { 
 kelamin += "-𝗰𝗵𝗮𝗻";
} else if (gender == 2) { 
 kelamin += "-𝗸𝘂𝗻";
} 
		const readStream = [];
		const emoji1 = args[0];
		const emoji2 = args[1];

		if (!emoji1 || !emoji2)
			return message.SyntaxError();

		const generate1 = await generateEmojimix(emoji1, emoji2);
		const generate2 = await generateEmojimix(emoji2, emoji1);

		if (generate1)
			readStream.push(generate1);
		if (generate2)
			readStream.push(generate2);

		if (readStream.length == 0)
			return message.reply(nama + kelamin + `, 𝗆𝖺𝖺𝗉 𝖾𝗆𝗈𝗃𝗂 ${emoji1} 𝖽𝖺𝗇 ${emoji2} 𝗍𝗂𝖽𝖺𝗄 𝖻𝗂𝗌𝖺 𝖽𝗂𝗌𝖺𝗍𝗎𝗂𝗇.`);

		message.reply({
			body: `${nama}${kelamin}, 𝗇𝗂𝗁 𝗁𝖺𝗌𝗂𝗅 𝖾𝗆𝗈𝗃𝗂 𝗄𝖺𝗆𝗎.`,
			attachment: readStream
		});
	}
};