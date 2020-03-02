const { Collection } = require('discord.js')
const locales = require('./index.js')
const template = require('string-placeholder')

class LanguagePicker {
  constructor (client) {
    this.client = client
    this.locales = new Collection()
  }

  async init () {
    try {
      this.client.logger.info(`[Locale] Init Locales... (Locales: ${locales.join(', ')})`)
      for (const key of locales) {
        this.client.logger.debug(`[Locale] [Init] Load Locale ${key}.json`)
        this.locales.set(key, require(`./${key}`))
        delete require.cache[require.resolve(`./${key}`)]
      }
      return this.locales
    } catch (e) {
      this.client.logger.error(e.stack)
    }
  }

  get (lang, name, placeholder = {}) {
    this.client.logger.debug(`[LanguagePicker:Get] Lang: ${lang}, PATH: ${name}, Placeholders: ${Object.keys(placeholder)}`)
    const language = this.locales.get(lang)[name]
    if (!language) {
      this.client.logger.error(`[LanguagePicker:Get] [Error] Language key is not exists! ${lang}.${name}`)
      return `${lang}.${name}`
    }
    const settings = { before: '%', after: '%' }
    const userPlaceholder = template(language, placeholder, settings)
    const localesKeys = template(userPlaceholder, this.locales.get(lang), settings)
    const result = template(localesKeys, this.client._options.constructors, settings)
    this.client.logger.debug(`[LanguagePicker:Get] Result: ${result}`)

    return result
  }
}
module.exports = LanguagePicker
