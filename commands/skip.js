import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import fetch from 'node-fetch';
import { playTrack } from './play.js'; // 共通関数を利用

const GITHUB_API_URL = 'https://api.github.com/repos/toganedev/D/contents/';

export default {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('次のランダム曲にスキップします'),

  async execute(interaction) {
    const connection = global.voiceConnection;
    const player = global.audioPlayer;

    if (!connection || !player) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle('❌ スキップできません')
            .setDescription('```現在、再生中の曲はありません。```'),
        ],
        ephemeral: true,
      });
    }

    await interaction.deferReply();

    // GitHubから曲一覧を再取得
    const listRes = await fetch(GITHUB_API_URL, {
      headers: {
        Authorization: `token ${process.env.GITHUB_TOKEN}`,
        'User-Agent': 'togane-bot',
      },
    });
    const files = await listRes.json();

    const audioFiles = files.filter(
      f => f.type === 'file' && (f.name.endsWith('.mp4') || f.name.endsWith('.m4a'))
    );

    if (audioFiles.length === 0) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle('❌ 音源なし')
            .setDescription('```再生可能な音源ファイルがありません。```'),
        ],
      });
    }

    // 新しい曲を選んで即再生
    const randomFile = audioFiles[Math.floor(Math.random() * audioFiles.length)].name;
    playTrack(randomFile, audioFiles, player, connection, interaction);

    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x00ff00)
          .setTitle('⏭ スキップ実行')
          .setDescription('```新しい曲に切り替えました。```'),
      ],
    });
  },
};
