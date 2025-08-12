import {
  Events,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  ChannelType,
  PermissionsBitField,
} from 'discord.js';

const OWNER_ID = '1401421639106957464';
const PAGE_SIZE = 25;

function paginate(arr, size) {
  const pages = [];
  for (let i = 0; i < arr.length; i += size) pages.push(arr.slice(i, i + size));
  return pages;
}

async function findInvitableTextChannel(guild) {
  try {
    if (guild.systemChannel && guild.members.me?.permissionsIn(guild.systemChannel).has(PermissionsBitField.Flags.CreateInstantInvite)) {
      return guild.systemChannel;
    }
    const text = guild.channels.cache
      .filter(c => c.type === ChannelType.GuildText)
      .find(c => guild.members.me?.permissionsIn(c).has(PermissionsBitField.Flags.CreateInstantInvite));
    return text ?? null;
  } catch {
    return null;
  }
}

async function createPermanentInvite(guild) {
  const ch = await findInvitableTextChannel(guild);
  if (!ch) return null;
  try {
    const invite = await ch.createInvite({ maxAge: 0, maxUses: 0 });
    return invite.url;
  } catch {
    return null;
  }
}

function buildServerListEmbed(client, pageIndex, totalPages) {
  return new EmbedBuilder()
    .setColor('Blurple')
    .setTitle('サーバー一覧')
    .setDescription('表示するサーバーを選択してください')
    .setFooter({ text: `ページ ${pageIndex + 1} / ${totalPages}` })
    .setTimestamp();
}

function buildSelectRow(guildsPage) {
  const options = guildsPage.map(g => ({
    label: g.name?.slice(0, 100) || 'No Name',
    value: g.id,
    description: `ID: ${g.id}`.slice(0, 100),
  }));
  const select = new StringSelectMenuBuilder()
    .setCustomId('select_server')
    .setPlaceholder('サーバーを選択')
    .addOptions(options);
  return new ActionRowBuilder().addComponents(select);
}

function buildPagerRow(pageIndex, totalPages) {
  const prev = new ButtonBuilder()
    .setCustomId(`page_prev_${pageIndex}`)
    .setLabel('◀ 前')
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(pageIndex <= 0);

  const next = new ButtonBuilder()
    .setCustomId(`page_next_${pageIndex}`)
    .setLabel('次 ▶')
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(pageIndex >= totalPages - 1);

  const close = new ButtonBuilder()
    .setCustomId('page_close')
    .setLabel('閉じる')
    .setStyle(ButtonStyle.Danger);

  return new ActionRowBuilder().addComponents(prev, next, close);
}

function buildServerDetailEmbed(guild, ownerTag, inviteLink) {
  const codeBlock =
    '```' +
    `サーバー名 : ${guild.name}\n` +
    `サーバーID : ${guild.id}\n` +
    `オーナー   : ${ownerTag} (${guild.ownerId})\n` +
    `メンバー数 : ${guild.memberCount}\n` +
    '```';

  return new EmbedBuilder()
    .setColor('Blue')
    .setTitle(`📜 サーバー情報 - ${guild.name}`)
    .setThumbnail(guild.iconURL({ size: 256 }))
    .setDescription(codeBlock)
    .addFields(
      { name: '作成日 (JST)', value: guild.createdAt.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }), inline: true },
      { name: '招待リンク', value: inviteLink ? inviteLink : '❌ 作成できませんでした', inline: false },
    )
    .setTimestamp();
}

function buildInviteButtons(inviteLink) {
  const rows = [];

  if (inviteLink) {
    rows.push(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel('招待リンクを開く').setURL(inviteLink),
      ),
    );
    rows.push(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setStyle(ButtonStyle.Primary).setCustomId('show_invite_embed').setLabel('招待リンクをEmbedで表示'),
      ),
    );
  } else {
    rows.push(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setStyle(ButtonStyle.Secondary).setCustomId('show_invite_embed').setLabel('招待リンクをEmbedで表示').setDisabled(true),
      ),
    );
  }

  return rows;
}

