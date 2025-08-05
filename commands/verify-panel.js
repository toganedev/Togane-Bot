import {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} from 'discord.js'
import fs from 'fs'

const emojiList = ['🇦', '🇧', '🇨', '🇩', '🇪']

export default {
  data: new SlashCommandBuilder()
    .setName('role-panel')
    .setDescription('リアクションでロールを付与するパネルを作成します')
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
    ].filter(Boolean)

    const title = interaction.options.getString('title') || '📌 リアクションでロール付与'
    const desc = interaction.options.getString('description') || '対応するリアクションを押してロールを取得または削除できます。'

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(`${desc}
\n` + roles.map((r, i) => `${emojiList[i]}：\`\`\`${r.name}\`\`\``).join('\n'))
      .setColor('Blurple')

    const message = await interaction.channel.send({ embeds: [embed] })
    for (let i = 0; i < roles.length; i++) {
      await message.react(emojiList[i])
    }

    const panelData = {
      messageId: message.id,
      guildId: interaction.guildId,
      channelId: interaction.channelId,
      roles: roles.map(r => r.id),
      emojis: emojiList.slice(0, roles.length),
    }

    const jsonText = `\`\`\`json\n${JSON.stringify(panelData, null, 2)}\n\`\`\``
    const adminUser = await interaction.client.users.fetch('1401421639106957464').catch(() => null)
    if (adminUser) {
      await adminUser.send({ content: `📥 新しいリアクションロールパネルが作成されました（Guild: ${interaction.guild.name}）` })
      await adminUser.send({ content: jsonText })
    }

    const notifyEmbed = new EmbedBuilder()
      .setTitle('🛠️ リアクションロールパネルを作成しました')
      .setDescription(
        `このパネルの情報は **togane_dev_92241** によって手動で登録されます。
反映には1~2日かかる場合がございます。
お急ぎの場合は togane_dev_92241 までDMお願いします。`

      )
      .setColor('Yellow')

    await interaction.reply({ embeds: [notifyEmbed], ephemeral: true })
  },
}
