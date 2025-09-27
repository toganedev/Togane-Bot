// utils/musicQueue.js
const { createAudioPlayer, createAudioResource, AudioPlayerStatus, joinVoiceChannel } = require('@discordjs/voice');

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
    } else if (this.connection) {
      this.connection.joinConfig.channelId && this.connection.joinConfig.channelId.send({ embeds: [this._nowPlayingEmbed()] });
    }
  }

  skip(interaction) {
    if (this.player) {
      interaction.reply({ content: '⏭️ 曲をスキップしました！' });
      this.playNext(interaction);
    }
  }

  stop(interaction) {
    this.queue = [];
    this.player.stop();
    if (this.connection) this.connection.destroy();
    this.connection = null;
    interaction.reply({ content: '⏹️ 再生を停止しました！' });
  }

  _nowPlayingEmbed() {
    const { EmbedBuilder } = require('discord.js');
    return new EmbedBuilder()
      .setTitle('🎶 再生中')
      .setDescription(`\`\`\`\n${this.current.title}\nby ${this.current.artist}\n\`\`\``)
      .setURL(this.current.url)
      .setColor(0x1DB954);
  }
}

module.exports = new MusicQueue();
