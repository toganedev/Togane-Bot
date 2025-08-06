import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('チケットパネルを送信します（管理者専用）')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(opt => opt.setName('title').setDescription('パネルのタイトル').setRequired(false))
    .addStringOption(opt => opt.setName('description').setDescription('パネルの説明').setRequired(false))
    .addStringOption(opt => opt.setName('button').setDescription('ボタンのラベル').setRequired(false))
    .addAttachmentOption(opt => opt.setName('image').setDescription('埋め込み画像').setRequired(false))
    .addChannelOption(opt => opt.setName('category').setDescription('作成先カテゴリ').addChannelTypes(ChannelType.GuildCategory).setRequired(false))
    .addRoleOption(opt => opt.setName('role').setDescription('削除・通知対象のロール').setRequired(false)),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '❌ 管理者専用コマンドです。', ephemeral: true });
    }
    interaction.client.emit('ticketCommand', interaction);
  }
};
