exports.help = "slap <mention> :: Slap the mentioned user";
exports.exec = (bot, message, msgArray, callback) => {
  if (message.mentions.users.size > 0) {
    mentions = message.mentions.users.first();
    if (mentions.id == "184369428002111488") mentions = message.author.username;
    if (message.guild && message.guild.members.get(mentions.id).nickname) message.channel.sendFile("http://moesocial.com/slap.php?text=" + encodeURI(message.guild.members.get(mentions.id).nickname), "slap.png").then(callback);
    else message.channel.sendFile("http://moesocial.com/slap.php?text=" + encodeURI(mentions.username), "slap.png").then(callback);
  } else message.channel.sendFile("http://moesocial.com/slap.php?text=" + encodeURI(msgArray.slice(1).join(' ')), "slap.png").then(callback);
}