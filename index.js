'use strict'

const INSTALLED = Symbol.for('bedrock-example-plugin.installed')

const DEFAULTS = {
  chatCommand: '!example',
  greeting: null,
  greetingDelayMs: 250,
  reply: 'Example plugin is loaded.'
}

function readConfig (options = {}) {
  return {
    ...DEFAULTS,
    ...(options.examplePlugin || {})
  }
}

function queueChatPacket (bot, message) {
  if (!bot.client || typeof bot.client.queue !== 'function') return false

  bot.client.queue('text', {
    needs_translation: false,
    category: 'authored',
    type: 'chat',
    source_name: bot.client.username || bot.options?.username || 'Bot',
    message: String(message),
    xuid: '',
    platform_chat_id: '',
    has_filtered_message: false
  })
  return true
}

function inject (bot, options = {}) {
  if (bot[INSTALLED]) return bot[INSTALLED]

  const config = readConfig(options)
  const state = {
    chatMessagesSeen: 0,
    healthEventsSeen: 0,
    lastChatMessage: null,
    lastSourceName: null,
    startedAt: new Date()
  }
  const timers = new Set()

  function say (message) {
    if (typeof bot.chat === 'function') {
      bot.chat(message)
      return true
    }

    return queueChatPacket(bot, message)
  }

  function scheduleGreeting () {
    if (!config.greeting) return

    const timer = setTimeout(() => {
      timers.delete(timer)
      say(config.greeting)
    }, config.greetingDelayMs)
    timers.add(timer)
  }

  function onChat (payload = {}) {
    state.chatMessagesSeen++
    state.lastChatMessage = payload.message || ''
    state.lastSourceName = payload.sourceName || ''

    if (state.lastChatMessage === config.chatCommand) {
      say(config.reply)
    }
  }

  function onHealth () {
    state.healthEventsSeen++
  }

  function onPlayStatus (packet = {}) {
    if (packet.status === 'player_spawn') scheduleGreeting()
  }

  bot.on('chat', onChat)
  bot.on('health', onHealth)
  bot.client?.on?.('play_status', onPlayStatus)

  const api = {
    state,
    say,
    stop () {
      bot.off('chat', onChat)
      bot.off('health', onHealth)
      bot.client?.off?.('play_status', onPlayStatus)

      for (const timer of timers) clearTimeout(timer)
      timers.clear()

      delete bot.examplePlugin
      delete bot[INSTALLED]
    }
  }

  bot.examplePlugin = api
  bot[INSTALLED] = api
  return api
}

module.exports = inject
module.exports.plugin = inject
