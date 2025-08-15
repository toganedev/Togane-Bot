import { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('music-request')
    .setDescription('入れてほしい曲をリクエストします'),

  async execute(interaction) {
    // モーダル作成
    const modal = new ModalBuilder()
      .setCustomId('music-request') // 統一
      .setTitle('🎵 曲リクエストフォーム');

    const titleInput = new TextInputBuilder()
      .setCustomId('title')
      .setLabel('曲名')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('例: Pretender - Official髭男dism')
      .setRequired(true);

    const urlInput = new TextInputBuilder()
      .setCustomId('url')
      .setLabel('曲のURL')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('https://...')
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(titleInput),
      new ActionRowBuilder().addComponents(urlInput)
    );

    await interaction.showModal(modal);
  }
};
