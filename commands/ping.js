import { SlashCommandBuilder, EmbedBuilder } from 'discord.js'

export default {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('📶 Ping情報を表示します'),

  async execute(interaction) {
    const sent = await interaction.reply({ content: '📡 Pinging...', fetchReply: true })

    const embed = new EmbedBuilder()
      .setColor('Random')
      .setTitle('🏓 Pong!')
      .setDescription('```Ping結果を以下に表示します```')
      .addFields(
        {
          name: '🤖 Bot Latency',
          value: `${sent.createdTimestamp - interaction.createdTimestamp}ms`,
          inline: true
        },
        {
          name: '🌐 API Latency',
          value: `${Math.round(interaction.client.ws.ping)}ms`,
          inline: true
        },
        {
          name: '🧠 WebSocket Ping',
          value: `${interaction.client.ws.ping}ms`,
          inline: true
        }
      )
      .setFooter({ text: 'Togane Bot', iconURL: interaction.client.user.displayAvatarURL() })
      .setTimestamp()

    await interaction.editReply({ content: '', embeds: [embed] })
  }
}
