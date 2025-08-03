import {
  SlashCommandBuilder,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
} from 'discord.js'

export default {
  data: new SlashCommandBuilder()
    .setName('verify')
    .setDescription('ロールを付与（ボタン or 計算フォーム）')
    .addRoleOption(opt => opt.setName('role').setDescription('付与するロール').setRequired(false))
    .addStringOption(opt => opt.setName('title').setDescription('埋め込みタイトル').setRequired(false))
    .addStringOption(opt => opt.setName('description').setDescription('埋め込み概要').setRequired(false))
    .addStringOption(opt => opt.setName('image').setDescription('埋め込み画像URL').setRequired(false)),

  async execute(interaction) {
    const role = interaction.options.getRole('role')
    const title = interaction.options.getString('title') || 'Verify'
    const description = interaction.options.getString('description') || 'ボタンを押して認証してください'
    const image = interaction.options.getString('image') || null

    await interaction.reply({ ephemeral: true, content: '✅ メッセージを送信しました。' })

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(description)
      .setColor('Blue')
    if (image) embed.setImage(image)

    const buttonVerify = new ButtonBuilder()
      .setCustomId('verify-button')
      .setLabel('✅ 認証する')
      .setStyle(ButtonStyle.Success)
    const buttonCalc = new ButtonBuilder()
      .setCustomId('verify-calc')
      .setLabel('🧠 計算して認証')
      .setStyle(ButtonStyle.Primary)

    const actionRow = new ActionRowBuilder().addComponents(buttonVerify, buttonCalc)

    await interaction.channel.send({ embeds: [embed], components: [actionRow] })
  }
}
