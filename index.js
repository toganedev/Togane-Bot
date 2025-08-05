// ======= 必要なモジュールの読み込み =======
import { Client, GatewayIntentBits, Collection, REST, Routes } from 'discord.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import express from 'express';
import { fileURLToPath } from 'url';

// ======= 環境変数の読み込み =======
dotenv.config();

// ======= __dirname の代替処理（ESM用） =======
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ======= Discordクライアントの初期化 =======
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();

// ======= コマンドの読み込みと登録 =======
const commandsPath = path.join(__dirname, 'commands');
const commandData = [];

if (fs.existsSync(commandsPath)) {
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = (await import(`file://${filePath}`)).default;

    if (command?.data?.name && command?.execute) {
      client.commands.set(command.data.name, command);
      commandData.push(command.data.toJSON());
    }
  }
}

// ======= グローバルコマンドの登録処理 =======
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('🧹 グローバルコマンドの削除...');
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: [] });

    console.log('✅ コマンドを再登録中...');
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
      body: commandData,
    });

    console.log('🎉 グローバルコマンド登録完了！');
  } catch (error) {
    console.error('❌ コマンド登録エラー:', error);
  }
})();

// ======= イベントの読み込み =======
const eventsPath = path.join(__dirname, 'events');
if (fs.existsSync(eventsPath)) {
  const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = (await import(`file://${filePath}`)).default;
    if (event?.name && typeof event.execute === 'function') {
      client[event.once ? 'once' : 'on'](event.name, (...args) => event.execute(...args));
    }
  }
}

// ======= Bot起動 =======
client.login(process.env.DISCORD_TOKEN);

// ======= Expressサーバー起動（Renderのポートバインド用） =======
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (_req, res) => {
  res.send('Bot is running!');
});

app.listen(PORT, () => {
  console.log(`🌐 Express server is listening on port ${PORT}`);
});
