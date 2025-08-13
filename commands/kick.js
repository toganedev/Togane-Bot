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
    .setName('kick')
    .setDescription('指定したユーザーをサーバーからキックします')
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption(option =>
      option
        .setName('target')
        .setDescription('キックするユーザー')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('キック理由')
        .setRequired(true)
    ),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('target');
    const reason = interaction.options.getString('reason');

    // 最初に応答を予約（これで二重reply防止 & ephemeral警告回避）
    await interaction.deferReply({ ephemeral: false });

    try {
      const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

      if (!member) {
        return interaction.editReply({
          content: '❌ 指定されたユーザーはこのサーバーにいません。',
        });
      }

      // 権限チェック（kickableでロール順位や権限不足を判定）
      if (!member.kickable) {
        return interaction.editReply({
          content: '❌ このユーザーをキックする権限がありません。',
        });
      }

      // キック実行
      await member.kick(reason);

      const japanTime = dayjs().tz('Asia/Tokyo').format('YYYY/MM/DD HH:mm');

      // サーバー管理者にDM送信
      const owner = await interaction.guild.fetchOwner();
      const adminEmbed = new EmbedBuilder()
        .setTitle('👢 ユーザーキック通知')
        .setColor(0xffa500)
        .addFields(
          { name: 'キック実行者', value: `${interaction.user.tag} (${interaction.user.id})`, inline: false },
          { name: '対象ユーザー', value: `${targetUser.tag} (${targetUser.id})`, inline: false },
          { name: '理由', value: reason, inline: false },
          { name: 'キック日時（日本時間）', value: japanTime, inline: false },
        )
        .setTimestamp();

      await owner.send({ embeds: [adminEmbed] }).catch(() => {
        // オーナーのDMが閉じられている場合は無視
      });

      // 実行チャンネルに通知
      const replyEmbed = new EmbedBuilder()
        .setTitle('✅ キック完了')
        .setColor(0x00ff00)
        .setDescription(`${targetUser.tag} をキックしました。`)
        .addFields(
          { name: '理由', value: reason, inline: false },
          { name: '日時（日本時間）', value: japanTime, inline: false }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [replyEmbed] });

    } catch (err) {
      console.error(err);
      await interaction.editReply({
        content: '❌ キックに失敗しました。権限や入力を確認してください。',
      });
    }
  },
};
