import {
  ChannelType,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} from 'discord.js';

const callCooldowns = new Map(); // 呼び出しのチャンネルごとのクールダウン
const LOG_DM_USER_ID = '1401421639106957464'; // ログを受け取るユーザーID

export default {
  name: 'interactionCreate',
  async execute(interaction) {
    if (!interaction.isButton()) return;

    let data;
    try {
      data = JSON.parse(interaction.customId);
    } catch {
      data = { c: interaction.customId }; // JSONでない場合（例: 'call_handler'）はそのまま処理
    }

    // 🎫 チケット作成ボタン
    if (data.c === 'ticket_open') {
      const guild = interaction.guild;
      const member = interaction.member;

      const category = data.cat ? guild.channels.cache.get(data.cat) : interaction.channel?.parent ?? null;
      const role = data.role ? guild.roles.cache.get(data.role) : null;

      const existing = guild.channels.cache.find(c =>
        c.name.includes(`🎫｜${interaction.user.username}`) && c.type === ChannelType.GuildText
      );
      if (existing) {
        return await interaction.reply({ content: `既にチケットを作成しています：${existing}`, ephemeral: true });
      }

      const channel = await guild.channels.create({
        name: `🎫｜${interaction.user.username}${interaction.user.id}`,
        type: ChannelType.GuildText,
        parent: category ?? undefined,
        permissionOverwrites: [
          { id: guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
          { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
          ...(role
            ? [{ id: role.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }]
            : guild.roles.cache
                .filter(r => r.permissions.has(PermissionFlagsBits.Administrator))
                .map(r => ({
                  id: r.id,
                  allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
                }))
          )
        ]
      });

      const embed = new EmbedBuilder()
        .setTitle('お問い合わせ内容')
        .setDescription('対応者をお待ちください…')
        .setColor('Blurple');

      const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('call_handler')
          .setLabel('呼び出し')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('delete_ticket')
          .setLabel('削除')
          .setStyle(ButtonStyle.Danger)
      );

      await channel.send({ content: `<@${interaction.user.id}>`, embeds: [embed], components: [buttons] });
      await interaction.reply({ content: `チケットを作成しました：${channel}`, ephemeral: true });
      return;
    }

    // ⏰ 呼び出しボタン
    if (interaction.customId === 'call_handler') {
      const chanId = interaction.channelId;
      const now = Date.now();
      const lastCall = callCooldowns.get(chanId) ?? 0;

      const cooldown = 60 * 60 * 1000; // 1時間
      const remaining = cooldown - (now - lastCall);

      if (remaining > 0) {
        const hrs = Math.floor(remaining / 3600000);
        const mins = Math.floor((remaining % 3600000) / 60000);
        const secs = Math.floor((remaining % 60000) / 1000);
        const embed = new EmbedBuilder()
          .setColor('Red')
          .setDescription(`次の呼び出しまで：${hrs}時間${mins}分${secs}秒`);
        return await interaction.reply({ embeds: [embed], ephemeral: true });
      }

      callCooldowns.set(chanId, now);

      // 対応ロールを取得（最初のメッセージのカスタムIDから）
      const panelMsg = (await interaction.channel.messages.fetch({ limit: 10 })).find(m =>
        m.components?.[0]?.components?.[0]?.customId?.includes('ticket_open')
      );

      let roleMention = null;
      if (panelMsg) {
        try {
          const idData = JSON.parse(panelMsg.components[0].components[0].customId);
          if (idData.role) {
            const role = interaction.guild.roles.cache.get(idData.role);
            if (role) {
              roleMention = `<@&${role.id}>`;
            }
          }
        } catch (err) {
          console.error('対応ロールの解析失敗:', err);
        }
      }

      const mentionText = roleMention
        ? `${roleMention}、お客様が呼び出しています。`
        : `対応者の方、お客様が呼び出しています。`;

      await interaction.channel.send({ content: mentionText });
      await interaction.reply({ content: '呼び出しを送信しました。', ephemeral: true });
      return;
    }

    // 🗑️ 削除ボタン
    if (interaction.customId === 'delete_ticket') {
      const member = interaction.member;
      const hasPermission =
        member.roles.cache.some(r => r.permissions.has(PermissionFlagsBits.ManageChannels)) ||
        member.permissions.has(PermissionFlagsBits.Administrator);

      if (!hasPermission) {
        const embed = new EmbedBuilder()
          .setColor('Red')
          .setDescription('このチャンネルを削除する権限がありません。');
        return await interaction.reply({ embeds: [embed], ephemeral: true });
      }

      const messages = await interaction.channel.messages.fetch({ limit: 100 });
      const textLog = messages
        .filter(m => !m.author.bot)
        .map(m => `[${m.createdAt.toLocaleString('ja-JP')}][${m.author.tag}]: ${m.content}`)
        .reverse()
        .join('\n');

      const embed = new EmbedBuilder()
        .setTitle('チケットログ')
        .addFields(
          { name: 'サーバー名', value: `${interaction.guild.name} (${interaction.guild.id})`, inline: false },
          { name: '開いた人', value: interaction.channel.name.replace('🎫｜', ''), inline: true },
          { name: '閉じた人', value: interaction.user.tag, inline: true },
          { name: '閉じた日時', value: new Date().toLocaleString('ja-JP'), inline: false }
        )
        .setColor('DarkBlue');

      const logUser = await interaction.client.users.fetch(LOG_DM_USER_ID).catch(() => null);
      if (logUser) {
        await logUser.send({ embeds: [embed] });
        await logUser.send({
          files: [{ attachment: Buffer.from(textLog, 'utf-8'), name: `${interaction.channel.name}_log.txt` }]
        });
      }

      await interaction.reply({ content: 'チャンネルを削除します。', ephemeral: true });
      await interaction.channel.delete();
      return;
    }
  }
};
