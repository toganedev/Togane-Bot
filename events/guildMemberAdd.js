import { EmbedBuilder } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const welcomeFile = path.join(__dirname, '../data/welcomeChannels.json');

export default {
  name: 'guildMemberAdd',
  async execute(member) {
    // welcome設定ファイルが存在しない場合は終了
    if (!fs.existsSync(welcomeFile)) return;
    const data = JSON.parse(fs.readFileSync(welcomeFile, 'utf8'));

    // ギルドIDに対応するチャンネルIDを取得
    const channelId = data[member.guild.id];
    if (!channelId) return;

    const channel = member.guild.channels.cache.get(channelId);
    if (!channel?.isTextBased()) return;

    // コードブロック風の情報
    const infoBlock = `\`\`\`
ユーザー名: ${member.user.tag}
ユーザーID: ${member.id}
GUILD名: ${member.guild.name}
\`\`\``;

    // Embed作成
    const embed = new EmbedBuilder()
      .setColor(0x00AE86)
      .setDescription(infoBlock)
      .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
      .setTimestamp();

    // メッセージ送信
    await channel.send({
      content: `ようこそ\n<@${member.id}>`,
      embeds: [embed]
    });
  }
};
