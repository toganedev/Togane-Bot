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
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: '⚠️ エラーが発生しました。' });
      }
      // 応答済みなら何もしない
    }
  }
};
