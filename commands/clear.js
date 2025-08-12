import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder
} from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('🧹 メッセージを一括削除します')
    .addIntegerOption(opt =>
      opt.setName('数')
        .setDescription('削除するメッセージ数（1〜100）')
        .setRequired(true)
    )
    .addUserOption(opt =>
      opt.setName('ユーザー')
        .setDescription('特定ユーザーのメッセージのみ削除')
    )
    .addIntegerOption(opt =>
      opt.setName('日数')
        .setDescription('指定日数以内のメッセージのみ削除')
    )
    .addStringOption(opt =>
      opt.setName('キーワード')
        .setDescription('このキーワードを含むメッセージのみ削除')
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    const amount = interaction.options.getInteger('数');
    const targetUser = interaction.options.getUser('ユーザー');
    const days = interaction.options.getInteger('日数');
    const keyword = interaction.options.getString('キーワード');

    if (amount < 1 || amount > 100) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('Red')
            .setTitle('❌ エラー')
            .setDescription('削除数は **1〜100** の範囲で指定してください。')
        ],
        ephemeral: true
      });
    }

    await interaction.deferReply({ ephemeral: true });

    const messages = await interaction.channel.messages.fetch({ limit: 100 });
    const filtered = messages.filter(msg => {
      if (days) {
        const now = Date.now();
        const diff = now - msg.createdTimestamp;
        if (diff > days * 24 * 60 * 60 * 1000) return false;
      }
      if (targetUser && msg.author.id !== targetUser.id) return false;
      if (keyword && !msg.content.includes(keyword)) return false;
      return true;
    }).first(amount);

    if (filtered.length === 0) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor('Yellow')
            .setTitle('⚠️ 削除対象なし')
            .setDescription('条件に一致するメッセージが見つかりませんでした。')
        ]
      });
    }

    let totalChars = filtered.reduce((sum, msg) => sum + msg.content.length, 0);
    await interaction.channel.bulkDelete(filtered, true);

    // 実行者へのEmbed
    const resultEmbed = new EmbedBuilder()
      .setColor('Green')
      .setTitle('🧹 削除完了')
      .addFields(
        { name: '削除件数', value: `${filtered.length}件`, inline: true },
        { name: '合計文字数', value: `${totalChars}文字`, inline: true },
        ...(targetUser ? [{ name: '対象ユーザー', value: `${targetUser.tag}` }] : []),
        ...(days ? [{ name: '対象日数', value: `${days}日以内` }] : []),
        ...(keyword ? [{ name: 'キーワード', value: `${keyword}` }] : []),
        { name: '実行時間', value: `<t:${Math.floor(Date.now() / 1000)}:F>` }
      );

    await interaction.editReply({ embeds: [resultEmbed] });

    // サーバー作成者へのEmbed（DM）
    try {
      const owner = await interaction.guild.fetchOwner();
      const logEmbed = new EmbedBuilder()
        .setColor('Blue')
        .setTitle('📝 /clear 実行ログ')
        .addFields(
          { name: '実行者', value: `${interaction.user.tag} (${interaction.user.id})` },
          ...(targetUser ? [{ name: '対象ユーザー', value: `${targetUser.tag} (${targetUser.id})` }] : []),
          ...(days ? [{ name: '対象日数', value: `${days}日以内` }] : []),
          ...(keyword ? [{ name: 'キーワード', value: `${keyword}` }] : []),
          { name: '削除件数', value: `${filtered.length}件` },
          { name: '合計文字数', value: `${totalChars}文字` },
          { name: '実行日時', value: `<t:${Math.floor(Date.now() / 1000)}:F>` }
        );

      await owner.send({ embeds: [logEmbed] });
    } catch (err) {
      console.error('DM送信失敗:', err);
    }
  }
};
