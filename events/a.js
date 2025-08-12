const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const OWNER_ID = '1401421639106957464';

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    // コマンド処理
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      try {
        await command.execute(interaction, client);
      } catch (error) {
        console.error(error);
        if (interaction.deferred || interaction.replied) {
          await interaction.editReply({ content: '❌ コマンド実行中にエラーが発生しました' });
        } else {
          await interaction.reply({ content: '❌ コマンド実行中にエラーが発生しました', ephemeral: true });
        }
      }
    }

    // サーバー選択メニュー処理
    if (interaction.isStringSelectMenu() && interaction.customId === 'select_server') {
      if (interaction.user.id !== OWNER_ID) {
        return interaction.reply({
          embeds: [new EmbedBuilder().setColor('Red').setDescription('a')],
          ephemeral: true,
        });
      }

      const guildId = interaction.values[0];
      const guild = client.guilds.cache.get(guildId);
      if (!guild) {
        return interaction.reply({ content: '⚠ サーバーが見つかりません', ephemeral: true });
      }

      let inviteLink = '❌ 権限不足で招待リンクを作成できません';
      try {
        const channel = guild.systemChannel || guild.channels.cache.find(c => c.isTextBased() && c.permissionsFor(guild.members.me).has('CreateInstantInvite'));
        if (channel) {
          const invite = await channel.createInvite({ maxAge: 0, maxUses: 0 });
          inviteLink = invite.url;
        }
      } catch {
        // 権限不足
      }

      const owner = await guild.fetchOwner();
      const embed = new EmbedBuilder()
        .setColor('Blue')
        .setTitle(`📜 サーバー情報 - ${guild.name}`)
        .addFields(
          { name: 'サーバーID', value: guild.id, inline: true },
          { name: 'オーナー', value: `${owner.user.tag} (${owner.id})`, inline: true },
          { name: 'メンバー数', value: `${guild.memberCount}人`, inline: true },
          { name: '招待リンク', value: inviteLink, inline: false }
        )
        .setThumbnail(guild.iconURL({ dynamic: true }))
        .setTimestamp();

      const components = [];
      if (inviteLink.startsWith('http')) {
        components.push(
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setLabel('招待リンク')
              .setStyle(ButtonStyle.Link)
              .setURL(inviteLink)
          )
        );
      }

      await interaction.reply({
        embeds: [embed],
        components,
        ephemeral: true,
      });
    }
  },
};
