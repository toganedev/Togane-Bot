import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  ComponentType,
} from 'discord.js';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

dayjs.extend(utc);
dayjs.extend(timezone);

function formatDuration(seconds) {
  if (seconds < 60) return `${seconds}秒`;
  if (seconds < 3600) return `${seconds / 60}分`;
  if (seconds < 86400) return `${seconds / 3600}時間`;
  return `${seconds / 86400}日`;
}

export default {
  data: new SlashCommandBuilder()
    .setName('untimeout')
    .setDescription('ユーザーのタイムアウトを解除します')
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

    // タイムアウトされていない場合
    if (!member.communicationDisabledUntilTimestamp || member.communicationDisabledUntilTimestamp < Date.now()) {
      const embed = new EmbedBuilder()
        .setTitle('ℹ️ タイムアウト情報')
        .setColor(0x00aaff)
        .addFields(
          { name: '対象者', value: `${targetUser.tag} (${targetUser.id})` },
          { name: '状態', value: 'タイムアウトされていません' },
        );
      return interaction.reply({ embeds: [embed], ephemeral: false });
    }

    // 残り時間計算
    const remaining = Math.floor((member.communicationDisabledUntilTimestamp - Date.now()) / 1000);
    const endTime = dayjs(member.communicationDisabledUntilTimestamp).tz('Asia/Tokyo').format('YYYY/MM/DD HH:mm:ss');

    const confirmEmbed = new EmbedBuilder()
      .setTitle('⏳ タイムアウト解除確認')
      .setColor(0xffcc00)
      .addFields(
        { name: '対象者', value: `${targetUser.tag} (${targetUser.id})` },
        { name: '残り時間', value: `${remaining}秒（解除予定: ${endTime} JST）` },
        { name: '理由', value: reason },
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('confirm_untimeout')
        .setLabel('解除する')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('cancel_untimeout')
        .setLabel('キャンセル')
        .setStyle(ButtonStyle.Secondary),
    );

    const replyMsg = await interaction.reply({ embeds: [confirmEmbed], components: [row], ephemeral: false });

    // ボタン待機
    const collector = replyMsg.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 15000,
    });

    collector.on('collect', async (btnInteraction) => {
      if (btnInteraction.user.id !== interaction.user.id) {
        return btnInteraction.reply({ content: 'この操作はあなたが実行できません。', ephemeral: true });
      }

      if (btnInteraction.customId === 'cancel_untimeout') {
        await btnInteraction.update({ content: '⛔ 解除をキャンセルしました。', embeds: [], components: [] });
        collector.stop();
      }

      if (btnInteraction.customId === 'confirm_untimeout') {
        await member.timeout(null, reason); // 解除

        const logEmbed = new EmbedBuilder()
          .setTitle('✅ タイムアウト解除')
          .setColor(0x00cc66)
          .addFields(
            { name: '実行者', value: interaction.user.tag, inline: true },
            { name: '対象者', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
            { name: '理由', value: reason },
            { name: '解除時刻（JST）', value: dayjs().tz('Asia/Tokyo').format('YYYY/MM/DD HH:mm:ss') },
          );

        await btnInteraction.update({ embeds: [logEmbed], components: [] });

        // サーバー管理者にDM
        const owner = await interaction.guild.fetchOwner();
        await owner.send({ embeds: [logEmbed] }).catch(() => null);

        collector.stop();
      }
    });

    collector.on('end', async (_, reason) => {
      if (reason === 'time') {
        await replyMsg.edit({ content: '⏰ 時間切れのため解除確認を終了しました。', components: [] });
      }
    });
  },
};
