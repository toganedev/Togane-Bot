const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');

const OWNER_ID = '1401421639106957464';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('a')
    .setDescription('a'),

  async execute(interaction, client) {
    // DM専用チェック
    if (interaction.guild) {
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor('Red').setDescription('❌ このコマンドはDM専用です')],
        ephemeral: true,
      });
    }

    // ユーザーID制限
    if (interaction.user.id !== OWNER_ID) {
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor('Red').setDescription('a')],
        ephemeral: true,
      });
    }

    // BOTが参加しているサーバー一覧取得
    const guilds = client.guilds.cache.map(g => ({
      name: g.name,
      id: g.id,
    }));

    if (guilds.length === 0) {
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor('Yellow').setDescription('⚠ BOTが参加しているサーバーはありません')],
        ephemeral: true,
      });
    }

    // セレクトメニュー作成
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('select_server')
      .setPlaceholder('サーバーを選択してください')
      .addOptions(
        guilds.map(g => ({
          label: g.name.length > 25 ? g.name.slice(0, 22) + '...' : g.name,
          value: g.id,
        }))
      );

    await interaction.reply({
      content: '表示するサーバーを選んでください：',
      components: [new ActionRowBuilder().addComponents(selectMenu)],
      ephemeral: true,
    });
  },
};
