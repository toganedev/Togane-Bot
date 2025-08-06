import {
  Events,
  EmbedBuilder,
  PermissionFlagsBits,
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField,
  ComponentType
} from 'discord.js';

const activeTicketUsers = new Set();
const deleteCooldown = new Map();
const callCooldown = new Map();
const logChannelId = '1401421639106957464';

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (!interaction.isButton()) return;

    const client = interaction.client;

    // 📌 チケット作成ボタン
    if (interaction.customId.startsWith('ticket-') && !interaction.customId.startsWith('ticket-close-')) {
      const userId = interaction.user.id;
      if (activeTicketUsers.has(userId)) return;

      const existing = interaction.guild.channels.cache.find(c =>
        c.name.startsWith(`🎫｜`) && c.name.includes(`（${interaction.user.username}）`)
      );
      if (existing) {
        await interaction.reply({ content: `⚠️ あなたのチケットは既に存在します：<#${existing.id}>`, ephemeral: true });
        return;
      }

      activeTicketUsers.add(userId);
      await interaction.deferUpdate().catch(() => {});
      const [, , categoryId, roleId] = interaction.customId.split('-');

      const guild = interaction.guild;
      const category = guild.channels.cache.get(categoryId) || guild.channels.cache.find(c => c.type === ChannelType.GuildCategory);
      const role = roleId && guild.roles.cache.get(roleId);
      const everyone = guild.roles.everyone;
      const displayName = interaction.member.displayName.replace(/[^\wぁ-んァ-ヶ一-龥()（）ー・\-\_\s]/g, '');
      const channelName = `🎫｜${displayName}（${interaction.user.username}）`.slice(0, 100);

      const channel = await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        parent: category?.id,
        permissionOverwrites: [
          { id: everyone.id, deny: [PermissionsBitField.Flags.ViewChannel] },
          { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
          ...(role ? [{ id: role.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.ManageChannels] }] : [])
        ]
      });

      const mentions = `<@${interaction.user.id}>` + (role ? ` <@&${role.id}>` : '');

      const embed = new EmbedBuilder()
        .setTitle('📩 お問い合わせ')
        .setDescription('お問い合わせありがとうございます。\n対応には少々お待ちください。')
        .setColor(0x2ecc71)
        .setTimestamp();

      const deleteBtn = new ButtonBuilder()
        .setCustomId(`ticket-close-${interaction.user.id}-${roleId}`)
        .setLabel('チケット削除')
        .setStyle(ButtonStyle.Danger);

      const callBtn = new ButtonBuilder()
        .setCustomId(`ticket-call-${interaction.user.id}-${roleId}`)
        .setLabel('管理者呼び出し')
        .setStyle(ButtonStyle.Secondary);

      const row = new ActionRowBuilder().addComponents(deleteBtn, callBtn);
      await channel.send({ content: mentions, embeds: [embed], components: [row] });

      activeTicketUsers.delete(userId);
      return;
    }

    // 📌 管理者呼び出しボタン
    if (interaction.customId.startsWith('ticket-call-')) {
      const [, , ownerId, roleId] = interaction.customId.split('-');
      const now = Date.now();
      const last = callCooldown.get(ownerId) || 0;
      if (now - last < 3600_000) {
        const sec = Math.ceil((3600_000 - (now - last)) / 1000);
        return interaction.reply({ content: `⏳ 次に呼び出せるまであと ${sec}秒`, ephemeral: true });
      }
      callCooldown.set(ownerId, now);
      const role = roleId && interaction.guild.roles.cache.get(roleId);

      const embed = new EmbedBuilder()
        .setColor(0x00ffff)
        .setDescription(`<@${interaction.user.id}> が管理者を呼び出しました`);
      await interaction.channel.send({ content: role ? `<@&${role.id}>` : '', embeds: [embed] });
      return interaction.reply({ content: '✅ 管理者を呼び出しました。', ephemeral: true });
    }

    // 🗑 チケット削除ボタン
    if (interaction.customId.startsWith('ticket-close-')) {
      const [, , ownerId, roleId] = interaction.customId.split('-');
      const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);
      const hasRole = roleId !== 'null' && interaction.member.roles.cache.has(roleId);
      if (!isAdmin && !hasRole) {
        const embed = new EmbedBuilder().setColor(0xff0000).setDescription('❌ あなたにはチケットを削除する権限がありません。');
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      const embedNotify = new EmbedBuilder()
        .setTitle('🗑 チケット削除')
        .setDescription('このチャンネルは1秒後に削除されます。')
        .setColor(0xffcc00)
        .setTimestamp();
      await interaction.channel.send({ embeds: [embedNotify] });

      // ログ送信機能
      const messages = [];
      let lastId;
      while (true) {
        const fetched = await interaction.channel.messages.fetch({ after: lastId, limit: 100 });
        if (!fetched.size) break;
        fetched.sort((a, b) => a.createdTimestamp - b.createdTimestamp)
          .forEach(m => messages.push(`[${new Date(m.createdTimestamp).toISOString()}] ${m.author.tag}: ${m.content}`));
        lastId = fetched.last().id;
      }
      const contentText = messages.join('\n');
      const txtBuffer = Buffer.from(contentText, 'utf-8');

      const user = interaction.user;
      const guild = interaction.guild;

      const invite = await guild.invites.create(interaction.channel.parentId || guild.systemChannelId, { maxUses: 1, unique: true })
        .catch(() => null);

      const embedLog = new EmbedBuilder()
        .setTitle('チケット削除チャンネル')
        .addFields(
          { name: 'サーバー', value: `${guild.name}（ID: ${guild.id}）` },
          { name: 'ユーザー', value: `<@${ownerId}>（ID: ${ownerId}）` }
        );

      const dmChan = await user.createDM();
      const components = invite ? [new ActionRowBuilder().addComponents(
        new ButtonBuilder().setLabel('サーバー招待リンク').setURL(invite.url).setStyle(ButtonStyle.Link)
      )] : [];

      await dmChan.send({ embeds: [embedLog], files: [{ attachment: txtBuffer, name: `ticket-${ownerId}.txt` }], components });
      setTimeout(() => interaction.channel.delete().catch(() => {}), 1000);
      return;
    }
  }
};
