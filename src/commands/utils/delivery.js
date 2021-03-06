// const Discord = require('discord.js')
const carriers = require('./carriers.json')
const fetch = require('node-fetch')
const moment = require('moment-timezone')
const Discord = require('discord.js')
const { placeHolderConstant } = require('../../constant')
const { BaseCommand } = require('../../structures')
// https://apis.tracker.delivery/carriers/Carrier_ID/tracks/Track_No

class Command extends BaseCommand {
  constructor (client) {
    super(client,
      'delivery',
      ['택배', '택배조회'],
      ['Everyone'],
      'GENERAL_INFO',
      {
        audioNodes: false,
        playingStatus: false,
        voiceStatus: {
          listenStatus: false,
          sameChannel: false,
          voiceIn: false
        }
      },
      false
    )
  }

  async run (compressed) {
    const { message, args } = compressed
    if (args.length === 0) return message.channel.send(`> ${placeHolderConstant.EMOJI_NO}  사용법이 올바르지 않아요. [택배사 이름] [송장번호] 가 필요해요.`)
    if (!args[1]) return message.channel.send(`> ${placeHolderConstant.EMOJI_NO}  운송장 번호를 입력해주세요! [택배사 이름] [송장번호]`)

    const carrierCode = carriers[args[0].toUpperCase()]
    if (!carrierCode) return message.channel.send(`> ${placeHolderConstant.EMOJI_NO}  택배사가 올바르지 않아요..\n> 사용 가능한 택배사 이름들\n> \`\`\`JS\n> ${Object.keys(carriers).join(', ')}\n> \`\`\``)
    const fetchResult = await fetch(`https://apis.tracker.delivery/carriers/${carrierCode}/tracks/${encodeURI(args[1])}`).then(res => res.json())
    if (fetchResult.message) return message.channel.send(`> ${placeHolderConstant.EMOJI_NO}  ${fetchResult.message}`)
    const MappedResult = fetchResult.progresses.map(el => { return { message: el.description, time: moment(el.time).tz('Asia/Seoul').format('YYYYMMDD'), timeFormat: el.time, location: el.location } })
    const Result = {}
    Result.raw = fetchResult
    for (const obj of MappedResult) {
      if (!Result[obj.time]) Result[obj.time] = []
      Result[obj.time].push(obj)
    }
    const embed = new Discord.MessageEmbed()
    embed.setColor('#7289DA')
    embed.setTitle(Discord.Util.escapeMarkdown(`보낸이: ${Result.raw.from.name} 받는이: ${Result.raw.to.name} (${Result.raw.state.text})`))
    for (const obj of Object.keys(Result)) {
      if (obj !== 'raw') embed.addFields({ name: moment(obj).tz('Asia/Seoul').format('YYYY - MM - DD'), value: Result[obj].map(el => `**[${Discord.Util.escapeMarkdown(el.location.name)}]** **${Discord.Util.escapeMarkdown(moment(el.timeFormat).tz('Asia/Seoul').format('HH:mm'))}** - ${Discord.Util.escapeMarkdown(el.message)}`.replace(/\n/gi, '')) })
    }
    message.channel.send(embed)
  }
}
module.exports = Command
