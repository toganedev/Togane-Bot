import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription('指定した人のアバターを表示します')
    .addUserOption(option =>
      option.setName('ユーザー')
        .setDescription('対象のユーザー（未指定なら自分）')
    ),

  async execute(interaction) {
    const user = interaction.options.getUser('ユーザー') || interaction.user;

    const embed = new EmbedBuilder()
      .setColor('Random')
      .setTitle(`${user.tag} のアバター`)
      .setImage(user.displayAvatarURL({ size: 1024, dynamic: true }))
      .setFooter({ text: `ユーザーID: ${user.id}` });

    await interaction.reply({ embeds: [embed] });
  }
};
