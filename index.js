import { Client, GatewayIntentBits, Collection } from 'discord.js'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import express from 'express'
import { fileURLToPath } from 'url'
import './deploy-commands.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates
  ]
})

client.commands = new Collection()

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'))
for (const file of commandFiles) {
  const command = await import(`./commands/${file}`)
  client.commands.set(command.default.data.name, command.default)
}

const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'))
for (const file of eventFiles) {
  const event = await import(`./events/${file}`)
  if (event.default.once) {
    client.once(event.default.name, (...args) => event.default.execute(...args, client))
  } else {
    client.on(event.default.name, (...args) => event.default.execute(...args, client))
  }
}

// 🔧 Render が検出できるように明示的に PORT にバインド
const app = express()
app.get('/', (_, res) => res.send('Togane Bot is running'))

const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`✅ Express server is listening on port ${PORT}`)
})

client.login(process.env.TOKEN)
