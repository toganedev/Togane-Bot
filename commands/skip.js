import { SlashCommandBuilder } from 'discord.js';
import musicQueue from '../utils/musicQueue.js';

export default {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('現在の曲をスキップします'),

  async execute(interaction) {
    musicQueue.skip(interaction);
    await interaction.reply({ content: '⏭️ 曲をスキップしました！' });
  },
};
