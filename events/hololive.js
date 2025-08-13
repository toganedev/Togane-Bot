import fetch from 'node-fetch';
import { EmbedBuilder, Events } from 'discord.js';

const CHANNEL_ID = '1405184657032482921'; // 通知先チャンネルID
let sentSoon = new Set();
let sentNow = new Set();

export default {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    console.log('Hololive schedule watcher started.');
    setInterval(async () => {
      try {
        const res = await fetch('https://schedule.hololive.tv/api/list/7');
        const data = await res.json();

        for (const dateGroup of data.dateGroupList) {
          for (const video of dateGroup.videoList) {
            const broadcastTime = new Date(video.datetime.replace(/\//g, '-'));
            const now = new Date();

            // 配信予定
            if (broadcastTime > now && !video.isLive && !sentSoon.has(video.url)) {
              const embed = new EmbedBuilder()
                .setTitle(video.title)
                .setURL(video.url)
                .setColor(0x808080)
                .setAuthor({ name: video.name, iconURL: video.talent.iconImageUrl })
                .setThumbnail(video.thumbnail)
                .addFields({ name: 'Status', value: `Live soon... (${broadcastTime.toLocaleString('ja-JP')})` });

              await client.channels.cache.get(CHANNEL_ID)?.send({ embeds: [embed] });
              sentSoon.add(video.url);
            }

            // 配信開始
            if (video.isLive && !sentNow.has(video.url)) {
              const embed = new EmbedBuilder()
                .setTitle(video.title)
                .setURL(video.url)
                .setColor(0xFF0000)
                .setAuthor({ name: video.name, iconURL: video.talent.iconImageUrl })
                .setThumbnail(video.thumbnail)
                .addFields({ name: 'Status', value: 'Live now!!!' });

              await client.channels.cache.get(CHANNEL_ID)?.send({ embeds: [embed] });
              sentNow.add(video.url);
            }
          }
        }
      } catch (err) {
        console.error('Hololive fetch error:', err);
      }
    }, 300000); // 10秒ごとにチェック
  }
};
