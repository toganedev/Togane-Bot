import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream';
import { promisify } from 'util';
import { createAudioResource } from '@discordjs/voice';

const streamPipeline = promisify(pipeline);

const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/toganedev/D/main/';

export default {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('次の曲にスキップします'),

  async execute(interaction) {
    const connection = global.voiceConnection;
    const player = global.audioPlayer;

    if (!connection || !player || !global.currentTrack || !global.nextTrack) {
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

    const skipped = global.currentTrack;
    const newTrack = global.nextTrack;

    // --- 次の次の曲を新しく決める ---
    const listRes = await fetch(
      'https://api.github.com/repos/toganedev/D/contents/',
      {
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
          'User-Agent': 'togane-bot',
        },
      }
    );
    const files = await listRes.json();
    const audioFiles = files.filter(
      f => f.type === 'file' && (f.name.endsWith('.mp4') || f.name.endsWith('.m4a'))
    );
    const nextFile = audioFiles
      .filter(f => f.name !== newTrack)
      [Math.floor(Math.random() * (audioFiles.length - 1))].name;

    global.currentTrack = newTrack;
    global.nextTrack = nextFile;

    // --- ダウンロード ---
    const fileUrl = `${GITHUB_RAW_BASE}${newTrack}`;
    const tempPath = path.join('/tmp', newTrack);
    const res = await fetch(fileUrl);
    if (!res.ok) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle('❌ ダウンロード失敗')
            .setDescription('```音源を取得できませんでした。```'),
        ],
      });
    }
    await streamPipeline(res.body, fs.createWriteStream(tempPath));

    const resource = createAudioResource(tempPath);
    player.play(resource);

    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x00ff00)
          .setTitle('⏭ スキップ実行')
          .setDescription(
            `\`\`\`\n${skipped} をスキップし、${newTrack} を再生しました。\n次の曲: ${nextFile}\n\`\`\``
          ),
      ],
    });
  },
};
