import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
} from '@discordjs/voice';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream';
import { promisify } from 'util';

const streamPipeline = promisify(pipeline);

const GITHUB_API_URL = 'https://api.github.com/repos/toganedev/D/contents/';
const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/toganedev/D/main/';

export default {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('GitHubから曲を再生します')
    .addStringOption(option =>
      option
        .setName('title')
        .setDescription('曲名（部分一致可・省略可）')
        .setRequired(false)
    ),

  async execute(interaction) {
    const title = interaction.options.getString('title');

    // VC取得
    let member = interaction.member;
    if (!member.voice || !member.voice.channel) {
      member = await interaction.guild.members.fetch(interaction.user.id);
    }
    const channel = member.voice.channel;
    if (!channel) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle('⚠ エラー')
            .setDescription('```ボイスチャンネルに参加してください！```'),
        ],
        ephemeral: true,
      });
    }

    await interaction.deferReply();

    // GitHubからファイル一覧を取得
    const listRes = await fetch(GITHUB_API_URL, {
      headers: {
        Authorization: `token ${process.env.GITHUB_TOKEN}`,
        'User-Agent': 'togane-bot',
      },
    });
    const files = await listRes.json();

    if (!Array.isArray(files)) {
      console.error('GitHub API Error:', files);
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle('❌ GitHub APIエラー')
            .setDescription('```ファイル一覧を取得できませんでした。```'),
        ],
      });
    }

    const audioFiles = files.filter(
      f =>
        f.type === 'file' &&
        (f.name.endsWith('.mp4') || f.name.endsWith('.m4a'))
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

    // --- 部分一致検索 ---
    let currentFile;
    if (title) {
      const candidate = audioFiles.find(f =>
        f.name.toLowerCase().includes(title.toLowerCase())
      );
      if (!candidate) {
        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor(0xff0000)
              .setTitle('❌ 曲が見つかりません')
              .setDescription(`\`\`\`\n${title} を含むファイルは存在しません。\n\`\`\``),
          ],
        });
      }
      currentFile = candidate.name;
    } else {
      currentFile = audioFiles[Math.floor(Math.random() * audioFiles.length)].name;
    }

    // --- 次の曲をランダムに決定 ---
    const nextFile = audioFiles
      .filter(f => f.name !== currentFile)
      [Math.floor(Math.random() * (audioFiles.length - 1))].name;

    global.currentTrack = currentFile;
    global.nextTrack = nextFile;

    // --- ダウンロード ---
    const fileUrl = `${GITHUB_RAW_BASE}${currentFile}`;
    const tempPath = path.join('/tmp', currentFile);
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

    // VC接続
    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator,
    });

    const resource = createAudioResource(tempPath);
    const player = createAudioPlayer();
    connection.subscribe(player);

    global.voiceConnection = connection;
    global.audioPlayer = player;

    player.play(resource);

    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x00ff00)
          .setTitle('🎵 再生開始')
          .setDescription(
            `\`\`\`\n現在: ${currentFile}\n次: ${nextFile}\n\`\`\``
          ),
      ],
    });

    player.on(AudioPlayerStatus.Idle, () => {
      connection.destroy();
      fs.unlink(tempPath, () => {});
    });

    player.on('error', error => {
      console.error(error);
      connection.destroy();
      fs.unlink(tempPath, () => {});
    });
  },
};
