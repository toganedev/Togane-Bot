import {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  EmbedBuilder,
} from 'discord.js'

function generateMathProblem() {
  const a = Math.floor(Math.random() * 9) + 1
  const b = Math.floor(Math.random() * 9) + 1
  const op = ['+', '-', '*'][Math.floor(Math.random() * 3)]
  if (op === '-' && a < b) return generateMathProblem()
  return { question: `${a} ${op} ${b}`, answer: eval(`${a}${op}${b}`) }
}

export default {
  name: 'interactionCreate',
  async execute(interaction) {
    if (interaction.isButton()) {
      const [prefix, , method, roleId] = interaction.customId.split('-')
      if (prefix !== 'verify') return

      const member = interaction.member
      const role = interaction.guild.roles.cache.get(roleId)
      if (!role) {
        return interaction.reply({
          content: '❌ ロールが見つかりませんでした。',
          ephemeral: true
        })
      }

      if (member.roles.cache.has(roleId)) {
        const embed = new EmbedBuilder()
          .setTitle('🎉 すでに認証済みです')
          .setDescription(`あなたはすでにロール \`\`\`${role.name}\`\`\` を持っています。`)
          .setColor('Grey')
          .setThumbnail(member.user.displayAvatarURL({ size: 128 }))

        return interaction.reply({ embeds: [embed], ephemeral: true })
      }

      if (method === 'button') {
        try {
          await member.roles.add(role)
          const embed = new EmbedBuilder()
            .setTitle('✅ 認証完了！')
            .setDescription(`ロール \`\`\`${role.name}\`\`\` を付与しました。`)
            .setColor('Green')
            .setThumbnail(member.user.displayAvatarURL({ size: 128 }))
          await interaction.reply({ embeds: [embed], ephemeral: true })
        } catch (err) {
          console.error(err)
          return interaction.reply({ content: '❌ ロール付与に失敗しました。', ephemeral: true })
        }
      }

      if (method === 'calc') {
        const { question, answer } = generateMathProblem()
        const modal = new ModalBuilder()
          .setTitle('🧠 認証クイズ')
          .setCustomId(`verify-modal-${roleId}-${answer}`)

        const input = new TextInputBuilder()
          .setCustomId('math-answer')
          .setLabel(`問題: ${question} = ?`)
          .setStyle(TextInputStyle.Short)
          .setRequired(true)

        modal.addComponents(new ActionRowBuilder().addComponents(input))
        await interaction.showModal(modal)
      }
    }

    if (interaction.isModalSubmit()) {
      const [prefix, , roleId, correctAnswer] = interaction.customId.split('-')
      if (prefix !== 'verify') return

      const input = interaction.fields.getTextInputValue('math-answer')
      const role = interaction.guild.roles.cache.get(roleId)
      const member = interaction.member

      if (parseInt(input) === parseInt(correctAnswer)) {
        if (!member.roles.cache.has(roleId)) {
          await member.roles.add(role)
        }

        const embed = new EmbedBuilder()
          .setTitle('✅ 認証成功！')
          .setDescription(`正解です！ロール \`\`\`${role.name}\`\`\` を付与しました。`)
          .setColor('Blue')
          .setThumbnail(member.user.displayAvatarURL({ size: 128 }))

        return interaction.reply({ embeds: [embed], ephemeral: true })
      } else {
        const embed = new EmbedBuilder()
          .setTitle('❌ 不正解')
          .setDescription(`正解は \`${correctAnswer}\` です。再度お試しください。`)
          .setColor('Red')

        return interaction.reply({ embeds: [embed], ephemeral: true })
      }
    }
  }
}
