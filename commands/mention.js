import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('mention')
    .setDescription('指定した人を指定した回数メンションします (1401421639106957464専用)')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('メンションする相手')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('count')
        .setDescription('メンション回数 (1～100)')
        .setRequired(true)),

  async execute(interaction) {
    // ID制限
    if (interaction.user.id !== '1401421639106957464') {
      return interaction.reply({
        content: 'このコマンドはあなたには使用できません。',
        ephemeral: true,
      });
    }

    const user = interaction.options.getUser('user');
    const count = interaction.options.getInteger('count');

    if (count < 1 || count > 100) {
      return interaction.reply({
        content: '回数は 1 ～ 100 の間で指定してください。',
        ephemeral: true,
      });
    }

    await interaction.reply(`✅ ${user} を ${count}回メンションします！`);

    for (let i = 0; i < count; i++) {
      await interaction.channel.send(`${user}`);
    }
  },
};
