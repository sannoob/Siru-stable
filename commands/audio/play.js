class Command {
  constructor (client) {
    this.client = client
    this.command = {
      name: 'play',
      aliases: ['재생', 'ㅔㅣ묘', 'ㅔ', 'p', 'wotod'],
      category: 'MUSIC_GENERAL',
      require_nodes: true,
      require_voice: true,
      hide: false,
      permissions: ['Everyone']
    }
  }

  /**
   * @param {Object} compressed - Compressed Object (In CBOT)
   * @param {Boolean} isSoundCloud - is Search Platform SoundCloud?
   */
  async run (compressed, isSoundCloud) {
    // Default Variables
    const { message, args } = compressed
    const locale = compressed.guildData.locale
    const picker = this.client.utils.localePicker

    // If Conditions True
    const Audio = this.client.audio
    let searchStr = message.attachments.map(el => el.url)[0] ? message.attachments.map(el => el.url)[0] : args.join(' ')
    const searchPlatForm = isSoundCloud === true ? 'scsearch:' : 'ytsearch:'

    if (!Audio.players.get(message.guild.id) || (this.client.audio.players.get(message.guild.id) !== undefined) === !message.guild.me.voice.channelID || (this.client.audio.players.get(message.guild.id) === undefined ? false : (this.client.audio.players.get(message.guild.id).voiceConnection.voiceChannelID === null)) || (message.guild.me.voice.channelID === undefined ? false : (message.guild.me.voice.channelID !== message.member.voice.channelID))) {
      const voiceJoinSuccess = await this.client.commands.get('join').run(compressed, true)
      if (voiceJoinSuccess !== true) return
    }

    if (args.length === 0 && searchStr.length === 0) return message.channel.send(picker.get(locale, 'GENERAL_INPUT_QUERY'))
    if (!validURL(searchStr)) searchStr = searchPlatForm + searchStr

    const loadingMessage = await message.channel.send(picker.get(locale, 'COMMANDS_AUDIO_LOAD'))
    const searchResult = await Audio.getTrack(searchStr).catch((e) => {
      throw e
    })
    loadingMessage.delete()

    if (this.chkSearchResult(searchResult, picker, locale, message) !== true) return false

    if (searchResult.loadType === 'PLAYLIST_LOADED') {
      const playingList = searchResult.playlistInfo.selectedTrack !== -1
      // If selected Track is exist, shift
      if (playingList) {
        for (let i = 0; i < searchResult.playlistInfo.selectedTrack; i++) {
          searchResult.tracks.shift()
        }
        this.addQueue(message, searchResult.tracks[0], picker, locale)
        searchResult.tracks.shift()
        if (searchResult.tracks.length === 0) return
        message.channel.send(picker.get(locale, 'COMMANDS_AUDIO_PLAY_PLAYLIST_ADD_ASK_PLAYINGLIST', { NUM: searchResult.tracks.length })).then((m) => {
          const emojiList = ['📥', '🚫']
          this.client.utils.message.massReact(m, emojiList)

          const filter = (reaction, user) => emojiList.includes(reaction.emoji.name) && user.id === message.author.id
          const collector = m.createReactionCollector(filter, { time: 15000 })
          const functionList = [() => {
            collector.stop()
            this.addQueue(message, searchResult.tracks, picker, locale)
            message.channel.send(picker.get(locale, 'COMMANDS_AUDIO_PLAY_PLAYLIST_ADDED_PLAYLIST', { NUM: searchResult.tracks.length }))
          }, () => {
            collector.stop()
            return message.channel.send(picker.get(locale, 'GENERAL_USER_STOP')).then(m => m.delete(5000))
          }]

          collector.on('collect', r => {
            const index = emojiList.findIndex((el) => el === r.emoji.name)
            functionList[index]()
          })

          collector.on('end', (...args) => {
            if (m.deletable && m.deleted === false) m.delete()
            if (args[1] === 'time') return message.channel.send(picker.get(locale, 'GENERAL_TIMED_OUT')).then(m => m.delete(5000))
          })
        })
      } else {
        this.addQueue(message, searchResult.tracks, picker, locale)
        message.channel.send(picker.get(locale, 'COMMANDS_AUDIO_PLAY_PLAYLIST_ADDED_PLAYLIST', { NUM: searchResult.tracks.length }))
      }
    }

    if (searchResult.loadType === 'SEARCH_RESULT' || searchResult.loadType === 'TRACK_LOADED') {
      const info = searchResult.tracks[0].info
      const track = searchResult.tracks[0]
      if (info.title.length === 0) track.info.title = searchStr.split('/').slice(-1)[0]
      this.addQueue(message, track, picker, locale)
    }
  }

  async addQueue (message, trackInfo, picker, locale) {
    const guildData = await this.client.database.getGuild(message.guild.id)
    const npStatus = (guildData.nowplaying.track)
    const status = (npStatus && !Array.isArray(trackInfo))
    const { info } = trackInfo
    const placeHolderWithTrackInfo = Object.assign({ TRACK: this.client.audio.utils.formatTrack(info || trackInfo[0].info), POSITION: guildData.queue.length + 1 })
    if (status || (guildData.queue.length > 0)) message.channel.send(picker.get(locale, 'COMMANDS_AUDIO_PLAY_ADDED_SINGLE', placeHolderWithTrackInfo))
    else if (!npStatus) message.channel.send(picker.get(locale, 'COMMANDS_AUDIO_PLAY_ADDED_NOWPLAY', placeHolderWithTrackInfo))
    this.client.audio.queue.enQueue(message.guild.id, trackInfo, message.author.id)
  }

  chkSearchResult (searchResult, picker, locale, message) {
    if (searchResult.loadType === 'LOAD_FAILED') return message.channel.send(picker.get(locale, 'COMMANDS_AUDIO_PLAY_LOAD_FAIL', { ERROR: searchResult.exception.message }))
    if (searchResult.loadType === 'NO_MATCHES' || !searchResult.tracks || searchResult.tracks.length === 0) return message.channel.send(picker.get(locale, 'GENERAL_NO_RESULT'))
    return true
  }
}

function validURL (str) {
  const pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
    '(\\#[-a-z\\d_]*)?$', 'i') // fragment locator
  return !!pattern.test(str)
}

module.exports = Command
