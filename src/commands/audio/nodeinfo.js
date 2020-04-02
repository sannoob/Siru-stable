// https://stackoverflow.com/questions/15900485/correct-way-to-convert-size-in-bytes-to-kb-mb-gb-in-javascript/23625419
const units = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

function niceBytes (x) {
  let l = 0; let n = parseInt(x, 10) || 0

  while (n >= 1024 && ++l) {
    n = n / 1024
  }
  // include a decimal point and a tenths-place digit if presenting
  // less than ten of KB or greater units
  return (n.toFixed(n < 10 && l > 0 ? 1 : 0) + ' ' + units[l])
}

const Discord = require('discord.js')
class Command {
  constructor (client) {
    this.client = client
    this.name = 'nodeinfo'
    this.aliases = ['봇정보', 'ㅜㅐㅇ댜ㅜ래']
    this.category = 'MUSIC_GENERAL'
    this.requirements = {
      audioNodes: false,
      playingStatus: false,
      voiceStatus: {
        listenStatus: false,
        sameChannel: false,
        voiceIn: false
      }
    }
    this.hide = false
    this.permissions = ['Everyone']
  }

  /**
   * @param {Object} compressed - Compressed Object
   */
  async run (compressed) {
    const { message } = compressed
    const embed = new Discord.MessageEmbed()
    for (const item of this.client.audio.nodes.values()) {
      embed.addFields({
        name: `**${item.name}** ${item.state === 'CONNECTED' ? `, (${item.players.size} Players)` : `, ${item.state}`}`,
        value: `**${niceBytes(item.stats.memory.used)}** Used\n**${item.stats.cpu.cores}** Cores\n**${Number(item.stats.cpu.systemLoad).toFixed(2)}%** System Loads\n**${Number(item.stats.cpu.lavalinkLoad).toFixed(2)}%** Lavalink Loads`,
        inline: true
      })
    }
    embed.setTitle('Lavalink Nodes - Powered By Shoukaku')
    embed.setColor('#7289DA')
    message.channel.send(embed)
  }
}

module.exports = Command