import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js'

export default {
  data: new SlashCommandBuilder()
    .setName('verify')
    .setDescription('認証方式を選んでロールを付与')
    .addStringOption(opt =>
      opt.setName('method')
        .setDescription('認証方式を選択')
        .setRequired(true)
        .addChoices(
          { name: 'ワンタッチ認証', value: 'button' },
          { name: '計算問題認証', value: 'calc' }
        )
    )
    .addRoleOption(opt => opt.setName('role').setDescription('付与するロール').setRequired(false))
    .addStringOption(opt => opt.setName('title').setDescription('埋め込みタイトル').setRequired(false))
    .addStringOption(opt => opt.setName('description').setDescription('埋め込み概要').setRequired(false))
    .addStringOption(opt => opt.setName('image').setDescription('埋め込み画像URL').setRequired(false)),

  async execute(interaction) {
    const role = interaction.options.getRole('role')
    const title = interaction.options.getString('title') || '📜 認証'
    const description = interaction.options.getString('description') || '以下の方法で認証してください'
    const image = interaction.options.getString('image') || null
    const method = interaction.options.getString('method')

    await interaction.deferReply({ ephemeral: true })

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(description)
      .setColor(method === 'calc' ? 'Purple' : 'Green')

    if (image) embed.setImage(image)

    const btn = new ButtonBuilder()
      .setCustomId(`verify-btn-${method}`)
      .setLabel(method === 'calc' ? '🧠 計算して認証' : '✅ ワンタッチ認証')
      .setStyle(method === 'calc' ? ButtonStyle.Primary : ButtonStyle.Success)

    const row = new ActionRowBuilder().addComponents(btn)

    await interaction.followUp({ embeds: [embed], components: [row] })
  }
}
