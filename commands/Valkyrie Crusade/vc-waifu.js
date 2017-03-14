var request = require('request');
exports.help = "vc-waifu :: Marry a random maiden in Valkyrie Crusade";
let cooldown = {};
exports.exec = (bot, message, msgArray, callback) => {
  let time = 0;
  if (!cooldown[message.author.id]) cooldown[message.author.id] = message.createdTimestamp;
  else time = message.createdTimestamp - cooldown[message.author.id] - 900000;
  if (time < 0 && message.author.id != bot.config.ownerID) {
    message.channel.sendMessage("You can only use this command once every 15 minutes. You can use it again in " + Math.floor( - time / 60000) + " minutes " + (Math.ceil( - time / 1000) % 60) + " seconds");
  } else {
    cooldown[message.author.id] = message.createdTimestamp;
    let chance = Math.random();
    if (chance <= 0.015) msgArg = "LR";
    else if (chance <= 0.1) msgArg = "UR";
    else if (chance <= 0.4) msgArg = "SR";
    else msgArg = "N";
    request({ url: "https://raw.githubusercontent.com/aister/nobuDB/master/vc.json", json: true, followRedirect: false }, function(err, res, result) {
      body = result.filter(item => { return item.rarity == msgArg; });
      body = body[bot.commands.rnd.func(body.length - 1, 0)];
      embed = {
        title: "Congratulation!!",
        color: 0xff0000,
        description: "\u200b\nCongratulation! " + message.author + " have married to " + body.name + "! She has a rarity of " + body.rarity + ", how lucky!",
        image: {
          url: body.image
        }
      }
      message.channel.sendMessage('', {embed}).then(callback).catch(console.log);
    });
  }
}