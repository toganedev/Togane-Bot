// commands/mail.js
import { SlashCommandBuilder } from 'discord.js';
import axios from 'axios';
import { CookieJar } from 'tough-cookie';
import { wrapper } from 'axios-cookiejar-support';

const jar = new CookieJar();
const client = wrapper(axios.create({
  jar,
  withCredentials: true,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
  }
}));

const SESSION_HASH = process.env.KUKULU_SESSION_HASH; // .env に保存推奨

async function createMail(domain, address = '') {
  // 1. kukulu にアクセスして CSRF トークン取得
  await client.get('https://m.kuku.lu/index.php', {
    headers: { 'Cookie': `cookie_sessionhash=${SESSION_HASH}` }
  });

  const cookies = await jar.getCookies('https://m.kuku.lu');
  const csrfToken = cookies.find(c => c.key === 'cookie_csrf_token')?.value;

  if (!csrfToken) throw new Error('CSRFトークン取得失敗');

  // 2. メール作成
  const url = `https://m.kuku.lu/index.php?action=addMailAddrByManual&nopost=1&by_system=1&t=&csrf_token_check=${csrfToken}&newdomain=${domain}&newuser=${address}&recaptcha_token=&_=`;  
  const res = await client.get(url, {
    headers: { 'Cookie': `cookie_sessionhash=${SESSION_HASH}` }
  });

  if (!res.data.includes('@')) {
    console.log('=== kuku.lu response start ===');
    console.log(res.data);
    console.log('=== kuku.lu response end ===');
    throw new Error('メール作成失敗（解析エラー）');
  }

  return res.data.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)[0];
}

export default {
  data: new SlashCommandBuilder()
    .setName('メール作成')
    .setDescription('kukuluLIVEで新しい捨てメアドを作成します')
    .addStringOption(option =>
      option.setName('ドメイン')
        .setDescription('例: eay.jp')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('ユーザー名')
        .setDescription('任意: 指定しない場合はランダム')
        .setRequired(false)),
  
  async execute(interaction) {
    await interaction.deferReply({ flags: 64 }); // ephemeral の代替

    const domain = interaction.options.getString('ドメイン');
    const username = interaction.options.getString('ユーザー名') || '';

    try {
      const mailAddress = await createMail(domain, username);
      await interaction.editReply({ content: `✅ 新しいメールアドレスを作成しました:\n\`${mailAddress}\`` });
    } catch (err) {
      console.error('❌ エラー:', err);
      await interaction.editReply({ content: `❌ エラー: ${err.message}` });
    }
  }
};
