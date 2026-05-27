# Bedrock Example Plugin

Example plugin for [`prismarine-bedrock`](https://github.com/deepslate-bedrock/prismarine-bedrock).

The plugin shape is intentionally close to Prismarine Bedrock built-ins and
Mineflayer-style plugins: export one injection function, receive the bot state,
attach a small public API, and subscribe to bot/client events.

## Install

```sh
pnpm add github:deepslate-bedrock/bedrock-example-plugin prismarine-bedrock
```

## Use With `createBot`

`createBot()` starts the client immediately, so load external plugins with the
package-level `pluginLoader` after construction. The loader injects the plugin
immediately once the bot has already started.

```js
const { createBot, pluginLoader } = require('prismarine-bedrock')
const examplePlugin = require('bedrock-example-plugin')

const bot = createBot({
  host: 'localhost',
  port: 19132,
  username: 'ExamplePluginBot',
  offline: true,
  examplePlugin: {
    chatCommand: '!example',
    reply: 'Example plugin is loaded.'
  }
})

pluginLoader.loadPlugin(bot, examplePlugin)
```

## Load Before Start

Use `BotState` directly when a plugin should be queued before the Bedrock client
starts.

```js
const { BotState, pluginLoader } = require('prismarine-bedrock')
const examplePlugin = require('bedrock-example-plugin')

const bot = new BotState({
  host: 'localhost',
  port: 19132,
  username: 'ExamplePluginBot',
  offline: true,
  examplePlugin: {
    greeting: 'Example plugin loaded. Type !example in chat.'
  }
})

pluginLoader.loadPlugin(bot, examplePlugin)
bot.start()
```

## Plugin Pattern

```js
function inject (bot, options = {}) {
  bot.examplePlugin = {
    say: message => bot.chat(message)
  }

  bot.on('chat', ({ message }) => {
    if (message === '!example') bot.examplePlugin.say('Example plugin is loaded.')
  })
}

module.exports = inject
```

Prismarine Bedrock built-ins follow this same general principle. A plugin should
keep state on the bot, add focused methods, and prefer public bot events before
falling back to low-level `bot.client` packets.

## API

- `bot.examplePlugin.state`: counters and the last chat message seen.
- `bot.examplePlugin.say(message)`: send chat through `bot.chat()` when the chat
  built-in is available, otherwise queue a Bedrock `text` packet directly.
- `bot.examplePlugin.stop()`: remove listeners and clear scheduled greetings.

## Test

```sh
pnpm test
```
