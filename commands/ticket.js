import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('チケットパネルを作成（管理者専用）')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(o => o.setName('title').setDescription('パネルタイトル').setRequired(false))
    .addStringOption(o => o.setName('description').setDescription('パネル説明').setRequired(false))
    .addStringOption(o => o.setName('button').setDescription('ボタンラベル').setRequired(false))
    .addAttachmentOption(o => o.setName('image').setDescription('画像添付').setRequired(false))
    .addChannelOption(o => o.setName('category').setDescription('チャンネルカテゴリ').addChannelTypes(ChannelType.GuildCategory).setRequired(false))
    .addRoleOption(o => o.setName('role').setDescription('削除・通知ロール').setRequired(false)),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '❌ 管理者専用です', ephemeral: true });
    }
    interaction.client.emit('ticketCommand', interaction);
  }
};
