import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('banner')
    .setDescription('指定した人のバナーを表示します（未設定ならお知らせ）')
    .addUserOption(option =>
      option.setName('ユーザー')
        .setDescription('対象のユーザー（未指定なら自分）')
    ),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('ユーザー') || interaction.user;
    const fetchedUser = await interaction.client.users.fetch(targetUser.id, { force: true });

    if (!fetchedUser.banner) {
      const noBannerEmbed = new EmbedBuilder()
        .setColor('Red')
        .setDescription(`❌ ${targetUser.tag} はバナーを設定していません。`);
      return interaction.reply({ embeds: [noBannerEmbed] });
    }

    const bannerURL = fetchedUser.bannerURL({ size: 2048, dynamic: true });
    const embed = new EmbedBuilder()
      .setColor('Random')
      .setTitle(`${targetUser.tag} のバナー`)
      .setImage(bannerURL)
      .setFooter({ text: `ユーザーID: ${targetUser.id}` });

    await interaction.reply({ embeds: [embed] });
  }
};
