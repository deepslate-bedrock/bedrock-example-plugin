'use strict'

const { BotState, pluginLoader } = require('prismarine-bedrock')
const examplePlugin = require('bedrock-example-plugin')

const bot = new BotState({
  host: process.env.BEDROCK_HOST || 'localhost',
  port: Number(process.env.BEDROCK_PORT || 19132),
  username: process.env.BEDROCK_USERNAME || 'ExamplePluginBot',
  offline: process.env.BEDROCK_OFFLINE !== 'false',
  loggingEnabled: process.env.BEDROCK_LOGGING !== 'false',
  examplePlugin: {
    chatCommand: '!example',
    greeting: 'Example plugin loaded. Type !example in chat.'
  }
})

pluginLoader.loadPlugin(bot, examplePlugin)
bot.start()

bot.on('chat', ({ sourceName, message }) => {
  console.log(`[chat] <${sourceName}> ${message}`)
})

process.once('SIGINT', () => {
  bot.examplePlugin?.stop()
  bot.disconnect('Example stopped')
})
