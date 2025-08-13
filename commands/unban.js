import {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} from 'discord.js';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

dayjs.extend(utc);
dayjs.extend(timezone);

export default {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('指定したユーザーのBANを解除します')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addStringOption(option =>
      option.setName('userid')
        .setDescription('BANを解除するユーザーのID')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('BAN解除理由')
        .setRequired(true)
    ),

  async execute(interaction) {
    const userId = interaction.options.getString('userid');
    const reason = interaction.options.getString('reason');

    try {
      // 解除前にBAN情報を取得
      const bannedUser = await interaction.guild.bans.fetch(userId).catch(() => null);

      if (!bannedUser) {
        return interaction.reply({
          content: 'そのユーザーは現在BANされていません。',
          ephemeral: true
        });
      }

      // BAN解除
      await interaction.guild.bans.remove(userId, reason);

      // 日本時間
      const japanTime = dayjs().tz('Asia/Tokyo').format('YYYY/MM/DD HH:mm');

      // Embed作成
      const embed = new EmbedBuilder()
        .setTitle('✅ ユーザーBAN解除通知')
        .setColor(0x00ff00)
        .addFields(
          { name: '解除実行者', value: interaction.user.tag, inline: true },
          { name: '対象ユーザー', value: `${bannedUser.user.tag} (${bannedUser.user.id})`, inline: true },
          { name: '理由', value: reason, inline: false },
          { name: '解除日時（日本時間）', value: japanTime, inline: false },
        )
        .setTimestamp();

      // 管理者にDM送信
      const owner = await interaction.guild.fetchOwner();
      await owner.send({ embeds: [embed] }).catch(() => {
        console.warn('管理者へのDM送信に失敗しました。');
      });

      // コマンド実行者にも返信
      await interaction.reply({ embeds: [embed] });

    } catch (err) {
      console.error(err);
      await interaction.reply({
        content: 'BAN解除に失敗しました。権限や入力を確認してください。',
        ephemeral: true
      });
    }
  }
};
