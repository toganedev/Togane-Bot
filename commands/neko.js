import { SlashCommandBuilder } from 'discord.js';
import fetch from 'node-fetch';

export default {
  data: new SlashCommandBuilder()
    .setName('neko')
    .setDescription('Nekobot APIから指定カテゴリの画像を取得します')
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

    // NSFW チャンネルチェック
    if (!interaction.channel.nsfw) {
      return interaction.reply({ content: '⚠️ このコマンドはNSFWチャンネルでのみ使用できます。' });
    }

    try {
      const res = await fetch(`https://nekobot.xyz/api/image?type=${category}`);
      const data = await res.json();

      if (!data?.message) {
        return interaction.reply('❌ 画像の取得に失敗しました。');
      }

      await interaction.reply(`🖼 カテゴリ: **${category}**\n${data.message}`);

    } catch (error) {
      console.error(error);
      await interaction.reply('⚠️ エラーが発生しました。');
    }
  }
};
