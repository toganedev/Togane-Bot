import fs from 'fs'
import path from 'path'
import { AttachmentBuilder } from 'discord.js'
import Canvas from 'canvas'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const welcomeFile = path.join(__dirname, '../data/welcomeChannels.json')

export default {
  name: 'guildMemberAdd',
  async execute(member) {
    if (!fs.existsSync(welcomeFile)) return
    const data = JSON.parse(fs.readFileSync(welcomeFile, 'utf8'))

    const channelId = data[member.guild.id]
    if (!channelId) return

    const channel = member.guild.channels.cache.get(channelId)
    if (!channel || !channel.isTextBased()) return

    const canvas = Canvas.createCanvas(700, 250)
    const ctx = canvas.getContext('2d')

    const background = await Canvas.loadImage('https://i.imgur.com/AfFp7pu.png')
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height)

    ctx.font = '28px sans-serif'
    ctx.fillStyle = '#ffffff'
    ctx.fillText(`Welcome, ${member.user.tag}!`, canvas.width / 2.5, canvas.height / 3)

    ctx.font = '20px sans-serif'
    ctx.fillText(`User ID: ${member.id}`, canvas.width / 2.5, canvas.height / 2.2)
    ctx.fillText(`Guild: ${member.guild.name}`, canvas.width / 2.5, canvas.height / 1.8)

    ctx.beginPath()
    ctx.arc(125, 125, 100, 0, Math.PI * 2, true)
    ctx.closePath()
    ctx.clip()

    const avatar = await Canvas.loadImage(member.user.displayAvatarURL({ extension: 'jpg' }))
    ctx.drawImage(avatar, 25, 25, 200, 200)

    const attachment = new AttachmentBuilder(canvas.toBuffer('image/png'), {
      name: 'welcome-image.png'
    })

    await channel.send({
      content: `👋 ようこそ <@${member.id}>`,
      files: [attachment]
    })
  }
}
