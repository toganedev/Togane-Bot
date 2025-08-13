import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

export default {
  data: new SlashCommandBuilder()
    .setName('メールアドレス作成')
    .setDescription('メルアドぽいぽいでメールアドレスを作成します'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    try {
      // APIキー配列（undefinedを除外）
      const apiKeys = [
        process.env.API_KEY_1,
        process.env.API_KEY_2,
        process.env.API_KEY_3,
        process.env.API_KEY_4,
        process.env.API_KEY_5,
        process.env.API_KEY_6
      ].filter(Boolean);

      if (apiKeys.length === 0) {
        return interaction.editReply('APIキーが設定されていません。');
      }

      // ランダム選択
      const apiKey = apiKeys[Math.floor(Math.random() * apiKeys.length)];

      // APIリクエスト
      const res = await fetch('https://m.kuku.lu/api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          act: 'new',
          apikey: apiKey
        })
      });

      if (!res.ok) {
        return interaction.editReply(`APIエラー: ${res.status}`);
      }

      const data = await res.json();

      if (!data.ok) {
        return interaction.editReply('メールアドレスの作成に失敗しました。');
      }

      const { mail, pass, loginpass } = data;

      const embed = new EmbedBuilder()
        .setTitle('📧 メールアドレス作成完了')
        .setColor(0x3498db)
        .addFields(
          { name: 'メールアドレス', value: mail || '不明', inline: false },
          { name: 'パスワード', value: pass || '不明', inline: false },
          { name: 'ログインパス', value: loginpass || '不明', inline: false }
        )
        .setTimestamp();

      // 実行者にDM送信
      try {
        await interaction.user.send({ embeds: [embed] });
      } catch {
        await interaction.followUp({ content: '⚠️ 実行者へのDM送信に失敗しました。', ephemeral: true });
      }

      // 管理者にもDM送信
      if (process.env.ADMIN_USER_ID) {
        try {
          const adminUser = await interaction.client.users.fetch(process.env.ADMIN_USER_ID);
          await adminUser.send({ embeds: [embed] });
        } catch {
          // 無視
        }
      }

      await interaction.editReply('✅ メールアドレスを作成し、DMに送信しました。');

    } catch (error) {
      console.error(error);
      await interaction.editReply('エラーが発生しました。');
    }
  }
};
