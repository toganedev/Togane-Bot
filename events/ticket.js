import {
  ChannelType,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} from 'discord.js';

const callCooldowns = new Map();
const LOG_DM_USER_ID = '1401421639106957464';

export default {
  name: 'interactionCreate',
  async execute(interaction) {
    if (!interaction.isButton()) return;

    let data;
    try {
      data = JSON.parse(interaction.customId);
    } catch {
      data = { c: interaction.customId };
    }

    // 🎫 チケット作成ボタン
    if (data.c === 'ticket_open') {
      try {
        await interaction.deferReply({ flags: 1 << 6 });
      } catch (err) {
        console.error('❌ deferReply failed:', err);
        return;
      }

      const guild = interaction.guild;
      const role = data.role ? guild.roles.cache.get(data.role) : null;
      const category = data.cat ? guild.channels.cache.get(data.cat) : interaction.channel?.parent ?? null;

      const existing = guild.channels.cache.find(c =>
        c.name.includes(`🎫｜${interaction.user.username}`) && c.type === ChannelType.GuildText
      );
      if (existing) {
        return await interaction.editReply({ content: `既にチケットを作成しています：${existing}` });
      }

      const channel = await guild.channels.create({
        name: `🎫｜${interaction.user.username}${interaction.user.id}`.replace(/\s/g, ''),
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
          .setCustomId('delete_ticket')
          .setLabel('削除')
          .setStyle(ButtonStyle.Danger)
      );

      const mentions = [`<@${interaction.user.id}>`];
      if (role) mentions.push(`<@&${role.id}>`);

      await channel.send({
        content: mentions.join(' '),
        embeds: [embed],
        components: [buttons],
        allowedMentions: {
          parse: ['users', ...(role ? [] : ['everyone', 'roles'])],
          ...(role ? { roles: [role.id] } : {})
        }
      });

      await interaction.editReply({ content: `チケットを作成しました：${channel}` });
      return;
    }

    // 🗑️ 削除ボタン
    if (interaction.customId === 'delete_ticket') {
      try {
        await interaction.deferReply({ flags: 1 << 6 });
      } catch (err) {
        console.error('⚠️ deferReply (delete_ticket) failed:', err);
        return;
      }

      const member = interaction.member;
      const hasPermission =
        member.roles.cache.some(r => r.permissions.has(PermissionFlagsBits.ManageChannels)) ||
        member.permissions.has(PermissionFlagsBits.Administrator);

      if (!hasPermission) {
        const embed = new EmbedBuilder()
          .setColor('Red')
          .setDescription('このチャンネルを削除する権限がありません。');
        return await interaction.editReply({ embeds: [embed] });
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

      await interaction.editReply({ content: 'チャンネルを削除します。' });
      await interaction.channel.delete();
      return;
    }
  }
};
