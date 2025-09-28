import {
  Events,
  StringSelectMenuBuilder,
  ActionRowBuilder,
} from 'discord.js';
import { musicSettings } from '../commands/music-setting.js';
import musicQueue from '../utils/musicQueue.js';

const defaultSettings = {
  volume: 100,
  repeat: 'off',   // off | one | all
  shuffle: false,
  autoplay: true,
};

export default {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (!interaction.isStringSelectMenu()) return;

    const guildId = interaction.guild.id;

    // ✅ デフォルト設定で初期化（必ず存在するようにする）
    if (!musicSettings.has(guildId)) {
      musicSettings.set(guildId, { ...defaultSettings });
    }
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

      // 新しいメインメニューを作り直す
      const mainMenu = new StringSelectMenuBuilder()
        .setCustomId('music-setting-menu')
        .setPlaceholder('設定を選択してください')
        .addOptions([
          { label: '音量を変更', value: 'volume', description: '音量を調整します' },
          { label: 'リピートモード切替', value: 'repeat', description: 'リピートON/OFFを切り替えます' },
          { label: 'シャッフル切替', value: 'shuffle', description: 'シャッフルON/OFFを切り替えます' },
          { label: 'オートプレイ切替', value: 'autoplay', description: '自動ランダム再生ON/OFF' },
        ]);
      const row = new ActionRowBuilder().addComponents(mainMenu);

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
        components: [row],
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
