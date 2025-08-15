import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('再生を停止し、ボイスチャンネルから退出します'),

    async execute(interaction) {
        const connection = global.voiceConnection;
        const player = global.audioPlayer;

        if (!connection || !player) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xff0000)
                        .setTitle('❌ 停止できません')
                        .setDescription('```現在、再生中の曲はありません。```')
                ],
                ephemeral: true
            });
        }

        player.stop();
        connection.destroy();
        global.voiceConnection = null;
        global.audioPlayer = null;

        return interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor(0x00ff00)
                    .setTitle('🛑 再生停止')
                    .setDescription('```曲の再生を停止し、ボイスチャンネルから退出しました。```')
            ]
        });
    }
};
