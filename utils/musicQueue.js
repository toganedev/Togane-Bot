// utils/musicQueue.js
import {
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  joinVoiceChannel,
} from '@discordjs/voice';
import { EmbedBuilder } from 'discord.js';
import fs from 'fs';
import { musicSettings } from '../commands/music-setting.js';

const tracks = JSON.parse(fs.readFileSync('./tracks.json', 'utf-8'));

const defaultSettings = {
  volume: 100,
  repeat: 'off',
  shuffle: false,
  autoplay: true,
};

class MusicQueue {
  constructor() {
    this.queue = [];
    this.connection = null;
    this.player = createAudioPlayer();
    this.current = null;
    this.currentResource = null;

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
    const guildId = interaction?.guild?.id;
    const settings = guildId
      ? { ...defaultSettings, ...(musicSettings.get(guildId) || {}) }
      : defaultSettings;

    if (settings.repeat === 'one' && this.current) {
      this._playResource(this.current, settings, interaction);
      return;
    }

    if (settings.repeat === 'all' && this.current) {
      this.queue.push(this.current);
    }

    if (settings.shuffle && this.queue.length > 1) {
      const rand = Math.floor(Math.random() * this.queue.length);
      [this.queue[0], this.queue[rand]] = [this.queue[rand], this.queue[0]];
    }

    if (this.queue.length > 0) {
      this.current = this.queue.shift();
    } else if (settings.autoplay) {
      this.current = tracks[Math.floor(Math.random() * tracks.length)];
    } else {
      this.current = null;
      return;
    }

    this._playResource(this.current, settings, interaction);
  }

  _playResource(track, settings, interaction) {
    const resource = createAudioResource(track.url, { inlineVolume: true });
    resource.volume.setVolume(settings.volume / 100);
    this.currentResource = resource;

    this.player.play(resource);

    if (interaction) {
      interaction.channel.send({ embeds: [this._nowPlayingEmbed()] });
      if (this.queue.length > 0) {
        interaction.channel.send({ embeds: [this._nextTrackEmbed()] });
      }
    }
  }

  setVolume(guildId, volume) {
    if (this.currentResource?.volume) {
      this.currentResource.volume.setVolume(volume / 100);
    }
  }

  skip(interaction) {
    this.playNext(interaction);
  }

  stop() {
    this.queue = [];
    this.player.stop();
    if (this.connection) this.connection.destroy();
    this.connection = null;
    this.current = null;
    this.currentResource = null;
  }

  getQueueEmbed(interaction) {
    const guildId = interaction?.guild?.id;
    const settings = guildId
      ? { ...defaultSettings, ...(musicSettings.get(guildId) || {}) }
      : defaultSettings;

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
    } else {
      desc += settings.autoplay
        ? '_次の曲はランダム再生されます…_'
        : '_次の曲はありません_';
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
    if (this.queue.length === 0) {
      return new EmbedBuilder()
        .setTitle('⏭️ 次に再生予定')
        .setDescription('_次の曲はランダム再生されます…_')
        .setColor(0xFFD700);
    }

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
