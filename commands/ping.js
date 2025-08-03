import { SlashCommandBuilder, EmbedBuilder } from 'discord.js'

export default {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('📶 Ping情報を表示します'),

  async execute(interaction) {
    const sent = await interaction.reply({ content: '📡 Pinging...', fetchReply: true })

    const botLatency = sent.createdTimestamp - interaction.createdTimestamp
    const wsPing = interaction.client.ws.ping

    const embed = new EmbedBuilder()
      .setColor('Random')
      .setTitle('🏓 Pong!')
      .setDescription('```Ping結果を以下に表示します```')
      .addFields(
        {
          name: '🤖 Bot Latency',
          value: `${botLatency}ms`,
          inline: true
        },
        {
          name: '🌐 API Latency',
          value: wsPing < 0 ? '未接続' : `${wsPing}ms`,
          inline: true
        },
        {
          name: '🧠 WebSocket Ping',
          value: wsPing < 0 ? '未接続' : `${wsPing}ms`,
          inline: true
        }
      )
      .setFooter({ text: 'Togane Bot', iconURL: interaction.client.user.displayAvatarURL() })
      .setTimestamp()

    await interaction.editReply({ content: '', embeds: [embed] })
  }
}
