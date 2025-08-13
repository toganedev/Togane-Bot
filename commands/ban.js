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
    .setName('ban')
    .setDescription('指定したユーザーをBANします')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption(option =>
      option
        .setName('target')
        .setDescription('BANするユーザー（サーバー外ユーザーもIDを指定で可）')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('BAN理由')
        .setRequired(true)
    ),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('target');
    const reason = interaction.options.getString('reason');

    try {
      // ユーザーがサーバーにいない場合も取得
      const userToBan = targetUser || await interaction.client.users.fetch(targetUser.id);
      await interaction.guild.members.ban(userToBan.id, { reason });

      // 日本時間
      const japanTime = dayjs().tz('Asia/Tokyo').format('YYYY/MM/DD HH:mm');

      // サーバー管理者にDM送信
      const owner = await interaction.guild.fetchOwner();
      const embed = new EmbedBuilder()
        .setTitle('🚫 ユーザーBAN通知')
        .setColor(0xff0000)
        .addFields(
          { name: 'BAN実行者', value: interaction.user.tag, inline: true },
          { name: '対象ユーザー', value: `${userToBan.tag || '不明'} (${userToBan.id})`, inline: true },
          { name: '理由', value: reason, inline: false },
          { name: 'BAN日時（日本時間）', value: japanTime, inline: false },
        )
        .setTimestamp();

      await owner.send({ embeds: [embed] });

      await interaction.reply({
        content: `✅ ${userToBan.tag || 'ユーザー'} をBANしました。`,
        ephemeral: false
      });

    } catch (err) {
      console.error(err);
      await interaction.reply({
        content: 'BANに失敗しました。権限や入力を確認してください。',
        ephemeral: true
      });
    }
  }
};
