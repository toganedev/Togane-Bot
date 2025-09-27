const { SlashCommandBuilder } = require('discord.js');
const musicQueue = require('../../utils/musicQueue');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('現在の曲をスキップします'),

  async execute(interaction) {
    musicQueue.skip(interaction);
  },
};
