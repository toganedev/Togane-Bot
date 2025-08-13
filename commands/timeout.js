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

const durations = {
  '1m': 60,
  '5m': 300,
  '10m': 600,
  '30m': 1800,
  '1h': 3600,
  '5h': 18000,
  '10h': 36000,
  '1d': 86400,
  '7d': 604800,
};

function formatDuration(seconds) {
  if (seconds < 60) return `${seconds}秒`;
  if (seconds < 3600) return `${seconds / 60}分`;
  if (seconds < 86400) return `${seconds / 3600}時間`;
  return `${seconds / 86400}日`;
}

export default {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('ユーザーをタイムアウトします')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(option =>
      option.setName('target').setDescription('対象ユーザー').setRequired(true)
    )
    .addStringOption(option =>
      option.setName('duration')
        .setDescription('タイムアウト時間')
        .setRequired(true)
        .addChoices(
          { name: '1分', value: '1m' },
          { name: '5分', value: '5m' },
          { name: '10分', value: '10m' },
          { name: '30分', value: '30m' },
          { name: '1時間', value: '1h' },
          { name: '5時間', value: '5h' },
          { name: '10時間', value: '10h' },
          { name: '1日', value: '1d' },
          { name: '7日', value: '7d' },
        )
    )
    .addStringOption(option =>
      option.setName('reason').setDescription('理由').setRequired(true)
    ),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('target');
    const durationKey = interaction.options.getString('duration');
    const reason = interaction.options.getString('reason');
    const seconds = durations[durationKey];

    const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
    if (!member) {
      return interaction.reply({ content: 'このユーザーはサーバーにいません。', ephemeral: true });
    }

    // 既にタイムアウトされている場合
    if (member.communicationDisabledUntilTimestamp) {
      const remaining = Math.floor((member.communicationDisabledUntilTimestamp - Date.now()) / 1000);
      const remainingEmbed = new EmbedBuilder()
        .setTitle('⚠️ 既にタイムアウト中')
        .setColor(0xffcc00)
        .addFields(
          { name: '対象者', value: `${targetUser.tag} (${targetUser.id})` },
          { name: '残り時間', value: `${remaining}秒` },
        );
      return interaction.reply({ embeds: [remainingEmbed], ephemeral: false });
    }

    // タイムアウト実行
    const startTime = dayjs().tz('Asia/Tokyo').format('YYYY/MM/DD HH:mm:ss');
    const endTime = dayjs().add(seconds, 'second').tz('Asia/Tokyo').format('YYYY/MM/DD HH:mm:ss');

    await member.timeout(seconds * 1000, reason);

    const embed = new EmbedBuilder()
      .setTitle('⏳ タイムアウト実行')
      .setColor(0xff9900)
      .addFields(
        { name: '実行者', value: interaction.user.tag, inline: true },
        { name: '対象者', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
        { name: '理由', value: reason },
        { name: '開始時刻（JST）', value: startTime },
        { name: '解除予定（JST）', value: endTime },
        { name: '設定時間', value: formatDuration(seconds) },
      );

    await interaction.reply({ embeds: [embed] });

    // サーバー管理者にもDM
    const owner = await interaction.guild.fetchOwner();
    await owner.send({ embeds: [embed] }).catch(() => null);
  },
};
