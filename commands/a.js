// a.js
import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('a')
    .setDescription('BOTが入っているサーバー情報を表示'),

  async execute(interaction, client) {
    if (interaction.user.id !== '1401421639106957464') {
      const embed = new EmbedBuilder()
        .setColor('Red')
        .setDescription('a');
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
    if (interaction.guild) {
      return interaction.reply({
        content: 'このコマンドはDMでのみ使用できます。',
        ephemeral: true
      });
    }

    const guilds = [...client.guilds.cache.values()];
    if (!guilds.length) {
      return interaction.reply({
        content: 'BOTはどのサーバーにも参加していません。',
        ephemeral: true
      });
    }

    const menu = new StringSelectMenuBuilder()
      .setCustomId('select_guild')
      .setPlaceholder('サーバーを選択してください')
      .addOptions(
        guilds.map(guild => ({
          label: guild.name,
          description: `ID: ${guild.id}`,
          value: guild.id
        }))
      );

    const row = new ActionRowBuilder().addComponents(menu);

    await interaction.reply({
      content: 'サーバーを選択してください。',
      components: [row],
      ephemeral: true
    });

    const filter = i => i.customId === 'select_guild' && i.user.id === interaction.user.id;
    const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

    collector.on('collect', async i => {
      const guild = client.guilds.cache.get(i.values[0]);
      if (!guild) return;

      const owner = await guild.fetchOwner();
      const invite = await guild.invites.create(guild.systemChannelId || guild.channels.cache.find(c => c.isTextBased())?.id, {
        maxAge: 0,
        maxUses: 0
      });

      const embed = new EmbedBuilder()
        .setTitle(`サーバー情報: ${guild.name}`)
        .addFields(
          { name: 'サーバーID', value: `${guild.id}`, inline: true },
          { name: '管理者', value: `${owner.user.tag} (${owner.id})`, inline: true },
          { name: 'メンバー数', value: `${guild.memberCount}`, inline: true }
        )
        .setColor('Blue');

      const button = new ButtonBuilder()
        .setLabel('招待リンクを表示')
        .setStyle(ButtonStyle.Link)
        .setURL(invite.url);

      const rowBtn = new ActionRowBuilder().addComponents(button);

      await i.update({ embeds: [embed], components: [rowBtn] });
    });
  }
};
