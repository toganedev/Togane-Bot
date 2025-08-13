import {
  EmbedBuilder,
  codeBlock,
} from 'discord.js';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

dayjs.extend(utc);
dayjs.extend(timezone);

const LOG_CHANNEL_ID = '1404771471695548456'; // 通知先チャンネルID

export default {
  name: 'ready',
  once: true,
  async execute(client) {
    const channel = await client.channels.fetch(LOG_CHANNEL_ID).catch(() => null);
    if (!channel) return;

    // コードブロックで全体を囲む本文
    const descriptionText = [
      'Botが正常に起動しました。',
      `起動時刻 (JST)`,
      dayjs().tz('Asia/Tokyo').format('YYYY/MM/DD HH:mm:ss'),
      `導入サーバー数`,
      `${client.guilds.cache.size} サーバー`
    ].join('\n');

    const embed = new EmbedBuilder()
      .setTitle('✅ BOT起動通知')
      .setColor(0x00ff00)
      .setDescription(codeBlock(descriptionText))
      .setFooter({ text: `Bot ID: ${client.user.id}` });

    await channel.send({ embeds: [embed] });
  },
};

// Botがサーバーに追加されたとき
export const guildCreateEvent = {
  name: 'guildCreate',
  async execute(guild, client) {
    const channel = await client.channels.fetch(LOG_CHANNEL_ID).catch(() => null);
    if (!channel) return;

    const owner = await guild.fetchOwner().catch(() => null);

    const embed = new EmbedBuilder()
      .setTitle('📥 サーバー追加通知')
      .setColor(0x3498db)
      .setDescription('Botが新しいサーバーに追加されました。')
      .addFields(
        { name: 'サーバー名', value: codeBlock(guild.name), inline: true },
        { name: 'サーバーID', value: codeBlock(guild.id), inline: true },
        { name: '管理者', value: owner ? `${owner.user.tag} (${owner.id})` : '不明', inline: true },
        { name: 'メンバー数', value: `${guild.memberCount} 人`, inline: true },
        { name: '導入サーバー数', value: `${client.guilds.cache.size} サーバー`, inline: true },
        { name: '追加日時 (JST)', value: dayjs().tz('Asia/Tokyo').format('YYYY/MM/DD HH:mm:ss') }
      );

    await channel.send({ embeds: [embed] });
  },
};
