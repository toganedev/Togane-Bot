import { SlashCommandBuilder, EmbedBuilder } from 'discord.js'

export default {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('📶 Botの応答Pingを表示します'),

  async execute(interaction) {
    const sent = await interaction.reply({ content: '📡 Pinging...', fetchReply: true })

    const latency = sent.createdTimestamp - interaction.createdTimestamp

    const embed = new EmbedBuilder()
      .setColor('Random')
      .setTitle('🏓 Pong!')
      .setDescription(`🤖 Bot Latency: **${latency}ms**`)
      .setFooter({ text: 'Togane Bot', iconURL: interaction.client.user.displayAvatarURL() })
      .setTimestamp()

    await interaction.editReply({ content: '', embeds: [embed] })
  }
}
