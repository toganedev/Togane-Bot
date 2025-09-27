import { Events } from 'discord.js';
import { musicSettings } from '../commands/music-setting.js';

export default {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (!interaction.isStringSelectMenu()) return;
    if (interaction.customId !== 'music-setting-menu') return;

    const guildId = interaction.guild.id;
    const settings = musicSettings.get(guildId);

    switch (interaction.values[0]) {
      case 'volume':
        settings.volume = Math.min(200, settings.volume + 20); // 20%刻みで例
        break;
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

    await interaction.update({
      embeds: [{
        title: '🎛 音楽設定 (更新)',
        description:
          `🔊 音量: **${settings.volume}%**\n` +
          `🔁 リピート: **${settings.repeat}**\n` +
          `🔀 シャッフル: **${settings.shuffle ? 'ON' : 'OFF'}**\n` +
          `🎶 オートプレイ: **${settings.autoplay ? 'ON' : 'OFF'}**\n`,
        color: 0x2ECC71,
      }],
      components: interaction.message.components, // メニューを残す
    });
  },
};
