const chalk = require("chalk");
const gradient = require("gradient-string");
const con = require("./../config.json");

function getThemeColors() {
  const theme = con.DESIGN.Theme;
  let subcolor, main, error, secondary, tertiary, html;

  switch (theme.toLowerCase()) {
    case "blue":
      main = gradient("yellow", "lime", "green"); // cra
      subcolor = gradient("#243aff", "#4687f0", "#5800d4"); // co
      secondary = chalk.blueBright; // cb
      tertiary = chalk.bold.hex("#3467eb"); // cv
      error = chalk.hex("#ff0000").bold;
      html = ["#1702CF", "#11019F ", "#1401BF"];
      break;
    case "fiery":
      main = gradient("orange", "orange", "yellow");
      subcolor = gradient("#fc2803", "#fc6f03", "#fcba03");
      secondary = chalk.hex("#fff308");
      tertiary = chalk.bold.hex("#fc3205");
      error = chalk.red.bold;
      html = ["#CE2F16", "#fe8916", "#ff952a"];
      break;
    case "red":
      main = gradient("yellow", "lime", "green");
      subcolor = gradient("red", "orange");
      secondary = chalk.hex("#ff0000");
      tertiary = chalk.bold.hex("#ff0000");
      error = chalk.red.bold;
      html = ["#ff0000", "#ff4747", "#ff0026"];
      break;
    case "aqua":
      main = gradient("#6883f7", "#8b9ff7", "#b1bffc");
      subcolor = gradient("#0030ff", "#4e6cf2");
      secondary = chalk.hex("#3056ff");
      tertiary = chalk.bold.hex("#0332ff");
      error = chalk.blueBright;
      html = ["#2e5fff", "#466deb", "#1BD4F5"];
      break;
    case "pink":
      main = gradient("purple", "pink");
      subcolor = gradient("#d94fff", "purple");
      secondary = chalk.hex("#6a00e3");
      tertiary = chalk.bold.hex("#6a00e3");
      error = gradient("purple", "pink");
      html = ["#ab68ed", "#ea3ef0", "#c93ef0"];
      break;
    case "retro":
      main = gradient("orange", "purple");
      subcolor = gradient.retro;
      secondary = chalk.hex("#ffce63");
      tertiary = chalk.bold.hex("#3c09ab");
      error = gradient("#d94fff", "purple");
      html = ["#7d02bf", "#FF6F6F", "#E67701"];
      break;
    case "sunlight":
      main = gradient("#f5bd31", "#f5e131");
      subcolor = gradient("orange", "#ffff00", "#ffe600");
      secondary = chalk.hex("#faf2ac");
      tertiary = chalk.bold.hex("#ffe600");
      error = gradient("#f5bd31", "#f5e131");
      html = ["#ffae00", "#ffbf00", "#ffdd00"];
      break;
    case "teen":
      main = gradient("#81fcf8", "#853858");
      subcolor = gradient.teen;
      secondary = chalk.hex("#a1d5f7");
      tertiary = chalk.bold.hex("#ad0042");
      error = gradient("#00a9c7", "#853858");
      html = ["#29D5FB", "#9CFBEF", "#fa7f7f"];
      break;
    case "summer":
      main = gradient("#fcff4d", "#4de1ff");
      subcolor = gradient.summer;
      secondary = chalk.hex("#ffff00");
      tertiary = chalk.bold.hex("#fff700");
      error = gradient("#fcff4d", "#4de1ff");
      html = ["#f7f565", "#16FAE3", "#16D1FA"];
      break;
    case "flower":
      main = gradient("yellow", "yellow", "#81ff6e");
      subcolor = gradient.pastel;
      secondary = gradient("#47ff00", "#47ff75");
      tertiary = chalk.bold.hex("#47ffbc");
      error = gradient("blue", "purple", "yellow", "#81ff6e");
      html = ["#16B6FA", "#FB7248", "#13FF9C"];
      break;
    case "ghost":
      main = gradient("#0a658a", "#0a7f8a", "#0db5aa");
      subcolor = gradient.mind;
      secondary = chalk.blueBright;
      tertiary = chalk.bold.hex("#1390f0");
      error = gradient("#0a658a", "#0a7f8a", "#0db5aa");
      html = ["#076889", "#0798C7", "#95d0de"];
      break;
    case "hacker":
      main = chalk.hex("#4be813");
      subcolor = gradient("#47a127", "#0eed19", "#27f231");
      secondary = chalk.hex("#22f013");
      tertiary = chalk.bold.hex("#0eed19");
      error = chalk.hex("#4be813");
      html = ["#049504", "#0eed19", "#01D101"];
      break;
    case "purple":
      main = chalk.hex("#7a039e");
      subcolor = gradient("#243aff", "#4687f0", "#5800d4");
      secondary = chalk.hex("#6033f2");
      tertiary = chalk.bold.hex("#5109eb");
      error = chalk.hex("#7a039e");
      html = ["#380478", "#5800d4", "#4687f0"];
      break;
    case "rainbow":
      main = chalk.hex("#0cb3eb");
      subcolor = gradient.rainbow;
      secondary = chalk.hex("#ff3908");
      tertiary = chalk.bold.hex("#f708ff");
      error = chalk.hex("#ff8400");
      html = ["#E203B2", "#06DBF7", "#F70606"];
      break;
    case "orange":
      main = chalk.hex("#ff8400");
      subcolor = gradient("#ff8c08", "#ffad08", "#f5bb47");
      secondary = chalk.hex("#ebc249");
      tertiary = chalk.bold.hex("#ff8c08");
      error = chalk.hex("#ff8400");
      html = ["#ff8c08", "#ffad08", "#f5bb47"];
      break;
    default:
      main = gradient("yellow", "lime", "green");
      subcolor = gradient("#243aff", "#4687f0", "#5800d4");
      secondary = chalk.blueBright;
      tertiary = chalk.bold.hex("#3467eb");
      error = chalk.red.bold;
      html = ["#1702CF", "#11019F ", "#1401BF"];
      break;
  }
  return { main, subcolor, error, secondary, tertiary, html };
}

module.exports = {
  getThemeColors,
  log: (text, type) => {
    switch (type) {
      case "warn":
        process.stderr.write(
          getThemeColors().error(`\r[ ERROR ] `) + text + "\n",
        );
        break;
      case "error":
        console.log(chalk.bold.hex("#ff0000").bold(`[ ERROR ] `) + text + "\n");
        break;
      case "load":
        console.log(getThemeColors().subcolor(`[ NEW USER ] `) + text + "\n");
        break;
      default:
        process.stderr.write(
          getThemeColors().subcolor(`\r[ ${String(type).toUpperCase()} ] `) +
            text +
            "\n",
        );
        break;
    }
  },
  error: (text, type) => {
    process.stderr.write(chalk.hex("#ff0000")(`\r[ ${type} ] `) + text + "\n");
  },
  err: (text, type) => {
    process.stderr.write(
      getThemeColors().subcolor(`[ ${type} ] `) + text + "\n",
    );
  },
  warn: (text, type) => {
    process.stderr.write(
      getThemeColors().subcolor(`\r[ ${type} ] `) + text + "\n",
    );
  },
  loader: (data, option) => {
    switch (option) {
      case "warn":
        process.stderr.write(
          getThemeColors().subcolor(`[ SYSTEM ]`),
          data + "\n",
        );
        break;
      case "error":
        process.stderr.write(
          chalk.hex("#ff0000")(`\r[ SYSTEM ] `) + data + "\n",
        );
        break;
      default:
        console.log(getThemeColors().subcolor(`[ SYSTEM ]`), data);
        break;
    }
  },
};
