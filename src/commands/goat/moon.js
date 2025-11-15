const moment = require("moment-timezone");
const fs = require("fs-extra");
const axios = require("axios");
const Canvas = require("canvas");
const path = require("path");

module.exports = {
	config: {
		name: "moon",
		version: "1.5",
		author: "NTKhang, dubbed: Kilo",
		countDown: 5,
		role: 0,
		description: {
			bn: "apnar pasand kora rate chand er chobi dekhen (dd/mm/yyyy)",
			en: "view moon image on the night you choose (dd/mm/yyyy)"
		},
		commandCategory: "image",
		usePrefix: true,
		guide: {
			bn: "  {pn} <din/mas/bochor>"
				+ "\n   {pn} <din/mas/bochor> <caption>",
			en: "  {pn} <day/month/year>"
				+ "\n   {pn} <day/month/year> <caption>"
		}
	},

	languages: {
		bn: {
			invalidDateFormat: "Ekta valid date din DD/MM/YYYY format e",
			error: "%1 tarikh er chand er chobi ante error hoyeche",
			invalidDate: "%1 ekta valid date na",
			caption: "- %1 rate chand er chobi"
		},
		en: {
			invalidDateFormat: "Please enter a valid date in DD/MM/YYYY format",
			error: "An error occurred while getting the moon image of %1",
			invalidDate: "%1 is not a valid date",
			caption: "- Moon image on %1"
		}
	},

	onStart: async function ({ args, message, getLang }) {
		const getText = getLang || ((key, ...args) => {
			const lang = this.languages.en;
			let text = lang[key] || key;
			args.forEach((arg, i) => {
				text = text.replace(`%${i + 1}`, arg);
			});
			return text;
		});

		const date = checkDate(args[0]);
		if (!date)
			return message.reply(getText("invalidDateFormat"));

		// Calculate moon phase based on date
		const [year, month, day] = date.split('/');
		const phaseNumber = calculateMoonPhase(parseInt(year), parseInt(month), parseInt(day));
		
		const imgSrc = moonImages[phaseNumber];
		
		try {
			const { data: imgSrcBuffer } = await axios.get(imgSrc, {
				responseType: "arraybuffer",
				timeout: 10000
			});

			const moonPhaseNames = [
				"New Moon", "Waxing Crescent", "Waxing Crescent", "Waxing Crescent",
				"First Quarter", "Waxing Gibbous", "Waxing Gibbous", "Waxing Gibbous",
				"Full Moon", "Waning Gibbous", "Waning Gibbous", "Waning Gibbous",
				"Last Quarter", "Waning Crescent", "Waning Crescent", "Waning Crescent"
			];

			const phaseName = moonPhaseNames[Math.floor(phaseNumber / 2)] || "Moon Phase";
			const illumination = Math.round((1 - Math.abs((phaseNumber - 16) / 16)) * 100);

			const msg = getText("caption", args[0])
				+ `\n- Phase: ${phaseName}`
				+ `\n- Illumination: ${illumination}%`
				+ `\n- Date: ${day}/${month}/${year}`;

			if (args[1]) {
				// Create canvas with caption
				const canvas = Canvas.createCanvas(1080, 2400);
				const ctx = canvas.getContext("2d");
				ctx.fillStyle = "black";
				ctx.fillRect(0, 0, 1080, 2400);

				const moon = await Canvas.loadImage(imgSrcBuffer);
				centerImage(ctx, moon, 1080 / 2, 2400 / 2, 970, 970);

				ctx.font = "60px Arial";
				const wrapText = getLines(ctx, args.slice(1).join(" "), 594);
				ctx.textAlign = "center";
				ctx.fillStyle = "white";

				const yStartText = 2095;
				let heightText = yStartText - wrapText.length / 2 * 75;
				for (const text of wrapText) {
					ctx.fillText(text, 540, heightText);
					heightText += 75;
				}

				// Ensure tmp directory exists
				const tmpDir = path.join(__dirname, "tmp");
				if (!fs.existsSync(tmpDir)) {
					fs.mkdirSync(tmpDir, { recursive: true });
				}

				const pathSave = path.join(tmpDir, `wallMoon_${Date.now()}.png`);
				fs.writeFileSync(pathSave, canvas.toBuffer());
				
				message.reply({
					body: msg,
					attachment: fs.createReadStream(pathSave)
				}, () => {
					setTimeout(() => {
						try {
							if (fs.existsSync(pathSave)) {
								fs.unlinkSync(pathSave);
							}
						} catch (err) {
							console.error("Error cleaning up moon image:", err);
						}
					}, 5000);
				});
			}
			else {
				// Send image directly
				const tmpDir = path.join(__dirname, "tmp");
				if (!fs.existsSync(tmpDir)) {
					fs.mkdirSync(tmpDir, { recursive: true });
				}

				const pathSave = path.join(tmpDir, `moon_${Date.now()}.png`);
				fs.writeFileSync(pathSave, imgSrcBuffer);

				message.reply({
					body: msg,
					attachment: fs.createReadStream(pathSave)
				}, () => {
					setTimeout(() => {
						try {
							if (fs.existsSync(pathSave)) {
								fs.unlinkSync(pathSave);
							}
						} catch (err) {
							console.error("Error cleaning up moon image:", err);
						}
					}, 5000);
				});
			}
		} catch (err) {
			console.error("Moon command error:", err);
			return message.reply(getText("error", args[0]));
		}
	}
};

