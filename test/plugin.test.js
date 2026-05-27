'use strict'

const assert = require('node:assert/strict')
const { EventEmitter } = require('node:events')
const test = require('node:test')
const plugin = require('../')

function createBot () {
  const bot = new EventEmitter()
  bot.client = new EventEmitter()
  bot.client.queued = []
  bot.client.queue = (name, params) => {
    bot.client.queued.push({ name, params })
  }
  bot.options = { username: 'PluginTestBot' }
  return bot
}

test('injects an idempotent Prismarine Bedrock plugin API', () => {
  const bot = createBot()

  const first = plugin(bot)
  const second = plugin(bot)

  assert.equal(first, second)
  assert.equal(bot.examplePlugin, first)
  assert.equal(typeof first.say, 'function')
  assert.equal(typeof first.stop, 'function')
})

test('tracks chat and replies to the configured command', () => {
  const bot = createBot()
  const api = plugin(bot, {
    examplePlugin: {
      chatCommand: '!ping',
      reply: 'pong'
    }
  })

  bot.emit('chat', {
    sourceName: 'Alex',
    message: '!ping'
  })

  assert.equal(api.state.chatMessagesSeen, 1)
  assert.equal(api.state.lastSourceName, 'Alex')
  assert.equal(api.state.lastChatMessage, '!ping')
  assert.deepEqual(bot.client.queued, [
    {
      name: 'text',
      params: {
        needs_translation: false,
        category: 'authored',
        type: 'chat',
        source_name: 'PluginTestBot',
        message: 'pong',
        xuid: '',
        platform_chat_id: '',
        has_filtered_message: false
      }
    }
  ])
})

test('stop removes listeners and the public API', () => {
  const bot = createBot()
  const api = plugin(bot)

  api.stop()
  bot.emit('chat', { sourceName: 'Alex', message: '!example' })

  assert.equal(bot.examplePlugin, undefined)
  assert.equal(api.state.chatMessagesSeen, 0)
  assert.deepEqual(bot.client.queued, [])
})
