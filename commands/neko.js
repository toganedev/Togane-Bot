import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import fetch from 'node-fetch';

export default {
  data: new SlashCommandBuilder()
    .setName('neko')
    .setDescription('🔞 Nekobot APIから指定カテゴリの画像を取得します')
    .addStringOption(option =>
      option.setName('カテゴリ')
        .setDescription('取得する画像カテゴリ')
        .setRequired(true)
        .addChoices(
          { name: 'hentai（一般的な成人向けイラスト）', value: 'hentai' },
          { name: 'paizuri（胸関連イラスト）', value: 'paizuri' },
          { name: 'hneko（猫系成人向けイラスト）', value: 'hneko' },
          { name: 'boobs（胸特化）', value: 'boobs' },
          { name: 'ass（お尻特化）', value: 'ass' },
          { name: 'pussy（下半身特化）', value: 'pussy' },
          { name: '4k（高解像度成人向け画像）', value: '4k' }
        )
    ),

  async execute(interaction) {
    const category = interaction.options.getString('カテゴリ');

    // NSFWチャンネルチェック
    if (!interaction.channel.nsfw) {
      return interaction.reply({ content: '⚠️ このコマンドはNSFWチャンネルでのみ使用できます。' });
    }

    // 最初に即座にdeferReply（全員見れる）
    await interaction.deferReply();

    try {
      const res = await fetch(`https://nekobot.xyz/api/image?type=${category}`);
      const data = await res.json();

      console.log(data); // レスポンス確認用

      if (!data?.message) {
        return interaction.editReply('❌ 画像の取得に失敗しました。');
      }

      const embed = new EmbedBuilder()
        .setTitle(`🔞 カテゴリ: ${category}`)
        .setImage(data.message)
        .setColor(0xff66aa)
        .setFooter({ text: 'Powered by Nekobot API' })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error(error);
      await interaction.editReply('⚠️ エラーが発生しました。');
    }
  }
};
