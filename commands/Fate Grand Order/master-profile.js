const Command = require('../../main/command');
const Constants = require('../../main/const');
const snek = require('snekfetch');

const parseArgs = (raw, authorId) => {
  const args = raw.match(/((?:name)|(?:id)|(?:server)) ?: ?[^\|]+/gi);
  let compiledArgs = {}
  let isListing = false
  if(raw.toLowerCase().indexOf("list") == 0) {
    isListing = true
  }
  if (args || isListing) {
    if(args) {
      args.forEach(item => {
        item = item.split(':');
        item[0] = item[0].toLowerCase().trim();
        item[1] = item.slice(1).join(':').replace(/<@[0-9]{1,}>/ig, "").trim();
        if(item[0] == 'list') {
          compiledArgs.list = true
        } else {
          compiledArgs[item[0]] = item[1]
        }
        
      });
    }    
    compiledArgs.list = isListing
    let mentionID = raw.match(/(?:<@!?)(\d+)/);
    console.log(mentionID)
    if (mentionID) compiledArgs.player = mentionID[1];
    else compiledArgs.player = authorId
    return compiledArgs
  }  
}

module.exports = class FGOProfileCommand extends Command {
  constructor(main) {
    super(main, {
      name: "master-profile",
      category: "Fate Grand Order",
      help: "Get your saved Fate/Grand Order Profile ",
      args: [
        {
          name: 'List',
          desc: 'Optional. If supplied, list all profiles saved for this user'
        },
        {
          name: "Server",
          desc: "Optional. The server of this profile. Format: `server: (JP/NA)`"  
        },
        {
          name: "IGN",
          desc: "Optional. If supplied, shows only profile from this IGN. Format: `name: IGN`"  
        },
        {
          name: "Friend ID",
          desc: "Optional. If supplied, shows only profile from this Friend ID. Format: `id: FriendID`"  
        },
        {
          name: "Player",
          desc: "Optional. The bot will show the player's profile if this argument is provided and the player's privacy setting is off. Can use User Mention or User ID for this argument."
        }
      ]
    });
  }
  run(message, args, prefix) {
    let player = message.author.id;
    console.log(args)
    const compiledArgs = parseArgs(args.join(" "), player)
    console.log("Compiled args", compiledArgs)
    if(compiledArgs) {
      const dbKey = `masterProfile_${compiledArgs.player}`
      Promise.all([this.main.db.get(dbKey), this.main.client.fetchUser(player)]).then((profile) => {
        if (profile[0]) {
          profile[0] = JSON.parse(profile[0]);
          const profiles = Object.keys(profile[0]).map(name => profile[0][name])
          const { server, id, name } = compiledArgs   
          
          if(compiledArgs.list) {
            if(profiles.length) {
              message.channel.send('', {embed: this.main.util.fgoProfileList(profile[1], profiles)});
            } else {
              message.channel.send(`Profile not found, please use \`${prefix}master-profile-edit\` to create one`);
            }
          } else {
            let selectedProfiles = []
            if(server && id) {
              selectedProfiles = profiles.filter(item => {
                return item.server.toLowerCase() == server.toLowerCase() && item.id == id
              })
            } else if(server && name) {
              selectedProfiles = profiles.filter(item => {
                return item.server.toLowerCase() == server.toLowerCase() && item.name.toLowerCase().indexOf(name.toLowerCase) >= 0
              })    
            } else {
              selectedProfiles = profiles
            }
            selectedProfiles = selectedProfiles.filter(item => !item.privacy)
            if(selectedProfiles.length) {
              message.channel.send('', {embed: this.main.util.fgoProfile(profile[1], selectedProfiles[0])});
            } else {
              //no profile shown
              message.channel.send(`Profile not found, please use \`${prefix}master-profile-edit\` to create one`);
            }
          }
        } 
        else if (args) message.channel.send(`Cannot find profile of provided player. Please recheck your arguments and try again`);
        else message.channel.send(`Profile not found, please use \`${prefix}master-profile-edit\` to create one`);
      }).catch(console.log);
    } else {
      message.channel.send(`Error: no arguments supplied! Please consult ${prefix}help master-profile for more info`)
    }
  }
}
