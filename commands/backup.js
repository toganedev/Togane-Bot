import {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits
} from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('backup')
    .setDescription('サーバーのチャンネルやカテゴリー構成をテンプレートとして保存し、リンクをDMで送信します')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator), // 管理者のみ実行可能

  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });

      // テンプレート作成
      const template = await interaction.guild.templates.create(
        `backup-${Date.now()}`,
        `バックアップ作成: ${new Date().toLocaleString('ja-JP')}`
      );

      // Embed作成
      const embed = new EmbedBuilder()
        .setColor(0x00AE86)
        .setTitle('📦 サーバーバックアップ完了')
        .setDescription(
          `以下のリンクからサーバー構成を復元できます。\n\n[🔗 バックアップリンク](${template.url})`
        )
        .setFooter({ text: `サーバー: ${interaction.guild.name}` })
        .setTimestamp();

      // DM送信
      try {
        await interaction.user.send({ embeds: [embed] });
        await interaction.editReply('✅ バックアップリンクをDMに送信しました。');
      } catch (dmError) {
        await interaction.editReply('⚠️ DMを送信できませんでした。DMを有効にしてください。');
      }

    } catch (error) {
      console.error(error);
      await interaction.editReply('❌ バックアップ作成中にエラーが発生しました。');
    }
  }
};
