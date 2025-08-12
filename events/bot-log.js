const { Events, EmbedBuilder, codeBlock } = require('discord.js');

const LOG_CHANNEL_ID = '1404771471695548456';

module.exports = (client) => {
  
  // BOT起動時
  client.once(Events.ClientReady, () => {
    const logChannel = client.channels.cache.get(LOG_CHANNEL_ID);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
      .setTitle('🚀 BOT起動通知')
      .setColor('Green')
      .setDescription(codeBlock(
        `BOT名: ${client.user.tag}\n` +
        `起動時刻: ${new Date().toLocaleString('ja-JP')}\n` +
        `導入サーバー数: ${client.guilds.cache.size}`
      ))
      .setTimestamp();

    logChannel.send({ embeds: [embed] });
  });

  // サーバーに追加された時
  client.on(Events.GuildCreate, async (guild) => {
    const logChannel = client.channels.cache.get(LOG_CHANNEL_ID);
    if (!logChannel) return;

    let ownerUser;
    try {
      const owner = await guild.fetchOwner();
      ownerUser = `${owner.user.tag} (${owner.user.id})`;
    } catch {
      ownerUser = '取得失敗';
    }

    const embed = new EmbedBuilder()
      .setTitle('📥 BOTがサーバーに追加されました')
      .setColor('Blue')
      .setDescription(codeBlock(
        `サーバー名: ${guild.name}\n` +
        `サーバーID: ${guild.id}\n` +
        `管理者: ${ownerUser}\n` +
        `サーバー人数: ${guild.memberCount}\n` +
        `現在の導入サーバー数: ${client.guilds.cache.size}`
      ))
      .setTimestamp();

    logChannel.send({ embeds: [embed] });
  });
};
