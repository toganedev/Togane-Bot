// events/guildMemberAdd.js
import { EmbedBuilder } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 保存されているウェルカムチャンネル設定ファイル
const welcomeFile = path.join(__dirname, '../data/welcomeChannels.json');

export default {
  name: 'guildMemberAdd',
  async execute(member) {
    // 設定ファイルが無ければ終了
    if (!fs.existsSync(welcomeFile)) return;
    const data = JSON.parse(fs.readFileSync(welcomeFile, 'utf8'));

    const channelId = data[member.guild.id];
    if (!channelId) return;

    const channel = member.guild.channels.cache.get(channelId);
    if (!channel?.isTextBased()) return;

    // Embed作成
    const embed = new EmbedBuilder()
      .setColor(0x00AE86)
      .setTitle('🎉 新しいメンバーが参加しました！')
      .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: '👤 ユーザー名', value: `\`\`\`${member.user.tag}\`\`\``, inline: true },
        { name: '🆔 ユーザーID', value: `\`\`\`${member.id}\`\`\``, inline: true },
        { name: '🏠 サーバー名', value: `\`\`\`${member.guild.name}\`\`\`` }
      )
      .setFooter({ text: 'ようこそ！楽しんでね🎈' })
      .setTimestamp();

    // メッセージ送信
    await channel.send({
      content: `👋 ようこそ <@${member.id}>`,
      embeds: [embed],
    });
  }
};
