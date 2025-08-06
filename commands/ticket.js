import {
  Events,
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
const logReceiverId = '1401421639106957464'; // 固定でDM送信

export default {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (!interaction.isButton()) return;

    const id = interaction.customId;
    const userId = interaction.user.id;

    // ▼ チケット作成
    if (id.startsWith('ticket-open-')) {
      if (!interaction.deferred && !interaction.replied) await interaction.deferUpdate();
      if (activeUsers.has(userId)) return;
      activeUsers.add(userId);

      const existing = interaction.guild.channels.cache.find(c =>
        c.name.startsWith('🎫｜') && c.name.includes(`（${interaction.user.username}）`)
      );
      if (existing) {
        await interaction.followUp({ content: `⚠️ 既に存在します：<#${existing.id}>`, ephemeral: true });
        activeUsers.delete(userId);
        return;
      }

      const [, , categoryId, roleId] = id.split('-');
      const guild = interaction.guild;
      const category = guild.channels.cache.get(categoryId) ??
                     guild.channels.cache.find(c => c.type === ChannelType.GuildCategory);
      const role = roleId !== 'null' && guild.roles.cache.get(roleId);
      const display = interaction.member.displayName.replace(/[^ \wぁ-んァ-ヶ一-龥()（）ー・\-\_]/g, '');
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

      const mentions =(`<@${userId}>`)+(role ? ` <@&${role.id}>` : '');
      const panelEmbed = new EmbedBuilder()
        .setTitle('📩 お問い合わせ')
        .setDescription('お問い合わせありがとうございます。しばらくお待ちください。')
        .setColor(0x2ecc71)
        .setTimestamp();

      const closeBtn = new ButtonBuilder()
        .setCustomId(`ticket-close-${userId}-${roleId}`)
        .setLabel('チケット削除')
        .setStyle(ButtonStyle.Danger);

      const callBtn = new ButtonBuilder()
        .setCustomId(`ticket-call-${userId}-${roleId}`)
        .setLabel('管理者呼び出し')
        .setStyle(ButtonStyle.Secondary);

      await channel.send({
        content: mentions,
        embeds: [panelEmbed],
        components: [new ActionRowBuilder().addComponents(closeBtn, callBtn)]
      });

      activeUsers.delete(userId);
      return;
    }

    // ▼ 管理者呼び出し
    if (id.startsWith('ticket-call-')) {
      if (!interaction.deferred && !interaction.replied) await interaction.deferUpdate();
      const [, , ownerId, roleId] = id.split('-');
      const last = callCooldown.get(ownerId) || 0;
      const now = Date.now();
      if (now - last < 3600_000) {
        const sec = Math.ceil((3600_000 - (now - last)) / 1000);
        await interaction.followUp({ content: `⏳ 次の呼び出しまであと ${sec}秒`, ephemeral: true });
        return;
      }
      callCooldown.set(ownerId, now);
      const role = roleId !== 'null' && interaction.guild.roles.cache.get(roleId);
      const embed = new EmbedBuilder()
        .setColor(0x00ffff)
        .setDescription(`<@${interaction.user.id}> が管理者を呼び出しました`);
      await interaction.channel.send({ content: role ? `<@&${role.id}>` : '', embeds: [embed] });
      await interaction.followUp({ content: '✅ 管理者を呼び出しました。', ephemeral: true });
      return;
    }

    // ▼ チケット削除
    if (id.startsWith('ticket-close-')) {
      if (!interaction.deferred && !interaction.replied) await interaction.deferUpdate();
      const [, , ownerId, roleId] = id.split('-');
      const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);
      const hasRole = roleId !== 'null' && interaction.member.roles.cache.has(roleId);
      if (!isAdmin && !hasRole) {
        await interaction.followUp({
          embeds: [new EmbedBuilder().setColor(0xff0000).setDescription('❌ 削除権限がありません')],
          ephemeral: true
        });
        return;
      }

      await interaction.channel.send({
        embeds: [new EmbedBuilder()
          .setTitle('🗑 チケット削除')
          .setDescription('このチャンネルは1秒後に削除されます。')
          .setColor(0xffcc00)
          .setTimestamp()]
      });

      const messages = [];
      let lastId;
      while (true) {
        const batch = await interaction.channel.messages.fetch({ after: lastId, limit: 100 });
        if (!batch.size) break;
        batch.sort((a,b)=>a.createdTimestamp - b.createdTimestamp)
          .forEach(m => messages.push(`[${new Date(m.createdTimestamp).toISOString()}] ${m.author.tag}: ${m.content}`));
        lastId = batch.last().id;
      }

      const buffer = Buffer.from(messages.join('\n'), 'utf‑8');
      const guild = interaction.guild;
      const invite = await guild.invites.create(interaction.channel.parentId || guild.systemChannelId, { maxUses:1, unique:true }).catch(() => null);
      const logEmbed = new EmbedBuilder()
        .setTitle('チケット削除ログ')
        .addFields(
          { name: 'サーバー', value: `${guild.name}（ID: ${guild.id}）` },
          { name: 'ユーザー', value: `<@${ownerId}>（ID: ${ownerId}）` }
        );

      const receiver = await interaction.client.users.fetch(logReceiverId);
      const dm = await receiver.createDM();
      const components = invite ? [new ActionRowBuilder().addComponents(
        new ButtonBuilder().setLabel('サーバー招待リンク').setStyle(ButtonStyle.Link).setURL(invite.url)
      )] : [];

      await dm.send({
        embeds: [logEmbed],
        files: [{ attachment: buffer, name: `ticket-${ownerId}.txt` }],
        components
      });

      setTimeout(() => interaction.channel.delete().catch(() => {}), 1000);
    }
  }
};
