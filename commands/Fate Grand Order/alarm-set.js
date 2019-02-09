const snek = require('snekfetch');
const Command = require('../../main/command');
const Constants = require('../../main/const');

module.exports = class AlignmentCommand extends Command {
  constructor(main) {
    super(main, {
      name: "alarm-set",
      category: "Fate Grand Order",
      args: [
        {
          name: "Server",
          desc: "The alarm for FGO Server. Format `server: (na/jp)`"
        },
        {
          name: "Hour",
          desc: "The hour at which hour this alarm need to be triggered. Format `hour: 19`"
        },
        {
            name: "Timezone",
            desc: "The timezone of the server. Format `tz: (pst/jst)`"
          }
      ],
      help: "Search for servants with a specific alignment"
    })
  }
  run(message, args, prefix) {
    console.log("Channel", message.channel)
  }
}