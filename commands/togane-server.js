import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ComponentType,
  ChannelType
} from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('togane-server')
    .setDescription('特定サーバーの情報をページ形式で表示します'),

  async execute(interaction, client) {
    // 専用ユーザーIDチェック
    if (interaction.user.id !== '1401421639106957464') {
      return interaction.reply({
        content: 'このコマンドは専用ユーザーのみが実行できます。',
        ephemeral: true
      });
    }

    const guild = interaction.guild;
    if (!guild) {
      return interaction.reply({
        content: 'このコマンドはサーバー内でのみ使用できます。',
        ephemeral: true
      });
    }

    // メンバーキャッシュ更新
    await guild.members.fetch();

    // ページデータ作成
    const pages = [
      {
        label: '基本情報',
        value: 'page1',
        embed: new EmbedBuilder()
          .setTitle(`📜 サーバー情報 - ${guild.name}`)
          .setColor(0x00AE86)
          .setThumbnail(guild.iconURL({ dynamic: true }))
          .addFields(
            { name: 'サーバー名', value: `\`\`\`${guild.name}\`\`\`` },
            { name: 'サーバーID', value: `\`\`\`${guild.id}\`\`\`` },
            { name: '作成日', value: `\`\`\`${guild.createdAt.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}\`\`\`` },
            { name: 'サーバー所有者', value: `<@${guild.ownerId}> (${guild.ownerId})` }
          )
          .setFooter({ text: `ページ 1 / 3` })
      },
      {
        label: 'メンバー情報',
        value: 'page2',
        embed: new EmbedBuilder()
          .setTitle(`👥 メンバー情報 - ${guild.name}`)
          .setColor(0x3498db)
          .addFields(
            { name: '総メンバー数', value: `\`\`\`${guild.memberCount}\`\`\`` },
            { name: 'BOT数', value: `\`\`\`${guild.members.cache.filter(m => m.user.bot).size}\`\`\`` },
            { name: 'ユーザー数', value: `\`\`\`${guild.members.cache.filter(m => !m.user.bot).size}\`\`\`` }
          )
          .setFooter({ text: `ページ 2 / 3` })
      },
      {
        label: 'チャンネル情報',
        value: 'page3',
        embed: new EmbedBuilder()
          .setTitle(`📂 チャンネル情報 - ${guild.name}`)
          .setColor(0xe67e22)
          .addFields(
            { name: 'テキストチャンネル', value: `\`\`\`${guild.channels.cache.filter(c => c.type === ChannelType.GuildText).size}\`\`\`` },
            { name: 'ボイスチャンネル', value: `\`\`\`${guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice).size}\`\`\`` },
            { name: 'カテゴリー', value: `\`\`\`${guild.channels.cache.filter(c => c.type === ChannelType.GuildCategory).size}\`\`\`` }
          )
          .setFooter({ text: `ページ 3 / 3` })
      }
    ];

    // セレクトメニュー作成
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('server-info-select')
      .setPlaceholder('表示するページを選択')
      .addOptions(pages.map(p => ({ label: p.label, value: p.value })));

    const row = new ActionRowBuilder().addComponents(selectMenu);

    // 初期ページ送信
    await interaction.reply({
      embeds: [pages[0].embed],
      components: [row],
      ephemeral: false
    });

    // メニュー操作監視
    const msg = await interaction.fetchReply();
    const collector = msg.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time: 120000
    });

    collector.on('collect', async i => {
      if (i.user.id !== interaction.user.id) {
        return i.reply({
          content: 'このメニューはあなたは操作できません。',
          ephemeral: true
        });
      }
      const selected = pages.find(p => p.value === i.values[0]);
      if (selected) {
        await i.update({
          embeds: [selected.embed],
          components: [row]
        });
      }
    });

    collector.on('end', () => {
      msg.edit({ components: [] }).catch(() => {});
    });
  }
};
