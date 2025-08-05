// commands/role-panel.js
import {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} from 'discord.js';

const emojiList = ['🇦', '🇧', '🇨', '🇩', '🇪'];

export default {
  data: new SlashCommandBuilder()
    .setName('role-panel')
    .setDescription('リアクションロールパネルを作成します')
    .addRoleOption(opt => opt.setName('role_a').setDescription('A: のロール').setRequired(true))
    .addRoleOption(opt => opt.setName('role_b').setDescription('B: のロール').setRequired(false))
    .addRoleOption(opt => opt.setName('role_c').setDescription('C: のロール').setRequired(false))
    .addRoleOption(opt => opt.setName('role_d').setDescription('D: のロール').setRequired(false))
    .addRoleOption(opt => opt.setName('role_e').setDescription('E: のロール').setRequired(false))
    .addStringOption(opt => opt.setName('title').setDescription('埋め込みタイトル').setRequired(false))
    .addStringOption(opt => opt.setName('description').setDescription('埋め込み説明文').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  async execute(interaction) {
    const roles = [
      interaction.options.getRole('role_a'),
      interaction.options.getRole('role_b'),
      interaction.options.getRole('role_c'),
      interaction.options.getRole('role_d'),
      interaction.options.getRole('role_e'),
    ].filter(Boolean);

    const title = interaction.options.getString('title') || '📌 リアクションでロール付与';
    const desc = interaction.options.getString('description') || '対応するリアクションを押してロールを取得または削除できます。';

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(`${desc}\n\n` + roles.map((role, i) => `${emojiList[i]}：\`\`\`${role.name}\`\`\``).join('\n'))
      .setColor('Blurple');

    const message = await interaction.channel.send({ embeds: [embed] });

    for (let i = 0; i < roles.length; i++) {
      await message.react(emojiList[i]);
    }

    // データ記録：このメッセージIDにどのリアクションがどのロールかを保存
    const panelData = {
      messageId: message.id,
      guildId: interaction.guildId,
      channelId: interaction.channelId,
      roles: roles.map(r => r.id),
      emojis: emojiList.slice(0, roles.length),
    };

    const fs = await import('fs');
    const filePath = './rolepanel.json';
    const panels = fs.existsSync(filePath)
      ? JSON.parse(fs.readFileSync(filePath, 'utf8'))
      : [];

    panels.push(panelData);
    fs.writeFileSync(filePath, JSON.stringify(panels, null, 2));

    await interaction.reply({ content: '✅ リアクションロールパネルを作成しました。', ephemeral: true });
  }
};
