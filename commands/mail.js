// commands/mail.js
import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

// メール作成関数（解析強化版）
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

  // デバッグ用（本番は消すかコメントアウト）
  console.log("=== kuku.lu response start ===");
  console.log(text);
  console.log("=== kuku.lu response end ===");

  // 3. 複数パターンでアドレス抽出
  let email = null;
  let pass = null;
  let loginpass = null;

  // hidden inputパターン
  let matchMail = text.match(/value="([^"]+@[^"]+)"/);
  if (matchMail) email = matchMail[1];

  // Data("xxxx@xxx")パターン
  if (!email) {
    matchMail = text.match(/Data\("([^"]+@[^"]+)"\)/);
    if (matchMail) email = matchMail[1];
  }

  // シンプルメール正規表現パターン
  if (!email) {
    matchMail = text.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/);
    if (matchMail) email = matchMail[0];
  }

  pass = (text.match(/name="pass"[^>]*value="([^"]*)"/) || [])[1] || "不明";
  loginpass = (text.match(/name="loginpass"[^>]*value="([^"]*)"/) || [])[1] || "不明";

  if (!email) throw new Error("メール作成失敗（解析エラー）");

  return { email, pass, loginpass };
}

export default {
  data: new SlashCommandBuilder()
    .setName('メール作成')
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

      // ランダムに選択
      const sessionHash = sessionHashes[Math.floor(Math.random() * sessionHashes.length)];

      // メール作成
      const { email, pass, loginpass } = await createMail(sessionHash);

      const embed = new EmbedBuilder()
        .setTitle('📧 メールアドレス作成完了')
        .setColor(0x3498db)
        .addFields(
          { name: 'メールアドレス', value: email, inline: false },
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
      console.error("❌ エラー:", err);
      await interaction.editReply(`❌ エラー: ${err.message || '不明なエラー'}`);
    }
  }
};
