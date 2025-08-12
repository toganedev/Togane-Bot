import {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits
} from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('role-info')
    .setDescription('📜 サーバーの全ロール情報を権限順に表示します'),

  async execute(interaction) {
    const roles = interaction.guild.roles.cache
      .sort((a, b) => b.position - a.position)
      .map(role => {
        const perms = [];
        if (role.permissions.has(PermissionFlagsBits.Administrator)) perms.push('管理者✅');
        else perms.push('管理者❌');

        if (role.permissions.has(PermissionFlagsBits.BanMembers)) perms.push('BAN✅');
        else perms.push('BAN❌');

        if (role.permissions.has(PermissionFlagsBits.ModerateMembers)) perms.push('Timeout✅');
        else perms.push('Timeout❌');

        if (role.permissions.has(PermissionFlagsBits.KickMembers)) perms.push('KICK✅');
        else perms.push('KICK❌');

        return `${role.name} — ${perms.join(' / ')}`;
      });

    const roleList = roles.join('\n');

    const embed = new EmbedBuilder()
      .setColor('Random')
      .setTitle(`📜 ${interaction.guild.name} のロール情報`)
      .setDescription(`\`\`\`\n${roleList}\n\`\`\``)
      .setFooter({ text: `ロール数: ${roles.length}` });

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
