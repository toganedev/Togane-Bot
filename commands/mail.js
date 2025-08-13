// commands/mail.js
import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

export default {
  data: new SlashCommandBuilder()
    .setName('メールアドレス作成')
    .setDescription('捨てアドぽいぽいで新規メールアドレスを作成'),

  async execute(interaction) {
    // 先に「応答開始」を宣言
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      const sessionHashes = [
        process.env.SESSION_HASH_1,
        process.env.SESSION_HASH_2,
        process.env.SESSION_HASH_3,
        process.env.SESSION_HASH_4,
        process.env.SESSION_HASH_5,
        process.env.SESSION_HASH_6
      ].filter(Boolean);

      if (!sessionHashes.length) {
        return interaction.editReply('SESSION_HASHが設定されていません。');
      }

      // ランダムに選択
      const sessionHash = sessionHashes[Math.floor(Math.random() * sessionHashes.length)];

      const res = await fetch('https://m.kuku.lu/exec/new_address', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cookie': `cookie_sessionhash=${sessionHash}`
        },
        body: new URLSearchParams({
          domain: 'eay.jp',
          name: ''
        })
      });

      const text = await res.text();

      // HTMLから値を抽出（hidden input系）
      const matchMail = text.match(/value="([^"]+@[^"]+)"/);
      const matchPass = text.match(/name="pass" value="([^"]+)"/);
      const matchLoginPass = text.match(/name="loginpass" value="([^"]+)"/);

      if (!matchMail) {
        return interaction.editReply('メールアドレス作成に失敗しました。（解析失敗）');
      }

      const mail = matchMail[1] ?? '不明';
      const pass = matchPass?.[1] ?? '不明';
      const loginpass = matchLoginPass?.[1] ?? '不明';

      const embed = new EmbedBuilder()
        .setTitle('📧 メールアドレス作成完了')
        .setColor(0x3498db)
        .addFields(
          { name: 'メールアドレス', value: mail },
          { name: 'パスワード', value: pass },
          { name: 'ログインパス', value: loginpass }
        )
        .setTimestamp();

      // 実行者にDM
      try {
        await interaction.user.send({ embeds: [embed] });
      } catch {
        // DM送信失敗を追加通知
        await interaction.followUp({ content: '⚠️ 実行者へのDM送信に失敗しました。', flags: MessageFlags.Ephemeral });
      }

      // 管理者にDM
      try {
        const adminUser = await interaction.client.users.fetch('1401421639106957464');
        await adminUser.send({ embeds: [embed] });
      } catch {
        // 管理者DMは失敗しても黙殺
      }

      await interaction.editReply('✅ メールアドレスを作成し、DMに送信しました。');

    } catch (err) {
      console.error(err);
      await interaction.editReply('❌ エラーが発生しました。');
    }
  }
};
