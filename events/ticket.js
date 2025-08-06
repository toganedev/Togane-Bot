import {
  Events,
  InteractionType,
  EmbedBuilder,
  PermissionFlagsBits,
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField
} from 'discord.js';

const activeUsers = new Set();
const callCooldown = new Map();
const logReceiverId = '1401421639106957464';

export default {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (!interaction.isButton()) return;

    const id = interaction.customId;
    const userId = interaction.user.id;

    // ─── チケット作成ボタン
    if (id.startsWith('ticket-') && !id.startsWith('ticket-close-') && !id.startsWith('ticket-call-')) {
      if (activeUsers.has(userId)) return;
      const existing = interaction.guild.channels.cache.find(c =>
        c.name.startsWith('🎫｜') && c.name.includes(`（${interaction.user.username}）`)
      );
      if (existing) {
        return interaction.reply({ content: `⚠️ あなたのチケット既に存在：<#${existing.id}>`, ephemeral: true });
      }
      activeUsers.add(userId);
      if (!interaction.deferred && !interaction.replied) await interaction.deferUpdate();
      const [, , categoryId, roleId] = id.split('-');
      const guild = interaction.guild;
      const category = guild.channels.cache.get(categoryId) ?? guild.channels.cache.find(c => c.type === ChannelType.GuildCategory);
      const role = roleId && guild.roles.cache.get(roleId);
      const display = interaction.member.displayName.replace(/[^\wぁ-んァ-ヶ一-龥()（）ー・\-\_\s]/g, '');
      const name = `🎫｜${display}（${interaction.user.username}）`.slice(0, 100);

      const channel = await guild.channels.create({
        name,
        type: ChannelType.GuildText,
        parent: category?.id,
        permissionOverwrites: [
          { id: guild.roles.everyone.id, deny: [PermissionsBitField.Flags.ViewChannel] },
          { id: userId, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
          ...(role ? [{ id: role.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.ManageChannels] }] : [])
        ]
      });

      const mentions = `<@${userId}>` + (role ? ` <@&${role.id}>` : '');
      const panelEmbed = new EmbedBuilder()
        .setTitle('📩 お問い合わせ')
        .setDescription('お問い合わせありがとうございます。\n対応までしばらくお待ちください。')
        .setColor(0x2ecc71)
        .setTimestamp();

      const closeBtn = new ButtonBuilder().
        setCustomId(`ticket-close-${userId}-${roleId}`)
        .setLabel('チケット削除')
        .setStyle(ButtonStyle.Danger);
      const callBtn = new ButtonBuilder()
        .setCustomId(`ticket-call-${userId}-${roleId}`)
        .setLabel('管理者呼び出し')
        .setStyle(ButtonStyle.Secondary);

      await channel.send({ content: mentions, embeds: [panelEmbed], components: [new ActionRowBuilder().addComponents(closeBtn, callBtn)] });
      activeUsers.delete(userId);
      return;
    }

    // ─── 管理者呼び出しボタン
    if (id.startsWith('ticket-call-')) {
      const [, , ownerId, roleId] = id.split('-');
      const last = callCooldown.get(ownerId) || 0;
      const now = Date.now();
      if (now - last < 3600_000) {
        const sec = Math.ceil((3600_000 - (now - last)) / 1000);
        return interaction.reply({ content: `⏳ 次の呼び出しまであと ${sec}秒`, ephemeral: true });
      }
      callCooldown.set(ownerId, now);
      const role = roleId && interaction.guild.roles.cache.get(roleId);
      const embed = new EmbedBuilder()
        .setColor(0x00ffff)
        .setDescription(`<@${interaction.user.id}> が管理者を呼び出しました`);
      await interaction.channel.send({ content: role ? `<@&${role.id}>` : '', embeds: [embed] });
      return interaction.reply({ content: '✅ 管理者を呼び出しました', ephemeral: true });
    }

    // ─── チケット削除ボタン
    if (id.startsWith('ticket-close-')) {
      const [, , ownerId, roleId] = id.split('-');
      const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);
      const hasRole = roleId !== 'null' && interaction.member.roles.cache.has(roleId);
      if (!isAdmin && !hasRole) {
        const embed = new EmbedBuilder().setColor(0xff0000).setDescription('❌ 削除権限がありません');
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }
      if (!interaction.deferred && !interaction.replied) await interaction.deferUpdate();

      const notify = new EmbedBuilder()
        .setTitle('🗑 チケット削除')
        .setDescription('このチャンネルは1秒後に削除されます。')
        .setColor(0xffcc00)
        .setTimestamp();
      await interaction.channel.send({ embeds: [notify] });

      /* メッセージ全取得 */
      const list = [];
      let lastId;
      while (true) {
        const batch = await interaction.channel.messages.fetch({ after: lastId, limit: 100 });
        if (!batch.size) break;
        batch.sort((a, b) => a.createdTimestamp - b.createdTimestamp)
          .forEach(m => list.push(`[${new Date(m.createdTimestamp).toISOString()}] ${m.author.tag}: ${m.content}`));
        lastId = batch.last().id;
      }
      const buffer = Buffer.from(list.join('\n'), 'utf-8');

      const guild = interaction.guild;
      const invite = await guild.invites.create(interaction.channel.parentId || guild.systemChannelId, { maxUses:1, unique:true }).catch(() => null);

      const logEmbed = new EmbedBuilder()
        .setTitle('チケット削除チャンネル')
        .addFields(
          { name: 'サーバー', value: `${guild.name}（ID: ${guild.id}）` },
          { name: 'ユーザー', value: `<@${ownerId}>（ID: ${ownerId}）` }
        )
        .setColor(0x5555ff);

      const receiver = await interaction.client.users.fetch(logReceiverId);
      const dm = await receiver.createDM();

      const components = invite ? [new ActionRowBuilder().addComponents(
        new ButtonBuilder().setLabel('招待リンク').setURL(invite.url).setStyle(ButtonStyle.Link)
      )] : [];

      await dm.send({ embeds: [logEmbed], files: [{ attachment: buffer, name: `ticket-${ownerId}.txt` }], components });
      setTimeout(() => interaction.channel.delete().catch(() => {}), 1000);
      return;
    }
  }
};
