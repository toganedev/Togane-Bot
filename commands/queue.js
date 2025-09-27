import { SlashCommandBuilder } from 'discord.js';
import musicQueue from '../utils/musicQueue.js';

export default {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('再生キューを表示します'),

  async execute(interaction) {
    await interaction.reply({ embeds: [musicQueue.getQueueEmbed()] });
  },
};
