import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('チケットパネルを作成（管理者専用）')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(o => o.setName('title').setDescription('タイトル').setRequired(false))
    .addStringOption(o => o.setName('description').setDescription('概要').setRequired(false))
    .addStringOption(o => o.setName('button').setDescription('ボタンラベル').setRequired(false))
    .addAttachmentOption(o => o.setName('image').setDescription('画像添付').setRequired(false))
    .addChannelOption(o => o.setName('category').setDescription('カテゴリ').addChannelTypes(ChannelType.GuildCategory).setRequired(false))
    .addRoleOption(o => o.setName('role').setDescription('削除/通知ロール').setRequired(false)),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '❌ 管理者専用です', ephemeral: true });
    }
    const title = interaction.options.getString('title') || '🔔 チケット';
    const description = interaction.options.getString('description') || '以下のボタンを押してチケットを作成してください。';
    const buttonLabel = interaction.options.getString('button') || '発行';
    const image = interaction.options.getAttachment('image');
    const category = interaction.options.getChannel('category');
    const role = interaction.options.getRole('role');

    const embed = {
      title,
      description,
      color: 0x3498db,
      timestamp: new Date().toISOString(),
    };
    if (image && image.contentType?.startsWith('image')) embed.image = { url: image.url };

    const customId = `ticket-open-${category?.id||'null'}-${role?.id||'null'}`;

    await interaction.reply({
      embeds: [embed],
      components: [{
        type: 1,
        components: [{ type: 2, custom_id: customId, label: buttonLabel, style: 1 }]
      }]
    });
  }
};
