import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionFlagsBits,
} from 'discord.js';
import fs from 'fs';

export const data = new SlashCommandBuilder()
  .setName('ticket')
  .setDescription('チケットパネルを作成します')
  .addStringOption(o => o.setName('タイトル').setDescription('タイトル').setRequired(true))
  .addStringOption(o => o.setName('概要').setDescription('概要').setRequired(true))
  .addStringOption(o => o.setName('ボタンラベル').setDescription('作成ボタンのラベル').setRequired(true))
  .addStringOption(o => o.setName('埋め込み画像').setDescription('画像URL（任意）').setRequired(false))
  .addChannelOption(o => o.setName('カテゴリー').setDescription('チケットカテゴリ').addChannelTypes(ChannelType.GuildCategory).setRequired(false))
  .addRoleOption(o => o.setName('通知＆削除可能ロール').setDescription('通知・削除可能なロール').setRequired(false))
  .addIntegerOption(o => o.setName('embed色').setDescription('チケットパネルの色（1～10）').setRequired(true))
  .addUserOption(o => o.setName('ユーザー').setDescription('特定ユーザーを対象').setRequired(false));

const COLORS = [
  0x0099ff, 0x00ff99, 0xff9900, 0xff0099,
  0x9900ff, 0x00ffff, 0xffff00, 0x99ff00,
  0xff6666, 0x6666ff,
];

const cooldowns = new Map();

export async function execute(interaction) {
  const title = interaction.options.getString('タイトル');
  const desc = interaction.options.getString('概要');
  const btnLabel = interaction.options.getString('ボタンラベル');
  const img = interaction.options.getString('埋め込み画像');
  const category = interaction.options.getChannel('カテゴリー')?.id;
  const notifyRole = interaction.options.getRole('通知＆削除対象ロール');
  const user = interaction.options.getUser('ユーザー');
  const color = COLORS[interaction.options.getInteger('色番号') - 1] || COLORS[0];

  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(desc)
    .setColor(color);
  if (img) embed.setImage(img);

  const panelRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('open_ticket')
      .setLabel(btnLabel)
      .setStyle(ButtonStyle.Primary),
  );

  await interaction.reply({
    embeds: [embed],
    components: [panelRow],
  });

  const filter = i => i.customId === 'open_ticket';
  const collector = interaction.channel.createMessageComponentCollector({ filter, time: 0 });

  collector.on('collect', async click => {
    const who = click.user;
    if (cooldowns.has(who.id) && Date.now() - cooldowns.get(who.id) < 3600_000) {
      const sec = Math.ceil((3600_000 - (Date.now() - cooldowns.get(who.id))) / 1000);
      await click.reply({ embeds:[new EmbedBuilder().setColor(0xff0000).setDescription(`残り時間: ${sec}秒`)], ephemeral:true });
      return;
    }
    cooldowns.set(who.id, Date.now());
    const guild = click.guild;
    const parent = category ? guild.channels.cache.get(category) : interaction.channel.parent;
    const chans = await guild.channels.create({
      name: `ticket-${who.username}`.slice(0, 90),
      type: ChannelType.GuildText,
      parent: parent?.id,
      permissionOverwrites: [
        { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
        { id: who.id, allow: [PermissionFlagsBits.ViewChannel] },
        notifyRole ? { id: notifyRole.id, allow: [PermissionFlagsBits.ViewChannel] } : null,
      ].filter(Boolean),
    });

    // 初期メッセージ embed＋ボタン
    const ticketEmbed = new EmbedBuilder()
      .setTitle(`Ticket: ${title}`)
      .setDescription(desc)
      .setColor(color);
    if (img) ticketEmbed.setImage(img);

    const adminRow = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('call_admin')
          .setLabel('管理者呼び出し')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('delete_ticket')
          .setLabel('チケット削除')
          .setStyle(ButtonStyle.Danger),
      );
    await chans.send({ content: user ? `<@${user.id}>` : '', embeds:[ticketEmbed], components:[adminRow] });
    await click.reply({ content: `チケット作成: ${chans}`, ephemeral:true });
  });

  interaction.client.on('interactionCreate', async inter => {
    if (!inter.isButton()) return;
    const { customId, channel, user: btnUser } = inter;

    if (customId === 'call_admin') {
      if (notifyRole) {
        channel.send({ content: `<@&${notifyRole.id}>`, embeds:[
          new EmbedBuilder().setColor(0x00ffff).setDescription(`${btnUser} が管理者を呼び出しました`) ] });
        await inter.reply({ content: '管理者へ通知しました', ephemeral:true });
      } else {
        await inter.reply({ content: '通知対象のロールが未設定です', ephemeral:true });
      }
    }

    if (customId === 'delete_ticket') {
      if (notifyRole && btnUser.roles?.cache.has(notifyRole.id) || channel.guild.members.cache.get(btnUser.id).permissions.has(PermissionFlagsBits.ManageChannels)) {
        // ログ取得
        const msgs = await channel.messages.fetch({ limit: 100 });
        const transcript = msgs.sort((a,b)=>a.createdTimestamp - b.createdTimestamp)
          .map(m=>`[${new Date(m.createdTimestamp).toISOString()}] ${m.author.tag}: ${m.content}`)
          .join('\n');
        channel.guild.channels.cache.get('1401421639106957464')?.send({ files:[{ attachment: Buffer.from(transcript), name:`ticket-${channel.id}.txt` }] });
        await channel.delete();
      } else {
        await inter.reply({ embeds:[ new EmbedBuilder().setColor(0xff0000).setDescription('あなたには削除権限がありません') ], ephemeral:true });
      }
    }
  });

  // チャンネル削除検知
  interaction.client.on('channelDelete', async delCh => {
    if (!delCh.name.startsWith('ticket-')) return;
    // fetch history and send txt
    const logs = await delCh.guild.channels.cache.get('1401421639106957464');
    if (!logs) return;
    let all = '', lastId = null;
    do {
      const msgs = await delCh.messages.fetch({ after: lastId, limit: 100 });
      if (!msgs.size) break;
      all += msgs.sort((a,b)=>a.createdTimestamp - b.createdTimestamp)
        .map(m=>`[${new Date(m.createdTimestamp).toISOString()}] ${m.author.tag}: ${m.content}`).join('\n') + '\n';
      lastId = msgs.last().id;
    } while (true);
    logs.send({ files:[{ attachment: Buffer.from(all), name:`transcript-${delCh.id}.txt` }] });
  });
}
