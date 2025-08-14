import {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus
} from '@discordjs/voice';
import { SlashCommandBuilder } from 'discord.js';
import fetch from 'node-fetch';

const ALLOWED_USER_ID = '1401421639106957464';
const GITHUB_API_URL = 'https://api.github.com/repos/toganedev/D/contents/';

export default {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('GitHubリポジトリから曲をランダム再生'),

  async execute(interaction) {
    if (interaction.user.id !== ALLOWED_USER_ID) {
      return interaction.reply({ content: 'このコマンドは使用できません。', ephemeral: true });
    }

    const voiceChannel = interaction.member?.voice?.channel;
    if (!voiceChannel) {
      return interaction.reply({ content: 'ボイスチャンネルに参加してください。', ephemeral: true });
    }

    // GitHub APIから曲ファイル一覧を取得
    const res = await fetch(GITHUB_API_URL);
    const files = await res.json();

    const songUrls = files
      .filter(file => file.type === 'file' && (file.name.endsWith('.m4a') || file.name.endsWith('.mp4')))
      .map(file => file.download_url);

    if (songUrls.length === 0) {
      return interaction.reply({ content: '曲ファイルが見つかりません。', ephemeral: true });
    }

    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guild.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    });

    const player = createAudioPlayer();

    const playRandomSong = () => {
      const url = songUrls[Math.floor(Math.random() * songUrls.length)];
      const resource = createAudioResource(url, { inlineVolume: true });
      player.play(resource);
      console.log(`🎵 Now playing: ${url}`);
    };

    player.on(AudioPlayerStatus.Idle, () => {
      playRandomSong();
    });

    connection.subscribe(player);
    playRandomSong();

    await interaction.reply({ content: 'GitHubからランダム再生を開始しました！' });
  }
};
