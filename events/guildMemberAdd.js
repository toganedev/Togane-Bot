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
    // データファイルチェック
    if (!fs.existsSync(welcomeFile)) return
    const data = JSON.parse(fs.readFileSync(welcomeFile, 'utf8'))

    // このサーバー用のチャンネルIDを取得
    const channelId = data[member.guild.id]
    if (!channelId) return

    const channel = member.guild.channels.cache.get(channelId)
    if (!channel?.isTextBased()) return

    // Canvas作成
    const canvas = Canvas.createCanvas(700, 250)
    const ctx = canvas.getContext('2d')

    // 白背景で塗りつぶし
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // テキスト設定
    ctx.font = '32px "DejaVu Sans"'
    ctx.fillStyle = '#333333'
    ctx.fillText(`Welcome, ${member.user.tag}!`, 260, 70)

    ctx.font = '20px "DejaVu Sans"'
    ctx.fillStyle = '#666666'
    ctx.fillText(`User ID: ${member.id}`, 260, 120)
    ctx.fillText(`Guild: ${member.guild.name}`, 260, 150)

    // アバター描画（丸型）
    ctx.beginPath()
    ctx.arc(125, 125, 100, 0, Math.PI * 2, true)
    ctx.closePath()
    ctx.clip()

    const avatar = await Canvas.loadImage(
      member.user.displayAvatarURL({ extension: 'jpg', size: 256 })
    )
    ctx.drawImage(avatar, 25, 25, 200, 200)

    const attachment = new AttachmentBuilder(canvas.toBuffer('image/png'), {
      name: 'welcome-image.png'
    })

    // メッセージ送信（1回のみ）
    await channel.send({
      content: `👋 ようこそ <@${member.id}>`,
      files: [attachment]
    })
  }
}