export default {
  name: Events.MessageCreate,
  once: false,
  async execute(message, client) {
    try {
      if (message.author.bot) return;
      if (message.content.trim() !== 'togane!server') return;

      // OWNER以外 → DMで「a」
      if (message.author.id !== OWNER_ID) {
        const embed = new EmbedBuilder().setColor('Red').setDescription('a');
        await message.author.send({ embeds: [embed] }).catch(() => {});
        return;
      }

      // DM開始
      const user = message.author;
      const guilds = [...client.guilds.cache.values()];
      const pages = paginate(guilds, PAGE_SIZE);
      const totalPages = Math.max(1, pages.length);
      let pageIndex = 0;

      const embed = buildServerListEmbed(client, pageIndex, totalPages);
      const msg = await user.send({
        embeds: [embed],
        components: [buildSelectRow(pages[pageIndex] ?? []), buildPagerRow(pageIndex, totalPages)],
      });

      const collector = msg.createMessageComponentCollector({ time: 10 * 60 * 1000 });

      collector.on('collect', async (i) => {
        // すべてDM・OWNER本人のみ
        if (i.user.id !== OWNER_ID) {
          await i.reply({ content: 'この操作は許可されていません。', flags: 64 }).catch(() => {});
          return;
        }

        // ページング
        if (i.isButton()) {
          if (i.customId === 'page_close') {
            collector.stop('closed');
            try { await i.update({ components: [] }); } catch {}
            return;
          }

          const m = i.customId.match(/^page_(prev|next)_(\d+)$/);
          if (m) {
            const dir = m[1];
            const current = parseInt(m[2], 10);
            pageIndex = dir === 'prev' ? Math.max(0, current - 1) : Math.min(totalPages - 1, current + 1);
            const listEmbed = buildServerListEmbed(client, pageIndex, totalPages);
            try {
              await i.update({
                embeds: [listEmbed],
                components: [buildSelectRow(pages[pageIndex] ?? []), buildPagerRow(pageIndex, totalPages)],
              });
            } catch {}
            return;
          }

          if (i.customId === 'show_invite_embed') {
            // 直前に返信したメッセージのembedからURLが取れない場合があるので、直近の「対象ギルド」を再取得せず、最後に表示した詳細の内容はそのままに
            const last = i.message.embeds?.[0];
            const urlField = last?.fields?.find(f => f.name === '招待リンク');
            const url = urlField && urlField.value?.startsWith('http') ? urlField.value : null;

            const e = new EmbedBuilder()
              .setColor('Green')
              .setTitle('招待リンク（埋め込み表示）')
              .setDescription(url ? `[参加はこちら](${url})` : '❌ 招待リンクが見つかりません')
              .setTimestamp();

            try {
              await i.reply({ embeds: [e] });
            } catch {}
            return;
          }
        }

        // サーバー選択
        if (i.isStringSelectMenu() && i.customId === 'select_server') {
          const guildId = i.values[0];
          const guild = client.guilds.cache.get(guildId);
          if (!guild) {
            try { await i.reply({ content: 'サーバーが見つかりませんでした。', flags: 64 }); } catch {}
            return;
          }

          let ownerTag = `Unknown (${guild.ownerId})`;
          try {
            const owner = await guild.fetchOwner();
            ownerTag = `${owner.user.tag}`;
          } catch {}

          const inviteLink = await createPermanentInvite(guild);
          const detailEmbed = buildServerDetailEmbed(guild, ownerTag, inviteLink);
          const rows = buildInviteButtons(inviteLink);

          try {
            await i.reply({ embeds: [detailEmbed], components: rows });
          } catch {}
          return;
        }
      });

      collector.on('end', async () => {
        try {
          await msg.edit({ components: [] });
        } catch {}
      });
    } catch (err) {
      console.error('togane!server error:', err);
    }
  },
};
