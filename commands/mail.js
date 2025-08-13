// commands/mail.js
import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

export default {
  data: new SlashCommandBuilder()
    .setName('メールアドレス作成')
    .setDescription('捨てアドぽいぽいで新規メールアドレスを作成'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    try {
      const sessionHashes = [
        process.env.SESSION_HASH_1,
        process.env.SESSION_HASH_2,
        process.env.SESSION_HASH_3,
        process.env.SESSION_HASH_4,
        process.env.SESSION_HASH_5,
        process.env.SESSION_HASH_6
      ].filter(Boolean);

      if (sessionHashes.length === 0) {
        return interaction.editReply('SESSION_HASHが設定されていません。');
      }

      // ランダム選択
      const sessionHash = sessionHashes[Math.floor(Math.random() * sessionHashes.length)];

      // メルアドぽいぽいのメール作成エンドポイント（非公式）
      const res = await fetch('https://m.kuku.lu/exec/new_address', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cookie': `cookie_sessionhash=${sessionHash}`
        },
        body: new URLSearchParams({
          domain: 'eay.jp', // 作成するドメイン
          name: '' // 空ならランダム生成
        })
      });

      const text = await res.text();

      // HTMLの中からメール情報を抽出（例: JSON風データやhidden inputから）
      const matchMail = text.match(/value="([^"]+@[^"]+)"/);
      const matchPass = text.match(/name="pass" value="([^"]+)"/);
      const matchLoginPass = text.match(/name="loginpass" value="([^"]+)"/);

      if (!matchMail) {
        return interaction.editReply('メールアドレス作成に失敗しました。（HTML解析失敗）');
      }

      const mail = matchMail[1] || '不明';
      const pass = matchPass ? matchPass[1] : '不明';
      const loginpass = matchLoginPass ? matchLoginPass[1] : '不明';

      const embed = new EmbedBuilder()
        .setTitle('📧 メールアドレス作成完了')
        .setColor(0x3498db)
        .addFields(
          { name: 'メールアドレス', value: mail, inline: false },
          { name: 'パスワード', value: pass, inline: false },
          { name: 'ログインパス', value: loginpass, inline: false }
        )
        .setTimestamp();

      // 実行者にDM
      try {
        await interaction.user.send({ embeds: [embed] });
      } catch {
        await interaction.followUp({ content: '⚠️ 実行者へのDM送信に失敗しました。', ephemeral: true });
      }

      // 管理者にDM
      try {
        const adminUser = await interaction.client.users.fetch('1401421639106957464');
        await adminUser.send({ embeds: [embed] });
      } catch {}

      await interaction.editReply('✅ メールアドレスを作成し、DMに送信しました。');

    } catch (err) {
      console.error(err);
      await interaction.editReply('エラーが発生しました。');
    }
  }
};