function getLines(ctx, text, maxWidth) {
	const words = text.split(" ");
	const lines = [];
	let currentLine = words[0];
	for (let i = 1; i < words.length; i++) {
		const word = words[i];
		const width = ctx.measureText(`${currentLine} ${word}`).width;
		if (width < maxWidth) {
			currentLine += " " + word;
		}
		else {
			lines.push(currentLine);
			currentLine = word;
		}
	}
	lines.push(currentLine);
	return lines;
}

function centerImage(ctx, img, x, y, sizeX, sizeY) {
	ctx.drawImage(img, x - sizeX / 2, y - sizeY / 2, sizeX, sizeY);
}

function checkDate(date) {
	const [day0, month0, year0] = (date || "").split('/');
	const day = (day0 || "").length == 1 ? "0" + day0 : day0;
	const month = (month0 || "").length == 1 ? "0" + month0 : month0;
	const year = year0 || "";
	const newDateFormat = year + "/" + month + "/" + day;
	return moment(newDateFormat, 'YYYY/MM/DD', true).isValid() ? newDateFormat : false;
}

function calculateMoonPhase(year, month, day) {
	// Calculate moon phase using astronomical algorithm
	let c, e, jd, b;

	if (month < 3) {
		year--;
		month += 12;
	}

	++month;
	c = 365.25 * year;
	e = 30.6 * month;
	jd = c + e + day - 694039.09; // Julian date relative to Jan 1, 2000
	jd /= 29.5305882; // Divide by the Moon cycle
	b = parseInt(jd); // Integer part
	jd -= b; // Decimal part
	b = Math.round(jd * 32); // Scale fraction from 0-32

	if (b === 32) b = 0;

	return b;
}

const moonImages = [
	'https://i.ibb.co/9shyYH1/moon-0.png',
	'https://i.ibb.co/vBXLL37/moon-1.png',
	'https://i.ibb.co/0QCKK9D/moon-2.png',
	'https://i.ibb.co/Dp62X2j/moon-3.png',
	'https://i.ibb.co/xFKCtfd/moon-4.png',
	'https://i.ibb.co/m4L533L/moon-5.png',
	'https://i.ibb.co/VmshdMN/moon-6.png',
	'https://i.ibb.co/4N7R2B2/moon-7.png',
	'https://i.ibb.co/C2k4YB8/moon-8.png',
	'https://i.ibb.co/F62wHxP/moon-9.png',
	'https://i.ibb.co/Gv6R1mk/moon-10.png',
	'https://i.ibb.co/0ZYY7Kk/moon-11.png',
	'https://i.ibb.co/KqXC5F5/moon-12.png',
	'https://i.ibb.co/BGtLpRJ/moon-13.png',
	'https://i.ibb.co/jDn7pPx/moon-14.png',
	'https://i.ibb.co/kykn60t/moon-15.png',
	'https://i.ibb.co/qD4LFLs/moon-16.png',
	'https://i.ibb.co/qJm9gcQ/moon-17.png',
	'https://i.ibb.co/yYFYZx9/moon-18.png',
	'https://i.ibb.co/8bc7vpZ/moon-19.png',
	'https://i.ibb.co/jHG7DKs/moon-20.png',
	'https://i.ibb.co/5WD18Rn/moon-21.png',
	'https://i.ibb.co/3Y06yHM/moon-22.png',
	'https://i.ibb.co/4T8Zdfy/moon-23.png',
	'https://i.ibb.co/n1CJyP4/moon-24.png',
	'https://i.ibb.co/zFwJRqz/moon-25.png',
	'https://i.ibb.co/gVBmMCW/moon-26.png',
	'https://i.ibb.co/hRY89Hn/moon-27.png',
	'https://i.ibb.co/7C13s7Z/moon-28.png',
	'https://i.ibb.co/2hDTwB4/moon-29.png',
	'https://i.ibb.co/Rgj9vpj/moon-30.png',
	'https://i.ibb.co/s5z0w9R/moon-31.png'
];
