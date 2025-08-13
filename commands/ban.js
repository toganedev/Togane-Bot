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
      option.setName('target')
        .setDescription('BANするユーザー')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('userid')
        .setDescription('BANするユーザーのID（サーバー外のユーザーでも可）')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('BAN理由')
        .setRequired(true)
    ),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('target');
    const userId = interaction.options.getString('userid');
    const reason = interaction.options.getString('reason');

    if (!targetUser && !userId) {
      return interaction.reply({
        content: 'ユーザーかユーザーIDのどちらかを指定してください。',
        ephemeral: true
      });
    }

    // BAN実行
    try {
      const userToBan = targetUser || await interaction.client.users.fetch(userId);
      await interaction.guild.members.ban(userToBan.id, { reason });

      // 日本時間（UTC+9）で日時を取得
      const japanTime = dayjs().tz('Asia/Tokyo').format('YYYY/MM/DD HH:mm');

      // 管理者にDM送信
      const owner = await interaction.guild.fetchOwner();
      const embed = new EmbedBuilder()
        .setTitle('🚫 ユーザーBAN通知')
        .setColor(0xff0000)
        .addFields(
          { name: 'BAN実行者', value: interaction.user.tag, inline: true },
          { name: '対象ユーザー', value: `${userToBan.tag} (${userToBan.id})`, inline: true },
          { name: '理由', value: reason, inline: false },
          { name: 'BAN日時（日本時間）', value: japanTime, inline: false },
        )
        .setTimestamp();

      await owner.send({ embeds: [embed] });

      await interaction.reply({
        content: `✅ ${userToBan.tag} をBANしました。`,
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
