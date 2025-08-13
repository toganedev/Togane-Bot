export default {
  name: 'interactionCreate',
  async execute(interaction, client) {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction, client);
    } catch (error) {
      console.error(error);

      // 既に応答済みなら編集、それ以外は新規返信
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ content: '⚠️ エラーが発生しました。' });
      } else {
        await interaction.reply({ content: '⚠️ エラーが発生しました。' });
      }
    }
  }
};
