const snek = require('snekfetch');
const Command = require('../../main/command');
const Constants = require('../../main/const');
const moment = require('moment')
const Arguments = require("../../commons/Arguments")

class Alarm {
  constructor(guildId, channelId, server, hour, timezone) {
    this.guildId = guildId
    this.channelId = channelId
    this.server = server
    this.hour = hour
    this.timezone = timezone
  }

  serialize() {
    return {
      guildId: this.guildId,
      channelId: this.channelId,
      server: this.server,
      hour: this.hour,
      timezone: this.timezone
    }
  }

  getTimezoneOffset() {
    if(this.timezone == 'pst') return -8 * 60
    else if (this.timezone == 'jst') return 9 * 60
    else if (this.timezone == 'pdt') return -9 * 60
    else return 0
  }

  toString() {
    return `${this.guildId}_${this.channelId}_${this.server}`
  }
}

Alarm.deserialize = (obj) => {
  const {
    guildId,
    channelId,
    server,
    hour,
    timezone
  } = obj
  return new Alarm(guildId, channelId, server, hour, timezone)
}

class AlarmWithChannel {
  constructor(alarm, activeChannel) {
    this.alarm = alarm
    this.channel = activeChannel   
    this.timeoutId = -1 
  }

  stop() {
    if(this.timeoutId >= 0) {
      clearTimeout(this.timeoutId)
    }
  }

  start() {
    //calculate delta between now until next alarm
    const timezoneOffset = this.alarm.getTimezoneOffset()
    const now = moment().zone(timezoneOffset)    
    const hour = this.alarm.hour          
    const nextAlarm = now.startOf('day').add(hour, 'h')
    const delta = nextAlarm.unix() - beginningOfDay.unix()
    let nextTimeout = 0
    if(delta < 0) {
      //we are past today's alarm. move to tomorrow    
      nextTimeout = 24 * 60 * 60 - delta
    } else if(delta >= 0) {
      //we are before today's alarm. set schedule unitl today's alarm
      nextTimeout = delta  
    }
    console.log(`Next alarm for server ${this.alarm.server} with timezone ${this.alarm.timezone} will be fired in ${nextTimeout / 60} minutes!`)    
    this.timeoutId = setTimeout(() => {
      this.channel.send(`@everyone this is a reminder for daily login for server ${this.alarm.server}!`)
      this.start()
    }, nextTimeout * 1000)
  }

}

const AlarmBucket = {}

function runAlarm(alarm, channels) {
  const key = alarm.toString()
  const selectedChannel = channels.get(alarm.channelId)
  const alarmWithChannel = new AlarmWithChannel(alarm, selectedChannel)
  if(AlarmBucket[key]) {
    //stop alarm
    AlarmBucket[key].stop()
    AlarmBucket[key] = null
    delete AlarmBucket[key]
  }
  AlarmBucket[key] = alarmWithChannel
  alarmWithChannel.start()
}

module.exports = class AlarmSetCommand extends Command {
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
    this.arguments = new Arguments(/((?:server)|(?:hour)|(?:tz)) ?: ?[^\|]+/gi)
  }
  run(message, args, prefix) {
    const parsedArgs = this.arguments.parse(args.join(" "))
    const guildId = message.guild.id
    const channelId = message.channel.id
    const {server, hour, tz} = parsedArgs
    let errMessage = ''
    if(!server) { errMessage = 'No server defined! Please specify the server' }
    else if(!hour) { errMessage = 'No hour defined! Please specify the hour'}
    else if(!tz) { errMessage = 'No timezone defined! Please specify the timezone'}
    else if(isNaN(parseInt(hour, 10))) { errMessage = `${hour} is not a valid number!`}
    else if(hour < 0 || hour > 23) { errMessage = `${hour} must be between 0 and 23!`}
    else errMessage = ''
    if(errMessage) {
      message.channel.send(`Error: ${errMessage}`)    
    } else {
      const alarmInstance = new Alarm(guildId, channelId, server, hour, tz)
      
      const alarmKey = `$alarmSet_${alarmInstance.toString()}`
      this.main.db.set(alarmKey, JSON.stringify(alarmInstance.serialize())).then(result => {
        message.channel.send(`Alarm for server: ${server} on every ${hour} o'clock using ${tz} timezone is up!`);
        console.log(`
          Begin run alarm!
          Guild       : ${guildId}
          Channel     : ${channelId}
          Server      : ${server}
          Hour        : ${hour}
          Timezone    : ${tz}
          Is available: ${this.main.client.guilds.get(guildId).available}
        `, this.main.client.guilds.get(guildId))
        runAlarm(alarmInstance, this.main.client.guilds.get(guildId))
      })  
    }   
  }
}