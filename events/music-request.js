import { EmbedBuilder, Events } from 'discord.js';

export default {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (!interaction.isModalSubmit()) return;
    if (interaction.customId !== 'music-request') return;

    const title = interaction.fields.getTextInputValue('title');
    const url = interaction.fields.getTextInputValue('url');

    // URLバリデーション
    if (!url.startsWith('https://')) {
      const errorEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('❌ 無効なURL')
        .setDescription('URLは `https://` から始めてください。')
        .setTimestamp();
      return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }

    // JST時間
    const nowJST = new Date(Date.now() + 9 * 60 * 60 * 1000);
    const formattedTime = nowJST.toISOString().replace('T', ' ').split('.')[0] + ' (JST)';

    const embed = new EmbedBuilder()
      .setColor(0x00ffcc)
      .setTitle('🎶 新しい曲リクエスト')
      .addFields(
        { name: '曲名', value: `\`\`\`${title}\`\`\``, inline: false },
        { name: 'URL', value: `\`\`\`${url}\`\`\``, inline: false },
        { name: 'リクエスト者', value: `${interaction.user.tag}`, inline: true },
        { name: 'ユーザーID', value: `${interaction.user.id}`, inline: true },
        { name: '時間', value: formattedTime, inline: false }
      )
      .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
      .setTimestamp();

   import { EmbedBuilder, Events } from 'discord.js';

export default {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (!interaction.isModalSubmit()) return;
    if (interaction.customId !== 'music-request') return;

    const title = interaction.fields.getTextInputValue('title');
    const url = interaction.fields.getTextInputValue('url');

    // URLバリデーション
    if (!url.startsWith('https://')) {
      const errorEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('❌ 無効なURL')
        .setDescription('URLは `https://` から始めてください。')
        .setTimestamp();
      return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }

    // JST時間
    const nowJST = new Date(Date.now() + 9 * 60 * 60 * 1000);
    const formattedTime = nowJST.toISOString().replace('T', ' ').split('.')[0] + ' (JST)';

    const embed = new EmbedBuilder()
      .setColor(0x00ffcc)
      .setTitle('🎶 新しい曲リクエスト')
      .addFields(
        { name: '曲名', value: `\`\`\`${title}\`\`\``, inline: false },
        { name: 'URL', value: `\`\`\`${url}\`\`\``, inline: false },
        { name: 'リクエスト者', value: `${interaction.user.tag}`, inline: true },
        { name: 'ユーザーID', value: `${interaction.user.id}`, inline: true },
        { name: '時間', value: formattedTime, inline: false }
      )
      .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
      .setTimestamp();

    // 指定チャンネルに送信
    const targetChannelId = '1401421639106957464';
    const channel = await interaction.client.channels.fetch(targetChannelId);
    if (!channel) {
      return interaction.reply({ content: '❌ リクエスト送信先チャンネルが見つかりません。', ephemeral: true });
    }

    await channel.send({ embeds: [embed] });

    // ユーザーには完了メッセージ
    await interaction.reply({ content: '✅ リクエストを送信しました！', ephemeral: true });
  }
};
