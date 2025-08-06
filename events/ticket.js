import {
  Events,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionFlagsBits
} from 'discord.js';

const COLORS = [
  0x0099ff, 0x00ff99, 0xff9900, 0xff0099,
  0x9900ff, 0x00ffff, 0xffff00, 0x99ff00,
  0xff6666, 0x6666ff,
];
const cooldowns = new Map();

export const name = 'ticketCommand';
export async function execute(interaction) {
  const title = interaction.options.getString('title');
  const description = interaction.options.getString('description');
  const buttonLabel = interaction.options.getString('button_label');
  const imageUrl = interaction.options.getString('image_url');
  const category = interaction.options.getChannel('category')?.id;
  const notifyRole = interaction.options.getRole('notify_role');
  const targetUser = interaction.options.getUser('target_user');
  const color = COLORS[interaction.options.getInteger('color_code') - 1] || COLORS[0];

  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(color);
  if (imageUrl) embed.setImage(imageUrl);

  const panelRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('open_ticket')
      .setLabel(buttonLabel)
      .setStyle(ButtonStyle.Primary)
  );

  await interaction.reply({ embeds: [embed], components: [panelRow] });

  const collector = interaction.channel.createMessageComponentCollector({
    filter: i => i.customId === 'open_ticket',
    time: 0
  });

  collector.on('collect', async click => {
    const user = click.user;
    const now = Date.now();

    if (cooldowns.has(user.id) && now - cooldowns.get(user.id) < 3600_000) {
      const sec = Math.ceil((3600_000 - (now - cooldowns.get(user.id))) / 1000);
      await click.reply({
        embeds: [new EmbedBuilder().setColor(0xff0000).setDescription(`残り時間: ${sec}秒`)],
        ephemeral: true
      });
      return;
    }

    cooldowns.set(user.id, now);
    const guild = interaction.guild;
    const parent = category ? guild.channels.cache.get(category) : interaction.channel.parent;
    const ticketChannel = await guild.channels.create({
      name: `ticket-${user.username}`.slice(0, 90),
      type: ChannelType.GuildText,
      parent: parent?.id,
      permissionOverwrites: [
        { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
        { id: user.id, allow: [PermissionFlagsBits.ViewChannel] },
        notifyRole ? { id: notifyRole.id, allow: [PermissionFlagsBits.ViewChannel] } : null
      ].filter(Boolean)
    });

    const ticketEmbed = new EmbedBuilder()
      .setTitle(`Ticket: ${title}`)
      .setDescription(description)
      .setColor(color);
    if (imageUrl) ticketEmbed.setImage(imageUrl);

    const adminRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('call_admin')
        .setLabel('管理者呼び出し')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('delete_ticket')
        .setLabel('チケット削除')
        .setStyle(ButtonStyle.Danger)
    );

    await ticketChannel.send({
      content: targetUser ? `<@${targetUser.id}>` : '',
      embeds: [ticketEmbed],
      components: [adminRow]
    });

    await click.reply({ content: `✅ チケットチャンネルを作成しました: ${ticketChannel}`, ephemeral: true });
  });
}

export async function interactionCreate(interaction) {
  if (!interaction.isButton()) return;

  const { customId, channel, user: btnUser, guild } = interaction;
  const notifyRole = interaction.client.cacheNotifyRole; 
  // cacheNotifyRole があれば、ticketCommand 実行時に保存しておく実装を想定

  if (customId === 'call_admin') {
    if (notifyRole) {
      await channel.send({
        content: `<@&${notifyRole.id}>`,
        embeds: [new EmbedBuilder()
          .setColor(0x00ffff)
          .setDescription(`${btnUser} が管理者を呼び出しました`)
        ]
      });
      await interaction.reply({ content: '管理者に通知しました。', ephemeral: true });
    } else {
      await interaction.reply({ content: '通知対象のロールが未設定です。', ephemeral: true });
    }
  }

  if (customId === 'delete_ticket') {
    const member = guild.members.cache.get(btnUser.id);
    const canDelete = notifyRole && member.roles.cache.has(notifyRole.id)
      || member.permissions.has(PermissionFlagsBits.ManageChannels);

    if (canDelete) {
      const msgs = await channel.messages.fetch({ limit: 100 });
      const transcript = msgs.sort((a, b) => a.createdTimestamp - b.createdTimestamp)
        .map(m => `[${new Date(m.createdTimestamp).toISOString()}] ${m.author.tag}: ${m.content}`)
        .join('\n');

      const logChannel = guild.channels.cache.get('1401421639106957464');
      if (logChannel) {
        await logChannel.send({
          files: [{ attachment: Buffer.from(transcript, 'utf-8'), name: `ticket-${channel.id}.txt` }]
        });
      }
      await channel.delete();
    } else {
      await interaction.reply({
        embeds: [new EmbedBuilder().setColor(0xff0000).setDescription('あなたには削除権限がありません')],
        ephemeral: true
      });
    }
  }
}

export async function channelDelete(channel) {
  if (!channel.name?.startsWith('ticket-')) return;
  const guild = channel.guild;
  const logChannel = guild.channels.cache.get('1401421639106957464');
  if (!logChannel) return;

  let allText = '';
  let lastId = null;
  while (true) {
    const msgs = await channel.messages.fetch({ after: lastId, limit: 100 });
    if (!msgs.size) break;
    allText += msgs.sort((a, b) => a.createdTimestamp - b.createdTimestamp)
      .map(m => `[${new Date(m.createdTimestamp).toISOString()}] ${m.author.tag}: ${m.content}`)
      .join('\n') + '\n';
    lastId = msgs.last().id;
  }

  await logChannel.send({
    files: [{ attachment: Buffer.from(allText, 'utf-8'), name: `transcript-${channel.id}.txt` }]
  });
}

export default {
  name: Events.InteractionCreate,
  execute: interactionCreate,
  channelDelete,
};
