import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('チケットパネルを作成します（管理者専用）')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)

    // ✅ 必須オプションを先に
    .addStringOption(option =>
      option.setName('title')
        .setDescription('チケットのタイトル')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('description')
        .setDescription('チケットの概要')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('button_label')
        .setDescription('パネルのボタンラベル')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('color_code')
        .setDescription('埋め込みの色番号（1～10）')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(10))

    // ✅ 任意オプションは後に
    .addStringOption(option =>
      option.setName('image_url')
        .setDescription('埋め込み画像のURL（省略可）')
        .setRequired(false))
    .addChannelOption(option =>
      option.setName('category')
        .setDescription('作成先のカテゴリ（省略可）')
        .addChannelTypes(4)
        .setRequired(false))
    .addRoleOption(option =>
      option.setName('notify_role')
        .setDescription('通知・削除対象ロール（省略可）')
        .setRequired(false))
    .addUserOption(option =>
      option.setName('target_user')
        .setDescription('チケット作成時にメンションするユーザー（省略可）')
        .setRequired(false)),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({ content: 'このコマンドは管理者専用です。', ephemeral: true });
    }

    interaction.client.emit('ticketCommand', interaction);
  }
};
