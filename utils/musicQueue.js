// utils/musicQueue.js
import {
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  joinVoiceChannel,
} from '@discordjs/voice';
import { EmbedBuilder } from 'discord.js';

class MusicQueue {
  constructor() {
    this.queue = [];
    this.connection = null;
    this.player = createAudioPlayer();
    this.current = null;

    this.player.on(AudioPlayerStatus.Idle, () => {
      this.playNext();
    });
  }

  join(voiceChannel) {
    if (!this.connection) {
      this.connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: voiceChannel.guild.id,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
      });
      this.connection.subscribe(this.player);
    }
  }

  add(track, interaction) {
    this.queue.push({ ...track, requestedBy: interaction.user });
    if (!this.current) {
      this.playNext(interaction);
    }
  }

  playNext(interaction) {
    if (this.queue.length === 0) {
      this.current = null;
      if (this.connection) this.connection.destroy();
      this.connection = null;
      return;
    }

    this.current = this.queue.shift();
    const resource = createAudioResource(this.current.url);
    this.player.play(resource);

    if (interaction) {
      interaction.channel.send({ embeds: [this._nowPlayingEmbed()] });
      if (this.queue.length > 0) {
        interaction.channel.send({ embeds: [this._nextTrackEmbed()] });
      }
    }
  }

  skip(interaction) {
    interaction.reply({ content: '⏭️ 曲をスキップしました！' });
    this.playNext(interaction);
  }

  stop(interaction) {
    this.queue = [];
    this.player.stop();
    if (this.connection) this.connection.destroy();
    this.connection = null;
    interaction.reply({ content: '⏹️ 再生を停止しました！' });
  }

  getQueueEmbed() {
    if (!this.current && this.queue.length === 0) {
      return new EmbedBuilder()
        .setTitle('📂 キューは空です')
        .setColor(0xFF0000);
    }

    let desc = '';
    if (this.current) {
      desc += `🎶 **再生中**: \`${this.current.title}\` by *${this.current.artist}*\n\n`;
    }

    if (this.queue.length > 0) {
      desc += this.queue
        .map((track, i) => `${i + 1}. \`${track.title}\` by *${track.artist}*`)
        .join('\n');
    }

    return new EmbedBuilder()
      .setTitle('🎵 再生キュー')
      .setDescription(desc)
      .setColor(0x1DB954);
  }

  _nowPlayingEmbed() {
    return new EmbedBuilder()
      .setTitle('🎶 再生中')
      .setDescription(`\`\`\`\n${this.current.title}\nby ${this.current.artist}\n\`\`\``)
      .setURL(this.current.url)
      .setColor(0x1DB954);
  }

  _nextTrackEmbed() {
    const next = this.queue[0];
    return new EmbedBuilder()
      .setTitle('⏭️ 次に再生予定')
      .setDescription(`\`\`\`\n${next.title}\nby ${next.artist}\n\`\`\``)
      .setURL(next.url)
      .setColor(0xFFD700);
  }
}

const musicQueue = new MusicQueue();
export default musicQueue;
