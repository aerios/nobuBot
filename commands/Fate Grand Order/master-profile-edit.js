const Command = require('../../main/command');
const Constants = require('../../main/const');
const snek = require('snekfetch');

class ValidationResult {
  constructor(status, message) {
    this.status = status
    this.message = message
  }
}

class ProfileKey {
  constructor(singleProfile) {
    const {id, server} = singleProfile
    this.id = id
    this.server = server    
  }

  get isValid() {
    const { id, server } = this
    return !!id && !!server    
  }

  get key() {
    if(this.isValid) {
      const { id, server } = this
      return [server.toLowerCase(), id].join("_") 
    } else throw new Error("Can't access key from invalid profile!")
  }

  toString() {
    return this.key
  }
}

const finalizeUnsavedProfile = (unsavedProfile, profiles) => {
  const key = new ProfileKey(unsavedProfile)
  const existing = profiles[key]
  if(existing) {
    return Object.assign(existing, unsavedProfile)
  } else return unsavedProfile
}



const validateProfileInput = (prefix, profile) => {
  if(profile) {
    const {
      id, server
    } = profile
    
    let messages = []
    if(!id) {
      messages.push(`FriendID is required`)
    }
    if(!server) {
      messages.push(`Server is required`)
    } else {
      let serverLowerCase = server.toLowerCase()
      if(serverLowerCase != "jp" && serverLowerCase != "na") {
        messages.push(`${server} is not a valid FGO Server`)
      }
    }
    if(messages.length) {
      return new ValidationResult(false, messages.join(", ") + "!")
    } else {
      return new ValidationResult(true)
    }
  } else {
    return new ValidationResult(false, `No arguments supplied! Please check ${prefix}help master-profile-edit for more information`)
  }
}



module.exports = class FGOProfileEditCommand extends Command {
  constructor(main) {
    super(main, {
      name: "master-profile-edit",
      category: "Fate Grand Order",
      help: "Save or edit your Fate/Grand Order NA/JP profiles",
      argsSep: ' | ',
      args: [
        {
          name: "Server",
          desc: "FGO Server for this profile. Format: `server: (NA/JP)`"
        },
        {
          name: "IGN",
          desc: "Your IGN. Format: `name: IGN`"
        },
        {
          name: "Friend ID",
          desc: "Your Friend ID. Format: `id: FriendID`"
        },
        {
          name: "Support Image",
          desc: "The image link showing your support list. Format: `support: Image Link`. You can also upload the image along with the command."
        },
        {
          name: "Privacy",
          desc: "Privacy Setting for your profile. Format: `privacy: true/false`. If set to `false`, everyone can use command to see your profile. Optional, default to true"
        }
      ],
      caseSensitive: true
    });
  }
  run(message, args, prefix) {
    args = args.join(' ');
    let img = message.attachments.first();
    const dbKey = `masterProfile_${message.author.id}`
    if (args || img) {
      this.main.db.get(dbKey).then(profiles => {
        if (profiles) profiles = JSON.parse(profiles);
        else profiles = {};
        let unsavedSingleProfile = {}
        args = args.match(/((?:name)|(?:id)|(?:support)|(?:privacy)|(?:server)) ?: ?[^\|]+/gi);
        if (args) {
          args.forEach(item => {
            item = item.split(':');
            item[0] = item[0].toLowerCase().trim();
            item[1] = item.slice(1).join(':').trim();
            unsavedSingleProfile[item[0]] = item[1];
            if (item[0] == "privacy") {
              if (item[1] == "false") unsavedSingleProfile.privacy = false;
              else unsavedSingleProfile.privacy = true;
            }
          });
        }
        if (img) {
          unsavedSingleProfile.support = img.url;
        }
        const validationResult = validateProfileInput(prefix, unsavedSingleProfile)
        if(validationResult.status) {
          const finalizedProfile = finalizeUnsavedProfile(unsavedSingleProfile, profiles)  
          const key = new ProfileKey(finalizedProfile)
          console.log(finalizedProfile);
          profiles[key] = finalizedProfile
          this.main.db.set(dbKey, JSON.stringify(profiles)).then(() => {
            message.channel.send('Profile saved successfully', {embed: this.main.util.fgoProfile(message.author, finalizedProfile)});
          });

        } else {
          //invalid message encountered
          message.channel.send(`Error: ${validationResult.message}`);
        }
      });
    } else {
      message.channel.send(`Error: No argument provided. Please consult \`${prefix}help master-profile-edit\` for more information.`);
    }
  }
}