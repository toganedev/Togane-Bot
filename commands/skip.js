import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { playTrack } from './play.js';

export default {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('次の曲にスキップします'),

  async execute(interaction) {
    const connection = global.voiceConnection;
    const player = global.audioPlayer;
    const nextTrack = global.nextTrack;
    const audioFiles = global.audioFiles;
    const currentTrack = global.currentTrack;

    if (!connection || !player || !nextTrack || !audioFiles) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle('❌ スキップできません')
            .setDescription('```現在、再生中の曲はありません。```'),
        ],
        ephemeral: true,
      });
    }

    await interaction.deferReply();

    // 再生処理 (playTrack 内で global.currentTrack と global.nextTrack を更新)
    playTrack(nextTrack, audioFiles, player, connection, interaction);

    // メッセージ送信
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x00ff00)
          .setTitle('⏭ スキップ実行')
          .setDescription(
            `\`\`\`\n現在の曲: ${currentTrack} をスキップしました\n` +
            `再生中: ${nextTrack}\n` +
            `次の曲: ${global.nextTrack}\n\`\`\``
          ),
      ],
    });
  },
};
