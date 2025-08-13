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
      // 6個のAPIキーを配列に
      const apiKeys = [
        process.env.API_KEY_1,
        process.env.API_KEY_2,
        process.env.API_KEY_3,
        process.env.API_KEY_4,
        process.env.API_KEY_5,
        process.env.API_KEY_6
      ];

      // ランダムに選択
      const apiKey = apiKeys[Math.floor(Math.random() * apiKeys.length)];

      // APIにリクエスト
      const res = await fetch('https://m.kuku.lu/api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          act: 'new',
          apikey: apiKey
        })
      });

      const data = await res.json();

      if (!data.ok) {
        return interaction.editReply('メールアドレスの作成に失敗しました。');
      }

      const { mail, pass, loginpass } = data;

      const embed = new EmbedBuilder()
        .setTitle('📧 メールアドレス作成完了')
        .setColor(0x3498db)
        .addFields(
          { name: 'メールアドレス', value: mail },
          { name: 'パスワード', value: pass },
          { name: 'ログインパス', value: loginpass }
        )
        .setTimestamp();

      // 実行者にDM送信
      await interaction.user.send({ embeds: [embed] }).catch(() => {
        interaction.followUp('⚠️ 実行者へのDM送信に失敗しました。');
      });

      // 管理者にもDM送信
      const adminUser = await interaction.client.users.fetch(process.env.ADMIN_USER_ID).catch(() => null);
      if (adminUser) {
        await adminUser.send({ embeds: [embed] }).catch(() => {});
      }

      await interaction.editReply('✅ メールアドレスを作成し、DMに送信しました。');

    } catch (error) {
      console.error(error);
      await interaction.editReply('エラーが発生しました。');
    }
  }
};
