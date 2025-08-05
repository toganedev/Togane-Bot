import { EmbedBuilder } from 'discord.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

export default {
  name: 'interactionCreate',
  async execute(interaction, client) {
    // ===== Modal Submit 処理 =====
    if (interaction.isModalSubmit()) {
      if (interaction.customId !== 'ai_modal') return;

      await interaction.deferReply();

      const prompt = interaction.fields.getTextInputValue('ai_prompt');

      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = await response.text();

        const embed = new EmbedBuilder()
          .setTitle('💡 AIの回答')
          .setDescription(`\`\`\`\n${text.slice(0, 4096 - 8)}\n\`\`\``)
          .setColor('Random');

        await interaction.editReply({ embeds: [embed] });
      } catch (err) {
        console.error(err);
        await interaction.editReply('❌ エラーが発生しました。もう一度お試しください。');
      }

      return;
    }

    // ===== Chat Input Command 処理 =====
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ content: 'エラーが発生しました。' });
      } else {
        await interaction.reply({ content: 'エラーが発生しました。', ephemeral: true });
      }
    }
  },
};
