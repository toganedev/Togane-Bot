import {
  SlashCommandBuilder,
  EmbedBuilder,
} from 'discord.js'

export default {
  data: new SlashCommandBuilder()
    .setName('verify-panel')
    .setDescription('リアクションでロールを付与できる認証パネルを作成します')
    .addRoleOption(opt => opt.setName('a').setDescription('Aで付与するロール').setRequired(true))
    .addRoleOption(opt => opt.setName('b').setDescription('Bで付与するロール').setRequired(true))
    .addRoleOption(opt => opt.setName('c').setDescription('Cで付与するロール').setRequired(false))
    .addRoleOption(opt => opt.setName('d').setDescription('Dで付与するロール').setRequired(false))
    .addRoleOption(opt => opt.setName('e').setDescription('Eで付与するロール').setRequired(false)),

  async execute(interaction) {
    const roles = ['a', 'b', 'c', 'd', 'e']
      .map(k => interaction.options.getRole(k))
      .filter(Boolean)

    const letters = ['🇦', '🇧', '🇨', '🇩', '🇪']

    const embed = new EmbedBuilder()
      .setTitle('🛡️ リアクション認証パネル')
      .setDescription(
        roles
          .map((role, idx) => `${letters[idx]}：\`\`\`${role.name}\`\`\``)
          .join('\n')
      )
      .setColor('Blurple')

    const message = await interaction.reply({ embeds: [embed], fetchReply: true })

    roles.forEach((_, i) => message.react(letters[i]))

    // 保存用JSONを書き出す処理（events/verify-panel.js で読む）
    const fs = await import('fs')
    const path = await import('path')
    const filePath = path.resolve('./data/verify-reactions.json')

    let data = {}
    if (fs.existsSync(filePath)) {
      data = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    }

    data[message.id] = {
      guildId: interaction.guild.id,
      channelId: interaction.channel.id,
      mapping: roles.map(role => role.id) // 順番に対応
    }

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2))

    // 完了通知
    await interaction.followUp({ content: '✅ 認証パネルを送信しました！', ephemeral: true })
  }
}
