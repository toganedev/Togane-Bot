import {
  Events,
  StringSelectMenuBuilder,
  ActionRowBuilder,
} from 'discord.js';
import { musicSettings } from '../commands/music-setting.js';
import musicQueue from '../utils/musicQueue.js';

export default {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (!interaction.isStringSelectMenu()) return;

    const guildId = interaction.guild.id;
    const settings = musicSettings.get(guildId);

    // 🎚️ メインメニューの操作
    if (interaction.customId === 'music-setting-menu') {
      switch (interaction.values[0]) {
        case 'volume': {
          // 音量選択用のセレクトメニューを表示
          const volumeMenu = new StringSelectMenuBuilder()
            .setCustomId('volume-select')
            .setPlaceholder('音量を選択してください')
            .addOptions([
              { label: '🔈 25%', value: '25' },
              { label: '🔉 50%', value: '50' },
              { label: '🔊 100%', value: '100' },
              { label: '📢 150%', value: '150' },
              { label: '💥 200%', value: '200' },
            ]);
          const row = new ActionRowBuilder().addComponents(volumeMenu);

          return interaction.update({
            content: '🎚️ 音量を選択してください',
            embeds: [],
            components: [row],
          });
        }

        case 'repeat':
          settings.repeat =
            settings.repeat === 'off' ? 'one' :
            settings.repeat === 'one' ? 'all' : 'off';
          break;

        case 'shuffle':
          settings.shuffle = !settings.shuffle;
          break;

        case 'autoplay':
          settings.autoplay = !settings.autoplay;
          break;
      }

      musicSettings.set(guildId, settings);

      return interaction.update({
        embeds: [{
          title: '🎛 音楽設定 (更新)',
          description:
            `🔊 音量: **${settings.volume}%**\n` +
            `🔁 リピート: **${settings.repeat}**\n` +
            `🔀 シャッフル: **${settings.shuffle ? 'ON' : 'OFF'}**\n` +
            `🎶 オートプレイ: **${settings.autoplay ? 'ON' : 'OFF'}**\n`,
          color: 0x2ECC71,
        }],
        components: interaction.message.components,
      });
    }

    // 🎚️ 音量選択時の処理
    if (interaction.customId === 'volume-select') {
      const newVolume = parseInt(interaction.values[0], 10);
      settings.volume = newVolume;
      musicSettings.set(guildId, settings);

      // 現在の曲にも即時反映
      musicQueue.setVolume(guildId, newVolume);

      return interaction.update({
        content: `🔊 音量を **${newVolume}%** に設定しました！`,
        embeds: [],
        components: [],
      });
    }
  },
};
