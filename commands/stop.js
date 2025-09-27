const { SlashCommandBuilder } = require('discord.js');
const musicQueue = require('../../utils/musicQueue');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('音楽を停止し、キューをクリアします'),

  async execute(interaction) {
    musicQueue.stop(interaction);
  },
};
