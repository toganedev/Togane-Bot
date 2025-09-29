import { Events, EmbedBuilder } from 'discord.js';

export default {
  name: Events.VoiceStateUpdate,
  async execute(oldState, newState) {
    const guildId = '1366903010940162211';
    const logChannelId = '1366903011619635323';
    const notifyRoleId = '1422216820441747499';

    if (newState.guild.id !== guildId) return;

    const logChannel = newState.guild.channels.cache.get(logChannelId);
    if (!logChannel) return;

    // ✅ ユーザーがボイスチャンネルに参加した場合
    if (!oldState.channelId && newState.channelId) {
      const channel = newState.channel;

      // 参加前の人数を確認
      const beforeCount = oldState.guild.channels.cache.get(newState.channelId)?.members.size || 0;

      const embed = new EmbedBuilder()
        .setTitle('📥 ボイスチャンネル参加')
        .setDescription(`${newState.member.user.username} が <#${newState.channelId}> に参加しました`)
        .setColor(0x2ecc71)
        .setTimestamp();

      // 👤 最初の人が入った場合のみロール通知
      if (beforeCount === 1) {
        return logChannel.send({
          content: `<@&${notifyRoleId}>`,
          embeds: [embed],
        });
      } else {
        return logChannel.send({ embeds: [embed] });
      }
    }

    // ✅ ユーザーがボイスチャンネルから退出した場合
    if (oldState.channelId && !newState.channelId) {
      const channel = oldState.channel;
      if (!channel) return;

      // 全員いなくなったら通知
      if (channel.members.size === 0) {
        const embed = new EmbedBuilder()
          .setTitle('📤 ボイスチャンネル退出')
          .setDescription(`全員が <#${channel.id}> から退出しました`)
          .setColor(0xe74c3c)
          .setTimestamp();

        return logChannel.send({ embeds: [embed] });
      }
    }
  },
};
