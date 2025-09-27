import {
  SlashCommandBuilder,
  EmbedBuilder,
  StringSelectMenuBuilder,
  ActionRowBuilder,
} from 'discord.js';
import musicQueue from '../utils/musicQueue.js';

// サーバーごとの設定を保存
export const musicSettings = new Map();

export default {
  data: new SlashCommandBuilder()
    .setName('music-setting')
    .setDescription('音楽設定を変更します'),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    if (!musicSettings.has(guildId)) {
      musicSettings.set(guildId, {
        volume: 100,
        repeat: 'off',   // off | one | all
        shuffle: false,
        autoplay: true,
      });
    }
    const settings = musicSettings.get(guildId);

    // Embed
    const embed = new EmbedBuilder()
      .setTitle('🎛 音楽設定')
      .setDescription(
        `現在の設定:\n` +
        `🔊 音量: **${settings.volume}%**\n` +
        `🔁 リピート: **${settings.repeat}**\n` +
        `🔀 シャッフル: **${settings.shuffle ? 'ON' : 'OFF'}**\n` +
        `🎶 オートプレイ: **${settings.autoplay ? 'ON' : 'OFF'}**\n`
      )
      .setColor(0x2ECC71);

    // セレクトメニュー
    const menu = new StringSelectMenuBuilder()
      .setCustomId('music-setting-menu')
      .setPlaceholder('設定を選択してください')
      .addOptions([
        { label: '音量を変更', value: 'volume', description: '音量を調整します' },
        { label: 'リピートモード切替', value: 'repeat', description: 'リピートON/OFFを切り替えます' },
        { label: 'シャッフル切替', value: 'shuffle', description: 'シャッフルON/OFFを切り替えます' },
        { label: 'オートプレイ切替', value: 'autoplay', description: '自動ランダム再生ON/OFF' },
      ]);

    const row = new ActionRowBuilder().addComponents(menu);

    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  },
};
