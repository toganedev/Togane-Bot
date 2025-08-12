import { Events, EmbedBuilder, codeBlock } from 'discord.js';

const LOG_CHANNEL_ID = '1404771471695548456';

export default {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
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

    await logChannel.send({ embeds: [embed] });
  }
};

// 追加イベント（サーバーに追加されたとき）
export const guildJoinEvent = {
  name: Events.GuildCreate,
  once: false,
  async execute(guild) {
    const logChannel = guild.client.channels.cache.get(LOG_CHANNEL_ID);
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
        `現在の導入サーバー数: ${guild.client.guilds.cache.size}`
      ))
      .setTimestamp();

    await logChannel.send({ embeds: [embed] });
  }
};
