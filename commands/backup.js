import {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  MessageFlags
} from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('backup')
    .setDescription('サーバー構成をテンプレートとして保存し、リンクをDMで送信します')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    try {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      if (!interaction.guild.features.includes('COMMUNITY')) {
        return interaction.editReply('⚠️ このサーバーではテンプレート機能が有効化されていません。');
      }

      if (!interaction.guild.templates) {
        return interaction.editReply('❌ このサーバーではテンプレート作成がサポートされていません。');
      }

      // テンプレート作成
      const template = await interaction.guild.templates.create(
        `backup-${Date.now()}`,
        `バックアップ作成: ${new Date().toLocaleString('ja-JP')}`
      );

      const embed = new EmbedBuilder()
        .setColor(0x00AE86)
        .setTitle('📦 サーバーバックアップ完了')
        .setDescription(`以下のリンクからサーバー構成を復元できます。\n\n[🔗 バックアップリンク](${template.url})`)
        .setFooter({ text: `サーバー: ${interaction.guild.name}` })
        .setTimestamp();

      try {
        await interaction.user.send({ embeds: [embed] });
        await interaction.editReply('✅ バックアップリンクをDMに送信しました。');
      } catch {
        await interaction.editReply('⚠️ DMを送信できませんでした。DMを有効にしてください。');
      }

    } catch (error) {
      console.error(error);
      await interaction.editReply('❌ バックアップ作成中にエラーが発生しました。');
    }
  }
};
