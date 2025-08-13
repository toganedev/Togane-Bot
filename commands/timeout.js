import {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits
} from 'discord.js';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

dayjs.extend(utc);
dayjs.extend(timezone);

const timeChoices = [
  { name: '1分', value: 60 },
  { name: '5分', value: 300 },
  { name: '10分', value: 600 },
  { name: '30分', value: 1800 },
  { name: '1時間', value: 3600 },
  { name: '5時間', value: 18000 },
  { name: '10時間', value: 36000 },
  { name: '1日', value: 86400 },
  { name: '7日', value: 604800 },
];

function formatDuration(seconds) {
  if (seconds < 60) return `${seconds}秒`;
  if (seconds < 3600) return `${seconds / 60}分`;
  if (seconds < 86400) return `${seconds / 3600}時間`;
  return `${seconds / 86400}日`;
}

export default {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('指定したユーザーをタイムアウトします')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(option =>
      option.setName('target').setDescription('対象ユーザー').setRequired(true)
    )
    .addStringOption(option =>
      option.setName('reason').setDescription('理由').setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('duration').setDescription('タイムアウト時間').setRequired(true).addChoices(
        ...timeChoices.map(c => ({ name: c.name, value: c.value }))
      )
    ),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('target');
    const reason = interaction.options.getString('reason');
    const durationSec = interaction.options.getInteger('duration');

    const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
    if (!member) {
      return interaction.reply({ content: 'このユーザーはサーバーにいません。', ephemeral: true });
    }

    // 権限チェック（BOTが操作できるか）
    if (!member.moderatable) {
      const errorEmbed = new EmbedBuilder()
        .setTitle('⚠️ タイムアウト失敗')
        .setColor(0xff0000)
        .addFields(
          { name: '対象者', value: `${targetUser.tag} (${targetUser.id})` },
          { name: '理由', value: 'BOTのロール位置または権限不足のため、このユーザーを操作できません。' }
        );
      return interaction.reply({ embeds: [errorEmbed], ephemeral: false });
    }

    try {
      const endTime = dayjs().add(durationSec, 'seconds').tz('Asia/Tokyo');
      await member.timeout(durationSec * 1000, reason);

      const logEmbed = new EmbedBuilder()
        .setTitle('⏳ タイムアウト実行')
        .setColor(0xffcc00)
        .addFields(
          { name: '実行者', value: interaction.user.tag, inline: true },
          { name: '対象者', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
          { name: '理由', value: reason },
          { name: '設定時間', value: formatDuration(durationSec) },
          { name: '開始時刻（JST）', value: dayjs().tz('Asia/Tokyo').format('YYYY/MM/DD HH:mm:ss') },
          { name: '解除予定（JST）', value: endTime.format('YYYY/MM/DD HH:mm:ss') }
        );

      await interaction.reply({ embeds: [logEmbed] });

      // サーバー管理者にDM
      const owner = await interaction.guild.fetchOwner();
      await owner.send({ embeds: [logEmbed] }).catch(() => null);

    } catch (err) {
      console.error(err);
      const errorEmbed = new EmbedBuilder()
        .setTitle('⚠️ タイムアウト失敗')
        .setColor(0xff0000)
        .setDescription('権限不足、またはDiscordの制限によりタイムアウトできませんでした。');
      return interaction.reply({ embeds: [errorEmbed], ephemeral: false });
    }
  },
};
