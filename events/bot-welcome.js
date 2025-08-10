import { Events, EmbedBuilder } from 'discord.js';

export default {
  name: Events.GuildCreate,
  once: false,
  async execute(guild) {
    try {
      let inviter = null;
      try {
        const auditLogs = await guild.fetchAuditLogs({
          limit: 1,
          type: 28 // BOT_ADD
        });
        const log = auditLogs.entries.first();
        inviter = log?.executor || null;
      } catch (err) {
        console.warn(`監査ログ取得失敗: ${err}`);
      }

      const embed = new EmbedBuilder()
        .setColor('Random')
        .setTitle(`📥 ${guild.client.user.username} を導入いただきありがとうございます！`)
        .setDescription(
          `${guild.client.user.username} を **${guild.name}** に導入していただきありがとうございます！\n\n` +
          `📖 BOTの利用規約やコマンド説明はこちらをご覧ください：\n` +
          `[利用案内ページ](https://toganedev.github.io/Togane-Bot-Web/)\n\n` +
          `💬 サポートサーバーはこちら：\n` +
          `[参加する](https://discord.gg/aJ2zgdUzg7)`
        )
        .setFooter({ text: `サーバーID: ${guild.id}` })
        .setTimestamp();

      if (inviter) {
        await inviter.send({ embeds: [embed] }).catch(() => {
          console.warn(`ユーザー ${inviter.tag} にDMを送れませんでした`);
        });
      } else {
        console.warn(`追加ユーザーが特定できませんでした`);
      }
    } catch (error) {
      console.error(`bot-welcome.js エラー:`, error);
    }
  }
};
