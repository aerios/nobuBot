const Command = require('../../main/command');
const Constants = require('../../main/const');
const snek = require('snekfetch');

module.exports = class FGOMasterCommand extends Command {
  constructor(main) {
    super(main, {
      name: "master",
      category: "Fate Grand Order",
      help: "Get the current Master Missions."
    });
  }
  async run(message, args, prefix) {
    Promise.all([
      snek.get('https://fate-go.cirnopedia.org/master_mission.php'),
      snek.get('https://fate-go.cirnopedia.org/master_mission_us.php')
    ]).then(r => {
      let data = r[0].text.match(/id="mini(?:(?!<\/table)[\s\S])+/g)[0].match(/desc">\n.+\n.+/g).map(item => {
        return '- ' + item.slice(7).split('\n')[1].replace(/\t{2,}/g, '');;
      });
      let data2 = r[1].text.match(/id="mini(?:(?!<\/table)[\s\S])+/g)[0].match(/desc">\n.+\n.+/g).map(item => {
        return '- ' + item.slice(7).split('\n')[1].replace(/\t{2,}/g, '');;
      });
      let descList = [
        {
          name: 'Description for JP:',
          value: data.join('\n') + "\n\u200b"
        },
        {
          name: 'Description for NA:',
          value: data2.join('\n') + "\n\u200b"
        }
      ]
      let fields = [];
      r.forEach((i, ind) => {
        fields.push(descList[ind]);
        i = i.text.match(/id="recommended(?:(?!id="other)[\s\S])+/g)[0];
        i.split('<spanh>').slice(1).forEach(rec => {
          let name = `Recommended Area ${ind ? '(EN)' : '(JP)'}: ${ rec.match(/<\/font>[^<]+<font/)[0].slice(8, -6) }`;
          let value = [];
          args = rec.match(/desc">.+|<td>.+<br>.+/g);
          for (let index = 0; index < args.length; index += 3) {
            value.push(`- ${args[index + 2].slice(4).replace(':<br>', ' - ')}: ${args[index + 1].slice(6).replace(/<br>/g, ' - ')}`);
          }
          value = value.join('\n') + "\n\u200b";
          fields.push( { name, value } );
        })
      });
      
      // fields[fields.length - 1].value = fields[fields.length - 1].value.slice(0, -2);
      message.channel.send('', { embed: {
        title: "Master Mission for this week",
        fields
      }});
    });
  }
}