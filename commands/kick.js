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

    try {
      const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
      if (!member) {
        return interaction.reply({
          content: '指定されたユーザーはこのサーバーにいません。',
          ephemeral: true,
        });
      }

      await member.kick(reason);

      const japanTime = dayjs().tz('Asia/Tokyo').format('YYYY/MM/DD HH:mm');

      // サーバー管理者にDM
      const owner = await interaction.guild.fetchOwner();
      const embed = new EmbedBuilder()
        .setTitle('👢 ユーザーキック通知')
        .setColor(0xffa500)
        .addFields(
          { name: 'キック実行者', value: interaction.user.tag, inline: true },
          { name: '対象ユーザー', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
          { name: '理由', value: reason, inline: false },
          { name: 'キック日時（日本時間）', value: japanTime, inline: false },
        )
        .setTimestamp();

      await owner.send({ embeds: [embed] });

      // 実行者にも通知
      const replyEmbed = new EmbedBuilder()
        .setTitle('✅ キック完了')
        .setColor(0x00ff00)
        .setDescription(`${targetUser.tag} をキックしました。`)
        .addFields(
          { name: '理由', value: reason, inline: false },
          { name: '日時（日本時間）', value: japanTime, inline: false }
        );

      await interaction.reply({ embeds: [replyEmbed], ephemeral: false });

    } catch (err) {
      console.error(err);
      await interaction.reply({
        content: 'キックに失敗しました。権限や入力を確認してください。',
        ephemeral: true,
      });
    }
  },
};
