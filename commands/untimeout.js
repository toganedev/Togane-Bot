import {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

dayjs.extend(utc);
dayjs.extend(timezone);

function formatDurationVerbose(ms) {
  let seconds = Math.floor(ms / 1000);
  const days = Math.floor(seconds / 86400);
  seconds %= 86400;
  const hours = Math.floor(seconds / 3600);
  seconds %= 3600;
  const minutes = Math.floor(seconds / 60);
  seconds %= 60;

  let parts = [];
  if (days) parts.push(`${days}日`);
  if (hours) parts.push(`${hours}時間`);
  if (minutes) parts.push(`${minutes}分`);
  if (seconds) parts.push(`${seconds}秒`);
  return parts.join(' ') || '0秒';
}

export default {
  data: new SlashCommandBuilder()
    .setName('untimeout')
    .setDescription('指定したユーザーのタイムアウトを解除します')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(option =>
      option.setName('target').setDescription('対象ユーザー').setRequired(true)
    )
    .addStringOption(option =>
      option.setName('reason').setDescription('解除理由').setRequired(true)
    ),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('target');
    const reason = interaction.options.getString('reason');

    const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
    if (!member) {
      return interaction.reply({ content: 'このユーザーはサーバーにいません。', ephemeral: true });
    }

    // BOTが操作できるか事前確認
    if (!member.moderatable) {
      const errorEmbed = new EmbedBuilder()
        .setTitle('⚠️ 解除失敗')
        .setColor(0xff0000)
        .addFields(
          { name: '対象者', value: `${targetUser.tag} (${targetUser.id})` },
          { name: '理由', value: 'BOTのロール位置または権限不足のため、このユーザーを操作できません。' }
        );
      return interaction.reply({ embeds: [errorEmbed], ephemeral: false });
    }

    const currentTimeout = member.communicationDisabledUntil;
    if (!currentTimeout || dayjs(currentTimeout).isBefore(dayjs())) {
      const noTimeoutEmbed = new EmbedBuilder()
        .setTitle('ℹ️ タイムアウトされていません')
        .setColor(0x3498db)
        .addFields({ name: '対象者', value: `${targetUser.tag} (${targetUser.id})` });
      return interaction.reply({ embeds: [noTimeoutEmbed], ephemeral: false });
    }

    // 残り時間計算
    const now = dayjs();
    const end = dayjs(currentTimeout);
    const remainingMs = end.diff(now);
    const remainingFormatted = formatDurationVerbose(remainingMs);

    // 確認ボタン
    const confirmButton = new ButtonBuilder()
      .setCustomId('confirm_untimeout')
      .setLabel('解除する')
      .setStyle(ButtonStyle.Danger);

    const cancelButton = new ButtonBuilder()
      .setCustomId('cancel_untimeout')
      .setLabel('キャンセル')
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton);

    const confirmEmbed = new EmbedBuilder()
      .setTitle('⏳ タイムアウト解除確認')
      .setColor(0xffcc00)
      .addFields(
        { name: '対象者', value: `${targetUser.tag} (${targetUser.id})` },
        { name: '残り時間', value: remainingFormatted },
        { name: '解除理由', value: reason }
      );

    await interaction.reply({ embeds: [confirmEmbed], components: [row], ephemeral: true });

    // ボタン操作待機
    const collector = interaction.channel.createMessageComponentCollector({
      filter: i => i.user.id === interaction.user.id,
      time: 15000
    });

    collector.on('collect', async i => {
      if (i.customId === 'confirm_untimeout') {
        await member.timeout(null, reason);

        const logEmbed = new EmbedBuilder()
          .setTitle('✅ タイムアウト解除')
          .setColor(0x2ecc71)
          .addFields(
            { name: '実行者', value: interaction.user.tag, inline: true },
            { name: '対象者', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
            { name: '理由', value: reason },
            { name: '解除時刻（JST）', value: dayjs().tz('Asia/Tokyo').format('YYYY/MM/DD HH:mm:ss') }
          );

        await i.update({ embeds: [logEmbed], components: [] });

        // 管理者DM
        const owner = await interaction.guild.fetchOwner();
        await owner.send({ embeds: [logEmbed] }).catch(() => null);
      } else if (i.customId === 'cancel_untimeout') {
        await i.update({ content: 'キャンセルしました。', embeds: [], components: [] });
      }
    });
  }
};
