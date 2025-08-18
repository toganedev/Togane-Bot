import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('mention')
  .setDescription('指定した人を指定した回数メンションします (1401421639106957464専用)')
  .addUserOption(option =>
    option.setName('user')
      .setDescription('メンションする相手')
      .setRequired(true))
  .addIntegerOption(option =>
    option.setName('count')
      .setDescription('メンション回数 (1～10推奨)')
      .setRequired(true));

export async function execute(interaction) {
  // 専用ユーザー以外は弾く
  if (interaction.user.id !== '1401421639106957464') {
    return interaction.reply({ content: 'このコマンドはあなたには使用できません。', ephemeral: true });
  }

  const user = interaction.options.getUser('user');
  const count = interaction.options.getInteger('count');

  // 回数の上限を制御（荒らし防止）
  if (count < 1 || count > 10) {
    return interaction.reply({ content: '回数は 1 ～ 10 の間で指定してください。', ephemeral: true });
  }

  // コマンド実行通知（ephemeral=false にしてチャンネルに表示）
  await interaction.reply(`✅ ${user} を ${count}回メンションします！`);

  // 実際のメンション送信
  for (let i = 0; i < count; i++) {
    await interaction.channel.send(`${user}`);
  }
}
