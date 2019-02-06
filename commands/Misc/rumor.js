const Command = require('../../main/command');

module.exports = class RumorsCommand extends Command {
  constructor(main) {
    super(main, {
      name: "rumor",
      category: "Misc",
      help: "Spread rumors about two random people in the guild"
    });
    this.rumors = [
      "Psshh, I saw [1] holding hands with [2] while walking down the street last night!!",
      "Psshh, I saw [1] hugging [2] in the amusement park yesterday!!",
      "Psshh, I saw [1] touching [2] under nitocris's sheets the other day!",
      "Psshh, I saw [1] having mana transfer with [2] in the school gym the other day!!",
      "Psssh, I saw [1] having dinner together with [2] in downtown last week!",
      "Psssh, I saw [1] giving [2] a homemade chocolate in the train station yesterday !",
      "Nobu is apologizing to [1] and [2] for spreading bad rumors about them..",
      "Psssh, I saw [1] and [2] discussing about their next rolls? Will they survive?",
      "Psssh, I saw [1] caressing [2]'s hair yesterday!"
    ];
  }

  run(message, args, prefix) {
    if (message.guild) {
      message.channel.fetchMessages({limit: 100}).then(messages => {
        let members = new Map();
        messages.map(m => { if (m.member) {
          members.set(m.member.id, m.member);
        }});
        if (members.size >= 3) members.delete(this.main.client.user.id);
        let player1 = this.main.util.ARand(Array.from(members.values()));
        members.delete(player1.id);
        let player2 = this.main.util.ARand(Array.from(members.values()));
        message.channel.send(this.main.util.ARand(this.rumors).replace('[1]', player1.displayName).replace('[2]', player2.displayName));
      })
    } else {
      message.channel.send("This command can only be used in guilds");
    }
  }
}