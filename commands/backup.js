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
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      if (!interaction.guild.templates) {
        return interaction.editReply('❌ このサーバーではテンプレート機能が利用できません。');
      }

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
