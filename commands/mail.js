// commands/mail.js
import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

async function createMail(sessionHash, domain = "eay.jp", address = "") {
  // 1. CSRFトークン取得
  const csrfRes = await fetch("https://m.kuku.lu/index.php", {
    headers: {
      "User-Agent": "Mozilla/5.0",
      "Cookie": `cookie_sessionhash=${sessionHash}`
    }
  });

  const setCookie = csrfRes.headers.get("set-cookie") || "";
  const csrfTokenMatch = setCookie.match(/cookie_csrf_token=([^;]+)/);
  if (!csrfTokenMatch) throw new Error("CSRFトークン取得失敗");
  const csrfToken = csrfTokenMatch[1];

  // 2. メール作成リクエスト
  const url = `https://m.kuku.lu/index.php?action=addMailAddrByManual&nopost=1&by_system=1&t=&csrf_token_check=${csrfToken}&newdomain=${domain}&newuser=${address}&recaptcha_token=&_=`;  

  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      "Cookie": `cookie_sessionhash=${sessionHash}`
    }
  });

  const text = await res.text();

  // 3. 必要情報の抽出
  const matchMail = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  const matchPass = text.match(/name="pass"[^>]*value="([^"]*)"/);
  const matchLoginPass = text.match(/name="loginpass"[^>]*value="([^"]*)"/);

  if (!matchMail) throw new Error("メール作成失敗（解析エラー）");

  return {
    email: matchMail[1],
    pass: matchPass ? matchPass[1] : "不明",
    loginpass: matchLoginPass ? matchLoginPass[1] : "不明"
  };
}

export default {
  data: new SlashCommandBuilder()
    .setName('メール作成')
    .setDescription('メルアドぽいぽいで新規メールアドレスを作成'),

  async execute(interaction) {
    await interaction.deferReply({ flags: 64 }); // ephemeral

    try {
      // SESSION_HASHを取得
      const sessionHashes = [
        process.env.SESSION_HASH_1
      ].filter(Boolean);

      if (sessionHashes.length === 0) {
        return interaction.editReply('❌ SESSION_HASHが設定されていません。');
      }

      // ランダム選択
      const sessionHash = sessionHashes[Math.floor(Math.random() * sessionHashes.length)];

      // メール作成
      const mailData = await createMail(sessionHash);

      const embed = new EmbedBuilder()
        .setTitle('📧 メールアドレス作成完了')
        .setColor(0x3498db)
        .addFields(
          { name: 'メールアドレス', value: mailData.email },
          { name: 'パスワード', value: mailData.pass },
          { name: 'ログインパス', value: mailData.loginpass }
        )
        .setTimestamp();

      // 実行者にDM
      try {
        await interaction.user.send({ embeds: [embed] });
      } catch {
        await interaction.followUp({ content: '⚠️ 実行者へのDM送信に失敗しました。', flags: 64 });
      }

      // 管理者にDM
      try {
        const adminUser = await interaction.client.users.fetch('1401421639106957464');
        await adminUser.send({ embeds: [embed] });
      } catch {}

      await interaction.editReply('✅ メールアドレスを作成し、DMに送信しました。');

    } catch (err) {
      console.error(err);
      await interaction.editReply(`❌ エラー: ${err.message || err}`);
    }
  }
};
