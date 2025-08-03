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
        .setDescription('認証方式（必須）')
        .setRequired(true)
        .addChoices(
          { name: '✅ ワンタッチ認証', value: 'button' },
          { name: '🧠 計算問題認証', value: 'calc' }
        )
    )
    .addRoleOption(opt =>
      opt.setName('role')
        .setDescription('付与するロール（必須）')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('title')
        .setDescription('埋め込みタイトル')
        .setRequired(false)
    )
    .addStringOption(opt =>
      opt.setName('description')
        .setDescription('埋め込み概要')
        .setRequired(false)
    )
    .addAttachmentOption(opt =>
      opt.setName('image')
        .setDescription('埋め込み画像（デバイスから選択可）')
        .setRequired(false)
    ),

  async execute(interaction) {
    const method = interaction.options.getString('method')
    const role = interaction.options.getRole('role')
    const title = interaction.options.getString('title') || '🛡️ 認証パネル'
    const description =
      interaction.options.getString('description') ||
      `以下の方法で認証してください。\n付与されるロール: \`\`\`${role.name}\`\`\``

    const attachment = interaction.options.getAttachment('image')

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(description)
      .setColor(method === 'calc' ? 0x9b59b6 : 0x2ecc71)

    if (attachment?.contentType?.startsWith('image/')) {
      embed.setImage(attachment.url)
    }

    const verifyBtn = new ButtonBuilder()
      .setCustomId(`verify-btn-${method}-${role.id}`)
      .setLabel(method === 'calc' ? '🧠 計算して認証' : '✅ 認証する')
      .setStyle(method === 'calc' ? ButtonStyle.Primary : ButtonStyle.Success)

    const row = new ActionRowBuilder().addComponents(verifyBtn)

    await interaction.reply({
      embeds: [embed],
      components: [row],
      ephemeral: false
    })
  }
}
