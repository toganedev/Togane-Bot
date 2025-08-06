import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('ticket')
  .setDescription('チケットパネルを作成します（管理者専用）')
  .addStringOption(o => 
    o.setName('title')
     .setDescription('チケットタイトル')
     .setRequired(true))
  .addStringOption(o =>
    o.setName('description')
     .setDescription('チケット概要')
     .setRequired(true))
  .addStringOption(o =>
    o.setName('button_label')
     .setDescription('パネルのボタンラベル')
     .setRequired(true))
  .addStringOption(o =>
    o.setName('image_url')
     .setDescription('埋め込み画像のURL（任意）')
     .setRequired(false))
  .addChannelOption(o =>
    o.setName('category')
     .setDescription('チケット用カテゴリ（オプション）')
     .addChannelTypes(0) // GuildCategory
     .setRequired(false))
  .addRoleOption(o =>
    o.setName('notify_role')
     .setDescription('通知＆削除権限を持つロール（オプション）')
     .setRequired(false))
  .addUserOption(o =>
    o.setName('target_user')
     .setDescription('チケット作成時メンションするユーザー（任意）')
     .setRequired(false))
  .addIntegerOption(o =>
    o.setName('color_code')
     .setDescription('パネルembedの色コード（1〜10）')
     .setMinValue(1)
     .setMaxValue(10)
     .setRequired(true));

export async function execute(interaction) {
  if (!interaction.member.permissions.has('ManageGuild')) {
    return interaction.reply({ content: 'このコマンドは管理者専用です。', ephemeral: true });
  }
  interaction.client.emit('ticketCommand', interaction);
}
