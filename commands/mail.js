import { SlashCommandBuilder } from 'discord.js';
import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import dotenv from 'dotenv';

dotenv.config();

async function createMail() {
  const jar = new CookieJar();

  // 環境変数から Cookie をセット
  jar.setCookieSync(`cookie_sessionhash=${process.env.KUKU_COOKIE_SESSIONHASH}`, 'https://m.kuku.lu');
  jar.setCookieSync(`cookie_uid=${process.env.KUKU_COOKIE_UID}`, 'https://m.kuku.lu');
  jar.setCookieSync(`cookie_setlang=${process.env.KUKU_COOKIE_SETLANG}`, 'https://m.kuku.lu');
  if (process.env.KUKU_COOKIE_TIMEZONE) {
    jar.setCookieSync(`cookie_timezone=${process.env.KUKU_COOKIE_TIMEZONE}`, 'https://m.kuku.lu');
  }

  const client = wrapper(axios.create({ jar, withCredentials: true }));

  // 1. index.php にアクセスして CSRF トークン取得
  const indexRes = await client.get('https://m.kuku.lu/index.php');
  const cookies = await jar.getCookies('https://m.kuku.lu');
  const csrfCookie = cookies.find(c => c.key === 'cookie_csrf_token');

  if (!csrfCookie) {
    throw new Error('CSRF トークン取得失敗');
  }
  const csrfToken = csrfCookie.value;

  // 2. メール作成リクエスト
  const formData = new URLSearchParams();
  formData.append('action', 'create');
  formData.append('csrf_token', csrfToken);

  const createRes = await client.post('https://m.kuku.lu/index.php', formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  // HTML からメールアドレス抽出
  const match = createRes.data.match(/<input[^>]*id="Addr"[^>]*value="([^"]+)"/);
  if (!match) {
    throw new Error('メール作成失敗（解析エラー）');
  }

  return match[1];
}

export default {
  data: new SlashCommandBuilder()
    .setName('メール作成')
    .setDescription('Kuku.lu で新しいメールアドレスを作成します'),

  async execute(interaction) {
    await interaction.deferReply({ flags: 64 }); // ephemeral の代替

    try {
      const email = await createMail();
      await interaction.editReply({ content: `✅ 新しいメールアドレスを作成しました: **${email}**` });
    } catch (err) {
      console.error(err);
      await interaction.editReply({ content: `❌ エラー: ${err.message}` });
    }
  },
};
