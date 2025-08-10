import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('togane-server-template')
        .setDescription('ToganeサーバーのテンプレートリンクをDMで送信します'),
        
    async execute(interaction) {
        const templateLink = 'https://discord.new/UGnHYnEm7zGT';

        // Embed作成
        const embed = new EmbedBuilder()
            .setTitle('📄 Togane サーバーテンプレート')
            .setDescription(`以下のリンクからテンプレートを使用できます:\n[テンプレートを開く](${templateLink})`)
            .setColor(0x00AE86)
            .setFooter({ text: 'テンプレートを使用して新しいサーバーを作成できます' });

        try {
            // DM送信
            await interaction.user.send({ embeds: [embed] });
            await interaction.reply({
                content: '📬 DMにテンプレートリンクを送信しました！',
                flags: 64 // Ephemeralの代替
            });
        } catch (err) {
            await interaction.reply({
                content: '❌ DMを送信できませんでした。DMが開放されているか確認してください。',
                flags: 64
            });
        }
    }
};
