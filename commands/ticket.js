import {
  SlashCommandBuilder,
  ChannelType
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('ticket')
  .setDescription('チケットパネルを作成します')
  .addStringOption(o => o.setName('title').setDescription('タイトル').setRequired(true))
  .addStringOption(o => o.setName('description').setDescription('概要').setRequired(true))
  .addStringOption(o => o.setName('button_label').setDescription('作成ボタンのラベル').setRequired(true))
  .addStringOption(o => o.setName('image_url').setDescription('画像URL（任意）').setRequired(false))
  .addChannelOption(o => o.setName('category').setDescription('チケットカテゴリ').addChannelTypes(ChannelType.GuildCategory).setRequired(false))
  .addRoleOption(o => o.setName('notify_role').setDescription('通知＆削除対象ロール').setRequired(false))
  .addUserOption(o => o.setName('target_user').setDescription('対象ユーザー').setRequired(false))
  .addIntegerOption(o => o.setName('color_code').setDescription('色（1〜10）').setMinValue(1).setMaxValue(10).setRequired(true));

export async function execute(interaction) {
  // emit して処理を events 側へ渡す
  interaction.client.emit('ticketCommand', interaction);
}
