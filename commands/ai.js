// commands/ai.js
import {
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  EmbedBuilder
} from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ai')
    .setDescription('Google AI に質問や会話を送る'),

  async execute(interaction) {
    const modal = new ModalBuilder()
      .setCustomId('ai_modal')
      .setTitle('AI への質問');

    const input = new TextInputBuilder()
      .setCustomId('ai_prompt')
      .setLabel('質問や話したい内容を入力')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    const row = new ActionRowBuilder().addComponents(input);
    modal.addComponents(row);
    await interaction.showModal(modal);
  }
};
