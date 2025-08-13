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
      option
        .setName('user')
        .setDescription('BANを解除するユーザー（@mention または ユーザーID）')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('BAN解除理由')
        .setRequired(true)
    ),

  async execute(interaction) {
    const userInput = interaction.options.getString('user');
    const reason = interaction.options.getString('reason');

    // mention形式ならIDを抽出、それ以外はそのまま
    const userId = userInput.match(/^<@!?(\d+)>$/)?.[1] || userInput;

    try {
      const user = await interaction.client.users.fetch(userId);

      // BAN解除
      await interaction.guild.members.unban(user.id, reason);

      // 日本時間
      const japanTime = dayjs().tz('Asia/Tokyo').format('YYYY/MM/DD HH:mm');

      // 共通のEmbed（管理者・実行者両方に使う）
      const embed = new EmbedBuilder()
        .setTitle('✅ ユーザーBAN解除')
        .setColor(0x00ff00)
        .addFields(
          { name: '解除実行者', value: `${interaction.user.tag} (${interaction.user.id})`, inline: false },
          { name: '対象ユーザー', value: `${user.tag} (${user.id})`, inline: false },
          { name: '理由', value: reason, inline: false },
          { name: '解除日時（日本時間）', value: japanTime, inline: false },
        )
        .setTimestamp();

      // サーバー管理者にDM送信
      const owner = await interaction.guild.fetchOwner();
      await owner.send({ embeds: [embed] }).catch(() => {
        console.warn('管理者へのDM送信に失敗しました。');
      });

      // 実行者にも同じEmbedで返信
      await interaction.reply({ embeds: [embed], ephemeral: false });

    } catch (err) {
      console.error(err);
      await interaction.reply({
        content: 'BAN解除に失敗しました。ユーザーIDや権限を確認してください。',
        ephemeral: true
      });
    }
  }
};
