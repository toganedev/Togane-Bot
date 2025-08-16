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

// 再生関数（ループ対応）
async function playTrack(fileName, files, player, connection, interaction) {
  const fileUrl = `${GITHUB_RAW_BASE}${fileName}`;
  const tempPath = path.join('/tmp', fileName);

  const res = await fetch(fileUrl);
  if (!res.ok) {
    await interaction.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0xff0000)
          .setTitle('❌ ダウンロード失敗')
          .setDescription('音源を取得できませんでした。'),
      ],
    });
    return;
  }
  await streamPipeline(res.body, fs.createWriteStream(tempPath));

  const resource = createAudioResource(tempPath);
  player.play(resource);

  // 次の曲をランダムに決定
  const nextFile = files[Math.floor(Math.random() * files.length)].name;

  // Embed送信（現在と次を表示）
  await interaction.channel.send({
    embeds: [
      new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle('🎵 再生開始')
        .setDescription(
          `\`\`\`\n現在: ${fileName}\n次: ${nextFile}\n\`\`\``
        ),
    ],
  });

  // 曲が終わったら次を再生
  player.once(AudioPlayerStatus.Idle, () => {
    fs.unlink(tempPath, () => {});
    playTrack(nextFile, files, player, connection, interaction);
  });

  // エラーハンドリング
  player.once('error', error => {
    console.error(error);
    interaction.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0xff0000)
          .setTitle('❌ 再生エラー')
          .setDescription('再生中にエラーが発生しました。'),
      ],
    });
    connection.destroy();
    fs.unlink(tempPath, () => {});
  });
}

export default {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('GitHubから曲を再生します')
    .addStringOption(option =>
      option
        .setName('title')
        .setDescription('曲名（省略可）')
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
            .setDescription('ボイスチャンネルに参加してください！'),
        ],
        ephemeral: true,
      });
    }

    await interaction.deferReply();

    // GitHubから曲一覧を取得
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
            .setDescription('ファイル一覧を取得できませんでした。'),
        ],
      });
    }

    const audioFiles = files.filter(
      f => f.type === 'file' && (f.name.endsWith('.mp4') || f.name.endsWith('.m4a'))
    );

    if (audioFiles.length === 0) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle('❌ 音源なし')
            .setDescription('再生可能な音源ファイルがありません。'),
        ],
      });
    }

    // 再生する曲を決定
    let currentFile;
    if (title) {
      let candidate = audioFiles.find(f => f.name === `${encodeURIComponent(title)}.mp4`)
        || audioFiles.find(f => f.name === `${encodeURIComponent(title)}.m4a`);
      if (!candidate) {
        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor(0xff0000)
              .setTitle('❌ 曲が見つかりません')
              .setDescription(`\`${title}\` は存在しません。`),
          ],
        });
      }
      currentFile = candidate.name;
    } else {
      currentFile = audioFiles[Math.floor(Math.random() * audioFiles.length)].name;
    }

    // VC接続
    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator,
    });

    const player = createAudioPlayer();
    connection.subscribe(player);

    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x00ffcc)
          .setTitle('✅ 再生準備完了')
          .setDescription(`\`\`\`\n${currentFile} を準備中...\n\`\`\``),
      ],
    });

    // 再生開始
    playTrack(currentFile, audioFiles, player, connection, interaction);

    // グローバルに保存
    global.voiceConnection = connection;
    global.audioPlayer = player;
  },
};
