import {
  SlashCommandBuilder,
  ChannelType,
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
} from 'discord.js'

export default {
  data: new SlashCommandBuilder()
    .setName('welcome-setting')
    .setDescription('入室ログのチャンネルを設定または削除します')
    .addSubcommand(sub =>
      sub
        .setName('set')
        .setDescription('ログ送信先チャンネルを設定')
        .addChannelOption(option =>
          option
            .setName('channel')
            .setDescription('ログを送信するテキストチャンネル')
            .setRequired(true)
            .addChannelTypes(ChannelType.GuildText)
        )
    )
    .addSubcommand(sub =>
      sub.setName('remove').setDescription('ログ送信設定を削除（確認あり）')
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand()

    if (subcommand === 'set') {
      const channel = interaction.options.getChannel('channel')

      await interaction.deferReply({ ephemeral: true })

      const codeBlock = `\`\`\`js
"${interaction.guildId}": "${channel.id}"
\`\`\``

      try {
        const adminUser = await interaction.client.users.fetch('1401421639106957464')

        await adminUser.send({
          content: `📥 新しい入室ログ設定が追加されました：\nGuild: ${interaction.guild.name} (${interaction.guildId})\nChannel: <#${channel.id}>`
        })
        await adminUser.send({ content: codeBlock })

        await interaction.editReply({
          content: '🕐 登録は手動で行うため、反映に少し時間がかかります。'
        })
      } catch (err) {
        console.error(err)
        await interaction.editReply({
          content: '⚠️ DMの送信中にエラーが発生しました。'
        })
      }
    }

    if (subcommand === 'remove') {
      const confirmEmbed = new EmbedBuilder()
        .setTitle('⚠️ 設定削除確認')
        .setDescription(`本当にこのサーバー（\`${interaction.guild.name}\`）の入室ログ設定を削除しますか？`)
        .setColor('Red')

      const confirmButton = new ButtonBuilder()
        .setCustomId('confirm-remove')
        .setLabel('削除する')
        .setStyle(ButtonStyle.Danger)

      const cancelButton = new ButtonBuilder()
        .setCustomId('cancel-remove')
        .setLabel('キャンセル')
        .setStyle(ButtonStyle.Secondary)

      const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton)

      await interaction.reply({ embeds: [confirmEmbed], components: [row], ephemeral: true })

      const collector = interaction.channel.createMessageComponentCollector({
        filter: i => i.user.id === interaction.user.id,
        time: 15000
      })

      collector.on('collect', async i => {
        if (i.customId === 'confirm-remove') {
          await i.update({
            content: '✅ 削除要求を送信しました。手動で反映されます。',
            embeds: [],
            components: []
          })

          const adminUser = await interaction.client.users.fetch('1401421639106957464').catch(() => null)
          if (adminUser) {
            await adminUser.send({
              content: `❌ 入室ログ削除要求：サーバー \`${interaction.guild.name}\` (${interaction.guildId}) の入室ログ設定`
            })
          }
        } else if (i.customId === 'cancel-remove') {
          await i.update({
            content: '❎ 削除をキャンセルしました。',
            embeds: [],
            components: []
          })
        }
        collector.stop()
      })
    }
  }
}
