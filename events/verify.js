import { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from 'discord.js'

// 内部ランダム問題作成
function makeProblem() {
  const ops = ['+', '-', '×']
  const op = ops[Math.floor(Math.random() * ops.length)]
  let a = Math.floor(Math.random() * 9) + 1
  let b = Math.floor(Math.random() * 9) + 1
  let question = `${a} ${op} ${b}`
  let answer
  if (op === '+') answer = a + b
  if (op === '-') {
    if (a < b) [a, b] = [b, a]
    question = `${a} - ${b}`
    answer = a - b
  }
  if (op === '×') answer = a * b
  return { question, answer }
}

export default {
  name: 'interactionCreate',
  async execute(interaction, client) {
    if (interaction.isChatInputCommand()) {
      const cmd = client.commands.get(interaction.commandName)
      if (!cmd) return
      try { await cmd.execute(interaction, client) }
      catch (e) { console.error(e) }
    }

    if (interaction.isButton()) {
      if (interaction.customId === 'verify-button') {
        const role = interaction.message.interaction?.options.getRole('role')
        if (role) await interaction.member.roles.add(role).catch(() => {})
        await interaction.reply({ content: `✅ 役職が付与されました！`, ephemeral: true })
      }
      if (interaction.customId === 'verify-calc') {
        const { question, answer } = makeProblem()
        const modal = new ModalBuilder()
          .setCustomId(`verify-modal-${answer}`)
          .setTitle('認証テスト')
        const input = new TextInputBuilder()
          .setCustomId('answer')
          .setLabel(`以下を計算してください: ${question}`)
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
        modal.addComponents(new ActionRowBuilder().addComponents(input))
        await interaction.showModal(modal)
      }
    }

    if (interaction.isModalSubmit()) {
      if (interaction.customId.startsWith('verify-modal-')) {
        const correct = parseInt(interaction.customId.split('-')[2], 10)
        const user = parseInt(interaction.fields.getTextInputValue('answer'), 10)
        if (user === correct) {
          const orig = interaction.message
          const role = orig.interaction?.options.getRole('role')
          if (role) await interaction.member.roles.add(role).catch(() => {})
          await interaction.reply({ content: `✅ 正解！役職が付与されました`, ephemeral: true })
        } else {
          await interaction.reply({ content: `❌ 不正解です…`, ephemeral: true })
        }
      }
    }
  }
}
