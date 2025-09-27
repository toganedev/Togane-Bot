import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import fs from 'fs';

const tracks = JSON.parse(fs.readFileSync('./tracks.json', 'utf-8'));

export default {
  data: new SlashCommandBuilder()
    .setName('playlist')
    .setDescription('曲一覧を表示します'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('📀 曲一覧')
      .setDescription(
        tracks.map((t, i) => `${i + 1}. \`${t.title}\` by *${t.artist}*`).join('\n'),
      )
      .setColor(0x3498DB);

    await interaction.reply({ embeds: [embed] });
  },
};
