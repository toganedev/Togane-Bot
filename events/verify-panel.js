import fs from 'fs'
import path from 'path'
import { EmbedBuilder } from 'discord.js'

const letters = ['🇦', '🇧', '🇨', '🇩', '🇪']
const filePath = path.resolve('./data/verify-reactions.json')

export default {
  name: 'messageReactionAdd',
  async execute(reaction, user) {
    if (user.bot) return
    if (!reaction.message.guild) return

    if (!fs.existsSync(filePath)) return
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'))

    const config = data[reaction.message.id]
    if (!config) return

    const index = letters.indexOf(reaction.emoji.name)
    if (index === -1) return

    const roleId = config.mapping[index]
    if (!roleId) return

    const member = await reaction.message.guild.members.fetch(user.id).catch(() => null)
    if (!member) return

    const role = reaction.message.guild.roles.cache.get(roleId)
    if (!role) return

    // ロール付与 or 削除
    let action
    if (member.roles.cache.has(roleId)) {
      await member.roles.remove(role)
      action = '削除'
    } else {
      await member.roles.add(role)
      action = '付与'
    }

    const embed = new EmbedBuilder()
      .setTitle(`🎫 ロール${action}`)
      .setDescription(`ロール \`\`\`${role.name}\`\`\` を${action}しました`)
      .setColor(action === '付与' ? 'Green' : 'Red')

    member.send({ embeds: [embed] }).catch(() => {})
  }
}
