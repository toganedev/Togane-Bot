import { SlashCommandBuilder } from 'discord.js';
import musicQueue from '../utils/musicQueue.js';

export default {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('音楽を停止し、キューをクリアします'),

  async execute(interaction) {
    musicQueue.stop();
    await interaction.reply({ content: '⏹️ 再生を停止しました！' });
  },
};
