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
      // すでに応答済みなら何もしない
      if (!interaction.deferred && !interaction.replied) {
        await interaction.reply({ content: 'エラーが発生しました。', flags: 64 }); // ephemeral
      } else {
        await interaction.editReply({ content: 'エラーが発生しました。' });
      }
    }
  }
};
