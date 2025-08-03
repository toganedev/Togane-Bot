import { ModalBuilder, TextInputBuilder, ActionRowBuilder, TextInputStyle, EmbedBuilder } from 'discord.js'

function makeProblem() {
  const ops = ['+', '-', '×']
  let a = Math.floor(Math.random() * 9) + 1
  let b = Math.floor(Math.random() * 9) + 1
  const op = ops[Math.floor(Math.random() * ops.length)]
  if (op === '-' && a < b) [a, b] = [b, a]
  const answer = op === '+' ? a + b : op === '-' ? a - b : a * b
  return { question: `${a} ${op} ${b}`, answer }
}

export default async function handleVerify(interaction, client) {
  if (!interaction.isButton() && !interaction.isModalSubmit()) return
  const [ , method ] = interaction.customId.split('-')

  const orig = interaction.message.interaction
  const role = orig?.options.getRole('role')
  const user = interaction.member

  if (interaction.isButton()) {
    if (method === 'button') {
      if (role && user.roles.cache.has(role.id)) {
        const embed = new EmbedBuilder()
          .setTitle('⚠️ すでに役職を持っています')
          .setDescription(`\`\`\`\n${user.user.tag} はすでに <@&${role.id}> を持っています\n\`\`\``)
          .setColor('Orange')
          .setThumbnail(user.user.displayAvatarURL())

        await interaction.reply({ embeds: [embed], ephemeral: true })
        return
      }
      if (role) await user.roles.add(role).catch(() => {})
      const embed = new EmbedBuilder()
        .setTitle('✅ ロール付与完了')
        .setDescription(`\`\`\`\n${user.user.tag} に <@&${role?.id}> を付与しました\n\`\`\``)
        .setColor('Green')
        .setThumbnail(user.user.displayAvatarURL())

      await interaction.reply({ embeds: [embed], ephemeral: true })
    }

    if (method === 'calc') {
      const { question, answer } = makeProblem()
      const modal = new ModalBuilder()
        .setCustomId(`verify-calc-${answer}`)
        .setTitle('🧩 計算認証')
      const input = new TextInputBuilder()
        .setCustomId('answer')
        .setLabel(question)
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
      modal.addComponents(new ActionRowBuilder().addComponents(input))
      await interaction.showModal(modal)
    }
  }

  if (interaction.isModalSubmit()) {
    if (!interaction.customId.startsWith('verify-calc-')) return
    const correct = parseInt(interaction.customId.split('-')[2], 10)
    const given = parseInt(interaction.fields.getTextInputValue('answer'), 10)
    if (given === correct) {
      if (role && !user.roles.cache.has(role.id)) {
        await user.roles.add(role).catch(() => {})
        const embed = new EmbedBuilder()
          .setTitle('✅ 認証成功！')
          .setDescription(`\`\`\`\n正解：${correct}\n${user.user.tag} に <@&${role.id}> を付与しました\n\`\`\``)
          .setColor('Blue')
          .setThumbnail(user.user.displayAvatarURL())

        await interaction.reply({ embeds: [embed], ephemeral: true })
      } else {
        const embed = new EmbedBuilder()
          .setTitle('⚠️ 既にロールを持っています')
          .setDescription(`\`\`\`\n${user.user.tag} は既に <@&${role?.id}> を持っています\n\`\`\``)
          .setColor('Orange')
          .setThumbnail(user.user.displayAvatarURL())

        await interaction.reply({ embeds: [embed], ephemeral: true })
      }
    } else {
      await interaction.reply({ content: '❌ 不正解でした…', ephemeral: true })
    }
  }
}
