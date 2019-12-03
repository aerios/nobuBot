const snek = require('snekfetch');
const Command = require('../../main/command');
const Constants = require('../../main/const');
const moment = require('moment')
const Arguments = require("../../commons/Arguments")
const fs = require('fs')



function getTimezoneOffset(name) {
  if(name == 'pst') return -8 * 60
  else if (name == 'jst') return 9 * 60
  else if (name == 'pdt') return -7 * 60
  else return 0
}

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

  getTimezoneOffset() { return getTimezoneOffset(this.timezone) }

  toString() {
    return `${this.guildId}_${this.channelId}_${this.server}`
  }

  nextAlarmOffset() {
    const timezoneOffset = this.getTimezoneOffset()
    const now = moment().utcOffset(timezoneOffset)    
    const hour = this.hour          
    const nextAlarm = now.clone().startOf('day').add(hour, 'h')
    const delta = nextAlarm.unix() - now.unix()
    let nextTimeout = 0
    
    if(delta < 0) {
      //we are past today's alarm. move to tomorrow    
      nextTimeout = 24 * 60 * 60 - delta
    } else if(delta > 0) {
      //we are before today's alarm. set schedule unitl today's alarm
      nextTimeout = delta  
    } else {
      nextTimeout = 24 * 60 * 60
    }    
    return nextTimeout  
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
  constructor(alarm, activeChannel, nobuBuffer) {
    this.alarm = alarm
    this.channel = activeChannel   
    this.timeoutId = -1 
    this.nobuBuffer = nobuBuffer
  }

  stop() {
    if(this.timeoutId >= 0) {
      clearTimeout(this.timeoutId)
    }
  }

  

  start() {
    
    const nextTimeout = this.alarm.nextAlarmOffset()
    console.log(`
      Next alarm set!
      server      : ${this.alarm.server} 
      timezone    : ${this.alarm.timezone} 
      Guild Id    : ${this.alarm.guildId}
      Channel Id  : ${this.alarm.channelId}
      Guild name  : ${this.channel.guild.name}
      Channel name: ${this.channel.name}
      Next alarm  : ${nextTimeout / 60} minutes!`)  

    this.timeoutId = setTimeout(() => {
      this.channel.send(`Uwahahahahaha !!!\nWhat a Splendid Day for Chaldea ! It’s time to do head counts\nWhat!! You didn’t log in ${this.alarm.server} server yet ?!\nHey Retainer what are you waiting for? Iku zo! washi ni tsudzuke ~ei!\n@everyone`, {
        file: {
          attachment: this.nobuBuffer,
          name: 'nobu.png'
        }
      })
      this.start()
    }, nextTimeout * 1000)
  }

}

const AlarmBucket = {}

function runAlarm(alarm, guild, nobuBuffer) {
  const key = alarm.toString()
  const selectedChannel = guild.channels.get(alarm.channelId)
  const alarmWithChannel = new AlarmWithChannel(alarm, selectedChannel, nobuBuffer)
  if(AlarmBucket[key]) {
    //stop alarm
    AlarmBucket[key].stop()
    AlarmBucket[key] = null
    delete AlarmBucket[key]
  }
  AlarmBucket[key] = alarmWithChannel
  alarmWithChannel.start()
}

const alarmSuperKey = '$alarmSet'

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
    setTimeout(() => {
      fs.readFile(this.main.config.nobuPath, (err, buffer) => {
        if(err) console.log('Error loading nobu path!', err)
        else this.nobuFile = buffer
        this.main.db.get(alarmSuperKey).then(json => {
          if(json) {
            json = JSON.parse(json)
            Object.keys(json).forEach(name => {
              const instance = Alarm.deserialize(json[name])
              console.log("Begin running saved alarms!")
              runAlarm(instance, this.main.client.guilds.get(instance.guildId), buffer)
            })
          }  
        })
      })      
    }, 10000)
    
  }

  run(message, args, prefix) {
    const parsedArgs = this.arguments.parse(args.join(" "))
    const guildId = message.guild.id
    const channelId = message.channel.id
    const {server, tz} = parsedArgs
    let { hour } = parsedArgs
    let errMessage = ''
    if(!server) { errMessage = 'No server defined! Please specify the server' }
    else if(!hour) { errMessage = 'No hour defined! Please specify the hour'}
    else if(!tz) { errMessage = 'No timezone defined! Please specify the timezone'}
    else if(hour == 'now') {
      const now = moment()
      const offset = getTimezoneOffset(tz)
      const next5Seconds = now.add(5, 'second')
      const hourOfn5s = next5Seconds.hour()
      const secOfn5s = next5Seconds.second()
      const minOfn5s = next5Seconds.minute()
      const hourFraction = secOfn5s / 3600 + minOfn5s / 60
      console.log(hourOfn5s, (hourFraction), (offset / 60))
      hour = (hourOfn5s + (hourFraction) + (offset / 60))
    }
    else if(isNaN(parseInt(hour, 10))) { errMessage = `${hour} is not a valid number!`}
    else if(hour < 0 || hour > 23) { errMessage = `${hour} must be between 0 and 23!`}
    else errMessage = ''
    if(errMessage) {
      message.channel.send(`Error: ${errMessage}`)    
    } else {
      this.main.db.get(alarmSuperKey).then(json => {
        if(!json) json = {}
        else json = JSON.parse(json)
        const alarmInstance = new Alarm(guildId, channelId, server, hour, tz)      
        const alarmKey = `$alarmSet_${alarmInstance.toString()}`
        json[alarmKey] = alarmInstance.serialize()
        this.main.db.set(alarmSuperKey, JSON.stringify(json)).then(result => {
          message.channel.send(`Alarm for server: ${server} on every ${hour} o'clock using ${tz} timezone is up! Next alarm will be fired in ${(alarmInstance.nextAlarmOffset() / 60).toFixed(2)} minutes!`);
          console.log(`
            Begin run alarm!
            Guild       : ${guildId}
            Channel     : ${channelId}
            Server      : ${server}
            Hour        : ${hour}
            Timezone    : ${tz}
            Is available: ${this.main.client.guilds.get(guildId).available}
          `)
          runAlarm(alarmInstance, this.main.client.guilds.get(guildId))
        })
      })        
    }   
  }
}