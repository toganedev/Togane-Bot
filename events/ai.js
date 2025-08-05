import { EmbedBuilder } from 'discord.js';
import { GoogleGenerativeAI } from '@google/genai'; // パッケージ名を変更

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

export default {
  name: 'interactionCreate',
  async execute(interaction) {
    if (!interaction.isModalSubmit()) return;
    if (interaction.customId !== 'ai_modal') return;

    await interaction.deferReply();

    const prompt = interaction.fields.getTextInputValue('ai_prompt');

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      const result = await model.generateContent(prompt);
      
      // レスポンスの取得方法を修正
      const response = await result.response;
      const text = response.text();

      const embed = new EmbedBuilder()
        .setTitle('💡 AIの回答')
        .setDescription(`\`\`\`\n${text.slice(0, 4096 - 8)}\n\`\`\``)
        .setColor('Random');

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error(err);
      await interaction.editReply('❌ エラーが発生しました。もう一度お試しください。');
    }
  }
};
