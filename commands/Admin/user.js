exports.help = "user <mentions> :: Check users by mentions or name";
exports.exec = (bot, message, msgArray, callback) => {
  if (!message.guild) return;
  if (message.member.highestRole.name.toLowerCase().includes('admin')) {
    var temp = "";
    message.mentions.users.forEach(user => {
      temp += '**User:** ' + user.username + '#' + user.discriminator + '\n';
      if (user.nickname) temp += '**Nickname:** ' + user.nickname + '\n';
      temp += '\n' +
        '**ID:** ' + user.id + '\n' +
        '**Join Date:** ' + message.guild.members.get(user.id).joinedAt.toUTCString() + '\n' +
        '**Creation Date:** ' + user.createdAt.toUTCString() + '\n' +
      '\n';
    });
    message.channel.sendMessage(temp);
  } else message.reply("only admins can use this command");
}